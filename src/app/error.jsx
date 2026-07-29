'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div style={{ 
      minHeight: '70vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <img src="/assets/kemet-emblem-icon.png" alt="KEMET" style={{ height: '48px', marginBottom: '1.5rem' }} />
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '1rem' }}>
        حدث خطأ أثناء تحميل الصفحة
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        يرجى إعادة محاولة التحميل أو العودة للصفحة الرئيسية لمتجر KEMET.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          type="button" 
          onClick={() => reset()} 
          className="btn-primary" 
          style={{ padding: '0.8rem 1.8rem' }}
        >
          إعادة المحاولة 🔄
        </button>
        <Link href="/" className="btn-secondary" style={{ padding: '0.8rem 1.8rem' }}>
          الصفحة الرئيسية 🏠
        </Link>
      </div>
    </div>
  );
}
