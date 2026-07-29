'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Footer } from '../../components/Footer';

export default function TrackOrderPage() {
  const { t } = useApp();
  const [trackingCode, setTrackingCode] = useState('');
  const [activeStep, setActiveStep] = useState(2);
  const [isSearched, setIsSearched] = useState(false);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      setIsSearched(true);
      setActiveStep(3);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          
          {/* Section Title */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">🚚 {t('trackOrderTitle')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              {t('trackOrderSubtitle')}
            </p>
          </div>

          {/* Search Box */}
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-gold-bright)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '2.5rem 2rem',
            marginBottom: '3rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder={t('trackInputPlaceholder')}
                value={trackingCode}
                onChange={e => setTrackingCode(e.target.value)}
                style={{ flexGrow: 1, padding: '0.9rem 1.25rem', fontSize: '1rem' }}
                required
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
                {t('trackBtn')}
              </button>
            </form>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a 
                href="https://www.egyptpost.org/" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary" 
                style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}
              >
                {t('trackOfficialBtn')}
              </a>
              <a 
                href="https://wa.me/201000000000" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary" 
                style={{ padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}
              >
                {t('trackWhatsappBtn')}
              </a>
            </div>
          </div>

          {/* Tracking Progress Timeline Visual */}
          {isSearched && (
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '2.5rem 2rem' 
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                  حالة الشحنة رقم: #{trackingCode || 'KM-2027-8941'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  مزود الخدمة: البريد المصري السريع (Egypt Post Express)
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', textAlign: 'center' }}>
                <div style={{ opacity: activeStep >= 1 ? 1 : 0.4 }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('step1')}</div>
                </div>

                <div style={{ opacity: activeStep >= 2 ? 1 : 0.4 }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('step2')}</div>
                </div>

                <div style={{ opacity: activeStep >= 3 ? 1 : 0.4 }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚚</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--gold-primary)' }}>{t('step3')}</div>
                </div>

                <div style={{ opacity: activeStep >= 4 ? 1 : 0.4 }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t('step4')}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
