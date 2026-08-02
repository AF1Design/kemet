'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  verifySignupOtpAction, 
  resendOtpAction, 
  forgotPasswordOtpAction, 
  verifyPasswordResetOtpAction 
} from '../app/actions/auth-actions.js';

// Eye of Horus (عين حورس المفتوحة) - SVG Icon
const EyeOfHorusOpen = () => (
  <svg className="eye-horus-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  <svg className="eye-horus-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6c3-2.2 8-2.2 13 0c2 0.8 3 1.5 3 1.5" stroke="var(--gold-primary)" strokeWidth="1.5" opacity="0.7" />
    <path d="M3 11c4 4.5 12 4.5 17 0" stroke="var(--gold-primary)" strokeWidth="2.2" />
    <path d="M7 13.5l-1 2.5" />
    <path d="M11.5 14.5v2.8" />
    <path d="M16 13.5l1 2.5" />
    <path d="M11.5 15.5v5c0 1.5-1 2.5-2.5 2.5" opacity="0.6" />
    <path d="M14.5 15.5c1 1.5 2.5 2 3.5 1" opacity="0.6" />
  </svg>
);

/**
 * Normalizes Eastern Arabic digits (٠-٩) to standard ASCII digits (0-9)
 */
function normalizeDigits(val) {
  if (!val) return '';
  const arabicMap = { '٠':'0', '١':'1', '٢':'2', '٣':'3', '٤':'4', '٥':'5', '٦':'6', '٧':'7', '٨':'8', '٩':'9' };
  const replaced = val.replace(/[٠-٩]/g, d => arabicMap[d] || d);
  return replaced.replace(/[^0-9]/g, '');
}

/**
 * KEMET 8-Digit Email OTP Component & Modal (Phase 4 Recovery Supported with Eye of Horus Toggle)
 * - Supports Mode: 'signup' (Email Activation) & 'recovery' (Password Recovery)
 * - Built 100% with KEMET UI System & Brand Guidelines
 * - High-Contrast Inputs for Dark & Light Modes
 * - Dynamic Slogan: BUILD YOUR LEGACY
 * - Includes Eye of Horus Toggle Icon for Password Visibility
 * - Includes 60s Countdown Timer, Auto-Focus, Resend Protection & Auto Session Return
 */
export const OtpModal = ({
  isOpen,
  email,
  mode = 'signup', // 'signup' or 'recovery'
  onClose,
  onVerifySuccess,
  otpLength = 8
}) => {
  const [digits, setDigits] = useState(Array(otpLength).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // 60-Second Countdown Timer state
  const [timer, setTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  const inputRefs = useRef([]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (isOpen && timer > 0) {
      setIsResendDisabled(true);
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, timer]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(Array(otpLength).fill(''));
      setNewPassword('');
      setShowPassword(false);
      setErrorMessage(null);
      setSuccessMessage(
        mode === 'recovery' 
          ? 'تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني.'
          : 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.'
      );
      setTimer(60);
      setIsResendDisabled(true);
      // Auto focus first input
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 150);
    }
  }, [isOpen, otpLength, mode]);

  if (!isOpen) return null;

  // Handle Digit Change with Arabic Transliteration & Auto Focus Next
  const handleChange = (index, value) => {
    const cleanVal = normalizeDigits(value);
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const newDigits = [...digits];
    // Handle Paste or single digit
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, otpLength).split('');
      pastedDigits.forEach((d, idx) => {
        if (idx < otpLength) newDigits[idx] = d;
      });
      setDigits(newDigits);
      const nextIdx = Math.min(pastedDigits.length, otpLength - 1);
      if (inputRefs.current[nextIdx]) inputRefs.current[nextIdx].focus();
    } else {
      newDigits[index] = cleanVal[0];
      setDigits(newDigits);
      if (index < otpLength - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle Keydown (Backspace navigation)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      if (inputRefs.current[index - 1]) inputRefs.current[index - 1].focus();
    }
  };

  // Handle Confirm Verification & Pass Session
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = digits.join('');
    if (fullOtp.length < otpLength) {
      setErrorMessage('يرجى كتابة رمز التحقق كاملاً.');
      return;
    }

    if (mode === 'recovery' && (!newPassword || newPassword.length < 6)) {
      setErrorMessage('يرجى كتابة كلمة المرور الجديدة (6 أحرف على الأقل).');
      return;
    }

    setIsLoading(true);

    try {
      let res;
      if (mode === 'recovery') {
        res = await verifyPasswordResetOtpAction({ email, otp: fullOtp, newPassword });
      } else {
        res = await verifySignupOtpAction({ email, otp: fullOtp });
      }

      if (res.success) {
        setSuccessMessage(
          mode === 'recovery' 
            ? 'تم إعادة ضبط كلمة المرور وتفعيل الحساب بنجاح.'
            : 'تم التحقق من البريد الإلكتروني بنجاح.'
        );
        if (onVerifySuccess) {
          onVerifySuccess(res);
        }
      } else {
        setErrorMessage(res.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته.');
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      setErrorMessage('تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (isResendDisabled || isLoading) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      let res;
      if (mode === 'recovery') {
        res = await forgotPasswordOtpAction(email);
      } else {
        res = await resendOtpAction({ email });
      }

      if (res.success) {
        setSuccessMessage('تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.');
        setTimer(60);
        setIsResendDisabled(true);
        setDigits(Array(otpLength).fill(''));
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      } else {
        setErrorMessage(res.error || 'تعذر إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Resend Error:', err);
      setErrorMessage('تعذر تنفيذ العملية. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '500px',
          background: '#0D111A',
          border: '1px solid var(--border-gold-bright)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
          direction: 'rtl',
          position: 'relative'
        }}
      >
        {/* Header Logo & Brand Slogan */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-primary)', letterSpacing: '3px', textTransform: 'uppercase' }}>
            KEMET
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 800, letterSpacing: '1.5px', marginTop: '0.2rem', textTransform: 'uppercase' }}>
            BUILD YOUR LEGACY
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
          {mode === 'recovery' ? 'استعادة كلمة المرور' : 'إدخال رمز التحقق'}
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          أدخل الرمز الرقمي المكون من {otpLength} أرقام الذي تم إرساله إلى:<br />
          <strong style={{ color: 'var(--gold-primary)', direction: 'ltr', display: 'inline-block', fontWeight: 800 }}>{email}</strong>
        </p>

        {/* Success Message Banner */}
        {successMessage && (
          <div style={{
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid var(--border-gold-bright)',
            color: '#FFDF73',
            padding: '0.8rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            fontWeight: 800,
            marginBottom: '1.5rem'
          }}>
            {successMessage}
          </div>
        )}

        {/* Error Message Banner */}
        {errorMessage && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#F43F5E',
            padding: '0.8rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}>
            {errorMessage}
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleVerify}>
          <div 
            style={{ 
              display: 'flex', 
              justify: 'center', 
              alignItems: 'center',
              gap: otpLength > 6 ? '0.4rem' : '0.6rem', 
              direction: 'ltr',
              marginBottom: mode === 'recovery' ? '1.25rem' : '2rem',
              flexWrap: 'nowrap',
              width: '100%'
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={otpLength}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                disabled={isLoading}
                style={{
                  width: 'clamp(36px, 9.5vw, 48px)',
                  height: '58px',
                  textAlign: 'center',
                  fontSize: '1.45rem',
                  fontWeight: '900',
                  color: '#FFFFFF',
                  backgroundColor: '#05070C',
                  border: digit ? '2px solid #FFDF73' : '1.5px solid var(--border-gold)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  caretColor: 'var(--gold-primary)',
                  boxShadow: digit ? '0 0 12px rgba(212, 175, 55, 0.5)' : 'none',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
              />
            ))}
          </div>

          {/* New Password Input for Recovery Mode with Eye of Horus Toggle Icon */}
          {mode === 'recovery' && (
            <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '0.4rem' }}>
                كلمة السر الجديدة
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    height: '52px',
                    paddingLeft: '3.2rem',
                    paddingRight: '1.2rem',
                    fontSize: '1rem',
                    background: '#05070C',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-md)',
                    boxSizing: 'border-box',
                    outline: 'none'
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
          )}

          {/* Confirm Button */}
          <button
            type="submit"
            disabled={isLoading || digits.join('').length < otpLength}
            style={{
              width: '100%',
              padding: '0.9rem',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#000000',
              background: 'var(--gold-gradient)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: isLoading || digits.join('').length < otpLength ? 'not-allowed' : 'pointer',
              opacity: isLoading || digits.join('').length < otpLength ? 0.6 : 1,
              marginBottom: '1.25rem',
              transition: 'var(--transition)'
            }}
          >
            {isLoading ? 'جاري التحقق...' : (mode === 'recovery' ? 'حفظ كلمة السر وتأكيد الدخول' : 'تأكيد الرمز')}
          </button>
        </form>

        {/* Resend OTP & Timer Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResendDisabled || isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: isResendDisabled ? '#64748B' : 'var(--gold-primary)',
              fontWeight: 800,
              cursor: isResendDisabled || isLoading ? 'not-allowed' : 'pointer',
              textDecoration: isResendDisabled ? 'none' : 'underline'
            }}
          >
            إعادة إرسال الرمز
          </button>

          <span style={{ color: '#94A3B8', fontWeight: 700 }}>
            {isResendDisabled ? `إعادة الإرسال بعد (${String(timer).padStart(2, '0')} ثانية)` : 'جاهز للإعادة'}
          </span>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              fontSize: '1.4rem',
              cursor: 'pointer'
            }}
            title="إغلاق"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
