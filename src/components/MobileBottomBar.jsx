'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { CartIcon } from './CartIcon';

export const MobileBottomBar = () => {
  const { cart, user, setIsCartOpen, t } = useApp();
  const pathname = usePathname();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="mobile-bottom-bar">
      {/* 1. الرئيسية (Home) */}
      <Link href="/" className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>{t('navHome')}</span>
      </Link>

      {/* 2. الأكثر مبيعاً (Best Sellers - PURE VIBRANT RED STAR ICON & RED TEXT) */}
      <Link href="/category/all" className={`mobile-nav-item ${pathname === '/category/all' ? 'active' : ''}`} style={{ color: '#FF0000' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000" stroke="#FF0000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        <span style={{ color: '#FF0000', fontWeight: 900 }}>{t('featuredProductsTitle').replace(' 🔥', '').replace(' ⭐', '')}</span>
      </Link>

      {/* 3. عربة التسوق (Golden Tote Cart Bag Icon) */}
      <button 
        type="button"
        onClick={() => setIsCartOpen(true)} 
        className="mobile-nav-item mobile-cart-item" 
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CartIcon size={24} />
          {totalCartCount > 0 && <span className="mobile-cart-badge">{totalCartCount}</span>}
        </div>
        <span>{t('cartTitle')}</span>
      </button>

      {/* 4. تسجيل الدخول / حسابي (Account / Login) */}
      <Link href={user ? "/my-orders" : "/login"} className={`mobile-nav-item ${pathname === '/login' || pathname === '/my-orders' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>{user ? (t('navOrders')) : t('loginTab')}</span>
      </Link>

      {/* 5. الفئات (Categories) */}
      <Link href="/category/kits" className={`mobile-nav-item ${pathname.startsWith('/category') && pathname !== '/category/all' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        </svg>
        <span>{t('navCategories')}</span>
      </Link>
    </nav>
  );
};
