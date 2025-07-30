import { Calculator, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { t } from "@/lib/i18n";

export default function Footer() {
  return (
    <footer className="bg-pro-gray text-white py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo.png" 
                alt="TaxBot VietNam" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-xl font-bold">TaxBot</h1>
                <p className="text-xs text-gray-400">VietNam Tax Assistant</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Giải pháp thuế thông minh cho doanh nghiệp Việt Nam
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('services')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Tính thuế TNCN</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tính thuế TNDN</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tính thuế GTGT</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tư vấn thuế</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kế toán thuế</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="tel:0903496118" className="hover:text-white transition-colors flex items-center">
                  📞 0903 496 118
                </a>
              </li>
              <li>
                <a href="mailto:contact@taxbot.vn" className="hover:text-white transition-colors">
                  ✉️ contact@taxbot.vn
                </a>
              </li>
              <li>
                <a href="https://7dd3a7cf-ed13-4c79-95d8-772d1b1fd878.picard.prod.repl.run" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  🌐 taxbot.vn
                </a>
              </li>
              <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn sử dụng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách hoàn tiền</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bảo mật dữ liệu</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tuân thủ pháp luật</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-600 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2024 TaxBot VietNam. Tất cả quyền được bảo lưu. 
            <span className="mx-2">|</span>
            Giấy phép kinh doanh số: 0123456789
          </p>
        </div>
      </div>
    </footer>
  );
}
