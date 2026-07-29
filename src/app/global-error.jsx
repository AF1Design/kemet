'use client';

import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ backgroundColor: '#05070C', color: '#FFFFFF', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <img src="/assets/kemet-emblem-icon.png" alt="KEMET" style={{ height: '54px', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D4AF37', marginBottom: '1rem' }}>
            حدث خطأ في النظام
          </h2>
          <button 
            type="button" 
            onClick={() => reset()} 
            style={{ padding: '0.85rem 2rem', background: 'linear-gradient(135deg, #D4AF37 0%, #AA771C 100%)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 800, cursor: 'pointer' }}
          >
            إعادة تحميل المتجر 🔄
          </button>
        </div>
      </body>
    </html>
  );
}
