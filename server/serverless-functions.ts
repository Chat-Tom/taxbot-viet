/**
 * TaxBot Vietnam - Serverless Functions for Tax Automation
 * Các function xử lý nghiệp vụ thuế tự động
 */

import { etaxService, digitalSignatureStorage } from './etax-integration';
import { pushNotificationService } from './push-notifications';
import { sendEmail } from './email-service';
import { jsonStorage } from './json-storage';

// Interface cho kết quả xử lý
interface ProcessingResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

// Interface cho tax automation task
interface TaxAutomationTask {
  id: string;
  customerId: string;
  taskType: 'declaration' | 'payment' | 'reminder' | 'check_status';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledAt: string;
  executedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  retryCount: number;
  maxRetries: number;
  data: any;
  result?: ProcessingResult;
}

// Queue cho các tasks
class TaskQueue {
  private tasks: TaxAutomationTask[] = [];
  private processing = false;

  addTask(task: TaxAutomationTask): void {
    this.tasks.push(task);
    this.tasks.sort((a, b) => {
      // Sắp xếp theo priority và thời gian
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });
  }

  getNextTask(): TaxAutomationTask | null {
    return this.tasks.find(task => 
      task.status === 'pending' && 
      new Date(task.scheduledAt) <= new Date()
    ) || null;
  }

  updateTask(taskId: string, updates: Partial<TaxAutomationTask>): void {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
    }
  }

  getTasks(status?: string): TaxAutomationTask[] {
    return status ? this.tasks.filter(t => t.status === status) : this.tasks;
  }

  getTaskStats(): any {
    return {
      total: this.tasks.length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      processing: this.tasks.filter(t => t.status === 'processing').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      failed: this.tasks.filter(t => t.status === 'failed').length
    };
  }
}

export class ServerlessTaxProcessor {
  private taskQueue = new TaskQueue();
  private isRunning = false;

  constructor() {
    this.startProcessor();
  }

  /**
   * Khởi động bộ xử lý tasks
   */
  private startProcessor(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Serverless tax processor started');
    
    // Xử lý tasks mỗi 30 giây
    setInterval(async () => {
      await this.processNextTask();
    }, 30000);
  }

  /**
   * Xử lý task tiếp theo trong queue
   */
  private async processNextTask(): Promise<void> {
    const task = this.taskQueue.getNextTask();
    if (!task) return;

    console.log(`⚡ Processing task: ${task.id} - ${task.taskType}`);
    
    this.taskQueue.updateTask(task.id, {
      status: 'processing',
      executedAt: new Date().toISOString()
    });

    try {
      let result: ProcessingResult;

      switch (task.taskType) {
        case 'declaration':
          result = await this.processDeclaration(task);
          break;
        case 'payment':
          result = await this.processPayment(task);
          break;
        case 'reminder':
          result = await this.processReminder(task);
          break;
        case 'check_status':
          result = await this.checkStatus(task);
          break;
        default:
          result = {
            success: false,
            message: `Unknown task type: ${task.taskType}`
          };
      }

      this.taskQueue.updateTask(task.id, {
        status: result.success ? 'completed' : 'failed',
        result
      });

      if (!result.success && task.retryCount < task.maxRetries) {
        // Retry task
        this.taskQueue.updateTask(task.id, {
          status: 'pending',
          retryCount: task.retryCount + 1,
          scheduledAt: new Date(Date.now() + 60000 * Math.pow(2, task.retryCount)).toISOString() // Exponential backoff
        });
      }

      console.log(`✅ Task ${task.id} ${result.success ? 'completed' : 'failed'}: ${result.message}`);

    } catch (error) {
      console.error(`❌ Task ${task.id} error:`, error);
      
      this.taskQueue.updateTask(task.id, {
        status: 'failed',
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  /**
   * Xử lý nộp khai báo thuế tự động
   */
  private async processDeclaration(task: TaxAutomationTask): Promise<ProcessingResult> {
    try {
      const { customerId, declarationData, documents } = task.data;
      
      // Lấy chữ ký số
      const signature = await digitalSignatureStorage.getSignature(customerId);
      if (!signature) {
        return {
          success: false,
          message: 'Không tìm thấy chữ ký số của khách hàng'
        };
      }

      // Xác thực với eTax
      const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
      
      // Nộp khai báo
      const declaration = await etaxService.submitTaxDeclaration(
        customerId,
        declarationData,
        documents,
        signature,
        accessToken
      );

      // Gửi thông báo thành công
      await pushNotificationService.sendSuccessNotification(
        customerId,
        `Đã nộp khai báo thuế thành công - Mã: ${declaration.declarationId}`
      );

      // Gửi email xác nhận
      await this.sendDeclarationConfirmationEmail(customerId, declaration);

      return {
        success: true,
        message: 'Nộp khai báo thuế thành công',
        data: { declarationId: declaration.declarationId }
      };

    } catch (error) {
      await pushNotificationService.sendErrorNotification(
        task.customerId,
        'Nộp khai báo thuế không thành công'
      );

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi nộp khai báo'
      };
    }
  }

  /**
   * Xử lý thanh toán thuế tự động
   */
  private async processPayment(task: TaxAutomationTask): Promise<ProcessingResult> {
    try {
      const { customerId, paymentData } = task.data;
      
      // Lấy chữ ký số
      const signature = await digitalSignatureStorage.getSignature(customerId);
      if (!signature) {
        return {
          success: false,
          message: 'Không tìm thấy chữ ký số của khách hàng'
        };
      }

      // Xác thực với eTax
      const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
      
      // Lấy thông tin thuế cần nộp
      const personalInfo = await etaxService.getPersonalTaxInfo(customerId, accessToken);
      
      if (personalInfo.remainingAmount <= 0) {
        return {
          success: true,
          message: 'Không có khoản thuế nào cần thanh toán'
        };
      }

      // Thực hiện thanh toán (giả lập)
      // Trong thực tế sẽ tích hợp với cổng thanh toán
      await this.simulatePayment(customerId, personalInfo.remainingAmount);

      // Gửi thông báo thành công
      await pushNotificationService.sendSuccessNotification(
        customerId,
        `Đã thanh toán thuế thành công - Số tiền: ${personalInfo.remainingAmount.toLocaleString('vi-VN')} VND`
      );

      return {
        success: true,
        message: 'Thanh toán thuế thành công',
        data: { amount: personalInfo.remainingAmount }
      };

    } catch (error) {
      await pushNotificationService.sendErrorNotification(
        task.customerId,
        'Thanh toán thuế không thành công'
      );

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi thanh toán'
      };
    }
  }

  /**
   * Xử lý gửi nhắc nhở
   */
  private async processReminder(task: TaxAutomationTask): Promise<ProcessingResult> {
    try {
      const { customerId, reminderType, message } = task.data;
      
      // Gửi push notification
      const pushSent = await pushNotificationService.sendTaxReminder(
        customerId,
        reminderType,
        message
      );

      // Gửi email backup nếu push notification thất bại
      if (!pushSent) {
        const customer = await this.getCustomerInfo(customerId);
        if (customer?.email) {
          await sendEmail({
            to: customer.email,
            from: 'noreply@taxbot.vn',
            subject: '🔔 Nhắc nhở nộp thuế - TaxBot Vietnam',
            html: `
              <h2>Nhắc nhở nộp thuế</h2>
              <p>Chào ${customer.firstName} ${customer.lastName},</p>
              <p>${message}</p>
              <p>Trân trọng,<br>Đội ngũ TaxBot Vietnam</p>
            `
          });
        }
      }

      return {
        success: true,
        message: 'Gửi nhắc nhở thành công'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi gửi nhắc nhở'
      };
    }
  }

  /**
   * Kiểm tra trạng thái xử lý
   */
  private async checkStatus(task: TaxAutomationTask): Promise<ProcessingResult> {
    try {
      const { customerId, declarationId } = task.data;
      
      // Lấy chữ ký số
      const signature = await digitalSignatureStorage.getSignature(customerId);
      if (!signature) {
        return {
          success: false,
          message: 'Không tìm thấy chữ ký số của khách hàng'
        };
      }

      // Xác thực với eTax
      const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
      
      // Kiểm tra trạng thái khai báo
      const declaration = await etaxService.checkDeclarationStatus(declarationId, accessToken);
      
      // Gửi thông báo cập nhật trạng thái
      let notificationMessage = '';
      switch (declaration.status) {
        case 'approved':
          notificationMessage = 'Khai báo thuế đã được duyệt';
          break;
        case 'rejected':
          notificationMessage = 'Khai báo thuế bị từ chối';
          break;
        case 'processing':
          notificationMessage = 'Khai báo thuế đang được xử lý';
          break;
      }

      if (notificationMessage) {
        await pushNotificationService.sendToUser(customerId, {
          title: '📋 Cập nhật trạng thái khai báo',
          body: notificationMessage,
          data: { declarationId, status: declaration.status }
        });
      }

      return {
        success: true,
        message: 'Kiểm tra trạng thái thành công',
        data: { status: declaration.status }
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Lỗi kiểm tra trạng thái'
      };
    }
  }

  /**
   * Giả lập thanh toán
   */
  private async simulatePayment(customerId: string, amount: number): Promise<void> {
    // Trong thực tế sẽ tích hợp với ngân hàng/cổng thanh toán
    console.log(`💳 Simulated payment: ${customerId} - ${amount.toLocaleString('vi-VN')} VND`);
    
    // Giả lập delay xử lý
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Lấy thông tin khách hàng
   */
  private async getCustomerInfo(customerId: string): Promise<any> {
    const submissions = await jsonStorage.getSubmissions();
    return submissions.find(s => s.id === customerId);
  }

  /**
   * Gửi email xác nhận khai báo
   */
  private async sendDeclarationConfirmationEmail(customerId: string, declaration: any): Promise<void> {
    const customer = await this.getCustomerInfo(customerId);
    if (!customer?.email) return;

    await sendEmail({
      to: customer.email,
      from: 'noreply@taxbot.vn',
      subject: '✅ Xác nhận nộp khai báo thuế thành công',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">✅ Nộp khai báo thuế thành công</h2>
          <p>Chào ${customer.firstName} ${customer.lastName},</p>
          
          <p>Khai báo thuế của bạn đã được nộp thành công:</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Mã khai báo:</strong> ${declaration.declarationId}</p>
            <p><strong>Loại khai báo:</strong> ${declaration.declarationType}</p>
            <p><strong>Kỳ thuế:</strong> ${declaration.taxPeriod}</p>
            <p><strong>Ngày nộp:</strong> ${new Date(declaration.submissionDate).toLocaleDateString('vi-VN')}</p>
          </div>
          
          <p>TaxBot Vietnam sẽ tiếp tục theo dõi và thông báo cho bạn về trạng thái xử lý.</p>
          
          <p>Trân trọng,<br>Đội ngũ TaxBot Vietnam</p>
        </div>
      `
    });
  }

  /**
   * API Methods
   */

  /**
   * Thêm task mới
   */
  addTask(task: Omit<TaxAutomationTask, 'id' | 'status' | 'retryCount'>): string {
    const fullTask: TaxAutomationTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      retryCount: 0
    };

    this.taskQueue.addTask(fullTask);
    console.log(`📝 Added new task: ${fullTask.id} - ${fullTask.taskType}`);
    
    return fullTask.id;
  }

  /**
   * Lên lịch nộp khai báo tự động
   */
  scheduleDeclaration(customerId: string, declarationData: any, documents: Buffer[], scheduledAt: Date): string {
    return this.addTask({
      customerId,
      taskType: 'declaration',
      priority: 'high',
      scheduledAt: scheduledAt.toISOString(),
      maxRetries: 3,
      data: { customerId, declarationData, documents }
    });
  }

  /**
   * Lên lịch thanh toán tự động
   */
  schedulePayment(customerId: string, paymentData: any, scheduledAt: Date): string {
    return this.addTask({
      customerId,
      taskType: 'payment',
      priority: 'high',
      scheduledAt: scheduledAt.toISOString(),
      maxRetries: 3,
      data: { customerId, paymentData }
    });
  }

  /**
   * Lên lịch nhắc nhở
   */
  scheduleReminder(customerId: string, reminderType: string, message: string, scheduledAt: Date): string {
    return this.addTask({
      customerId,
      taskType: 'reminder',
      priority: 'medium',
      scheduledAt: scheduledAt.toISOString(),
      maxRetries: 2,
      data: { customerId, reminderType, message }
    });
  }

  /**
   * Lên lịch kiểm tra trạng thái
   */
  scheduleStatusCheck(customerId: string, declarationId: string, scheduledAt: Date): string {
    return this.addTask({
      customerId,
      taskType: 'check_status',
      priority: 'low',
      scheduledAt: scheduledAt.toISOString(),
      maxRetries: 5,
      data: { customerId, declarationId }
    });
  }

  /**
   * Lấy thống kê
   */
  getStats(): any {
    return this.taskQueue.getTaskStats();
  }

  /**
   * Lấy danh sách tasks
   */
  getTasks(status?: string): TaxAutomationTask[] {
    return this.taskQueue.getTasks(status);
  }
}

// Singleton instance
export const serverlessTaxProcessor = new ServerlessTaxProcessor();