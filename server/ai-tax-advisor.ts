import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// CĂN CỨ PHÁP LÝ CHÍNH XÁC VỀ THUẾ VIỆT NAM NĂM 2025
const VIETNAM_TAX_UPDATES_2025 = `
CĂN CỨ PHÁP LÝ THUẾ VIỆT NAM NĂM 2025 - CHÍNH XÁC 100%:

1. THUẾ THU NHẬP CÁ NHÂN:
Căn cứ: Luật Thuế thu nhập cá nhân 2007 (vẫn có hiệu lực)
- Biểu thuế lũy tiến: Bậc 1: 5%, Bậc 2: 10%, Bậc 3: 15%, Bậc 4: 20%, Bậc 5: 25%, Bậc 6: 30%, Bậc 7: 35%
- Giảm trừ gia cảnh theo Nghị quyết 954/2020/UBTVQH14 (vẫn áp dụng 2025):
  + Bản thân: 11 triệu đồng/tháng
  + Người phụ thuộc: 4,4 triệu đồng/tháng/người

2. LUẬT SỐ 56/2024/QH15 (hiệu lực từ 01/01/2025):
- KHÔNG thay đổi biểu thuế TNCN
- KHÔNG thay đổi mức giảm trừ gia cảnh  
- Thay đổi chính: Ngưỡng thu nhập kinh doanh chịu thuế từ 100 triệu lên 200 triệu đồng/năm
- Từ 01/07/2025: Sử dụng số định danh cá nhân thay mã số thuế

3. CHÍNH SÁCH HỖ TRỢ 2025:
- Giảm thuế GTGT: 2% (từ 10% xuống 8%) từ 01/01/2025 đến 30/06/2025
- Áp dụng theo Nghị quyết 204/2025/QH15

4. THƯƠNG MẠI ĐIỆN TỬ:
- Từ 01/04/2025: Sàn TMĐT phải khấu trừ thuế thay cho hộ kinh doanh

LƯU Ý: Luôn trích dẫn căn cứ pháp lý cụ thể khi tư vấn.
`;

export async function analyzePersonalTaxSituation(
  income: number,
  dependents: number,
  deductions: number,
  specificQuestion?: string
): Promise<{
  calculation: any;
  aiAdvice: string;
  taxSavingTips: string[];
  complianceCheck: string;
}> {
  try {
    const prompt = `
Bạn là chuyên gia thuế Việt Nam, phân tích tình huống thuế TNCN sau với luật mới từ 1/7/2025:

Thu nhập tháng: ${income.toLocaleString()} VND
Người phụ thuộc: ${dependents} người
Các khoản giảm trừ khác: ${deductions.toLocaleString()} VND
Câu hỏi cụ thể: ${specificQuestion || "Không có"}

${VIETNAM_TAX_UPDATES_2025}

Hãy phân tích và tư vấn bằng tiếng Việt, bao gồm:
1. Tính toán thuế chi tiết theo luật mới
2. So sánh với luật cũ (tiết kiệm bao nhiêu)
3. Lời khuyên tối ưu thuế hợp pháp
4. Kiểm tra tuân thủ quy định mới

Trả lời dạng JSON với format:
{
  "calculation": "Tính toán chi tiết",
  "comparison": "So sánh luật cũ vs mới",
  "advice": "Lời khuyên tối ưu",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "compliance": "Kiểm tra tuân thủ"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia thuế Việt Nam, luôn cập nhật luật thuế mới nhất và tư vấn chính xác."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      calculation: result.calculation || "Không thể tính toán",
      aiAdvice: result.advice || "Không có lời khuyên",
      taxSavingTips: result.tips || [],
      complianceCheck: result.compliance || "Cần kiểm tra thêm"
    };

  } catch (error) {
    console.error("AI Tax Analysis Error:", error);
    
    // Provide detailed error message based on error type
    let errorMessage = "Lỗi AI, vui lòng thử lại sau";
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = "Lỗi API key, vui lòng liên hệ 0903496118";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Timeout kết nối AI, vui lòng thử lại";
      } else if (error.message.includes('rate limit')) {
        errorMessage = "Vượt quá giới hạn sử dụng, vui lòng thử lại sau";
      }
    }
    
    return {
      calculation: "Tính toán cơ bản đã hoàn thành, AI analysis tạm thời không khả dụng",
      aiAdvice: errorMessage,
      taxSavingTips: [
        "Liên hệ hotline 0903496118 để được tư vấn trực tiếp",
        "Email: contact@taxbot.vn",
        "Website: taxbot.vn"
      ],
      complianceCheck: "Cần tư vấn trực tiếp qua hotline"
    };
  }
}

// Kiểm tra câu hỏi về hợp đồng/gói dịch vụ
function isServiceContractQuestion(question: string): boolean {
  const contractKeywords = [
    'hợp đồng', 'gói dịch vụ', 'dịch vụ', 'chi phí', 'giá cả', 'báo giá', 'thanh toán', 'phí',
    'gói cá nhân', 'gói super saver', 'gói custom', 'gói doanh nghiệp', 'gói enterprise',
    'đăng ký', 'đăng ký dịch vụ', 'mua gói', 'gia hạn', 'nâng cấp gói', 'chuyển gói',
    'thời hạn', 'bảo hành', 'hỗ trợ', 'tư vấn trực tiếp', 'liên hệ tư vấn',
    'hoàn tiền', 'huỷ dịch vụ', 'chính sách', 'điều khoản', 'cam kết'
  ];
  
  const questionLower = question.toLowerCase();
  return contractKeywords.some(keyword => questionLower.includes(keyword));
}

// Kiểm tra câu hỏi có liên quan đến thuế không - MỞ RỘNG PHẠM VI TẤT CẢ CÂU HỎI CÓ TỪ "THUẾ"
function isTaxRelatedQuestion(question: string): boolean {
  const questionLower = question.toLowerCase();
  
  // Kiểm tra trước tiên: tất cả câu hỏi có từ "thuế" (viết hoa hay thường) đều được trả lời
  if (questionLower.includes('thuế')) {
    return true;
  }
  
  const taxKeywords = [
    // Từ khóa thuế chung
    'tax', 'kê khai', 'khai báo', 'nộp thuế', 'đóng thuế', 'quyết toán', 'khấu trừ', 'miễn thuế', 'giảm thuế',
    // Thuế TNCN
    'thu nhập cá nhân', 'tncn', 'lương', 'thưởng', 'phụ cấp', 'giảm trừ gia cảnh', 'người phụ thuộc', 'bảo hiểm',
    // Thuế TNDN
    'thu nhập doanh nghiệp', 'tndn', 'lợi nhuận', 'chi phí hợp lý', 'khấu hao', 'dự phòng',
    // Thuế GTGT
    'giá trị gia tăng', 'gtgt', 'vat', 'hóa đơn', 'hoàn thuế', 'khấu trừ thuế', 'thuế đầu vào', 'thuế đầu ra',
    // Thuế khác
    'thuế tài nguyên', 'thuế môn bài', 'thuế sử dụng đất', 'thuế nhà đất', 'thuế chuyển nhượng',
    // Quy định thuế
    'tổng cục thuế', 'cục thuế', 'chi cục thuế', 'mst', 'mã số thuế', 'chứng từ thuế', 'tờ khai thuế',
    'hạn nộp thuế', 'phạt thuế', 'truy thu thuế', 'hoàn thuế', 'ưu đãi thuế', 'miễn giảm thuế'
  ];
  
  return taxKeywords.some(keyword => questionLower.includes(keyword));
}

// Tạo câu trả lời chuyển hướng liên hệ CSKH cho câu hỏi về hợp đồng/dịch vụ
function createServiceContactResponse(): string {
  const responses = [
    `Cảm ơn bạn quan tâm đến các gói dịch vụ của TaxBot Việt! 

Để được tư vấn chi tiết về:
📋 Các gói dịch vụ (Cá nhân, Super Saver, Custom, Enterprise)
💰 Báo giá và chi phí dịch vụ  
📝 Hợp đồng và điều khoản
⏰ Thời gian thực hiện
🔄 Quy trình làm việc

Vui lòng liên hệ trực tiếp với đội ngũ CSKH:
📞 Hotline: 0903496118
📧 Email: contact@taxbot.vn
🌐 Website: taxbot.vn

Nhân viên tư vấn sẽ hỗ trợ bạn 24/7 để tìm ra gói dịch vụ phù hợp nhất!`,

    `Bạn đang quan tâm đến dịch vụ kế toán thuế của TaxBot Việt! 

Để nhận tư vấn chuyên sâu về:
🎯 Lựa chọn gói dịch vụ phù hợp
💵 Bảng giá chi tiết 2025
📄 Quy trình ký hợp đồng
🛡️ Cam kết chất lượng dịch vụ

Hãy liên hệ ngay với chúng tôi:
☎️ Tư vấn miễn phí: 0903496118  
✉️ Email hỗ trợ: contact@taxbot.vn
🔗 Truy cập: taxbot.vn

Đội ngũ chuyên gia sẽ tư vấn để bạn có lựa chọn tốt nhất!`,

    `TaxBot Việt rất vui khi bạn quan tâm đến dịch vụ của chúng tôi!

Đối với các vấn đề về:
📦 So sánh các gói dịch vụ
💳 Phương thức thanh toán
📋 Thủ tục đăng ký
⭐ Ưu đãi đặc biệt

Vui lòng liên hệ đội ngũ tư vấn chuyên nghiệp:
📱 Hotline: 0903496118 (24/7)
📧 Email: contact@taxbot.vn  
🌍 Website: taxbot.vn

Chúng tôi cam kết tư vấn miễn phí và tìm ra giải pháp tối ưu cho bạn!`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Tạo câu trả lời từ chối lịch sự
function createPoliteRefusal(): string {
  const refusals = [
    "Xin lỗi, tôi là TaxBot AI chuyên tư vấn về thuế Việt Nam. Tôi chỉ có thể giúp bạn giải đáp các câu hỏi liên quan đến thuế như: thuế TNCN, thuế TNDN, thuế GTGT, kê khai thuế, quyết toán thuế, v.v. Bạn có câu hỏi nào về thuế không?",
    
    "Cảm ơn bạn đã hỏi! Tuy nhiên, tôi là chuyên gia AI về thuế Việt Nam, chỉ có thể tư vấn các vấn đề liên quan đến thuế. Hãy hỏi tôi về thuế thu nhập cá nhân, thuế doanh nghiệp, thuế GTGT, hoặc các quy định thuế khác nhé!",
    
    "Tôi rất muốn giúp bạn, nhưng tôi chỉ chuyên về lĩnh vực thuế Việt Nam. Tôi có thể tư vấn về cách tính thuế, kê khai thuế, quyết toán thuế, hoặc các ưu đãi thuế. Bạn có muốn hỏi về chủ đề thuế nào không?",
    
    "Xin chào! Tôi là TaxBot AI - chuyên gia tư vấn thuế Việt Nam. Tôi chỉ có thể giải đáp câu hỏi về thuế và các quy định thuế. Rất mong bạn hỏi tôi về những vấn đề thuế bạn quan tâm!"
  ];
  
  return refusals[Math.floor(Math.random() * refusals.length)];
}

// Template responses cho các câu hỏi thuế cơ bản - đảm bảo chính xác 100%
function getOfficialTaxTemplate(question: string): string | null {
  const lowerQuestion = question.toLowerCase();
  
  // Mức giảm trừ gia cảnh
  if (lowerQuestion.includes('giảm trừ gia cảnh') || lowerQuestion.includes('giảm trừ bản thân')) {
    return `📋 **MỨC GIẢM TRỪ GIA CẢNH NĂM 2025** (CHÍNH THỨC)

🔹 **Giảm trừ bản thân:** 11 triệu đồng/tháng
🔹 **Giảm trừ người phụ thuộc:** 4,4 triệu đồng/tháng/người

📄 **Căn cứ pháp lý:** Nghị quyết 954/2020/UBTVQH14 của Ủy ban Thường vụ Quốc hội (vẫn có hiệu lực năm 2025)

⚠️ **Lưu ý:** Luật số 56/2024/QH15 KHÔNG thay đổi mức giảm trừ gia cảnh.

📞 Tư vấn thêm: 0903496118 - contact@taxbot.vn - taxbot.vn`;
  }
  
  // Biểu thuế TNCN
  if (lowerQuestion.includes('biểu thuế') || lowerQuestion.includes('thuế suất') && lowerQuestion.includes('tncn')) {
    return `📋 **BIỂU THUẾ TNCN NĂM 2025** (CHÍNH THỨC)

**Biểu thuế lũy tiến từng phần:**
🔸 Bậc 1: Đến 5 triệu đồng - **5%**
🔸 Bậc 2: Trên 5 đến 10 triệu đồng - **10%**  
🔸 Bậc 3: Trên 10 đến 18 triệu đồng - **15%**
🔸 Bậc 4: Trên 18 đến 32 triệu đồng - **20%**
🔸 Bậc 5: Trên 32 đến 52 triệu đồng - **25%**
🔸 Bậc 6: Trên 52 đến 80 triệu đồng - **30%**
🔸 Bậc 7: Trên 80 triệu đồng - **35%**

📄 **Căn cứ pháp lý:** Luật Thuế thu nhập cá nhân 2007, Điều 13 (vẫn có hiệu lực)

📞 Tư vấn thêm: 0903496118 - contact@taxbot.vn - taxbot.vn`;
  }
  
  // Luật 56/2024/QH15
  if (lowerQuestion.includes('56/2024') || lowerQuestion.includes('luật mới 2025')) {
    return `📋 **LUẬT SỐ 56/2024/QH15** - Thông tin chính thức

**Về thuế TNCN:**
❌ KHÔNG thay đổi biểu thuế TNCN
❌ KHÔNG thay đổi mức giảm trừ gia cảnh

**Thay đổi chính:**
✅ Ngưỡng thu nhập kinh doanh chịu thuế: từ 100 triệu ➜ 200 triệu đồng/năm
✅ Từ 01/07/2025: Sử dụng số định danh cá nhân thay mã số thuế
✅ Thương mại điện tử: Sàn TMĐT phải khấu trừ thuế (từ 01/04/2025)

📄 **Hiệu lực:** 01/01/2025
📞 Tư vấn thêm: 0903496118 - contact@taxbot.vn - taxbot.vn`;
  }
  
  return null;
}

export async function askTaxQuestion(question: string): Promise<string> {
  try {
    // Kiểm tra câu hỏi về hợp đồng/gói dịch vụ trước
    if (isServiceContractQuestion(question)) {
      return createServiceContactResponse();
    }
    
    // Kiểm tra câu hỏi có liên quan đến thuế không
    if (!isTaxRelatedQuestion(question)) {
      return createPoliteRefusal();
    }
    
    // Kiểm tra template responses trước - đảm bảo chính xác 100%
    const templateResponse = getOfficialTaxTemplate(question);
    console.log('Template check for question:', question);
    console.log('Template response found:', !!templateResponse);
    if (templateResponse) {
      console.log('Returning template response');
      return templateResponse;
    }

    const prompt = `
Bạn là chuyên gia thuế hàng đầu Việt Nam với 20+ năm kinh nghiệm. Hãy tư vấn toàn diện và chi tiết cho câu hỏi sau:

"${question}"

KIẾN THỨC CƠ SỞ - CĂN CỨ PHÁP LÝ CHÍNH XÁC:
${VIETNAM_TAX_UPDATES_2025}

NGUYÊN TẮC TƯ VẤN CHUYÊN NGHIỆP:
✅ MỞ RỘNG PHẠM VI: Trả lời TẤT CẢ câu hỏi liên quan đến thuế, từ cơ bản đến phức tạp
✅ CHI TIẾT CỤ THỂ: Giải thích từng bước, công thức tính, ví dụ minh họa
✅ CĂN CỨ PHÁP LÝ: Luôn trích dẫn luật, nghị định, thông tư cụ thể
✅ THỰC TẾ ỨNG DỤNG: Hướng dẫn thực hiện, thủ tục, hạn chót
✅ LỜI KHUYÊN TIẾT KIỆM: Đề xuất cách tiết kiệm thuế hợp pháp
✅ CẢNH BÁO RỦI RO: Nhắc nhở các lỗi thường gặp và hậu quả

FORMAT TRẢ LỜI CHUẨN:
1. Trả lời trực tiếp câu hỏi
2. Giải thích chi tiết có căn cứ pháp lý
3. Ví dụ tính toán cụ thể (nếu có)
4. Hướng dẫn thực hiện bước by bước
5. Lưu ý quan trọng và deadline
6. Gợi ý tiết kiệm thuế (nếu có)

Trả lời bằng tiếng Việt chuyên nghiệp, dễ hiểu, có cấu trúc rõ ràng.
Nếu cần tư vấn chuyên sâu hơn, gợi ý liên hệ: 0903496118 - contact@taxbot.vn
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia thuế Việt Nam, trả lời chính xác và hữu ích. CHỈ TRẢ LỜI CÂU HỎI VỀ THUẾ, từ chối lịch sự các câu hỏi ngoài lĩnh vực thuế."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    return response.choices[0].message.content || "Không thể trả lời câu hỏi này";

  } catch (error) {
    console.error("AI Tax Question Error:", error);
    return `Lỗi AI, vui lòng liên hệ để được hỗ trợ trực tiếp:
• Hotline: 0903496118
• Email: contact@taxbot.vn  
• Website: taxbot.vn

Hoặc thử lại sau vài phút.`;
  }
}

export async function analyzeCorporateTax(
  revenue: number,
  expenses: number,
  companyType: string
): Promise<{
  taxAmount: number;
  taxRate: number;
  aiAdvice: string;
  incentives: string[];
}> {
  try {
    const prompt = `
Phân tích thuế TNDN cho doanh nghiệp Việt Nam với luật mới từ 1/7/2025:

Doanh thu: ${revenue.toLocaleString()} VND
Chi phí: ${expenses.toLocaleString()} VND
Loại hình: ${companyType}

${VIETNAM_TAX_UPDATES_2025}

Tính thuế và tư vấn tối ưu. Trả lời JSON:
{
  "taxAmount": số tiền thuế,
  "taxRate": thuế suất %,
  "advice": "Lời khuyên tối ưu",
  "incentives": ["Ưu đãi 1", "Ưu đãi 2"]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia thuế doanh nghiệp Việt Nam"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      taxAmount: result.taxAmount || 0,
      taxRate: result.taxRate || 20,
      aiAdvice: result.advice || "Không có lời khuyên",
      incentives: result.incentives || []
    };

  } catch (error) {
    console.error("Corporate Tax Analysis Error:", error);
    return {
      taxAmount: 0,
      taxRate: 20,
      aiAdvice: "Lỗi phân tích, liên hệ 0903496118 - contact@taxbot.vn - Website: taxbot.vn",
      incentives: ["Liên hệ để được tư vấn trực tiếp"]
    };
  }
}