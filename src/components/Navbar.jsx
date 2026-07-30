'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { AnimatedLogo } from './AnimatedLogo';
import { CartIcon } from './CartIcon';
import { products } from '../data/products';

// Helper text normalizer for intelligent search
const normalizeText = (text = '') => {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '')
    .trim();
};

export const Navbar = ({ onOpenMobileMenu }) => {
  const { lang, theme, cart, user, toggleLang, toggleTheme, setIsCartOpen, t } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const categoriesRef = useRef(null);
  const ordersRef = useRef(null);
  const searchRef = useRef(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setIsCategoriesOpen(false);
      }
      if (ordersRef.current && !ordersRef.current.contains(event.target)) {
        setIsOrdersOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for instant search dropdown
  const filteredProducts = searchQuery.trim()
    ? products.filter(product => {
        const queryNorm = normalizeText(searchQuery);
        const queryTokens = queryNorm.split(/\s+/).filter(Boolean);

        const nameArNorm = normalizeText(product.nameAr);
        const nameEnNorm = normalizeText(product.nameEn);
        const descArNorm = normalizeText(product.descriptionAr);
        const keywordsNorm = (product.keywords || []).map(normalizeText).join(' ');

        const fullHaystack = `${nameArNorm} ${nameEnNorm} ${descArNorm} ${keywordsNorm}`;
        return queryTokens.every(token => fullHaystack.includes(token)) || fullHaystack.includes(queryNorm);
      })
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSelectProduct = (productId) => {
    router.push(`/product/${productId}`);
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
  };

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <span>{t('promoText')}</span>
      </div>

      {/* Main Header */}
      <header className="header">
        <div className="container header-container">
          
          {/* Right (in RTL): Brand Emblem Logo + KEMET Title + Slogan */}
          <div className="header-brand-section">
            <AnimatedLogo />
          </div>

          {/* Navigation Links Menu (Desktop) */}
          <ul className="nav-menu">
            <li>
              <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} style={{ fontWeight: 800 }}>
                {t('navHome')}
              </Link>
            </li>

            {/* Mega Dropdown: الفئات (Categories) */}
            <li className="nav-dropdown-item" ref={categoriesRef}>
              <button 
                type="button"
                onClick={() => {
                  setIsCategoriesOpen(!isCategoriesOpen);
                  setIsOrdersOpen(false);
                }}
                className={`nav-link dropdown-trigger ${isCategoriesOpen || pathname.startsWith('/category') ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
              >
                <span>{t('navCategories')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s ease', transform: isCategoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Mega Menu Horizontal Sub-Categories Bar */}
              {isCategoriesOpen && (
                <div className="mega-menu-dropdown">
                  <div className="container mega-menu-container">
                    <div className="mega-menu-title">الفئات الرئيسية</div>
                    
                    <div className="mega-menu-grid">
                      <Link 
                        href="/category/kits" 
                        className="mega-menu-link" 
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <span className="category-bold-title">{t('navKits')}</span>
                        <span className="category-sub-desc">أطقم 2027 الرسمية (Player Edition) بسعر 280 ج.م</span>
                      </Link>

                      <Link 
                        href="/category/training" 
                        className="mega-menu-link" 
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <span className="category-bold-title">{t('navTraining')}</span>
                        <span className="category-sub-desc">تيشيرتات وخامات ضاغطة للتمرين</span>
                      </Link>

                      <Link 
                        href="/category/shorts" 
                        className="mega-menu-link" 
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <span className="category-bold-title">{t('navShorts')}</span>
                        <span className="category-sub-desc">شورتات أداء مريحة ومرنة</span>
                      </Link>

                      <Link 
                        href="/category/all" 
                        className="mega-menu-link highlight-all" 
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <span className="category-bold-title">{t('navAllProducts')}</span>
                        <span className="category-sub-desc">استعرض الكولكشن الكلي لـ KEMET</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* Dropdown: الطلبات (Orders - My Orders & Egypt Post Tracking) */}
            <li className="nav-dropdown-item" ref={ordersRef}>
              <button 
                type="button"
                onClick={() => {
                  setIsOrdersOpen(!isOrdersOpen);
                  setIsCategoriesOpen(false);
                }}
                className={`nav-link dropdown-trigger ${isOrdersOpen || isActive('/my-orders') || isActive('/track-order') ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
              >
                <span>{t('navOrders')}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s ease', transform: isOrdersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Orders Dropdown Submenu */}
              {isOrdersOpen && (
                <div className="simple-dropdown-menu">
                  <Link 
                    href="/my-orders" 
                    className="dropdown-menu-item" 
                    onClick={() => setIsOrdersOpen(false)}
                    style={{ fontWeight: 800 }}
                  >
                    {t('navMyOrders')}
                  </Link>
                  <Link 
                    href="/track-order" 
                    className="dropdown-menu-item" 
                    onClick={() => setIsOrdersOpen(false)}
                    style={{ fontWeight: 800 }}
                  >
                    {t('navTrackOrder')}
                  </Link>
                </div>
              )}
            </li>

            <li>
              <Link href="/our-story" className={`nav-link ${isActive('/our-story') ? 'active' : ''}`} style={{ fontWeight: 800 }}>
                {t('navStory')}
              </Link>
            </li>

            <li>
              <Link href="/return-policy" className={`nav-link ${isActive('/return-policy') ? 'active' : ''}`} style={{ fontWeight: 800 }}>
                {t('navReturnPolicy')}
              </Link>
            </li>
          </ul>

          {/* Left (in RTL): Search, Language, Theme, User, Cart, Hamburger */}
          <div className="header-actions">
            
            {/* Search Bar Input Control (Desktop) */}
            <div className="search-bar-wrapper desktop-only" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="search-form">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="search-input"
                />
              </form>

              {/* Instant Search Results Dropdown */}
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div className="search-results-dropdown">
                  {filteredProducts.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      لا توجد نتائج مطابقة لـ "{searchQuery}"
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => handleSelectProduct(product.id)}
                        className="search-result-item"
                      >
                        <img src={product.image} alt={product.nameAr} className="search-result-img" />
                        <div>
                          <div className="search-result-name">{lang === 'ar' ? product.nameAr : product.nameEn}</div>
                          <div className="search-result-price">{product.price} {t('currency')}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search Toggle Icon Button */}
            <button 
              type="button" 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="mobile-header-icon-btn mobile-only" 
              title="بحث"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button 
              type="button"
              onClick={onOpenMobileMenu} 
              className="mobile-hamburger-btn" 
              title="فتح القائمة"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {/* Language Switcher Button (Desktop) */}
            <button type="button" onClick={toggleLang} className="action-icon-btn desktop-only" title="تغيير اللغة Language">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span className="action-label" style={{ fontWeight: 800 }}>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Icon-Only Theme Switcher Button (Desktop) */}
            <button type="button" onClick={toggleTheme} className="action-icon-btn desktop-only" title="تغيير المود" style={{ padding: '0.55rem' }}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            {/* User Account Button (Desktop) */}
            <Link 
              href={user ? "/my-orders" : "/login"} 
              className={`action-icon-btn desktop-only ${user ? 'brand-user-active' : ''}`} 
              title={user ? "حسابي وحالة الطلبات" : "تسجيل الدخول"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="action-label" style={{ fontWeight: 800 }}>
                {user ? (user.fullName ? user.fullName.split(' ')[0] : 'حسابي') : 'تسجيل الدخول'}
              </span>
            </Link>

            {/* Shopping Bag Button (Desktop) */}
            <button type="button" onClick={() => setIsCartOpen(true)} className="cart-action-btn desktop-only" title="سلة التسوق">
              <CartIcon size={32} />
              {totalCartCount > 0 && <span className="cart-badge">{totalCartCount}</span>}
            </button>

          </div>
        </div>

        {/* Mobile Expandable Search Bar Overlay */}
        {isMobileSearchOpen && (
          <div className="mobile-search-overlay-bar">
            <form onSubmit={handleSearchSubmit} className="search-form" style={{ width: '100%' }}>
              <input 
                type="text"
                placeholder="ابحث عن أطقم وملابس KEMET..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="search-input"
                style={{ width: '100%', padding: '0.65rem 1rem' }}
              />
            </form>
            {searchQuery.trim().length > 0 && filteredProducts.length > 0 && (
              <div className="mobile-search-dropdown">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => handleSelectProduct(product.id)}
                    className="search-result-item"
                  >
                    <img src={product.image} alt={product.nameAr} className="search-result-img" />
                    <div>
                      <div className="search-result-name">{lang === 'ar' ? product.nameAr : product.nameEn}</div>
                      <div className="search-result-price">{product.price} {t('currency')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};
