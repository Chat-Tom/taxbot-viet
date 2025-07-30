/**
 * TaxBot Vietnam - Push Notifications Service
 * Hệ thống thông báo đẩy cho mobile app và web
 */

import webpush from 'web-push';

// VAPID configuration cho web push
const VAPID_CONFIG = {
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@taxbot.vn',
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

// Interface cho subscription
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Interface cho thông báo
interface TaxNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Storage cho subscriptions
class PushSubscriptionStorage {
  private subscriptions = new Map<string, PushSubscription[]>();

  /**
   * Lưu subscription cho user
   */
  addSubscription(userId: string, subscription: PushSubscription): void {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    
    // Kiểm tra trùng lặp
    const exists = userSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
      userSubscriptions.push(subscription);
      this.subscriptions.set(userId, userSubscriptions);
      console.log(`📱 Added push subscription for user: ${userId}`);
    }
  }

  /**
   * Lấy subscriptions của user
   */
  getSubscriptions(userId: string): PushSubscription[] {
    return this.subscriptions.get(userId) || [];
  }

  /**
   * Xóa subscription không hợp lệ
   */
  removeSubscription(userId: string, endpoint: string): void {
    const userSubscriptions = this.subscriptions.get(userId) || [];
    const filtered = userSubscriptions.filter(sub => sub.endpoint !== endpoint);
    this.subscriptions.set(userId, filtered);
    console.log(`📱 Removed push subscription for user: ${userId}`);
  }

  /**
   * Lấy tất cả subscriptions
   */
  getAllSubscriptions(): Map<string, PushSubscription[]> {
    return this.subscriptions;
  }
}

export class PushNotificationService {
  private subscriptionStorage = new PushSubscriptionStorage();

  constructor() {
    // Cấu hình VAPID
    if (VAPID_CONFIG.publicKey && VAPID_CONFIG.privateKey) {
      webpush.setVapidDetails(
        VAPID_CONFIG.subject,
        VAPID_CONFIG.publicKey,
        VAPID_CONFIG.privateKey
      );
      console.log('📱 VAPID configured for push notifications');
    } else {
      console.warn('⚠️ VAPID keys not configured - push notifications disabled');
    }
  }

  /**
   * Đăng ký push subscription
   */
  subscribe(userId: string, subscription: PushSubscription): void {
    this.subscriptionStorage.addSubscription(userId, subscription);
  }

  /**
   * Hủy đăng ký push subscription
   */
  unsubscribe(userId: string, endpoint: string): void {
    this.subscriptionStorage.removeSubscription(userId, endpoint);
  }

  /**
   * Gửi thông báo cho một user
   */
  async sendToUser(userId: string, notification: TaxNotification): Promise<boolean> {
    const subscriptions = this.subscriptionStorage.getSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user: ${userId}`);
      return false;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      data: notification.data || {},
      actions: notification.actions || [],
      tag: notification.tag,
      requireInteraction: notification.requireInteraction || false,
      timestamp: Date.now()
    });

    let successCount = 0;
    const promises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
        successCount++;
        return true;
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription không còn hợp lệ
          this.subscriptionStorage.removeSubscription(userId, subscription.endpoint);
        }
        console.error(`Failed to send push notification to ${subscription.endpoint}:`, error);
        return false;
      }
    });

    await Promise.all(promises);
    
    console.log(`📱 Sent push notification to ${successCount}/${subscriptions.length} devices for user: ${userId}`);
    return successCount > 0;
  }

  /**
   * Gửi thông báo cho tất cả users
   */
  async sendToAll(notification: TaxNotification): Promise<number> {
    const allSubscriptions = this.subscriptionStorage.getAllSubscriptions();
    let totalSent = 0;

    for (const [userId] of allSubscriptions) {
      const sent = await this.sendToUser(userId, notification);
      if (sent) totalSent++;
    }

    console.log(`📱 Broadcast notification sent to ${totalSent} users`);
    return totalSent;
  }

  /**
   * Gửi thông báo nhắc thuế
   */
  async sendTaxReminder(userId: string, taxType: string, dueDate: string): Promise<boolean> {
    const notification: TaxNotification = {
      title: '🔔 Nhắc nhở nộp thuế',
      body: `${taxType} - Hạn nộp: ${dueDate}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'tax-reminder',
      requireInteraction: true,
      data: {
        type: 'tax-reminder',
        taxType,
        dueDate,
        url: '/ai-calculator'
      },
      actions: [
        {
          action: 'view',
          title: 'Xem chi tiết'
        },
        {
          action: 'dismiss',
          title: 'Bỏ qua'
        }
      ]
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Gửi cảnh báo hóa đơn
   */
  async sendInvoiceWarning(userId: string, invoiceCount: number): Promise<boolean> {
    const notification: TaxNotification = {
      title: '⚠️ Cảnh báo hóa đơn điện tử',
      body: `Có ${invoiceCount} hóa đơn cần xem xét`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'invoice-warning',
      requireInteraction: true,
      data: {
        type: 'invoice-warning',
        count: invoiceCount,
        url: '/invoices'
      },
      actions: [
        {
          action: 'view',
          title: 'Kiểm tra'
        }
      ]
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Gửi thông báo hết hạn kê khai
   */
  async sendDeclarationExpiry(userId: string, declarationType: string, daysLeft: number): Promise<boolean> {
    const notification: TaxNotification = {
      title: '🚨 Hết hạn kê khai',
      body: `${declarationType} hết hạn trong ${daysLeft} ngày`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'declaration-expiry',
      requireInteraction: true,
      data: {
        type: 'declaration-expiry',
        declarationType,
        daysLeft,
        url: '/declarations'
      },
      actions: [
        {
          action: 'submit',
          title: 'Nộp ngay'
        },
        {
          action: 'remind',
          title: 'Nhắc sau'
        }
      ]
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Gửi thông báo thành công
   */
  async sendSuccessNotification(userId: string, message: string): Promise<boolean> {
    const notification: TaxNotification = {
      title: '✅ Thành công',
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'success',
      data: {
        type: 'success',
        message
      }
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Gửi thông báo lỗi
   */
  async sendErrorNotification(userId: string, message: string): Promise<boolean> {
    const notification: TaxNotification = {
      title: '❌ Lỗi xử lý',
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'error',
      requireInteraction: true,
      data: {
        type: 'error',
        message
      },
      actions: [
        {
          action: 'retry',
          title: 'Thử lại'
        },
        {
          action: 'contact',
          title: 'Liên hệ hỗ trợ'
        }
      ]
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Gửi thông báo cập nhật chữ ký số
   */
  async sendSignatureExpiryWarning(userId: string, daysLeft: number): Promise<boolean> {
    const notification: TaxNotification = {
      title: '⚠️ Chữ ký số sắp hết hạn',
      body: `Chữ ký số của bạn hết hạn trong ${daysLeft} ngày`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'signature-expiry',
      requireInteraction: true,
      data: {
        type: 'signature-expiry',
        daysLeft,
        url: '/profile/signature'
      },
      actions: [
        {
          action: 'update',
          title: 'Cập nhật ngay'
        },
        {
          action: 'remind',
          title: 'Nhắc sau'
        }
      ]
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * Lấy thống kê push notifications
   */
  getStats(): any {
    const allSubscriptions = this.subscriptionStorage.getAllSubscriptions();
    let totalSubscriptions = 0;
    
    for (const subscriptions of allSubscriptions.values()) {
      totalSubscriptions += subscriptions.length;
    }

    return {
      totalUsers: allSubscriptions.size,
      totalSubscriptions,
      averageSubscriptionsPerUser: allSubscriptions.size > 0 ? totalSubscriptions / allSubscriptions.size : 0
    };
  }

  /**
   * Test push notification
   */
  async testNotification(userId: string): Promise<boolean> {
    const notification: TaxNotification = {
      title: '🧪 Test Notification',
      body: 'TaxBot Vietnam push notification đang hoạt động!',
      icon: '/icon-192x192.png',
      tag: 'test',
      data: {
        type: 'test',
        timestamp: Date.now()
      }
    };

    return await this.sendToUser(userId, notification);
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();