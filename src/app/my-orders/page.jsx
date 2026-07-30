'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { products as storeProducts } from '../../data/products';
import { Footer } from '../../components/Footer';

export default function MyOrdersPage() {
  const { user, orders, cancelOrder, updateFullOrder, t } = useApp();

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
    // Deep clone order items for editing
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
      alert('يجب أن يحتوي الطلب على منتج واحد على الأقل، أو يمكنك إلغاء الطلب بالكامل.');
      return;
    }
    updateFullOrder(orderId, {
      customer: editFormCustomer,
      items: editFormItems
    });
    setEditingOrderId(null);
  };

  const handleCancelClick = (orderId) => {
    if (window.confirm('هل أنت تأكد من رغبتك في إلغاء هذا الطلب؟')) {
      cancelOrder(orderId);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <section className="section" style={{ flexGrow: 1 }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              <span className="brand-glow">🛍️ طلباتي ومتابعة الشحنة</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              سجل كافة طلباتك ومشترياتك السابقة من متجر KEMET وحالتها المباشرة
            </p>
          </div>

          {/* Authentication Check: Require login to view orders */}
          {!user ? (
            <div style={{
              background: 'var(--bg-card)',
              backdropFilter: 'blur(16px)',
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
                يرجى تسجيل الدخول أولاً لعرض طلباتك
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                صفحة طلباتي محمية ومخصصة للعملاء المسجلين. قم بتسجيل الدخول برقم تليفونك لاستعراض شحناتك وسجلات الشراء.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                  تسجيل الدخول 🔑
                </Link>
                <Link href="/category/all" className="btn-secondary" style={{ padding: '0.85rem 2.2rem' }}>
                  تصفح المنتجات 🛍️
                </Link>
              </div>
            </div>
          ) : orders.length === 0 ? (
            
            /* User is logged in but has no orders */
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
                أهلاً {user.fullName}! لم تقم بإجراء أي طلبات بعد
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                استعرض كولكشن KEMET الرسمي موديلات 2027 واختر أطقمك المفضلة!
              </p>
              <Link href="/category/all" className="btn-primary" style={{ padding: '0.85rem 2.2rem' }}>
                استكشف المنتجات والأطقم 🛒
              </Link>
            </div>

          ) : (
            
            /* Logged in User Orders List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Profile Bar */}
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
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>مرحباً: <strong style={{ color: 'var(--gold-primary)' }}>{user.fullName || user.phone}</strong></span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  إجمالي الطلبات: <strong style={{ color: 'var(--gold-primary)' }}>{orders.length}</strong>
                </div>
              </div>

              {orders.map(order => {
                // Determine if order is in Preparation Stage (active for edit/cancel) or Shipped Stage (WhatsApp only)
                const isPrepStage = !order.isShipped && (order.status.includes('تجهيز') || order.status.includes('إعداد') || order.status.includes('انتظار'));

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
                    {/* Order Header info */}
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
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>رقم الطلب المرسل:</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                          #{order.id}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>تاريخ الطلب:</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {order.date} ({order.time})
                        </div>
                      </div>

                      <div style={{ 
                        background: isPrepStage ? 'rgba(212, 175, 55, 0.15)' : 'rgba(37, 211, 102, 0.15)', 
                        border: isPrepStage ? '1px solid var(--border-gold)' : '1px solid rgba(37, 211, 102, 0.4)', 
                        padding: '0.45rem 1.1rem', 
                        borderRadius: 'var(--radius-full)',
                        color: isPrepStage ? 'var(--gold-primary)' : '#25D366',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {order.status}
                      </div>
                    </div>

                    {/* Order Items List */}
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
                            src={item.image} 
                            alt={item.nameAr} 
                            style={{ width: '64px', height: '64px', objectFit: 'contain', background: '#000', borderRadius: 'var(--radius-sm)', padding: '0.2rem' }} 
                          />
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                              {item.nameAr}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              المقاس: <span style={{ color: 'var(--gold-primary)', fontWeight: 800 }}>{item.size}</span> | الكمية: {item.quantity}
                            </div>
                          </div>
                          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--gold-primary)' }}>
                            {item.price * item.quantity} ج.م
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Customer Details & Actions */}
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
                        📍 عنوان التسليم: <strong style={{ color: 'var(--text-primary)' }}>{order.customer.fullName} - {order.customer.governorate} ({order.customer.address})</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          📱 رقم التواصل: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{order.customer.phone}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'end' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>الإجمالي الكلي شامل الشحن:</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                          {order.total} ج.م
                        </div>
                      </div>
                    </div>

                    {/* Order Management Actions (Edit/Cancel in Prep Stage OR WhatsApp if Shipped) */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.85rem', 
                      marginTop: '1.25rem', 
                      paddingTop: '1rem', 
                      borderTop: '1px stroke rgba(255,255,255,0.06)',
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
                            تعديل محتويات وبيانات الطلب ✏️
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
                            إلغاء الطلب ❌
                          </button>
                        </>
                      ) : (
                        <a
                          href={`https://wa.me/201114687759?text=${encodeURIComponent(`أهلاً KEMET، أريد إلغاء الطلب رقم #${order.id}`)}`}
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
                            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                            textDecoration: 'none'
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.103-1.077z" />
                          </svg>
                          <span>طلب إلغاء الأوردر عبر الواتساب (01114687759) 💬</span>
                        </a>
                      )}

                      <Link href="/track-order" className="btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.88rem' }}>
                        تتبع الشحنة 🚚
                      </Link>
                    </div>

                    {/* Full Comprehensive Inline Edit Form Modal */}
                    {editingOrderId === order.id && (
                      <form 
                        onSubmit={(e) => handleSaveEdit(e, order.id)} 
                        style={{ 
                          marginTop: '1.5rem', 
                          padding: '1.75rem 1.5rem', 
                          background: 'rgba(5, 7, 12, 0.95)', 
                          border: '1px solid var(--border-gold-bright)', 
                          borderRadius: 'var(--radius-md)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                        }}
                      >
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>✏️ لوحة تعديل الطلب رقم #{order.id}</span>
                        </h4>

                        {/* SECTION 1: EDIT ORDER ITEMS & SIZES */}
                        <div style={{ marginBottom: '2rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
                            📦 منتجات الطلب والمقاسات (يمكنك تغيير المقاسات والكميات مباشرة):
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
                                  <img src={item.image} alt={item.nameAr} style={{ width: '48px', height: '48px', objectFit: 'contain', background: '#000', borderRadius: '4px' }} />
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{item.nameAr}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 700 }}>سعر القطعة: {item.price} ج.م</div>
                                  </div>
                                </div>

                                {/* Size pills selector */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>المقاس:</span>
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

                          {/* Add another kit to order */}
                          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>➕ إضافة طقم آخر لهذا الطلب:</span>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {storeProducts.map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handleAddNewKitToOrder(p.id)}
                                  className="btn-secondary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                >
                                  + {p.nameAr.split(' (')[0]}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* SECTION 2: EDIT DELIVERY DETAILS */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
                            📍 بيانات عنوان وتسليم الطلب:
                          </label>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>الاسم بالكامل:</label>
                              <input 
                                type="text" 
                                value={editFormCustomer.fullName}
                                onChange={e => setEditFormCustomer({ ...editFormCustomer, fullName: e.target.value })}
                                required
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>رقم الهاتف:</label>
                              <input 
                                type="tel" 
                                value={editFormCustomer.phone}
                                onChange={e => setEditFormCustomer({ ...editFormCustomer, phone: e.target.value })}
                                required
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>المحافظة:</label>
                              <input 
                                type="text" 
                                value={editFormCustomer.governorate}
                                onChange={e => setEditFormCustomer({ ...editFormCustomer, governorate: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>العنوان التفصيلي:</label>
                            <input 
                              type="text" 
                              value={editFormCustomer.address}
                              onChange={e => setEditFormCustomer({ ...editFormCustomer, address: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        {/* Save & Cancel buttons */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                          <button 
                            type="button" 
                            onClick={() => setEditingOrderId(null)} 
                            className="btn-secondary"
                            style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
                          >
                            إلغاء التعديل
                          </button>

                          <button 
                            type="submit" 
                            className="btn-primary"
                            style={{ padding: '0.6rem 1.6rem', fontSize: '0.88rem' }}
                          >
                            حفظ كافة التعديلات 💾
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
