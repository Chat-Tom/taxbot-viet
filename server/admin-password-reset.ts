/**
 * TaxBot Vietnam - Admin Password Reset Service
 * Quản lý việc reset password cho admin account
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sendEmail, getAdminPasswordResetEmail } from './email-service';

interface PasswordResetToken {
  token: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

class AdminPasswordResetService {
  private tokens = new Map<string, PasswordResetToken>();
  private readonly ADMIN_EMAIL = 'taxbotviet@gmail.com';
  private readonly TOKEN_EXPIRY_MINUTES = 15;
  
  /**
   * Tạo token reset password và gửi email
   */
  async requestPasswordReset(domain: string = 'taxbot.vn'): Promise<{ success: boolean; message: string }> {
    try {
      // Generate secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);
      
      // Store token
      const resetToken: PasswordResetToken = {
        token,
        email: this.ADMIN_EMAIL,
        createdAt: now,
        expiresAt,
        used: false
      };
      
      this.tokens.set(token, resetToken);
      
      // Clean up expired tokens
      this.cleanupExpiredTokens();
      
      // Send email
      const emailData = getAdminPasswordResetEmail(token, domain);
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        console.log(`Password reset email sent to ${this.ADMIN_EMAIL} with token: ${token.substring(0, 8)}...`);
        return {
          success: true,
          message: `Email khôi phục mật khẩu đã được gửi đến ${this.ADMIN_EMAIL}`
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
      console.error('Password reset request error:', error);
      return {
        success: false,
        message: 'Lỗi hệ thống. Vui lòng thử lại sau.'
      };
    }
  }
  
  /**
   * Verify token và cho phép reset password
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; message: string }> {
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
        message: 'Token này đã được sử dụng'
      };
    }
    
    const now = new Date();
    if (now > resetToken.expiresAt) {
      this.tokens.delete(token);
      return {
        valid: false,
        message: 'Token đã hết hạn. Vui lòng yêu cầu reset password mới.'
      };
    }
    
    return {
      valid: true,
      message: 'Token hợp lệ'
    };
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify token first
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
      
      // Mark token as used
      const resetToken = this.tokens.get(token)!;
      resetToken.used = true;
      
      // For now, we'll just log the password change
      // In a real system, you'd update the database
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      console.log(`Admin password changed successfully. New hash: ${hashedPassword.substring(0, 20)}...`);
      
      // Store new password in environment variable for immediate use
      process.env.ADMIN_PASSWORD = newPassword;
      
      // Clean up token
      this.tokens.delete(token);
      
      return {
        success: true,
        message: 'Mật khẩu đã được thay đổi thành công'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'Lỗi hệ thống. Vui lòng thử lại sau.'
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
    for (const [token, resetToken] of this.tokens.entries()) {
      if (now > resetToken.expiresAt || resetToken.used) {
        this.tokens.delete(token);
      }
    }
  }
  
  /**
   * Get statistics for admin dashboard
   */
  getStats(): any {
    this.cleanupExpiredTokens();
    
    const activeTokens = Array.from(this.tokens.values()).filter(t => !t.used);
    const usedTokens = Array.from(this.tokens.values()).filter(t => t.used);
    
    return {
      activeTokens: activeTokens.length,
      usedTokens: usedTokens.length,
      totalTokens: this.tokens.size,
      lastRequest: activeTokens.length > 0 ? 
        Math.max(...activeTokens.map(t => t.createdAt.getTime())) : null
    };
  }
}

export const adminPasswordResetService = new AdminPasswordResetService();