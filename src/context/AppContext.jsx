'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';

import { getCategoriesListAction } from '../app/admin/actions';

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
      'القاهرة': 40,
      'الجيزة': 40,
      'الإسكندرية': 50,
      'القليوبية': 45,
      'الشرقية': 50,
      'الدقهلية': 50,
      'الغربية': 50,
      'المنوفية': 50,
      'البحيرة': 55,
      'كفر الشيخ': 55,
      'دمياط': 55,
      'الإسماعيلية': 55,
      'السويس': 55,
      'بورسعيد': 55,
      'بني سويف': 60,
      'المنيا': 60,
      'أسيوط': 65,
      'سوهاج': 65,
      'قنا': 70,
      'الأقصر': 70,
      'أسوان': 75,
      'محافظة أخرى': 60
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

  // Sync cart
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('kemet_cart', JSON.stringify(cart));
  }, [cart, mounted]);

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
    showToast(`مرحباً بك ${userData.fullName || 'عزيزنا العميل'} في KEMET 👑`);
  };

  const logoutUser = () => {
    setUser(null);
    setOrders([]);
    localStorage.removeItem('kemet_user');
    localStorage.removeItem('kemet_orders');
    showToast('تم تسجيل الخروج بنجاح 👋');
  };

  const addToCart = (product, selectedSize = 'L') => {
    const itemVariants = product.product_variants || product.variants || [];
    const itemSizes = product.sizes || [];

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id && item.size === selectedSize);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        if (!updated[existingIndex].product_variants && itemVariants.length > 0) {
          updated[existingIndex].product_variants = itemVariants;
        }
        if (!updated[existingIndex].sizes && itemSizes.length > 0) {
          updated[existingIndex].sizes = itemSizes;
        }
        return updated;
      }
      return [...prev, { 
        ...product, 
        size: selectedSize, 
        quantity: 1,
        product_variants: itemVariants,
        sizes: itemSizes
      }];
    });
    showToast(`تم إضافة ${product.nameAr || product.nameEn} مقاس (${selectedSize}) للسلة 🛍️`);
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
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const addOrder = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  const cancelOrder = (orderId) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
    showToast('تم إلغاء الطلب بنجاح 🗑️');
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
    showToast('تم تعديل تفاصيل ومحتويات الطلب بنجاح ✏️');
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
