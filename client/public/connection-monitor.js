// TaxBot Vietnam - Connection Monitor & Auto-Reconnect
class ConnectionMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 2000;
    this.healthCheckInterval = 30000; // 30 seconds
    this.lastSuccessfulPing = Date.now();
    
    this.init();
  }

  init() {
    console.log('TaxBot Vietnam: Connection Monitor initialized');
    
    // Listen to browser online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Start health check monitoring
    this.startHealthCheck();
    
    // Monitor page visibility to resume checks when tab becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnection();
      }
    });
  }

  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        this.handleSuccessfulConnection();
        return true;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.log('TaxBot Vietnam: Connection check failed:', error.message);
      this.handleFailedConnection();
      return false;
    }
  }

  handleSuccessfulConnection() {
    if (!this.isOnline) {
      console.log('TaxBot Vietnam: Connection restored');
      this.showConnectionStatus('online');
    }
    
    this.isOnline = true;
    this.retryAttempts = 0;
    this.lastSuccessfulPing = Date.now();
    this.updateConnectionIndicator(true);
  }

  handleFailedConnection() {
    this.isOnline = false;
    this.retryAttempts++;
    
    console.log(`TaxBot Vietnam: Connection failed (attempt ${this.retryAttempts}/${this.maxRetries})`);
    
    this.updateConnectionIndicator(false);
    this.showConnectionStatus('offline');
    
    if (this.retryAttempts < this.maxRetries) {
      setTimeout(() => this.checkConnection(), this.retryDelay * this.retryAttempts);
    } else {
      console.log('TaxBot Vietnam: Max retry attempts reached');
      this.showConnectionStatus('error');
    }
  }

  handleOnline() {
    console.log('TaxBot Vietnam: Browser reports online');
    this.checkConnection();
  }

  handleOffline() {
    console.log('TaxBot Vietnam: Browser reports offline');
    this.isOnline = false;
    this.updateConnectionIndicator(false);
    this.showConnectionStatus('offline');
  }

  startHealthCheck() {
    // Initial check
    this.checkConnection();
    
    // Periodic checks
    setInterval(() => {
      if (navigator.onLine) {
        this.checkConnection();
      }
    }, this.healthCheckInterval);
  }

  updateConnectionIndicator(isConnected) {
    // Update any UI indicators
    const indicators = document.querySelectorAll('[data-connection-indicator]');
    indicators.forEach(indicator => {
      if (isConnected) {
        indicator.className = 'status-indicator status-ok';
        indicator.title = 'Kết nối ổn định';
      } else {
        indicator.className = 'status-indicator status-error';
        indicator.title = 'Mất kết nối';
      }
    });

    // Update connection status text
    const statusTexts = document.querySelectorAll('[data-connection-text]');
    statusTexts.forEach(text => {
      text.textContent = isConnected ? 'Kết nối tốt' : 'Mất kết nối';
    });

    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('connectionChange', { 
      detail: { isConnected, timestamp: Date.now() }
    }));
  }

  showConnectionStatus(status) {
    // Create or update connection notification
    let notification = document.getElementById('connection-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'connection-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(notification);
    }

    const messages = {
      online: { text: '✅ Kết nối đã được khôi phục', color: '#4CAF50' },
      offline: { text: '⚠️ Mất kết nối - Đang thử kết nối lại...', color: '#FF9800' },
      error: { text: '❌ Không thể kết nối - Vui lòng kiểm tra mạng', color: '#F44336' }
    };

    const message = messages[status];
    notification.textContent = message.text;
    notification.style.backgroundColor = message.color;
    notification.style.display = 'block';

    // Auto-hide success messages
    if (status === 'online') {
      setTimeout(() => {
        notification.style.display = 'none';
      }, 3000);
    }
  }

  // Manual retry function for user-triggered reconnection
  async retryConnection() {
    console.log('TaxBot Vietnam: Manual retry triggered');
    this.retryAttempts = 0;
    return await this.checkConnection();
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      isOnline: this.isOnline,
      retryAttempts: this.retryAttempts,
      lastSuccessfulPing: this.lastSuccessfulPing,
      timeSinceLastSuccess: Date.now() - this.lastSuccessfulPing
    };
  }
}

// Enhanced API request wrapper with retry mechanism
class EnhancedApiClient {
  constructor(connectionMonitor) {
    this.connectionMonitor = connectionMonitor;
    this.baseUrl = '';
  }

  async request(url, options = {}) {
    const maxRetries = 3;
    const retryDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response;
        }
        
        throw new Error(`Request failed: ${response.status}`);
        
      } catch (error) {
        console.log(`TaxBot Vietnam: API request attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          // Show user-friendly error
          this.connectionMonitor.showConnectionStatus('error');
          throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  async get(url) {
    return this.request(url, { method: 'GET' });
  }

  async post(url, data) {
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}

// Initialize connection monitoring when DOM is loaded
if (typeof window !== 'undefined') {
  let connectionMonitor;
  let apiClient;

  document.addEventListener('DOMContentLoaded', () => {
    connectionMonitor = new ConnectionMonitor();
    apiClient = new EnhancedApiClient(connectionMonitor);
    
    // Make available globally for other scripts
    window.TaxBotConnection = {
      monitor: connectionMonitor,
      api: apiClient,
      retry: () => connectionMonitor.retryConnection(),
      status: () => connectionMonitor.getConnectionStats()
    };
    
    console.log('TaxBot Vietnam: Connection monitoring active');
  });

  // Handle page unload to cleanup
  window.addEventListener('beforeunload', () => {
    console.log('TaxBot Vietnam: Cleaning up connection monitor');
  });
}