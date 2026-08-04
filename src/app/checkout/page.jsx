'use client';

import React, { useState } from 'react';
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

export default function CheckoutPage() {
  const { cart, clearCart, addOrder, t } = useApp();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    governorate: 'القاهرة',
    address: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 280) * item.quantity, 0);
  const shippingFee = SHIPPING_RATES[formData.governorate] || 50;
  const totalAmount = subtotal + shippingFee;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    const orderId = `KM-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: orderId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      status: 'جديد 📦',
      items: [...cart],
      subtotal: subtotal,
      shipping: shippingFee,
      total: totalAmount,
      customer: { ...formData }
    };

    // Instant Non-blocking Server Save (Zero Delay UX)
    createOrderAction(newOrder).catch(err => {
      console.warn('Background order save note:', err);
    });

    addOrder(newOrder);
    setCreatedOrder(newOrder);
    setIsSubmitted(true);
    clearCart();
  };

  if (isSubmitted && createdOrder) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <section className="section" style={{ flexGrow: 1 }}>
          <div className="container" style={{ maxWidth: '650px', textAlign: 'center' }}>
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold-bright)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '3.5rem 2rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--gold-primary)' }}>
                {t('orderSuccessTitle')}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                رقم طلبك الكلي المعتمد هو: <strong style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>#{createdOrder.id}</strong>
                <br />
                الإجمالي المستحق شامل الشحن: <strong style={{ color: 'var(--gold-primary)', fontSize: '1.2rem' }}>{createdOrder.total} ج.م</strong>
                <br />
                {t('orderSuccessDesc')}
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/my-orders" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  مشاهدة الطلب في قسم طلباتي 🛍️
                </Link>
                <Link href="/" className="btn-secondary" style={{ padding: '0.85rem 2rem' }}>
                  {t('backHomeBtn')}
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
        <div className="container" style={{ maxWidth: '900px' }}>
          
          {/* Page Title */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">💳 {t('checkoutTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              {t('checkoutSubtitle')}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Customer Form */}
            <form onSubmit={handleSubmit} style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                بيانات الشحن والتوصيل
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  {t('fullName')}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="أدخل اسمك بالكامل"
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
                  placeholder="01xxxxxxxx"
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

              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', padding: '0.95rem', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                {isSubmitting ? 'جاري تأكيد الطلب فورياً...' : `تأكيد الطلب بدفع ${totalAmount} ج.م 🛍️`}
              </button>
            </form>

            {/* Order Summary */}
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold-bright)', 
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

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <span>المجموع الفرعي للمنتجات:</span>
                  <span>{subtotal} ج.م</span>
                </div>
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
