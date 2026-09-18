'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { updateOrderStatusAction, deleteOrderAction, sendDirectCustomerEmailAction } from '../../app/admin/actions';
import { AdminOrderEditModal } from './AdminOrderEditModal';
import { SupplierPreparationManifestModal } from './SupplierPreparationManifestModal';

const STATUS_OPTIONS = [
  'جديد',
  'جاري التجهيز',
  'تم الشحن',
  'مع المندوب',
  'تم التسليم',
  'ملغي'
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

function extractCouponCode(order) {
  if (!order) return null;
  if (order.coupon_code) return String(order.coupon_code).trim().toUpperCase();
  if (order.couponCode) return String(order.couponCode).trim().toUpperCase();
  if (order.delivery_notes) {
    const match = order.delivery_notes.match(/\[كود الخصم:\s*([^\]|]+)/i);
    if (match) return match[1].trim().toUpperCase();
  }
  return null;
}

function generateOrderConfirmationText(order) {
  if (!order) return '';

  const rawName = String(order.customer_name || order.customer?.fullName || order.customer?.name || 'عميل KEMET').trim();
  const nameParts = rawName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'عزيزنا';
  const isTripleName = nameParts.length >= 3;
  const displayName = isTripleName ? rawName : `${rawName} ( محتاجين الاسم ثلاثي )`;

  const orderId = order.id ? `#${order.id}` : '';
  const gov = String(order.governorate || order.customer?.governorate || 'القاهرة').trim();
  const addr = String(order.address || order.customer?.address || 'غير محدد').trim();

  const itemsList = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : Array.isArray(order.order_items) && order.order_items.length > 0
    ? order.order_items
    : [];

  const productsText = itemsList.length > 0
    ? itemsList.map(i => {
        const name = (i.product_name_ar || i.nameAr || i.name || i.title || 'منتج KEMET').trim();
        const qty = Number(i.quantity || 1);
        return qty > 1 ? `${name} (عدد ${qty})` : name;
      }).join(' + ')
    : 'طقم KEMET الرسمي';

  const sizesText = itemsList.length > 0
    ? Array.from(new Set(itemsList.map(i => String(i.size || 'M').trim()))).join(' + ')
    : 'M';

  // Pricing calculations
  const subtotal = Number(order.subtotal || 0);
  const shippingFee = Number(order.shipping_fee ?? order.shipping ?? 50);
  const totalAmount = Number(order.total_amount ?? order.total ?? 0);
  const originalTotal = subtotal > 0 ? (subtotal + shippingFee) : totalAmount;

  const hasDiscount = originalTotal > totalAmount && totalAmount > 0;
  let priceLine = '';
  if (hasDiscount) {
    priceLine = `الاجمالي شامل الشحن ${originalTotal} و بعد الخصم هيكون الاجمالي ${totalAmount}`;
  } else {
    priceLine = `الاجمالي شامل الشحن ${totalAmount || originalTotal}`;
  }

  const phone = String(order.customer_phone || order.customer?.phone || '').trim();

  return `مساء الخير استاذ ${firstName}
مع حضرتك عمار من Kemet Store
حضرتك طلبت اوردر من كيميت رقم الطلب${orderId}
الاسم - ${displayName}
المحافظة - ${gov}
العنوان - ${addr}
المنتج -${productsText}
المقاس - ${sizesText}
${priceLine}
رقم الهاتف - ${phone}`;
}

function getOrderConfirmationWhatsAppUrl(order) {
  const rawPhone = String(order.customer_phone || order.customer?.phone || '').replace(/\D/g, '');
  if (!rawPhone) return null;
  const phone = rawPhone.startsWith('20') ? rawPhone : (rawPhone.startsWith('0') ? '2' + rawPhone : '20' + rawPhone);
  const text = generateOrderConfirmationText(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function AdminOrdersTable({ initialOrders, catalogProducts = [] }) {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState(initialOrders || []);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Full Order Edit Modal State
  const [editingOrder, setEditingOrder] = useState(null);

  // Tracking Edit / Reset Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');

  // Direct Customer Email Modal State
  const [emailModalOrder, setEmailModalOrder] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Supplier Preparation Manifest Modal State
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = selectedOrderDetails || trackingModalOrder || emailModalOrder || editingOrder || isManifestOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedOrderDetails, trackingModalOrder, emailModalOrder, editingOrder, isManifestOpen]);

  const handleCopyConfirmation = (order) => {
    const text = generateOrderConfirmationText(order);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedOrderId(order.id);
        setTimeout(() => setCopiedOrderId(null), 2000);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedOrderId(order.id);
        setTimeout(() => setCopiedOrderId(null), 2000);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }
  };

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
        alert(`تم تحديث حالة الطلب #${orderId} بنجاح`);
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
        alert(`تم حفظ وتحديث كود التتبع للطلب #${orderId} بنجاح`);
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
        alert(`تم إلغاء وتصفير كود التتبع للطلب #${orderId} بنجاح`);
      } else {
        alert(`فشل إلغاء كود التتبع: ${res.error}`);
      }
    });
  };

  // Open Direct Email Modal with auto-resolved customer email
  const handleOpenEmailModal = (order) => {
    setEmailModalOrder(order);
    setEmailRecipient(order.customer_email || order.customer?.email || '');
    setEmailSubject(`تحديث بشأن طلبك رقم #${order.id} - KEMET`);
    setEmailMessage('');
  };

  // Send Direct Email to Single Customer
  const handleSendDirectEmail = async () => {
    if (!emailModalOrder) return;
    const targetEmail = (emailRecipient || emailModalOrder.customer_email || emailModalOrder.customer?.email || '').trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      alert('الرجاء إدخال بريد إلكتروني صحيح للعميل في خانة البريد المستهدف.');
      return;
    }

    if (!emailMessage.trim()) {
      alert('الرجاء كتابة نص الرسالة التي تريد إرسالها للعميل.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await sendDirectCustomerEmailAction({
        orderId: emailModalOrder.id,
        recipientEmail: targetEmail,
        subject: emailSubject,
        message: emailMessage
      });

      if (res.success) {
        alert(`تم إرسال الرسالة بنجاح إلى بريد العميل (${targetEmail})`);
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
          alert(`تم حذف الطلب #${orderId} بنجاح`);
        } else {
          alert(`فشل حذف الطلب: ${res.error}`);
        }
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cCode = extractCouponCode(order);
    return (
      (order.id && String(order.id).toLowerCase().includes(q)) ||
      (order.customer_name && String(order.customer_name).toLowerCase().includes(q)) ||
      (order.customer_phone && String(order.customer_phone).includes(q)) ||
      (order.governorate && String(order.governorate).toLowerCase().includes(q)) ||
      (cCode && cCode.toLowerCase().includes(q)) ||
      (order.delivery_notes && String(order.delivery_notes).toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Search & Filter Controls */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-bright)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)' }}>
        
        {/* Top Header Row with Manifest Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
              إدارة ومتابعة طلبات المتجر
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
              ابحث عن أي طلب برقم الهاتف أو الاسم أو المحافظة أو فلتر بحسب الحالة
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsManifestOpen(true)}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.4rem',
              fontSize: '0.92rem',
              fontWeight: 900,
              background: 'var(--gold-gradient)',
              color: '#000',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
              whiteSpace: 'nowrap'
            }}
          >
            شيت تحضير طلبيات المورد (تجميع المقاسات)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <input
            type="text"
            placeholder="ابحث برقم الطلب (KT-2027)، اسم العميل، الهاتف، أو كود الخصم..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.8rem 1.25rem', flexGrow: 1, maxWidth: '400px', fontSize: '0.95rem' }}
          />

          <div className="admin-filter-scroll" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

      {/* Structured Orders Table (Desktop View) */}
      <div className="admin-orders-desktop" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '1350px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>رقم الطلب</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>تاريخ ووقت الطلب</th>
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
                const itemsList = Array.isArray(order.items) && order.items.length > 0
                  ? order.items
                  : Array.isArray(order.order_items) && order.order_items.length > 0
                  ? order.order_items
                  : [];

                const productNames = itemsList.map(i => i.product_name_ar || i.nameAr || i.title || 'منتج KEMET').join(' + ');
                const productSizes = Array.from(new Set(itemsList.map(i => i.size || 'M'))).join(', ');
                const orderCoupon = extractCouponCode(order);

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* 1. رقم الطلب */}
                    <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--gold-primary)', fontSize: '0.9rem' }}>
                      <div>#{order.id}</div>
                      {orderCoupon && (
                        <div style={{ marginTop: '0.35rem' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '0.15rem 0.45rem', 
                            background: 'rgba(212,175,55,0.15)', 
                            border: '1px solid var(--border-gold)', 
                            color: 'var(--gold-primary)', 
                            borderRadius: '4px', 
                            fontSize: '0.72rem', 
                            fontWeight: 800,
                            letterSpacing: '0.5px'
                          }}>
                            كود: {orderCoupon}
                          </span>
                        </div>
                      )}
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
                          value={order.status || 'جديد'}
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
                              {order.tracking_number}
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
                              fontSize: '0.75rem',
                              padding: '0 2px',
                              textDecoration: 'underline'
                            }}
                            title="تعديل أو إلغاء كود تتبع الشحنة"
                          >
                            تعديل
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* 11. الإجراءات */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* واتساب التأكيد */}
                        {getOrderConfirmationWhatsAppUrl(order) && (
                          <a
                            href={getOrderConfirmationWhatsAppUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.76rem',
                              borderRadius: 'var(--radius-md)',
                              background: '#10B981',
                              color: '#000',
                              fontWeight: 800,
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="فتح محادثة واتساب العميل بالرسالة الجاهزة لتأكيد الطلب"
                          >
                            واتساب التأكيد
                          </a>
                        )}

                        {/* نسخ التأكيد */}
                        <button
                          type="button"
                          onClick={() => handleCopyConfirmation(order)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.76rem',
                            borderRadius: 'var(--radius-md)',
                            border: copiedOrderId === order.id ? '1px solid #10B981' : '1px solid var(--border-gold)',
                            background: copiedOrderId === order.id ? '#10B981' : 'rgba(212,175,55,0.14)',
                            color: copiedOrderId === order.id ? '#000' : 'var(--gold-primary)',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                          }}
                          title="نسخ رسالة تأكيد الطلب للعميل بنفس التنسيق المطلوب"
                        >
                          {copiedOrderId === order.id ? 'تم النسخ' : 'نسخ التأكيد'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingOrder(order)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.76rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-gold)',
                            background: 'rgba(212,175,55,0.18)',
                            color: 'var(--gold-primary)',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title="تعديل تفاصيل الطلب، إضافة أو حذف منتجات، وتعديل الأسعار"
                        >
                          تعديل الطلب
                        </button>

                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedOrderDetails(order)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.76rem' }}
                          title="عرض تفاصيل المنتجات"
                        >
                          تفاصيل
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
                          رسالة
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
                          حذف
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

      {/* Mobile Orders Cards View (< 900px) */}
      <div className="admin-orders-mobile">
        {filteredOrders.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            لا توجد طلبات مسجلة
          </div>
        ) : (
          filteredOrders.map(order => {
            const itemsList = Array.isArray(order.items) && order.items.length > 0
              ? order.items
              : Array.isArray(order.order_items) && order.order_items.length > 0
              ? order.order_items
              : [];

            const productNames = itemsList.map(i => i.product_name_ar || i.nameAr || i.title || 'منتج KEMET').join(' + ');
            const productSizes = Array.from(new Set(itemsList.map(i => i.size || 'M'))).join(', ');
            const orderCoupon = extractCouponCode(order);
            const waUrl = getOrderConfirmationWhatsAppUrl(order);

            return (
              <div 
                key={order.id} 
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* Header: Order # + Date + Status Select */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.65rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontWeight: 900, color: 'var(--gold-primary)', fontSize: '1.05rem' }}>
                        #{order.id}
                      </span>
                      {orderCoupon && (
                        <span style={{
                          padding: '0.15rem 0.45rem',
                          background: 'rgba(212,175,55,0.15)',
                          border: '1px solid var(--border-gold)',
                          color: 'var(--gold-primary)',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          كود: {orderCoupon}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {formatOrderDate(order.created_at)}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={order.status || 'جديد'}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    disabled={isPending}
                    style={{
                      padding: '0.35rem 0.6rem',
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
                </div>

                {/* Customer Information */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.86rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: '#FFF' }}>
                      {order.customer_name || order.customer?.fullName || 'عميل KEMET'}
                    </span>
                    <span style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.82rem' }}>
                      {order.governorate || order.customer?.governorate || 'القاهرة'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ direction: 'ltr', color: 'var(--text-secondary)', fontSize: '0.84rem', fontWeight: 600 }}>
                      {order.customer_phone || order.customer?.phone || 'غير مسجل'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '60%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.address || order.customer?.address || 'بدون عنوان تفصيلي'}
                    </span>
                  </div>
                </div>

                {/* Products & Financial Summary */}
                <div style={{ background: 'rgba(0,0,0,0.35)', padding: '0.65rem 0.8rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: '#FFF', marginBottom: '0.25rem' }}>
                    {productNames || 'طقم KEMET الرسمي'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>المقاس: <strong style={{ color: 'var(--gold-primary)' }}>{productSizes || 'M'}</strong></span>
                    <span>الإجمالي: <strong style={{ color: 'var(--gold-primary)', fontSize: '0.95rem' }}>{order.total_amount || order.total} ج.م</strong></span>
                  </div>
                </div>

                {/* Tracking Code Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    كود التتبع: {order.tracking_number ? <strong style={{ color: '#10B981', direction: 'ltr' }}>{order.tracking_number}</strong> : 'بدون كود تتبع'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenTrackingModal(order)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--gold-primary)',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      textDecoration: 'underline'
                    }}
                  >
                    تعديل التتبع
                  </button>
                </div>

                {/* Action Buttons Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem', marginTop: '0.2rem' }}>
                  {/* واتساب التأكيد */}
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.55rem',
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-md)',
                        background: '#10B981',
                        color: '#000',
                        fontWeight: 800,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      واتساب التأكيد
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      style={{
                        padding: '0.55rem',
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#666',
                        fontWeight: 800,
                        textAlign: 'center'
                      }}
                    >
                      واتساب
                    </button>
                  )}

                  {/* نسخ التأكيد */}
                  <button
                    type="button"
                    onClick={() => handleCopyConfirmation(order)}
                    style={{
                      padding: '0.55rem',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-md)',
                      border: copiedOrderId === order.id ? '1px solid #10B981' : '1px solid var(--border-gold)',
                      background: copiedOrderId === order.id ? '#10B981' : 'rgba(212,175,55,0.14)',
                      color: copiedOrderId === order.id ? '#000' : 'var(--gold-primary)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {copiedOrderId === order.id ? 'تم النسخ' : 'نسخ التأكيد'}
                  </button>

                  {/* تعديل الطلب */}
                  <button
                    type="button"
                    onClick={() => setEditingOrder(order)}
                    style={{
                      padding: '0.55rem',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-gold)',
                      background: 'rgba(212,175,55,0.18)',
                      color: 'var(--gold-primary)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    تعديل الطلب
                  </button>

                  {/* تفاصيل */}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSelectedOrderDetails(order)}
                    style={{
                      padding: '0.55rem',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                  >
                    تفاصيل
                  </button>

                  {/* رسالة */}
                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(order)}
                    style={{
                      padding: '0.55rem',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(212,175,55,0.4)',
                      background: 'rgba(212,175,55,0.12)',
                      color: 'var(--gold-primary)',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    رسالة
                  </button>

                  {/* حذف */}
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(order.id)}
                    style={{
                      padding: '0.55rem',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(244,63,94,0.4)',
                      background: 'rgba(244,63,94,0.12)',
                      color: '#F43F5E',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      {mounted && selectedOrderDetails && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrderDetails(null); }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '1rem',
            overflowY: 'auto'
          }}
        >
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-glow)',
            margin: 'auto'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>تفاصيل الطلب #{selectedOrderDetails.id}</span>
              <button type="button" onClick={() => setSelectedOrderDetails(null)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }}>✕</button>
            </h3>

            {extractCouponCode(selectedOrderDetails) && (
              <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(212,175,55,0.12)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--gold-primary)', fontWeight: 800, fontSize: '0.88rem' }}>كود الخصم المستخدم: </span>
                <strong style={{ color: '#FFF', fontSize: '1rem', letterSpacing: '1px' }}>{extractCouponCode(selectedOrderDetails)}</strong>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>تاريخ الطلب: <strong style={{ color: '#FFF' }}>{formatOrderDate(selectedOrderDetails.created_at)}</strong></div>
              <div>العميل: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.customer_name || selectedOrderDetails.customer?.fullName}</strong></div>
              <div>رقم الهاتف: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.customer_phone || selectedOrderDetails.customer?.phone}</strong></div>
              <div>البريد الإلكتروني: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.customer_email || selectedOrderDetails.customer?.email || 'غير مسجل'}</strong></div>
              <div>المحافظة والعنوان: <strong style={{ color: '#FFF' }}>{selectedOrderDetails.governorate} ({selectedOrderDetails.address})</strong></div>
              {selectedOrderDetails.delivery_notes && <div>ملاحظات التوصيل: <strong style={{ color: 'var(--gold-primary)' }}>{selectedOrderDetails.delivery_notes}</strong></div>}
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
        </div>,
        document.body
      )}

      {/* Edit / Cancel Tracking Modal */}
      {mounted && trackingModalOrder && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>تعديل أو إلغاء كود تتبع الشحنة (#{trackingModalOrder.id})</span>
              <button type="button" onClick={() => setTrackingModalOrder(null)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }}>✕</button>
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

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
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
                إلغاء وتصفير التتبع
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
                  {isPending ? 'جاري الحفظ...' : 'حفظ الكود'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Direct Customer Email Modal */}
      {mounted && emailModalOrder && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            maxWidth: '550px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>إرسال رسالة بريد خاصة للعميل</span>
              <button type="button" onClick={() => setEmailModalOrder(null)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem' }}>✕</button>
            </h3>

            <div style={{ marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div>العميل: <strong style={{ color: '#FFF' }}>{emailModalOrder.customer_name || emailModalOrder.customer?.fullName}</strong></div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--gold-primary)', fontWeight: 800, marginBottom: '0.35rem' }}>
                البريد الإلكتروني المستهدف للعميل:
              </label>
              <input
                type="email"
                value={emailRecipient}
                onChange={e => setEmailRecipient(e.target.value)}
                placeholder="بريد العميل (مثال: client@example.com)..."
                style={{ width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.9rem', direction: 'ltr', textAlign: 'left' }}
              />
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

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
                {isSendingEmail ? 'جاري الإرسال...' : 'إرسال الرسالة للعميل'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Full Order & Pricing Edit Modal */}
      <AdminOrderEditModal
        order={editingOrder}
        catalogProducts={catalogProducts}
        isOpen={Boolean(editingOrder)}
        onClose={() => setEditingOrder(null)}
        onOrderUpdated={(updatedOrder) => {
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { 
            ...o, 
            ...updatedOrder,
            items: updatedOrder.items || updatedOrder.order_items,
            order_items: updatedOrder.order_items || updatedOrder.items
          } : o));
        }}
      />

      {/* Supplier Preparation Manifest Modal */}
      <SupplierPreparationManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
        orders={orders}
        catalogProducts={catalogProducts}
      />
    </div>
  );
}
