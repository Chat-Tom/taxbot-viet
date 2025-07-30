// Zapier webhook integration for TaxBot Vietnam
// This service sends customer registration data to Zapier webhook
// Zapier will then automatically log to Google Sheets and send admin email

interface CustomerRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessType: string;
  createdAt: Date;
}

export async function sendToZapierWebhook(customerData: CustomerRegistration): Promise<boolean> {
  try {
    const zapierWebhookUrl = process.env.ZAPIER_WEBHOOK_URL;
    
    if (!zapierWebhookUrl) {
      console.log('ZAPIER_WEBHOOK_URL not configured, skipping Zapier integration');
      return false;
    }
    
    // Prepare data for Zapier webhook
    const zapierPayload = {
      // Customer Information
      timestamp: new Date().toISOString(),
      vietnamTime: new Date().toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      fullName: `${customerData.firstName} ${customerData.lastName}`,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
      phone: customerData.phone,
      
      // Service Package Information
      servicePackage: getPackageDisplayName(customerData.businessType),
      servicePackageCode: customerData.businessType,
      packagePrice: getPackagePrice(customerData.businessType),
      
      // Status and Source
      status: 'Mới đăng ký - Chờ liên hệ',
      source: 'TaxBot Việt Website',
      priority: 'Cao',
      
      // Admin Email Information
      adminEmail: 'admin@taxbot.vn',
      adminSubject: `🔔 Khách hàng mới đăng ký ${getPackageDisplayName(customerData.businessType)} - TaxBot.vn`,
      adminMessage: `Khách hàng ${customerData.firstName} ${customerData.lastName} (${customerData.phone}) đã đăng ký gói ${getPackageDisplayName(customerData.businessType)} trên website TaxBot.vn. Vui lòng liên hệ trong 24h.`,
      
      // Google Sheets Headers (for Zapier mapping)
      sheetHeaders: {
        col1: 'Thời gian',
        col2: 'Họ tên',
        col3: 'Email',
        col4: 'Số điện thoại',
        col5: 'Gói dịch vụ',
        col6: 'Giá gói',
        col7: 'Trạng thái',
        col8: 'Nguồn',
        col9: 'Ghi chú'
      }
    };
    
    console.log('🚀 Sending customer registration to Zapier webhook:', {
      customer: zapierPayload.fullName,
      package: zapierPayload.servicePackage,
      phone: zapierPayload.phone
    });
    
    const response = await fetch(zapierWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TaxBot-Vietnam/1.0'
      },
      body: JSON.stringify(zapierPayload)
    });
    
    if (response.ok) {
      console.log('✅ Customer registration sent to Zapier successfully');
      console.log('📊 Zapier will now: 1) Log to Google Sheets 2) Send email to admin');
      return true;
    } else {
      console.error('❌ Failed to send to Zapier webhook:', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }
    
  } catch (error) {
    console.error('❌ Zapier webhook error:', error);
    return false;
  }
}

// Helper function to get package display name
function getPackageDisplayName(businessType: string): string {
  const packages = {
    'individual': 'Gói Cá Nhân/Hộ Kinh Doanh',
    'supersaver': 'Gói Siêu Tiết Kiệm (Có MISA)',
    'custom': 'Gói Tùy Chỉnh'
  };
  
  return packages[businessType as keyof typeof packages] || businessType;
}

// Helper function to get package price
function getPackagePrice(businessType: string): string {
  const prices = {
    'individual': '300.000đ/tháng',
    'supersaver': '1.000.000đ/tháng',
    'custom': '1.500.000đ/tháng'
  };
  
  return prices[businessType as keyof typeof prices] || 'Liên hệ';
}

// Test function to verify webhook is working
export async function testZapierWebhook(): Promise<boolean> {
  const testData: CustomerRegistration = {
    firstName: 'Test',
    lastName: 'Customer',
    email: 'test@example.com',
    phone: '0123456789',
    businessType: 'individual',
    createdAt: new Date()
  };
  
  console.log('🧪 Testing Zapier webhook with sample data...');
  return await sendToZapierWebhook(testData);
}

// Get webhook status for admin dashboard
export function getZapierWebhookStatus(): {
  configured: boolean;
  url: string | null;
  lastSent: Date | null;
} {
  return {
    configured: !!process.env.ZAPIER_WEBHOOK_URL,
    url: process.env.ZAPIER_WEBHOOK_URL ? 'Configured' : null,
    lastSent: null // This could be stored in database for tracking
  };
}