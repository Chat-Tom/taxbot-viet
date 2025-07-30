/**
 * TaxBot Vietnam - Security & Anti-Spam Middleware
 * Comprehensive security system to protect against spam and unauthorized access
 */

import { Request, Response, NextFunction } from 'express';
import { jsonStorage } from './json-storage';

// Rate limiting store
interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const suspiciousIPs = new Map<string, { attempts: number; lastAttempt: number; blocked: boolean }>();

// Configuration
const RATE_LIMITS = {
  registration: {
    maxRequests: 3,          // Max 3 registrations per hour
    windowMs: 60 * 60 * 1000, // 1 hour window
    blockDuration: 24 * 60 * 60 * 1000 // 24 hour block
  },
  api: {
    maxRequests: 100,        // Max 100 API calls per 15 minutes
    windowMs: 15 * 60 * 1000, // 15 minutes window
    blockDuration: 60 * 60 * 1000 // 1 hour block
  },
  admin: {
    maxRequests: 50,         // Max 50 admin actions per hour
    windowMs: 60 * 60 * 1000, // 1 hour window
    blockDuration: 2 * 60 * 60 * 1000 // 2 hour block
  },
  auth: {
    maxRequests: 20,         // Max 20 auth attempts per 15 minutes
    windowMs: 15 * 60 * 1000, // 15 minutes window
    blockDuration: 60 * 60 * 1000 // 1 hour block
  }
};

// Spam detection patterns
const SPAM_PATTERNS = {
  suspiciousNames: [
    /test/i, /spam/i, /bot/i, /fake/i, /admin/i, 
    /null/i, /undefined/i, /script/i, /hack/i
  ],
  suspiciousPhones: [
    /^0{10}$/, /^1{10}$/, /^(0123456789|9876543210)$/,
    /^0(111111111|222222222|333333333)$/
  ],
  suspiciousEmails: [
    /@tempmail\./i, /@10minutemail\./i, /@mailinator\./i,
    /@guerrillamail\./i, /@throwaway\./i
  ]
};

/**
 * Get client IP address safely
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.connection.remoteAddress) || 'unknown';
  return ip.trim();
}

/**
 * Rate limiting middleware
 */
export function createRateLimit(type: keyof typeof RATE_LIMITS) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req);
    const config = RATE_LIMITS[type];
    const key = `${type}:${ip}`;
    const now = Date.now();
    
    // Check if IP is blocked
    const suspiciousEntry = suspiciousIPs.get(ip);
    if (suspiciousEntry?.blocked && (now - suspiciousEntry.lastAttempt) < config.blockDuration) {
      return res.status(429).json({
        message: "IP bị chặn do vi phạm chính sách bảo mật. Vui lòng liên hệ admin.",
        blocked: true,
        retryAfter: Math.ceil((config.blockDuration - (now - suspiciousEntry.lastAttempt)) / 1000)
      });
    }
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || (now - entry.resetTime) >= config.windowMs) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now
      };
      rateLimitStore.set(key, entry);
      return next();
    }
    
    entry.count++;
    
    if (entry.count > config.maxRequests) {
      // Mark IP as suspicious
      const suspicious = suspiciousIPs.get(ip) || { attempts: 0, lastAttempt: 0, blocked: false };
      suspicious.attempts++;
      suspicious.lastAttempt = now;
      
      // Block IP after multiple violations
      if (suspicious.attempts >= 3) {
        suspicious.blocked = true;
        console.log(`🚨 SECURITY: IP ${ip} blocked for repeated rate limit violations`);
      }
      
      suspiciousIPs.set(ip, suspicious);
      
      return res.status(429).json({
        message: `Quá nhiều yêu cầu. Giới hạn ${config.maxRequests} requests/${config.windowMs/60000} phút.`,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
    }
    
    rateLimitStore.set(key, entry);
    next();
  };
}

/**
 * Spam detection middleware for registrations
 */
export function antiSpamValidation(req: Request, res: Response, next: NextFunction) {
  const { firstName, lastName, phone, email } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  
  const suspiciousReasons: string[] = [];
  
  // Check for suspicious names
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  for (const pattern of SPAM_PATTERNS.suspiciousNames) {
    if (pattern.test(fullName)) {
      suspiciousReasons.push(`Tên nghi vấn: ${pattern.toString()}`);
    }
  }
  
  // Check for suspicious phone patterns
  for (const pattern of SPAM_PATTERNS.suspiciousPhones) {
    if (pattern.test(phone)) {
      suspiciousReasons.push(`Số điện thoại nghi vấn: ${pattern.toString()}`);
    }
  }
  
  // Check for suspicious emails
  if (email) {
    for (const pattern of SPAM_PATTERNS.suspiciousEmails) {
      if (pattern.test(email)) {
        suspiciousReasons.push(`Email tạm thời: ${pattern.toString()}`);
      }
    }
  }
  
  // Check for bot-like behavior
  if (!userAgent || userAgent.length < 10) {
    suspiciousReasons.push('User-Agent nghi vấn');
  }
  
  // Check for rapid-fire requests from same IP
  const recentSubmissions = rateLimitStore.get(`registration:${ip}`);
  if (recentSubmissions && recentSubmissions.count > 1) {
    const timeBetweenRequests = Date.now() - recentSubmissions.firstRequest;
    if (timeBetweenRequests < 30000) { // Less than 30 seconds between requests
      suspiciousReasons.push('Yêu cầu quá nhanh');
    }
  }
  
  if (suspiciousReasons.length > 0) {
    console.log(`🚨 SPAM DETECTED from IP ${ip}:`, suspiciousReasons);
    
    // Log suspicious activity
    const suspiciousEntry = suspiciousIPs.get(ip) || { attempts: 0, lastAttempt: 0, blocked: false };
    suspiciousEntry.attempts++;
    suspiciousEntry.lastAttempt = Date.now();
    suspiciousIPs.set(ip, suspiciousEntry);
    
    return res.status(400).json({
      message: "Đăng ký không hợp lệ. Vui lòng kiểm tra thông tin và thử lại.",
      code: "SPAM_DETECTED"
    });
  }
  
  next();
}

/**
 * Admin authentication middleware
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const adminKey = process.env.ADMIN_SECRET_KEY || 'taxbot-admin-2025';
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  
  const token = authHeader.substring(7);
  if (token !== adminKey) {
    const ip = getClientIP(req);
    console.log(`🚨 SECURITY: Invalid admin access attempt from IP ${ip}`);
    
    return res.status(401).json({ message: "Invalid admin credentials" });
  }
  
  next();
}

/**
 * Input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
        
        // Limit string length
        if (req.body[key].length > 1000) {
          req.body[key] = req.body[key].substring(0, 1000);
        }
      }
    }
  }
  
  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Access-Control-Allow-Origin', 'https://taxbot.vn');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  next();
}

/**
 * Get security statistics for admin dashboard
 */
export function getSecurityStats() {
  const now = Date.now();
  const stats = {
    rateLimitEntries: rateLimitStore.size,
    suspiciousIPs: Array.from(suspiciousIPs.entries()).map(([ip, data]) => ({
      ip,
      attempts: data.attempts,
      lastAttempt: new Date(data.lastAttempt).toISOString(),
      blocked: data.blocked,
      blockedMinutesAgo: data.blocked ? Math.floor((now - data.lastAttempt) / 60000) : null
    })),
    blockedIPs: Array.from(suspiciousIPs.entries())
      .filter(([_, data]) => data.blocked)
      .length,
    recentActivity: Array.from(rateLimitStore.entries())
      .filter(([_, data]) => (now - data.firstRequest) < 3600000) // Last hour
      .map(([key, data]) => ({
        key,
        count: data.count,
        resetTime: new Date(data.resetTime).toISOString()
      }))
  };
  
  return stats;
}

/**
 * Cleanup old entries
 */
export function cleanupSecurityData() {
  const now = Date.now();
  const cleanupAge = 24 * 60 * 60 * 1000; // 24 hours
  
  // Cleanup rate limit entries
  const rateLimitEntries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of rateLimitEntries) {
    if (now - entry.resetTime > cleanupAge) {
      rateLimitStore.delete(key);
    }
  }
  
  // Cleanup old suspicious IP entries (but keep blocked ones)
  const suspiciousEntries = Array.from(suspiciousIPs.entries());
  for (const [ip, data] of suspiciousEntries) {
    if (!data.blocked && (now - data.lastAttempt) > cleanupAge) {
      suspiciousIPs.delete(ip);
    }
  }
  
  console.log('🧹 Security data cleanup completed');
}

// Auto-cleanup every 6 hours
setInterval(cleanupSecurityData, 6 * 60 * 60 * 1000);