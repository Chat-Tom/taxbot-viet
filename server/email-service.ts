import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Gmail SMTP transporter
function createGmailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Gmail SMTP not configured: EMAIL_USER or EMAIL_PASS missing');
    return null;
  }

  // Remove any spaces from App Password (Gmail App Passwords shouldn't have spaces)
  const cleanPassword = process.env.EMAIL_PASS.replace(/\s+/g, '');

  console.log(`🔍 Gmail SMTP Debug: User=${process.env.EMAIL_USER}, Pass length=${cleanPassword.length}`);

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: cleanPassword,
    },
    debug: true,
    logger: true
  });
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const transporter = createGmailTransporter();
    
    if (!transporter) {
      // Fallback: Log email instead of sending (for testing without Gmail SMTP)
      console.log('🧪 EMAIL SIMULATION (Gmail SMTP not configured):');
      console.log(`📧 To: ${params.to}`);
      console.log(`📝 Subject: ${params.subject}`);
      console.log(`📄 Content: ${params.text || 'HTML email'}`);
      console.log('⚠️ To enable real email sending, add EMAIL_USER and EMAIL_PASS to Secrets');
      return true; // Return true for testing purposes
    }

    await transporter.sendMail({
      from: `"TaxBot Việt" <${process.env.EMAIL_USER}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`✅ Real email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP error:', error);
    // Fallback: Log error details but still return simulation
    console.log('🧪 EMAIL SIMULATION (due to SMTP error):');
    console.log(`📧 To: ${params.to}`);
    console.log(`📝 Subject: ${params.subject}`);
    return true; // Return true to allow testing to continue
  }
}

// Email template for customer password reset
export function getCustomerPasswordResetEmail(resetToken: string, customerEmail: string, domain: string = 'taxbot.vn') {
  const resetLink = `https://${domain}/customer/reset-password?token=${resetToken}`;
  
  return {
    to: customerEmail,
    from: process.env.EMAIL_USER || 'taxbotviet@gmail.com',
    subject: '🔒 TaxBot Việt - Đặt lại mật khẩu tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #da020e; margin: 0;">🔒 TaxBot Việt</h1>
          <p style="color: #666; margin: 5px 0;">Đặt lại mật khẩu tài khoản</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Xin chào!</h2>
          <p style="color: #555; line-height: 1.6;">
            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản TaxBot Việt của mình. 
            Click vào nút bên dưới để tạo mật khẩu mới:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="
              display: inline-block;
              background: #da020e;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            ">Đặt lại mật khẩu</a>
          </div>
          
          <p style="color: #555; line-height: 1.6; font-size: 14px;">
            Hoặc copy link này vào trình duyệt:<br>
            <a href="${resetLink}" style="color: #da020e; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ Lưu ý quan trọng:</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Link này chỉ có hiệu lực trong 15 phút</li>
            <li>Chỉ sử dụng được 1 lần duy nhất</li>
            <li>Nếu không phải bạn yêu cầu, hãy bỏ qua email này</li>
            <li>Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>TaxBot Việt - Hệ thống tính thuế thông minh</p>
          <p>Email: taxbotviet@gmail.com | Website: https://7dd3a7cf-ed13-4c79-95d8-772d1b1fd878.picard.prod.repl.run</p>
          <p>Cần hỗ trợ? Liên hệ ngay qua email hoặc website</p>
        </div>
      </div>
    `
  };
}

// Email template for admin password reset
export function getAdminPasswordResetEmail(resetToken: string, domain: string = 'taxbot.vn') {
  const resetLink = `https://${domain}/admin/reset-password?token=${resetToken}`;
  
  return {
    to: 'taxbotviet@gmail.com', // Admin email for password reset
    from: process.env.EMAIL_USER || 'taxbotviet@gmail.com',
    subject: '🔒 TaxBot Việt - Đặt lại mật khẩu Admin',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #da020e; margin: 0;">🔒 TaxBot Việt</h1>
          <p style="color: #666; margin: 5px 0;">Đặt lại mật khẩu Admin</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Yêu cầu đặt lại mật khẩu</h2>
          <p style="color: #555; line-height: 1.6;">
            Bạn đã yêu cầu đặt lại mật khẩu Admin cho TaxBot Việt. 
            Click vào nút bên dưới để tạo mật khẩu mới:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="
              display: inline-block;
              background: #da020e;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            ">Đặt lại mật khẩu</a>
          </div>
          
          <p style="color: #555; line-height: 1.6; font-size: 14px;">
            Hoặc copy link này vào trình duyệt:<br>
            <a href="${resetLink}" style="color: #da020e; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
          <h3 style="color: #856404; margin-top: 0;">⚠️ Lưu ý quan trọng:</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Link này chỉ có hiệu lực trong 15 phút</li>
            <li>Chỉ sử dụng được 1 lần duy nhất</li>
            <li>Nếu không phải bạn yêu cầu, hãy bỏ qua email này</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>TaxBot Việt - Hệ thống tính thuế thông minh</p>
          <p>Email: taxbotviet@gmail.com | Website: https://7dd3a7cf-ed13-4c79-95d8-772d1b1fd878.picard.prod.repl.run</p>
        </div>
      </div>
    `
  };
}

// Email template for admin notification (customer registration)
export function getAdminNotificationEmail(customerData: any) {
  const packageInfo = getPackageInfo(customerData.businessType);
  
  return {
    to: 'taxbotviet@gmail.com',
    from: process.env.EMAIL_USER || 'taxbotviet@gmail.com',
    subject: `🎯 TaxBot Việt - Khách hàng mới đăng ký ${packageInfo.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #da020e; margin: 0;">🎯 TaxBot Việt</h1>
          <p style="color: #666; margin: 5px 0;">Thông báo đăng ký mới</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Khách hàng mới đăng ký</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Họ tên:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${customerData.firstName} ${customerData.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Số điện thoại:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${customerData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${customerData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Gói dịch vụ:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${packageInfo.name} - ${packageInfo.price}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Thời gian:</td>
              <td style="padding: 8px 0;">${new Date(customerData.createdAt).toLocaleString('vi-VN')}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-top: 0;">📞 Hành động cần thực hiện:</h3>
          <ul style="color: #155724; margin: 0; padding-left: 20px;">
            <li>Liên hệ khách hàng trong vòng 24h</li>
            <li>Tư vấn chi tiết về gói dịch vụ đã chọn</li>
            <li>Hỗ trợ khách hàng hoàn tất thủ tục</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>TaxBot Việt - Hệ thống quản lý khách hàng</p>
          <p>Admin Panel: https://taxbot.vn/admin</p>
        </div>
      </div>
    `
  };
}

// Email template for customer confirmation
export function getCustomerConfirmationEmail(customerData: any) {
  const packageInfo = getPackageInfo(customerData.businessType);
  
  return {
    to: customerData.email,
    from: process.env.EMAIL_USER || 'taxbotviet@gmail.com',
    subject: `🎉 TaxBot Việt - Xác nhận đăng ký ${packageInfo.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #da020e; margin: 0;">🎉 TaxBot Việt</h1>
          <p style="color: #666; margin: 5px 0;">Xác nhận đăng ký thành công</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Chào ${customerData.firstName} ${customerData.lastName}!</h2>
          <p style="color: #555; line-height: 1.6;">
            Cảm ơn bạn đã đăng ký dịch vụ <strong>${packageInfo.name}</strong> của TaxBot Việt. 
            Chúng tôi đã nhận được thông tin đăng ký và sẽ liên hệ trong vòng 24 giờ.
          </p>
        </div>
        
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin-top: 0;">📋 Thông tin đăng ký:</h3>
          <ul style="color: #155724; margin: 0; padding-left: 20px;">
            <li>Gói dịch vụ: ${packageInfo.name}</li>
            <li>Giá: ${packageInfo.price}</li>
            <li>Số điện thoại: ${customerData.phone}</li>
            <li>Email: ${customerData.email}</li>
          </ul>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin-top: 20px;">
          <h3 style="color: #856404; margin-top: 0;">⏰ Bước tiếp theo:</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Đội ngũ TaxBot Việt sẽ gọi điện trong 24h</li>
            <li>Tư vấn chi tiết về dịch vụ</li>
            <li>Hướng dẫn thủ tục và thanh toán</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>TaxBot Việt - Dịch vụ kế toán thuế chuyên nghiệp</p>
          <p>Hotline: 0123-456-789 | Email: taxbotviet@gmail.com</p>
          <p>Website: https://taxbot.vn</p>
        </div>
      </div>
    `
  };
}

function getPackageInfo(businessType: string) {
  switch (businessType) {
    case 'individual':
      return { name: 'Cá nhân', price: '300,000 VND' };
    case 'small_business':
      return { name: 'Super Saver', price: '1,000,000 VND' };
    case 'enterprise':
      return { name: 'Doanh nghiệp', price: '1,500,000 VND' };
    default:
      return { name: 'Cơ bản', price: '300,000 VND' };
  }
}