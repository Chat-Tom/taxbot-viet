import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, Info } from "lucide-react";
import { calculatePersonalIncomeTax, formatCurrency, formatPercent, type PersonalIncomeTaxResult } from "@/lib/tax-calculator";
import { t } from "@/lib/i18n";

export default function TaxCalculator() {
  const [input, setInput] = useState({
    monthlyIncome: 15000000,
    dependents: 2,
    insurance: 1500000,
  });
  
  const [result, setResult] = useState<PersonalIncomeTaxResult | null>(null);

  const handleCalculate = () => {
    const calculationResult = calculatePersonalIncomeTax(input);
    setResult(calculationResult);
  };

  const handleInputChange = (field: keyof typeof input, value: string) => {
    setInput(prev => ({
      ...prev,
      [field]: parseInt(value.replace(/\D/g, '')) || 0
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Interface */}
        <div>
          <h4 className="text-lg font-semibold text-pro-gray mb-6 flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            {t('personalIncomeTax')}
          </h4>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome" className="text-sm font-medium text-gray-700">
                {t('monthlyIncome')}
              </Label>
              <Input
                id="monthlyIncome"
                type="text"
                value={input.monthlyIncome.toLocaleString('vi-VN')}
                onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none"
                placeholder="15,000,000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dependents" className="text-sm font-medium text-gray-700">
                {t('dependents')}
              </Label>
              <Input
                id="dependents"
                type="number"
                value={input.dependents}
                onChange={(e) => handleInputChange('dependents', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none"
                placeholder="2"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="insurance" className="text-sm font-medium text-gray-700">
                {t('monthlyInsurance')}
              </Label>
              <Input
                id="insurance"
                type="text"
                value={input.insurance.toLocaleString('vi-VN')}
                onChange={(e) => handleInputChange('insurance', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none"
                placeholder="1,500,000"
              />
            </div>
            
            <Button
              onClick={handleCalculate}
              className="w-full bg-accent-orange text-white py-3 px-6 rounded-lg font-semibold hover:bg-accent-orange/90 transition-colors"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {t('calculateNow')}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-pro-gray mb-6">Kết Quả Tính Thuế</h4>
          
          {result ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Thu nhập chịu thuế:</span>
                <span className="font-semibold text-pro-gray">
                  {formatCurrency(result.taxableIncome)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Thuế suất hiệu lực:</span>
                <span className="font-semibold text-pro-gray">
                  {formatPercent(result.taxRate)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">Thuế TNCN:</span>
                <span className="font-semibold text-accent-orange">
                  {formatCurrency(result.taxAmount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Thu nhập thực nhận:</span>
                <span className="font-bold text-trust-green text-lg">
                  {formatCurrency(result.netIncome)}
                </span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h5 className="font-medium text-pro-gray">Chi tiết thuế theo bậc:</h5>
                {result.breakdown.map((bracket, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    Bậc {bracket.level}: {formatCurrency(bracket.amount)} 
                    ({formatPercent(bracket.rate)} trên {formatCurrency(bracket.to - bracket.from)})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nhập thông tin và nhấn "Tính Thuế Ngay" để xem kết quả</p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="h-4 w-4 text-gov-blue mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gov-blue font-medium">Lưu ý:</p>
                <p className="text-xs text-gray-600 mt-1">
                  Kết quả tính toán dựa trên quy định thuế hiện hành năm 2024. 
                  Đăng ký để nhận báo cáo chi tiết và lưu trữ lịch sử tính toán.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
