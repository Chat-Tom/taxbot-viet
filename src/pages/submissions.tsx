import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, Users, Clock, Database, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/header";
import Footer from "@/components/footer";

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

export default function Submissions() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<CustomerSubmission | null>(null);

  // Fetch submissions
  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ["/api/customer-registrations"],
    retry: false,
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics/registrations"],
    retry: false,
  });

  // Update submission status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/customer-registrations/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/registrations"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    },
  });

  // Cleanup old submissions
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cleanup-old-submissions", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup thành công",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/registrations"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cleanup dữ liệu",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Mới';
      case 'contacted': return 'Đã liên hệ';
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Ngưng hoạt động';
      default: return status;
    }
  };

  const getBusinessTypeText = (businessType: string) => {
    switch (businessType) {
      case 'individual': return 'Cá nhân/Hộ KD (300k)';
      case 'supersaver': return 'Siêu Tiết Kiệm (1M)';
      case 'custom': return 'Tùy Chỉnh (1.5M)';
      default: return businessType;
    }
  };

  const filteredSubmissions = Array.isArray(submissions) 
    ? submissions.filter((sub: CustomerSubmission) => 
        selectedStatus === 'all' || sub.status === selectedStatus
      ) 
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Đăng Ký Khách Hàng</h1>
            <p className="text-gray-600 mt-2">Lưu trữ trong submissions.json - Tự động xóa sau 30 ngày</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => cleanupMutation.mutate()}
              variant="outline"
              className="flex items-center gap-2"
              disabled={cleanupMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Cleanup
            </Button>
            <Button
              onClick={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ["/api/analytics/registrations"] });
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics as any)?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Trong vòng 30 ngày
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ liên hệ</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics as any)?.byStatus?.new || 0}</div>
              <p className="text-xs text-muted-foreground">
                Cần xử lý
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zapier sync</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics as any)?.integrationStats?.zapierSent || 0}</div>
              <p className="text-xs text-muted-foreground">
                Đã gửi Google Sheets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lưu trữ</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">30 ngày</div>
              <p className="text-xs text-muted-foreground">
                Tự động xóa dữ liệu cũ
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Danh sách đăng ký (JSON Storage)</CardTitle>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="new">Mới</SelectItem>
                  <SelectItem value="contacted">Đã liên hệ</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngưng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Gói dịch vụ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Tích hợp</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission: CustomerSubmission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{submission.firstName} {submission.lastName}</p>
                        <p className="text-sm text-gray-600">{submission.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{submission.phone}</TableCell>
                    <TableCell>{getBusinessTypeText(submission.businessType)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusText(submission.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(submission.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className={submission.zapierSent ? "text-green-600" : "text-gray-400"}>
                          Zapier: {submission.zapierSent ? "✅" : "❌"}
                        </div>
                        <div className={submission.emailSent ? "text-green-600" : "text-gray-400"}>
                          Email: {submission.emailSent ? "✅" : "❌"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            Chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Chi tiết đăng ký - {submission.firstName} {submission.lastName}</DialogTitle>
                          </DialogHeader>
                          {selectedSubmission && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">ID:</label>
                                  <p className="text-sm text-gray-600">{selectedSubmission.id}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Tạo lúc:</label>
                                  <p className="text-sm text-gray-600">
                                    {new Date(selectedSubmission.createdAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Họ tên:</label>
                                <p>{selectedSubmission.firstName} {selectedSubmission.lastName}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Liên hệ:</label>
                                <p>{selectedSubmission.phone}</p>
                                <p className="text-sm text-gray-600">{selectedSubmission.email}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Gói dịch vụ:</label>
                                <p>{getBusinessTypeText(selectedSubmission.businessType)}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Thay đổi trạng thái:</label>
                                <Select
                                  value={selectedSubmission.status}
                                  onValueChange={(status) => {
                                    updateStatusMutation.mutate({
                                      id: selectedSubmission.id,
                                      status
                                    });
                                    setSelectedSubmission({
                                      ...selectedSubmission,
                                      status
                                    });
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">Mới</SelectItem>
                                    <SelectItem value="contacted">Đã liên hệ</SelectItem>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Ngưng</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">Tích hợp hệ thống:</h4>
                                <div className="space-y-1 text-sm">
                                  <p>Zapier: {selectedSubmission.zapierSent ? "✅ Đã gửi" : "❌ Chưa gửi"}</p>
                                  <p>Email: {selectedSubmission.emailSent ? "✅ Đã gửi" : "❌ Chưa gửi"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Không có dữ liệu đăng ký
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}