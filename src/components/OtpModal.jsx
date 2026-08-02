'use client';

import React, { useState, useEffect, useRef } from 'react';
import { verifySignupOtpAction, resendOtpAction } from '../app/actions/auth-actions.js';

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
 * KEMET 8-Digit Email OTP Component & Modal (Phase 3 Integrated)
 * - Built 100% with KEMET UI System & Brand Guidelines
 * - High-Contrast Inputs for Dark & Light Modes
 * - Dynamic Slogan: BUILD YOUR LEGACY
 * - Includes 60s Countdown Timer, Auto-Focus, Resend Protection & Session Return
 */
export const OtpModal = ({
  isOpen,
  email,
  onClose,
  onVerifySuccess,
  otpLength = 8
}) => {
  const [digits, setDigits] = useState(Array(otpLength).fill(''));
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
      setErrorMessage(null);
      setSuccessMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني.');
      setTimer(60);
      setIsResendDisabled(true);
      // Auto focus first input
      setTimeout(() => {
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 150);
    }
  }, [isOpen, otpLength]);

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

  // Handle Confirm Verification & Pass Session (Phase 3)
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const fullOtp = digits.join('');
    if (fullOtp.length < otpLength) {
      setErrorMessage('يرجى كتابة رمز التحقق كاملاً.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifySignupOtpAction({ email, otp: fullOtp });
      if (res.success) {
        setSuccessMessage('تم التحقق من البريد الإلكتروني بنجاح.');
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
      const res = await resendOtpAction({ email });
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
          maxWidth: '480px',
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
          إدخال رمز التحقق
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
              justifyContent: 'center', 
              alignItems: 'center',
              gap: otpLength > 6 ? '0.4rem' : '0.6rem', 
              direction: 'ltr',
              marginBottom: '2rem',
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
            {isLoading ? 'جاري التحقق...' : 'تأكيد الرمز'}
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
