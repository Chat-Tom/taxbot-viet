import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Calculator, MessageCircle, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { calculatePersonalIncomeTax, formatCurrency } from "@/lib/tax-calculator";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function AiTaxCalculator() {
  const [personalTaxData, setPersonalTaxData] = useState({
    income: 0,
    dependents: 0,
    deductions: 0,
    question: ""
  });

  const [taxQuestion, setTaxQuestion] = useState("");
  const [basicCalculation, setBasicCalculation] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validatePositiveNumber = (value: number, fieldName: string): string | null => {
    if (value < 0) {
      return `${fieldName} phải là số không âm (≥ 0)`;
    }
    return null;
  };

  const validateNaturalNumber = (value: number, fieldName: string): string | null => {
    if (!Number.isInteger(value) || value < 0) {
      return `${fieldName} phải là số tự nhiên (0, 1, 2, 3, ...)`;
    }
    return null;
  };

  const validateInputs = () => {
    const errors: {[key: string]: string} = {};
    
    // Validate income (must be non-negative)
    const incomeError = validatePositiveNumber(personalTaxData.income, "Thu nhập");
    if (incomeError) errors.income = incomeError;
    
    // Validate dependents (must be natural number)
    const dependentsError = validateNaturalNumber(personalTaxData.dependents, "Số người phụ thuộc");
    if (dependentsError) errors.dependents = dependentsError;
    
    // Validate deductions (must be non-negative)
    const deductionsError = validatePositiveNumber(personalTaxData.deductions, "Các khoản giảm trừ");
    if (deductionsError) errors.deductions = deductionsError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // AI Personal Tax Analysis
  const personalTaxMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ai/analyze-personal-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to analyze tax");
      return response.json();
    }
  });

  // AI Tax Question
  const taxQuestionMutation = useMutation({
    mutationFn: async (data: { question: string }) => {
      const response = await fetch("/api/ai/ask-tax-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to get answer");
      return response.json();
    }
  });

  // Handle input changes with validation
  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    
    // Special handling for dependents to ensure integer
    if (field === 'dependents') {
      const intValue = parseInt(value) || 0;
      setPersonalTaxData(prev => ({ ...prev, [field]: intValue }));
    } else {
      setPersonalTaxData(prev => ({ ...prev, [field]: numValue }));
    }
    
    // Clear previous error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePersonalTaxAnalysis = () => {
    if (!validateInputs()) {
      return; // Stop if validation fails
    }
    
    if (!personalTaxData.income) return;
    
    // Calculate basic tax first
    const basicResult = calculatePersonalIncomeTax({
      monthlyIncome: personalTaxData.income,
      dependents: personalTaxData.dependents,
      insurance: personalTaxData.deductions
    });
    setBasicCalculation(basicResult);

    // Get AI analysis
    personalTaxMutation.mutate(personalTaxData);
  };

  const handleTaxQuestion = () => {
    if (!taxQuestion.trim()) return;
    taxQuestionMutation.mutate({ question: taxQuestion });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <div className="container mx-auto px-4 pt-16 pb-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Tra cứu và hỏi đáp thuế thông minh AI
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trải nghiệm tính thuế nhanh chóng và chính xác với AI. 
            Cập nhật luật thuế mới nhất từ <Badge variant="secondary">1/7/2025</Badge>
          </p>
        </div>

        {/* New Tax Updates Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Cập nhật luật thuế 1/7/2025:</strong> Giảm thuế TNCN bậc 1 xuống 3%, tăng mức giảm trừ gia cảnh lên 13 triệu/tháng, người phụ thuộc 5 triệu/tháng
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Tiện Ích Tính Thuế Cá Nhân
            </TabsTrigger>
            <TabsTrigger value="question" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Hỏi Đáp Thuế
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Cập Nhật 2025
            </TabsTrigger>
          </TabsList>

          {/* Personal Tax Calculator */}
          <TabsContent value="personal" className="space-y-6">
            {/* Validation Rules Alert */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Quy tắc nhập liệu:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Thu nhập, bảo hiểm: Chỉ số dương (≥ 0)</li>
                  <li>• Số người phụ thuộc: Số tự nhiên (0, 1, 2, 3, ...)</li>
                  <li>• Tất cả các giá trị tài chính phải ≥ 0</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Nhập Thông Tin Thuế
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="income">Thu nhập tháng (VND) *</Label>
                    <Input
                      id="income"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Ví dụ: 20000000"
                      value={personalTaxData.income || ""}
                      onChange={(e) => handleInputChange('income', e.target.value)}
                      className={validationErrors.income ? 'border-red-500' : ''}
                    />
                    {validationErrors.income && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.income}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Chỉ nhập số dương (≥ 0)</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="dependents">Số người phụ thuộc</Label>
                    <Input
                      id="dependents"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ví dụ: 2"
                      value={personalTaxData.dependents || ""}
                      onChange={(e) => handleInputChange('dependents', e.target.value)}
                      className={validationErrors.dependents ? 'border-red-500' : ''}
                    />
                    {validationErrors.dependents && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.dependents}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Số tự nhiên: 0, 1, 2, 3, ...</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="deductions">Bảo hiểm & các khoản khấu trừ (VND)</Label>
                    <Input
                      id="deductions"
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Ví dụ: 2000000"
                      value={personalTaxData.deductions || ""}
                      onChange={(e) => handleInputChange('deductions', e.target.value)}
                      className={validationErrors.deductions ? 'border-red-500' : ''}
                    />
                    {validationErrors.deductions && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.deductions}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Chỉ nhập số dương (≥ 0)</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="question">Câu hỏi cụ thể (tuỳ chọn)</Label>
                    <Textarea
                      id="question"
                      placeholder="Ví dụ: Tôi có thể tối ưu thuế như thế nào?"
                      value={personalTaxData.question}
                      onChange={(e) => setPersonalTaxData({
                        ...personalTaxData,
                        question: e.target.value
                      })}
                    />
                  </div>
                  
                  <Button 
                    onClick={handlePersonalTaxAnalysis}
                    disabled={personalTaxMutation.isPending || !personalTaxData.income}
                    className="w-full"
                  >
                    {personalTaxMutation.isPending ? "Đang phân tích..." : "Phân Tích Thuế với AI"}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Kết Quả Phân Tích
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {basicCalculation && (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Tính Toán Cơ Bản</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Thu nhập tháng:</span>
                            <span className="font-medium">{formatCurrency(basicCalculation.monthlyIncome)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Giảm trừ gia cảnh:</span>
                            <span className="font-medium">{formatCurrency(basicCalculation.personalDeduction)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Giảm trừ người phụ thuộc:</span>
                            <span className="font-medium">{formatCurrency(basicCalculation.dependentDeduction)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Thu nhập chịu thuế:</span>
                            <span className="font-medium">{formatCurrency(basicCalculation.taxableIncome)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-bold">
                            <span>Thuế phải nộp:</span>
                            <span className="text-red-600">{formatCurrency(basicCalculation.taxAmount)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Thu nhập thực:</span>
                            <span className="text-green-600">{formatCurrency(basicCalculation.netIncome)}</span>
                          </div>
                        </div>
                      </div>

                      {personalTaxMutation.data && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">Phân Tích AI</h4>
                          <div className="space-y-3 text-sm">
                            <div>
                              <strong>Tính toán chi tiết:</strong>
                              <p className="mt-1 text-gray-700">{personalTaxMutation.data.calculation}</p>
                            </div>
                            <div>
                              <strong>Lời khuyên tối ưu:</strong>
                              <p className="mt-1 text-gray-700">{personalTaxMutation.data.aiAdvice}</p>
                            </div>
                            {personalTaxMutation.data.taxSavingTips?.length > 0 && (
                              <div>
                                <strong>Gợi ý tiết kiệm thuế:</strong>
                                <ul className="mt-1 list-disc list-inside text-gray-700">
                                  {personalTaxMutation.data.taxSavingTips.map((tip: string, index: number) => (
                                    <li key={index}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {personalTaxMutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>Lỗi phân tích AI. Vui lòng kiểm tra:</p>
                          <ul className="text-sm list-disc list-inside">
                            <li>Kết nối internet ổn định</li>
                            <li>Thông tin nhập vào chính xác</li>
                            <li>Thử lại sau 1-2 phút</li>
                          </ul>
                          <p>Liên hệ hỗ trợ: <strong>0903496118</strong> | <strong>contact@taxbot.vn</strong></p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tax Q&A */}
          <TabsContent value="question" className="space-y-6">
            <Card className="-mt-12 relative z-10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Hỏi Đáp Thuế với AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="taxQuestion">Câu hỏi về thuế</Label>
                  <Textarea
                    id="taxQuestion"
                    placeholder="Ví dụ: Tôi là freelancer, cần khai báo thuế như thế nào?"
                    value={taxQuestion}
                    onChange={(e) => setTaxQuestion(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={handleTaxQuestion}
                  disabled={taxQuestionMutation.isPending || !taxQuestion.trim()}
                  className="w-full"
                >
                  {taxQuestionMutation.isPending ? "Đang tư vấn..." : "Hỏi AI"}
                </Button>

                {taxQuestionMutation.data && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Trả lời từ AI:</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{taxQuestionMutation.data.answer}</p>
                    </div>
                    
                    {taxQuestionMutation.data.answer.includes('Lỗi AI') && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <h5 className="font-medium text-yellow-800 mb-2">💡 Trong khi chờ AI:</h5>
                        <div className="text-sm text-yellow-700 space-y-1">
                          <p>• Sử dụng tab <strong>"Tiện Ích Tính Thuế Cá Nhân"</strong> để tính thuế cơ bản</p>
                          <p>• Xem tab <strong>"Cập Nhật 2025"</strong> để biết luật thuế mới</p>
                          <p>• Liên hệ trực tiếp <strong>0903496118</strong> để tư vấn</p>
                          <p className="mt-2 text-xs">
                            <em>AI sẽ hoạt động sau khi OpenAI API được nạp thêm credit.</em>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {taxQuestionMutation.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>Không thể trả lời câu hỏi. Vui lòng:</p>
                        <ul className="text-sm list-disc list-inside">
                          <li>Kiểm tra kết nối internet</li>
                          <li>Thử câu hỏi ngắn gọn hơn</li>
                          <li>Thử lại sau vài phút</li>
                        </ul>
                        <p>Hỗ trợ 24/7: <strong>0903496118</strong> | <strong>contact@taxbot.vn</strong></p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2025 Updates */}
          <TabsContent value="updates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cập Nhật Luật Thuế 1/7/2025
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Thuế Thu Nhập Cá Nhân</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Giảm thuế suất bậc 1: 5% → 3%</li>
                      <li>• Tăng mức giảm trừ gia cảnh: 11M → 13M</li>
                      <li>• Người phụ thuộc: 4.4M → 5M</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Thuế Doanh Nghiệp</h4>
                    <ul className="text-sm space-y-1">
                      <li>• DN nhỏ và vừa: 15% (doanh thu dưới 200 tỷ)</li>
                      <li>• DN công nghệ: 10% (2 năm đầu)</li>
                      <li>• Ưu đãi đầu tư mới</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Thuế GTGT</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Hàng thiết yếu: 5% → 3%</li>
                      <li>• Y tế, giáo dục: miễn thuế</li>
                      <li>• Thực phẩm cơ bản: 0%</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Quy Định Mới</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Hóa đơn điện tử bắt buộc</li>
                      <li>• Khai báo online VTaxMobile</li>
                      <li>• Phạt nộp muộn: 0.1% → 0.05%</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Lưu Ý Quan Trọng</h4>
                  <p className="text-sm text-gray-700">
                    Các thay đổi này có hiệu lực từ ngày 1/7/2025. Doanh nghiệp và cá nhân cần cập nhật 
                    quy trình khai báo thuế để tuân thủ đúng quy định mới. Để được tư vấn chi tiết, 
                    vui lòng liên hệ <strong>0903 496 118</strong> hoặc email <strong>contact@taxbot.vn</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact CTA */}
        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Cần Tư Vấn Chuyên Sâu?</h3>
              <p className="mb-4">Liên hệ ngay để được hỗ trợ 1:1 từ chuyên gia thuế</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <a 
                  href="tel:0903496118" 
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                  📞 0903 496 118
                </a>
                <a 
                  href="mailto:contact@taxbot.vn" 
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                  ✉️ contact@taxbot.vn
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}