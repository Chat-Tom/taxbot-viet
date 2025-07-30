/**
 * Vietnam Phone Number Validator
 * Validates Vietnamese mobile phone numbers according to official prefixes
 */

// Vietnamese mobile network prefixes (10-digit format)
const VIETNAM_MOBILE_PREFIXES = {
  viettel: ['032', '033', '034', '035', '036', '037', '038', '039', '086', '096', '097', '098'],
  mobifone: ['070', '076', '077', '078', '079', '089', '090', '093'],
  vinaphone: ['081', '082', '083', '084', '085', '088', '091', '094'],
  vietnamobile: ['052', '056', '058', '092'],
  gmobile: ['059', '099'],
  itel: ['087']
};

// Flatten all valid prefixes
const ALL_VALID_PREFIXES = Object.values(VIETNAM_MOBILE_PREFIXES).flat();

/**
 * Validates Vietnamese mobile phone number
 * @param phone - Phone number string
 * @returns Object with validation result and details
 */
export function validateVietnamesePhone(phone: string): {
  isValid: boolean;
  network?: string;
  formattedPhone?: string;
  error?: string;
} {
  if (!phone) {
    return {
      isValid: false,
      error: "Số điện thoại không được để trống"
    };
  }

  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Remove country code if present
  let normalizedPhone = cleanPhone;
  if (cleanPhone.startsWith('+84')) {
    normalizedPhone = '0' + cleanPhone.substring(3);
  } else if (cleanPhone.startsWith('84') && cleanPhone.length === 11) {
    normalizedPhone = '0' + cleanPhone.substring(2);
  }

  // Check if phone number has exactly 10 digits and starts with 0
  if (!/^0\d{9}$/.test(normalizedPhone)) {
    return {
      isValid: false,
      error: "Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0"
    };
  }

  // Extract first 3 digits (prefix)
  const prefix = normalizedPhone.substring(0, 3);
  
  // Check if prefix is valid
  if (!ALL_VALID_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      error: "Đầu số không hợp lệ. Vui lòng sử dụng số điện thoại của nhà mạng Việt Nam"
    };
  }

  // Determine network
  let network = '';
  for (const [networkName, prefixes] of Object.entries(VIETNAM_MOBILE_PREFIXES)) {
    if (prefixes.includes(prefix)) {
      network = getNetworkDisplayName(networkName);
      break;
    }
  }

  // Format phone number (0xxx xxx xxx)
  const formattedPhone = `${normalizedPhone.substring(0, 4)} ${normalizedPhone.substring(4, 7)} ${normalizedPhone.substring(7)}`;

  return {
    isValid: true,
    network,
    formattedPhone,
  };
}

/**
 * Get display name for network
 */
function getNetworkDisplayName(networkCode: string): string {
  switch (networkCode) {
    case 'viettel': return 'Viettel';
    case 'mobifone': return 'MobiFone';
    case 'vinaphone': return 'VinaPhone';
    case 'vietnamobile': return 'Vietnamobile';
    case 'gmobile': return 'Gmobile';
    case 'itel': return 'iTel';
    default: return networkCode;
  }
}

/**
 * Get detailed prefix information for help text
 */
export function getVietnamesePhonePrefixInfo(): string {
  return `
Đầu số di động hợp lệ của Việt Nam:
• Viettel: 032–039, 086, 096, 097, 098
• MobiFone: 070, 076–079, 089, 090, 093  
• VinaPhone: 081–085, 088, 091, 094
• Vietnamobile: 052, 056, 058, 092
• Gmobile: 059, 099
• iTel: 087
  `.trim();
}

/**
 * Quick validation for form inputs
 */
export function isValidVietnamesePhone(phone: string): boolean {
  return validateVietnamesePhone(phone).isValid;
}