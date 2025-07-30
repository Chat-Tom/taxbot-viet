import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function AdminResetPassword() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin-reset-password");
  const { toast } = useToast();
  
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [error, setError] = useState("");
  const [tokenMessage, setTokenMessage] = useState("");

  // Get token from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
    } else {
      setIsVerifying(false);
      setError("Token không hợp lệ. Vui lòng sử dụng link từ email.");
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`/api/admin-verify-reset-token/${tokenToVerify}`);
      const data = await response.json();
      
      if (data.valid) {
        setIsTokenValid(true);
        setTokenMessage(data.message);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Lỗi hệ thống. Vui lòng thử lại sau.");
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Mật khẩu phải có ít nhất 8 ký tự");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ hoa");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 chữ thường");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 số");
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");
    }
    
    return errors;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(". "));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsPasswordReset(true);
        toast({
          title: "Mật khẩu đã được thay đổi",
          description: "Bạn có thể đăng nhập với mật khẩu mới",
        });
      } else {
        setError(data.message || "Không thể đặt lại mật khẩu");
      }
    } catch (error) {
      setError("Lỗi hệ thống. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setLocation("/admin-login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[70vh]">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-700">
                Đặt Lại Mật Khẩu
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Tạo mật khẩu mới cho Admin TaxBot Việt
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {isVerifying ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang xác thực token...</p>
                </div>
              ) : !isTokenValid ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  <Button
                    onClick={() => setLocation("/admin-forgot-password")}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Yêu cầu token mới
                  </Button>
                </div>
              ) : isPasswordReset ? (
                <div className="text-center space-y-4">
                  <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-700">
                    Mật khẩu đã được thay đổi!
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Bạn có thể đăng nhập với mật khẩu mới
                  </p>
                  <Button
                    onClick={handleBackToLogin}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Đăng nhập ngay
                  </Button>
                </div>
              ) : (
                <>
                  <Alert>
                    <AlertDescription>
                      <strong>Yêu cầu mật khẩu:</strong><br/>
                      • Ít nhất 8 ký tự<br/>
                      • Có chữ hoa, chữ thường, số và ký tự đặc biệt
                    </AlertDescription>
                  </Alert>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu mới"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="pr-10"
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
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu mới"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pr-10"
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
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Đặt lại mật khẩu
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}