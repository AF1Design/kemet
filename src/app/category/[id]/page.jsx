'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { products } from '../../../data/products';
import { ProductCard } from '../../../components/ProductCard';
import { Footer } from '../../../components/Footer';
import { KemetLoader } from '../../../components/KemetLoader';

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

export default function CategoryPage({ params }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const searchQueryParam = searchParams.get('search') || '';

  const { lang, t } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      let list = products;

      // 1. Category Filter
      if (id && id !== 'all') {
        list = list.filter(p => p.category === id);
      }

      // 2. Multi-word Intelligent Search Filter
      if (searchQueryParam.trim()) {
        const queryNorm = normalizeText(searchQueryParam);
        const queryTokens = queryNorm.split(/\s+/).filter(Boolean);

        list = list.filter(product => {
          const nameArNorm = normalizeText(product.nameAr);
          const nameEnNorm = normalizeText(product.nameEn);
          const descArNorm = normalizeText(product.descriptionAr);
          const categoryNorm = normalizeText(product.category);
          const keywordsNorm = (product.keywords || []).map(normalizeText).join(' ');

          const fullHaystack = `${nameArNorm} ${nameEnNorm} ${descArNorm} ${categoryNorm} ${keywordsNorm}`;

          return queryTokens.every(token => fullHaystack.includes(token)) || fullHaystack.includes(queryNorm);
        });
      }

      setFilteredProducts(list);
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [id, searchQueryParam]);

  const getCategoryTitle = () => {
    if (searchQueryParam) {
      return lang === 'ar' ? `نتائج البحث عن: "${searchQueryParam}"` : `Search Results for: "${searchQueryParam}"`;
    }
    switch (id) {
      case 'kits':
        return t('navKits');
      case 'training':
        return t('navTraining');
      case 'shorts':
        return t('navShorts');
      default:
        return lang === 'ar' ? 'المنتجات الأكثر مبيعاً خلال آخر 7 أيام' : 'Best Selling Products (Last 7 Days)';
    }
  };

  const getCategorySubtitle = () => {
    if (searchQueryParam) {
      return lang === 'ar' 
        ? `عثرنا على (${filteredProducts.length}) منتجات تطابق كلماتك البحثية` 
        : `Found (${filteredProducts.length}) products matching your search`;
    }
    if (!id || id === 'all') {
      return lang === 'ar' 
        ? 'تشكيلة من ملابس وأطقم KEMET التي حصلت على أكبر نسبة مبيعات هذا الأسبوع' 
        : 'Collection of KEMET kits and activewear with the highest sales volume this week';
    }
    return lang === 'ar'
      ? 'استعرض أحدث تشكيلة من ملابس وأطقم KEMET الرياضية المصممة بمواصفات عالمية'
      : 'Explore KEMET official sportswear designed to high athletic standards';
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container">
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">{getCategoryTitle()}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto' }}>
              {getCategorySubtitle()}
            </p>

            {searchQueryParam && (
              <div style={{ marginTop: '1rem' }}>
                <Link href={`/category/${id || 'all'}`} className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                  ✕ {lang === 'ar' ? 'إزالة فلتر البحث' : 'Clear Search Filter'}
                </Link>
              </div>
            )}
          </div>

          {/* Loading State with Logo Animation */}
          {isLoading ? (
            <KemetLoader message={lang === 'ar' ? `جاري البحث في كولكشن KEMET عن: "${searchQueryParam || id}"...` : `Searching KEMET collection for: "${searchQueryParam || id}"...`} />
          ) : filteredProducts.length === 0 ? (
            
            /* Empty Search Results */
            <div style={{ 
              background: 'var(--bg-card)', 
              backdropFilter: 'blur(16px)', 
              border: '1px solid var(--border-gold)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-glow)',
              maxWidth: '680px',
              margin: '0 auto'
            }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {lang === 'ar' ? `عذراً، لم نجد نتائج تطابق "${searchQueryParam}"` : `Sorry, no products matched "${searchQueryParam}"`}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                {lang === 'ar' 
                  ? 'جرب البحث بكلمات أبسط مثل (ريال مدريد، تيشيرت، أهلي، زمالك، تمرين، شورت)، أو استعرض جميع منتجات المتجر.'
                  : 'Try searching with simpler keywords like (Real Madrid, Jersey, Gym, Shorts), or browse all store products.'}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/category/all" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                  {lang === 'ar' ? 'تصفح كافة الأقسام 🛍️' : 'Browse All Categories 🛍️'}
                </Link>
                <a href="https://api.whatsapp.com/send?phone=201114687759" target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '0.85rem 2.2rem' }}>
                  {lang === 'ar' ? 'طلب طقم خاص عبر الواتساب 📱' : 'Order Custom Kit via WhatsApp 📱'}
                </a>
              </div>
            </div>

          ) : (
            
            /* Products Grid */
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
