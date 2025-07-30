import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CustomerSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessType: string;
  registrationSource?: string;
  hashedPassword?: string; // Store hashed password for customer accounts
  utm?: any;
  status: string;
  zapierSent: boolean;
  zapierSentAt?: string;
  emailSent: boolean;
  emailSentAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AIChat {
  id: string;
  customerId: string;
  question: string;
  answer: string;
  category: string;
  helpful: boolean | null;
  createdAt: string;
}

interface SubmissionsData {
  submissions: CustomerSubmission[];
  aiChats: AIChat[];
  lastCleanup: string;
}

export class JsonStorage {
  private filePath: string;
  private readonly RETENTION_DAYS = 30;

  constructor() {
    // Lưu file submissions.json trong thư mục gốc của project
    this.filePath = path.join(__dirname, '..', 'submissions.json');
  }

  // Đọc dữ liệu từ file JSON
  private async readData(): Promise<SubmissionsData> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Nếu file không tồn tại, tạo dữ liệu mặc định
      const defaultData: SubmissionsData = {
        submissions: [],
        aiChats: [],
        lastCleanup: new Date().toISOString()
      };
      await this.writeData(defaultData);
      return defaultData;
    }
  }

  // Ghi dữ liệu vào file JSON
  private async writeData(data: SubmissionsData): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Tự động xóa dữ liệu cũ hơn 30 ngày
  private async cleanupOldData(): Promise<void> {
    const data = await this.readData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    const initialSubmissionsCount = data.submissions.length;
    const initialChatsCount = data.aiChats ? data.aiChats.length : 0;
    
    // Lọc bỏ các submission cũ hơn 30 ngày
    data.submissions = data.submissions.filter(submission => {
      const submissionDate = new Date(submission.createdAt);
      return submissionDate > cutoffDate;
    });

    // Lọc bỏ các AI chat cũ hơn 30 ngày
    if (!data.aiChats) {
      data.aiChats = [];
    }
    data.aiChats = data.aiChats.filter(chat => {
      const chatDate = new Date(chat.createdAt);
      return chatDate > cutoffDate;
    });

    const removedSubmissionsCount = initialSubmissionsCount - data.submissions.length;
    const removedChatsCount = initialChatsCount - data.aiChats.length;
    
    if (removedSubmissionsCount > 0) {
      console.log(`🗑️ Đã xóa ${removedSubmissionsCount} submission cũ hơn ${this.RETENTION_DAYS} ngày`);
    }
    
    if (removedChatsCount > 0) {
      console.log(`🗑️ Đã xóa ${removedChatsCount} chat AI cũ hơn ${this.RETENTION_DAYS} ngày`);
    }

    // Cập nhật thời gian cleanup cuối cùng
    data.lastCleanup = new Date().toISOString();
    await this.writeData(data);
  }

  // Tạo ID duy nhất cho submission
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Thêm submission mới
  async createSubmission(submissionData: Omit<CustomerSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'zapierSent' | 'emailSent'>): Promise<CustomerSubmission> {
    // Tự động cleanup dữ liệu cũ trước khi thêm mới
    await this.cleanupOldData();

    const data = await this.readData();
    
    const newSubmission: CustomerSubmission = {
      id: this.generateId(),
      ...submissionData,
      status: 'new',
      zapierSent: false,
      emailSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.submissions.push(newSubmission);
    await this.writeData(data);

    console.log(`✅ Đã lưu đăng ký mới: ${newSubmission.firstName} ${newSubmission.lastName} - ${newSubmission.businessType}`);
    
    return newSubmission;
  }

  // Lấy tất cả submissions
  async getSubmissions(): Promise<CustomerSubmission[]> {
    // Cleanup trước khi lấy dữ liệu
    await this.cleanupOldData();
    
    const data = await this.readData();
    return data.submissions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Lấy submission theo ID
  async getSubmission(id: string): Promise<CustomerSubmission | undefined> {
    const data = await this.readData();
    return data.submissions.find(submission => submission.id === id);
  }

  // Cập nhật submission
  async updateSubmission(id: string, updates: Partial<CustomerSubmission>): Promise<CustomerSubmission | undefined> {
    const data = await this.readData();
    const index = data.submissions.findIndex(submission => submission.id === id);
    
    if (index === -1) {
      return undefined;
    }

    data.submissions[index] = {
      ...data.submissions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.writeData(data);
    return data.submissions[index];
  }

  // Lấy submissions theo trạng thái
  async getSubmissionsByStatus(status: string): Promise<CustomerSubmission[]> {
    const submissions = await this.getSubmissions();
    return submissions.filter(submission => submission.status === status);
  }

  // Đánh dấu đã gửi Zapier
  async markZapierSent(id: string): Promise<void> {
    await this.updateSubmission(id, {
      zapierSent: true,
      zapierSentAt: new Date().toISOString()
    });
  }

  // Đánh dấu đã gửi email
  async markEmailSent(id: string): Promise<void> {
    await this.updateSubmission(id, {
      emailSent: true,
      emailSentAt: new Date().toISOString()
    });
  }

  // Lấy thống kê
  async getAnalytics(): Promise<any> {
    const submissions = await this.getSubmissions();
    const allChats = await this.getAllAIChats();
    
    return {
      total: submissions.length,
      byStatus: {
        new: submissions.filter(s => s.status === 'new').length,
        contacted: submissions.filter(s => s.status === 'contacted').length,
        active: submissions.filter(s => s.status === 'active').length,
        inactive: submissions.filter(s => s.status === 'inactive').length,
      },
      byBusinessType: {
        individual: submissions.filter(s => s.businessType === 'individual').length,
        supersaver: submissions.filter(s => s.businessType === 'supersaver').length,
        custom: submissions.filter(s => s.businessType === 'custom').length,
      },
      integrationStats: {
        zapierSent: submissions.filter(s => s.zapierSent).length,
        emailSent: submissions.filter(s => s.emailSent).length,
      },
      aiChatStats: {
        totalChats: allChats.length,
        uniqueCustomers: [...new Set(allChats.map(chat => chat.customerId))].length,
        helpfulChats: allChats.filter(chat => chat.helpful === true).length,
        recentChats: allChats.slice(0, 10).map(chat => ({
          question: chat.question.substring(0, 100) + '...',
          category: chat.category,
          createdAt: chat.createdAt
        }))
      },
      recentSubmissions: submissions.slice(0, 10),
      retentionInfo: {
        retentionDays: this.RETENTION_DAYS,
        oldestRecord: submissions.length > 0 ? submissions[submissions.length - 1].createdAt : null,
        totalRecords: submissions.length,
        totalAIChats: allChats.length,
        oldestChat: allChats.length > 0 ? allChats[allChats.length - 1].createdAt : null
      }
    };
  }

  // Cleanup thủ công - có thể gọi từ API
  async manualCleanup(): Promise<{ removedCount: number; remainingCount: number }> {
    const beforeData = await this.readData();
    const beforeCount = beforeData.submissions.length;
    
    await this.cleanupOldData();
    
    const afterData = await this.readData();
    const afterCount = afterData.submissions.length;
    
    return {
      removedCount: beforeCount - afterCount,
      remainingCount: afterCount
    };
  }

  // Update customer password after reset
  async updateCustomerPassword(email: string, hashedPassword: string): Promise<boolean> {
    try {
      const data = await this.readData();
      const customer = data.submissions.find(sub => sub.email === email);
      
      if (!customer) {
        console.log(`Customer not found for email: ${email}`);
        return false;
      }

      // Update customer with new hashed password
      customer.hashedPassword = hashedPassword;
      customer.updatedAt = new Date().toISOString();
      
      await this.writeData(data);
      
      console.log(`✅ Updated password for customer: ${email}`);
      return true;
    } catch (error) {
      console.error('Error updating customer password:', error);
      return false;
    }
  }

  // AI Chat Methods
  async saveAIChat(chat: AIChat): Promise<boolean> {
    try {
      // Tự động cleanup dữ liệu cũ trước khi thêm AI chat mới
      await this.cleanupOldData();
      
      const data = await this.readData();
      if (!data.aiChats) {
        data.aiChats = [];
      }
      data.aiChats.push(chat);
      await this.writeData(data);
      
      console.log(`💾 Đã lưu AI chat: ${chat.question.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('Error saving AI chat:', error);
      return false;
    }
  }

  async getAIChats(customerId: string): Promise<AIChat[]> {
    try {
      const data = await this.readData();
      if (!data.aiChats) {
        return [];
      }
      return data.aiChats.filter(chat => chat.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting AI chats:', error);
      return [];
    }
  }

  async getAllAIChats(): Promise<AIChat[]> {
    try {
      const data = await this.readData();
      if (!data.aiChats) {
        return [];
      }
      return data.aiChats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting all AI chats:', error);
      return [];
    }
  }
}

// Export singleton instance
export const jsonStorage = new JsonStorage();