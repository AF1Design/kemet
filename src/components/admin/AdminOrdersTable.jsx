'use client';

import React, { useState, useTransition } from 'react';
import { updateOrderStatusAction, deleteOrderAction, sendDirectCustomerEmailAction } from '../../app/admin/actions';

const STATUS_OPTIONS = [
  'جديد 📦',
  'جاري التجهيز ⚙️',
  'تم الشحن 🚚',
  'مع المندوب 🛵',
  'تم التسليم ✅',
  'ملغي ❌'
];

function formatOrderDate(dateString) {
  if (!dateString) return 'غير محدد';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
}

export function AdminOrdersTable({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  
  // Tracking Edit / Reset Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');

  // Direct Customer Email Modal State
  const [emailModalOrder, setEmailModalOrder] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (orderId, newStatus) => {
    const currentOrder = orders.find(o => o.id === orderId);
    let trackingCode = currentOrder?.tracking_number || null;

    if (newStatus.includes('الشحن') || newStatus === 'shipped') {
      const input = window.prompt(
        `أدخل كود تتبع البريد المصري للطلب رقم #${orderId} (مثال: EB504461459EG):`,
        trackingCode || ''
      );
      if (input !== null) {
        trackingCode = input.trim();
      }
    }

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, newStatus, trackingCode);
      if (res.success) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: newStatus, tracking_number: trackingCode } : o)
        );
        alert(`تم تحديث حالة الطلب #${orderId} بنجاح ✅`);
      } else {
        alert(`فشل تحديث الحالة: ${res.error}`);
      }
    });
  };

  // Open Tracking Edit/Cancel Modal
  const handleOpenTrackingModal = (order) => {
    setTrackingModalOrder(order);
    setTrackingInput(order.tracking_number || '');
  };

  // Save / Update Tracking Number
  const handleSaveTrackingNumber = () => {
    if (!trackingModalOrder) return;
    const orderId = trackingModalOrder.id;
    const cleanTracking = trackingInput.trim();

    if (!window.confirm(`تأكيد: هل أنت متأكد من حفظ وتحديث كود التتبع للطلب رقم #${orderId} ليصبح (${cleanTracking || 'بدون تتبع'})؟`)) {
      return;
    }

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, trackingModalOrder.status, cleanTracking);
      if (res.success) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, tracking_number: cleanTracking || null } : o)
        );
        setTrackingModalOrder(null);
        alert(`تم حفظ وتحديث كود التتبع للطلب #${orderId} بنجاح 🚚`);
      } else {
        alert(`فشل تحديث كود التتبع: ${res.error}`);
      }
    });
  };

  // Cancel / Reset Tracking Number
  const handleCancelTrackingNumber = () => {
    if (!trackingModalOrder) return;
    const orderId = trackingModalOrder.id;

    if (!window.confirm(`تأكيد إلغاء التتبع: هل أنت متأكد من إلغاء وتصفير كود التتبع للطلب رقم #${orderId}؟`)) {
      return;
    }

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, trackingModalOrder.status, "");
      if (res.success) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, tracking_number: null } : o)
        );
        setTrackingModalOrder(null);
        alert(`تم إلغاء وتصفير كود التتبع للطلب #${orderId} بنجاح 🗑️`);
      } else {
        alert(`فشل إلغاء كود التتبع: ${res.error}`);
      }
    });
  };

  // Open Direct Email Modal
  const handleOpenEmailModal = (order) => {
    setEmailModalOrder(order);
    setEmailSubject(`تحديث بشأن طلبك رقم #${order.id} - KEMET`);
    setEmailMessage('');
  };

  // Send Direct Email to Single Customer
  const handleSendDirectEmail = async () => {
    if (!emailModalOrder) return;
    const recipientEmail = emailModalOrder.customer_email || emailModalOrder.customer?.email;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('⚠️ هذا العميل لم يقم بإدخال بريد إلكتروني أثناء الطلب.');
      return;
    }

    if (!emailMessage.trim()) {
      alert('⚠️ الرجاء كتابة نص الرسالة التي تريد إرسالها للعميل.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendDirectCustomerEmailAction({
        orderId: emailModalOrder.id,
        recipientEmail: recipientEmail,
        subject: emailSubject,
        message: emailMessage
      });

      if (res.success) {
        alert(`تم إرسال الرسالة بنجاح إلى بريد العميل (${recipientEmail}) 📧`);
        setEmailModalOrder(null);
      } else {
        alert(`فشل إرسال البريد: ${res.error}`);
      }
    } catch (err) {
      alert(`حدث خطأ أثناء الإرسال: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف الطلب رقم #${orderId} نهائياً من قاعدة البيانات؟`)) {
      startTransition(async () => {
        const res = await deleteOrderAction(orderId);
        if (res.success) {
          setOrders(prev => prev.filter(o => o.id !== orderId));
          alert(`تم حذف الطلب #${orderId} بنجاح 🗑️`);
        } else {
          alert(`فشل حذف الطلب: ${res.error}`);
        }
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'ALL') {
      const statusStr = String(order.status || '').toLowerCase();
      const filterStr = statusFilter.toLowerCase();
      if (!statusStr.includes(filterStr)) {
        return false;
      }
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (order.id && String(order.id).toLowerCase().includes(q)) ||
      (order.customer_name && String(order.customer_name).toLowerCase().includes(q)) ||
      (order.customer_phone && String(order.customer_phone).includes(q)) ||
      (order.governorate && String(order.governorate).toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Search & Filter Controls */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-bright)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <input
            type="text"
            placeholder="🔍 ابحث برقم الطلب (KM-2027)، اسم العميل، أو الهاتف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.8rem 1.25rem', flexGrow: 1, maxWidth: '400px', fontSize: '0.95rem' }}
          />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                border: statusFilter === 'ALL' ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                background: statusFilter === 'ALL' ? 'rgba(212,175,55,0.15)' : 'var(--bg-card)',
                color: statusFilter === 'ALL' ? 'var(--gold-primary)' : 'var(--text-primary)'
              }}
            >
              الكل ({orders.length})
            </button>

            {['جديد', 'جاري التجهيز', 'تم الشحن', 'مع المندوب', 'تم التسليم', 'ملغي'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: statusFilter === st ? '2px solid var(--gold-primary)' : '1px solid var(--border-color)',
                  background: statusFilter === st ? 'rgba(212,175,55,0.15)' : 'var(--bg-card)',
                  color: statusFilter === st ? 'var(--gold-primary)' : 'var(--text-primary)'
                }}
              >
                {st}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Structured Orders Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '1100px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>رقم الطلب</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>تاريخ ووقت الطلب 📅</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>الاسم</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>رقم الهاتف</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>العنوان</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>المحافظة</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>اسم المنتج</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>المقاس</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>الإجمالي</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>حالة الطلب والتتبع</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)', textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  لا توجد طلبات مسجلة
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const itemsList = Array.isArray(order.order_items) && order.order_items.length > 0
                  ? order.order_items
                  : Array.isArray(order.items) ? order.items : [];

                const productNames = itemsList.map(i => i.product_name_ar || i.nameAr || i.title || 'منتج KEMET').join(' + ');
                const productSizes = Array.from(new Set(itemsList.map(i => i.size || 'M'))).join(', ');

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* 1. رقم الطلب */}
                    <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
                      #{order.id}
                    </td>
                    
                    {/* 2. تاريخ ووقت الطلب */}
                    <td style={{ padding: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {formatOrderDate(order.created_at)}
                    </td>

                    {/* 3. الاسم */}
                    <td style={{ padding: '1rem', fontSize: '0.88rem', fontWeight: 800 }}>
                      {order.customer_name || order.customer?.fullName || 'عميل KEMET'}
                    </td>

                    {/* 4. رقم الهاتف */}
                    <td style={{ padding: '1rem', fontSize: '0.85rem', direction: 'ltr', textAlign: 'right', fontWeight: 700 }}>
                      {order.customer_phone || order.customer?.phone || 'غير مسجل'}
                    </td>

                    {/* 5. العنوان */}
                    <td style={{ padding: '1rem', fontSize: '0.82rem', maxWidth: '160px', color: 'var(--text-secondary)' }}>
                      {order.address || order.customer?.address || 'بدون عنوان تفصيلي'}
                    </td>

                    {/* 6. المحافظة */}
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                      {order.governorate || order.customer?.governorate || 'القاهرة'}
                    </td>

                    {/* 7. اسم المنتج */}
                    <td style={{ padding: '1rem', fontSize: '0.82rem', maxWidth: '180px', fontWeight: 700 }}>
                      {productNames || 'طقم KEMET الرسمي'}
                    </td>

                    {/* 8. المقاس */}
                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                      {productSizes || 'M'}
                    </td>

                    {/* 9. الإجمالي */}
                    <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--gold-primary)', fontSize: '1rem' }}>
                      {order.total_amount || order.total} ج.م
                    </td>

                    {/* 10. حالة الطلب والتتبع */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <select
                          value={order.status || 'جديد 📦'}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          disabled={isPending}
                          style={{
                            padding: '0.4rem 0.65rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(212,175,55,0.15)',
                            border: '1px solid var(--border-gold)',
                            color: 'var(--gold-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status} style={{ background: '#0B0F19', color: '#FFF' }}>
                              {status}
                            </option>
                          ))}
                        </select>

                        {/* Tracking Display & Control Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                          {order.tracking_number ? (
                            <span style={{ color: '#10B981', fontWeight: 700, direction: 'ltr' }}>
                              🚚 {order.tracking_number}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>بدون كود تتبع</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenTrackingModal(order)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--gold-primary)',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              padding: '0 2px'
                            }}
                            title="تعديل أو إلغاء كود تتبع الشحنة"
                          >
                            ✏️
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* 11. الإجراءات (حذف + معاينة + رسالة بريد) */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedOrderDetails(order)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.76rem' }}
                          title="عرض تفاصيل المنتجات"
                        >
                          👁️ تفاصيل
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEmailModal(order)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.76rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(212,175,55,0.4)',
                            background: 'rgba(212,175,55,0.12)',
                            color: 'var(--gold-primary)',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title="إرسال رسالة خاصة لبريد العميل"
                        >
                          ✉️ رسالة
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.76rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(244,63,94,0.4)',
                            background: 'rgba(244,63,94,0.12)',
                            color: '#F43F5E',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title="حذف الأوردر نهائياً من قاعدة البيانات"
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedOrderDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📦 تفاصيل الطلب #{selectedOrderDetails.id}</span>
              <button type="button" onClick={() => setSelectedOrderDetails(null)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </h3>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>📅 تاريخ الطلب: <strong style={{ color: '#FFF' }}>{formatOrderDate(selectedOrderDetails.created_at)}</strong></div>
              <div>👤 العميل: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.customer_name || selectedOrderDetails.customer?.fullName}</strong></div>
              <div>📱 رقم الهاتف: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.customer_phone || selectedOrderDetails.customer?.phone}</strong></div>
              <div>📧 البريد الإلكتروني: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.customer_email || selectedOrderDetails.customer?.email || 'غير مسجل'}</strong></div>
              <div>📍 المحافظة والعنوان: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.governorate} ({selectedOrderDetails.address})</strong></div>
              {selectedOrderDetails.delivery_notes && <div>📝 ملاحظات التوصيل: <strong style={{ color: 'var(--gold-primary)' }}>{selectedOrderDetails.delivery_notes}</strong></div>}
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.75rem' }}>المنتجات المطلوبة:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {(selectedOrderDetails.order_items || selectedOrderDetails.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{item.product_name_ar || item.nameAr || item.title || 'منتج KEMET'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>المقاس: {item.size} | الكمية: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 900, color: 'var(--gold-primary)' }}>
                    {(item.unit_price || item.price || 0) * (item.quantity || 1)} ج.م
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'end' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedOrderDetails(null)} style={{ padding: '0.5rem 1.5rem' }}>
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Cancel Tracking Modal */}
      {trackingModalOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🚚 تعديل أو إلغاء كود تتبع الشحنة (#{trackingModalOrder.id})</span>
              <button type="button" onClick={() => setTrackingModalOrder(null)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              يمكنك كتابة كود التتبع الجديد، أو الضغط على زر إلغاء لتصفير كود التتبع وإزالته في حالة وجود خطأ.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gold-primary)', fontWeight: 800, marginBottom: '0.5rem' }}>
                كود تتبع البريد المصري / الشحنة:
              </label>
              <input
                type="text"
                placeholder="مثال: EB504461459EG"
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', direction: 'ltr', textAlign: 'left' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleCancelTrackingNumber}
                disabled={isPending}
                style={{
                  padding: '0.65rem 1.2rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(244,63,94,0.15)',
                  border: '1px solid rgba(244,63,94,0.4)',
                  color: '#F43F5E',
                  cursor: 'pointer'
                }}
              >
                ❌ إلغاء وتصفير التتبع
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setTrackingModalOrder(null)} style={{ padding: '0.65rem 1rem' }}>
                  إلغاء
                </button>
                <button
                  type="button"
                  className="btn-gold"
                  onClick={handleSaveTrackingNumber}
                  disabled={isPending}
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  {isPending ? 'جاري الحفظ...' : '💾 حفظ الكود'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Customer Email Modal */}
      {emailModalOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '550px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>✉️ إرسال رسالة بريد خاصة للعميل</span>
              <button type="button" onClick={() => setEmailModalOrder(null)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </h3>

            <div style={{ marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div>👤 العميل: <strong style={{ color: '#FFF' }}>{emailModalOrder.customer_name || emailModalOrder.customer?.fullName}</strong></div>
              <div>📧 البريد المستهدف: <strong style={{ color: 'var(--gold-primary)' }}>{emailModalOrder.customer_email || emailModalOrder.customer?.email || 'غير مسجل'}</strong></div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-primary)', fontWeight: 800, marginBottom: '0.35rem' }}>
                عنوان الرسالة (Subject):
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                placeholder="عنوان الرسالة..."
                style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-primary)', fontWeight: 800, marginBottom: '0.35rem' }}>
                نص الرسالة الخاصة:
              </label>
              <textarea
                rows={5}
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                placeholder="اكتب هنا الرسالة الخاصة التي تريد إرسالها لبريد هذا العميل تحديداً..."
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setEmailModalOrder(null)} style={{ padding: '0.65rem 1.25rem' }}>
                إلغاء
              </button>
              <button
                type="button"
                className="btn-gold"
                onClick={handleSendDirectEmail}
                disabled={isSendingEmail}
                style={{ padding: '0.65rem 1.5rem' }}
              >
                {isSendingEmail ? 'جاري الإرسال...' : '📧 إرسال الرسالة للعميل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
