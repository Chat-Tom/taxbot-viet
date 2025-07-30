import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Calculator, 
  Users, 
  FileText, 
  MessageSquare, 
  Calendar, 
  DollarSign, 
  LogOut, 
  Settings,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  Bot,
  Bell,
  User,
  Mail,
  Phone,
  Building,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";

// Custom API request function for customer dashboard with JWT token
async function customerApiRequest(method: string, url: string, data?: unknown): Promise<any> {
  const token = localStorage.getItem('taxbot_customer_token');
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return await response.json();
}

// Interfaces
interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessType: string;
  companyName?: string;
  taxCode?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaxCalculation {
  id: string;
  customerId: string;
  taxType: 'TNCN' | 'TNDN' | 'GTGT';
  income: number;
  deductions: number;
  dependents: number;
  taxAmount: number;
  taxRate: number;
  calculatedAt: string;
  saved: boolean;
}

interface TaxReport {
  id: string;
  customerId: string;
  reportType: string;
  period: string;
  status: 'draft' | 'completed' | 'submitted';
  fileUrl?: string;
  createdAt: string;
}

interface AIChat {
  id: string;
  customerId: string;
  question: string;
  answer: string;
  category: string;
  helpful: boolean | null;
  createdAt: string;
}

interface TaxReminder {
  id: string;
  customerId: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // States
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCalculation, setSelectedCalculation] = useState<TaxCalculation | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [profileFormData, setProfileFormData] = useState<Partial<CustomerProfile>>({});

  // Mutations
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/customer-logout', { 
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem('taxbot_customer_token');
      setLocation('/customer-login');
      toast({
        title: "Đăng xuất thành công",
        description: "Bạn đã đăng xuất khỏi hệ thống.",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi đăng xuất",
        description: "Có lỗi xảy ra khi đăng xuất.",
        variant: "destructive",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<CustomerProfile>) => {
      return await customerApiRequest('PUT', '/api/customer-profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin cá nhân đã được cập nhật.",
      });
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ['/api/customer-profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message || "Có lỗi xảy ra khi cập nhật thông tin.",
        variant: "destructive",
      });
    }
  });

  const askAIMutation = useMutation({
    mutationFn: async (question: string) => {
      return await customerApiRequest('POST', '/api/ai-tax-question', { question });
    },
    onSuccess: () => {
      toast({
        title: "Đã gửi câu hỏi",
        description: "AI đang xử lý câu hỏi của bạn.",
      });
      setNewQuestion("");
      queryClient.invalidateQueries({ queryKey: ['/api/customer-ai-chats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi gửi câu hỏi",
        description: error.message || "Có lỗi xảy ra khi gửi câu hỏi.",
        variant: "destructive",
      });
    }
  });

  // Queries với customerApiRequest
  const { data: customerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/customer-profile'],
    queryFn: () => customerApiRequest('GET', '/api/customer-profile'),
    retry: false,
  });

  // Fallback for development - ensure proper typing
  const profileData = customerProfile || {
    firstName: "Khách hàng",
    lastName: "TaxBot",
    email: "customer@taxbot.vn",
    phone: "0903496118",
    businessType: "individual"
  };

  const { data: taxCalculations, isLoading: calculationsLoading } = useQuery({
    queryKey: ['/api/customer-tax-calculations'],
    queryFn: () => customerApiRequest('GET', '/api/customer-tax-calculations'),
    retry: false,
  });

  const { data: taxReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/customer-tax-reports'],
    queryFn: () => customerApiRequest('GET', '/api/customer-tax-reports'),
    retry: false,
  });

  const { data: aiChats, isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/customer-ai-chats'],
    queryFn: () => customerApiRequest('GET', '/api/customer-ai-chats'),
    retry: false,
  });

  const { data: taxReminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['/api/customer-tax-reminders'],
    queryFn: () => customerApiRequest('GET', '/api/customer-tax-reminders'),
    retry: false,
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/customer-dashboard-stats'],
    queryFn: () => customerApiRequest('GET', '/api/customer-dashboard-stats'),
    retry: false,
  });

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('taxbot_customer_token');
    if (!token) {
      setLocation('/customer-login');
    }
  }, [setLocation]);

  // Initialize profile data for editing
  useEffect(() => {
    if (customerProfile && editingProfile) {
      setProfileFormData(customerProfile);
    }
  }, [customerProfile, editingProfile]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(profileFormData);
  };

  const handleAskAI = () => {
    if (newQuestion.trim()) {
      askAIMutation.mutate(newQuestion.trim());
    }
  };

  const getBusinessTypeDisplay = (type: string) => {
    const types = {
      'personal': 'Cá nhân',
      'individual': 'Cá nhân (300k/tháng)',
      'supersaver': 'Tiết kiệm (1M/tháng)', 
      'custom': 'Tùy chỉnh (1.5M/tháng)',
      'enterprise': 'Doanh nghiệp'
    };
    return types[type] || type;
  };

  const getTaxTypeDisplay = (type: string) => {
    const types = {
      'TNCN': 'Thuế thu nhập cá nhân',
      'TNDN': 'Thuế thu nhập doanh nghiệp',
      'GTGT': 'Thuế giá trị gia tăng'
    };
    return types[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bảng Điều Khiển Khách Hàng</h1>
              <p className="text-sm text-gray-600">
                Xin chào, {profileData.firstName} {profileData.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation('/ai-calculator')}
                className="hidden sm:flex"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Tính Thuế AI
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="calculations">Tính thuế</TabsTrigger>
            <TabsTrigger value="reports">Báo cáo</TabsTrigger>
            <TabsTrigger value="ai-chat">Tư vấn AI</TabsTrigger>
            <TabsTrigger value="reminders">Nhắc nhở</TabsTrigger>
            <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tính thuế tháng này</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboardStats?.calculations?.thisMonth || 0}
                      </p>
                    </div>
                    <Calculator className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Báo cáo đã tạo</p>
                      <p className="text-2xl font-bold text-green-600">
                        {dashboardStats?.reports?.total || 0}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Câu hỏi AI</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {dashboardStats?.aiChats?.total || 0}
                      </p>
                    </div>
                    <Bot className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tiết kiệm thuế</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatCurrency(dashboardStats?.taxSaved || 0)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Tính thuế gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {calculationsLoading ? (
                    <div className="text-center py-4">Đang tải...</div>
                  ) : (
                    <div className="space-y-3">
                      {taxCalculations?.slice(0, 5).map((calc: TaxCalculation) => (
                        <div key={calc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{getTaxTypeDisplay(calc.taxType)}</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(calc.calculatedAt), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{formatCurrency(calc.taxAmount)}</p>
                            <p className="text-sm text-gray-600">{calc.taxRate}%</p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">
                          Chưa có tính thuế nào
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Nhắc nhở thuế
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {remindersLoading ? (
                    <div className="text-center py-4">Đang tải...</div>
                  ) : (
                    <div className="space-y-3">
                      {taxReminders?.filter((r: TaxReminder) => !r.completed).slice(0, 5).map((reminder: TaxReminder) => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                          <div>
                            <p className="font-medium">{reminder.title}</p>
                            <p className="text-sm text-gray-600">{reminder.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={reminder.priority === 'high' ? 'destructive' : 'secondary'}>
                              {reminder.priority === 'high' ? 'Cao' : reminder.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">
                              {format(new Date(reminder.dueDate), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                      )) || (
                        <p className="text-gray-500 text-center py-4">
                          Không có nhắc nhở nào
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tax Calculations Tab */}
          <TabsContent value="calculations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Lịch sử tính thuế</h2>
              <Button onClick={() => setLocation('/ai-calculator')}>
                <Plus className="w-4 h-4 mr-2" />
                Tính thuế mới
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                {calculationsLoading ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại thuế</TableHead>
                        <TableHead>Thu nhập</TableHead>
                        <TableHead>Khấu trừ</TableHead>
                        <TableHead>Thuế phải nộp</TableHead>
                        <TableHead>Thuế suất</TableHead>
                        <TableHead>Ngày tính</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxCalculations?.map((calc: TaxCalculation) => (
                        <TableRow key={calc.id}>
                          <TableCell>{getTaxTypeDisplay(calc.taxType)}</TableCell>
                          <TableCell>{formatCurrency(calc.income)}</TableCell>
                          <TableCell>{formatCurrency(calc.deductions)}</TableCell>
                          <TableCell className="font-bold text-red-600">
                            {formatCurrency(calc.taxAmount)}
                          </TableCell>
                          <TableCell>{calc.taxRate}%</TableCell>
                          <TableCell>{format(new Date(calc.calculatedAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCalculation(calc)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            Chưa có tính thuế nào. <br />
                            <Button variant="link" onClick={() => setLocation('/ai-calculator')}>
                              Bắt đầu tính thuế ngay
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Báo cáo thuế</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tạo báo cáo mới
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                {reportsLoading ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại báo cáo</TableHead>
                        <TableHead>Kỳ báo cáo</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxReports?.map((report: TaxReport) => (
                        <TableRow key={report.id}>
                          <TableCell>{report.reportType}</TableCell>
                          <TableCell>{report.period}</TableCell>
                          <TableCell>
                            <Badge variant={
                              report.status === 'completed' ? 'default' :
                              report.status === 'submitted' ? 'secondary' : 'outline'
                            }>
                              {report.status === 'completed' ? 'Hoàn thành' :
                               report.status === 'submitted' ? 'Đã nộp' : 'Nháp'}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(report.createdAt), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Chưa có báo cáo nào
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="ai-chat" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tư vấn AI</h2>
            </div>

            {/* Ask Question */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bot className="w-5 h-5 mr-2" />
                    Hỏi TaxBot AI
                  </div>
                  {/* Customer Info */}
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-2">
                        {profileData.firstName?.charAt(0) || 'K'}
                      </div>
                      <span>{profileData.firstName} {profileData.lastName}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      <span>{profileData.phone}</span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Nhập câu hỏi về thuế của bạn..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAskAI}
                    disabled={!newQuestion.trim() || askAIMutation.isPending}
                  >
                    {askAIMutation.isPending ? "Đang gửi..." : "Gửi câu hỏi"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chat History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lịch sử hỏi đáp</span>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    📅 Tự động xóa sau 30 ngày
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chatsLoading ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : (
                  <div className="space-y-4">
                    {aiChats && aiChats.length > 0 ? (
                      aiChats.map((chat: AIChat) => (
                        <div key={chat.id} className="border rounded-lg p-4">
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{chat.category}</Badge>
                              <span className="text-sm text-gray-500">
                                {format(new Date(chat.createdAt), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900">Q: {chat.question}</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-gray-800 whitespace-pre-wrap">A: {chat.answer}</p>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                👍 Hữu ích
                              </Button>
                              <Button size="sm" variant="outline">
                                👎 Không hữu ích
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Chưa có câu hỏi nào. Hãy bắt đầu hỏi AI ngay!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Nhắc nhở thuế</h2>
            </div>

            <Card>
              <CardContent className="p-6">
                {remindersLoading ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : (
                  <div className="space-y-4">
                    {taxReminders?.map((reminder: TaxReminder) => (
                      <div key={reminder.id} className={`p-4 rounded-lg border-l-4 ${
                        reminder.priority === 'high' ? 'bg-red-50 border-red-400' :
                        reminder.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-blue-50 border-blue-400'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{reminder.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              Hạn: {format(new Date(reminder.dueDate), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              reminder.priority === 'high' ? 'destructive' :
                              reminder.priority === 'medium' ? 'default' : 'secondary'
                            }>
                              {reminder.priority === 'high' ? 'Cao' : 
                               reminder.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                            </Badge>
                            {reminder.completed && (
                              <Badge variant="outline">Hoàn thành</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">
                        Không có nhắc nhở nào
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Thông tin cá nhân</h2>
              <Button
                onClick={() => setEditingProfile(!editingProfile)}
                variant={editingProfile ? "outline" : "default"}
              >
                {editingProfile ? (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Hủy chỉnh sửa
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingProfile ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Họ</Label>
                          <Input
                            id="firstName"
                            value={profileData.firstName || ''}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Tên</Label>
                          <Input
                            id="lastName"
                            value={profileData.lastName || ''}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email || ''}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          value={profileData.phone || ''}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessType">Loại hình</Label>
                        <Select 
                          value={profileData.businessType || ''} 
                          onValueChange={(value) => setProfileData({...profileData, businessType: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại hình" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Cá nhân (300k/tháng)</SelectItem>
                            <SelectItem value="supersaver">Tiết kiệm (1M/tháng)</SelectItem>
                            <SelectItem value="custom">Tùy chỉnh (1.5M/tháng)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={updateProfileMutation.isPending}
                        className="w-full"
                      >
                        {updateProfileMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{customerProfile?.firstName} {customerProfile?.lastName}</p>
                          <p className="text-sm text-gray-600">Tên đầy đủ</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{customerProfile?.email}</p>
                          <p className="text-sm text-gray-600">Email</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{customerProfile?.phone}</p>
                          <p className="text-sm text-gray-600">Số điện thoại</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{getBusinessTypeDisplay(customerProfile?.businessType)}</p>
                          <p className="text-sm text-gray-600">Gói dịch vụ</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Thông tin doanh nghiệp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingProfile ? (
                    <>
                      <div>
                        <Label htmlFor="companyName">Tên công ty</Label>
                        <Input
                          id="companyName"
                          value={profileData.companyName || ''}
                          onChange={(e) => setProfileData({...profileData, companyName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taxCode">Mã số thuế</Label>
                        <Input
                          id="taxCode"
                          value={profileData.taxCode || ''}
                          onChange={(e) => setProfileData({...profileData, taxCode: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Địa chỉ</Label>
                        <Input
                          id="address"
                          value={profileData.address || ''}
                          onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">Tỉnh/Thành phố</Label>
                          <Input
                            id="city"
                            value={profileData.city || ''}
                            onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="district">Quận/Huyện</Label>
                          <Input
                            id="district"
                            value={profileData.district || ''}
                            onChange={(e) => setProfileData({...profileData, district: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="ward">Phường/Xã</Label>
                          <Input
                            id="ward"
                            value={profileData.ward || ''}
                            onChange={(e) => setProfileData({...profileData, ward: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{customerProfile?.companyName || 'Chưa cập nhật'}</p>
                          <p className="text-sm text-gray-600">Tên công ty</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{customerProfile?.taxCode || 'Chưa cập nhật'}</p>
                          <p className="text-sm text-gray-600">Mã số thuế</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-medium">Địa chỉ:</p>
                        <p className="text-sm text-gray-600">
                          {customerProfile?.address || 'Chưa cập nhật'}
                          {customerProfile?.ward && `, ${customerProfile.ward}`}
                          {customerProfile?.district && `, ${customerProfile.district}`}
                          {customerProfile?.city && `, ${customerProfile.city}`}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê tài khoản</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats?.calculations?.total || 0}</p>
                    <p className="text-sm text-gray-600">Tổng tính thuế</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{dashboardStats?.reports?.total || 0}</p>
                    <p className="text-sm text-gray-600">Báo cáo đã tạo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{dashboardStats?.aiChats?.total || 0}</p>
                    <p className="text-sm text-gray-600">Câu hỏi AI</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {Math.round(((Date.now() - new Date(customerProfile?.createdAt).getTime()) / (1000 * 60 * 60 * 24)) || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Ngày tham gia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Calculation Detail Modal */}
      {selectedCalculation && (
        <Dialog open={!!selectedCalculation} onOpenChange={() => setSelectedCalculation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết tính thuế</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại thuế</Label>
                  <p className="font-medium">{getTaxTypeDisplay(selectedCalculation.taxType)}</p>
                </div>
                <div>
                  <Label>Ngày tính</Label>
                  <p className="font-medium">
                    {format(new Date(selectedCalculation.calculatedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Thu nhập</Label>
                  <p className="font-medium">{formatCurrency(selectedCalculation.income)}</p>
                </div>
                <div>
                  <Label>Khấu trừ</Label>
                  <p className="font-medium">{formatCurrency(selectedCalculation.deductions)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Số người phụ thuộc</Label>
                  <p className="font-medium">{selectedCalculation.dependents}</p>
                </div>
                <div>
                  <Label>Thuế suất</Label>
                  <p className="font-medium">{selectedCalculation.taxRate}%</p>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <Label>Thuế phải nộp</Label>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(selectedCalculation.taxAmount)}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setSelectedCalculation(null)}>Đóng</Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Tải báo cáo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}