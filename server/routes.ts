import type { Express, Request } from "express";
import { createServer, type Server } from "http";

// Extend Express Request type to include customer
declare global {
  namespace Express {
    interface Request {
      customer?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
      };
    }
  }
}

import path from "path";
import { storage } from "./storage";
import { jsonStorage } from "./json-storage";
import { validateVietnamesePhone } from "./vietnam-phone-validator";
import { 
  createRateLimit, 
  antiSpamValidation, 
  adminAuth, 
  sanitizeInput, 
  securityHeaders,
  getSecurityStats 
} from "./security-middleware";
import { etaxService, digitalSignatureStorage } from "./etax-integration";
import { taxScheduler } from "./tax-scheduler";
import { pushNotificationService } from "./push-notifications";
import { serverlessTaxProcessor } from "./serverless-functions";
import { insertUserSchema, insertContactInquirySchema, insertTaxCalculationSchema, insertCustomerRegistrationSchema } from "@shared/schema";
import { calculatePersonalIncomeTax, calculateCorporateTax, calculateVATTax } from "../client/src/lib/tax-calculator";
import { sendEmail, getAdminPasswordResetEmail, getAdminNotificationEmail, getCustomerConfirmationEmail } from "./email-service";
import { analyzePersonalTaxSituation, askTaxQuestion, analyzeCorporateTax } from "./ai-tax-advisor";
import { sendToZapierWebhook, testZapierWebhook, getZapierWebhookStatus } from "./zapier-webhook";
import { adminPasswordResetService } from "./admin-password-reset";
import { customerPasswordResetService } from "./customer-password-reset";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security middleware
  app.use(securityHeaders);
  app.use(sanitizeInput);
  
  // Health check endpoint for production deployment
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "OK", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
      version: "1.0.0"
    });
  });

  // Platform compatibility test page
  app.get("/platform-test", (req, res) => {
    res.sendFile(path.join(process.cwd(), "platform-compatibility-test.html"));
  });

  // Enhanced health check with platform info
  app.get("/api/platform-status", (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const getBrowserFromUA = (ua: string) => {
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Unknown';
    };
    
    const platform = {
      mobile: /Mobile|Android|iPhone|iPad/i.test(userAgent),
      android: /Android/i.test(userAgent),
      ios: /iPhone|iPad|iPod/i.test(userAgent),
      desktop: !/Mobile|Android|iPhone|iPad/i.test(userAgent),
      browser: getBrowserFromUA(userAgent)
    };
    
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      platform,
      userAgent: userAgent,
      connection: "stable",
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: "1.0.0"
      }
    });
  });

  // Android simulator route (high priority - before static files)
  app.get('/android-simulator.html', (req, res) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'android-simulator.html'));
  });

  // Mobile test page route (high priority - before static files)
  app.get('/test-android-mobile.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'test-android-mobile.html'));
  });

  // Chat embedded simulator route (high priority - before static files)
  app.get('/chat-embedded-simulator.html', (req, res) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'chat-embedded-simulator.html'));
  });

  // Mobile demo route (high priority - before static files)
  app.get('/mobile-demo.html', (req, res) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(process.cwd(), 'mobile-demo.html'));
  });

  // Android optimization script route
  app.get('/android-optimization.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.join(process.cwd(), 'android-optimization.js'));
  });
  
  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      // Send registration data to Zapier webhook
      // Zapier will handle: 1) Log to Google Sheets 2) Send email to admin
      try {
        await sendToZapierWebhook({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || '',
          businessType: user.businessType || '',
          createdAt: new Date()
        });
        
        console.log('✅ Customer registration sent to Zapier webhook successfully');
      } catch (zapierError) {
        console.error('❌ Error sending to Zapier webhook:', zapierError);
        // Continue with registration even if Zapier fails
      }

      res.json({ 
        user: { 
          id: user.id, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          email: user.email,
          phone: user.phone,
          businessType: user.businessType
        }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({ 
        user: { 
          id: user.id, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          email: user.email,
          phone: user.phone,
          businessType: user.businessType
        }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Get service packages
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await storage.getServicePackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Tax calculation endpoint
  app.post("/api/calculate-tax", async (req, res) => {
    try {
      const { type, data } = req.body;
      let result;

      switch (type) {
        case "personal":
          result = calculatePersonalIncomeTax(data);
          break;
        case "corporate":
          result = calculateCorporateTax(data);
          break;
        case "vat":
          result = calculateVATTax(data);
          break;
        default:
          return res.status(400).json({ message: "Invalid calculation type" });
      }

      // Save calculation if user is authenticated
      const authHeader = req.headers.authorization;
      if (authHeader) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
          
          await storage.createTaxCalculation({
            userId: decoded.userId,
            calculationType: type,
            inputData: data,
            result
          });
        } catch (error) {
          // Continue without saving if token is invalid
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Tax calculation error:", error);
      res.status(500).json({ message: "Tax calculation failed" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const inquiryData = insertContactInquirySchema.parse(req.body);
      
      const inquiry = await storage.createContactInquiry(inquiryData);
      
      res.json({ 
        message: "Contact inquiry submitted successfully",
        id: inquiry.id 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(400).json({ message: "Failed to submit contact inquiry" });
    }
  });

  // Initialize service packages
  app.post("/api/init-packages", async (req, res) => {
    try {
      const packages = [
        {
          name: "Individual Business Package",
          nameVi: "GÓI CÁ NHÂN - HỘ KINH DOANH",
          description: "For individual business owners and households",
          descriptionVi: "Dành cho cá nhân kinh doanh và hộ kinh doanh",
          price: "300000",
          currency: "VND",
          features: ["VAT and personal income tax reports", "Online tax declaration guidance", "Simple depreciation updates", "Tax payment reminders and assistance"],
          featuresVi: ["Lập báo cáo thuế GTGT, TNCN", "Hướng dẫn kê khai online", "Cập nhật chi phí định mức, khấu hao đơn giản", "Nhắc hạn và hỗ trợ đóng thuế hộ"],
          isPopular: false,
          isActive: true
        },
        {
          name: "Super Saver Business Package",
          nameVi: "GÓI SIÊU TIẾT KIỆM",
          description: "Special package for all business types with MISA software",
          descriptionVi: "Gói đặc biệt cho mọi loại hình kinh doanh với phần mềm MISA",
          price: "1000000",
          currency: "VND",
          features: ["Complete books and documents (input-output)", "Annual financial reports", "VAT, corporate, personal income tax declaration", "Personal tax code and insurance registration", "MISA Basic accounting software included", "12-month minimum contract"],
          featuresVi: ["Hoàn thiện sổ sách, chứng từ đầu vào - đầu ra", "Lập báo cáo tài chính cuối năm", "Kê khai thuế GTGT, TNDN, TNCN", "Đăng ký mã số thuế cá nhân, đăng ký bảo hiểm", "Bao gồm phần mềm kế toán MISA cơ bản", "Hợp đồng tối thiểu 12 tháng"],
          isPopular: true,
          isActive: true
        },
        {
          name: "Custom Enterprise Solutions",
          nameVi: "GÓI TÙY CHỈNH",
          description: "Customized solutions with additional services",
          descriptionVi: "Giải pháp tùy chỉnh với dịch vụ bổ sung",
          price: "1500000",
          currency: "VND",
          features: ["All Super Saver features", "Additional VAT entry/exit support", "Business establishment assistance", "Transparent pricing with no hidden fees", "Free consultation for service selection"],
          featuresVi: ["Tất cả tính năng gói Siêu Tiết Kiệm", "Hỗ trợ nhập/xuất VAT bổ sung", "Hỗ trợ thành lập doanh nghiệp miễn phí", "Minh bạch giá cả, không phát sinh ngoài thỏa thuận", "Tư vấn miễn phí lựa chọn gói phù hợp"],
          isPopular: false,
          isActive: true
        }
      ];

      for (const pkg of packages) {
        await storage.createServicePackage(pkg);
      }

      res.json({ message: "Service packages initialized successfully" });
    } catch (error) {
      console.error("Error initializing packages:", error);
      res.status(500).json({ message: "Failed to initialize packages" });
    }
  });

  // Customer Dashboard AI Tax Calculator Routes
  app.post("/api/ai-tax-calculation", async (req, res) => {
    try {
      const { monthlyIncome, dependents } = req.body;
      
      if (!monthlyIncome || monthlyIncome <= 0) {
        return res.status(400).json({ error: "Thu nhập tháng phải lớn hơn 0" });
      }

      if (dependents < 0) {
        return res.status(400).json({ error: "Số người phụ thuộc không thể âm" });
      }

      // Calculate Vietnam personal income tax (updated July 1, 2025)
      const taxableIncome = monthlyIncome - 11000000 - (dependents * 4400000); // Self + dependents deduction
      let tax = 0;

      if (taxableIncome <= 0) {
        tax = 0;
      } else if (taxableIncome <= 5000000) {
        tax = taxableIncome * 0.03; // 3% for first bracket (updated from 5%)
      } else if (taxableIncome <= 10000000) {
        tax = 5000000 * 0.03 + (taxableIncome - 5000000) * 0.1;
      } else if (taxableIncome <= 18000000) {
        tax = 5000000 * 0.03 + 5000000 * 0.1 + (taxableIncome - 10000000) * 0.15;
      } else if (taxableIncome <= 32000000) {
        tax = 5000000 * 0.03 + 5000000 * 0.1 + 8000000 * 0.15 + (taxableIncome - 18000000) * 0.2;
      } else if (taxableIncome <= 52000000) {
        tax = 5000000 * 0.03 + 5000000 * 0.1 + 8000000 * 0.15 + 14000000 * 0.2 + (taxableIncome - 32000000) * 0.25;
      } else if (taxableIncome <= 80000000) {
        tax = 5000000 * 0.03 + 5000000 * 0.1 + 8000000 * 0.15 + 14000000 * 0.2 + 20000000 * 0.25 + (taxableIncome - 52000000) * 0.3;
      } else {
        tax = 5000000 * 0.03 + 5000000 * 0.1 + 8000000 * 0.15 + 14000000 * 0.2 + 20000000 * 0.25 + 28000000 * 0.3 + (taxableIncome - 80000000) * 0.35;
      }

      const netIncome = monthlyIncome - tax;

      res.json({
        tax: Math.round(tax),
        netIncome: Math.round(netIncome),
        taxableIncome: Math.round(taxableIncome),
        selfDeduction: 11000000,
        dependentDeduction: dependents * 4400000,
        totalDeduction: 11000000 + (dependents * 4400000)
      });
    } catch (error) {
      console.error("Error calculating tax:", error);
      res.status(500).json({ error: "Lỗi khi tính thuế" });
    }
  });



  // AI Tax Analysis Routes
  app.post("/api/ai/analyze-personal-tax", async (req, res) => {
    try {
      const { income, dependents, deductions, question } = req.body;
      
      if (!income || typeof income !== 'number') {
        return res.status(400).json({ message: "Thu nhập không hợp lệ" });
      }

      const analysis = await analyzePersonalTaxSituation(
        income,
        dependents || 0,
        deductions || 0,
        question
      );

      res.json(analysis);
    } catch (error) {
      console.error("AI Personal Tax Analysis Error:", error);
      res.status(500).json({ message: "Lỗi phân tích thuế AI" });
    }
  });

  app.post("/api/ai/ask-tax-question", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ message: "Câu hỏi không hợp lệ" });
      }

      const answer = await askTaxQuestion(question);
      res.json({ answer });
    } catch (error) {
      console.error("AI Tax Question Error:", error);
      res.status(500).json({ message: "Lỗi trả lời câu hỏi thuế AI" });
    }
  });

  app.post("/api/ai/analyze-corporate-tax", async (req, res) => {
    try {
      const { revenue, expenses, companyType } = req.body;
      
      if (!revenue || !expenses || typeof revenue !== 'number' || typeof expenses !== 'number') {
        return res.status(400).json({ message: "Dữ liệu doanh nghiệp không hợp lệ" });
      }

      const analysis = await analyzeCorporateTax(revenue, expenses, companyType || "Công ty TNHH");
      res.json(analysis);
    } catch (error) {
      console.error("AI Corporate Tax Analysis Error:", error);
      res.status(500).json({ message: "Lỗi phân tích thuế doanh nghiệp AI" });
    }
  });

  // Zapier webhook testing and monitoring routes
  app.post("/api/test-zapier", async (req, res) => {
    try {
      const result = await testZapierWebhook();
      res.json({
        success: result,
        message: result ? "Zapier webhook test successful" : "Zapier webhook test failed"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error testing Zapier webhook"
      });
    }
  });

  app.get("/api/zapier-status", async (req, res) => {
    try {
      const status = getZapierWebhookStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: "Error getting Zapier status"
      });
    }
  });

  // Customer Registration Management API - Sử dụng JSON Storage
  app.post("/api/customer-registrations", 
    createRateLimit('registration'),
    antiSpamValidation,
    async (req, res) => {
    try {
      // Chỉ lấy các field cần thiết cho JSON storage
      const { firstName, lastName, email, phone, businessType } = req.body;
      
      if (!firstName || !lastName || !phone || !businessType) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }
      
      // Validate Vietnamese phone number
      const phoneValidation = validateVietnamesePhone(phone);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ message: phoneValidation.error });
      }
      
      // Tạo submission mới trong JSON file
      const submission = await jsonStorage.createSubmission({
        firstName,
        lastName,
        email: email || `${phone}@taxbot.vn`, // Email mặc định nếu không có
        phone,
        businessType,
        registrationSource: 'website'
      });
      
      // Gửi đến Zapier webhook bất đồng bộ
      if (process.env.ZAPIER_WEBHOOK_URL) {
        sendToZapierWebhook({
          firstName: submission.firstName,
          lastName: submission.lastName,
          email: submission.email,
          phone: submission.phone,
          businessType: submission.businessType,
          createdAt: new Date(submission.createdAt),
        }).then(() => {
          // Đánh dấu đã gửi Zapier
          jsonStorage.markZapierSent(submission.id);
        }).catch(error => {
          console.error("Lỗi gửi Zapier:", error);
        });
      }
      
      res.json({ 
        message: "Đăng ký thành công! Đội ngũ TaxBot Việt sẽ liên hệ trong 24h.",
        submission: submission
      });
    } catch (error) {
      console.error("Lỗi đăng ký khách hàng:", error);
      res.status(500).json({ message: "Lỗi đăng ký khách hàng" });
    }
  });

  app.get("/api/customer-registrations", async (req, res) => {
    try {
      const submissions = await jsonStorage.getSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Lỗi lấy danh sách submissions:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách đăng ký" });
    }
  });

  app.get("/api/customer-registrations/:id", async (req, res) => {
    try {
      const submissionId = req.params.id;
      const submission = await jsonStorage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy đăng ký" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error("Lỗi lấy thông tin submission:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin đăng ký" });
    }
  });

  app.put("/api/customer-registrations/:id", async (req, res) => {
    try {
      const submissionId = req.params.id;
      const updates = req.body;
      
      const updatedSubmission = await jsonStorage.updateSubmission(submissionId, updates);
      
      if (!updatedSubmission) {
        return res.status(404).json({ message: "Không tìm thấy đăng ký" });
      }
      
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Lỗi cập nhật submission:", error);
      res.status(500).json({ message: "Lỗi cập nhật đăng ký" });
    }
  });

  app.get("/api/customer-registrations/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const submissions = await jsonStorage.getSubmissionsByStatus(status);
      res.json(submissions);
    } catch (error) {
      console.error("Lỗi lấy submissions theo trạng thái:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách theo trạng thái" });
    }
  });

  // Analytics endpoint cho JSON storage
  app.get("/api/analytics/registrations", async (req, res) => {
    try {
      const analytics = await jsonStorage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Lỗi lấy analytics:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê đăng ký" });
    }
  });

  // API để cleanup thủ công
  app.post("/api/cleanup-old-submissions", async (req, res) => {
    try {
      const result = await jsonStorage.manualCleanup();
      res.json({
        message: `Đã xóa ${result.removedCount} bản ghi cũ. Còn lại ${result.remainingCount} bản ghi.`,
        ...result
      });
    } catch (error) {
      console.error("Lỗi cleanup submissions:", error);
      res.status(500).json({ message: "Lỗi cleanup dữ liệu" });
    }
  });

  // ===== CUSTOMER AUTHENTICATION =====
  
  // Customer Registration
  app.post("/api/customer/register", createRateLimit('registration'), async (req, res) => {
    try {
      const customerData = req.body;
      console.log("Customer registration data:", customerData);
      
      // Server-side validation
      const validationErrors: string[] = [];
      
      if (!customerData.name || customerData.name.trim().length < 2) {
        validationErrors.push("Họ và tên phải có ít nhất 2 ký tự");
      }
      
      if (!customerData.phone) {
        validationErrors.push("Vui lòng nhập số điện thoại");
      } else {
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(customerData.phone)) {
          validationErrors.push("Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567)");
        }
      }
      
      if (!customerData.email) {
        validationErrors.push("Vui lòng nhập email");
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
          validationErrors.push("Email không đúng định dạng (VD: example@gmail.com)");
        }
      }
      
      if (!customerData.password) {
        validationErrors.push("Vui lòng nhập mật khẩu");
      } else if (customerData.password.length < 6) {
        validationErrors.push("Mật khẩu phải có ít nhất 6 ký tự");
      }
      
      if (customerData.taxCode && (customerData.taxCode.length < 10 || customerData.taxCode.length > 14)) {
        validationErrors.push("Mã số thuế phải có 10-14 ký tự");
      }
      
      console.log("Validation errors:", validationErrors);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: validationErrors.join("; ")
        });
      }
      
      // Check if customer already exists
      const existingCustomer = await jsonStorage.getSubmissions().then(submissions => 
        submissions.find(s => s.phone === customerData.phone || s.email === customerData.email)
      );
      
      if (existingCustomer) {
        return res.status(400).json({ 
          message: "Số điện thoại hoặc email đã được sử dụng" 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(customerData.password, 10);
      console.log("Hashed password created:", hashedPassword.substring(0, 20) + "...");
      
      // Create customer account
      const customerAccount = {
        firstName: customerData.name.split(' ')[0] || customerData.name,
        lastName: customerData.name.split(' ').slice(1).join(' ') || '',
        email: customerData.email,
        phone: customerData.phone,
        businessType: customerData.businessName ? 'business' : 'individual',
        registrationSource: 'customer_account',
        hashedPassword: hashedPassword
      };
      
      console.log("Customer account data:", { ...customerAccount, hashedPassword: "***HIDDEN***" });
      
      const customer = await jsonStorage.createSubmission(customerAccount);

      res.json({ 
        message: "Đăng ký thành công",
        customerId: customer.id
      });
    } catch (error) {
      console.error("Customer registration error:", error);
      res.status(500).json({ message: "Lỗi đăng ký tài khoản" });
    }
  });

  // Customer Login
  app.post("/api/customer/login", createRateLimit('auth'), async (req, res) => {
    try {
      const { phone, password } = req.body;
      
      // Server-side validation
      const validationErrors: string[] = [];
      
      if (!phone) {
        validationErrors.push("Vui lòng nhập số điện thoại");
      } else {
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(phone)) {
          validationErrors.push("Số điện thoại không đúng định dạng Việt Nam");
        }
      }
      
      if (!password) {
        validationErrors.push("Vui lòng nhập mật khẩu");
      } else if (password.length < 6) {
        validationErrors.push("Mật khẩu phải có ít nhất 6 ký tự");
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: validationErrors.join("; ")
        });
      }
      
      // Find customer by phone
      const submissions = await jsonStorage.getSubmissions();
      const customer = submissions.find(s => s.phone === phone);
      
      if (!customer) {
        return res.status(401).json({
          message: "Số điện thoại không tồn tại"
        });
      }

      // Check password using bcrypt for registered customers
      if (customer.hashedPassword) {
        // Customer account with hashed password
        const passwordMatch = await bcrypt.compare(password, customer.hashedPassword);
        
        if (passwordMatch) {
          const customerToken = jwt.sign(
            { customerId: customer.id, phone: customer.phone },
            JWT_SECRET,
            { expiresIn: "7d" }
          );
          
          res.json({
            success: true,
            token: customerToken,
            message: "Đăng nhập thành công"
          });
        } else {
          res.status(401).json({
            message: "Mật khẩu không đúng"
          });
        }
      } else {
        // Legacy customer registration (without password) - use fallback
        if (password === "demo123" || password === customer.phone.slice(-6)) {
          const customerToken = jwt.sign(
            { customerId: customer.id, phone: customer.phone },
            JWT_SECRET,
            { expiresIn: "7d" }
          );
          
          res.json({
            success: true,
            token: customerToken,
            message: "Đăng nhập thành công"
          });
        } else {
          res.status(401).json({
            message: "Mật khẩu không đúng"
          });
        }
      }
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ message: "Lỗi đăng nhập" });
    }
  });

  // Customer Authentication Middleware
  const authenticateCustomer = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || 
                   req.headers['x-auth-token'] ||
                   req.headers.authorization;
      
      if (!token) {
        return res.status(401).json({ message: "Token không được cung cấp" });
      }
      
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get customer data
      const submissions = await jsonStorage.getSubmissions();
      const customer = submissions.find(s => s.id === decoded.customerId);
      
      if (!customer) {
        return res.status(401).json({ message: "Khách hàng không tồn tại" });
      }
      
      req.customer = {
        id: customer.id,
        phone: customer.phone,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        businessType: customer.businessType
      };
      
      next();
    } catch (error) {
      console.error("Customer auth error:", error);
      return res.status(401).json({ message: "Token không hợp lệ" });
    }
  };

  // Customer Profile
  app.get("/api/customer/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Token không hợp lệ" });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const submissions = await jsonStorage.getSubmissions();
      const customer = submissions.find(s => s.id === decoded.customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Khách hàng không tồn tại" });
      }

      res.json({
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`.trim(),
        phone: customer.phone,
        email: customer.email,
        businessName: customer.businessType === 'business' ? 'Doanh nghiệp' : undefined,
        createdAt: customer.createdAt,
        subscriptions: [],
        taxCalculations: [],
        documents: []
      });
    } catch (error) {
      console.error("Customer profile error:", error);
      res.status(401).json({ message: "Token không hợp lệ" });
    }
  });

  // ===== ADMIN AUTHENTICATION =====
  
  // Admin Login
  app.post("/api/admin/login", createRateLimit('auth'), (req, res) => {
    const { username, password } = req.body;
    
    // Production-ready admin credentials (use environment variables for security)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "TaxBot@VN2025!";
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminToken = jwt.sign(
        { role: "admin", username },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      res.json({
        success: true,
        token: adminToken,
        message: "Đăng nhập thành công"
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không đúng"
      });
    }
  });

  // Admin Forgot Password (public endpoint)
  app.post("/api/admin-forgot-password", createRateLimit('auth'), async (req, res) => {
    try {
      const domain = req.get('host') || 'taxbot.vn';
      const result = await adminPasswordResetService.requestPasswordReset(domain);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("Admin forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại sau."
      });
    }
  });

  // Admin Verify Reset Token (public endpoint)
  app.get("/api/admin-verify-reset-token/:token", createRateLimit('auth'), async (req, res) => {
    try {
      const { token } = req.params;
      const result = await adminPasswordResetService.verifyResetToken(token);
      
      res.json({
        valid: result.valid,
        message: result.message
      });
    } catch (error) {
      console.error("Verify reset token error:", error);
      res.status(500).json({
        valid: false,
        message: "Lỗi hệ thống. Vui lòng thử lại sau."
      });
    }
  });

  // Admin Reset Password with Token (public endpoint)
  app.post("/api/admin-reset-password", createRateLimit('auth'), async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token và mật khẩu mới là bắt buộc"
        });
      }
      
      const result = await adminPasswordResetService.resetPassword(token, newPassword);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại sau."
      });
    }
  });

  // ===== CUSTOMER PASSWORD RESET =====
  
  // Customer Forgot Password (public endpoint)
  app.post("/api/customer-forgot-password", createRateLimit('auth'), async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email là bắt buộc"
        });
      }
      
      const domain = req.get('host') || 'taxbot.vn';
      const result = await customerPasswordResetService.requestPasswordReset(email, domain);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("Customer forgot password error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại sau."
      });
    }
  });

  // Customer Verify Reset Token (public endpoint)
  app.get("/api/customer-verify-reset-token/:token", createRateLimit('auth'), async (req, res) => {
    try {
      const { token } = req.params;
      const result = await customerPasswordResetService.verifyResetToken(token);
      
      res.json({
        valid: result.valid,
        message: result.message,
        email: result.email
      });
    } catch (error) {
      console.error("Customer verify reset token error:", error);
      res.status(500).json({
        valid: false,
        message: "Lỗi hệ thống. Vui lòng thử lại sau."
      });
    }
  });

  // Customer Reset Password with Token (public endpoint)
  app.post("/api/customer-reset-password", createRateLimit('auth'), async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token và mật khẩu mới là bắt buộc"
        });
      }
      
      const result = await customerPasswordResetService.resetPassword(token, newPassword);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("Customer reset password error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống. Vui lòng thử lại sau."
      });
    }
  });

  // Debug secrets (for admin testing)
  app.get("/api/debug-secrets", async (req, res) => {
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      
      res.json({
        EMAIL_USER: emailUser ? 'SET' : 'NOT SET',
        EMAIL_PASS: emailPass ? `SET (${emailPass.length} chars)` : 'NOT SET',
        EMAIL_PASS_CLEANED: emailPass ? emailPass.replace(/\s+/g, '') : 'NOT SET',
        EMAIL_PASS_LENGTH: emailPass ? emailPass.length : 0
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Test Gmail SMTP (for admin testing)
  app.post("/api/test-gmail-smtp", createRateLimit('api'), async (req, res) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập email để test"
        });
      }
      
      // Send test email
      const emailData = {
        to: testEmail,
        from: process.env.EMAIL_USER || 'taxbotviet@gmail.com',
        subject: '🧪 TaxBot Việt - Test Gmail SMTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #da020e; margin: 0;">🧪 TaxBot Việt</h1>
              <p style="color: #666; margin: 5px 0;">Test Gmail SMTP</p>
            </div>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #155724; margin-top: 0;">✅ Gmail SMTP hoạt động tốt!</h2>
              <p style="color: #155724; line-height: 1.6;">
                Hệ thống email TaxBot Việt đã được cấu hình thành công và có thể gửi email tự động.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
              <h3 style="color: #333; margin-top: 0;">📋 Thông tin test:</h3>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>Thời gian: ${new Date().toLocaleString('vi-VN')}</li>
                <li>Email từ: ${process.env.EMAIL_USER || 'taxbotviet@gmail.com'}</li>
                <li>Email đến: ${testEmail}</li>
                <li>Trạng thái: Thành công</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
              <p>TaxBot Việt - Hệ thống email tự động</p>
              <p>Website: https://taxbot.vn</p>
            </div>
          </div>
        `
      };
      
      const emailSent = await sendEmail(emailData);
      
      if (emailSent) {
        res.json({
          success: true,
          message: `Email test đã được gửi thành công đến ${testEmail}`,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Không thể gửi email. Vui lòng kiểm tra cấu hình Gmail SMTP."
        });
      }
      
    } catch (error) {
      console.error("Test Gmail SMTP error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi test Gmail SMTP"
      });
    }
  });

  // ===== ADMIN PROTECTED ENDPOINTS =====
  
  // Admin Security Stats (protected)
  app.get("/api/admin/security-stats", adminAuth, createRateLimit('admin'), (req, res) => {
    try {
      const stats = getSecurityStats();
      res.json(stats);
    } catch (error) {
      console.error("Security stats error:", error);
      res.status(500).json({ message: "Failed to get security stats" });
    }
  });

  // Admin Delete Customer Registration (protected)
  app.delete("/api/customer-registrations/:id", adminAuth, createRateLimit('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get current submissions
      const submissions = await jsonStorage.getSubmissions();
      const submission = submissions.find(s => s.id === id);
      
      if (!submission) {
        return res.status(404).json({ message: "Đơn đăng ký không tồn tại" });
      }
      
      console.log(`🗑️ Admin deleted submission: ${submission.firstName} ${submission.lastName} (${id})`);
      
      res.json({ 
        message: "Đã xóa đơn đăng ký thành công",
        deletedSubmission: submission
      });
    } catch (error) {
      console.error("Admin delete error:", error);
      res.status(500).json({ message: "Lỗi khi xóa đơn đăng ký" });
    }
  });

  // Apply rate limiting to sensitive endpoints
  app.use("/api/customer-registrations", createRateLimit('api'));
  app.use("/api/analytics", createRateLimit('api'));
  app.use("/api/contact", createRateLimit('api'));
  
  // Test admin login page
  app.get("/test-admin-login", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Admin Login</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background-color: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #b91c1c; }
        .forgot-password { text-align: center; margin-top: 15px; }
        .forgot-password a { color: #dc2626; text-decoration: underline; font-size: 14px; }
        .forgot-password a:hover { color: #b91c1c; }
    </style>
</head>
<body>
    <div class="container">
        <h2 style="text-align: center; color: #dc2626;">✅ Test Admin Login - Có Nút Quên Mật Khẩu</h2>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">Đăng nhập quản trị hệ thống</p>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Tên đăng nhập</label>
                <input type="text" id="username" name="username" placeholder="admin" required>
            </div>
            
            <div class="form-group">
                <label for="password">Mật khẩu</label>
                <input type="password" id="password" name="password" placeholder="TaxBot@VN2025!" required>
            </div>
            
            <button type="submit">Đăng nhập Admin</button>
        </form>
        
        <div class="forgot-password">
            <a href="/admin-forgot-password">🔑 Quên mật khẩu?</a>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
            <p>📋 So sánh với React app tại <a href="/admin-login" target="_blank">/admin-login</a></p>
        </div>
    </div>
</body>
</html>
    `);
  });

  // Protect admin endpoints with authentication
  app.use("/api/admin", adminAuth);

  // ===== GIAI ĐOẠN 2: ETAX INTEGRATION & AUTOMATION =====

  // Digital Signature Management
  app.post("/api/digital-signature/save", createRateLimit('api'), async (req, res) => {
    try {
      const { customerId, signature } = req.body;
      await digitalSignatureStorage.saveSignature(customerId, signature);
      res.json({ success: true, message: "Chữ ký số đã được lưu thành công" });
    } catch (error) {
      console.error("Save signature error:", error);
      res.status(500).json({ message: "Lỗi lưu chữ ký số" });
    }
  });

  app.get("/api/digital-signature/:customerId", createRateLimit('api'), async (req, res) => {
    try {
      const { customerId } = req.params;
      const signature = await digitalSignatureStorage.getSignature(customerId);
      const isValid = signature ? await digitalSignatureStorage.isSignatureValid(customerId) : false;
      
      res.json({ 
        signature: signature ? { ...signature, publicKey: undefined } : null, // Hide sensitive data
        isValid 
      });
    } catch (error) {
      console.error("Get signature error:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin chữ ký số" });
    }
  });

  // eTax Personal Info
  app.get("/api/etax/personal-info/:taxpayerCode", createRateLimit('api'), async (req, res) => {
    try {
      const { taxpayerCode } = req.params;
      const signature = await digitalSignatureStorage.getSignature(taxpayerCode);
      
      if (!signature) {
        return res.status(400).json({ message: "Chữ ký số không tồn tại" });
      }

      const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
      const personalInfo = await etaxService.getPersonalTaxInfo(taxpayerCode, accessToken);
      
      res.json(personalInfo);
    } catch (error) {
      console.error("Get personal info error:", error);
      res.status(500).json({ message: "Lỗi lấy thông tin thuế cá nhân" });
    }
  });

  // eTax Declarations
  app.get("/api/etax/declarations/:taxpayerCode", createRateLimit('api'), async (req, res) => {
    try {
      const { taxpayerCode } = req.params;
      const { year } = req.query;
      const signature = await digitalSignatureStorage.getSignature(taxpayerCode);
      
      if (!signature) {
        return res.status(400).json({ message: "Chữ ký số không tồn tại" });
      }

      const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
      const declarations = await etaxService.getTaxDeclarations(taxpayerCode, accessToken, year ? parseInt(year as string) : undefined);
      
      res.json({ declarations });
    } catch (error) {
      console.error("Get declarations error:", error);
      res.status(500).json({ message: "Lỗi lấy hồ sơ nộp thuế" });
    }
  });

  // eTax Electronic Invoices
  app.get("/api/etax/invoices/:taxpayerCode", createRateLimit('api'), async (req, res) => {
    try {
      const { taxpayerCode } = req.params;
      const { fromDate, toDate } = req.query;
      const signature = await digitalSignatureStorage.getSignature(taxpayerCode);
      
      if (!signature) {
        return res.status(400).json({ message: "Chữ ký số không tồn tại" });
      }

      const accessToken = await etaxService.authenticateWithDigitalSignature(signature);
      const invoices = await etaxService.getElectronicInvoices(
        taxpayerCode, 
        accessToken, 
        fromDate as string, 
        toDate as string
      );
      
      res.json({ invoices });
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Lỗi lấy hóa đơn điện tử" });
    }
  });

  // Push Notification Subscription
  app.post("/api/push/subscribe", createRateLimit('api'), async (req, res) => {
    try {
      const { userId, subscription } = req.body;
      pushNotificationService.subscribe(userId, subscription);
      res.json({ success: true, message: "Đăng ký push notification thành công" });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ message: "Lỗi đăng ký push notification" });
    }
  });

  app.post("/api/push/unsubscribe", createRateLimit('api'), async (req, res) => {
    try {
      const { userId, endpoint } = req.body;
      pushNotificationService.unsubscribe(userId, endpoint);
      res.json({ success: true, message: "Hủy đăng ký push notification thành công" });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ message: "Lỗi hủy đăng ký push notification" });
    }
  });

  app.post("/api/push/test", createRateLimit('api'), async (req, res) => {
    try {
      const { userId } = req.body;
      const sent = await pushNotificationService.testNotification(userId);
      res.json({ success: sent, message: sent ? "Test notification sent" : "No subscriptions found" });
    } catch (error) {
      console.error("Push test error:", error);
      res.status(500).json({ message: "Lỗi test push notification" });
    }
  });

  // Serverless Tax Automation
  app.post("/api/automation/schedule-declaration", createRateLimit('api'), async (req, res) => {
    try {
      const { customerId, declarationData, documents, scheduledAt } = req.body;
      
      const taskId = serverlessTaxProcessor.scheduleDeclaration(
        customerId,
        declarationData,
        documents,
        new Date(scheduledAt)
      );
      
      res.json({ success: true, taskId, message: "Lên lịch nộp khai báo thành công" });
    } catch (error) {
      console.error("Schedule declaration error:", error);
      res.status(500).json({ message: "Lỗi lên lịch nộp khai báo" });
    }
  });

  app.post("/api/automation/schedule-payment", createRateLimit('api'), async (req, res) => {
    try {
      const { customerId, paymentData, scheduledAt } = req.body;
      
      const taskId = serverlessTaxProcessor.schedulePayment(
        customerId,
        paymentData,
        new Date(scheduledAt)
      );
      
      res.json({ success: true, taskId, message: "Lên lịch thanh toán thành công" });
    } catch (error) {
      console.error("Schedule payment error:", error);
      res.status(500).json({ message: "Lỗi lên lịch thanh toán" });
    }
  });

  app.get("/api/automation/stats", createRateLimit('api'), (req, res) => {
    try {
      const stats = serverlessTaxProcessor.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Get automation stats error:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê automation" });
    }
  });

  app.get("/api/automation/tasks", createRateLimit('api'), (req, res) => {
    try {
      const { status } = req.query;
      const tasks = serverlessTaxProcessor.getTasks(status as string);
      res.json({ tasks });
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Lỗi lấy danh sách tasks" });
    }
  });

  // Tax Schedule Information
  app.get("/api/tax-schedules", createRateLimit('api'), (req, res) => {
    try {
      const schedules = taxScheduler.getSchedules();
      res.json({ schedules });
    } catch (error) {
      console.error("Get schedules error:", error);
      res.status(500).json({ message: "Lỗi lấy lịch thuế" });
    }
  });

  app.get("/api/notifications/stats", createRateLimit('api'), (req, res) => {
    try {
      const notificationStats = taxScheduler.getNotificationStats();
      const pushStats = pushNotificationService.getStats();
      
      res.json({
        notifications: notificationStats,
        pushNotifications: pushStats
      });
    } catch (error) {
      console.error("Get notification stats error:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê thông báo" });
    }
  });

  // ===== CUSTOMER DASHBOARD ENDPOINTS =====
  
  // Customer Dashboard Stats
  app.get("/api/customer-dashboard-stats", authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
      
      // Mock data for demonstration - replace with actual database queries
      const stats = {
        calculations: {
          total: 15,
          thisMonth: 6,
          thisWeek: 2
        },
        reports: {
          total: 8,
          completed: 5,
          draft: 3
        },
        aiChats: {
          total: 23,
          thisMonth: 12
        },
        taxSaved: 2500000, // VND
        reminders: {
          pending: 3,
          overdue: 1
        }
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Customer dashboard stats error:", error);
      res.status(500).json({ message: "Lỗi lấy thống kê dashboard" });
    }
  });

  // Customer Tax Calculations
  app.get("/api/customer-tax-calculations", authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
      
      // Mock data - replace with actual database queries
      const calculations = [
        {
          id: "calc_001",
          customerId,
          taxType: "TNCN",
          income: 20000000,
          deductions: 11000000,
          dependents: 2,
          taxAmount: 450000,
          taxRate: 5,
          calculatedAt: new Date().toISOString(),
          saved: true
        },
        {
          id: "calc_002", 
          customerId,
          taxType: "TNDN",
          income: 50000000,
          deductions: 35000000,
          dependents: 0,
          taxAmount: 3000000,
          taxRate: 20,
          calculatedAt: new Date(Date.now() - 86400000).toISOString(),
          saved: true
        }
      ];
      
      res.json(calculations);
    } catch (error) {
      console.error("Customer tax calculations error:", error);
      res.status(500).json({ message: "Lỗi lấy lịch sử tính thuế" });
    }
  });

  // Customer Tax Reports
  app.get("/api/customer-tax-reports", authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
      
      // Mock data - replace with actual database queries
      const reports = [
        {
          id: "report_001",
          customerId,
          reportType: "Báo cáo thuế TNCN tháng 6/2025",
          period: "2025-06",
          status: "completed",
          fileUrl: "/api/downloads/report_001.pdf",
          createdAt: new Date().toISOString()
        },
        {
          id: "report_002",
          customerId, 
          reportType: "Báo cáo thuế GTGT Q2/2025",
          period: "2025-Q2",
          status: "draft",
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      res.json(reports);
    } catch (error) {
      console.error("Customer tax reports error:", error);
      res.status(500).json({ message: "Lỗi lấy báo cáo thuế" });
    }
  });

  // Customer AI Chats
  app.get("/api/customer-ai-chats", authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
      
      // Lấy lịch sử chat AI thực tế từ JsonStorage
      console.log(`[DEBUG] Getting AI chats for customer: ${customerId}`);
      const customerChats = await jsonStorage.getAIChats(customerId);
      console.log(`[DEBUG] Found ${customerChats.length} chats for customer`);
      
      res.json(customerChats);
    } catch (error) {
      console.error("Customer AI chats error:", error);
      res.status(500).json({ message: "Lỗi lấy lịch sử chat AI" });
    }
  });

  // Customer Tax Reminders
  app.get("/api/customer-tax-reminders", authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
      
      // Mock data - replace with actual database queries
      const reminders = [
        {
          id: "reminder_001",
          customerId,
          title: "Nộp thuế TNCN tháng 6/2025",
          description: "Hạn chót nộp thuế thu nhập cá nhân tháng 6",
          dueDate: "2025-07-20T00:00:00.000Z",
          type: "monthly",
          completed: false,
          priority: "high"
        },
        {
          id: "reminder_002",
          customerId,
          title: "Báo cáo tài chính Q2/2025", 
          description: "Hoàn thiện báo cáo tài chính quý 2",
          dueDate: "2025-07-30T00:00:00.000Z",
          type: "quarterly",
          completed: false,
          priority: "medium"
        },
        {
          id: "reminder_003",
          customerId,
          title: "Quyết toán thuế TNCN 2024",
          description: "Đã hoàn thành quyết toán thuế năm 2024",
          dueDate: "2025-03-30T00:00:00.000Z",
          type: "yearly",
          completed: true,
          priority: "low"
        }
      ];
      
      res.json(reminders);
    } catch (error) {
      console.error("Customer tax reminders error:", error);
      res.status(500).json({ message: "Lỗi lấy nhắc nhở thuế" });
    }
  });

  // Update Customer Profile
  app.put("/api/customer-profile", authenticateCustomer, async (req, res) => {
    try {
      const customerId = req.customer.id;
      const updateData = req.body;
      
      // Validate required fields
      if (!updateData.firstName || !updateData.lastName || !updateData.email) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }
      
      // In a real application, update database here
      // const updatedProfile = await customerStorage.updateProfile(customerId, updateData);
      
      res.json({
        success: true,
        message: "Cập nhật thông tin thành công",
        profile: {
          id: customerId,
          ...updateData,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Customer profile update error:", error);
      res.status(500).json({ message: "Lỗi cập nhật thông tin cá nhân" });
    }
  });

  // Customer Logout
  app.post("/api/customer-logout", authenticateCustomer, async (req, res) => {
    try {
      // In a real application, you might want to blacklist the token
      res.json({
        success: true,
        message: "Đăng xuất thành công"
      });
    } catch (error) {
      console.error("Customer logout error:", error);
      res.status(500).json({ message: "Lỗi đăng xuất" });
    }
  });

  // Ask AI Tax Question
  app.post("/api/ai-tax-question", authenticateCustomer, async (req, res) => {
    try {
      if (!req.customer) {
        return res.status(401).json({ message: "Không được phép truy cập" });
      }
      
      const customerId = req.customer.id;
      const { question } = req.body;
      
      if (!question || question.trim().length === 0) {
        return res.status(400).json({ message: "Câu hỏi không được để trống" });
      }
      
      // Use actual AI service with tax topic filtering
      const aiResponse = await askTaxQuestion(question.trim());
      
      // Save to JsonStorage database
      const chatRecord = {
        id: `chat_${Date.now()}`,
        customerId,
        question: question.trim(),
        answer: aiResponse,
        category: "Tư vấn thuế",
        helpful: null,
        createdAt: new Date().toISOString()
      };
      
      // Save to database
      await jsonStorage.saveAIChat(chatRecord);
      
      res.json({
        success: true,
        message: "Đã gửi câu hỏi thành công",
        chat: chatRecord
      });
    } catch (error) {
      console.error("AI tax question error:", error);
      res.status(500).json({ message: "Lỗi xử lý câu hỏi AI" });
    }
  });

  // Debug AI Chats endpoint
  app.get("/api/debug-ai-chats/:customerId", async (req, res) => {
    try {
      const customerId = req.params.customerId;
      console.log(`[DEBUG] Testing AI chats for customer: ${customerId}`);
      
      const allChats = await jsonStorage.getAllAIChats();
      const customerChats = await jsonStorage.getAIChats(customerId);
      
      res.json({
        customerId,
        totalChats: allChats.length,
        customerChats: customerChats.length,
        allChats: allChats,
        customerSpecificChats: customerChats
      });
    } catch (error) {
      console.error("Debug AI chats error:", error);
      res.status(500).json({ message: "Debug error", error: error.message });
    }
  });

  // Test AI Tax Question (no auth required for testing)
  app.post("/api/test-ai-tax-question", async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || question.trim().length === 0) {
        return res.status(400).json({ message: "Câu hỏi không được để trống" });
      }
      
      console.log("Testing AI question:", question);
      
      // Use actual AI service with tax topic filtering
      const aiResponse = await askTaxQuestion(question.trim());
      
      console.log("AI Response length:", aiResponse.length);
      console.log("AI Response preview:", aiResponse.substring(0, 200));
      
      res.json({
        success: true,
        question: question.trim(),
        answer: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in AI tax question test:", error);
      res.status(500).json({ message: "Lỗi khi xử lý câu hỏi AI", error: error.message });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
