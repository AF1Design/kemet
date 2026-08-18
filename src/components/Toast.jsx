'use client';

import React from 'react';

export const Toast = ({ message }) => {
  if (!message) return null;

  const isWarning = message.includes('⚠️') || message.includes('منتهي') || message.includes('خطأ') || message.includes('غير متوفر');

  return (
    <div 
      className="kemet-ios-toast"
      style={{
        position: 'fixed',
        top: 'max(16px, env(safe-area-inset-top, 16px))',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(12, 16, 26, 0.94)',
        color: isWarning ? '#FCA5A5' : 'var(--gold-primary)',
        border: isWarning ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(212, 175, 55, 0.45)',
        padding: '0.65rem 1.25rem',
        borderRadius: '9999px',
        fontSize: '0.92rem',
        fontWeight: 800,
        boxShadow: isWarning 
          ? '0 14px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(244, 63, 94, 0.25)' 
          : '0 14px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(212, 175, 55, 0.25)',
        zIndex: 1000002,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        maxWidth: 'min(92vw, 460px)',
        width: 'max-content',
        textAlign: 'center',
        lineHeight: 1.4,
        pointerEvents: 'none',
        animation: 'dynamicIslandDrop 0.42s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div 
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: isWarning ? 'rgba(244, 63, 94, 0.18)' : 'rgba(212, 175, 55, 0.18)',
          border: isWarning ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(212, 175, 55, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {isWarning ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      <span style={{ color: '#FFFFFF', letterSpacing: '0.2px' }}>
        {message.replace(/[🛍️🎉⚠️✅]/g, '').trim()}
      </span>
    </div>
  );
};
