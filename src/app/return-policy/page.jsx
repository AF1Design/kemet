'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';

export default function ReturnPolicyPage() {
  const { t } = useApp();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">🛡️ {t('returnPolicyTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              {t('returnPolicySubtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Rule 1 */}
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold)', 
              borderRadius: 'var(--radius-md)', 
              padding: '2rem' 
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>
                📅 {t('returnRule1Title')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.02rem', lineHeight: 1.7 }}>
                {t('returnRule1Desc')}
              </p>
            </div>

            {/* Rule 2 */}
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold-bright)', 
              borderRadius: 'var(--radius-md)', 
              padding: '2rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginBottom: '0.75rem' }}>
                ✨ {t('returnRule2Title')}
              </h3>
              <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1.75, fontWeight: 700 }}>
                "{t('returnRule2Desc')}"
              </p>
            </div>

          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
