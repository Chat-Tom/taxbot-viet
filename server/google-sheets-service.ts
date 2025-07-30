// Google Sheets integration for storing customer registration data
// This service will log customer data to Google Sheets for easy management

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessType: string;
  createdAt: Date;
}

export async function logToGoogleSheets(customerData: CustomerData): Promise<boolean> {
  try {
    // For now, we'll use a simple webhook approach to Google Sheets
    // This can be replaced with Google Sheets API when proper credentials are set up
    
    const sheetData = {
      'Thời gian': new Date().toLocaleString('vi-VN'),
      'Họ tên': `${customerData.firstName} ${customerData.lastName}`,
      'Email': customerData.email,
      'Số điện thoại': customerData.phone,
      'Gói dịch vụ': getPackageDisplayName(customerData.businessType),
      'Giá gói': getPackagePrice(customerData.businessType),
      'Trạng thái': 'Mới đăng ký - Chờ liên hệ',
      'Ghi chú': 'Khách hàng đăng ký qua website TaxBot Việt'
    };
    
    console.log('📊 Logging customer data to Google Sheets:', sheetData);
    
    // TODO: Implement actual Google Sheets API integration
    // For now, we'll just log to console as a placeholder
    // This can be replaced with actual Google Sheets API calls
    
    return true;
  } catch (error) {
    console.error('Google Sheets logging error:', error);
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

// Google Sheets webhook integration (alternative approach)
export async function sendToGoogleSheetsWebhook(customerData: CustomerData): Promise<boolean> {
  try {
    // This is a placeholder for Google Sheets webhook integration
    // You can use Google Apps Script to create a webhook endpoint
    // that receives POST requests and adds data to Google Sheets
    
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.log('GOOGLE_SHEETS_WEBHOOK_URL not configured, skipping Google Sheets integration');
      return false;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        fullName: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        phone: customerData.phone,
        servicePackage: getPackageDisplayName(customerData.businessType),
        packagePrice: getPackagePrice(customerData.businessType),
        status: 'Mới đăng ký',
        source: 'TaxBot Việt Website'
      })
    });
    
    if (response.ok) {
      console.log('✅ Customer data sent to Google Sheets successfully');
      return true;
    } else {
      console.error('❌ Failed to send data to Google Sheets:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Google Sheets webhook error:', error);
    return false;
  }
}

// Export customer data as CSV format for easy import to Google Sheets
export function exportToCSV(customersData: CustomerData[]): string {
  const headers = [
    'Thời gian đăng ký',
    'Họ tên',
    'Email',
    'Số điện thoại',
    'Gói dịch vụ',
    'Giá gói',
    'Trạng thái'
  ];
  
  const csvContent = [
    headers.join(','),
    ...customersData.map(customer => [
      `"${customer.createdAt.toLocaleString('vi-VN')}"`,
      `"${customer.firstName} ${customer.lastName}"`,
      `"${customer.email}"`,
      `"${customer.phone}"`,
      `"${getPackageDisplayName(customer.businessType)}"`,
      `"${getPackagePrice(customer.businessType)}"`,
      `"Mới đăng ký"`
    ].join(','))
  ].join('\n');
  
  return csvContent;
}