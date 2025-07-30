import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function CustomerForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/customer-forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-md mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Quên mật khẩu</CardTitle>
            <p className="text-gray-600">Khôi phục tài khoản TaxBot Việt</p>
          </CardHeader>
          
          <CardContent>
            {!isEmailSent ? (
              <>
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Nhập email của bạn để nhận liên kết đặt lại mật khẩu
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Đang gửi..." : "Gửi email khôi phục"}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <button
                    onClick={() => setLocation("/customer-login")}
                    className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Quay lại đăng nhập
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Email đã được gửi!
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Chúng tôi đã gửi link khôi phục mật khẩu đến <br/>
                  <strong>{email}</strong>
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-amber-800 mb-2">Hướng dẫn:</h4>
                  <ol className="text-sm text-amber-700 text-left space-y-1">
                    <li>1. Kiểm tra email (có thể ở thư mục spam)</li>
                    <li>2. Click vào link trong email</li>
                    <li>3. Tạo mật khẩu mới</li>
                    <li>4. Đăng nhập với mật khẩu mới</li>
                  </ol>
                </div>

                <Button 
                  onClick={() => setLocation("/customer-login")}
                  className="w-full"
                >
                  Quay lại đăng nhập
                </Button>
                
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setIsEmailSent(false);
                      setEmail("");
                      setError("");
                    }}
                    className="text-sm text-gray-600 hover:text-gray-700 underline"
                  >
                    Gửi lại email
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong>Lưu ý bảo mật:</strong><br/>
                Link khôi phục có hiệu lực 15 phút và chỉ sử dụng một lần
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}