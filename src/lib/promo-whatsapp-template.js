/**
 * KEMET Luxury WhatsApp Promotional Message Templates
 * High-converting, brand-aligned Arabic copywriting for WhatsApp customer outreach.
 * STRICT POLICY: ZERO EMOJIS. No false inspection promises. Professional tone, structured line breaks, value guarantees.
 */

/**
 * Builds winter collection launch message for WhatsApp
 */
export function buildWinterCollectionWhatsAppMessage({ customerName = '' } = {}) {
  const cleanName = (customerName || 'عزيزنا العميل').trim();

  return `مرحباً ${cleanName}،
يسعدنا إعلامك بانطلاق الكولكشن الشتوي الجديد رسمياً لدى متجر KEMET للأزياء الرياضية.

وصلت الآن تشكيلة مميزة من الهوديز، السويت شيرتات، والترنجات الشتوية الثقيلة:
- خامات قطن وملتون معالج فائق الجودة يمنحك الدفء والمظهر الأنيق
- تطريز وشعارات رسمية متقنة بأعلى معايير الجودة
- توفر كافة المقاسات والألوان الحصرية بكميات محدودة

كما يمكنك الاستفادة من أكواد الخصم الخاصة بعملاء المتجر:
- كود KEMET22: خصم فوري على القطعة الفردية
- كود KEMETMISR: خصم إضافي عند اختيار قطعتين فأكثر

تفضل بتصفح الكولكشن الشتوي وحجز مقاسك الآن عبر الرابط:
https://kemetmisr.com

فريق خدمة عملاء KEMET في خدمتكم دائماً لأي استفسار.`;
}

/**
 * Builds high-converting message for customers with active abandoned carts
 */
export function buildCartRecoveryWhatsAppMessage({
  customerName = '',
  itemsCount = 0,
  cartTotal = 0,
  lastItemName = ''
} = {}) {
  const cleanName = (customerName || 'عزيزنا العميل').trim();

  let itemDetail = '';
  if (lastItemName) {
    itemDetail = ` (بما فيها: ${lastItemName})`;
  } else if (itemsCount > 0) {
    itemDetail = ` (${itemsCount} منتجات)`;
  }

  return `مرحباً ${cleanName}،
يسعدنا التواصل معك من خدمة عملاء متجر KEMET للأزياء الرياضية.

لاحظنا وجود منتجات بانتظارك في حقيبة التسوق${itemDetail}، ولم يتم استكمال تأكيد الطلب بعد.

يسعدنا تذكيركم بمميزات التسوق والضمان لدى KEMET:
- خامات أصلية 100% إصدار اللاعبين (Player Edition)
- ضمان استبدال وسلس وسريع للمقاس لضمان رضاكم التام
- توصيل سريع ومباشر لكافة محافظات جمهورية مصر العربية

كما يسعدنا تفعيل كوبونات الخصم الحصرية لحسابك:
- كود KEMET22: القطعة بسعر 290 ج.م فقط بدلاً من 470 ج.م
- كود KEMETMISR: القطعتين بسعر 450 ج.م شامل العرض

يمكنك استكمال طلبك وتأكيد المقاس ومكان التوصيل مباشرة عبر الرابط التالي:
https://kemetmisr.com/cart

إذا كان لديك أي استفسار بخصوص المقاس المناسب أو مواصفات المنتجات، يمكنك الرد مباشرة على هذه الرسالة وسنكون في خدمتك فوراً.

فريق خدمة عملاء KEMET
الموقع الرسمي: https://kemetmisr.com`;
}

/**
 * Builds welcome promotional message for registered users who haven't ordered yet
 */
export function buildLeadWelcomeWhatsAppMessage({ customerName = '' } = {}) {
  const cleanName = (customerName || 'عزيزنا العميل').trim();

  return `مرحباً ${cleanName}،
يسعدنا انضمامك إلى منصة KEMET للأزياء والملابس الرياضية الفاخرة.

تقديراً لاهتمامكم واختياركم لنا، يسعدنا تقديم كوبون ترحيبي خاص بطلبكم الأول:
- كود KEMET22: احصل على أي تيشيرت بسعر 290 ج.م فقط بدلاً من 470 ج.م
- كود KEMETMISR: احصل على قطعتين بسعر 450 ج.م فقط

لماذا يختار عملاؤنا KEMET؟
- تفاصيل وخامات رياضية مطابقة للمواصفات العالمية Player Edition
- سياسة استبدال مرنة وسريعة تضمن استلام المقاس المناسب لك
- ضمان شامل على جودة الطباعة والنسيج

تفضل بزيارة المتجر واستكشف المجموعات المتاحة الآن:
https://kemetmisr.com

فريق خدمة عملاء KEMET في خدمتكم دائماً.`;
}

/**
 * Builds VIP appreciation and new collection announcement for returning buyers
 */
export function buildBuyerVipWhatsAppMessage({ customerName = '' } = {}) {
  const cleanName = (customerName || 'عزيزنا العميل').trim();

  return `مرحباً ${cleanName}،
تحية تقدير خاصة من متجر KEMET للأزياء الرياضية.

نشكرك على ثقتك المستمرة بنا، ونتمنى أن تكون تجربتك السابقة مع منتجاتنا قد نالت رضاك الكامل.

يسعدنا إعلامك بوصول تشكيلات ومقاسات جديدة حصرية، مع استمرار تفعيل ميزة الشراء الحصري للعملاء المميزين:
- كود KEMET22
- كود KEMETMISR

يمكنكم استعراض التشكيلة الجديدة وحجز مقاسكم عبر الرابط الرسمي:
https://kemetmisr.com

فريق KEMET في خدمتكم دائماً لأي استفسار.`;
}

/**
 * Builds flash sale promotional message
 */
export function buildFlashSaleWhatsAppMessage({ customerName = '' } = {}) {
  const cleanName = (customerName || 'عزيزنا العميل').trim();

  return `مرحباً ${cleanName}،
عرض خاص ولفترة محدودة من متجر KEMET للأزياء الرياضية.

تم إطلاق تخفيضات استثنائية على تشكيلة التيشيرتات والأطقم الرياضية Player Edition:
- استخدم كود KEMET22 للقطعة الفردية بسعر 290 ج.م فقط
- استخدم كود KEMETMISR للحصول على قطعتين بسعر 450 ج.م

المميزات:
- ضمان استبدال وتغيير المقاس بكل سهولة
- شحن سريع لجميع المحافظات

العرض سارٍ حتى نفاد الكميات المخصصة عبر موقعنا:
https://kemetmisr.com

فريق خدمة عملاء KEMET`;
}

/**
 * Formats Egyptian phone number to standard international format (20XXXXXXXXXX)
 */
export function formatEgyptianPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.startsWith('20')) return digits;
  if (digits.startsWith('0')) return '2' + digits;
  if (digits.length === 10) return '20' + digits;
  return '20' + digits;
}

/**
 * Builds a direct wa.me link with encoded message
 */
export function buildWhatsAppClickUrl(rawPhone, messageText) {
  const formattedPhone = formatEgyptianPhone(rawPhone);
  if (!formattedPhone) return null;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
}
