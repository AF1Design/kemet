'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';

export const Hero = () => {
  const { t } = useApp();

  return (
    <section className="hero-fullwidth-section">
      {/* Background Banner Image - Full Width Edge-to-Edge */}
      <div className="hero-bg-wrapper">
        <img 
          src="/assets/kemet-hero-banner.jpg" 
          alt="KEMET Build Your Legacy Sports Banner" 
          className="hero-banner-full-img"
        />
        <div className="hero-gradient-overlay"></div>
      </div>

      {/* Hero Content Floating Overlay */}
      <div className="container hero-content-container">
        <div className="hero-content-box">
          <div className="hero-badge-pill">
            <img src="/assets/kemet-emblem-icon.png" alt="KEMET Icon" style={{ height: '24px' }} />
            <span>{t('heroBadge')}</span>
          </div>

          <h1 className="hero-main-heading">
            BUILD YOUR LEGACY
            <span className="hero-sub-heading">{t('heroTitle')}</span>
          </h1>

          <p className="hero-description">
            {t('heroSubtitle')}
          </p>

          <div className="hero-cta-group">
            <Link href="/category/kits" className="btn-primary hero-btn">
              {t('heroCtaPrimary')} 🛍️
            </Link>
            <Link href="/category/training" className="btn-secondary hero-btn">
              {t('heroCtaSecondary')} ⚡
            </Link>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat-card">
              <span className="stat-icon">🥇</span>
              <span>{t('heroStat1')}</span>
            </div>
            <div className="hero-stat-card">
              <span className="stat-icon">🚀</span>
              <span>{t('heroStat2')}</span>
            </div>
            <div className="hero-stat-card">
              <span className="stat-icon">🔍</span>
              <span>{t('heroStat3')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
