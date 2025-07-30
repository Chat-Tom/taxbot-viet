import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertContactInquirySchema, type InsertContactInquiry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { t } from "@/lib/i18n";

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<InsertContactInquiry>({
    resolver: zodResolver(insertContactInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceInterest: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContactInquiry) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gửi thành công!",
        description: "Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Gửi thất bại",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertContactInquiry) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      


      {/* Contact Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Gửi Yêu Cầu Tư Vấn</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ tên</Label>
                        <Input
                          id="name"
                          {...form.register("name")}
                          className="focus:border-gov-blue focus:ring-gov-blue/20"
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email")}
                          className="focus:border-gov-blue focus:ring-gov-blue/20"
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...form.register("phone")}
                        className="focus:border-gov-blue focus:ring-gov-blue/20"
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="serviceInterest">Dịch vụ quan tâm</Label>
                      <Select onValueChange={(value) => form.setValue("serviceInterest", value)}>
                        <SelectTrigger className="focus:border-gov-blue focus:ring-gov-blue/20">
                          <SelectValue placeholder="Chọn dịch vụ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Business Package (300.000₫/tháng)</SelectItem>
                          <SelectItem value="supersaver">Super Saver Package (1.000.000₫/tháng)</SelectItem>
                          <SelectItem value="custom">Custom Package (1.500.000₫/tháng)</SelectItem>
                          <SelectItem value="consultation">Tư vấn thuế</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Tin nhắn</Label>
                      <Textarea
                        id="message"
                        rows={4}
                        {...form.register("message")}
                        className="focus:border-gov-blue focus:ring-gov-blue/20 resize-none"
                        placeholder="Mô tả nhu cầu khác của bạn..."
                      />
                      {form.formState.errors.message && (
                        <p className="text-sm text-red-500">{form.formState.errors.message.message}</p>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={contactMutation.isPending}
                      className="w-full bg-gov-blue text-white py-3 px-6 rounded-lg font-semibold hover:bg-gov-blue/90 transition-colors"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {contactMutation.isPending ? t('loading') : "Gửi Yêu Cầu"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Thông Tin Liên Hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gov-blue mt-1" />
                    <div>
                      <p className="text-sm font-medium text-pro-gray">Hotline</p>
                      <p className="text-sm text-gray-600">0903 496 118</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-gov-blue mt-1" />
                    <div>
                      <p className="text-sm font-medium text-pro-gray">Email</p>
                      <p className="text-sm text-gray-600">contact@taxbot.vn</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gov-blue mt-1" />
                    <div>
                      <p className="text-sm font-medium text-pro-gray">Website</p>
                      <p className="text-sm text-gray-600">taxbot.vn</p>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
