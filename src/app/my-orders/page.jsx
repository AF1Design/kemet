'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { products as storeProducts } from '../../data/products';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase/client';
import { updateOrderStatusAction, getCustomerOrdersAction, updateCustomerOrderAction } from '../admin/actions';
import { updateUserProfileAction } from '../actions/auth-actions';

function extractOrderCouponCode(order) {
  if (!order) return null;
  if (order.coupon_code) return String(order.coupon_code).trim().toUpperCase();
  if (order.couponCode) return String(order.couponCode).trim().toUpperCase();
  const notes = String(order.delivery_notes || order.notes || order.customer?.notes || '');
  if (notes) {
    const m = notes.match(/\[كود الخصم:\s*([^\]|]+)/i);
    if (m) return m[1].trim().toUpperCase();
  }
  return null;
}

function calculateOrderPricingDetails(order, catalogProducts = []) {
  if (!order) return null;

  const couponCode = extractOrderCouponCode(order);
  const items = Array.isArray(order.items) ? order.items : [];
  const totalPieces = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
  const shippingFee = Number(order.shipping_fee ?? order.shipping ?? 50);
  const finalTotal = Number(order.total ?? order.total_amount ?? 0);

  let parsedDiscountFromNotes = 0;
  const notes = String(order.delivery_notes || order.notes || order.customer?.notes || '');
  if (notes) {
    const discMatch = notes.match(/\|\s*خصم:\s*(\d+(?:\.\d+)?)\s*ج\.م\]/i);
    if (discMatch) {
      parsedDiscountFromNotes = Number(discMatch[1]);
    }
  }

  let originalProductsSubtotal = 0;
  const enrichedItems = items.map(item => {
    const matchedCatalog = (catalogProducts || []).find(p => 
      String(p.id) === String(item.id || item.product_id) ||
      (p.nameAr && item.nameAr && p.nameAr.trim() === item.nameAr.trim())
    );
    const catalogUnitPrice = Number(matchedCatalog?.price || item.catalog_price || 470);
    const qty = Number(item.quantity || 1);
    originalProductsSubtotal += (catalogUnitPrice * qty);

    let effectiveUnitPrice = Number(item.price || 0);

    if (effectiveUnitPrice > 0 && effectiveUnitPrice < catalogUnitPrice) {
      // already discounted
    } else if (couponCode === 'KEMETMISR') {
      effectiveUnitPrice = 225;
    } else if (couponCode === 'KEMET22') {
      effectiveUnitPrice = 290;
    } else if (couponCode === 'KEMETFAMILY') {
      effectiveUnitPrice = 220;
    } else if (effectiveUnitPrice === 0 || effectiveUnitPrice >= catalogUnitPrice) {
      if (parsedDiscountFromNotes > 0 && totalPieces > 0) {
        effectiveUnitPrice = Math.max(0, catalogUnitPrice - Math.round(parsedDiscountFromNotes / totalPieces));
      } else if (originalProductsSubtotal > 0 && finalTotal > 0 && (originalProductsSubtotal + shippingFee) > finalTotal) {
        const diff = (originalProductsSubtotal + shippingFee) - finalTotal;
        effectiveUnitPrice = Math.max(0, catalogUnitPrice - Math.round(diff / totalPieces));
      } else {
        effectiveUnitPrice = catalogUnitPrice;
      }
    }

    const hasDiscount = effectiveUnitPrice < catalogUnitPrice;

    return {
      ...item,
      catalogUnitPrice,
      effectiveUnitPrice,
      effectiveItemTotal: effectiveUnitPrice * qty,
      catalogItemTotal: catalogUnitPrice * qty,
      hasDiscount
    };
  });

  const discountedProductsSubtotal = enrichedItems.reduce((s, it) => s + it.effectiveItemTotal, 0);
  let totalDiscount = originalProductsSubtotal - discountedProductsSubtotal;

  if (totalDiscount <= 0 && parsedDiscountFromNotes > 0) {
    totalDiscount = parsedDiscountFromNotes;
  }
  if (totalDiscount <= 0 && (originalProductsSubtotal + shippingFee) > finalTotal) {
    totalDiscount = (originalProductsSubtotal + shippingFee) - finalTotal;
  }

  return {
    couponCode,
    hasDiscount: totalDiscount > 0 || Boolean(couponCode),
    totalPieces,
    originalProductsSubtotal: originalProductsSubtotal || (finalTotal - shippingFee + totalDiscount),
    discountedProductsSubtotal,
    discountAmount: Math.max(0, totalDiscount),
    shippingFee,
    finalTotal: finalTotal || (discountedProductsSubtotal + shippingFee),
    items: enrichedItems
  };
}

function applyCouponToEditItems(items, couponCode, catalogProducts = []) {
  if (!Array.isArray(items) || items.length === 0) return items;

  const totalPieces = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
  const cleanCode = couponCode ? String(couponCode).trim().toUpperCase() : null;

  return items.map(item => {
    const matchedCatalog = (catalogProducts || []).find(p => 
      String(p.id) === String(item.id || item.product_id) ||
      (p.nameAr && item.nameAr && p.nameAr.trim() === item.nameAr.trim())
    );
    const catalogPrice = Number(matchedCatalog?.price || item.catalog_price || 470);

    let newUnitPrice = catalogPrice;

    if (cleanCode === 'KEMETMISR') {
      newUnitPrice = 225;
    } else if (cleanCode === 'KEMET22') {
      newUnitPrice = 290;
    } else if (cleanCode === 'KEMETFAMILY') {
      newUnitPrice = 220;
    } else if (cleanCode === 'KEMET10') {
      newUnitPrice = Math.round(catalogPrice * 0.9);
    } else if (cleanCode === 'OFF50') {
      newUnitPrice = Math.max(0, catalogPrice - Math.round(50 / Math.max(1, totalPieces)));
    } else if (Number(item.price || 0) > 0 && Number(item.price || 0) < catalogPrice) {
      newUnitPrice = Number(item.price);
    }

    return {
      ...item,
      catalog_price: catalogPrice,
      price: newUnitPrice,
      unit_price: newUnitPrice
    };
  });
}

export default function MyOrdersPage() {
  const { lang, user, orders, cancelOrder, updateFullOrder, logout, loginUser, showToast, t } = useApp();
  const [dbOrders, setDbOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'profile'
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileGov, setProfileGov] = useState(user?.governorate || 'القاهرة');
  const [profileAddress, setProfileAddress] = useState(user?.address || '');

  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePhone(user.phone || '');
      setProfileGov(user.governorate || 'القاهرة');
      setProfileAddress(user.address || '');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const res = await updateUserProfileAction({
        userId: user.id,
        fullName: profileName,
        phone: profilePhone,
        governorate: profileGov,
        address: profileAddress
      });

      if (res?.success) {
        loginUser({
          ...user,
          fullName: profileName,
          phone: profilePhone,
          governorate: profileGov,
          address: profileAddress
        });
        showToast(lang === 'ar' ? 'تم حفظ وتحديث بيانات حسابك بنجاح' : 'Account updated successfully');
      } else {
        alert(res?.error || (lang === 'ar' ? 'فشل في تحديث البيانات' : 'Failed to update profile'));
      }
    } catch (err) {
      alert(err.message || (lang === 'ar' ? 'فشل في تحديث البيانات' : 'Failed to update profile'));
    }
  };

  // Fetch live orders directly from Supabase DB via Server Action + Live Polling
  useEffect(() => {
    let interval = null;

    async function fetchDbOrders() {
      try {
        const localOrderIds = (orders || []).map(o => o.id);
        const res = await getCustomerOrdersAction({
          userId: user?.id,
          phone: user?.phone,
          email: user?.email,
          orderIds: localOrderIds
        });

        if (res.success && Array.isArray(res.orders)) {
          setDbOrders(res.orders);
        }
      } catch (err) {
        console.warn('Orders sync warning:', err);
      }
    }

    fetchDbOrders();
    interval = setInterval(fetchDbOrders, 4000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, orders]);

  const displayOrders = (dbOrders.length > 0 ? dbOrders : orders).map(o => {
    const matchedDb = dbOrders.find(dbo => dbo.id === o.id);
    if (matchedDb) {
      const rawItems = matchedDb.order_items || matchedDb.items || o.items || [];
      const formattedItems = rawItems.map(item => {
        const itemId = item.product_id || item.id;
        const itemNameAr = (item.product_name_ar || item.nameAr || item.title || '').trim();
        const itemNameEn = (item.product_name_en || item.nameEn || item.title || '').trim().toLowerCase();

        // 1. Check local AppContext order items
        const localItem = (o.items || []).find(it => 
          (String(it.id) === String(itemId)) || 
          (it.nameAr && it.nameAr.trim() === itemNameAr) ||
          (it.nameEn && it.nameEn.trim().toLowerCase() === itemNameEn)
        );

        // 2. Check static storeProducts catalog
        const catalogItem = storeProducts.find(p => 
          (String(p.id) === String(itemId)) ||
          (p.nameAr && p.nameAr.trim() === itemNameAr) ||
          (p.nameEn && p.nameEn.trim().toLowerCase() === itemNameEn)
        );

        // 3. Resolve actual product image
        let resolvedImage = item.image || item.main_image || item.mainImage;
        if (!resolvedImage || resolvedImage === '/assets/kemet-emblem-icon.png') {
          resolvedImage = 
            (localItem?.image && localItem.image !== '/assets/kemet-emblem-icon.png' ? localItem.image : null) ||
            localItem?.main_image ||
            localItem?.mainImage ||
            catalogItem?.image ||
            catalogItem?.main_image ||
            null;
        }

        // 4. Resolve variants
        const variants = 
          item.product_variants || 
          item.variants || 
          localItem?.product_variants || 
          localItem?.variants || 
          catalogItem?.variants || 
          [];

        return {
          id: itemId,
          nameAr: item.product_name_ar || item.nameAr || item.title || 'منتج KEMET',
          nameEn: item.product_name_en || item.nameEn || item.title || 'KEMET Product',
          size: item.size || 'M',
          quantity: Number(item.quantity || 1),
          price: Number(item.unit_price || item.price || 0),
          image: resolvedImage || '/assets/kemet-emblem-icon.png',
          product_variants: variants,
          variants: variants
        };
      });

      const subtotal = Number(matchedDb.subtotal ?? o.subtotal ?? 0);
      const shippingFee = Number(matchedDb.shipping_fee ?? o.shipping_fee ?? o.shipping ?? 50);
      const totalAmount = Number(matchedDb.total_amount ?? o.total ?? o.total_amount ?? o.totalAmount ?? 0) || (formattedItems.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 1)), 0) + shippingFee);
      const deliveryNotes = matchedDb.delivery_notes || o.delivery_notes || o.notes || '';
      const couponCode = matchedDb.coupon_code || o.coupon_code || o.couponCode || null;
      const trackingNumber = matchedDb.tracking_number || o.tracking_number || null;

      return {
        id: matchedDb.id,
        date: matchedDb.created_at ? new Date(matchedDb.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : o.date,
        time: o.time || '',
        status: matchedDb.status || o.status,
        isShipped: matchedDb.is_shipped || false,
        tracking_number: trackingNumber,
        customer: {
          fullName: matchedDb.customer_name || o.customer?.fullName,
          phone: matchedDb.customer_phone || o.customer?.phone,
          governorate: matchedDb.governorate || o.customer?.governorate,
          address: matchedDb.address || o.customer?.address,
          notes: deliveryNotes
        },
        items: formattedItems.length > 0 ? formattedItems : (o.items || []),
        order_items: formattedItems.length > 0 ? formattedItems : (o.items || []),
        subtotal: subtotal,
        shipping_fee: shippingFee,
        total: totalAmount,
        total_amount: totalAmount,
        delivery_notes: deliveryNotes,
        notes: deliveryNotes,
        coupon_code: couponCode
      };
    }

    const fallbackItems = o.items || [];
    const fallbackShipping = Number(o.shipping_fee ?? o.shipping ?? 50);
    const fallbackTotal = Number(o.total ?? o.total_amount ?? o.totalAmount ?? 0) || (fallbackItems.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 1)), 0) + fallbackShipping);

    return {
      ...o,
      shipping_fee: fallbackShipping,
      total: fallbackTotal,
      total_amount: fallbackTotal
    };
  });

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editFormCustomer, setEditFormCustomer] = useState({
    fullName: '',
    phone: '',
    governorate: '',
    address: ''
  });
  const [editFormItems, setEditFormItems] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState(storeProducts || []);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  // Load store catalog products dynamically from Supabase
  useEffect(() => {
    async function loadCatalog() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('is_active', true);

        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data.map(p => ({
            id: p.id,
            nameAr: p.name_ar,
            nameEn: p.name_en || p.name_ar,
            price: Number(p.price) || 450,
            image: p.main_image || p.image || '/assets/kemet-emblem-icon.png',
            variants: p.product_variants || []
          }));
          setCatalogProducts(mapped);
        }
      } catch (e) {
        console.warn('Catalog fetch warning:', e);
      }
    }
    loadCatalog();
  }, []);

  const handleStartEdit = (order) => {
    setEditingOrderId(order.id);
    setIsAddingProduct(false);
    setSelectedProductId('');
    setSelectedSize('');
    setSelectedQty(1);
    setEditFormCustomer({
      fullName: order.customer?.fullName || order.customer_name || '',
      phone: order.customer?.phone || order.customer_phone || '',
      governorate: order.customer?.governorate || order.governorate || '',
      address: order.customer?.address || order.address || '',
      notes: order.delivery_notes || order.notes || ''
    });

    const coupon = extractOrderCouponCode(order);
    const preppedItems = applyCouponToEditItems(order.items.map(item => ({ ...item })), coupon, catalogProducts);
    setEditFormItems(preppedItems);
  };

  const handleItemSizeChange = (index, newSize) => {
    if (!newSize) return;
    setEditFormItems(prev => {
      return prev.map((item, i) => (i === index ? { ...item, size: newSize } : item));
    });
  };

  const handleItemQtyChange = (index, delta) => {
    const currentOrder = displayOrders.find(o => o.id === editingOrderId);
    const coupon = extractOrderCouponCode(currentOrder);

    setEditFormItems(prev => {
      const targetItem = prev[index];
      if (!targetItem) return prev;
      const currentQty = Number(targetItem.quantity) || 1;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        if (prev.length <= 1) {
          alert(lang === 'ar' ? 'يجب أن يحتوي الطلب على منتج واحد على الأقل.' : 'Order must contain at least one item.');
          return prev;
        }
        const filtered = prev.filter((_, i) => i !== index);
        return applyCouponToEditItems(filtered, coupon, catalogProducts);
      }
      const updated = prev.map((item, i) => (i === index ? { ...item, quantity: newQty } : item));
      return applyCouponToEditItems(updated, coupon, catalogProducts);
    });
  };

  const handleRemoveItem = (index) => {
    if (editFormItems.length <= 1) {
      alert(lang === 'ar' ? 'يجب أن يحتوي الطلب على منتج واحد على الأقل.' : 'Order must contain at least one item.');
      return;
    }
    const currentOrder = displayOrders.find(o => o.id === editingOrderId);
    const coupon = extractOrderCouponCode(currentOrder);
    setEditFormItems(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return applyCouponToEditItems(filtered, coupon, catalogProducts);
    });
  };

  const handleAddProductToOrder = () => {
    if (!selectedProductId) return;
    const prod = catalogProducts.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const sizeToUse = selectedSize || 'L';
    const qtyToUse = Math.max(1, Number(selectedQty) || 1);

    const currentOrder = displayOrders.find(o => o.id === editingOrderId);
    const coupon = extractOrderCouponCode(currentOrder);

    setEditFormItems(prev => {
      const existingIdx = prev.findIndex(item => 
        (String(item.id || item.product_id) === String(prod.id)) && 
        (String(item.size).trim() === String(sizeToUse).trim())
      );

      let nextItems = [];
      if (existingIdx > -1) {
        nextItems = prev.map((it, idx) => idx === existingIdx ? { ...it, quantity: (Number(it.quantity) || 1) + qtyToUse } : it);
      } else {
        nextItems = [
          ...prev,
          {
            id: prod.id,
            product_id: prod.id,
            nameAr: prod.nameAr,
            nameEn: prod.nameEn,
            price: prod.price,
            catalog_price: prod.price,
            size: sizeToUse,
            quantity: qtyToUse,
            image: prod.image,
            product_variants: prod.variants || []
          }
        ];
      }

      return applyCouponToEditItems(nextItems, coupon, catalogProducts);
    });

    setIsAddingProduct(false);
    setSelectedProductId('');
    setSelectedSize('');
    setSelectedQty(1);
    showToast(lang === 'ar' ? `تمت إضافة (${prod.nameAr}) للطلب وتطبيق الخصم تلقائياً` : 'Product added to order with discount');
  };

  const handleSaveEdit = async (e, orderId) => {
    e.preventDefault();
    if (editFormItems.length === 0) {
      alert(lang === 'ar' ? 'يجب أن يحتوي الطلب على منتج واحد على الأقل.' : 'Order must contain at least one item.');
      return;
    }
    setIsSavingEdit(true);

    const currentOrder = displayOrders.find(o => o.id === orderId);
    const coupon = extractOrderCouponCode(currentOrder);
    const orderShippingFee = Number(currentOrder?.shipping_fee ?? 50);

    const originalSubtotal = editFormItems.reduce((s, it) => {
      const matched = catalogProducts.find(p => String(p.id) === String(it.id || it.product_id));
      const catPrice = Number(matched?.price || it.catalog_price || 470);
      return s + (catPrice * Number(it.quantity || 1));
    }, 0);

    const newDiscountedSubtotal = editFormItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
    const newDiscount = Math.max(0, originalSubtotal - newDiscountedSubtotal);

    let updatedNotes = editFormCustomer.notes || currentOrder?.delivery_notes || '';
    if (coupon) {
      const couponTag = `[كود الخصم: ${coupon}${newDiscount > 0 ? ` | خصم: ${newDiscount} ج.م` : ''}]`;
      const cleanNotes = updatedNotes.replace(/\[كود الخصم:[^\]]+\]\s*/g, '').trim();
      updatedNotes = cleanNotes ? `${couponTag} ${cleanNotes}` : couponTag;
    }

    try {
      const res = await updateCustomerOrderAction({
        orderId,
        customer: {
          ...editFormCustomer,
          notes: updatedNotes
        },
        items: editFormItems,
        shippingFee: orderShippingFee
      });

      if (res.success) {
        updateFullOrder(orderId, {
          customer: { ...editFormCustomer, notes: updatedNotes },
          items: editFormItems
        });
        setDbOrders(prev => prev.map(o => {
          if (o.id === orderId) {
            const finalAmount = newDiscountedSubtotal + orderShippingFee;
            return {
              ...o,
              customer: { ...o.customer, ...editFormCustomer, notes: updatedNotes },
              items: editFormItems,
              order_items: editFormItems,
              subtotal: newDiscountedSubtotal,
              shipping_fee: orderShippingFee,
              total: finalAmount,
              total_amount: finalAmount,
              delivery_notes: updatedNotes,
              coupon_code: coupon
            };
          }
          return o;
        }));
        setEditingOrderId(null);
        showToast(lang === 'ar' ? 'تم حفظ وتحديث الطلب وتطبيق الخصم بنجاح' : 'Order and discount updated successfully');
      } else {
        alert(res.error || (lang === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to save changes'));
      }
    } catch (err) {
      alert(err.message || (lang === 'ar' ? 'حدث خطأ أثناء حفظ التعديلات' : 'Error updating order'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelClick = async (orderId) => {
    const confirmMsg = lang === 'ar' 
      ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟' 
      : 'Are you sure you want to cancel this order?';
    
    if (window.confirm(confirmMsg)) {
      try {
        await updateOrderStatusAction(orderId, 'cancelled');
      } catch (err) {
        console.error('Failed to update DB status on cancel:', err);
      }
      cancelOrder(orderId);
      setDbOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">{t('navMyOrders')}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              {lang === 'ar' 
                ? 'سجل كافة طلباتك ومشترياتك وحالتها المباشرة'
                : 'Your complete order history and live shipment status'}
            </p>
          </div>

          {/* Authentication Check */}
          {!user ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-gold-bright)',
              borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-glow)',
              maxWidth: '640px',
              margin: '0 auto'
            }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لعرض طلباتك' : 'Please sign in first to view your orders'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                {lang === 'ar' 
                  ? 'قم بتسجيل الدخول لاستعراض شحناتك وسجلات الشراء الخاصة بك.'
                  : 'Sign in to manage and view your purchases and delivery updates.'}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                  {t('loginTab')}
                </Link>
                <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem 2.2rem' }}>
                  {t('browseProductsBtn')}
                </Link>
              </div>
            </div>
          ) : displayOrders.length === 0 ? (
            
            /* No Orders State */
            <div style={{ 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-gold)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '4rem 2rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <div style={{ width: '48px', height: '48px', margin: '0 auto 1.25rem', color: 'var(--gold-primary)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {lang === 'ar' ? `أهلاً ${user.fullName || user.email}، لم تقم بإجراء أي طلبات بعد` : `Welcome ${user.fullName || user.email}, you have no orders yet`}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {lang === 'ar' ? 'استعرض الكولكشن الرسمي واختر منتجاتك المفضلة' : 'Explore our collection and pick your favorite activewear'}
              </p>
              <Link href="/category/all" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                {lang === 'ar' ? 'استكشف المنتجات والأطقم' : 'Explore Products'}
              </Link>
            </div>

          ) : (
            
            /* Orders List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Profile Header Bar & Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 900, color: 'var(--gold-primary)', fontSize: '0.95rem' }}>KEMET</span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {t('welcomeBackUser')} <strong style={{ color: 'var(--gold-primary)' }}>{user.fullName || user.email}</strong>
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    {lang === 'ar' ? 'إجمالي الطلبات:' : 'Total Orders:'} <strong style={{ color: 'var(--gold-primary)' }}>{displayOrders.length}</strong>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => logout()} 
                    style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid #F43F5E', color: '#F43F5E', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    border: activeTab === 'orders' ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                    background: activeTab === 'orders' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                    color: activeTab === 'orders' ? 'var(--gold-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {lang === 'ar' ? `طلباتي (${displayOrders.length})` : `My Orders (${displayOrders.length})`}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    border: activeTab === 'profile' ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                    background: activeTab === 'profile' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                    color: activeTab === 'profile' ? 'var(--gold-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {lang === 'ar' ? 'تعديل بيانات الحساب' : 'Edit Account Details'}
                </button>
              </div>

              {/* Profile Details Tab Content */}
              {activeTab === 'profile' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '1.5rem' }}>
                    {lang === 'ar' ? 'تحديث وتعديل بيانات حسابك:' : 'Update Account Profile:'}
                  </h3>

                  <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        الاسم بالكامل:
                      </label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={e => setProfileName(e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }} 
                        required 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        رقم الهاتف:
                      </label>
                      <input 
                        type="tel" 
                        value={profilePhone} 
                        onChange={e => setProfilePhone(e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }} 
                        required 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        المحافظة:
                      </label>
                      <input 
                        type="text" 
                        value={profileGov} 
                        onChange={e => setProfileGov(e.target.value)} 
                        style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }} 
                        required 
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                        العنوان التفصيلي للتسليم:
                      </label>
                      <textarea 
                        value={profileAddress} 
                        onChange={e => setProfileAddress(e.target.value)} 
                        rows={3} 
                        style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }} 
                        required 
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn-primary" style={{ padding: '0.85rem 2rem' }}>
                        {lang === 'ar' ? 'حفظ البيانات المعدلة' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Orders Tab Content */}
              {activeTab === 'orders' && displayOrders.map(order => {
                const statusStr = String(order.status || '').toLowerCase();
                const isShippedOrDelivered = statusStr.includes('شحن') || statusStr.includes('shipped') || statusStr.includes('تسليم') || statusStr.includes('delivered');
                const isCancelled = statusStr.includes('ملغي') || statusStr.includes('cancelled');
                const isPrepStage = !isShippedOrDelivered && !isCancelled;

                // Format status for display without emojis
                let statusLabel = order.status;
                if (statusStr.includes('pending') || statusStr.includes('جديد')) {
                  statusLabel = lang === 'ar' ? 'جديد' : 'New';
                } else if (statusStr.includes('processing') || statusStr.includes('تجهيز')) {
                  statusLabel = lang === 'ar' ? 'جاري التجهيز' : 'Processing';
                } else if (statusStr.includes('shipped') || statusStr.includes('شحن')) {
                  statusLabel = lang === 'ar' ? 'تم الشحن' : 'Shipped';
                } else if (statusStr.includes('out_for_delivery') || statusStr.includes('مندوب')) {
                  statusLabel = lang === 'ar' ? 'مع المندوب' : 'Out for Delivery';
                } else if (statusStr.includes('delivered') || statusStr.includes('تسليم')) {
                  statusLabel = lang === 'ar' ? 'تم التسليم' : 'Delivered';
                } else if (isCancelled) {
                  statusLabel = lang === 'ar' ? 'ملغي' : 'Cancelled';
                }

                const pricing = calculateOrderPricingDetails(order, catalogProducts);

                return (
                  <div 
                    key={order.id} 
                    style={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-gold-bright)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '2rem',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    {/* Order Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap',
                      gap: '1rem',
                      paddingBottom: '1.25rem',
                      borderBottom: '1px solid var(--border-color)',
                      marginBottom: '1.5rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                            #{order.id}
                          </span>
                          {pricing.couponCode && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.15rem 0.55rem',
                              borderRadius: '4px',
                              background: 'rgba(212, 175, 55, 0.15)',
                              border: '1px solid var(--border-gold)',
                              color: 'var(--gold-primary)',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              fontFamily: "var(--font-en), monospace"
                            }}>
                              {lang === 'ar' ? `كود الخصم: ${pricing.couponCode}` : `Coupon: ${pricing.couponCode}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {order.date && (
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {lang === 'ar' ? 'تاريخ الطلب:' : 'Order Date:'}
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {order.date}
                          </div>
                        </div>
                      )}

                      <div style={{ 
                        background: isCancelled ? 'rgba(244, 63, 94, 0.15)' : isPrepStage ? 'rgba(212, 175, 55, 0.15)' : 'rgba(37, 211, 102, 0.15)', 
                        border: isCancelled ? '1px solid rgba(244, 63, 94, 0.4)' : isPrepStage ? '1px solid var(--border-gold)' : '1px solid rgba(37, 211, 102, 0.4)', 
                        padding: '0.45rem 1.1rem', 
                        borderRadius: 'var(--radius-full)',
                        color: isCancelled ? '#F43F5E' : isPrepStage ? 'var(--gold-primary)' : '#25D366',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {statusLabel}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      {pricing.items.map((item, idx) => (
                        <div 
                          key={idx}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1.25rem', 
                            background: 'rgba(0,0,0,0.2)', 
                            padding: '0.85rem 1rem', 
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <img 
                            src={item.image || '/assets/kemet-emblem-icon.png'} 
                            alt={lang === 'ar' ? item.nameAr : item.nameEn} 
                            style={{ width: '56px', height: '56px', objectFit: 'contain', background: '#000', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }} 
                          />
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                              {lang === 'ar' ? item.nameAr : item.nameEn}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {lang === 'ar' ? 'المقاس:' : 'Size:'} <span style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>{item.size}</span> | {lang === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}
                            </div>
                          </div>

                          <div style={{ textAlign: lang === 'ar' ? 'left' : 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem' }}>
                            {item.hasDiscount ? (
                              <>
                                <span style={{ 
                                  textDecoration: 'line-through', 
                                  color: 'var(--text-secondary)', 
                                  fontSize: '0.82rem',
                                  fontWeight: 700 
                                }}>
                                  {item.catalogItemTotal} {t('currency')}
                                </span>
                                <span style={{ 
                                  fontWeight: 900, 
                                  fontSize: '1.15rem', 
                                  color: 'var(--gold-primary)' 
                                }}>
                                  {item.effectiveItemTotal} {t('currency')}
                                </span>
                                <span style={{ 
                                  fontSize: '0.74rem', 
                                  color: '#10B981', 
                                  fontWeight: 800 
                                }}>
                                  ({item.effectiveUnitPrice} {t('currency')} للقطعة)
                                </span>
                              </>
                            ) : (
                              <span style={{ fontWeight: 900, fontSize: '1.15rem', color: 'var(--gold-primary)' }}>
                                {item.effectiveItemTotal} {t('currency')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Financial Breakdown */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.25rem',
                      marginBottom: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        <span>{lang === 'ar' ? 'المجموع الفرعي للمنتجات (السعر الأصلي):' : 'Products Subtotal:'}</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {pricing.originalProductsSubtotal} {t('currency')}
                        </span>
                      </div>

                      {pricing.discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10B981' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span>{lang === 'ar' ? 'قيمة الخصم المعتمد' : 'Discount Applied'}</span>
                            {pricing.couponCode && (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                fontFamily: "var(--font-en), monospace"
                              }}>
                                كود: {pricing.couponCode}
                              </span>
                            )}
                          </span>
                          <span style={{ fontWeight: 900, direction: 'ltr' }}>
                            - {pricing.discountAmount} {t('currency')}
                          </span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        <span>{lang === 'ar' ? 'مصاريف الشحن والتوصيل:' : 'Shipping Fee:'}</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {pricing.shippingFee === 0 ? (lang === 'ar' ? 'شحن مجاني' : 'Free') : `${pricing.shippingFee} ${t('currency')}`}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: 'var(--gold-primary)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                        paddingTop: '0.65rem',
                        marginTop: '0.2rem'
                      }}>
                        <span>{lang === 'ar' ? 'المبلغ الإجمالي المطلوب سداده عند الاستلام:' : 'Total to Pay (COD):'}</span>
                        <span style={{ fontSize: '1.25rem' }}>
                          {pricing.finalTotal} {t('currency')}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '1.5rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {lang === 'ar' ? 'عنوان التسليم:' : 'Delivery Address:'} <strong style={{ color: 'var(--text-primary)' }}>{order.customer.fullName} - {order.customer.governorate} ({order.customer.address})</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {lang === 'ar' ? 'رقم التواصل:' : 'Contact Phone:'} <span style={{ color: 'var(--text-primary)', fontWeight: 700, direction: 'ltr', display: 'inline-block' }}>{order.customer.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Edit/Cancel for Prep stage, WhatsApp for Shipped stage) */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.85rem', 
                      marginTop: '1.25rem', 
                      paddingTop: '1rem', 
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end'
                    }}>
                      {isPrepStage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(order)}
                            className="btn-secondary"
                            style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}
                          >
                            {lang === 'ar' ? 'تعديل الطلب' : 'Edit Order'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleCancelClick(order.id)}
                            style={{
                              padding: '0.55rem 1.25rem',
                              fontSize: '0.88rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid rgba(225, 29, 72, 0.4)',
                              background: 'rgba(225, 29, 72, 0.12)',
                              color: '#F43F5E',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                          >
                            {lang === 'ar' ? 'إلغاء الطلب' : 'Cancel Order'}
                          </button>
                        </>
                      ) : !isCancelled ? (
                        <a
                          href={`https://api.whatsapp.com/send?phone=201114687759&text=${encodeURIComponent(lang === 'ar' ? `أهلاً، أريد الاستفسار عن الطلب رقم #${order.id}` : `Hello, I want to inquire about order #${order.id}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1.4rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#25D366',
                            color: '#FFF',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            textDecoration: 'none'
                          }}
                        >
                          <span>{lang === 'ar' ? 'تواصل عبر الواتساب لمعرفة تفاصيل الطلب' : 'Contact via WhatsApp for Order Details'}</span>
                        </a>
                      ) : null}

                      <Link href="/track-order" className="btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}>
                        {t('navTrackOrder')}
                      </Link>
                    </div>

                    {/* Inline Edit Form */}
                    {editingOrderId === order.id && (
                      <form 
                        onSubmit={(e) => handleSaveEdit(e, order.id)} 
                        style={{ 
                          marginTop: '1.5rem', 
                          padding: '1.75rem 1.5rem', 
                          background: 'rgba(5, 7, 12, 0.95)', 
                          border: '1px solid var(--border-gold-bright)', 
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '1.25rem' }}>
                          {lang === 'ar' ? `تعديل الطلب #${order.id}` : `Edit Order #${order.id}`}
                        </h4>

                        {/* Items & Sizes */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
                            {lang === 'ar' ? 'محتويات الطلب والمقاسات:' : 'Order Items & Sizes:'}
                          </label>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {editFormItems.map((item, idx) => {
                              const currentSize = String(item.size || 'M').trim();
                              
                              // Extract exact product variants directly from Database
                              const variants = item.product_variants || item.variants || [];
                              let sizesList = [];

                              if (variants.length > 0) {
                                sizesList = variants.map(v => ({
                                  size: v.size,
                                  stock: Number(v.stock_quantity ?? 50)
                                }));
                              } else {
                                sizesList = ['M', 'L', 'XL', 'XXL'].map(s => ({ size: s, stock: 50 }));
                              }

                              // Ensure current size is always in the list
                              if (!sizesList.some(s => s.size === currentSize)) {
                                sizesList.unshift({ size: currentSize, stock: 50 });
                              }

                              return (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: '0.85rem',
                                    background: 'rgba(212, 175, 55, 0.04)',
                                    border: '1px solid var(--border-gold)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '1rem',
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {/* Product Image + Title & Price + Delete Button */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', width: '100%' }}>
                                    <img 
                                      src={item.image || '/assets/kemet-emblem-icon.png'} 
                                      alt={item.nameAr} 
                                      style={{ 
                                        width: '52px', 
                                        height: '52px', 
                                        objectFit: 'contain', 
                                        background: '#000', 
                                        borderRadius: '6px', 
                                        border: '1px solid var(--border-color)', 
                                        flexShrink: 0
                                      }} 
                                    />
                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                        {lang === 'ar' ? item.nameAr : item.nameEn}
                                      </div>
                                      {(() => {
                                        const matched = catalogProducts.find(p => String(p.id) === String(item.id || item.product_id));
                                        const catPrice = Number(matched?.price || item.catalog_price || 470);
                                        const unitPrice = Number(item.price || 0);
                                        const hasDiscount = unitPrice > 0 && unitPrice < catPrice;

                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                            {hasDiscount ? (
                                              <>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                                  {catPrice} {t('currency')}
                                                </span>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', fontWeight: 900 }}>
                                                  {unitPrice} {t('currency')}
                                                </span>
                                                <span style={{ 
                                                  fontSize: '0.72rem', 
                                                  background: 'rgba(212, 175, 55, 0.15)', 
                                                  color: 'var(--gold-primary)', 
                                                  padding: '0.1rem 0.4rem', 
                                                  borderRadius: '4px', 
                                                  fontWeight: 800 
                                                }}>
                                                  {lang === 'ar' ? 'سعر الخصم' : 'Discounted'}
                                                </span>
                                              </>
                                            ) : (
                                              <span style={{ fontSize: '0.9rem', color: 'var(--gold-primary)', fontWeight: 900 }}>
                                                {unitPrice || catPrice} {t('currency')}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>

                                    {editFormItems.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        title={lang === 'ar' ? 'حذف هذا المنتج من الطلب' : 'Remove item from order'}
                                        style={{
                                          background: 'rgba(244, 63, 94, 0.12)',
                                          border: '1px solid rgba(244, 63, 94, 0.35)',
                                          color: '#F43F5E',
                                          borderRadius: 'var(--radius-sm)',
                                          padding: '0.35rem 0.65rem',
                                          fontSize: '0.78rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          flexShrink: 0
                                        }}
                                      >
                                        {lang === 'ar' ? 'حذف' : 'Remove'}
                                      </button>
                                    )}
                                  </div>

                                  {/* Dynamic Size Selector matching real product variants & stock */}
                                  <div style={{ 
                                    background: 'rgba(0, 0, 0, 0.35)', 
                                    border: '1px solid var(--border-color)', 
                                    borderRadius: 'var(--radius-sm)', 
                                    padding: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                                        {lang === 'ar' ? 'المقاس المختار:' : 'Selected Size:'} <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>{item.size}</strong>
                                      </span>
                                    </div>

                                    <div style={{ 
                                      display: 'flex', 
                                      flexWrap: 'wrap', 
                                      gap: '0.45rem',
                                      alignItems: 'center'
                                    }}>
                                      {sizesList.map(szObj => {
                                        const isSelected = item.size === szObj.size;
                                        const isOut = szObj.stock <= 0 && !isSelected;

                                        return (
                                          <button
                                            key={szObj.size}
                                            type="button"
                                            disabled={isOut}
                                            onClick={() => {
                                              if (!isOut) {
                                                handleItemSizeChange(idx, szObj.size);
                                              }
                                            }}
                                            style={{
                                              padding: '0.35rem 0.75rem',
                                              borderRadius: 'var(--radius-sm)',
                                              border: isSelected 
                                                ? '1.5px solid var(--gold-primary)' 
                                                : (isOut ? '1px solid rgba(244,63,94,0.3)' : '1px solid var(--border-color)'),
                                              background: isSelected 
                                                ? 'var(--gold-gradient)' 
                                                : (isOut ? 'rgba(244,63,94,0.08)' : 'var(--bg-card)'),
                                              color: isSelected 
                                                ? '#000000' 
                                                : (isOut ? '#F43F5E' : 'var(--text-primary)'),
                                              fontWeight: 900,
                                              fontSize: '0.85rem',
                                              cursor: isOut ? 'not-allowed' : 'pointer',
                                              minWidth: '40px',
                                              textAlign: 'center',
                                              opacity: isOut ? 0.45 : 1,
                                              textDecoration: isOut ? 'line-through' : 'none',
                                              boxShadow: isSelected ? '0 0 10px var(--gold-glow)' : 'none',
                                              transition: 'var(--transition)'
                                            }}
                                            title={isOut ? 'منتهي الكمية' : `المقاس: ${szObj.size}`}
                                          >
                                            {szObj.size}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Quantity Selector */}
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                  }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                      {lang === 'ar' ? 'الكمية المطلوبة:' : 'Quantity:'}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleItemQtyChange(idx, -1)}
                                        style={{ 
                                          width: '32px', 
                                          height: '32px', 
                                          borderRadius: 'var(--radius-sm)', 
                                          border: '1px solid var(--border-color)', 
                                          background: 'var(--bg-card)', 
                                          color: '#FFF', 
                                          fontWeight: 900, 
                                          fontSize: '1rem',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        -
                                      </button>
                                      <span style={{ fontWeight: 900, fontSize: '1rem', minWidth: '24px', textAlign: 'center', color: 'var(--gold-primary)' }}>
                                        {item.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleItemQtyChange(idx, 1)}
                                        style={{ 
                                          width: '32px', 
                                          height: '32px', 
                                          borderRadius: 'var(--radius-sm)', 
                                          border: '1px solid var(--border-color)', 
                                          background: 'var(--bg-card)', 
                                          color: '#FFF', 
                                          fontWeight: 900, 
                                          fontSize: '1rem',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Add Another Product to Order Section */}
                          <div style={{ marginTop: '1.25rem' }}>
                            {!isAddingProduct ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingProduct(true);
                                  if (catalogProducts.length > 0 && !selectedProductId) {
                                    const first = catalogProducts[0];
                                    setSelectedProductId(first.id);
                                    const firstInStock = (first.variants || []).find(v => Number(v.stock_quantity ?? 50) > 0);
                                    setSelectedSize(firstInStock?.size || 'L');
                                  }
                                }}
                                className="btn-secondary"
                                style={{
                                  width: '100%',
                                  padding: '0.8rem 1rem',
                                  fontSize: '0.92rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  border: '1.5px dashed var(--border-gold)',
                                  background: 'rgba(212, 175, 55, 0.08)',
                                  color: 'var(--gold-primary)',
                                  cursor: 'pointer',
                                  borderRadius: 'var(--radius-md)',
                                  transition: 'var(--transition)'
                                }}
                              >
                                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span>
                                <span>{lang === 'ar' ? 'إضافة منتج آخر إلى هذا الطلب' : 'Add Another Product to Order'}</span>
                              </button>
                            ) : (
                              <div style={{
                                background: 'rgba(212, 175, 55, 0.08)',
                                border: '1px solid var(--border-gold)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <h5 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--gold-primary)', margin: 0 }}>
                                    {lang === 'ar' ? 'اختر منتجاً لإضافته إلى الطلب:' : 'Select a product to add:'}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingProduct(false)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-secondary)',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                                  </button>
                                </div>

                                {/* Product Select Dropdown */}
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                    {lang === 'ar' ? 'المنتج المتاح في المتجر:' : 'Store Product:'}
                                  </label>
                                  <select
                                    value={selectedProductId}
                                    onChange={(e) => {
                                      const pId = e.target.value;
                                      setSelectedProductId(pId);
                                      const found = catalogProducts.find(p => String(p.id) === String(pId));
                                      const inStockVar = (found?.variants || []).find(v => Number(v.stock_quantity ?? 50) > 0);
                                      setSelectedSize(inStockVar?.size || 'L');
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '0.75rem 0.95rem',
                                      borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--border-color)',
                                      background: 'var(--bg-card)',
                                      color: 'var(--text-primary)',
                                      fontSize: '0.92rem',
                                      fontWeight: 800
                                    }}
                                  >
                                    {catalogProducts.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {lang === 'ar' ? p.nameAr : p.nameEn} ({p.price} {t('currency')})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Chosen Product Preview, Sizes & Quantity */}
                                {(() => {
                                  const prod = catalogProducts.find(p => String(p.id) === String(selectedProductId));
                                  if (!prod) return null;

                                  const variants = prod.variants || [];
                                  const sizesList = variants.length > 0
                                    ? variants.map(v => ({ size: v.size, stock: Number(v.stock_quantity ?? 50) }))
                                    : ['M', 'L', 'XL', 'XXL'].map(s => ({ size: s, stock: 50 }));

                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                      {/* Thumbnail + Price */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                        <img
                                          src={prod.image || '/assets/kemet-emblem-icon.png'}
                                          alt={prod.nameAr}
                                          style={{ width: '48px', height: '48px', objectFit: 'contain', background: '#000', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                        />
                                        <div>
                                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                            {lang === 'ar' ? prod.nameAr : prod.nameEn}
                                          </div>
                                          <div style={{ fontSize: '0.88rem', color: 'var(--gold-primary)', fontWeight: 900, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span>{prod.price} {t('currency')}</span>
                                            {extractOrderCouponCode(order) && (
                                              <span style={{ fontSize: '0.75rem', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--gold-primary)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                                                {lang === 'ar' ? 'سيتم تطبيق خصم الكوبون تلقائياً' : 'Coupon will apply automatically'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Size Selector */}
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                          {lang === 'ar' ? 'اختر المقاس:' : 'Choose Size:'}
                                        </label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                                          {sizesList.map(szObj => {
                                            const isSelected = selectedSize === szObj.size;
                                            const isOut = szObj.stock <= 0;
                                            return (
                                              <button
                                                key={szObj.size}
                                                type="button"
                                                disabled={isOut}
                                                onClick={() => !isOut && setSelectedSize(szObj.size)}
                                                style={{
                                                  padding: '0.35rem 0.8rem',
                                                  borderRadius: 'var(--radius-sm)',
                                                  border: isSelected ? '1.5px solid var(--gold-primary)' : '1px solid var(--border-color)',
                                                  background: isSelected ? 'var(--gold-gradient)' : (isOut ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)'),
                                                  color: isSelected ? '#000' : (isOut ? 'var(--text-muted)' : 'var(--text-primary)'),
                                                  fontWeight: 900,
                                                  fontSize: '0.85rem',
                                                  cursor: isOut ? 'not-allowed' : 'pointer',
                                                  textDecoration: isOut ? 'line-through' : 'none',
                                                  opacity: isOut ? 0.35 : 1
                                                }}
                                              >
                                                {szObj.size} {isOut ? `(${lang === 'ar' ? 'منتهي' : 'Out'})` : ''}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Quantity & Confirm Add */}
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                            {lang === 'ar' ? 'الكمية:' : 'Qty:'}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedQty(q => Math.max(1, q - 1))}
                                            style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#FFF', fontWeight: 900, cursor: 'pointer' }}
                                          >
                                            -
                                          </button>
                                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 900, color: 'var(--gold-primary)' }}>
                                            {selectedQty}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedQty(q => q + 1)}
                                            style={{ width: '30px', height: '30px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#FFF', fontWeight: 900, cursor: 'pointer' }}
                                          >
                                            +
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={handleAddProductToOrder}
                                          className="btn-primary"
                                          style={{ padding: '0.55rem 1.4rem', fontSize: '0.88rem', fontWeight: 800 }}
                                        >
                                          {lang === 'ar' ? 'تأكيد إضافة المنتج للطلب' : 'Confirm Add Item'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Order Calculation Summary */}
                        {(() => {
                          const currentCoupon = extractOrderCouponCode(order);
                          const totalPieces = editFormItems.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
                          const rawSubtotal = editFormItems.reduce((s, it) => {
                            const matched = catalogProducts.find(p => String(p.id) === String(it.id || it.product_id));
                            const catPrice = Number(matched?.price || it.catalog_price || 470);
                            return s + (catPrice * Number(it.quantity || 1));
                          }, 0);
                          const discountedSubtotal = editFormItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
                          const discountAmount = Math.max(0, rawSubtotal - discountedSubtotal);
                          const shipping = Number(order.shipping_fee ?? 50);
                          const grandTotal = discountedSubtotal + shipping;

                          return (
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.45)',
                              border: '1px solid var(--border-gold)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1.1rem',
                              marginBottom: '1.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.55rem'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                <span>{lang === 'ar' ? 'إجمالي عدد القطع في الطلب:' : 'Total Items:'}</span>
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                  {totalPieces} {lang === 'ar' ? 'قطع' : 'pcs'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                <span>{lang === 'ar' ? 'المجموع الفرعي للمنتجات:' : 'Subtotal:'}</span>
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                  {discountAmount > 0 ? (
                                    <>
                                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                                        {rawSubtotal} {t('currency')}
                                      </span>
                                      <span style={{ color: 'var(--gold-primary)' }}>
                                        {discountedSubtotal} {t('currency')}
                                      </span>
                                    </>
                                  ) : (
                                    `${rawSubtotal} ${t('currency')}`
                                  )}
                                </span>
                              </div>

                              {discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10B981', fontWeight: 800 }}>
                                  <span>
                                    {lang === 'ar' ? `قيمة الخصم المعتمد${currentCoupon ? ` (${currentCoupon})` : ''}:` : `Discount Applied${currentCoupon ? ` (${currentCoupon})` : ''}:`}
                                  </span>
                                  <span>-{discountAmount} {t('currency')}</span>
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                <span>{lang === 'ar' ? 'مصاريف الشحن والتوصيل:' : 'Shipping Fee:'}</span>
                                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                  {shipping} {t('currency')}
                                </span>
                              </div>

                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '1.05rem',
                                fontWeight: 900,
                                color: 'var(--gold-primary)',
                                borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                                paddingTop: '0.65rem',
                                marginTop: '0.25rem'
                              }}>
                                <span>{lang === 'ar' ? 'إجمالي الطلب الجديد عند الاستلام:' : 'New Total to Pay:'}</span>
                                <span>
                                  {grandTotal} {t('currency')}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Delivery details */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
                            {lang === 'ar' ? 'عنوان وبيانات التسليم:' : 'Delivery Address & Contact:'}
                          </label>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                                {t('fullName')}
                              </label>
                              <input 
                                type="text" 
                                value={editFormCustomer.fullName}
                                onChange={e => setEditFormCustomer({ ...editFormCustomer, fullName: e.target.value })}
                                required
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                                {t('phone')}
                              </label>
                              <input 
                                type="tel" 
                                value={editFormCustomer.phone}
                                onChange={e => setEditFormCustomer({ ...editFormCustomer, phone: e.target.value })}
                                required
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                                {t('governorate')}
                              </label>
                              <input 
                                type="text" 
                                value={editFormCustomer.governorate}
                                onChange={e => setEditFormCustomer({ ...editFormCustomer, governorate: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                              {t('address')}
                            </label>
                            <input 
                              type="text" 
                              value={editFormCustomer.address}
                              onChange={e => setEditFormCustomer({ ...editFormCustomer, address: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        {/* Save & Cancel */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                          <button 
                            type="button" 
                            onClick={() => setEditingOrderId(null)} 
                            disabled={isSavingEdit}
                            className="btn-secondary"
                            style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
                          >
                            {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
                          </button>

                          <button 
                            type="submit" 
                            disabled={isSavingEdit}
                            className="btn-primary"
                            style={{ padding: '0.6rem 1.6rem', fontSize: '0.88rem' }}
                          >
                            {isSavingEdit ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
}
