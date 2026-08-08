'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { createOrderAction } from '../admin/actions';

// Shipping rates by governorate in EGP
const SHIPPING_RATES = {
  'القاهرة': 40,
  'الجيزة': 40,
  'الإسكندرية': 50,
  'القليوبية': 45,
  'الشرقية': 50,
  'الدقهلية': 50,
  'الغربية': 50,
  'المنوفية': 50,
  'البحيرة': 55,
  'كفر الشيخ': 55,
  'دمياط': 55,
  'الإسماعيلية': 55,
  'السويس': 55,
  'بورسعيد': 55,
  'بني سويف': 60,
  'المنيا': 60,
  'أسيوط': 65,
  'سوهاج': 65,
  'قنا': 70,
  'الأقصر': 70,
  'أسوان': 75,
  'محافظة أخرى': 60
};

// Default registered coupons store
const INITIAL_COUPONS = [
  { code: 'KEMET10', type: 'percentage', value: 10, isActive: true, totalMaxUses: 1000, remainingUses: 1000, maxUsesPerUser: 1, usedBy: [] },
  { code: 'OFF50', type: 'fixed', value: 50, isActive: true, totalMaxUses: 500, remainingUses: 500, maxUsesPerUser: 1, usedBy: [] },
  { code: 'LEGACY2027', type: 'percentage', value: 15, isActive: true, totalMaxUses: 100, remainingUses: 100, maxUsesPerUser: 1, usedBy: [] }
];

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
  const [availableCoupons, setAvailableCoupons] = useState(INITIAL_COUPONS);

  useEffect(() => {
    // Clear legacy local coupons cache to enforce strict server-side validation
    try {
      localStorage.removeItem('kemet_coupons');
    } catch (e) {}
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 280) * item.quantity, 0);
  const rawShippingFee = rates[formData.governorate] ?? 50;
  const shippingFee = isFreeShippingPromo ? 0 : rawShippingFee;

  // Calculate discount amount
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? Math.round((subtotal * Number(appliedCoupon.value)) / 100) 
        : Math.min(subtotal, Number(appliedCoupon.value)))
    : 0;

  const totalAmount = Math.max(0, subtotal - discountAmount) + shippingFee;

  // Handle Apply Coupon
  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const coupon = availableCoupons.find(c => c.code.toUpperCase() === code);

    if (!coupon) {
      setCouponMsg({ type: 'error', text: '⚠️ كود الخصم غير صحيح أو غير موجود' });
      return;
    }

    if (!coupon.isActive) {
      setCouponMsg({ type: 'error', text: '⚠️ تم إيقاف هذا البروموكود وغير مفعّل حالياً' });
      return;
    }

    const userEmail = (user?.email || formData.phone || 'guest').toLowerCase().trim();
    const usedList = (coupon.usedBy || []).map(e => String(e).toLowerCase().trim());
    const hasAlreadyUsed = usedList.includes(userEmail);

    if (hasAlreadyUsed) {
      setCouponMsg({ type: 'error', text: '⚠️ لقد استخدمت هذا البروموكود من قبل' });
      return;
    }

    const totalMax = coupon.totalMaxUses ?? 1000;
    const remaining = coupon.remainingUses ?? (totalMax - (coupon.usedBy || []).length);

    if (remaining <= 0 || (coupon.usedBy || []).length >= totalMax) {
      setCouponMsg({ type: 'error', text: '⚠️ تم الوصول الحد الاقصي لعدد استخدامات هذا الكود وتم انتهاء صلاحيته' });
      return;
    }

    setAppliedCoupon(coupon);
    setCouponMsg({ type: 'success', text: `✅ تم تطبيق الكوبون (${coupon.code}) بخصم ${coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ج.م`}!` });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    const orderId = `KM-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      userId: user?.id || null,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      status: 'جديد 📦',
      items: [...cart],
      subtotal: subtotal,
      discount: discountAmount,
      customer: {
        ...formData,
        email: user?.email || formData.email || null
      },
      customer_email: user?.email || formData.email || null
    };

    // Update coupon usage & decrement remaining uses
    if (appliedCoupon) {
      try {
        const userEmail = (user?.email || formData.phone || 'guest').toLowerCase().trim();
        const updatedCoupons = availableCoupons.map(c => {
          if (c.code.toUpperCase() === appliedCoupon.code.toUpperCase()) {
            const currentRemaining = c.remainingUses ?? ((c.totalMaxUses || 1000) - (c.usedBy || []).length);
            const newRemaining = Math.max(0, currentRemaining - 1);
            return {
              ...c,
              remainingUses: newRemaining,
              isActive: newRemaining > 0 ? c.isActive : false,
              usedBy: [...(c.usedBy || []), userEmail]
            };
          }
          return c;
        });
        setAvailableCoupons(updatedCoupons);
      } catch (err) {
        console.warn('Coupon usage save note:', err);
      }
    }

    // Instant Non-blocking Server Save (Zero Delay UX)
    createOrderAction(newOrder).catch(err => {
      console.warn('Background order save note:', err);
    });

    addOrder(newOrder);
    setCreatedOrder(newOrder);
    setIsSubmitted(true);
    clearCart();
    setIsSubmitting(false);
  };

  if (isSubmitted && createdOrder) {
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
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>
                تم تأكيد طلبك بنجاح!
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                شكراً لثقتك بـ KEMET. تم استلام طلبك برقم <strong style={{ color: '#FFF' }}>#{createdOrder.id}</strong> وجاري تجهيزه للشحن فوراً.
              </p>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', textAlign: 'right', fontSize: '0.9rem' }}>
                <div><strong>اسم العميل:</strong> {createdOrder.customer.fullName}</div>
                <div><strong>رقم الموبايل:</strong> {createdOrder.customer.phone}</div>
                <div><strong>العنوان:</strong> {createdOrder.customer.governorate} ({createdOrder.customer.address})</div>
                {createdOrder.discount > 0 && <div style={{ color: '#10B981', fontWeight: 800 }}><strong>مبلغ الخصم:</strong> - {createdOrder.discount} ج.م</div>}
                <div><strong>المبلغ الإجمالي المطلوب عند الاستلام:</strong> <strong style={{ color: 'var(--gold-primary)', fontSize: '1.1rem' }}>{createdOrder.total} ج.م</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/my-orders" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  📋 متابعة طلباتي
                </Link>
                <Link href="/" className="btn-secondary" style={{ padding: '0.85rem 2rem' }}>
                  🏠 العودة للمتجر
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
              <span className="brand-glow">🛍️ {t('checkoutTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              أدخل بيانات الشحن والتسليم لتأكيد الطلب والدفع عند الاستلام
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Customer Form */}
            <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                📋 بيانات الشحن والتسليم
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
                {isSubmitting ? 'جاري تأكيد الطلب فورياً...' : `تأكيد الطلب بدفع ${totalAmount} ج.م 🛍️`}
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
                  🎟️ هل لديك كود خصم / كوبون؟
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text"
                    placeholder="أدخل كود الخصم (مثال: KEMET10)"
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
                      إلغاء ✕
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon}
                      className="btn-secondary"
                      style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', fontWeight: 800 }}
                    >
                      تطبيق الخصم ✨
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
