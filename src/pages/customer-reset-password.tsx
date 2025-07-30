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

export default function CustomerResetPassword() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/customer/reset-password");
  const { toast } = useToast();
  
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
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

  // Extract token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  // Verify token when component mounts
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      setIsVerifying(true);
      const response = await fetch(`/api/customer-verify-reset-token/${token}`);
      const data = await response.json();
      
      setIsTokenValid(data.valid);
      setTokenMessage(data.message);
      
      if (data.valid && data.email) {
        setEmail(data.email);
      }
    } catch (error) {
      setIsTokenValid(false);
      setTokenMessage("Lỗi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      setIsLoading(false);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setError("Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/customer-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsPasswordReset(true);
        toast({
          title: "Đặt lại mật khẩu thành công",
          description: "Bạn có thể đăng nhập bằng mật khẩu mới",
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

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12">
          <Card className="shadow-lg">
            <CardContent className="text-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang xác thực token...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Token không hợp lệ</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {tokenMessage}
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => setLocation("/customer-forgot-password")}
                className="w-full"
              >
                Yêu cầu reset mật khẩu mới
              </Button>
              
              <div className="mt-4">
                <button
                  onClick={() => setLocation("/customer-login")}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-800">
                Mật khẩu đã được thay đổi!
              </CardTitle>
              <p className="text-gray-600">Bạn có thể đăng nhập với mật khẩu mới</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setLocation("/customer-login")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Đăng nhập ngay
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Đặt lại mật khẩu</CardTitle>
            <p className="text-gray-600">Tạo mật khẩu mới cho {email}</p>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Tạo mật khẩu mạnh:</strong> Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
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
                {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setLocation("/customer-login")}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Quay lại đăng nhập
              </button>
            </div>

            <div className="mt-6 text-center bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong>Lưu ý bảo mật:</strong><br/>
                Token này có hiệu lực 15 phút và chỉ sử dụng được một lần
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}