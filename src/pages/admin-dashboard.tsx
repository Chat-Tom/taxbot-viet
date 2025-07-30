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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertTriangle, Activity, Users, Database, Shield, LogOut } from "lucide-react";
import { format } from "date-fns";

// Interfaces
interface CustomerSubmission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessType: string;
  status: string;
  zapierSent: boolean;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SecurityStats {
  rateLimitEntries: number;
  suspiciousIPs: Array<{
    ip: string;
    attempts: number;
    lastAttempt: string;
    blocked: boolean;
    blockedMinutesAgo: number | null;
  }>;
  blockedIPs: number;
  recentActivity: Array<{
    key: string;
    count: number;
    resetTime: string;
  }>;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Check authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("taxbot_admin_token");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  // Fetch data
  const { data: submissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery<CustomerSubmission[]>({
    queryKey: ["/api/customer-registrations"],
    retry: false,
  });

  const { data: analytics, refetch: refetchAnalytics } = useQuery<any>({
    queryKey: ["/api/analytics/registrations"],
    retry: false,
  });

  const { data: securityStats, refetch: refetchSecurity } = useQuery<SecurityStats>({
    queryKey: ["/api/admin/security-stats"],
    retry: false,
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/customer-registrations/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Cập nhật trạng thái thành công" });
      refetchSubmissions();
    },
    onError: (error) => {
      toast({ title: "Lỗi cập nhật trạng thái", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleLogout = () => {
    localStorage.removeItem("taxbot_admin_token");
    setLocation("/admin-login");
  };

  const filteredSubmissions = submissions?.filter((sub: CustomerSubmission) => {
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesSearch = !searchTerm || 
      sub.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  }) || [];

  if (submissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Quản lý hệ thống TaxBot Vietnam</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Tổng đăng ký</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{submissions?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Đang chờ xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {submissions?.filter(s => s.status === "pending").length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Hoàn thành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {submissions?.filter(s => s.status === "completed").length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Tỷ lệ thành công</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {submissions?.length ? Math.round((submissions.filter(s => s.status === "completed").length / submissions.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="customers">Khách hàng</TabsTrigger>
            <TabsTrigger value="security">Bảo mật</TabsTrigger>
            <TabsTrigger value="system">Hệ thống</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Hoạt động gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {submissions?.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{submission.firstName} {submission.lastName}</p>
                          <p className="text-sm text-gray-600">{submission.email}</p>
                        </div>
                        <Badge variant={submission.status === "completed" ? "default" : "secondary"}>
                          {submission.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Thống kê theo gói dịch vụ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics && Object.entries(analytics.packageStats || {}).map(([pkg, count]) => (
                      <div key={pkg} className="flex items-center justify-between">
                        <span className="font-medium">{pkg}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách khách hàng</CardTitle>
                <div className="flex gap-4 mt-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="processing">Đang xử lý</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Tìm kiếm khách hàng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Gói dịch vụ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission: CustomerSubmission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.firstName} {submission.lastName}
                        </TableCell>
                        <TableCell>{submission.email}</TableCell>
                        <TableCell>{submission.phone}</TableCell>
                        <TableCell>{submission.businessType}</TableCell>
                        <TableCell>
                          <Badge variant={submission.status === "completed" ? "default" : "secondary"}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(submission.createdAt), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Select
                            value={submission.status}
                            onValueChange={(value) => handleStatusChange(submission.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Chờ xử lý</SelectItem>
                              <SelectItem value="processing">Đang xử lý</SelectItem>
                              <SelectItem value="completed">Hoàn thành</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredSubmissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Không có khách hàng nào
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {securityStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        IPs bị chặn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {securityStats.blockedIPs}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Rate Limit Entries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {securityStats.rateLimitEntries}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        Hoạt động gần đây
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {securityStats.recentActivity?.length || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {securityStats.suspiciousIPs && securityStats.suspiciousIPs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        IPs đáng ngờ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Số lần thử</TableHead>
                            <TableHead>Lần cuối</TableHead>
                            <TableHead>Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {securityStats.suspiciousIPs.map((ip, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{ip.ip}</TableCell>
                              <TableCell>{ip.attempts}</TableCell>
                              <TableCell>{new Date(ip.lastAttempt).toLocaleString()}</TableCell>
                              <TableCell>
                                {ip.blocked ? (
                                  <Badge variant="destructive">
                                    Bị chặn
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    Theo dõi
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Thông tin hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Trạng thái dịch vụ</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Database</span>
                        <Badge variant="default">Hoạt động</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Zapier Webhook</span>
                        <Badge variant="default">Hoạt động</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Email Service</span>
                        <Badge variant="default">Hoạt động</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Thống kê lưu trữ</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Tổng đăng ký</span>
                        <span className="font-mono">{submissions?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dung lượng JSON</span>
                        <span className="font-mono">~{Math.round((submissions?.length || 0) * 0.5)}KB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}