'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { OtpModal } from '../../components/OtpModal';
import { supabase } from '../../lib/supabase/client';
import { customSignupAction, customPasswordResetAction } from '../actions/auth-actions';

// Eye of Horus (عين حورس المفتوحة) - SVG Icon
const EyeOfHorusOpen = () => (
  <svg className="eye-horus-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6c3-2.2 8-2.2 13 0c2 0.8 3 1.5 3 1.5" stroke="var(--gold-primary)" strokeWidth="2" />
    <path d="M3 11c4-4.5 12-4.5 17 0" />
    <path d="M3 11c4 4.5 12 4.5 17 0" />
    <circle cx="12" cy="11" r="2.8" fill="var(--gold-primary)" stroke="none" />
    <path d="M11.5 15.5v5c0 1.5-1 2.5-2.5 2.5" stroke="var(--gold-primary)" />
    <path d="M14.5 15.5c1 1.5 2.5 2 3.5 1" />
  </svg>
);

// Eye of Horus Closed / Sleeping (عين حورس المغلقة/النائمة) - SVG Icon
const EyeOfHorusClosed = () => (
  <svg className="eye-horus-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6c3-2.2 8-2.2 13 0c2 0.8 3 1.5 3 1.5" stroke="var(--gold-primary)" strokeWidth="1.5" opacity="0.7" />
    <path d="M3 11c4 4.5 12 4.5 17 0" stroke="var(--gold-primary)" strokeWidth="2.2" />
    <path d="M7 13.5l-1 2.5" />
    <path d="M11.5 14.5v2.8" />
    <path d="M16 13.5l1 2.5" />
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
  const [showPassword, setShowPassword] = useState(false);
  const [governorate, setGovernorate] = useState('القاهرة');
  const [allowSmsMarketing, setAllowSmsMarketing] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('confirmed') === 'true') {
        showToast('تم تفعيل البريد الإلكتروني بنجاح.');
      }
    }
  }, []);

  // Handle Logout
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
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
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `supabase-auth-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;

          // Query Profile for role and user details
          let userRole = 'customer';
          let profileData = null;

          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, phone, governorate')
            .eq('id', data.user.id)
            .single();

          if (profile) {
            profileData = profile;
            userRole = profile.role || 'customer';
          } else if (data.user.email === 'admin@kemet.eg' || data.user.user_metadata?.role === 'admin') {
            userRole = 'admin';
          }

          loginUser({
            id: data.user.id,
            email: data.user.email,
            fullName: profileData?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
            phone: profileData?.phone || '',
            governorate: profileData?.governorate || 'القاهرة',
            role: userRole
          });

          showToast(userRole === 'admin' ? 'تم تسجيل دخول المسؤول الإداري.' : 'تم تسجيل الدخول بنجاح.');

          // Explicit redirect check: if role === 'admin', redirect directly to /admin
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
      // Register Mode via Resend & KEMET Custom Action
      if (!fullName.trim()) {
        setAuthError('يرجى كتابة اسمك بالكامل لإنشاء الحساب');
        setIsLoading(false);
        return;
      }

      try {
        setSignupSuccessMsg(null);
        const res = await customSignupAction({
          email: email.trim(),
          password: password,
          fullName: fullName.trim(),
          phone: phone.trim(),
          governorate: governorate
        });

        if (res.success) {
          setAuthError(null);
          setShowOtpModal(true);
        } else {
          setAuthError(res.error || 'تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.');
        }
      } catch (err) {
        console.error('Signup error:', err);
        setAuthError(err.message || 'فشل في إنشاء الحساب');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '620px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <img src="/assets/kemet-emblem-icon.png" alt="KEMET" style={{ height: '48px', margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              <span className="brand-glow">{t('loginTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {t('loginSubtitle')}
            </p>
          </div>

          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-gold-bright)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-glow)'
          }}>

            {user ? (
              /* Already Logged In Panel */
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👑</div>
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
                        <option value="القاهرة">القاهرة</option>
                        <option value="الجيزة">الجيزة</option>
                        <option value="الإسكندرية">الإسكندرية</option>
                        <option value="الدقهلية">الدقهلية</option>
                        <option value="الشرقية">الشرقية</option>
                        <option value="محافظة أخرى">محافظة أخرى</option>
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
                      👑 الدخول للوحة التحكم الإدارية (/admin)
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
            ) : (
              /* Auth Form (Login or Register) */
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setAuthError(null); }}
                    style={{
                      flex: 1,
                      padding: '0.85rem',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: mode === 'login' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                      borderBottom: mode === 'login' ? '2px solid var(--gold-primary)' : '2px solid transparent',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {t('loginTab')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('register'); setAuthError(null); }}
                    style={{
                      flex: 1,
                      padding: '0.85rem',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: mode === 'register' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                      borderBottom: mode === 'register' ? '2px solid var(--gold-primary)' : '2px solid transparent',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {t('registerTab')}
                  </button>
                </div>

                {signupSuccessMsg && (
                  <div style={{ 
                    background: 'rgba(212, 175, 55, 0.15)', 
                    border: '1px solid var(--border-gold-bright)', 
                    color: '#FFDF73', 
                    padding: '1rem 1.2rem', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.95rem',
                    marginBottom: '1.5rem',
                    fontWeight: 800,
                    lineHeight: 1.6
                  }}>
                    {signupSuccessMsg}
                  </div>
                )}

                {authError && (
                  <div style={{ 
                    background: 'rgba(244, 63, 94, 0.12)', 
                    border: '1px solid rgba(244, 63, 94, 0.4)', 
                    color: '#F43F5E', 
                    padding: '0.85rem 1rem', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.9rem',
                    marginBottom: '1.5rem',
                    fontWeight: 700
                  }}>
                    ⚠️ {authError}
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {mode === 'register' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                        {t('fullNameLabel')}
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder={t('fullNamePlaceholder')}
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                      {t('emailLabel')}
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder={t('emailPlaceholder')}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  {mode === 'register' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                        {t('phoneLabel')}
                      </label>
                      <input 
                        type="tel" 
                        required
                        placeholder={t('phonePlaceholder')}
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                      {t('passLabel')}
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ 
                          width: '100%', 
                          minHeight: '52px', 
                          height: '52px',
                          paddingLeft: '3.2rem', 
                          paddingRight: '1.2rem', 
                          fontSize: '1rem', 
                          background: 'var(--bg-card)', 
                          color: 'var(--text-primary)', 
                          border: '1px solid var(--border-gold)',
                          borderRadius: 'var(--radius-md)',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ 
                          position: 'absolute', 
                          left: '0.85rem', 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.4rem',
                          zIndex: 10
                        }}
                        title={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                      >
                        {showPassword ? <EyeOfHorusOpen /> : <EyeOfHorusClosed />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                          {t('govLabel')}
                        </label>
                        <select value={governorate} onChange={e => setGovernorate(e.target.value)}>
                          <option value="القاهرة">القاهرة</option>
                          <option value="الجيزة">الجيزة</option>
                          <option value="الإسكندرية">الإسكندرية</option>
                          <option value="الدقهلية">الدقهلية</option>
                          <option value="الشرقية">الشرقية</option>
                          <option value="محافظة أخرى">محافظة أخرى</option>
                        </select>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <input 
                          type="checkbox"
                          checked={allowSmsMarketing}
                          onChange={e => setAllowSmsMarketing(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }}
                        />
                        <span>{t('smsMarketingLabel')}</span>
                      </label>
                    </>
                  )}

                  <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '0.95rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                    {isLoading ? 'جاري التحقق...' : (mode === 'login' ? t('loginBtn') : t('registerBtn'))}
                  </button>
                </form>
              </div>
            )}

          </div>

          {!user && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {t('guestCheckoutNotice')}{' '}
                <Link href="/checkout" style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>
                  {t('guestCheckoutLink')}
                </Link>
              </p>
            </div>
          )}

        </div>
      </section>

      <OtpModal 
        isOpen={showOtpModal} 
        email={email} 
        onClose={() => setShowOtpModal(false)} 
        onVerifySuccess={(res) => {
          setShowOtpModal(false);
          if (res?.session) {
            document.cookie = `sb-access-token=${res.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `supabase-auth-token=${res.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          }
          loginUser({
            id: res?.user?.id || 'customer',
            email: email.trim(),
            fullName: fullName.trim() || res?.user?.user_metadata?.full_name || email.split('@')[0],
            phone: phone.trim() || '',
            governorate: governorate || 'القاهرة',
            role: 'customer'
          });
          showToast('تم تفعيل البريد الإلكتروني وتسجيل الدخول بنجاح.');
          setTimeout(() => {
            window.location.href = '/my-orders';
          }, 800);
        }}
      />

      <Footer />
    </div>
  );
}
