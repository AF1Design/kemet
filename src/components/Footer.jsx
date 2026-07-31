'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { AnimatedLogo } from './AnimatedLogo';

export const Footer = () => {
  const { t } = useApp();

  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', marginBottom: '3.5rem' }}>
          
          {/* Brand Info */}
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <AnimatedLogo />
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              {t('footerAbout')}
            </p>
            
            {/* Direct WhatsApp Channel Button */}
            <a 
              href="https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q" 
              target="_blank" 
              rel="noreferrer" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                padding: '0.75rem 1.4rem', 
                borderRadius: 'var(--radius-full)', 
                background: '#25D366', 
                color: '#FFF', 
                fontWeight: 800, 
                fontSize: '0.9rem',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.103-1.077z" />
              </svg>
              <span>{t('whatsappChannelBtn')}</span>
            </a>
          </div>

          {/* Quick Category Links */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>{t('footerLinks')}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link href="/" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('navHome')}</Link></li>
              <li><Link href="/category/kits" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('navKits')}</Link></li>
              <li><Link href="/category/training" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('navTraining')}</Link></li>
              <li><Link href="/category/shorts" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('navShorts')}</Link></li>
              <li><Link href="/my-orders" style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>{t('navMyOrders')}</Link></li>
              <li><Link href="/track-order" style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>{t('navTrackOrder')}</Link></li>
            </ul>
          </div>

          {/* Customer Support Policies */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>{t('footerPolicyTitle')}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <li><Link href="/our-story" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('navStory')}</Link></li>
              <li><Link href="/return-policy" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('policy1')}</Link></li>
              <li>{t('policy2')}</li>
              <li><Link href="/track-order" style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{t('policy3')}</Link></li>
            </ul>
          </div>

          {/* Official Social Media Links & Icons */}
          <div>
            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>{t('socialTitle')}</h4>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              
              {/* Facebook Page Link */}
              <a 
                href="https://www.facebook.com/share/18tVb5nvWy/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noreferrer"
                title="KEMET Facebook"
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  background: 'rgba(24, 119, 242, 0.15)', 
                  border: '1px solid rgba(24, 119, 242, 0.4)', 
                  color: '#1877F2',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'var(--transition)'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Instagram Page Link */}
              <a 
                href="https://www.instagram.com/kemetbrand.eg?igsh=bmxka2pzcGxyMDdy" 
                target="_blank" 
                rel="noreferrer"
                title="KEMET Instagram"
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  background: 'rgba(225, 48, 108, 0.15)', 
                  border: '1px solid rgba(225, 48, 108, 0.4)', 
                  color: '#E1306C',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'var(--transition)'
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <p>{t('copyright')}</p>
        </div>

      </div>
    </footer>
  );
};
