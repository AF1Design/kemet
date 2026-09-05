'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { createOrderAction, getCouponsAction, recordCouponUsageAction } from '../admin/actions';
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
  const { cart, clearCart, addOrder, user, cmsSettings, t } = useApp();

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
  const rawShippingFee = rates[formData.governorate] ?? 50;
  const shippingFee = isFreeShippingPromo ? 0 : rawShippingFee;

  // Calculate discount amount (shipping is strictly NON-discountable and added on top)
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.type === 'fixed_price'
        ? cart.reduce((sum, item) => {
            const itemPrice = Number(item.price) || 450;
            const target = Number(appliedCoupon.targetPrice || appliedCoupon.value || 220);
            const discountPerPiece = Math.max(0, itemPrice - target);
            return sum + (discountPerPiece * item.quantity);
          }, 0)
        : (appliedCoupon.type === 'percentage' 
            ? Math.round((subtotal * Number(appliedCoupon.value)) / 100) 
            : Math.min(subtotal, Number(appliedCoupon.value))))
    : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount) + shippingFee;

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

  // Handle Apply Coupon
  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const coupon = availableCoupons.find(c => c.code.toUpperCase() === code);

    if (!coupon) {
      setCouponMsg({ type: 'error', text: 'كود الخصم غير صحيح أو غير موجود' });
      return;
    }

    if (!coupon.isActive) {
      setCouponMsg({ type: 'error', text: 'تم إيقاف هذا البروموكود وغير مفعّل حالياً' });
      return;
    }

    const userEmail = (user?.email || formData.phone || 'guest').toLowerCase().trim();
    const usedList = (coupon.usedBy || []).map(e => String(e).toLowerCase().trim());
    const hasAlreadyUsed = usedList.includes(userEmail);

    if (hasAlreadyUsed) {
      setCouponMsg({ type: 'error', text: 'لقد استخدمت هذا البروموكود من قبل' });
      return;
    }

    const totalMax = coupon.totalMaxUses ?? 1000;
    const remaining = coupon.remainingUses ?? (totalMax - (coupon.usedBy || []).length);

    if (remaining <= 0 || (coupon.usedBy || []).length >= totalMax) {
      setCouponMsg({ type: 'error', text: 'تم الوصول للحد الأقصى لعدد استخدامات هذا الكود وانتهت صلاحيته' });
      return;
    }

    setAppliedCoupon(coupon);

    if (coupon.type === 'fixed_price') {
      const target = coupon.targetPrice || coupon.value || 220;
      setCouponMsg({ 
        type: 'success', 
        text: `تم تطبيق كود (${coupon.code}) بنجاح! أصبح سعر التيشيرت ${target} ج.م بدلاً من السعر الأصلي + مصاريف الشحن` 
      });
    } else {
      setCouponMsg({ 
        type: 'success', 
        text: `تم تطبيق الكوبون (${coupon.code}) بخصم ${coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ج.م`} على المنتجات + مصاريف الشحن` 
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login?redirect=/checkout';
      }
      return;
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
      customer: {
        ...formData,
        email: user?.email || formData.email || null
      },
      customer_email: user?.email || formData.email || null
    };

    // Update coupon usage & decrement remaining uses in database
    if (appliedCoupon) {
      try {
        const userEmail = (user?.email || formData.phone || 'guest').toLowerCase().trim();
        recordCouponUsageAction(appliedCoupon.code, userEmail).catch(err => {
          console.warn('Coupon usage record note:', err);
        });
      } catch (err) {
        console.warn('Coupon usage save note:', err);
      }
    }

    // Instant Non-blocking Server Save (Zero Delay UX)
    createOrderAction(newOrder).catch(err => {
      console.warn('Background order save note:', err);
    });

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
                  {t('fullName')}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="الاسم الأول والعائلة"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {t('phone')}
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <input 
                  type="checkbox"
                  defaultChecked={true}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--gold-primary)' }}
                />
                <span>{t('smsMarketingLabel')}</span>
              </label>

              <button type="submit" disabled={isSubmitting || cart.length === 0} className="btn-primary" style={{ width: '100%', padding: '0.95rem', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                {isSubmitting ? 'جاري تأكيد الطلب فورياً...' : `تأكيد الطلب بدفع ${totalAmount} ج.م`}
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

              {/* Coupon Code Input Area */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  هل لديك كود خصم أو بروموكود؟
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    placeholder="أدخل كود الخصم (مثال: KEMETFAMILY)"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    disabled={appliedCoupon !== null}
                    style={{ flexGrow: 1, padding: '0.65rem 0.85rem', fontSize: '0.88rem', textTransform: 'uppercase' }}
                  />
                  {appliedCoupon ? (
                    <button 
                      type="button" 
                      onClick={handleRemoveCoupon}
                      style={{ background: '#F43F5E', color: '#FFF', border: 'none', padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      إلغاء
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon}
                      className="btn-secondary"
                      style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', fontWeight: 800 }}
                    >
                      تطبيق الخصم
                    </button>
                  )}
                </div>

                {couponMsg && (
                  <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', fontWeight: 800, color: couponMsg.type === 'error' ? '#F43F5E' : '#10B981' }}>
                    {couponMsg.text}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <span>المجموع الفرعي للمنتجات:</span>
                  <span>{subtotal} ج.م</span>
                </div>

                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#10B981', fontWeight: 800 }}>
                    <span>خصم الكوبون ({appliedCoupon.code}):</span>
                    <span>- {discountAmount} ج.م</span>
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
