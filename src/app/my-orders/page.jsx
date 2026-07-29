'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';

export default function MyOrdersPage() {
  const { user, orders, logoutUser, t } = useApp();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">🛍️ طلباتي ومتابعة الشحنة</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              سجل كافة طلباتك ومشترياتك السابقة من متجر KEMET وحالتها المباشرة مع البريد المصري
            </p>
          </div>

          {/* Authentication Check: Require login to view orders */}
          {!user ? (
            <div style={{
              background: 'var(--bg-card)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--border-gold-bright)',
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-glow)',
              maxWidth: '640px',
              margin: '0 auto'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--border-gold)',
                color: 'var(--gold-primary)',
                fontSize: '1.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                🔒
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                يرجى تسجيل الدخول أولاً لعرض طلباتك
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                صفحة طلباتي محمية ومخصصة للعملاء المسجلين. قم بتسجيل الدخول برقم تليفونك لاستعراض شحناتك وسجلات الشراء.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                  تسجيل الدخول 🔑
                </Link>
                <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem 2.2rem' }}>
                  تصفح المنتجات 🛍️
                </Link>
              </div>
            </div>
          ) : orders.length === 0 ? (
            
            /* User is logged in but has no orders */
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛍️</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                أهلاً {user.fullName}! لم تقم بإجراء أي طلبات بعد
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                استعرض كولكشن KEMET الرسمي موديلات 2027 واختر أطقمك المفضلة!
              </p>
              <Link href="/category/all" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                استكشف المنتجات والأطقم 🛒
              </Link>
            </div>

          ) : (
            
            /* Logged in User Orders List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Profile Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>👑</span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>مرحباً: <strong style={{ color: 'var(--gold-primary)' }}>{user.fullName || user.phone}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={logoutUser}
                  style={{
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  تسجيل الخروج 👋
                </button>
              </div>

              {orders.map(order => (
                <div 
                  key={order.id} 
                  style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-gold-bright)', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '2rem',
                    boxShadow: 'var(--shadow-glow)'
                  }}
                >
                  {/* Order Header info */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>رقم الطلب المرسل:</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                        #{order.id}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ الطلب:</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {order.date} ({order.time})
                      </div>
                    </div>

                    <div style={{ 
                      background: 'rgba(212, 175, 55, 0.15)', 
                      border: '1px solid var(--border-gold)', 
                      padding: '0.45rem 1.1rem', 
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--gold-primary)',
                      fontWeight: 800,
                      fontSize: '0.9rem'
                    }}>
                      {order.status}
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {order.items.map((item, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1.25rem', 
                          background: 'rgba(0,0,0,0.2)', 
                          padding: '0.85rem 1rem', 
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <img 
                          src={item.image} 
                          alt={item.nameAr} 
                          style={{ width: '64px', height: '64px', objectFit: 'contain', background: '#000', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }} 
                        />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {item.nameAr}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            المقاس: <span style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>{item.size}</span> | الكمية: {item.quantity}
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold-primary)' }}>
                          {item.price * item.quantity} ج.م
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Details & Total */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '1.5rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      📍 عنوان التسليم: <strong style={{ color: 'var(--text-primary)' }}>{order.customer.fullName} - {order.customer.governorate} ({order.customer.address})</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ textAlign: 'end' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>الإجمالي الكلي شامل الشحن:</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                          {order.total} ج.م
                        </div>
                      </div>

                      <Link href="/track-order" className="btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                        تتبع الشحنة 🚚
                      </Link>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
