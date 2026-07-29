import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CartIcon } from './CartIcon';

export const MobileBottomNav = ({ onOpenMobileMenu }) => {
  const { cart, setIsCartOpen, t } = useApp();
  const location = useLocation();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mobile-bottom-bar">
      {/* 1. الرئيسية (Home) */}
      <NavLink 
        to="/" 
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>{t('navHome')}</span>
      </NavLink>

      {/* 2. الفئات (Categories) */}
      <NavLink 
        to="/category/all" 
        className={({ isActive }) => `mobile-nav-item ${isActive || location.pathname.includes('/category') ? 'active' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        </svg>
        <span>{t('navCategories')}</span>
      </NavLink>

      {/* 3. سلة التسوق (Cart) */}
      <button 
        onClick={() => setIsCartOpen(true)} 
        className="mobile-nav-item mobile-cart-item"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CartIcon size={22} />
          {totalCartCount > 0 && <span className="mobile-cart-badge">{totalCartCount}</span>}
        </div>
        <span>{t('cartTitle')}</span>
      </button>

      {/* 4. الطلبات (Orders) */}
      <NavLink 
        to="/my-orders" 
        className={({ isActive }) => `mobile-nav-item ${isActive || location.pathname === '/track-order' ? 'active' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>{t('navOrders')}</span>
      </NavLink>

      {/* 5. القائمة ☰ (Menu Drawer Trigger) */}
      <button 
        onClick={onOpenMobileMenu} 
        className="mobile-nav-item"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <span>القائمة</span>
      </button>
    </div>
  );
};
