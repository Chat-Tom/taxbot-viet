import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, User, Building, Receipt } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import TaxCalculator from "@/components/tax-calculator";
import { t } from "@/lib/i18n";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gov-blue to-trust-green py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t('taxCalculator')}
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {t('taxCalculatorDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="personal" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Thuế TNCN</span>
              </TabsTrigger>
              <TabsTrigger value="corporate" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Thuế TNDN</span>
              </TabsTrigger>
              <TabsTrigger value="vat" className="flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Thuế GTGT</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <TaxCalculator />
            </TabsContent>

            <TabsContent value="corporate">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Tính Thuế Thu Nhập Doanh Nghiệp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      Tính năng tính thuế TNDN sẽ sớm được cập nhật. 
                      Vui lòng đăng ký để nhận thông báo khi có tính năng mới.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vat">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Tính Thuế Giá Trị Gia Tăng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      Tính năng tính thuế GTGT sẽ sớm được cập nhật. 
                      Vui lòng đăng ký để nhận thông báo khi có tính năng mới.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
