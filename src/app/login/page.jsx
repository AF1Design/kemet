'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';
import { OtpModal } from '../../components/OtpModal';
import { supabase } from '../../lib/supabase/client';
import { customSignupAction, forgotPasswordOtpAction } from '../actions/auth-actions';

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
  const { lang, user, loginUser, logoutUser, showToast, t } = useApp();
  const router = useRouter();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [governorate, setGovernorate] = useState(lang === 'ar' ? 'القاهرة' : 'Cairo');
  const [allowSmsMarketing, setAllowSmsMarketing] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalMode, setOtpModalMode] = useState('signup');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('confirmed') === 'true') {
        showToast(lang === 'ar' ? 'تم تفعيل البريد الإلكتروني بنجاح.' : 'Email verified successfully.');
      }
    }
  }, [lang]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    logoutUser();
    showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح 👋' : 'Signed out successfully 👋');
  };

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
      showToast(lang === 'ar' ? 'تم تحديث بيانات البروفايل بنجاح ⚙️' : 'Profile updated successfully ⚙️');
    } catch (err) {
      alert(err.message || (lang === 'ar' ? 'فشل في تحديث البيانات' : 'Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !email.includes('@')) {
      setAuthError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError(lang === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
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
          setAuthError(lang === 'ar' ? 'خطأ في بيانات الدخول. يرجى التأكد من البريد وكلمة المرور.' : 'Invalid login credentials. Please check your email and password.');
          setIsLoading(false);
          return;
        }

        if (data?.session && data?.user) {
          document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `supabase-auth-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;

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
            governorate: profileData?.governorate || (lang === 'ar' ? 'القاهرة' : 'Cairo'),
            role: userRole
          });

          showToast(userRole === 'admin' ? (lang === 'ar' ? 'تم تسجيل دخول المسؤول الإداري.' : 'Admin signed in successfully.') : (lang === 'ar' ? 'تم تسجيل الدخول بنجاح.' : 'Signed in successfully.'));

          if (userRole === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/my-orders';
          }
        }
      } catch (err) {
        setAuthError(err.message || (lang === 'ar' ? 'حدث خطأ في الاتصال بالخادم' : 'Server error occurred'));
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!fullName.trim()) {
        setAuthError(lang === 'ar' ? 'يرجى كتابة اسمك بالكامل لإنشاء الحساب' : 'Please enter your full name');
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
          setAuthError(res.error || (lang === 'ar' ? 'تعذر إنشاء الحساب. يرجى المحاولة مرة أخرى.' : 'Failed to create account. Please try again.'));
        }
      } catch (err) {
        console.error('Signup error:', err);
        setAuthError(err.message || (lang === 'ar' ? 'فشل في إنشاء الحساب' : 'Account creation failed'));
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
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👑</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                    {t('welcomeBackUser')} {user.fullName || user.email}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {user.role === 'admin' 
                      ? (lang === 'ar' ? 'حساب مسؤول إداري (Admin)' : 'Admin Account') 
                      : user.email}
                  </p>
                </div>

                {!isEditingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('emailLabel')}</span>
                      <span style={{ fontWeight: 800 }}>{user.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('phoneLabel')}</span>
                      <span style={{ fontWeight: 800 }}>{user.phone || (lang === 'ar' ? 'غير مسجل' : 'Not set')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('govLabel')}</span>
                      <span style={{ fontWeight: 800 }}>{user.governorate || (lang === 'ar' ? 'القاهرة' : 'Cairo')}</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>{t('fullNameLabel')}</label>
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>{t('phoneLabel')}</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>{t('govLabel')}</label>
                      <select value={governorate} onChange={e => setGovernorate(e.target.value)} className="form-select">
                        <option value={lang === 'ar' ? "القاهرة" : "Cairo"}>{lang === 'ar' ? "القاهرة" : "Cairo"}</option>
                        <option value={lang === 'ar' ? "الجيزة" : "Giza"}>{lang === 'ar' ? "الجيزة" : "Giza"}</option>
                        <option value={lang === 'ar' ? "الإسكندرية" : "Alexandria"}>{lang === 'ar' ? "الإسكندرية" : "Alexandria"}</option>
                        <option value={lang === 'ar' ? "الدقهلية" : "Dakahlia"}>{lang === 'ar' ? "الدقهلية" : "Dakahlia"}</option>
                        <option value={lang === 'ar' ? "الشرقية" : "Sharqia"}>{lang === 'ar' ? "الشرقية" : "Sharqia"}</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn-primary" disabled={isLoading} style={{ flex: 1, padding: '0.65rem' }}>
                        {isLoading ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التعديلات 💾' : 'Save Changes 💾')}
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)} style={{ padding: '0.65rem' }}>
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="btn-primary" style={{ textAlign: 'center', padding: '0.85rem', background: 'var(--gold-gradient)', color: '#000', fontWeight: 900 }}>
                      👑 {lang === 'ar' ? 'الدخول للوحة التحكم الإدارية (/admin)' : 'Open Admin Dashboard (/admin)'}
                    </Link>
                  )}
                  
                  <Link href="/my-orders" className="btn-secondary" style={{ textAlign: 'center', padding: '0.85rem' }}>
                    📦 {t('viewOrdersBtn')}
                  </Link>

                  {!isEditingProfile && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setFullName(user.fullName || '');
                        setPhone(user.phone || '');
                        setGovernorate(user.governorate || (lang === 'ar' ? 'القاهرة' : 'Cairo'));
                        setIsEditingProfile(true);
                      }} 
                      className="btn-secondary" 
                      style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.05)' }}
                    >
                      ⚙️ {lang === 'ar' ? 'تعديل بيانات الحساب' : 'Edit Account Details'}
                    </button>
                  )}

                  <button 
                    type="button" 
                    onClick={handleSignOut} 
                    className="btn-secondary" 
                    style={{ padding: '0.85rem', background: 'rgba(244,63,94,0.1)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)' }}
                  >
                    🚪 {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                  </button>
                </div>
              </div>
            ) : (
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
                        title={showPassword ? (lang === 'ar' ? 'إخفاء كلمة السر' : 'Hide password') : (lang === 'ar' ? 'إظهار كلمة السر' : 'Show password')}
                      >
                        {showPassword ? <EyeOfHorusOpen /> : <EyeOfHorusClosed />}
                      </button>
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div style={{ textAlign: lang === 'ar' ? 'left' : 'right', marginTop: '-0.5rem' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!email.trim() || !email.includes('@')) {
                            setAuthError(lang === 'ar' ? 'يرجى كتابة البريد الإلكتروني أولاً لاستعادة كلمة المرور.' : 'Please enter your email address first.');
                            return;
                          }
                          setIsLoading(true);
                          setAuthError(null);
                          try {
                            const res = await forgotPasswordOtpAction(email.trim());
                            if (res.success) {
                              setOtpModalMode('recovery');
                              setShowOtpModal(true);
                            } else {
                              setAuthError(res.error || (lang === 'ar' ? 'تعذر إرسال رمز الاستعادة.' : 'Failed to send recovery code.'));
                            }
                          } catch (err) {
                            setAuthError(lang === 'ar' ? 'تعذر إرسال رمز الاستعادة.' : 'Failed to send recovery code.');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--gold-primary)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                      </button>
                    </div>
                  )}

                  {mode === 'register' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                          {t('govLabel')}
                        </label>
                        <select value={governorate} onChange={e => setGovernorate(e.target.value)}>
                          <option value={lang === 'ar' ? "القاهرة" : "Cairo"}>{lang === 'ar' ? "القاهرة" : "Cairo"}</option>
                          <option value={lang === 'ar' ? "الجيزة" : "Giza"}>{lang === 'ar' ? "الجيزة" : "Giza"}</option>
                          <option value={lang === 'ar' ? "الإسكندرية" : "Alexandria"}>{lang === 'ar' ? "الإسكندرية" : "Alexandria"}</option>
                          <option value={lang === 'ar' ? "الدقهلية" : "Dakahlia"}>{lang === 'ar' ? "الدقهلية" : "Dakahlia"}</option>
                          <option value={lang === 'ar' ? "الشرقية" : "Sharqia"}>{lang === 'ar' ? "الشرقية" : "Sharqia"}</option>
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
                    {isLoading ? (lang === 'ar' ? 'جاري التحقق...' : 'Verifying...') : (mode === 'login' ? t('loginBtn') : t('registerBtn'))}
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
        mode={otpModalMode}
        onClose={() => setShowOtpModal(false)} 
        onVerifySuccess={async (res) => {
          setShowOtpModal(false);
          if (res?.session) {
            document.cookie = `sb-access-token=${res.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
            document.cookie = `supabase-auth-token=${res.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          }

          let profileData = null;
          if (res?.user?.id) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('full_name, phone, governorate, role')
              .eq('id', res.user.id)
              .single();
            if (prof) profileData = prof;
          }

          loginUser({
            id: res?.user?.id || 'customer',
            email: res?.user?.email || email.trim(),
            fullName: profileData?.full_name || res?.user?.user_metadata?.full_name || fullName.trim() || email.split('@')[0],
            phone: profileData?.phone || res?.user?.user_metadata?.phone || phone.trim() || '',
            governorate: profileData?.governorate || governorate || (lang === 'ar' ? 'القاهرة' : 'Cairo'),
            role: profileData?.role || 'customer'
          });

          showToast(
            otpModalMode === 'recovery'
              ? (lang === 'ar' ? 'تم إعادة ضبط كلمة المرور وتسجيل الدخول بنجاح.' : 'Password reset and signed in successfully.')
              : (lang === 'ar' ? 'تم تفعيل البريد الإلكتروني وتسجيل الدخول بنجاح.' : 'Email verified and signed in successfully.')
          );
          setTimeout(() => {
            window.location.href = '/my-orders';
          }, 800);
        }}
      />

      <Footer />
    </div>
  );
}
