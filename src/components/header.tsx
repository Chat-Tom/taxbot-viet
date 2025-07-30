import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Calculator, Globe, LogIn, Menu, X } from "lucide-react";
import { t, setLanguage, getLanguage } from "@/lib/i18n";

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getLanguage());

  const toggleLanguage = () => {
    const newLang = currentLang === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    setCurrentLang(newLang);
    window.location.reload(); // Reload to apply language changes
  };

  const navigationItems = [
    { path: "/", label: "Trang chủ", labelEn: "Home" },
    { path: "/ai-calculator", label: "Tra cứu và hỏi đáp thuế thông minh AI", labelEn: "AI Tax Calculator" },
    { path: "/contact", label: "Liên hệ", labelEn: "Contact" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 z-fold-external foldable-compact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 z-fold-external foldable-compact">
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo-brand.png" 
              alt="TaxBot VietNam" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-600">TaxBot</h1>
              <p className="text-xs text-gray-500">Giải pháp thuế thông minh</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-md px-3 py-2 rounded-lg hover:text-blue-600 ${
                  location === item.path
                    ? "text-blue-600 bg-blue-50"
                    : "text-blue-500 hover:bg-blue-50"
                }`}
              >
                {currentLang === 'vi' ? item.label : item.labelEn}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Globe icon removed as requested */}
            
            <Link href="/customer-login">
              <Button size="sm" className="bg-vietnam-red hover:bg-vietnam-red/90 text-white transform hover:scale-105 transition-all duration-200 hover:shadow-lg">
                <span className="hidden sm:inline">Đăng nhập</span>
                <span className="sm:hidden">Đăng nhập</span>
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <nav className="pt-4 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-3 py-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-md rounded-lg hover:text-blue-600 ${
                    location === item.path
                      ? "text-blue-600 bg-blue-50"
                      : "text-blue-500 hover:bg-blue-50"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {currentLang === 'vi' ? item.label : item.labelEn}
                </Link>
              ))}
              
              <div className="pt-4 space-y-2 border-t border-gray-200">
                <Link href="/customer-login" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Đăng nhập
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
