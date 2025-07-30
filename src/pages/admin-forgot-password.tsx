import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function AdminForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSendResetEmail = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/admin-forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsEmailSent(true);
        toast({
          title: "Email đã được gửi",
          description: "Vui lòng kiểm tra email để đặt lại mật khẩu",
        });
      } else {
        setError(data.message || "Không thể gửi email reset password");
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
                Quên Mật Khẩu Admin
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Khôi phục mật khẩu Admin TaxBot Việt
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {!isEmailSent ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-blue-900">
                          Khôi phục qua Email
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Email khôi phục sẽ được gửi đến:<br/>
                          <strong>taxbotviet@gmail.com</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <Button
                      onClick={handleSendResetEmail}
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Đang gửi email...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Gửi Email Khôi Phục
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleBackToLogin}
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Quay lại đăng nhập
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-700 mb-2">
                      Email đã được gửi!
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Chúng tôi đã gửi link khôi phục mật khẩu đến:<br/>
                      <strong>taxbotviet@gmail.com</strong>
                    </p>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Hướng dẫn:</strong><br/>
                      1. Kiểm tra email (cả thư mục spam)<br/>
                      2. Click vào link trong email<br/>
                      3. Tạo mật khẩu mới<br/>
                      4. Đăng nhập với mật khẩu mới
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button
                      onClick={handleSendResetEmail}
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      Gửi lại email
                    </Button>

                    <Button
                      onClick={handleBackToLogin}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Quay lại đăng nhập
                    </Button>
                  </div>
                </>
              )}

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  <strong>Lưu ý bảo mật:</strong><br/>
                  Link khôi phục có hiệu lực 15 phút và chỉ sử dụng một lần
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}