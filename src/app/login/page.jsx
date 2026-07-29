'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';

export default function LoginPage() {
  const { user, loginUser, logoutUser, t } = useApp();
  const router = useRouter();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');

  // If user is already logged in, present account status & option to view orders or logout
  if (user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <section className="section" style={{ flexGrow: 1 }}>
          <div className="container" style={{ maxWidth: '640px' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-gold-bright)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--gold-gradient)',
                color: '#000',
                fontSize: '1.8rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                👑
              </div>
              
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                أهلاً بك، {user.fullName || 'عميل KEMET المميز'}!
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                حسابك نشط ومسجل برقم: <strong style={{ color: 'var(--gold-primary)' }}>{user.phone || '01000000000'}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Link href="/my-orders" className="btn-primary" style={{ padding: '0.85rem' }}>
                  استعرض طلباتي وحالة الشحن 🛍️
                </Link>
                <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem' }}>
                  تصفح المنتجات والأطقم ⚽
                </Link>
                <button
                  type="button"
                  onClick={() => logoutUser()}
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #E11D48',
                    color: '#E11D48',
                    background: 'transparent',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  تسجيل الخروج 👋
                </button>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      alert('يرجى كتابة رقم موبايل صحيح');
      return;
    }

    const userData = {
      fullName: fullName.trim() || (mode === 'login' ? 'عميل KEMET' : 'أحمد محمود'),
      phone: phone.trim(),
      governorate: governorate
    };

    loginUser(userData);
    router.push('/my-orders');
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '520px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <img src="/assets/kemet-emblem-icon.png" alt="KEMET" style={{ height: '48px', margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              <span className="brand-glow">حساب KEMET</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              قم بتسجيل الدخول لمتابعة طلباتك والاستفادة من عروض 2027 الحصرية
            </p>
          </div>

          {/* Form Card */}
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  background: mode === 'login' ? 'var(--gold-gradient)' : 'transparent',
                  color: mode === 'login' ? '#000' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  background: mode === 'register' ? 'var(--gold-gradient)' : 'transparent',
                  color: mode === 'register' ? '#000' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                حساب جديد
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    الاسم بالكامل
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمود"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="form-input"
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  رقم الموبايل
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  كلمة السر
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    المحافظة
                  </label>
                  <select
                    value={governorate}
                    onChange={e => setGovernorate(e.target.value)}
                    className="form-select"
                  >
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="الدقهلية">الدقهلية</option>
                    <option value="الشرقية">الشرقية</option>
                    <option value="الغربية">الغربية</option>
                    <option value="محافظة أخرى">محافظة أخرى</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem' }}
              >
                {mode === 'login' ? 'تسجيل الدخول 👑' : 'إنشاء حساب جديد 🚀'}
              </button>

            </form>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              تريد استكمال الشراء بدون حساب؟{' '}
              <Link href="/checkout" style={{ color: 'var(--gold-primary)', fontWeight: 800, textDecoration: 'underline' }}>
                الدخول المباشر لإتمام الطلب 🛒
              </Link>
            </div>

          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
