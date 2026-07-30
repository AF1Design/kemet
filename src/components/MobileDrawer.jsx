'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { AnimatedLogo } from './AnimatedLogo';

export const MobileDrawer = ({ isOpen, onClose }) => {
  const { lang, theme, user, toggleLang, toggleTheme, t } = useApp();

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-content" onClick={e => e.stopPropagation()}>
        
        {/* Mobile Drawer Header */}
        <div className="mobile-drawer-header">
          <AnimatedLogo />
          <button type="button" onClick={onClose} className="drawer-close-btn" title="إغلاق القائمة">
            &times;
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <div className="mobile-drawer-nav">
          
          {/* User Account / Dedicated Login Button in Mobile Drawer */}
          <Link 
            href={user ? "/my-orders" : "/login"} 
            className="mobile-menu-link" 
            onClick={onClose} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--gold-primary)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>{user ? (lang === 'ar' ? `حسابي (${user.fullName || user.phone})` : `My Account (${user.fullName || user.phone})`) : (lang === 'ar' ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register')}</span>
          </Link>

          <Link href="/" className="mobile-menu-link" onClick={onClose}>
            {t('navHome')}
          </Link>

          <div className="mobile-menu-section-title">{lang === 'ar' ? 'الأقسام والفئات 2027' : '2027 Categories'}</div>
          <Link href="/category/kits" className="mobile-menu-sublink" onClick={onClose}>
            {t('navKits')} (280 {t('currency')})
          </Link>
          <Link href="/category/training" className="mobile-menu-sublink" onClick={onClose}>
            {t('navTraining')}
          </Link>
          <Link href="/category/shorts" className="mobile-menu-sublink" onClick={onClose}>
            {t('navShorts')}
          </Link>
          <Link href="/category/all" className="mobile-menu-sublink highlight" onClick={onClose}>
            {t('navAllProducts')}
          </Link>

          <div className="mobile-menu-section-title">{lang === 'ar' ? '⚙️ إدارة الحساب والطلبات' : '⚙️ Account & Orders'}</div>
          <Link href="/login" className="mobile-menu-link" onClick={onClose} style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>
            ⚙️ {t('accountSettingsTitle')}
          </Link>
          <Link href="/my-orders" className="mobile-menu-link" onClick={onClose}>
            📦 {t('navMyOrders')}
          </Link>
          <Link href="/track-order" className="mobile-menu-link" onClick={onClose}>
            🚚 {t('navTrackOrder')}
          </Link>

          <div className="mobile-menu-section-title">{lang === 'ar' ? 'المعلومات والسياسات' : 'Information & Policies'}</div>
          <Link href="/our-story" className="mobile-menu-link" onClick={onClose}>
            {t('navStory')}
          </Link>
          <Link href="/return-policy" className="mobile-menu-link" onClick={onClose}>
            {t('navReturnPolicy')}
          </Link>
        </div>

        {/* Mobile Drawer Footer Actions (Lang & Icon-Only Theme - NO 'لايت' or 'دارك' text) */}
        <div className="mobile-drawer-footer" style={{ gap: '0.75rem' }}>
          <button type="button" onClick={toggleLang} className="action-icon-btn" style={{ flex: 1, justifyContent: 'center', padding: '0.65rem' }} title="Language">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span style={{ fontWeight: 800 }}>{lang === 'ar' ? 'English' : 'عربي'}</span>
          </button>

          {/* Icon-Only Theme Switcher Button - Zero Text */}
          <button type="button" onClick={toggleTheme} className="action-icon-btn" style={{ padding: '0.65rem 1.1rem', justifyContent: 'center' }} title="تغيير المود">
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
