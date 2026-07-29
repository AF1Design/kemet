'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { CartIcon } from './CartIcon';

export const MobileBottomBar = () => {
  const { cart, setIsCartOpen, t } = useApp();
  const pathname = usePathname();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="mobile-bottom-bar">
      <Link href="/" className={`mobile-nav-item ${pathname === '/' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>{t('navHome')}</span>
      </Link>

      <Link href="/category/all" className={`mobile-nav-item ${pathname.startsWith('/category') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        <span>{t('navCategories')}</span>
      </Link>

      <button 
        type="button"
        onClick={() => setIsCartOpen(true)} 
        className="mobile-nav-item mobile-cart-item" 
        style={{ position: 'relative' }}
      >
        <CartIcon size={24} />
        {totalCartCount > 0 && <span className="mobile-cart-badge">{totalCartCount}</span>}
        <span>{t('cartTitle')}</span>
      </button>

      <Link href="/my-orders" className={`mobile-nav-item ${pathname === '/my-orders' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>طلباتي</span>
      </Link>
    </nav>
  );
};
