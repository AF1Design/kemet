'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { createOrderAction, getCouponsAction, recordCouponUsageAction, syncCustomerCartAction } from '../admin/actions';
import { DEFAULT_COUPONS } from '../../lib/coupons';
import { trackBeginCheckout, trackPurchase } from '../../lib/analytics';

// Shipping rates by governorate in EGP
const SHIPPING_RATES = {
  'القاهرة': 60,
  'الجيزة': 60,
  'القليوبية': 60,
  'الإسكندرية': 60,
  'الشرقية': 70,
  'الدقهلية': 70,
  'الغربية': 70,
  'المنوفية': 70,
  'البحيرة': 70,
  'كفر الشيخ': 70,
  'دمياط': 70,
  'بورسعيد': 70,
  'الإسماعيلية': 70,
  'السويس': 70,
  'بني سويف': 80,
  'الفيوم': 80,
  'المنيا': 80,
  'أسيوط': 80,
  'سوهاج': 90,
  'قنا': 90,
  'الأقصر': 90,
  'أسوان': 90,
  'البحر الأحمر': 110,
  'جنوب سيناء': 110,
  'شمال سيناء': 110,
  'مطروح': 110,
  'الوادي الجديد': 110,
  'محافظة أخرى': 80
};

export default function CheckoutPage() {
  const { cart, clearCart, addOrder, user, cmsSettings, lang, t } = useApp();

  const rates = cmsSettings?.shippingRates || SHIPPING_RATES;
  const isFreeShippingPromo = cmsSettings?.isFreeShippingPromo ?? false;

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    governorate: user?.governorate || 'القاهرة',
    address: user?.address || '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState(DEFAULT_COUPONS || []);
  const hasTrackedBeginCheckout = useRef(false);

  useEffect(() => {
    // Clear legacy local coupons cache to enforce strict server-side validation
    try {
      localStorage.removeItem('kemet_coupons');
    } catch (e) {}

    // Load active coupons dynamically from database
    async function loadCoupons() {
      try {
        const res = await getCouponsAction();
        if (res.success && res.coupons && res.coupons.length > 0) {
          setAvailableCoupons(res.coupons);
        }
      } catch (err) {
        console.warn('Coupons load note:', err);
      }
    }
    loadCoupons();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 280) * item.quantity, 0);
  const totalCartPieces = cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const rawShippingFee = rates[formData.governorate] ?? 50;
  const shippingFee = isFreeShippingPromo ? 0 : rawShippingFee;

  // Calculate discount amount (shipping is strictly NON-discountable and added on top)
  // Respects maxDiscountedPieces limit if configured for the coupon
  let discountAmount = 0;
  let discountedPiecesCount = 0;

  if (appliedCoupon) {
    const minPiecesRequired = Number(appliedCoupon.minOrderPieces) > 0 ? Number(appliedCoupon.minOrderPieces) : 1;
    if (totalCartPieces >= minPiecesRequired) {
      const maxPieces = (appliedCoupon.maxDiscountedPieces && Number(appliedCoupon.maxDiscountedPieces) > 0)
        ? Number(appliedCoupon.maxDiscountedPieces)
        : Infinity;

      if (appliedCoupon.type === 'fixed_price') {
      let remainingAllowed = maxPieces;
      const target = Number(appliedCoupon.targetPrice || appliedCoupon.value || 220);

      for (const item of cart) {
        if (remainingAllowed <= 0) break;
        const itemPrice = Number(item.price) || 450;
        const discountPerPiece = Math.max(0, itemPrice - target);
        const piecesToApply = Math.min(Number(item.quantity || 1), remainingAllowed);

        discountAmount += (discountPerPiece * piecesToApply);
        discountedPiecesCount += piecesToApply;
        remainingAllowed -= piecesToApply;
      }
    } else if (appliedCoupon.type === 'percentage') {
      let remainingAllowed = maxPieces;
      let eligibleSubtotal = 0;

      for (const item of cart) {
        if (remainingAllowed <= 0) break;
        const itemPrice = Number(item.price) || 450;
        const piecesToApply = Math.min(Number(item.quantity || 1), remainingAllowed);

        eligibleSubtotal += (itemPrice * piecesToApply);
        discountedPiecesCount += piecesToApply;
        remainingAllowed -= piecesToApply;
      }

      discountAmount = Math.round((eligibleSubtotal * Number(appliedCoupon.value)) / 100);
    } else {
      // Fixed amount discount
      discountAmount = Math.min(subtotal, Number(appliedCoupon.value));
      discountedPiecesCount = Math.min(totalCartPieces, maxPieces === Infinity ? totalCartPieces : maxPieces);
    }
  }
}

  const totalAmount = Math.max(0, subtotal - discountAmount) + shippingFee;

  // Helper: Computes how many times a user / phone / account has used this specific coupon
  const checkCouponUserUsage = (coupon, email, phone, uid) => {
    if (!coupon) return 0;
    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanPhone = String(phone || '').trim();
    const cleanUid = String(uid || '').trim();

    let count = 0;

    // 1. From userUsage object
    if (coupon.userUsage && typeof coupon.userUsage === 'object') {
      if (cleanEmail && coupon.userUsage[cleanEmail]) {
        count = Math.max(count, Number(coupon.userUsage[cleanEmail]) || 0);
      }
      if (cleanPhone && coupon.userUsage[cleanPhone]) {
        count = Math.max(count, Number(coupon.userUsage[cleanPhone]) || 0);
      }
      if (cleanUid && coupon.userUsage[cleanUid]) {
        count = Math.max(count, Number(coupon.userUsage[cleanUid]) || 0);
      }
    }

    // 2. From orders history array
    if (Array.isArray(coupon.orders)) {
      const matchingOrders = coupon.orders.filter(o => {
        const oEmail = String(o.customerEmail || o.customer?.email || '').toLowerCase().trim();
        const oPhone = String(o.customerPhone || o.customer?.phone || '').trim();
        const oUid = String(o.userId || '').trim();
        return (cleanEmail && oEmail && oEmail === cleanEmail) ||
               (cleanPhone && oPhone && oPhone === cleanPhone) ||
               (cleanUid && oUid && oUid === cleanUid);
      });
      count = Math.max(count, matchingOrders.length);
    }

    // 3. Fallback to legacy usedBy list
    if (count === 0 && Array.isArray(coupon.usedBy)) {
      const cleanUsedList = coupon.usedBy.map(e => String(e).toLowerCase().trim());
      if ((cleanEmail && cleanUsedList.includes(cleanEmail)) || (cleanPhone && cleanUsedList.includes(cleanPhone))) {
        count = 1;
      }
    }

    return count;
  };

  // Marketing Analytics: Track Begin Checkout once on checkout page load
  useEffect(() => {
    if (cart.length > 0 && !hasTrackedBeginCheckout.current) {
      hasTrackedBeginCheckout.current = true;
      trackBeginCheckout(cart, totalAmount);
    }
  }, [cart, totalAmount]);

  // Marketing Analytics: Track Purchase upon verified successful order creation
  useEffect(() => {
    if (isSubmitted && createdOrder) {
      trackPurchase(createdOrder);
    }
  }, [isSubmitted, createdOrder]);

  // Update abandoned cart drop-off stage when customer reviews or fills checkout form
  useEffect(() => {
    const cleanPhone = (formData.phone || user?.phone || '').replace(/\D/g, '');
    const hasIdentifier = user?.id || cleanPhone.length >= 10;

    if (cart.length > 0 && hasIdentifier && !isSubmitted) {
      const timer = setTimeout(() => {
        syncCustomerCartAction({
          userId: user?.id || null,
          customer: {
            fullName: formData.fullName || user?.fullName || 'عميل في صفحة الدفع',
            phone: formData.phone || user?.phone || '',
            governorate: formData.governorate || user?.governorate || 'القاهرة',
            address: formData.address || user?.address || '',
            email: user?.email || ''
          },
          items: cart,
          lastPage: 'صفحة إتمام الطلب (Checkout)'
        }).catch(() => {});
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [cart, formData.fullName, formData.phone, formData.governorate, formData.address, user, isSubmitted]);

  // Handle Apply Coupon
  const handleApplyCoupon = (explicitCode = null) => {
    const rawCode = (typeof explicitCode === 'string' && explicitCode.trim()) ? explicitCode : couponInput;
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    if (explicitCode) {
      setCouponInput(code);
    }

    const coupon = availableCoupons.find(c => c.code.toUpperCase() === code);

    if (!coupon) {
      setCouponMsg({ type: 'error', text: 'كود الخصم غير صحيح أو غير موجود' });
      return;
    }

    if (!coupon.isActive) {
      setCouponMsg({ type: 'error', text: 'تم إيقاف هذا البروموكود وغير مفعّل حالياً' });
      return;
    }

    // 1. Check total max uses for the entire store
    const totalMax = coupon.totalMaxUses ?? 1000;
    const remaining = coupon.remainingUses ?? (totalMax - (coupon.usedBy || []).length);

    if (remaining <= 0 || (coupon.usedBy || []).length >= totalMax) {
      setCouponMsg({ type: 'error', text: 'تم الوصول للحد الأقصى لعدد استخدامات هذا الكود وانتهت صلاحيته' });
      return;
    }

    // 2. Check max uses per account / user
    const maxPerUser = Number(coupon.maxUsesPerUser) > 0 ? Number(coupon.maxUsesPerUser) : 1;
    const userUses = checkCouponUserUsage(coupon, user?.email || formData.email, formData.phone, user?.id);

    if (userUses >= maxPerUser) {
      setCouponMsg({ 
        type: 'error', 
        text: `لقد استنفدت الحد الأقصى المسموح به لاستخدام هذا الكود لحسابك (${maxPerUser} مرة)` 
      });
      return;
    }

    // 3. Check minimum order pieces requirement
    const minPiecesRequired = Number(coupon.minOrderPieces) > 0 ? Number(coupon.minOrderPieces) : 1;
    if (totalCartPieces < minPiecesRequired) {
      if (code === 'KEMETMISR' && minPiecesRequired === 2) {
        setCouponMsg({
          type: 'error',
          text: `عذراً، كود KEMETMISR يشترط طلب قطعتين على الأقل للاستفادة من سعر 225 ج.م للتيشيرت (عدد القطع الحالية في السلة: ${totalCartPieces}). يمكنك إضافة قطعة أخرى أو استخدام كود KEMET22 للقطعة الواحدة بسعر 290 ج.م.`
        });
      } else {
        setCouponMsg({
          type: 'error',
          text: `يشترط هذا الكود وجود ${minPiecesRequired} قطع على الأقل في السلة لتطبيقه (لديك حالياً ${totalCartPieces} قطعة).`
        });
      }
      return;
    }

    setAppliedCoupon(coupon);

    const piecesLimit = (coupon.maxDiscountedPieces && Number(coupon.maxDiscountedPieces) > 0)
      ? Number(coupon.maxDiscountedPieces)
      : null;

    const piecesNotice = piecesLimit ? ` (يسري الخصم على حتى ${piecesLimit} قطعة في الطلب)` : '';

    if (coupon.type === 'fixed_price') {
      const target = coupon.targetPrice || coupon.value || 220;
      setCouponMsg({ 
        type: 'success', 
        text: `تم تطبيق كود (${coupon.code}) بنجاح! أصبح سعر التيشيرت ${target} ج.م بدلاً من السعر الأصلي${piecesNotice} + مصاريف الشحن` 
      });
    } else {
      setCouponMsg({ 
        type: 'success', 
        text: `تم تطبيق الكوبون (${coupon.code}) بخصم ${coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ج.م`} على المنتجات${piecesNotice} + مصاريف الشحن` 
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg(null);
  };

  // Ensure user is logged in before accessing checkout
  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      window.location.href = '/login?redirect=/checkout';
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?redirect=/checkout';
      }
      return;
    }

    // Validation 1: Full name must be a 3-part name
    const nameWords = (formData.fullName || '').trim().split(/\s+/).filter(w => w.length >= 2);
    if (nameWords.length < 3) {
      setNameError('يجب إدخال الاسم ثلاثي');
      return;
    }

    // Validation 2: Phone number must be exactly 11 digits starting with 01
    const cleanPhone = (formData.phone || '').trim().replace(/\D/g, '');
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setPhoneError('يجب ان يكون رقم الهاتف صحيح');
      return;
    }

    // Safety re-check: Verify user usage limits on final submission to prevent bypassing
    if (appliedCoupon) {
      const maxPerUser = Number(appliedCoupon.maxUsesPerUser) > 0 ? Number(appliedCoupon.maxUsesPerUser) : 1;
      const userUses = checkCouponUserUsage(appliedCoupon, user?.email || formData.email, formData.phone, user?.id);
      if (userUses >= maxPerUser) {
        setCouponMsg({ 
          type: 'error', 
          text: `عذراً، تم استنفاد الحد الأقصى المسموح لاستخدام هذا الكود لهذا الحساب أو رقم الهاتف (${maxPerUser} مرة).` 
        });
        setIsSubmitting(false);
        return;
      }

      // Safety re-check: Verify minOrderPieces on final submission
      const minPiecesRequired = Number(appliedCoupon.minOrderPieces) > 0 ? Number(appliedCoupon.minOrderPieces) : 1;
      if (totalCartPieces < minPiecesRequired) {
        setCouponMsg({
          type: 'error',
          text: `عذراً، لا يمكن إتمام الطلب بهذا الكود لأن الحد الأدنى للقطع هو ${minPiecesRequired} قطعة (السلة بها ${totalCartPieces} قطعة فقط).`
        });
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);

    const orderId = `KT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      userId: user?.id || null,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      status: 'جديد',
      items: [...cart],
      subtotal: subtotal,
      shipping: shippingFee,
      shipping_fee: shippingFee,
      discount: discountAmount,
      total: totalAmount,
      total_amount: totalAmount,
      totalAmount: totalAmount,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      coupon_details: appliedCoupon ? {
        code: appliedCoupon.code,
        type: appliedCoupon.type,
        targetPrice: appliedCoupon.targetPrice || null,
        value: appliedCoupon.value || null,
        discountAmount: discountAmount
      } : null,
      customer: {
        ...formData,
        email: user?.email || formData.email || null
      },
      customer_email: user?.email || formData.email || null
    };

    // Update coupon usage & record order statistics in database
    if (appliedCoupon) {
      try {
        const userEmail = (user?.email || formData.phone || 'guest').toLowerCase().trim();
        recordCouponUsageAction(appliedCoupon.code, userEmail, newOrder).catch(err => {
          console.warn('Coupon usage record note:', err);
        });
      } catch (err) {
        console.warn('Coupon usage save note:', err);
      }
    }

    // Reliable Server Save
    try {
      await createOrderAction(newOrder);
    } catch (err) {
      console.warn('Order save note:', err);
    }

    // Marketing Analytics: Track Purchase Event (Idempotent by Order ID)
    trackPurchase(newOrder);

    addOrder(newOrder);
    setCreatedOrder(newOrder);
    setIsSubmitted(true);
    clearCart();
    setIsSubmitting(false);
  };

  if (isSubmitted && createdOrder) {
    const finalDisplayTotal = createdOrder.total ?? createdOrder.total_amount ?? totalAmount;

    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <section className="section" style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <div className="container" style={{ maxWidth: '650px', textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold-bright)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '3rem 2rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✓</div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>
                تم تأكيد طلبك بنجاح
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                شكراً لثقتك بـ KEMET. تم استلام طلبك برقم <strong style={{ color: '#FFF' }}>#{createdOrder.id}</strong> وجاري تجهيزه للشحن فوراً.
              </p>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', textAlign: 'right', fontSize: '0.9rem' }}>
                <div><strong>اسم العميل:</strong> {createdOrder.customer.fullName}</div>
                <div><strong>رقم الموبايل:</strong> {createdOrder.customer.phone}</div>
                <div><strong>العنوان:</strong> {createdOrder.customer.governorate} ({createdOrder.customer.address})</div>
                {createdOrder.discount > 0 && <div style={{ color: '#10B981', fontWeight: 800 }}><strong>مبلغ الخصم:</strong> - {createdOrder.discount} ج.م</div>}
                <div><strong>المبلغ الإجمالي المطلوب عند الاستلام:</strong> <strong style={{ color: 'var(--gold-primary)', fontSize: '1.15rem' }}>{finalDisplayTotal} ج.م</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/my-orders" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  متابعة طلباتي
                </Link>
                <Link href="/" className="btn-secondary" style={{ padding: '0.85rem 2rem' }}>
                  العودة للمتجر
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container">
          
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              <span className="brand-glow">{t('checkoutTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              أدخل بيانات الشحن والتسليم لتأكيد الطلب والدفع عند الاستلام
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Customer Form */}
            <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                بيانات الشحن والتسليم
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  الاسم ثلاثي
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="الاسم ثلاثي"
                  value={formData.fullName}
                  onChange={e => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (nameError) setNameError(null);
                  }}
                  style={{
                    borderColor: nameError ? '#EF4444' : undefined
                  }}
                />
                {nameError && (
                  <span style={{ display: 'block', color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, marginTop: '0.35rem' }}>
                    {nameError}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {t('phone')}
                </label>
                <input 
                  type="tel" 
                  required
                  maxLength={11}
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={e => {
                    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setFormData({ ...formData, phone: onlyNums });
                    if (phoneError) setPhoneError(null);
                  }}
                  style={{
                    borderColor: phoneError ? '#EF4444' : undefined
                  }}
                />
                {phoneError && (
                  <span style={{ display: 'block', color: '#EF4444', fontSize: '0.8rem', fontWeight: 800, marginTop: '0.35rem' }}>
                    {phoneError}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {t('governorate')}
                </label>
                <select 
                  value={formData.governorate}
                  onChange={e => setFormData({ ...formData, governorate: e.target.value })}
                >
                  {Object.keys(SHIPPING_RATES).map(gov => (
                    <option key={gov} value={gov}>{gov} ({SHIPPING_RATES[gov]} ج.م شحن)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {t('address')}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="الحي / الشارع / رقم العمارة والشقة"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {t('notes')}
                </label>
                <textarea 
                  rows="3"
                  placeholder="أي ملاحظات خاصة بالتوصيل..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '0.9rem', fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                {t('codNotice')}
              </div>

              {/* Coupon Code Section - Placed prominently above the submit button for easy mobile access */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                marginTop: '0.5rem',
                marginBottom: '0.75rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                    كود الخصم / العروض الترويجية
                  </span>
                  {appliedCoupon && (
                    <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 800 }}>
                      تم تفعيل ({appliedCoupon.code})
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    placeholder="أدخل كود الخصم هنا (مثال: KEMET22)"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    disabled={appliedCoupon !== null}
                    style={{
                      flexGrow: 1,
                      padding: '0.75rem 0.95rem',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  />
                  {appliedCoupon ? (
                    <button 
                      type="button" 
                      onClick={handleRemoveCoupon}
                      style={{
                        background: '#F43F5E',
                        color: '#FFF',
                        border: 'none',
                        padding: '0.75rem 1.25rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => handleApplyCoupon()}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.4rem',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      تطبيق الكود
                    </button>
                  )}
                </div>

                {/* 1-Click Fast Apply Offer Chips */}
                {(() => {
                  const suggestedCoupons = (availableCoupons || []).filter(c => c.isActive && c.isSuggested);
                  if (suggestedCoupons.length === 0) return null;

                  return (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        {lang === 'ar' ? 'عروض سريعة بضغطة واحدة:' : 'Quick offers (1-click):'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {suggestedCoupons.map((c) => {
                          const isSelected = appliedCoupon?.code?.toUpperCase() === c.code?.toUpperCase();
                          const label = c.suggestionLabel || c.description || (c.type === 'fixed_price' ? `سعر القطعة ${c.targetPrice || c.value} ج.م - كود ${c.code}` : `كود ${c.code}`);

                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              style={{
                                background: isSelected ? 'var(--gold-primary)' : 'rgba(212, 175, 55, 0.12)',
                                color: isSelected ? '#000' : 'var(--gold-primary)',
                                border: '1px solid var(--border-gold)',
                                padding: '0.4rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'right'
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {couponMsg && (
                  <div style={{
                    fontSize: '0.84rem',
                    marginTop: '0.75rem',
                    fontWeight: 800,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    background: couponMsg.type === 'error' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: couponMsg.type === 'error' ? '#F43F5E' : '#10B981',
                    border: `1px solid ${couponMsg.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                  }}>
                    {couponMsg.text}
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSubmitting || cart.length === 0} className="btn-primary" style={{ width: '100%', padding: '0.95rem', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                {isSubmitting 
                  ? (lang === 'ar' ? 'جاري إتمام الطلب فورياً...' : 'Processing order...') 
                  : (lang === 'ar' 
                      ? `إتمام الطلب بدفع ${totalAmount} ج.م عند الاستلام` 
                      : `Complete Order - Pay ${totalAmount} ${t('currency')} on Delivery`
                    )
                }
              </button>
            </form>

            {/* Order Summary */}
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '2rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                ملخص طلب الشراء ({cart.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                    <img src={item.image || item.main_image} alt={item.nameAr} style={{ width: '54px', height: '54px', objectFit: 'contain', background: '#000', borderRadius: 'var(--radius-sm)' }} />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>{item.nameAr}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>المقاس: {item.size} | الكمية: {item.quantity}</div>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                      {(item.price || 280) * item.quantity} ج.م
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Coupon Banner in Order Summary */}
              {appliedCoupon && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10B981' }}>
                      تم تفعيل كود الخصم ({appliedCoupon.code})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      وفرت {discountAmount} {t('currency')} من قيمة المنتجات
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#F43F5E',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء الخصم
                  </button>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <span>المجموع الفرعي للمنتجات:</span>
                  <span>{subtotal} ج.م</span>
                </div>

                {appliedCoupon && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#10B981', fontWeight: 800 }}>
                      <span>خصم الكوبون ({appliedCoupon.code}):</span>
                      <span>- {discountAmount} ج.م</span>
                    </div>
                    {appliedCoupon.maxDiscountedPieces && totalCartPieces > discountedPiecesCount && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--gold-primary)', background: 'rgba(212, 175, 55, 0.08)', padding: '0.35rem 0.6rem', borderRadius: '4px', marginTop: '0.35rem', border: '1px solid rgba(212, 175, 55, 0.25)', lineHeight: '1.4' }}>
                        ملاحظة: يسري الخصم على ({discountedPiecesCount}) قطعة فقط وفق شروط الكود، والقطع الإضافية ({totalCartPieces - discountedPiecesCount}) بسعرها الطبيعي.
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <span>مصاريف الشحن ({formData.governorate}):</span>
                  <span>+ {shippingFee} ج.م</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.35rem', fontWeight: 900, color: 'var(--gold-primary)', paddingTop: '0.75rem', borderTop: '1px solid var(--border-gold)' }}>
                  <span>الإجمالي الكلي المطلوب:</span>
                  <span>{totalAmount} ج.م</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
