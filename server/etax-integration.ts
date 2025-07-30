/**
 * TaxBot Vietnam - eTax API Integration
 * Tích hợp API eTax của Tổng cục Thuế Việt Nam
 */

import axios from 'axios';

// eTax API Configuration
const ETAX_CONFIG = {
  baseURL: process.env.ETAX_API_URL || 'https://etax.gdt.gov.vn/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'TaxBot-Vietnam/1.0'
  }
};

// Interface cho dữ liệu cá nhân từ eTax
interface PersonalTaxInfo {
  taxpayerCode: string;
  fullName: string;
  idNumber: string;
  address: string;
  taxPeriod: string;
  declarationStatus: string;
  paymentStatus: string;
  dueDate: string;
  totalTaxAmount: number;
  paidAmount: number;
  remainingAmount: number;
  penalties?: number;
}

// Interface cho hồ sơ nộp thuế
interface TaxDeclaration {
  declarationId: string;
  taxpayerCode: string;
  declarationType: string;
  taxPeriod: string;
  submissionDate: string;
  status: 'submitted' | 'processing' | 'approved' | 'rejected';
  documents: TaxDocument[];
  totalTaxAmount: number;
  notes?: string;
}

interface TaxDocument {
  documentId: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  digitalSignature?: string;
}

// Interface cho chữ ký số
interface DigitalSignature {
  customerId: string;
  certificateSerial: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  publicKey: string;
  isActive: boolean;
}

export class ETaxService {
  private apiClient = axios.create(ETAX_CONFIG);

  /**
   * Xác thực với eTax API sử dụng chữ ký số
   */
  async authenticateWithDigitalSignature(signature: DigitalSignature): Promise<string> {
    try {
      const response = await this.apiClient.post('/auth/digital-signature', {
        certificateSerial: signature.certificateSerial,
        publicKey: signature.publicKey,
        timestamp: new Date().toISOString()
      });

      return response.data.accessToken;
    } catch (error) {
      console.error('eTax authentication failed:', error);
      throw new Error('Xác thực eTax không thành công');
    }
  }

  /**
   * Lấy thông tin cá nhân từ eTax theo số định danh cá nhân
   */
  async getPersonalTaxInfo(taxpayerCode: string, accessToken: string): Promise<PersonalTaxInfo> {
    try {
      const response = await this.apiClient.get(`/taxpayer/${taxpayerCode}/info`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get personal tax info:', error);
      throw new Error('Không thể lấy thông tin thuế cá nhân');
    }
  }

  /**
   * Lấy danh sách hồ sơ nộp thuế
   */
  async getTaxDeclarations(taxpayerCode: string, accessToken: string, year?: number): Promise<TaxDeclaration[]> {
    try {
      const params = year ? { year } : {};
      const response = await this.apiClient.get(`/taxpayer/${taxpayerCode}/declarations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params
      });

      return response.data.declarations;
    } catch (error) {
      console.error('Failed to get tax declarations:', error);
      throw new Error('Không thể lấy danh sách hồ sơ nộp thuế');
    }
  }

  /**
   * Nộp hồ sơ thuế tự động
   */
  async submitTaxDeclaration(
    taxpayerCode: string, 
    declarationData: any,
    documents: Buffer[],
    signature: DigitalSignature,
    accessToken: string
  ): Promise<TaxDeclaration> {
    try {
      // Tạo form data với tài liệu đính kèm
      const formData = new FormData();
      formData.append('taxpayerCode', taxpayerCode);
      formData.append('declarationData', JSON.stringify(declarationData));
      formData.append('digitalSignature', JSON.stringify(signature));

      // Thêm tài liệu
      documents.forEach((doc, index) => {
        formData.append(`document_${index}`, new Blob([doc]), `document_${index}.pdf`);
      });

      const response = await this.apiClient.post('/declarations/submit', formData, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to submit tax declaration:', error);
      throw new Error('Nộp hồ sơ thuế không thành công');
    }
  }

  /**
   * Kiểm tra trạng thái hồ sơ
   */
  async checkDeclarationStatus(declarationId: string, accessToken: string): Promise<TaxDeclaration> {
    try {
      const response = await this.apiClient.get(`/declarations/${declarationId}/status`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to check declaration status:', error);
      throw new Error('Không thể kiểm tra trạng thái hồ sơ');
    }
  }

  /**
   * Lấy thông tin hóa đơn điện tử
   */
  async getElectronicInvoices(taxpayerCode: string, accessToken: string, fromDate?: string, toDate?: string): Promise<any[]> {
    try {
      const params = { fromDate, toDate };
      const response = await this.apiClient.get(`/taxpayer/${taxpayerCode}/invoices`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params
      });

      return response.data.invoices;
    } catch (error) {
      console.error('Failed to get electronic invoices:', error);
      throw new Error('Không thể lấy thông tin hóa đơn điện tử');
    }
  }

  /**
   * Kiểm tra hạn nộp thuế
   */
  async getTaxDeadlines(taxpayerCode: string, accessToken: string): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/taxpayer/${taxpayerCode}/deadlines`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return response.data.deadlines;
    } catch (error) {
      console.error('Failed to get tax deadlines:', error);
      throw new Error('Không thể lấy thông tin hạn nộp thuế');
    }
  }
}

// Storage cho chữ ký số
export class DigitalSignatureStorage {
  private signatures = new Map<string, DigitalSignature>();

  /**
   * Lưu chữ ký số của khách hàng
   */
  async saveSignature(customerId: string, signature: DigitalSignature): Promise<void> {
    this.signatures.set(customerId, signature);
    console.log(`💾 Saved digital signature for customer: ${customerId}`);
  }

  /**
   * Lấy chữ ký số của khách hàng
   */
  async getSignature(customerId: string): Promise<DigitalSignature | null> {
    return this.signatures.get(customerId) || null;
  }

  /**
   * Kiểm tra chữ ký số còn hiệu lực
   */
  async isSignatureValid(customerId: string): Promise<boolean> {
    const signature = await this.getSignature(customerId);
    if (!signature) return false;

    const now = new Date();
    const validTo = new Date(signature.validTo);
    
    return signature.isActive && now < validTo;
  }

  /**
   * Lấy danh sách chữ ký số sắp hết hạn
   */
  async getExpiringSoon(daysBeforeExpiry: number = 30): Promise<DigitalSignature[]> {
    const now = new Date();
    const checkDate = new Date(now.getTime() + (daysBeforeExpiry * 24 * 60 * 60 * 1000));
    
    const expiring: DigitalSignature[] = [];
    
    for (const signature of this.signatures.values()) {
      const validTo = new Date(signature.validTo);
      if (validTo <= checkDate && signature.isActive) {
        expiring.push(signature);
      }
    }

    return expiring;
  }
}

// Singleton instances
export const etaxService = new ETaxService();
export const digitalSignatureStorage = new DigitalSignatureStorage();