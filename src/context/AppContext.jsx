'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

import { getCategoriesListAction, syncCustomerCartAction, clearCustomerCartAction } from '../app/admin/actions';
import { trackAddToCart } from '../lib/analytics';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('ar');
  const [theme, setTheme] = useState('dark');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);

  const cmsSettings = {
    isPromoActive: false,
    promoTextAr: '',
    promoTextEn: '',
    isFreeShippingPromo: false,
    shippingRates: {
      'القاهرة': 60,
      'الجيزة': 60,
      'القليوبية': 60,
      'الإسكندرية': 60,
      'الشرقية': 70,
      'الدقهلية': 70,
      'الغربية': 70,
      'المنوفية': 70,
      'البحيرة': 70,
      'كفر الشيخ': 70,
      'دمياط': 70,
      'بورسعيد': 70,
      'الإسماعيلية': 70,
      'السويس': 70,
      'بني سويف': 80,
      'الفيوم': 80,
      'المنيا': 80,
      'أسيوط': 80,
      'سوهاج': 90,
      'قنا': 90,
      'الأقصر': 90,
      'أسوان': 90,
      'البحر الأحمر': 110,
      'جنوب سيناء': 110,
      'شمال سيناء': 110,
      'مطروح': 110,
      'الوادي الجديد': 110,
      'محافظة أخرى': 80
    }
  };

  // Initialize client state safely & fetch live Supabase Categories data
  useEffect(() => {
    setMounted(true);
    try {
      const savedLang = localStorage.getItem('kemet_lang');
      if (savedLang) setLang(savedLang);

      const savedTheme = localStorage.getItem('kemet_theme');
      if (savedTheme) setTheme(savedTheme);

      const savedCart = localStorage.getItem('kemet_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedUser = localStorage.getItem('kemet_user');
      if (savedUser) setUser(JSON.parse(savedUser));

      // Clear legacy local orders cache to prevent cross-account order leakage
      localStorage.removeItem('kemet_orders');
      setOrders([]);
    } catch (e) {
      console.error('Error loading local state:', e);
    }

    async function syncCategories() {
      try {
        const catRes = await getCategoriesListAction();
        if (catRes.success && catRes.categories && catRes.categories.length > 0) {
          setDbCategories(catRes.categories);
        }
      } catch (err) {
        console.warn('Categories sync note:', err);
      }
    }
    syncCategories();

    // Auto-open Cart Drawer if requested via URL param (e.g. after login)
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('openCart') === 'true') {
          setTimeout(() => {
            setIsCartOpen(true);
          }, 300);
        }
      } catch (e) {}
    }
  }, []);

  // Sync lang & dir
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('kemet_lang', lang);
  }, [lang, mounted]);

  // Sync theme
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kemet_theme', theme);
  }, [theme, mounted]);

  // Sync cart locally and to database for abandoned cart tracking
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('kemet_cart', JSON.stringify(cart));

    // Debounced database sync for logged-in user
    if (user) {
      const timer = setTimeout(() => {
        try {
          const lastPage = typeof window !== 'undefined' ? window.location.pathname : '/';
          syncCustomerCartAction({
            userId: user.id,
            customer: user,
            items: cart,
            lastPage
          }).catch(err => {
            console.warn('Cart sync note:', err);
          });
        } catch (e) {}
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cart, user, mounted]);

  // Sync user
  useEffect(() => {
    if (!mounted) return;
    if (user) {
      localStorage.setItem('kemet_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kemet_user');
    }
  }, [user, mounted]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const toggleLang = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loginUser = (userData) => {
    setUser(userData);
    showToast(lang === 'ar' ? `مرحباً بك ${userData.fullName || 'عزيزنا العميل'} في KEMET` : `Welcome ${userData.fullName || 'Customer'} to KEMET`);

    // Check if there is a pending cart item to restore automatically
    try {
      const pendingStr = localStorage.getItem('kemet_pending_cart_item');
      if (pendingStr) {
        const pendingItem = JSON.parse(pendingStr);
        if (pendingItem?.product) {
          const prod = pendingItem.product;
          const sz = pendingItem.selectedSize || 'L';
          setCart(prev => {
            const existingIndex = prev.findIndex(item => item.id === prod.id && item.size === sz);
            if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex].quantity += 1;
              return updated;
            }
            return [...prev, { ...prod, size: sz, quantity: 1 }];
          });
          trackAddToCart(prod, sz, 1);
        }
        localStorage.removeItem('kemet_pending_cart_item');
      }
    } catch (e) {
      console.warn('Pending cart restore note:', e);
    }
  };

  const logoutUser = () => {
    setUser(null);
    setOrders([]);
    localStorage.removeItem('kemet_user');
    localStorage.removeItem('kemet_orders');
    showToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Signed out successfully');
  };

  const addToCart = (product, selectedSize = 'L') => {
    if (!user) {
      // Save pending item to localStorage so it's restored right after login
      try {
        localStorage.setItem('kemet_pending_cart_item', JSON.stringify({ product, selectedSize }));
      } catch (e) {}

      showToast(lang === 'ar' ? 'يرجى تسجيل الدخول أو إنشاء حساب بالبريد الإلكتروني أولاً لإضافة المنتجات إلى السلة' : 'Please log in or create an account with email first to add items to your cart');
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
      return false;
    }

    // Determine variant stock limit if available
    let availableStock = 50;
    const variants = product.product_variants || product.variants || [];
    if (variants.length > 0) {
      const matched = variants.find(v => v.size === selectedSize);
      if (matched && matched.stock_quantity !== undefined && matched.stock_quantity !== null) {
        availableStock = Number(matched.stock_quantity);
      }
    } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      const matched = product.sizes.find(s => (typeof s === 'object' ? s.size : s) === selectedSize);
      if (matched && typeof matched === 'object' && (matched.stock !== undefined || matched.stock_quantity !== undefined)) {
        availableStock = Number(matched.stock ?? matched.stock_quantity);
      }
    }

    if (availableStock <= 0) {
      showToast(lang === 'ar' ? `مقاس (${selectedSize}) غير متوفر حالياً في المخزن` : `Size (${selectedSize}) is currently out of stock`);
      return false;
    }

    const existingIndex = cart.findIndex(item => item.id === product.id && item.size === selectedSize);
    if (existingIndex > -1 && cart[existingIndex].quantity >= availableStock) {
      showToast(lang === 'ar' ? `عذراً، لا يمكن إضافة المزيد. أقصى كمية متوفرة من مقاس (${selectedSize}) هي ${availableStock} قطعة فقط` : `Maximum available quantity for size (${selectedSize}) is ${availableStock}`);
      return false;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.id === product.id && item.size === selectedSize);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { ...product, size: selectedSize, quantity: 1 }];
    });
    trackAddToCart(product, selectedSize, 1);
    showToast(lang === 'ar' ? `تم إضافة ${product.nameAr || product.nameEn} مقاس (${selectedSize}) إلى السلة بنجاح` : `Added ${product.nameEn || product.nameAr} size (${selectedSize}) to cart`);
    return true;
  };

  const removeFromCart = (id, size) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.size === size)));
  };

  const updateItemSize = (id, oldSize, newSize) => {
    if (!newSize || oldSize === newSize) return;
    setCart(prev => {
      const sourceItem = prev.find(item => item.id === id && item.size === oldSize);
      if (!sourceItem) return prev;
      const targetIndex = prev.findIndex(item => item.id === id && item.size === newSize);

      if (targetIndex > -1) {
        return prev.map((item, idx) => {
          if (idx === targetIndex) {
            return { ...item, quantity: item.quantity + sourceItem.quantity };
          }
          return item;
        }).filter(item => !(item.id === id && item.size === oldSize));
      } else {
        return prev.map(item => {
          if (item.id === id && item.size === oldSize) {
            return { ...item, size: newSize };
          }
          return item;
        });
      }
    });
  };

  const updateQuantity = (id, size, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id && item.size === size) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;

          // Check available stock if incrementing
          if (delta > 0) {
            const variants = item.product_variants || item.variants || [];
            let stockLimit = 50;
            if (variants.length > 0) {
              const matched = variants.find(v => v.size === size);
              if (matched && matched.stock_quantity !== undefined && matched.stock_quantity !== null) {
                stockLimit = Number(matched.stock_quantity);
              }
            }
            if (newQty > stockLimit) {
              showToast(lang === 'ar' ? `عذراً، أقصى كمية متوفرة من هذا المقاس هي ${stockLimit} قطعة فقط` : `Maximum available quantity is ${stockLimit}`);
              return item;
            }
          }

          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
    if (user?.id || user?.phone) {
      clearCustomerCartAction(user?.id, user?.phone).catch(() => {});
    }
  };

  const addOrder = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    if (user?.id || newOrder?.customer?.phone) {
      clearCustomerCartAction(user?.id, newOrder?.customer?.phone).catch(() => {});
    }
  };

  const cancelOrder = (orderId) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    showToast('تم إلغاء الطلب بنجاح');
  };

  const updateFullOrder = (orderId, { customer, items }) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = order.shipping || 50;
        const total = subtotal + shipping;

        return {
          ...order,
          customer: {
            ...order.customer,
            ...customer
          },
          items,
          subtotal,
          total
        };
      }
      return order;
    }));
    showToast('تم تعديل تفاصيل ومحتويات الطلب بنجاح');
  };

  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        theme,
        cart,
        orders,
        user,
        isCartOpen,
        toast,
        mounted,
        cmsSettings,
        dbCategories,
        setDbCategories,
        toggleLang,
        toggleTheme,
        loginUser,
        logoutUser,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateItemSize,
        updateQuantity,
        clearCart,
        addOrder,
        cancelOrder,
        updateFullOrder,
        showToast,
        t
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
