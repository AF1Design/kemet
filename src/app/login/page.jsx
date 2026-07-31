'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase/client';

// Eye of Horus (عين حورس المفتوحة) - SVG Icon
const EyeOfHorusOpen = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Eyebrow */}
    <path d="M4 6c3-2.2 8-2.2 13 0c2 0.8 3 1.5 3 1.5" stroke="#D4AF37" strokeWidth="2" />
    {/* Upper Eyelid */}
    <path d="M3 11c4-4.5 12-4.5 17 0" />
    {/* Lower Eyelid */}
    <path d="M3 11c4 4.5 12 4.5 17 0" />
    {/* Pupil Eye Circle */}
    <circle cx="12" cy="11" r="2.8" fill="#D4AF37" stroke="none" />
    {/* Teardrop Falcon Spiral Markings */}
    <path d="M11.5 15.5v5c0 1.5-1 2.5-2.5 2.5" stroke="#D4AF37" />
    <path d="M14.5 15.5c1 1.5 2.5 2 3.5 1" />
  </svg>
);

// Eye of Horus Closed / Sleeping (عين حورس المغلقة/النائمة) - SVG Icon
const EyeOfHorusClosed = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {/* Eyebrow */}
    <path d="M4 6c3-2.2 8-2.2 13 0c2 0.8 3 1.5 3 1.5" stroke="#D4AF37" strokeWidth="1.5" opacity="0.7" />
    {/* Downward Closed Eyelid */}
    <path d="M3 11c4 4.5 12 4.5 17 0" stroke="#D4AF37" strokeWidth="2.2" />
    {/* Sleeping Eyelashes */}
    <path d="M7 13.5l-1 2.5" />
    <path d="M11.5 14.5v2.8" />
    <path d="M16 13.5l1 2.5" />
    {/* Teardrop Falcon Spiral Markings */}
    <path d="M11.5 15.5v5c0 1.5-1 2.5-2.5 2.5" opacity="0.6" />
    <path d="M14.5 15.5c1 1.5 2.5 2 3.5 1" opacity="0.6" />
  </svg>
);

export default function LoginPage() {
  const { user, loginUser, logoutUser, showToast, t } = useApp();
  const router = useRouter();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Eye toggle state
  const [governorate, setGovernorate] = useState('القاهرة');
  const [allowSmsMarketing, setAllowSmsMarketing] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Handle Logout
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    // Clear cookies
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    logoutUser();
    showToast('تم تسجيل الخروج بنجاح 👋');
  };

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          governorate: governorate,
          allow_sms_marketing: allowSmsMarketing
        })
        .eq('id', user.id);

      if (error) throw error;

      loginUser({
        ...user,
        fullName: fullName.trim(),
        phone: phone.trim(),
        governorate: governorate,
        allowSmsMarketing: allowSmsMarketing
      });

      setIsEditingProfile(false);
      showToast('تم تحديث بيانات البروفايل بنجاح ⚙️');
    } catch (err) {
      alert(err.message || 'فشل في تحديث البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Submit (Login or Register via Supabase Auth)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !email.includes('@')) {
      setAuthError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) {
          setAuthError('خطأ في بيانات الدخول. يرجى التأكد من البريد وكلمة المرور.');
          setIsLoading(false);
          return;
        }

        if (data?.session && data?.user) {
          // Set session cookies for Next.js Server Components / layout.jsx
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `supabase-auth-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;

          // Query Profile for role and user details
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, phone, governorate')
            .eq('id', data.user.id)
            .single();

          const userRole = profile?.role || 'customer';

          loginUser({
            id: data.user.id,
            email: data.user.email,
            fullName: profile?.full_name || email.split('@')[0],
            phone: profile?.phone || '',
            governorate: profile?.governorate || 'القاهرة',
            role: userRole
          });

          showToast(userRole === 'admin' ? 'مرحباً بك يا أدمن 👑' : 'تم تسجيل الدخول بنجاح 🎉');

          // Hard window navigation ensures browser sends fresh session cookies to SSR Layout Guard
          if (userRole === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/my-orders';
          }
        }
      } catch (err) {
        setAuthError(err.message || 'حدث خطأ في الاتصال بالخادم');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Register Mode
      if (!fullName.trim()) {
        setAuthError('يرجى كتابة اسمك بالكامل لإنشاء الحساب');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
              governorate: governorate
            }
          }
        });

        if (error) throw error;

        if (data?.session && data?.user) {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `supabase-auth-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;

          // Insert or upsert profile
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            phone: phone.trim(),
            governorate: governorate,
            role: 'customer'
          });

          loginUser({
            id: data.user.id,
            email: data.user.email,
            fullName: fullName.trim(),
            phone: phone.trim(),
            governorate: governorate,
            role: 'customer'
          });

          showToast('تم إنشاء الحساب بنجاح 🎉');
          window.location.href = '/my-orders';
        } else {
          showToast('تم إرسال رابط التأكيد لبريدك الإلكتروني 📩');
        }
      } catch (err) {
        setAuthError(err.message || 'فشل في إنشاء الحساب');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Logged In View (User Profile Panel)
  if (user) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <section className="section" style={{ flexGrow: 1 }}>
          <div className="container" style={{ maxWidth: '600px' }}>
            
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold-bright)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '2.5rem 2rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>👑</div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  أهلاً بك، {user.fullName || user.email}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {user.role === 'admin' ? 'حساب مسؤول إداري (Admin Account)' : 'عميل مميز في متجر KEMET'}
                </p>
              </div>

              {!isEditingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>البريد الإلكتروني:</span>
                    <span style={{ fontWeight: 800 }}>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>رقم الهاتف:</span>
                    <span style={{ fontWeight: 800 }}>{user.phone || 'غير مسجل'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>المحافظة:</span>
                    <span style={{ fontWeight: 800 }}>{user.governorate || 'القاهرة'}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>الاسم بالكامل</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>رقم الهاتف</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>المحافظة</label>
                    <select value={governorate} onChange={e => setGovernorate(e.target.value)} className="form-select">
                      <option value="القاهرة">القاهرة (Cairo)</option>
                      <option value="الجيزة">الجيزة (Giza)</option>
                      <option value="الإسكندرية">الإسكندرية (Alexandria)</option>
                      <option value="الدقهلية">الدقهلية (Dakahlia)</option>
                      <option value="الشرقية">الشرقية (Sharqia)</option>
                      <option value="الغربية">الغربية (Gharbia)</option>
                      <option value="محافظة أخرى">محافظة أخرى (Other)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn-primary" disabled={isLoading} style={{ flex: 1, padding: '0.65rem' }}>
                      {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات 💾'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)} style={{ padding: '0.65rem' }}>
                      إلغاء
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {user.role === 'admin' && (
                  <Link href="/admin" className="btn-primary" style={{ textAlign: 'center', padding: '0.85rem', background: 'var(--gold-gradient)', color: '#000', fontWeight: 900 }}>
                    👑 الدخول للوحة التحكم الإدارية
                  </Link>
                )}
                
                <Link href="/my-orders" className="btn-secondary" style={{ textAlign: 'center', padding: '0.85rem' }}>
                  📦 مشاهدة طلباتي ومتابعة الشحن
                </Link>

                {!isEditingProfile && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setFullName(user.fullName || '');
                      setPhone(user.phone || '');
                      setGovernorate(user.governorate || 'القاهرة');
                      setIsEditingProfile(true);
                    }} 
                    className="btn-secondary" 
                    style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.05)' }}
                  >
                    ⚙️ تعديل بيانات الحساب
                  </button>
                )}

                <button 
                  type="button" 
                  onClick={handleSignOut} 
                  className="btn-secondary" 
                  style={{ padding: '0.85rem', background: 'rgba(244,63,94,0.1)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)' }}
                >
                  🚪 تسجيل الخروج من الحساب
                </button>
              </div>

            </div>

          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Auth Form View (Login or Register)
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '480px' }}>
          
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-gold-bright)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            
            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setAuthError(null); }}
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
                onClick={() => { setMode('register'); setAuthError(null); }}
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

            {authError && (
              <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.4)', color: '#F43F5E', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', textAlign: 'center' }}>
                ⚠️ {authError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {t('emailLabel')}
                </label>
                <input
                  type="email"
                  required
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              {mode === 'register' && (
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
              )}

              {mode === 'register' && (
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
              )}

              {/* Password Field with Custom Authentic Eye of Horus SVG Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                  {t('passLabel')}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 10,
                      transition: 'transform 0.2s ease'
                    }}
                    title={showPassword ? 'إخفاء كلمة المرور (عين حورس المغلقة)' : 'إظهار كلمة المرور (عين حورس المفتوحة)'}
                  >
                    {showPassword ? <EyeOfHorusOpen /> : <EyeOfHorusClosed />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
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
                </>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', fontSize: '1rem' }}
              >
                {isLoading ? 'جاري التحقق...' : (mode === 'login' ? t('loginBtn') : t('registerBtn'))}
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
