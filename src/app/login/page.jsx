'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';

export default function LoginPage() {
  const { user, loginUser, logoutUser, showToast, t } = useApp();
  const router = useRouter();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [governorate, setGovernorate] = useState(user?.governorate || 'القاهرة');

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('يرجى إدخال اسمك بالكامل');
      return;
    }
    loginUser({
      ...user,
      fullName: fullName.trim(),
      phone: phone.trim(),
      governorate: governorate
    });
    setIsEditingProfile(false);
    showToast('تم تحديث بيانات الحساب والملف الشخصي بنجاح ⚙️');
  };

  // If user is already logged in, present Account Settings & Profile management panel
  if (user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <section className="section" style={{ flexGrow: 1 }}>
          <div className="container" style={{ maxWidth: '680px' }}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-gold-bright)',
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                  margin: '0 auto 1.25rem'
                }}>
                  👑
                </div>
                
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  ⚙️ إعدادات حساب {user.fullName}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  يمكنك من هنا إدارة بياناتك الشخصية، تتبع شحناتك، أو تسجيل الخروج
                </p>
              </div>

              {/* Account Quick Links */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/my-orders" className="btn-primary" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  {t('viewOrdersBtn')}
                </Link>
                <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  {t('browseProductsBtn')}
                </Link>
              </div>

              {/* Profile Details & Edit Form */}
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                    👤 البيانات الشخصية والملف الشخصي
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingProfile(!isEditingProfile)} 
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    {isEditingProfile ? 'إلغاء التعديل' : 'تعديل البيانات ✏️'}
                  </button>
                </div>

                {!isEditingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <div>الاسم المسجل: <strong style={{ color: 'var(--text-primary)' }}>{user.fullName}</strong></div>
                    <div>رقم الهاتف: <strong style={{ color: 'var(--gold-primary)' }}>{user.phone}</strong></div>
                    <div>المحافظة: <strong style={{ color: 'var(--text-primary)' }}>{user.governorate || 'القاهرة'}</strong></div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>الاسم بالكامل:</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>رقم الموبايل:</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>المحافظة:</label>
                      <input 
                        type="text" 
                        value={governorate}
                        onChange={e => setGovernorate(e.target.value)}
                        required
                        className="form-input"
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0.65rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      حفظ التعديلات 💾
                    </button>
                  </form>
                )}
              </div>

              {/* Logout Option in Settings */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => logoutUser()}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(225, 29, 72, 0.4)',
                    background: 'rgba(225, 29, 72, 0.12)',
                    color: '#F43F5E',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    transition: 'var(--transition)'
                  }}
                >
                  تسجيل الخروج من الحساب 👋
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
    if (!fullName.trim()) {
      alert('يرجى إدخال اسمك بالكامل لإنشاء/دخول حسابك');
      return;
    }
    if (!phone || phone.length < 8) {
      alert('يرجى كتابة رقم موبايل صحيح');
      return;
    }

    const userData = {
      fullName: fullName.trim(),
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
              <span className="brand-glow">{t('loginTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {t('loginSubtitle')}
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
                {t('loginTab')}
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
                {t('registerTab')}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {t('fullNameLabel')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('fullNamePlaceholder')}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {t('phoneLabel')}
                </label>
                <input
                  type="tel"
                  required
                  placeholder={t('phonePlaceholder')}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {t('passLabel')}
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
                    {t('govLabel')}
                  </label>
                  <select
                    value={governorate}
                    onChange={e => setGovernorate(e.target.value)}
                    className="form-select"
                  >
                    <option value="القاهرة">القاهرة (Cairo)</option>
                    <option value="الجيزة">الجيزة (Giza)</option>
                    <option value="الإسكندرية">الإسكندرية (Alexandria)</option>
                    <option value="الدقهلية">الدقهلية (Dakahlia)</option>
                    <option value="الشرقية">الشرقية (Sharqia)</option>
                    <option value="الغربية">الغربية (Gharbia)</option>
                    <option value="محافظة أخرى">محافظة أخرى (Other)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem' }}
              >
                {mode === 'login' ? t('loginBtn') : t('registerBtn')}
              </button>

            </form>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t('guestCheckoutNotice')}{' '}
              <Link href="/checkout" style={{ color: 'var(--gold-primary)', fontWeight: 800, textDecoration: 'underline' }}>
                {t('guestCheckoutLink')}
              </Link>
            </div>

          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
