import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Phone, Mail, Building, Hash, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Login form state
  const [loginData, setLoginData] = useState({
    phone: "",
    password: ""
  });
  
  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: "",
    businessName: "",
    taxCode: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validateVietnamesePhone = (phone: string) => {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const validateLoginForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!loginData.phone) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!validateVietnamesePhone(loginData.phone)) {
      errors.phone = "Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567)";
    }
    
    if (!loginData.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (!validatePassword(loginData.password)) {
      errors.password = "Mật khẩu chứa ít nhất 8 ký tự bao gồm ít nhất 1 chữ viết hoa, 1 chữ số, 1 ký tự đặc biệt như @,!...";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time validation for login
  const handleLoginInputChange = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }));
    
    const errors = { ...validationErrors };
    
    if (field === 'phone') {
      if (!value) {
        errors.phone = "Vui lòng nhập số điện thoại";
      } else if (!validateVietnamesePhone(value)) {
        errors.phone = "Số điện thoại không đúng định dạng Việt Nam";
      } else {
        delete errors.phone;
      }
    }
    
    if (field === 'password') {
      if (!value) {
        errors.password = "Vui lòng nhập mật khẩu";
      } else if (!validatePassword(value)) {
        errors.password = "Mật khẩu chứa ít nhất 8 ký tự bao gồm ít nhất 1 chữ viết hoa, 1 chữ số, 1 ký tự đặc biệt như @,!...";
      } else {
        delete errors.password;
      }
    }
    
    setValidationErrors(errors);
  };

  // Real-time validation for registration
  const handleRegisterInputChange = (field: string, value: string) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
    
    const errors = { ...validationErrors };
    
    if (field === 'name') {
      if (!value) {
        errors.name = "Vui lòng nhập họ và tên";
      } else if (value.length < 2) {
        errors.name = "Họ và tên phải có ít nhất 2 ký tự";
      } else {
        delete errors.name;
      }
    }
    
    if (field === 'phone') {
      if (!value) {
        errors.phone = "Vui lòng nhập số điện thoại";
      } else if (!validateVietnamesePhone(value)) {
        errors.phone = "Số điện thoại không đúng định dạng Việt Nam";
      } else {
        delete errors.phone;
      }
    }
    
    if (field === 'email') {
      if (!value) {
        errors.email = "Vui lòng nhập email";
      } else if (!validateEmail(value)) {
        errors.email = "Email không đúng định dạng";
      } else {
        delete errors.email;
      }
    }
    
    if (field === 'password') {
      if (!value) {
        errors.password = "Vui lòng nhập mật khẩu";
      } else if (!validatePassword(value)) {
        errors.password = "Mật khẩu chứa ít nhất 8 ký tự bao gồm ít nhất 1 chữ viết hoa, 1 chữ số, 1 ký tự đặc biệt như @,!...";
      } else {
        delete errors.password;
      }
    }
    
    if (field === 'confirmPassword') {
      if (!value) {
        errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      } else if (value !== registerData.password) {
        errors.confirmPassword = "Mật khẩu xác nhận không khớp";
      } else {
        delete errors.confirmPassword;
      }
    }
    
    if (field === 'taxCode' && value) {
      if (value.length < 10 || value.length > 14) {
        errors.taxCode = "Mã số thuế phải có 10-14 ký tự";
      } else {
        delete errors.taxCode;
      }
    }
    
    setValidationErrors(errors);
  };

  const validateRegisterForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!registerData.name) {
      errors.name = "Vui lòng nhập họ và tên";
    } else if (registerData.name.length < 2) {
      errors.name = "Họ và tên phải có ít nhất 2 ký tự";
    }
    
    if (!registerData.phone) {
      errors.phone = "Vui lòng nhập số điện thoại";
    } else if (!validateVietnamesePhone(registerData.phone)) {
      errors.phone = "Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567)";
    }
    
    if (!registerData.email) {
      errors.email = "Vui lòng nhập email";
    } else if (!validateEmail(registerData.email)) {
      errors.email = "Email không đúng định dạng (VD: example@gmail.com)";
    }
    
    if (!registerData.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (!validatePassword(registerData.password)) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    
    if (!registerData.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    
    if (registerData.taxCode && (registerData.taxCode.length < 10 || registerData.taxCode.length > 14)) {
      errors.taxCode = "Mã số thuế phải có 10-14 ký tự";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setValidationErrors({});

    if (!validateLoginForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/customer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('taxbot_customer_token', data.token);
        
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại TaxBot Việt!",
        });
        
        setLocation("/customer-dashboard");
      } else {
        setError(data.message || "Số điện thoại hoặc mật khẩu không đúng");
      }
    } catch (error) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setValidationErrors({});

    if (!validateRegisterForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/customer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Đăng ký thành công",
          description: "Tài khoản của bạn đã được tạo. Hãy đăng nhập để tiếp tục.",
        });
        
        // Switch to login tab
        setError("");
        setLoginData({ phone: registerData.phone, password: "" });
      } else {
        setError(data.message || "Đăng ký thất bại");
      }
    } catch (error) {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setLocation("/customer-forgot-password");
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              Tài khoản khách hàng
            </CardTitle>
            <p className="text-gray-600">
              Đăng nhập hoặc tạo tài khoản mới
            </p>
          </CardHeader>
          
          <CardContent className="pb-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                <TabsTrigger value="register">Đăng ký</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-phone">Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="login-phone"
                        type="tel"
                        placeholder="Nhập số điện thoại"
                        value={loginData.phone}
                        onChange={(e) => handleLoginInputChange('phone', e.target.value)}
                        required
                        className={`pl-10 ${validationErrors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="login-password">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        value={loginData.password}
                        onChange={(e) => handleLoginInputChange('password', e.target.value)}
                        required
                        className={`pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                </form>
                
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={handleForgotPassword}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Quên mật khẩu?
                  </Button>
                </div>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="register-name">Tên cá nhân *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Nhập tên cá nhân"
                        value={registerData.name}
                        onChange={(e) => handleRegisterInputChange('name', e.target.value)}
                        required
                        className={`pl-10 ${validationErrors.name ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-business">Tên đơn vị kinh doanh</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="register-business"
                        type="text"
                        placeholder="Nhập tên đơn vị kinh doanh (nếu có)"
                        value={registerData.businessName}
                        onChange={(e) => handleRegisterInputChange('businessName', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-tax-code">Mã số thuế</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="register-tax-code"
                        type="text"
                        placeholder="Nhập mã số thuế (nếu có)"
                        value={registerData.taxCode}
                        onChange={(e) => handleRegisterInputChange('taxCode', e.target.value)}
                        className={`pl-10 ${validationErrors.taxCode ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {validationErrors.taxCode && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.taxCode}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-phone">Số điện thoại/Zalo *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="Nhập số điện thoại/Zalo"
                        value={registerData.phone}
                        onChange={(e) => handleRegisterInputChange('phone', e.target.value)}
                        required
                        className={`pl-10 ${validationErrors.phone ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Nhập email"
                        value={registerData.email}
                        onChange={(e) => handleRegisterInputChange('email', e.target.value)}
                        required
                        className={`pl-10 ${validationErrors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-password">Mật khẩu *</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                        value={registerData.password}
                        onChange={(e) => handleRegisterInputChange('password', e.target.value)}
                        required
                        className={`pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="register-confirm-password">Xác nhận mật khẩu *</Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu"
                        value={registerData.confirmPassword}
                        onChange={(e) => handleRegisterInputChange('confirmPassword', e.target.value)}
                        required
                        className={`pr-10 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Nếu không khôi phục được mật khẩu, liên hệ khôi phục:<br/>
                <strong>contact@taxbot.vn</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}