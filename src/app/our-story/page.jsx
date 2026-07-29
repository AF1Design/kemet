'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';

export default function OurStoryPage() {
  const { t } = useApp();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <img src="/assets/kemet-emblem-icon.png" alt="KEMET Logo" style={{ height: '56px', margin: '0 auto 1.5rem' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">{t('storyTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
              {t('storySubtitle')}
            </p>
          </div>

          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-gold-bright)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '3rem 2.5rem',
            boxShadow: 'var(--shadow-glow)',
            lineHeight: 1.85,
            fontSize: '1.08rem',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line'
          }}>
            {t('storyText')}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
