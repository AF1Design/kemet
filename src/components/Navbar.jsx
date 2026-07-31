'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { AnimatedLogo } from './AnimatedLogo';
import { CartIcon } from './CartIcon';
import { supabase } from '../lib/supabase/client';

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
  const [catalogProducts, setCatalogProducts] = useState([]);

  const categoriesRef = useRef(null);
  const ordersRef = useRef(null);
  const searchRef = useRef(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch catalog products from Supabase for live search suggestions
  useEffect(() => {
    async function fetchSearchCatalog() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true);

        if (!error && data) {
          const mapped = data.map(p => ({
            id: p.id,
            nameAr: p.name_ar,
            nameEn: p.name_en,
            descriptionAr: p.description_ar,
            descriptionEn: p.description_en,
            category: p.category_id,
            price: Number(p.price),
            oldPrice: p.old_price ? Number(p.old_price) : null,
            image: p.main_image,
            keywords: p.keywords || []
          }));
          setCatalogProducts(mapped);
        }
      } catch (err) {
        console.error('Error fetching search catalog:', err);
      }
    }
    fetchSearchCatalog();
  }, []);

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
    ? catalogProducts.filter(product => {
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
    <header className="navbar-header">
      <div className="navbar-container container">
        
        {/* Right (in RTL): Brand Animated Logo & Main Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <AnimatedLogo />

          {/* Desktop Navigation Links */}
          <nav className="desktop-only">
            <ul className="nav-links">
              <li>
                <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} style={{ fontWeight: 800 }}>
                  {t('navHome')}
                </Link>
              </li>

              {/* Categories Mega Dropdown */}
              <li className="dropdown-container" ref={categoriesRef}>
                <button 
                  type="button" 
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)} 
                  className={`nav-link ${pathname.startsWith('/category') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800 }}
                >
                  {t('navCategories')}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {isCategoriesOpen && (
                  <div className="dropdown-menu">
                    <Link 
                      href="/category/all" 
                      className="dropdown-menu-item" 
                      onClick={() => setIsCategoriesOpen(false)}
                      style={{ fontWeight: 800, color: 'var(--gold-primary)' }}
                    >
                      {t('allProductsCategory')}
                    </Link>
                    <Link 
                      href="/category/kits" 
                      className="dropdown-menu-item" 
                      onClick={() => setIsCategoriesOpen(false)}
                      style={{ fontWeight: 800 }}
                    >
                      {t('navKits')}
                    </Link>
                    <Link 
                      href="/category/training" 
                      className="dropdown-menu-item" 
                      onClick={() => setIsCategoriesOpen(false)}
                      style={{ fontWeight: 800 }}
                    >
                      {t('navTraining')}
                    </Link>
                    <Link 
                      href="/category/shorts" 
                      className="dropdown-menu-item" 
                      onClick={() => setIsCategoriesOpen(false)}
                      style={{ fontWeight: 800 }}
                    >
                      {t('navShorts')}
                    </Link>
                  </div>
                )}
              </li>

              {/* Orders Dropdown */}
              <li className="dropdown-container" ref={ordersRef}>
                <button 
                  type="button" 
                  onClick={() => setIsOrdersOpen(!isOrdersOpen)} 
                  className={`nav-link ${isActive('/my-orders') || isActive('/track-order') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 800 }}
                >
                  {t('navOrders')}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {isOrdersOpen && (
                  <div className="dropdown-menu">
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
          </nav>
        </div>

        {/* Left (in RTL): Search, Language, Theme, Admin Badge, User Profile Link, Cart, Hamburger */}
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
                placeholder={lang === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
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
                    {lang === 'ar' ? `لا توجد نتائج مطابقة لـ "${searchQuery}"` : `No matching results for "${searchQuery}"`}
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
                        <div className="search-result-price">{product.price} {t('egp')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Admin Dashboard Quick Access Button (Prominent when user is Admin) */}
          {user && user.role === 'admin' && (
            <Link 
              href="/admin" 
              className="btn-primary desktop-only" 
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem', background: 'var(--gold-gradient)', color: '#000', fontWeight: 900 }}
              title="دخول لوحة تحكم الأدمن الإدارية"
            >
              👑 لوحة التحكم
            </Link>
          )}

          {/* Mobile Search Toggle Icon */}
          <button 
            type="button" 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} 
            className="action-icon-btn mobile-only" 
            title="Search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {/* Language Switcher Button (Desktop) */}
          <button type="button" onClick={toggleLang} className="action-icon-btn desktop-only" title="Language / تغيير اللغة">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="action-label" style={{ fontWeight: 800 }}>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Icon-Only Theme Switcher Button (Desktop) */}
          <button type="button" onClick={toggleTheme} className="action-icon-btn desktop-only" title={lang === 'ar' ? 'تغيير المود' : 'Toggle Theme'} style={{ padding: '0.55rem' }}>
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

          {/* User Account & Profile Settings Button (Desktop) - Always links directly to /login Profile Panel */}
          <Link 
            href="/login" 
            className={`action-icon-btn desktop-only ${user ? 'brand-user-active' : ''}`} 
            title={user ? (lang === 'ar' ? `حسابي وإعداداتي (${user.fullName || user.email})` : `My Profile & Settings (${user.fullName || user.email})`) : (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: user ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: user ? '1px solid var(--border-gold-bright)' : '1px solid transparent',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              color: user ? 'var(--gold-primary)' : 'inherit',
              textDecoration: 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="action-label" style={{ fontWeight: 800 }}>
              {user ? (user.fullName ? user.fullName.split(' ')[0] : (lang === 'ar' ? 'حسابي' : 'Account')) : (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
            </span>
          </Link>

          {/* Shopping Cart Button Toggle */}
          <button 
            type="button" 
            onClick={() => setIsCartOpen(true)} 
            className="action-icon-btn cart-btn-badge"
            title={lang === 'ar' ? 'حقيبة التسوق' : 'Shopping Cart'}
          >
            <CartIcon count={totalCartCount} />
          </button>

          {/* Mobile Menu Toggle Hamburger Icon */}
          <button 
            type="button" 
            onClick={onOpenMobileMenu} 
            className="action-icon-btn mobile-only"
            title="Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Instant Search Input Overlay */}
      {isMobileSearchOpen && (
        <div style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: '0.75rem 1rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text"
              placeholder={lang === 'ar' ? 'ابحث عن منتج...' : 'Search products...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '0.65rem' }}
              autoFocus
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
              {lang === 'ar' ? 'بحث' : 'Search'}
            </button>
          </form>
        </div>
      )}
    </header>
  );
};
