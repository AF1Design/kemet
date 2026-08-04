'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase/client';

export default function TrackOrderPage() {
  const { lang, t } = useApp();
  const [searchCode, setSearchCode] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const code = searchCode.trim();
    if (!code) return;

    setIsLoading(true);
    setIsSearched(true);
    setOrderResult(null);

    try {
      // Query Supabase orders by Order ID or Egypt Post Tracking Number
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.ilike.%${code}%,tracking_number.ilike.%${code}%`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setOrderResult(data);
      }
    } catch (err) {
      console.warn('Database tracking query warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '850px' }}>
          
          {/* Section Title */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">🚚 {t('trackOrderTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              {lang === 'ar' 
                ? 'أدخل رقم طلب KEMET (مثال: KM-2027-4160) أو كود تتبع البريد المصري (مثال: EB504461459EG)'
                : 'Enter your KEMET Order ID or Egypt Post tracking code to check status'}
            </p>
          </div>

          {/* Search Box */}
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-gold-bright)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '2.5rem 2rem',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder={lang === 'ar' ? "أدخل رقم الطلب (KM-2027) أو كود تتبع البريد المصري (EB504461459EG)..." : "Enter Order ID or Tracking Code..."}
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                style={{ flexGrow: 1, padding: '0.9rem 1.25rem', fontSize: '1rem' }}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                {t('trackBtn')}
              </button>
            </form>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a 
                href="https://www.egyptpost.org/"
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary" 
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem', fontWeight: 800 }}
              >
                🇪🇬 متابعة الاوردر من البريد المصري
              </a>
              <a 
                href={`https://api.whatsapp.com/send?phone=201114687759&text=${encodeURIComponent(`مرحباً KEMET، أود الاستفسار عن شحنتي برقم: ${searchCode}`)}`}
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary" 
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem', fontWeight: 800 }}
              >
                📱 استفسار عبر الواتساب المباشر
              </a>
            </div>
          </div>

          {/* Search State Indicator */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
              جاري البحث عن بيانات الشحنة... 🔍
            </div>
          )}

          {!isLoading && isSearched && (
            <div>
              {orderResult ? (
                /* Found Order Display Card */
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-gold-bright)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '2.5rem 2rem',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                      طلب KEMET رقم: #{orderResult.id}
                    </h3>
                    
                    {/* Status Badge */}
                    <div style={{ 
                      display: 'inline-block',
                      background: orderResult.status?.includes('out_for_delivery') || orderResult.status?.includes('مندوب') 
                        ? 'rgba(234, 179, 8, 0.2)' 
                        : 'rgba(16, 185, 129, 0.15)', 
                      border: orderResult.status?.includes('out_for_delivery') || orderResult.status?.includes('مندوب') 
                        ? '1px solid #EAB308' 
                        : '1px solid #10B981', 
                      padding: '0.5rem 1.4rem', 
                      borderRadius: 'var(--radius-full)',
                      color: orderResult.status?.includes('out_for_delivery') || orderResult.status?.includes('مندوب') ? '#EAB308' : '#10B981',
                      fontWeight: 900,
                      fontSize: '1rem',
                      marginTop: '0.5rem'
                    }}>
                      الحالة الحالية: {
                        orderResult.status?.includes('out_for_delivery') || orderResult.status?.includes('مندوب') 
                          ? 'مع المندوب 🛵' 
                          : orderResult.status?.includes('shipped') || orderResult.status?.includes('شحن')
                          ? 'تم الشحن 🚚'
                          : orderResult.status?.includes('delivered') || orderResult.status?.includes('تسليم')
                          ? 'تم التسليم ✅'
                          : orderResult.status || 'قيد التجهيز ⚙️'
                      }
                    </div>

                    {/* Special Notice if Out for Delivery */}
                    {(orderResult.status?.includes('out_for_delivery') || orderResult.status?.includes('مندوب')) && (
                      <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.12)', border: '1px solid #EAB308', borderRadius: 'var(--radius-md)', color: '#FFDF73', fontWeight: 800, fontSize: '0.95rem' }}>
                        🛵 أوردرك في الطريق إليك اليوم مع المندوب وفي انتظار التسليم خلال ساعات!
                      </div>
                    )}

                    {/* Tracking Code Highlight if available */}
                    {orderResult.tracking_number && (
                      <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>كود تتبع الشحنة لدى البريد المصري:</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold-primary)', fontFamily: 'monospace', letterSpacing: '2px' }}>
                          {orderResult.tracking_number}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer & Address Details */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                    <div><strong>تاريخ الطلب:</strong> {orderResult.created_at ? new Date(orderResult.created_at).toLocaleDateString('ar-EG') : 'اليوم'}</div>
                    <div><strong>اسم العميل:</strong> {orderResult.customer_name || 'عميل KEMET'}</div>
                    <div><strong>العنوان والتسليم:</strong> {orderResult.governorate} ({orderResult.address})</div>
                    <div><strong>الإجمالي الكلي:</strong> <span style={{ color: 'var(--gold-primary)', fontWeight: 900 }}>{orderResult.total_amount || orderResult.total} ج.م</span></div>
                  </div>

                  {/* Order Items Table */}
                  {Array.isArray(orderResult.order_items) && orderResult.order_items.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>
                        📋 محتويات الطلب:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {orderResult.order_items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(212,175,55,0.05)', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                            <span>{item.product_name_ar || 'منتج KEMET'} (مقاس: {item.size})</span>
                            <span style={{ fontWeight: 800, color: 'var(--gold-primary)' }}>{item.quantity} × {item.unit_price} ج.م</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* Order Not Found Notice with Direct Egypt Post & WhatsApp Option */
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-gold)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>
                    لم يتم العثور على أوردر برقم ({searchCode})
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    يرجى التأكد من كتابة كود الطلب الصحيح (مثال: KM-2027-4160) أو كود التتبع البريدي.
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a 
                      href="https://www.egyptpost.org/"
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn-secondary" 
                      style={{ padding: '0.75rem 1.5rem' }}
                    >
                      🇪🇬 متابعة الاوردر من البريد المصري
                    </a>
                    <a 
                      href={`https://api.whatsapp.com/send?phone=201114687759&text=${encodeURIComponent(`مرحباً KEMET، أود الاستفسار عن كود الشحنة: ${searchCode}`)}`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn-primary" 
                      style={{ padding: '0.75rem 1.5rem' }}
                    >
                      💬 الاستفسار المباشر عبر الواتساب
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
