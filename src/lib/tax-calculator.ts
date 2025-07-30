// VietNam Tax Calculator based on current tax laws

export interface PersonalIncomeTaxInput {
  monthlyIncome: number;
  dependents: number;
  insurance: number;
  socialInsurance?: number;
  healthInsurance?: number;
  unemploymentInsurance?: number;
}

export interface PersonalIncomeTaxResult {
  monthlyIncome: number;
  dependents: number;
  insurance: number;
  personalDeduction: number;
  dependentDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  taxRate: number;
  taxAmount: number;
  netIncome: number;
  breakdown: {
    level: number;
    from: number;
    to: number;
    rate: number;
    amount: number;
  }[];
}

export interface CorporateTaxInput {
  revenue: number;
  expenses: number;
  depreciation?: number;
  otherDeductions?: number;
}

export interface CorporateTaxResult {
  revenue: number;
  totalExpenses: number;
  taxableIncome: number;
  taxRate: number;
  taxAmount: number;
  netIncome: number;
}

export interface VATTaxInput {
  salesAmount: number;
  purchaseAmount: number;
  vatRate: number; // 0, 5, 10
}

export interface VATTaxResult {
  salesAmount: number;
  purchaseAmount: number;
  outputVAT: number;
  inputVAT: number;
  vatPayable: number;
  vatRate: number;
}

// Biểu thuế lũy tiến từng phần đối với thu nhập từ tiền lương, tiền công
// Căn cứ pháp lý: Luật Thuế thu nhập cá nhân 2007, Điều 13 (vẫn có hiệu lực năm 2025)
// Luật số 56/2024/QH15 KHÔNG thay đổi biểu thuế
const TAX_BRACKETS = [
  { from: 0, to: 5000000, rate: 0.05 },        // Bậc 1: 5% (chưa có quy định thay đổi)
  { from: 5000000, to: 10000000, rate: 0.10 },  // Bậc 2: 10%
  { from: 10000000, to: 18000000, rate: 0.15 }, // Bậc 3: 15%
  { from: 18000000, to: 32000000, rate: 0.20 }, // Bậc 4: 20%
  { from: 32000000, to: 52000000, rate: 0.25 }, // Bậc 5: 25%
  { from: 52000000, to: 80000000, rate: 0.30 }, // Bậc 6: 30%
  { from: 80000000, to: Infinity, rate: 0.35 }  // Bậc 7: 35%
];

export const calculatePersonalIncomeTax = (input: PersonalIncomeTaxInput): PersonalIncomeTaxResult => {
  // Mức giảm trừ gia cảnh năm 2025
  // Căn cứ: Nghị quyết 954/2020/UBTVQH14 (vẫn có hiệu lực năm 2025)
  const personalDeduction = 11000000; // Giảm trừ bản thân: 11 triệu đồng/tháng
  const dependentDeduction = input.dependents * 4400000; // Giảm trừ người phụ thuộc: 4,4 triệu đồng/tháng/người
  const totalDeductions = personalDeduction + dependentDeduction + input.insurance;
  
  const taxableIncome = Math.max(0, input.monthlyIncome - totalDeductions);
  
  let taxAmount = 0;
  let currentIncome = taxableIncome;
  const breakdown: PersonalIncomeTaxResult['breakdown'] = [];
  
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const bracket = TAX_BRACKETS[i];
    if (currentIncome <= 0) break;
    
    const taxableAtThisBracket = Math.min(currentIncome, bracket.to - bracket.from);
    const taxAtThisBracket = taxableAtThisBracket * bracket.rate;
    
    if (taxableAtThisBracket > 0) {
      breakdown.push({
        level: i + 1,
        from: bracket.from,
        to: bracket.to === Infinity ? bracket.from + taxableAtThisBracket : bracket.to,
        rate: bracket.rate,
        amount: taxAtThisBracket
      });
      
      taxAmount += taxAtThisBracket;
      currentIncome -= taxableAtThisBracket;
    }
  }
  
  const effectiveRate = taxableIncome > 0 ? taxAmount / taxableIncome : 0;
  const netIncome = input.monthlyIncome - taxAmount;
  
  return {
    monthlyIncome: input.monthlyIncome,
    dependents: input.dependents,
    insurance: input.insurance,
    personalDeduction,
    dependentDeduction,
    totalDeductions,
    taxableIncome,
    taxRate: effectiveRate,
    taxAmount,
    netIncome,
    breakdown
  };
};

export const calculateCorporateTax = (input: CorporateTaxInput): CorporateTaxResult => {
  const totalExpenses = input.expenses + (input.depreciation || 0) + (input.otherDeductions || 0);
  const taxableIncome = Math.max(0, input.revenue - totalExpenses);
  
  // Standard corporate tax rate in VietNam is 20%
  const taxRate = 0.20;
  const taxAmount = taxableIncome * taxRate;
  const netIncome = taxableIncome - taxAmount;
  
  return {
    revenue: input.revenue,
    totalExpenses,
    taxableIncome,
    taxRate,
    taxAmount,
    netIncome
  };
};

export const calculateVATTax = (input: VATTaxInput): VATTaxResult => {
  const vatRateDecimal = input.vatRate / 100;
  const outputVAT = input.salesAmount * vatRateDecimal;
  const inputVAT = input.purchaseAmount * vatRateDecimal;
  const vatPayable = Math.max(0, outputVAT - inputVAT);
  
  return {
    salesAmount: input.salesAmount,
    purchaseAmount: input.purchaseAmount,
    outputVAT,
    inputVAT,
    vatPayable,
    vatRate: input.vatRate
  };
};

// Utility functions
export const formatCurrency = (amount: number, currency: string = 'VND'): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

export const formatPercent = (rate: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(rate);
};
