/**
 * KEMET Promotional Email Template Generator
 * Matches EXACTLY the official Order Update email format (line 1218 in actions.js)
 * Clean standard container, no custom body background wrapper (prevents iOS/Gmail inverted colors),
 * optimized product images, and official CTA buttons.
 */

export const PROMO_CAMPAIGN_PRESETS = [
  {
    id: 'winter_collection',
    label: 'تراكات الأندية الشتوي',
    description: 'أحدث تشكيلة تراكات التدريب الشتوية للأندية والمنتخبات مع صور المنتجات ورابط القناة',
    subject: 'كوليكشن تراكات الأندية الشتوي وصل! ⚽🔥',
    headline: 'كوليكشن تراكات الأندية الشتوي وصل! ⚽🔥',
    badge: '',
    couponCode: '',
    discountNote: '',
    bodyText: `نزلنا أحدث تشكيلة من تراكات التدريب الشتوية لأقوى الأندية والمنتخبات.

خامات رياضية تقيلة، تقفيل مريح للتمارين والتجمعات، وألوان الموسم الجديد بالكامل

المقاسات متوفرة دلوقتي بكميات محدودة جداً`,
    ctaText: 'اختر تراك فريقك واطلب الآن',
    ctaUrl: 'https://kemetmisr.com',
    whatsappChannelText: 'انضم لقناة الواتساب علشان يوصلك كل جديد قبل اي حد',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q',
    images: [
      'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-ahly.jpg',
      'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-barca.jpg',
      'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-france.jpg'
    ]
  },
  {
    id: 'discount_voucher',
    label: 'كود خصم وترحيب',
    description: 'عرض كود خصم حصري لطلبك القادم',
    subject: 'عرض خاص وكود خصم حصري لطلبك القادم من KEMET',
    headline: 'خصم استثنائي لعملاء KEMET المميزين',
    badge: '',
    couponCode: 'KEMET22',
    discountNote: 'القطعة بـ 290 ج.م فقط بدلاً من 470 ج.م (أو القطعتين بـ 450 ج.م)',
    bodyText: `يسعدنا تقديم كود خصم حصري خاص بك لتستمتع بأفضل تجربة تسوق رياضية.
اختر طقمك المفضل من أحدث تشكيلة لأطقم المنتخبات والأندية العالمية بأعلى خامات Player Edition الرسمية، مع سرعة توصيل فائقة وضمان استبدال فوري للمقاس.`,
    ctaText: 'تسوّق الآن واستخدم كود الخصم',
    ctaUrl: 'https://kemetmisr.com',
    whatsappChannelText: 'انضم لقناة الواتساب علشان يوصلك كل جديد قبل اي حد',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q',
    images: []
  },
  {
    id: 'new_collection',
    label: 'إطلاق كولكشن جديد',
    description: 'الإعلان عن وصول تشكيلة الموسم الجديد وأحدث الأطقم الرياضية',
    subject: 'وصلت الآن: أحدث تشكيلة أطقم رياضية لموسم 2026 / 2027 من KEMET',
    headline: 'تشكيلة الموسم الجديد متوفرة الآن بالكامل',
    badge: '',
    couponCode: '',
    discountNote: '',
    bodyText: `يسعدنا إعلامك بوصول أحدث تشكيلة لأطقم الأندية العالمية والمنتخبات لموسم 2026/2027.
تتميز تشكيلتنا الجديدة بأدق تفاصيل الخامات الرسمية بنسخة اللاعبين Player Edition، مع مقاسات متكاملة وتطريز فاخر.
نوفر خدمة توصيل سريعة لكافة المحافظات مع ضمان استبدال فوري وسلس للمقاس.`,
    ctaText: 'استكشف التشكيلة الجديدة الآن',
    ctaUrl: 'https://kemetmisr.com/category/all',
    whatsappChannelText: 'انضم لقناة الواتساب علشان يوصلك كل جديد قبل اي حد',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q',
    images: []
  },
  {
    id: 'custom',
    label: 'حملة مخصصة بالكامل',
    description: 'كتابة محتوى الرسالة والعرض بحرية تامة مع التصميم الرسمي',
    subject: 'رسالة خاصة من متجر KEMET للأزياء الرياضية',
    headline: 'عرض حصري ومميز من KEMET',
    badge: '',
    couponCode: '',
    discountNote: '',
    bodyText: 'اكتب تفاصيل عرضك الترويجي هنا وسيتولى النظام تنسيقه تلقائياً بالشكل الرسمي المعتمد لرسائل KEMET.',
    ctaText: 'تصفّح المتجر الآن',
    ctaUrl: 'https://kemetmisr.com',
    whatsappChannelText: 'انضم لقناة الواتساب',
    whatsappChannelUrl: 'https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q',
    images: []
  }
];

/**
 * Builds the promotional HTML email matching the exact Order Update email form (No body background wrapper)
 */
export function buildLuxuryPromoEmailHtml({
  headline = 'كوليكشن تراكات الأندية الشتوي وصل! ⚽🔥',
  bodyText = '',
  ctaText = 'اختر تراك فريقك واطلب الآن',
  ctaUrl = 'https://kemetmisr.com',
  whatsappChannelText = 'انضم لقناة الواتساب علشان يوصلك كل جديد قبل اي حد',
  whatsappChannelUrl = 'https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q',
  images = [
    'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-ahly.jpg',
    'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-barca.jpg',
    'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-france.jpg'
  ],
  couponCode = '',
  discountNote = '',
  badge = ''
}) {
  const cleanHeadline = String(headline || 'كوليكشن تراكات الأندية الشتوي وصل! ⚽🔥').trim();
  const cleanCtaText = String(ctaText || 'اختر تراك فريقك واطلب الآن').trim();
  const cleanCtaUrl = String(ctaUrl || 'https://kemetmisr.com').trim();
  const cleanWhatsappText = String(whatsappChannelText || '').trim();
  const cleanWhatsappUrl = String(whatsappChannelUrl || '').trim();
  const cleanCoupon = String(couponCode || '').trim();

  // Normalize paragraphs
  const rawBody = String(bodyText || '').trim();
  const normalizedBody = rawBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const paragraphs = normalizedBody ? normalizedBody.split(/\n\s*\n/) : [];

  const formattedParagraphsHtml = paragraphs.map(p => {
    const lines = p.trim().split('\n').map(l => l.trim()).filter(Boolean);
    return `
      <p style="color: #0F172A; font-family: 'Cairo', 'Tajawal', Arial, sans-serif; font-size: 16px; font-weight: 700; line-height: 1.85; margin: 0 0 14px 0; text-align: right; direction: rtl;">
        ${lines.join('<br />')}
      </p>
    `;
  }).join('');

  // 3 Images Showcase (clean table, no heavy background boxes)
  const productImages = Array.isArray(images) && images.length >= 3 ? images : [
    'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-ahly.jpg',
    'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-barca.jpg',
    'https://gamcgqbilnbjabxrvgcu.supabase.co/storage/v1/object/public/products/kemet-track-france.jpg'
  ];

  const imagesHtml = productImages.length >= 3 ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 24px 0; border-collapse: collapse;">
      <tr>
        <td width="33.33%" align="center" valign="top" style="padding: 4px;">
          <img src="${productImages[0]}" alt="تراك النادي الأهلي الشتوي" width="170" style="width: 100%; max-width: 170px; height: auto; border-radius: 8px; display: block; border: 1px solid #E2E8F0;" />
        </td>
        <td width="33.33%" align="center" valign="top" style="padding: 4px;">
          <img src="${productImages[1]}" alt="تراك نادي برشلونة الشتوي" width="170" style="width: 100%; max-width: 170px; height: auto; border-radius: 8px; display: block; border: 1px solid #E2E8F0;" />
        </td>
        <td width="33.33%" align="center" valign="top" style="padding: 4px;">
          <img src="${productImages[2]}" alt="تراك منتخب فرنسا الشتوي" width="170" style="width: 100%; max-width: 170px; height: auto; border-radius: 8px; display: block; border: 1px solid #E2E8F0;" />
        </td>
      </tr>
    </table>
  ` : '';

  // Optional Coupon Card
  const couponHtml = cleanCoupon ? `
    <div style="background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 8px; padding: 16px; text-align: center; margin: 18px 0;">
      <span style="font-size: 13px; font-weight: 700; color: #64748B; display: block; margin-bottom: 6px; font-family: 'Cairo', sans-serif;">
        كود الخصم الحصري:
      </span>
      <div style="background: #0F172A; border-radius: 6px; padding: 6px 20px; display: inline-block;">
        <span style="font-family: monospace; font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: 3px;">
          ${cleanCoupon}
        </span>
      </div>
      ${discountNote ? `
      <span style="font-size: 13px; font-weight: 800; color: #059669; display: block; margin-top: 6px; font-family: 'Cairo', sans-serif;">
        ${discountNote}
      </span>
      ` : ''}
    </div>
  ` : '';

  return `
    <div style="font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px 20px; border: 1px solid #E2E8F0; border-radius: 8px; background-color: #FFFFFF; direction: rtl; text-align: right;">
      
      <!-- Logo Header -->
      <div style="text-align: left; margin-bottom: 20px; border-bottom: 1px solid #F1F5F9; padding-bottom: 14px;">
        <a href="https://kemetmisr.com" target="_blank" style="text-decoration: none; display: inline-block;">
          <img src="https://kemetmisr.com/assets/kemet-text-logo.png" alt="KEMET" style="height: 32px; border: 0; display: block;" />
        </a>
      </div>

      <!-- Headline -->
      <h2 style="color: #0F172A; font-family: 'Cairo', 'Tajawal', Arial, sans-serif; font-size: 22px; font-weight: 900; margin: 0 0 16px 0; line-height: 1.4; text-align: right;">
        ${cleanHeadline}
      </h2>

      <!-- Body Paragraphs -->
      <div style="margin: 18px 0 22px 0; text-align: right; direction: rtl;">
        ${formattedParagraphsHtml}
      </div>

      <!-- Optional Coupon Box -->
      ${couponHtml}

      <!-- 3 Product Showcase Cards -->
      ${imagesHtml}

      <!-- Dual Action Buttons -->
      <div style="text-align: center; margin-top: 26px; margin-bottom: 20px;">
        <a href="${cleanCtaUrl}" target="_blank" style="display: block; background: #0F172A; color: #FFFFFF; font-family: 'Cairo', 'Tajawal', Arial, sans-serif; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-size: 15px; font-weight: 800; margin-bottom: 10px;">
          ${cleanCtaText}
        </a>
        ${cleanWhatsappUrl ? `
        <a href="${cleanWhatsappUrl}" target="_blank" style="display: block; background: #25D366; color: #FFFFFF; font-family: 'Cairo', 'Tajawal', Arial, sans-serif; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-size: 15px; font-weight: 800;">
          ${cleanWhatsappText}
        </a>
        ` : ''}
      </div>

      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      
      <!-- Footer Section -->
      <p style="color: #94A3B8; font-family: 'Cairo', Arial, sans-serif; font-size: 12px; text-align: center; margin: 0;">
        KEMET — جميع الحقوق محفوظة &copy; 2026 (kemetmisr.com)
      </p>
    </div>
  `;
}
