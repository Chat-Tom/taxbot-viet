/**
 * TaxBot Vietnam - Tax Reminder Scheduler
 * Hệ thống nhắc nhở nộp thuế tự động theo lịch Việt Nam
 */

import cron from 'node-cron';
import { etaxService, digitalSignatureStorage } from './etax-integration';
import { sendEmail } from './email-service';
import { jsonStorage } from './json-storage';

// Interface cho lịch thuế
interface TaxSchedule {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  dueDate: string;
  taxType: 'monthly' | 'quarterly' | 'annual';
  isActive: boolean;
}

// Interface cho thông báo thuế
interface TaxNotification {
  id: string;
  customerId: string;
  scheduleId: string;
  message: string;
  type: 'reminder' | 'warning' | 'overdue';
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
}

// Lịch thuế Việt Nam
const TAX_SCHEDULES: TaxSchedule[] = [
  {
    id: 'monthly_personal',
    name: 'Thuế thu nhập cá nhân hàng tháng',
    description: 'Nộp thuế TNCN hàng tháng trước ngày 20',
    cronExpression: '0 9 20 * *', // 9:00 AM ngày 20 mỗi tháng
    dueDate: '20',
    taxType: 'monthly',
    isActive: true
  },
  {
    id: 'quarterly_vat',
    name: 'Thuế GTGT theo quý',
    description: 'Nộp thuế GTGT theo quý trước ngày 30',
    cronExpression: '0 9 30 1,4,7,10 *', // 9:00 AM ngày 30 tháng 1,4,7,10 (đầu quý)
    dueDate: '30',
    taxType: 'quarterly',
    isActive: true
  },
  {
    id: 'annual_finalization',
    name: 'Quyết toán thuế TNCN',
    description: 'Quyết toán thuế TNCN trước ngày 30/3',
    cronExpression: '0 9 30 3 *', // 9:00 AM ngày 30/3 hàng năm
    dueDate: '30/3',
    taxType: 'annual',
    isActive: true
  },
  {
    id: 'annual_declaration',
    name: 'Khai báo thuế TNCN năm',
    description: 'Khai báo thuế TNCN năm trước ngày 30/4',
    cronExpression: '0 9 30 4 *', // 9:00 AM ngày 30/4 hàng năm
    dueDate: '30/4',
    taxType: 'annual',
    isActive: true
  },
  {
    id: 'provisional_tax',
    name: 'Thuế tạm tính cuối năm',
    description: 'Nộp thuế tạm tính cuối năm trước ngày 15/12',
    cronExpression: '0 9 15 12 *', // 9:00 AM ngày 15/12 hàng năm
    dueDate: '15/12',
    taxType: 'annual',
    isActive: true
  }
];

export class TaxSchedulerService {
  private notifications: TaxNotification[] = [];
  private scheduledJobs: Map<string, any> = new Map();

  constructor() {
    this.initializeSchedules();
  }

  /**
   * Khởi tạo tất cả lịch thuế
   */
  private initializeSchedules(): void {
    TAX_SCHEDULES.forEach(schedule => {
      if (schedule.isActive) {
        this.scheduleJob(schedule);
      }
    });
    
    // Khởi tạo job kiểm tra hàng ngày
    this.scheduleDailyCheck();
    
    console.log('📅 Tax scheduler initialized with', TAX_SCHEDULES.length, 'schedules');
  }

  /**
   * Lên lịch công việc cho một loại thuế
   */
  private scheduleJob(schedule: TaxSchedule): void {
    const job = cron.schedule(schedule.cronExpression, async () => {
      await this.handleTaxReminder(schedule);
    }, {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh'
    });

    this.scheduledJobs.set(schedule.id, job);
    console.log(`📅 Scheduled job: ${schedule.name} - ${schedule.cronExpression}`);
  }

  /**
   * Kiểm tra hàng ngày cho các trường hợp đặc biệt
   */
  private scheduleDailyCheck(): void {
    // Chạy lúc 8:00 AM mỗi ngày
    cron.schedule('0 8 * * *', async () => {
      await this.checkUpcomingDeadlines();
      await this.checkOverdueDeclarations();
      await this.checkElectronicInvoices();
    }, {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh'
    });

    console.log('📅 Daily check scheduled at 8:00 AM');
  }

  /**
   * Xử lý nhắc nhở thuế
   */
  private async handleTaxReminder(schedule: TaxSchedule): Promise<void> {
    try {
      console.log(`🔔 Processing tax reminder: ${schedule.name}`);
      
      // Lấy danh sách khách hàng
      const customers = await jsonStorage.getSubmissions();
      
      for (const customer of customers) {
        // Kiểm tra có chữ ký số không
        const hasSignature = await digitalSignatureStorage.isSignatureValid(customer.id);
        
        if (hasSignature) {
          // Gửi thông báo tự động
          await this.sendTaxReminder(customer, schedule);
        } else {
          // Gửi thông báo yêu cầu chữ ký số
          await this.sendSignatureRequest(customer, schedule);
        }
      }
      
      console.log(`✅ Tax reminder processed for ${customers.length} customers`);
    } catch (error) {
      console.error(`❌ Failed to process tax reminder: ${schedule.name}`, error);
    }
  }

  /**
   * Gửi thông báo nhắc thuế
   */
  private async sendTaxReminder(customer: any, schedule: TaxSchedule): Promise<void> {
    const notification: TaxNotification = {
      id: `${customer.id}_${schedule.id}_${Date.now()}`,
      customerId: customer.id,
      scheduleId: schedule.id,
      message: `Nhắc nhở: ${schedule.name} - Hạn nộp: ${schedule.dueDate}`,
      type: 'reminder',
      sentAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      // Gửi email
      const emailSent = await sendEmail({
        to: customer.email,
        from: 'noreply@taxbot.vn',
        subject: `🔔 Nhắc nhở nộp thuế - ${schedule.name}`,
        html: this.generateReminderEmail(customer, schedule)
      });

      notification.status = emailSent ? 'sent' : 'failed';
      this.notifications.push(notification);

      console.log(`📧 Tax reminder sent to ${customer.email}: ${schedule.name}`);
    } catch (error) {
      notification.status = 'failed';
      this.notifications.push(notification);
      console.error(`❌ Failed to send tax reminder to ${customer.email}:`, error);
    }
  }

  /**
   * Gửi yêu cầu chữ ký số
   */
  private async sendSignatureRequest(customer: any, schedule: TaxSchedule): Promise<void> {
    try {
      const emailSent = await sendEmail({
        to: customer.email,
        from: 'noreply@taxbot.vn',
        subject: '🔑 Yêu cầu cập nhật chữ ký số - TaxBot Vietnam',
        html: this.generateSignatureRequestEmail(customer, schedule)
      });

      console.log(`🔑 Signature request sent to ${customer.email}`);
    } catch (error) {
      console.error(`❌ Failed to send signature request to ${customer.email}:`, error);
    }
  }

  /**
   * Kiểm tra hạn nộp thuế sắp tới
   */
  private async checkUpcomingDeadlines(): Promise<void> {
    try {
      const customers = await jsonStorage.getSubmissions();
      
      for (const customer of customers) {
        const signature = await digitalSignatureStorage.getSignature(customer.id);
        
        if (signature) {
          // Lấy thông tin hạn nộp từ eTax
          const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
          const deadlines = await etaxService.getTaxDeadlines(customer.id, accessToken);
          
          // Kiểm tra các hạn nộp trong 7 ngày tới
          const upcomingDeadlines = deadlines.filter(deadline => {
            const dueDate = new Date(deadline.dueDate);
            const now = new Date();
            const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff > 0 && daysDiff <= 7;
          });
          
          if (upcomingDeadlines.length > 0) {
            await this.sendUpcomingDeadlineNotification(customer, upcomingDeadlines);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to check upcoming deadlines:', error);
    }
  }

  /**
   * Kiểm tra các khai báo quá hạn
   */
  private async checkOverdueDeclarations(): Promise<void> {
    try {
      const customers = await jsonStorage.getSubmissions();
      
      for (const customer of customers) {
        const signature = await digitalSignatureStorage.getSignature(customer.id);
        
        if (signature) {
          const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
          const personalInfo = await etaxService.getPersonalTaxInfo(customer.id, accessToken);
          
          if (personalInfo.remainingAmount > 0) {
            await this.sendOverdueNotification(customer, personalInfo);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to check overdue declarations:', error);
    }
  }

  /**
   * Kiểm tra hóa đơn điện tử
   */
  private async checkElectronicInvoices(): Promise<void> {
    try {
      const customers = await jsonStorage.getSubmissions();
      
      for (const customer of customers) {
        const signature = await digitalSignatureStorage.getSignature(customer.id);
        
        if (signature) {
          const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
          const invoices = await etaxService.getElectronicInvoices(customer.id, accessToken);
          
          // Kiểm tra hóa đơn có vấn đề
          const problematicInvoices = invoices.filter(invoice => 
            invoice.status === 'rejected' || invoice.status === 'warning'
          );
          
          if (problematicInvoices.length > 0) {
            await this.sendInvoiceWarning(customer, problematicInvoices);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to check electronic invoices:', error);
    }
  }

  /**
   * Gửi thông báo hạn nộp sắp tới
   */
  private async sendUpcomingDeadlineNotification(customer: any, deadlines: any[]): Promise<void> {
    try {
      await sendEmail({
        to: customer.email,
        from: 'noreply@taxbot.vn',
        subject: '⚠️ Thông báo hạn nộp thuế sắp tới',
        html: this.generateUpcomingDeadlineEmail(customer, deadlines)
      });
    } catch (error) {
      console.error('❌ Failed to send upcoming deadline notification:', error);
    }
  }

  /**
   * Gửi thông báo quá hạn
   */
  private async sendOverdueNotification(customer: any, personalInfo: any): Promise<void> {
    try {
      await sendEmail({
        to: customer.email,
        from: 'noreply@taxbot.vn',
        subject: '🚨 Thông báo quá hạn nộp thuế',
        html: this.generateOverdueEmail(customer, personalInfo)
      });
    } catch (error) {
      console.error('❌ Failed to send overdue notification:', error);
    }
  }

  /**
   * Gửi cảnh báo hóa đơn
   */
  private async sendInvoiceWarning(customer: any, invoices: any[]): Promise<void> {
    try {
      await sendEmail({
        to: customer.email,
        from: 'noreply@taxbot.vn',
        subject: '⚠️ Cảnh báo hóa đơn điện tử',
        html: this.generateInvoiceWarningEmail(customer, invoices)
      });
    } catch (error) {
      console.error('❌ Failed to send invoice warning:', error);
    }
  }

  /**
   * Tạo email nhắc thuế
   */
  private generateReminderEmail(customer: any, schedule: TaxSchedule): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #da020e;">🔔 Nhắc nhở nộp thuế</h2>
        <p>Chào ${customer.firstName} ${customer.lastName},</p>
        
        <p><strong>${schedule.name}</strong> sắp đến hạn nộp.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Hạn nộp:</strong> ${schedule.dueDate}</p>
          <p><strong>Loại thuế:</strong> ${schedule.description}</p>
        </div>
        
        <p>TaxBot Vietnam sẽ tự động xử lý việc nộp thuế cho bạn nếu bạn đã cập nhật chữ ký số.</p>
        
        <p>Trân trọng,<br>Đội ngũ TaxBot Vietnam</p>
      </div>
    `;
  }

  /**
   * Tạo email yêu cầu chữ ký số
   */
  private generateSignatureRequestEmail(customer: any, schedule: TaxSchedule): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #da020e;">🔑 Yêu cầu cập nhật chữ ký số</h2>
        <p>Chào ${customer.firstName} ${customer.lastName},</p>
        
        <p><strong>${schedule.name}</strong> sắp đến hạn nộp, nhưng chúng tôi chưa có chữ ký số của bạn.</p>
        
        <p>Để TaxBot Vietnam có thể tự động nộp thuế giúp bạn, vui lòng cập nhật chữ ký số điện tử.</p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Lưu ý:</strong> Chữ ký số cần thiết để xác thực và nộp hồ sơ thuế điện tử.</p>
        </div>
        
        <p>Liên hệ với chúng tôi để được hỗ trợ cập nhật chữ ký số.</p>
        
        <p>Trân trọng,<br>Đội ngũ TaxBot Vietnam</p>
      </div>
    `;
  }

  /**
   * Tạo email thông báo hạn nộp sắp tới
   */
  private generateUpcomingDeadlineEmail(customer: any, deadlines: any[]): string {
    const deadlineList = deadlines.map(d => 
      `<li>${d.taxType}: ${new Date(d.dueDate).toLocaleDateString('vi-VN')}</li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #da020e;">⚠️ Thông báo hạn nộp thuế sắp tới</h2>
        <p>Chào ${customer.firstName} ${customer.lastName},</p>
        
        <p>Các hạn nộp thuế sắp tới trong 7 ngày:</p>
        
        <ul style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
          ${deadlineList}
        </ul>
        
        <p>TaxBot Vietnam sẽ tự động xử lý việc nộp thuế cho bạn.</p>
        
        <p>Trân trọng,<br>Đội ngũ TaxBot Vietnam</p>
      </div>
    `;
  }

  /**
   * Tạo email thông báo quá hạn
   */
  private generateOverdueEmail(customer: any, personalInfo: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">🚨 Thông báo quá hạn nộp thuế</h2>
        <p>Chào ${customer.firstName} ${customer.lastName},</p>
        
        <p><strong>Bạn có khoản thuế chưa nộp:</strong></p>
        
        <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <p><strong>Số tiền:</strong> ${personalInfo.remainingAmount.toLocaleString('vi-VN')} VND</p>
          <p><strong>Phạt chậm nộp:</strong> ${personalInfo.penalties?.toLocaleString('vi-VN') || 0} VND</p>
        </div>
        
        <p>Vui lòng liên hệ với chúng tôi để được hỗ trợ xử lý.</p>
        
        <p>Trân trọng,<br>Đội ngũ TaxBot Vietnam</p>
      </div>
    `;
  }

  /**
   * Tạo email cảnh báo hóa đơn
   */
  private generateInvoiceWarningEmail(customer: any, invoices: any[]): string {
    const invoiceList = invoices.map(inv => 
      `<li>Hóa đơn ${inv.invoiceNumber}: ${inv.status}</li>`
    ).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">⚠️ Cảnh báo hóa đơn điện tử</h2>
        <p>Chào ${customer.firstName} ${customer.lastName},</p>
        
        <p>Có hóa đơn điện tử cần xem xét:</p>
        
        <ul style="background: #fff3cd; padding: 15px; border-radius: 5px;">
          ${invoiceList}
        </ul>
        
        <p>Vui lòng kiểm tra và xử lý các hóa đơn có vấn đề.</p>
        
        <p>Trân trọng,<br>Đội ngũ TaxBot Vietnam</p>
      </div>
    `;
  }

  /**
   * Lấy thống kê thông báo
   */
  getNotificationStats(): any {
    return {
      total: this.notifications.length,
      sent: this.notifications.filter(n => n.status === 'sent').length,
      failed: this.notifications.filter(n => n.status === 'failed').length,
      pending: this.notifications.filter(n => n.status === 'pending').length
    };
  }

  /**
   * Lấy danh sách lịch thuế
   */
  getSchedules(): TaxSchedule[] {
    return TAX_SCHEDULES;
  }
}

// Singleton instance
export const taxScheduler = new TaxSchedulerService();