'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '75vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <img src="/assets/kemet-emblem-icon.png" alt="KEMET" style={{ height: '54px', marginBottom: '1.5rem' }} />
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        الصفحة غير موجودة أو تم نقلها
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '500px' }}>
        الصفحة التي تحاول الوصول إليها غير متاحة حالياً. يمكنك تصفح كولكشن KEMET أو العودة للرئيسية.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
          الصفحة الرئيسية 🏠
        </Link>
        <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem 2rem' }}>
          استعرض المنتجات 🛍️
        </Link>
      </div>
    </div>
  );
}
