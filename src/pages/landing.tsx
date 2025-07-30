import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Users, Calculator, FileText, Database, Headphones, Star, ArrowRight, Check } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ServicePackages from "@/components/service-packages";
import TaxCalculator from "@/components/tax-calculator";
import { t } from "@/lib/i18n";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Top Free Tax Lookup Banner */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <Link href="/ai-calculator">
              <Button className="bg-transparent text-red-600 hover:bg-yellow-500/20 font-bold px-6 py-2 text-sm border-0 shadow-none transform hover:scale-105 transition-all duration-200 hover:shadow-lg">
                <Calculator className="h-4 w-4 mr-2" />
                <span>TRA CỨU MIỄN PHÍ CHÍNH XÁC THUẾ THU NHẬP CÁ NHÂN</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Special Offer Banner - Red */}
      <section className="bg-red-600 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-300 animate-pulse" />
                <span className="font-bold text-lg">GÓI ĐẶC BIỆT</span>
              </div>
              <div className="font-bold text-yellow-300 text-lg mt-1">CHỈ 1 TRIỆU/THÁNG</div>
              <div className="text-xs mt-1">Bao gồm phần mềm MISA + Kế toán chuyên nghiệp</div>
            </div>
            
            <Link href="/registration">
              <Button className="bg-white text-red-600 hover:bg-gray-100 font-bold px-6 py-2 transform hover:scale-105 transition-all duration-200 hover:shadow-lg">
                ĐĂNG KÝ NGAY
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Super Special Offer Banner - Orange (Simple & Compact) */}
      <section className="py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-6 text-center shadow-lg">
            <div className="flex items-center justify-center mb-3">
              <Star className="h-6 w-6 text-yellow-300 mr-2 animate-sparkle" />
              <h2 className="text-xl font-bold text-white animate-bounce">GÓI ĐẶC BIỆT - SIÊU TIẾT KIỆM</h2>
              <Star className="h-6 w-6 text-yellow-300 ml-2 animate-sparkle" />
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-bold text-yellow-300 mb-1 animate-pulse">1 TRIỆU/THÁNG</div>
              <div className="text-sm text-white opacity-90">Bao gồm MISA Basic (trị giá 3-5 triệu/năm)</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/registration">
                <Button className="bg-white text-orange-600 hover:bg-gray-100 font-bold px-6 py-2 text-base rounded-lg shadow-md transform hover:scale-105 transition-all duration-200 hover:shadow-xl">
                  ĐĂNG KÝ NGAY →
                </Button>
              </Link>
              
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-300">🎁</span>
                  <span className="font-bold">TẶNG MIỄN PHÍ: Phần mềm MISA Basic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Service Overview */}
      <section className="py-8 bg-white border-b-2 border-accent-orange relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Individual/Household Package */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200">
              <div className="text-center mb-4">
                <div className="inline-flex items-center space-x-2 bg-trust-green text-white px-4 py-2 rounded-full mb-3">
                  <Users className="h-5 w-5" />
                  <span className="font-bold">CÁ NHÂN / HỘ KINH DOANH</span>
                </div>
                <h3 className="text-2xl font-bold text-pro-gray mb-2">
                  CHỈ <span className="text-trust-green">300.000đ/tháng</span>
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Dành cho cá nhân kinh doanh và hộ kinh doanh
                </p>
                <div className="grid grid-cols-1 gap-2 text-left">
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    <span>Lập báo cáo thuế GTGT, TNCN</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    <span>Hướng dẫn kê khai online</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-600 mr-2" />
                    <span>Nhắc hạn và hỗ trợ đóng thuế</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Business Package */}
            <div className="bg-gradient-to-r from-accent-orange/10 to-trust-green/10 rounded-2xl p-6 border-2 border-accent-orange">
              <div className="text-center mb-4">
                <div className="inline-flex items-center space-x-2 bg-accent-orange text-white px-4 py-2 rounded-full mb-3">
                  <Star className="h-5 w-5" />
                  <span className="font-bold">GÓI DOANH NGHIỆP SIÊU TIẾT KIỆM</span>
                </div>
                <h3 className="text-2xl font-bold text-pro-gray mb-2">
                  CHỈ <span className="text-accent-orange">1.000.000đ/tháng có cả MISA</span>
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Dành cho mọi loại hình kinh doanh • Hợp đồng tối thiểu 12 tháng
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div className="text-center">
                      <p className="font-bold text-blue-900 text-sm">PHẦN MỀM MISA CHUẨN LUẬT THUẾ VIỆT NAM</p>
                      <p className="text-xs text-blue-700">Tuân thủ 100% quy định pháp luật</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          


          {/* Contact Information */}
          <div className="mt-6 text-center bg-gray-50 rounded-lg p-4">
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
              <a href="tel:0903496118" className="flex items-center space-x-2 text-accent-orange hover:text-accent-orange/80">
                <Headphones className="h-4 w-4" />
                <span className="font-medium">Hotline: 0903 496 118</span>
              </a>
              <span className="text-gray-400">•</span>
              <a href="mailto:contact@taxbot.vn" className="text-blue-600 hover:text-blue-800">Email: contact@taxbot.vn</a>
              <span className="text-gray-400">•</span>
              <a href="https://7dd3a7cf-ed13-4c79-95d8-772d1b1fd878.picard.prod.repl.run" target="_blank" rel="noopener noreferrer" className="text-trust-green hover:text-trust-green/80">Website: taxbot.vn</a>
            </div>
          </div>
        </div>
      </section>



      {/* MISA Software Highlight Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-green-50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full">
                  <Shield className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-blue-900 mb-4">
                PHẦN MỀM MISA CHUẨN LUẬT THUẾ VIỆT NAM
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Gói Siêu Tiết Kiệm bao gồm phần mềm kế toán MISA Basic được phát triển và cập nhật 
                theo 100% quy định pháp luật thuế Việt Nam hiện hành
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <Check className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Tuân thủ Thông tư 200/2014</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <Check className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Cập nhật tự động theo luật mới</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <Check className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Hỗ trợ tất cả loại hình DN</span>
                </div>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-blue-800 font-medium">
                  💡 Chỉ có trong gói Siêu Tiết Kiệm - Tiết kiệm hàng triệu đồng chi phí mua phần mềm riêng lẻ
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section className="py-12 sm:py-16 bg-gray-50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4 uppercase">
              {t('servicePackages')}
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('servicePackagesDesc')}
            </p>
          </div>
          
          <ServicePackages />
          

        </div>
      </section>

      {/* Fee Information */}
      <section className="py-6 bg-gray-100 border-t relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Phí phát sinh:</span> Nhập xuất chứng từ theo yêu cầu khách hàng
            </p>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Floating Action Button for Special Package */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link href="/registration">
          <Button className="bg-accent-orange hover:bg-accent-orange/90 text-white rounded-full px-3 py-3 shadow-2xl animate-bounce transform hover:scale-110 transition-all duration-300 hover:shadow-3xl">
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-bold leading-tight whitespace-nowrap">GÓI ĐẶC BIỆT + MISA</span>
              <span className="text-xs font-bold leading-tight">1 TRIỆU/THÁNG</span>
            </div>
          </Button>
        </Link>
      </div>
    </div>
  );
}