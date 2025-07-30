/**
 * TaxBot Vietnam - Customer Password Reset Service
 * Quản lý việc reset password cho customer accounts
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sendEmail, getCustomerPasswordResetEmail } from './email-service';

interface PasswordResetToken {
  token: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

class CustomerPasswordResetService {
  private tokens = new Map<string, PasswordResetToken>();
  private readonly TOKEN_EXPIRY_MINUTES = 15;

  /**
   * Tạo token reset password và gửi email
   */
  async requestPasswordReset(email: string, domain: string = 'taxbot.vn'): Promise<{ success: boolean; message: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Email không hợp lệ'
        };
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);
      
      const resetToken: PasswordResetToken = {
        token,
        email,
        createdAt: new Date(),
        expiresAt,
        used: false
      };
      
      this.tokens.set(token, resetToken);
      
      // Clean up expired tokens
      this.cleanupExpiredTokens();
      
      // Send email
      const emailData = getCustomerPasswordResetEmail(token, email, domain);
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        console.log(`Customer password reset email sent to ${email} with token: ${token.substring(0, 8)}...`);
        return {
          success: true,
          message: `Email khôi phục mật khẩu đã được gửi đến ${email}`
        };
      } else {
        // Remove token if email failed
        this.tokens.delete(token);
        return {
          success: false,
          message: 'Không thể gửi email. Vui lòng thử lại sau.'
        };
      }
    } catch (error) {
      console.error('Customer password reset request error:', error);
      return {
        success: false,
        message: 'Lỗi hệ thống. Vui lòng thử lại sau.'
      };
    }
  }
  
  /**
   * Verify token và cho phép reset password
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; message: string; email?: string }> {
    const resetToken = this.tokens.get(token);
    
    if (!resetToken) {
      return {
        valid: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      };
    }
    
    if (resetToken.used) {
      return {
        valid: false,
        message: 'Token đã được sử dụng'
      };
    }
    
    if (new Date() > resetToken.expiresAt) {
      this.tokens.delete(token);
      return {
        valid: false,
        message: 'Token đã hết hạn. Vui lòng yêu cầu reset mật khẩu mới.'
      };
    }
    
    return {
      valid: true,
      message: 'Token hợp lệ',
      email: resetToken.email
    };
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const verification = await this.verifyResetToken(token);
    
    if (!verification.valid) {
      return {
        success: false,
        message: verification.message
      };
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        message: 'Mật khẩu phải có ít nhất 8 ký tự'
      };
    }
    
    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return {
        success: false,
        message: 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
      };
    }
    
    try {
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update customer password in database  
      const { jsonStorage } = await import('./json-storage');
      await jsonStorage.updateCustomerPassword(verification.email!, hashedPassword);
      
      // Mark token as used
      const resetToken = this.tokens.get(token);
      if (resetToken) {
        resetToken.used = true;
        this.tokens.set(token, resetToken);
      }
      
      console.log(`Customer password reset successfully for email: ${verification.email}`);
      
      return {
        success: true,
        message: 'Mật khẩu đã được thay đổi thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Lỗi hệ thống khi đặt lại mật khẩu. Vui lòng thử lại sau.'
      };
    }
  }
  
  /**
   * Get token information (for debugging)
   */
  getTokenInfo(token: string): PasswordResetToken | undefined {
    return this.tokens.get(token);
  }
  
  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = new Date();
    const expiredTokens: string[] = [];
    
    for (const [token, resetToken] of this.tokens.entries()) {
      if (now > resetToken.expiresAt) {
        expiredTokens.push(token);
      }
    }
    
    expiredTokens.forEach(token => {
      this.tokens.delete(token);
    });
    
    if (expiredTokens.length > 0) {
      console.log(`Cleaned up ${expiredTokens.length} expired customer password reset tokens`);
    }
  }
  
  /**
   * Get statistics for dashboard
   */
  getStats(): any {
    const activeTokens = Array.from(this.tokens.values()).filter(token => 
      !token.used && new Date() <= token.expiresAt
    );
    
    return {
      totalTokens: this.tokens.size,
      activeTokens: activeTokens.length,
      usedTokens: Array.from(this.tokens.values()).filter(token => token.used).length,
      expiredTokens: Array.from(this.tokens.values()).filter(token => 
        !token.used && new Date() > token.expiresAt
      ).length,
      lastRequest: activeTokens.length > 0 ? 
        Math.max(...activeTokens.map(t => t.createdAt.getTime())) : null
    };
  }
}

export const customerPasswordResetService = new CustomerPasswordResetService();