'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { products as storeProducts } from '../../data/products';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase/client';
import { updateOrderStatusAction } from '../admin/actions';

export default function MyOrdersPage() {
  const { lang, user, orders, cancelOrder, updateFullOrder, t } = useApp();
  const [dbOrders, setDbOrders] = useState([]);

  useEffect(() => {
    async function fetchDbOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setDbOrders(data);
        }
      } catch (err) {
        console.warn('Orders sync warning:', err);
      }
    }
    fetchDbOrders();
  }, []);

  const displayOrders = (dbOrders.length > 0 ? dbOrders : orders).map(o => {
    const matchedDb = dbOrders.find(dbo => dbo.id === o.id);
    if (matchedDb) {
      const rawItems = matchedDb.order_items || matchedDb.items || o.items || [];
      const formattedItems = rawItems.map(item => ({
        id: item.product_id || item.id,
        nameAr: item.product_name_ar || item.nameAr || item.title || 'منتج KEMET',
        nameEn: item.product_name_en || item.nameEn || item.title || 'KEMET Product',
        size: item.size || 'M',
        quantity: item.quantity || 1,
        price: item.unit_price || item.price || 0,
        image: item.image || '/assets/kemet-emblem-icon.png'
      }));

      return {
        id: matchedDb.id,
        date: matchedDb.created_at ? new Date(matchedDb.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : o.date,
        time: o.time || '',
        status: matchedDb.status || o.status,
        isShipped: matchedDb.is_shipped || false,
        customer: {
          fullName: matchedDb.customer_name || o.customer?.fullName,
          phone: matchedDb.customer_phone || o.customer?.phone,
          governorate: matchedDb.governorate || o.customer?.governorate,
          address: matchedDb.address || o.customer?.address
        },
        items: formattedItems.length > 0 ? formattedItems : (o.items || []),
        total: matchedDb.total_amount || o.total
      };
    }
    return o;
  });

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editFormCustomer, setEditFormCustomer] = useState({
    fullName: '',
    phone: '',
    governorate: '',
    address: ''
  });
  const [editFormItems, setEditFormItems] = useState([]);

  const handleStartEdit = (order) => {
    setEditingOrderId(order.id);
    setEditFormCustomer({
      fullName: order.customer.fullName || '',
      phone: order.customer.phone || '',
      governorate: order.customer.governorate || '',
      address: order.customer.address || ''
    });
    setEditFormItems(order.items.map(item => ({ ...item })));
  };

  const handleItemSizeChange = (index, newSize) => {
    setEditFormItems(prev => {
      const updated = [...prev];
      updated[index].size = newSize;
      return updated;
    });
  };

  const handleItemQtyChange = (index, delta) => {
    setEditFormItems(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleAddNewKitToOrder = (productId) => {
    const targetProduct = storeProducts.find(p => p.id === productId);
    if (!targetProduct) return;

    setEditFormItems(prev => {
      const existingIdx = prev.findIndex(item => item.id === targetProduct.id && item.size === 'L');
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [
        ...prev,
        {
          id: targetProduct.id,
          nameAr: targetProduct.nameAr,
          nameEn: targetProduct.nameEn,
          price: targetProduct.price,
          size: 'L',
          quantity: 1,
          image: targetProduct.image
        }
      ];
    });
  };

  const handleSaveEdit = (e, orderId) => {
    e.preventDefault();
    if (editFormItems.length === 0) {
      alert(lang === 'ar' ? 'يجب أن يحتوي الطلب على منتج واحد على الأقل.' : 'Order must contain at least one item.');
      return;
    }
    updateFullOrder(orderId, {
      customer: editFormCustomer,
      items: editFormItems
    });
    setEditingOrderId(null);
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
              <span className="brand-glow">🛍️ {t('navMyOrders')}</span>
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
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--border-gold)',
                color: 'var(--gold-primary)',
                fontSize: '1.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                🔒
              </div>
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
                  {t('loginTab')} 🔑
                </Link>
                <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem 2.2rem' }}>
                  {t('browseProductsBtn')} 🛍️
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
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛍️</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {lang === 'ar' ? `أهلاً ${user.fullName || user.email}! لم تقم بإجراء أي طلبات بعد` : `Welcome ${user.fullName || user.email}! You have no orders yet`}
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                {lang === 'ar' ? 'استعرض الكولكشن الرسمي واختر منتجاتك المفضلة!' : 'Explore our collection and pick your favorite activewear!'}
              </p>
              <Link href="/category/all" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                {lang === 'ar' ? 'استكشف المنتجات والأطقم 🛒' : 'Explore Products 🛒'}
              </Link>
            </div>

          ) : (
            
            /* Orders List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Profile Header Bar */}
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
                  <span style={{ fontSize: '1.2rem' }}>👑</span>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    {t('welcomeBackUser')} <strong style={{ color: 'var(--gold-primary)' }}>{user.fullName || user.email}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {lang === 'ar' ? 'إجمالي الطلبات:' : 'Total Orders:'} <strong style={{ color: 'var(--gold-primary)' }}>{displayOrders.length}</strong>
                </div>
              </div>

              {displayOrders.map(order => {
                const statusStr = String(order.status || '').toLowerCase();
                const isShippedOrDelivered = statusStr.includes('شحن') || statusStr.includes('shipped') || statusStr.includes('تسليم') || statusStr.includes('delivered');
                const isCancelled = statusStr.includes('ملغي') || statusStr.includes('cancelled');
                const isPrepStage = !isShippedOrDelivered && !isCancelled;

                // Format status for display
                let statusLabel = order.status;
                if (statusStr.includes('pending') || statusStr.includes('جديد')) {
                  statusLabel = lang === 'ar' ? 'جديد 📦' : 'New 📦';
                } else if (statusStr.includes('processing') || statusStr.includes('تجهيز')) {
                  statusLabel = lang === 'ar' ? 'جاري التجهيز ⚙️' : 'Processing ⚙️';
                } else if (statusStr.includes('shipped') || statusStr.includes('شحن')) {
                  statusLabel = lang === 'ar' ? 'تم الشحن 🚚' : 'Shipped 🚚';
                } else if (statusStr.includes('delivered') || statusStr.includes('تسليم')) {
                  statusLabel = lang === 'ar' ? 'تم التسليم ✅' : 'Delivered ✅';
                } else if (isCancelled) {
                  statusLabel = lang === 'ar' ? 'ملغي ❌' : 'Cancelled ❌';
                }

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
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                          #{order.id}
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
                      {order.items.map((item, idx) => (
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
                          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold-primary)' }}>
                            {item.price * item.quantity} {t('currency')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Customer Info & Total */}
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
                        📍 {lang === 'ar' ? 'عنوان التسليم:' : 'Delivery Address:'} <strong style={{ color: 'var(--text-primary)' }}>{order.customer.fullName} - {order.customer.governorate} ({order.customer.address})</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          📱 {lang === 'ar' ? 'رقم التواصل:' : 'Contact Phone:'} <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{order.customer.phone}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: lang === 'ar' ? 'end' : 'start' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {lang === 'ar' ? 'الإجمالي الكلي شامل الشحن:' : 'Total (incl. shipping):'}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                          {order.total} {t('currency')}
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
                            {lang === 'ar' ? 'تعديل الطلب ✏️' : 'Edit Order ✏️'}
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
                            {lang === 'ar' ? 'إلغاء الطلب ❌' : 'Cancel Order ❌'}
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
                          <span>{lang === 'ar' ? 'تواصل عبر الواتساب للطلب 💬' : 'Contact via WhatsApp 💬'}</span>
                        </a>
                      ) : null}

                      <Link href="/track-order" className="btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}>
                        {t('navTrackOrder')} 🚚
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
                          ✏️ {lang === 'ar' ? `تعديل الطلب #${order.id}` : `Edit Order #${order.id}`}
                        </h4>

                        {/* Items & Sizes */}
                        <div style={{ marginBottom: '2rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
                            📦 {lang === 'ar' ? 'محتويات الطلب والمقاسات:' : 'Order Items & Sizes:'}
                          </label>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {editFormItems.map((item, idx) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap', 
                                  gap: '1rem',
                                  background: 'rgba(212, 175, 55, 0.05)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '0.85rem 1rem'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                  <img src={item.image || '/assets/kemet-emblem-icon.png'} alt={item.nameAr} style={{ width: '48px', height: '48px', objectFit: 'contain', background: '#000', borderRadius: '4px' }} />
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                      {lang === 'ar' ? item.nameAr : item.nameEn}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
                                      {item.price} {t('currency')}
                                    </div>
                                  </div>
                                </div>

                                {/* Size selector */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                    {lang === 'ar' ? 'المقاس:' : 'Size:'}
                                  </span>
                                  {['M', 'L', 'XL', 'XXL'].map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => handleItemSizeChange(idx, s)}
                                      style={{
                                        padding: '0.25rem 0.65rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: item.size === s ? '1px solid var(--border-gold-bright)' : '1px solid var(--border-color)',
                                        background: item.size === s ? 'var(--gold-gradient)' : 'var(--bg-card)',
                                        color: item.size === s ? '#000' : 'var(--text-primary)',
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>

                                {/* Quantity selector */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleItemQtyChange(idx, -1)}
                                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#FFF', fontWeight: 900, cursor: 'pointer' }}
                                  >
                                    -
                                  </button>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleItemQtyChange(idx, 1)}
                                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: '#FFF', fontWeight: 900, cursor: 'pointer' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Delivery details */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
                            📍 {lang === 'ar' ? 'عنوان التسليم:' : 'Delivery Address:'}
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
                            className="btn-secondary"
                            style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
                          >
                            {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
                          </button>

                          <button 
                            type="submit" 
                            className="btn-primary"
                            style={{ padding: '0.6rem 1.6rem', fontSize: '0.88rem' }}
                          >
                            {lang === 'ar' ? 'حفظ التعديلات 💾' : 'Save Changes 💾'}
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
