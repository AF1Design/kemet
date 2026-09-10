// Default system coupons including KEMETFAMILY
export const DEFAULT_COUPONS = [
  {
    code: 'KEMETFAMILY',
    type: 'fixed_price',
    targetPrice: 220,
    value: 220,
    description: 'سعر خاص للتيشيرت 220 ج.م بدلاً من 450 ج.م (بحد أقصى قطعة واحدة لكل عميل)',
    isActive: true,
    totalMaxUses: 1000,
    remainingUses: 1000,
    maxUsesPerUser: 1,
    maxDiscountedPieces: 1,
    usedBy: [],
    userUsage: {}
  },
  {
    code: 'KEMET10',
    type: 'percentage',
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
