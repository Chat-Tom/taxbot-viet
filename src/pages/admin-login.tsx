import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call admin login API
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store admin token
        localStorage.setItem('taxbot_admin_token', data.token);
        
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng Admin TaxBot Việt!",
        });
        
        // Redirect to admin dashboard
        setLocation("/admin-dashboard");
      } else {
        setError(data.message || "Tên đăng nhập hoặc mật khẩu không đúng");
      }
    } catch (error) {
      setError("Lỗi hệ thống. Vui lòng thử lại.");
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
            <div className="mx-auto w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin TaxBot Việt</CardTitle>
            <p className="text-gray-600">Đăng nhập quản trị hệ thống</p>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Khu vực bảo mật:</strong> Chỉ dành cho quản trị viên hệ thống
              </AlertDescription>
            </Alert>

            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ 
                    ...prev, 
                    username: e.target.value 
                  }))}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="TaxBot@VN2025!"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ 
                      ...prev, 
                      password: e.target.value 
                    }))}
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

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? "Đang xác thực..." : "Đăng nhập Admin"}
              </Button>
            </form>

            <div className="text-center mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
              <button
                type="button"
                onClick={() => setLocation("/admin-forgot-password")}
                className="text-sm text-red-600 hover:text-red-700 underline font-semibold"
                style={{ 
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  textDecoration: 'underline'
                }}
              >
                🔑 Quên mật khẩu?
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Thông tin đăng nhập mặc định:<br/>
                <strong>Tên đăng nhập:</strong> admin<br/>
                <strong>Mật khẩu:</strong> TaxBot@VN2025!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}