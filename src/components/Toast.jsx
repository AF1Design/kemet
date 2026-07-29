'use client';

import React from 'react';

export const Toast = ({ message }) => {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(13, 17, 26, 0.95)',
      color: 'var(--gold-primary)',
      border: '1px solid var(--border-gold-bright)',
      padding: '0.75rem 1.5rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.9rem',
      fontWeight: 800,
      boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(212, 175, 55, 0.3)',
      zIndex: 999,
      backdropFilter: 'blur(10px)',
      animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {message}
    </div>
  );
};
