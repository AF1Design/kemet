// Category definitions for coupons
export const COUPON_CATEGORIES = [
  { id: 'all', labelAr: 'عام لجميع المنتجات والأقسام', icon: '🌐' },
  { id: 'winter', labelAr: 'الكولكشن الشتوي فقط (تراكات)', icon: '❄️' },
  { id: 'summer', labelAr: 'الكولكشن الصيفي فقط (أطقم وتيشيرتات)', icon: '☀️' }
];

export function isWinterProduct(item) {
  if (!item) return false;
  const cat = String(item.category_id || item.category || '').toLowerCase().trim();
  if (cat === 'winter') return true;
  const name = String(item.nameAr || item.nameEn || item.name_ar || item.name_en || item.name || '').toLowerCase();
  return /تراك|شتوي|winter|track/i.test(name);
}

export function isSummerProduct(item) {
  if (!item) return false;
  return !isWinterProduct(item);
}

// Default system coupons including KEMETFAMILY
export const DEFAULT_COUPONS = [
  {
    code: 'KEMET12',
    type: 'free_shipping',
    targetCategory: 'all',
    targetPrice: null,
    value: 0,
    description: 'شحن مجاني لكافة محافظات مصر لمدة 48 ساعة',
    isActive: true,
    isSuggested: true,
    suggestionLabel: 'شحن مجاني لكل المحافظات (كود kemet12)',
    expiresAt: '2026-10-09T13:00:00.000Z',
    totalMaxUses: 2000,
    remainingUses: 2000,
    maxUsesPerUser: 1,
    minOrderPieces: 1,
    maxDiscountedPieces: null,
    usedBy: [],
    userUsage: {}
  },
  {
    code: 'KEMETMISR',
    type: 'fixed_price',
    targetCategory: 'summer',
    targetPrice: 225,
    value: 225,
    description: 'عرض الصيفي (القطعتين): 225 ج.م للتيشيرت عند طلب قطعتين أو أكثر',
    isActive: true,
    totalMaxUses: 500,
    remainingUses: 500,
    maxUsesPerUser: 1,
    minOrderPieces: 2,
    maxDiscountedPieces: null,
    usedBy: [],
    userUsage: {}
  },
  {
    code: 'KEMET22',
    type: 'fixed_price',
    targetCategory: 'summer',
    targetPrice: 290,
    value: 290,
    description: 'عرض الصيفي (القطعة الواحدة): 290 ج.م بدلاً من 470 ج.م',
    isActive: true,
    totalMaxUses: 500,
    remainingUses: 500,
    maxUsesPerUser: 1,
    minOrderPieces: 1,
    maxDiscountedPieces: null,
    usedBy: [],
    userUsage: {}
  },
  {
    code: 'KEMETFAMILY',
    type: 'fixed_price',
    targetCategory: 'summer',
    targetPrice: 220,
    value: 220,
    description: 'سعر خاص للتيشيرت الصيفي 220 ج.م بدلاً من 450 ج.م (بحد أقصى قطعة واحدة لكل عميل)',
    isActive: true,
    totalMaxUses: 1000,
    remainingUses: 1000,
    maxUsesPerUser: 1,
    minOrderPieces: 1,
    maxDiscountedPieces: 1,
    usedBy: [],
    userUsage: {}
  },
  {
    code: 'KEMET10',
    type: 'percentage',
    targetCategory: 'all',
    value: 10,
    targetPrice: null,
    description: 'خصم 10% على إجمالي قيمة المنتجات',
    isActive: true,
    totalMaxUses: 1000,
    remainingUses: 1000,
    maxUsesPerUser: 1,
    maxDiscountedPieces: null,
    usedBy: [],
    userUsage: {}
  },
  {
    code: 'OFF50',
    type: 'fixed',
    targetCategory: 'all',
    value: 50,
    targetPrice: null,
    description: 'خصم 50 ج.م من إجمالي قيمة المنتجات',
    isActive: true,
    totalMaxUses: 500,
    remainingUses: 500,
    maxUsesPerUser: 1,
    maxDiscountedPieces: null,
    usedBy: [],
    userUsage: {}
  }
];
