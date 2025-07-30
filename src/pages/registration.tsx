import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, FileText, Headphones, UserPlus, Tag, Lock, CheckCircle, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertCustomerRegistrationSchema, type InsertCustomerRegistration } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { validateVietnamesePhone, getVietnamesePhonePrefixInfo } from "@/lib/vietnam-phone-validator";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { t } from "@/lib/i18n";

export default function Registration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState({ isValid: true, error: '', network: '' });
  
  // Handle phone number validation
  const handlePhoneChange = (phone: string) => {
    const validation = validateVietnamesePhone(phone);
    setPhoneValidation({
      isValid: validation.isValid,
      error: validation.error || '',
      network: validation.network || ''
    });
    form.setValue('phone', phone);
  };
  
  // Đơn giản hóa form chỉ cần 4 field bắt buộc
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      businessType: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Validate phone number before submission
      const phoneValidationResult = validateVietnamesePhone(data.phone);
      if (!phoneValidationResult.isValid) {
        throw new Error(phoneValidationResult.error || "Số điện thoại không hợp lệ");
      }
      
      const response = await apiRequest("POST", "/api/customer-registrations", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Hiển thị thông báo thành công
      setShowSuccess(true);
      
      // Reset form
      form.reset({
        firstName: "",
        lastName: "",
        phone: "",
        businessType: "",
      });
      
      // Reset phone validation
      setPhoneValidation({ isValid: true, error: '', network: '' });
      
      // Cuộn lên đầu trang để xem thông báo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error) => {
      toast({
        title: "Đăng ký thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('heroTitle')}
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center text-gray-700">
                <Shield className="h-5 w-5 text-trust-green mr-2" />
                <span className="text-sm">{t('compliance')}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="h-5 w-5 text-trust-green mr-2" />
                <span className="text-sm">{t('timeSaving')}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 text-trust-green mr-2" />
                <span className="text-sm">{t('trustedBy')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Left Column - Form */}
              <div className="p-8 sm:p-12">
                {/* Success Message Banner */}
                {showSuccess && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="text-xl font-bold text-green-800 mb-2">
                          🎉 Chúc mừng bạn đã đăng ký thành công!
                        </h4>
                        <p className="text-green-700 text-sm leading-relaxed">
                          Đội ngũ <strong>TaxBot Việt</strong> sẽ liên hệ trong <strong>24 giờ</strong> để tư vấn chi tiết và hoàn tất hợp đồng gói dịch vụ.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
                      <p className="text-sm text-green-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Thời gian phản hồi: Trong vòng 24h
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowSuccess(false)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        Đăng ký thêm
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-pro-gray mb-2">
                    Đăng ký gói dịch vụ
                  </h3>
                  <p className="text-gray-600">Chọn gói dịch vụ phù hợp và để lại thông tin liên hệ</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="servicePackage">Chọn gói dịch vụ</Label>
                    <Select onValueChange={(value) => form.setValue("businessType", value)}>
                      <SelectTrigger className="focus:border-gov-blue focus:ring-gov-blue/20">
                        <SelectValue placeholder="Chọn gói dịch vụ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Gói Cá Nhân - 300.000đ/tháng</SelectItem>
                        <SelectItem value="super-saver">Gói Siêu Tiết Kiệm - 1.000.000đ/tháng</SelectItem>
                        <SelectItem value="custom">Gói Tùy Chỉnh - 1.500.000đ/tháng</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.businessType && (
                      <p className="text-sm text-red-500">{form.formState.errors.businessType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại/Zalo</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.watch("phone") || ""}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Nhập số điện thoại VN (10 chữ số)"
                      className={`focus:border-gov-blue focus:ring-gov-blue/20 ${
                        !phoneValidation.isValid && form.watch("phone") ? 'border-red-500' : ''
                      }`}
                    />
                    {!phoneValidation.isValid && form.watch("phone") && (
                      <p className="text-sm text-red-500">{phoneValidation.error}</p>
                    )}
                    {phoneValidation.isValid && phoneValidation.network && form.watch("phone") && (
                      <p className="text-sm text-green-600">✓ {phoneValidation.network} - Số hợp lệ</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Đầu số hợp lệ: Viettel (032-039, 086, 096-098), MobiFone (070, 076-079, 089-090, 093), VinaPhone (081-085, 088, 091, 094), Vietnamobile (052, 056, 058, 092), Gmobile (059, 099), iTel (087)
                    </p>
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-vietnam-red text-white py-3 px-6 rounded-lg font-semibold hover:bg-vietnam-red/90 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {registerMutation.isPending ? 'Đang gửi...' : 'ĐĂNG KÝ NGAY'}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Chúng tôi sẽ liên hệ bạn trong vòng 24h để tư vấn chi tiết
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Column - Benefits */}
              <div className="bg-gray-50 p-8 sm:p-12 rounded-lg">
                <h4 className="text-xl font-bold text-pro-gray mb-6">
                  {t('whyChoose')}
                </h4>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-trust-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-trust-green" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-pro-gray mb-1">{t('legalCompliance')}</h5>
                      <p className="text-sm text-gray-600">{t('legalComplianceDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gov-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Database className="h-5 w-5 text-gov-blue" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-pro-gray mb-1">{t('smartAI')}</h5>
                      <p className="text-sm text-gray-600">{t('smartAIDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-accent-orange/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-accent-orange" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-pro-gray mb-1">{t('documentManagement')}</h5>
                      <p className="text-sm text-gray-600">{t('documentManagementDesc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-trust-green/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Headphones className="h-5 w-5 text-trust-green" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-pro-gray mb-1">{t('support247')}</h5>
                      <p className="text-sm text-gray-600">{t('support247Desc')}</p>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-4">Được tin tưởng bởi:</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-trust-green" />
                      <span className="text-xs text-gray-600">ISO 27001</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-gov-blue" />
                      <span className="text-xs text-gray-600">SSL 256-bit</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-trust-green" />
                      <span className="text-xs text-gray-600">Bộ TT&TT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
