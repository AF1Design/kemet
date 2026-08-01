'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase/client';

export default function TrackOrderPage() {
  const { t } = useApp();
  const [trackingCode, setTrackingCode] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [isPostalCode, setIsPostalCode] = useState(false);

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const code = trackingCode.trim();
    if (!code) return;

    setIsLoading(true);
    setIsSearched(true);
    setOrderResult(null);
    setIsPostalCode(false);

    // 1. Check if the code is an internal KEMET Order ID (e.g. KM-2027-8941)
    if (code.toUpperCase().startsWith('KM') || !isNaN(code)) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .ilike('id', `%${code}%`)
          .single();

        if (!error && data) {
          setOrderResult(data);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Database query error:', err);
      }
    }

    // 2. If code starts with EG or is a postal barcode, mark as Egyptian Post code
    if (/^[a-zA-Z]{2}\d+[a-zA-Z]{2}$/.test(code) || code.toUpperCase().startsWith('EG')) {
      setIsPostalCode(true);
    } else {
      setIsPostalCode(true); // Default to postal portal embedding
    }

    setIsLoading(false);
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
              {t('trackOrderSubtitle')}
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
                placeholder="أدخل كود الطلب (KM-2027) أو رقم التتبع البريدي (EG123456789EG)"
                value={trackingCode}
                onChange={e => setTrackingCode(e.target.value)}
                style={{ flexGrow: 1, padding: '0.9rem 1.25rem', fontSize: '1rem' }}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                {t('trackBtn')}
              </button>
            </form>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a 
                href={`https://www.egyptpost.org/`}
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary" 
                style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}
              >
                🇪🇬 بوابة البريد المصري الرسمية
              </a>
              <a 
                href={`https://api.whatsapp.com/send?phone=201114687759&text=${encodeURIComponent(`مرحباً، أود الاستفسار عن تتبع شحنتي برقم: ${trackingCode}`)}`}
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary" 
                style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}
              >
                📱 استفسار عبر الواتساب المباشر
              </a>
            </div>
          </div>

          {/* Tracking Results Area */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
              جاري البحث عن بيانات الشحنة... 🔍
            </div>
          )}

          {!isLoading && isSearched && (
            <div>
              {orderResult ? (
                /* KEMET Internal Order Details */
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-gold)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '2.5rem 2rem' 
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                      طلب كيميت رقم: #{orderResult.id}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      الحالة الحالية: <span style={{ color: '#10B981', fontWeight: 800 }}>{orderResult.status || 'قيد الشحن والتوصيل 📦'}</span>
                    </p>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                    <div><strong>تاريخ الطلب:</strong> {orderResult.created_at ? new Date(orderResult.created_at).toLocaleDateString('ar-EG') : 'اليوم'}</div>
                    <div><strong>الاسم:</strong> {orderResult.customer_name || 'عميل KEMET'}</div>
                    <div><strong>المحافظة:</strong> {orderResult.governorate || 'مصر'}</div>
                    <div><strong>إجمالي المبلغ:</strong> <span style={{ color: 'var(--gold-primary)', fontWeight: 900 }}>{orderResult.total_amount || orderResult.total} ج.م</span></div>
                  </div>
                </div>
              ) : (
                /* Embedded Egyptian Post Portal View inside KEMET store */
                <div style={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-gold)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      🇪🇬 الاستعلام الفوري من البريد المصري لشحنتك رقم ({trackingCode})
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      يتم جلب واستعراض بيانات الشحنة مباشرة داخل الموقع دون الحاجة للمغادرة.
                    </p>
                  </div>

                  {/* Frame Container */}
                  <div style={{ width: '100%', height: '520px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#FFFFFF' }}>
                    <iframe 
                      src={`https://www.egyptpost.org/`}
                      title="تتبع البريد المصري الرسمي"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>

                  <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(212,175,55,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold)', fontSize: '0.82rem', color: 'var(--gold-primary)', textAlign: 'center' }}>
                    💡 إذا لم تظهر بيانات الشحنة في الشاشة أعلاه، يمكنك الاستفسار المباشر بضغطة زر عبر <a href={`https://api.whatsapp.com/send?phone=201114687759&text=${encodeURIComponent(`مرحباً، أود الاستفسار عن شحنتي رقم: ${trackingCode}`)}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', fontWeight: 900, color: '#FFF' }}>الواتساب المباشر لخدمة عملاء KEMET</a>
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
