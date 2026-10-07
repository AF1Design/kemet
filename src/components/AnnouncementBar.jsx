'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getAnnouncementBarConfigAction } from '../app/admin/actions';
import { DEFAULT_ANNOUNCEMENT_CONFIG } from '../lib/announcement';

export const AnnouncementBar = () => {
  const { showToast } = useApp();
  const [config, setConfig] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Load config on mount
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await getAnnouncementBarConfigAction();
        if (isMounted) {
          if (res && res.success && res.config) {
            setConfig(res.config);
          } else {
            setConfig(DEFAULT_ANNOUNCEMENT_CONFIG);
          }
          setIsLoaded(true);
        }
      } catch (e) {
        if (isMounted) {
          setConfig(DEFAULT_ANNOUNCEMENT_CONFIG);
          setIsLoaded(true);
        }
      }
    }
    loadConfig();
    return () => { isMounted = false; };
  }, []);

  const slides = (config?.slides || []).filter(s => s && s.text);
  const intervalSeconds = Number(config?.intervalSeconds || 4);

  // Auto rotation
  useEffect(() => {
    if (!config?.isActive || slides.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, intervalSeconds * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [config?.isActive, slides.length, intervalSeconds, isPaused]);

  const currentSlide = slides[currentIndex] || slides[0];

  // Live countdown timer state for slide expiration
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    // If the slide has expiresAt or endsAt, OR if it's the KEMET12 coupon
    const targetExpiresAt = currentSlide?.expiresAt || currentSlide?.endsAt || (
      currentSlide?.code?.toUpperCase() === 'KEMET12' ? '2026-10-09T13:30:00.000Z' : null
    );

    if (!targetExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = Date.now();
      const diff = new Date(targetExpiresAt).getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ expired: true, text: 'انتهى العرض' });
        return;
      }

      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;

      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeft({
        expired: false,
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
        text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  if (!isLoaded || !config?.isActive || slides.length === 0) {
    return null;
  }

  const handleCopyCode = (e, codeToCopy) => {
    e.stopPropagation();
    if (!codeToCopy) return;

    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(codeToCopy);
      } else {
        const temp = document.createElement('textarea');
        temp.value = codeToCopy;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopiedCode(codeToCopy);
      showToast(`تم نسخ كود (${codeToCopy}) بنجاح`);
      setTimeout(() => {
        setCopiedCode(null);
      }, 2500);
    } catch (err) {
      showToast(`كود الخصم: ${codeToCopy}`);
    }
  };

  return (
    <div
      role="region"
      aria-label="إعلانات وعروض كيميت"
      className="announcement-bar"
      data-keep-white="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        zIndex: 110,
        background: 'linear-gradient(90deg, #8E6516 0%, #B88924 30%, #C9962D 50%, #B88924 70%, #8E6516 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        color: '#FFFFFF',
        minHeight: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.4rem 1rem',
        fontFamily: "var(--font-ar), 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: '0.88rem',
        fontWeight: 700,
        letterSpacing: 'normal',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      <div
        key={currentIndex}
        className="announcement-slide"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          textAlign: 'center',
          background: 'transparent',
          padding: 0,
          margin: 0,
          animation: 'announcementFadeIn 0.4s ease forwards'
        }}
      >
        <span 
          className="announcement-text"
          style={{ 
            color: '#FFFFFF', 
            fontWeight: 800, 
            fontSize: '0.9rem',
            letterSpacing: 'normal',
            lineHeight: 1.4,
            background: 'transparent',
            padding: 0,
            margin: 0
          }}
        >
          {currentSlide.text}
        </span>

        {currentSlide.code && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={(e) => handleCopyCode(e, currentSlide.code)}
              title="انقر لنسخ الكود"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.18rem 0.65rem',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                background: copiedCode === currentSlide.code ? '#10B981' : 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(4px)',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "var(--font-en), monospace",
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ letterSpacing: '0.5px' }}>{currentSlide.code}</span>
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                fontFamily: "var(--font-ar), 'Cairo', sans-serif",
                background: 'rgba(255, 255, 255, 0.22)', 
                padding: '0.08rem 0.4rem', 
                borderRadius: '12px',
                color: '#FFFFFF'
              }}>
                {copiedCode === currentSlide.code ? 'تم النسخ' : 'نسخ'}
              </span>
            </button>

            {timeLeft && !timeLeft.expired && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.18rem 0.6rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 225, 120, 0.75)',
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35), 0 0 10px rgba(255, 215, 0, 0.2)',
                  color: '#FEF08A',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  direction: 'ltr',
                  fontFamily: "var(--font-en), monospace",
                  lineHeight: 1
                }}
                title="الوقت المتبقي لانتهاء كود الخصم (عد تنازلي)"
              >
                <span style={{ fontSize: '0.82rem', animation: 'timerTick 1s infinite alternate ease-in-out' }}>⏳</span>
                <span style={{ letterSpacing: '0.75px', color: '#FFFFFF', fontWeight: 900 }}>
                  {timeLeft.text}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: "var(--font-ar), 'Cairo', sans-serif",
                  color: '#FDE047',
                  fontWeight: 800,
                  marginRight: '0.15rem'
                }}>
                  متبقي
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes announcementFadeIn {
          from {
            opacity: 0;
            transform: translateY(-2px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes timerTick {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.18);
          }
        }
      `}</style>
    </div>
  );
};
