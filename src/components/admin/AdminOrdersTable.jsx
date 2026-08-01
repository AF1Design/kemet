'use client';

import React, { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '../../app/admin/actions';

const STATUS_OPTIONS = [
  'جديد 📦',
  'جاري التجهيز ⚙️',
  'تم الشحن 🚚',
  'تم التسليم ✅',
  'ملغي ❌'
];

export function AdminOrdersTable({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (orderId, newStatus) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
        );
        alert(`تم تحديث حالة الطلب #${orderId} إلى: "${newStatus}" بنجاح ✅`);
      } else {
        alert(`فشل تحديث الحالة: ${res.error}`);
      }
    });
  };

  const filteredOrders = orders.filter(order => {
    // 1. Status Filter
    if (statusFilter !== 'ALL') {
      if (!order.status || !order.status.includes(statusFilter.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim())) {
        if (!order.status?.toLowerCase().includes(statusFilter.toLowerCase())) {
          return false;
        }
      }
    }

    // 2. Search Query Filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (order.id && order.id.toLowerCase().includes(q)) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
      (order.customer_phone && order.customer_phone.includes(q)) ||
      (order.governorate && order.governorate.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Control Bar: Search & Status Filters */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold-bright)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-glow)' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Box */}
          <input
            type="text"
            placeholder="🔍 ابحث برقم الطلب (KM-2027)، اسم العميل، أو رقم الهاتف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.8rem 1.25rem', flexGrow: 1, maxWidth: '400px', fontSize: '0.95rem' }}
          />

          {/* Status Filter Buttons */}
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

            {['جديد', 'جاري التجهيز', 'تم الشحن', 'تم التسليم', 'ملغي'].map(st => (
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

      {/* Orders Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>رقم الطلب</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>العميل والهاتف</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>العنوان والمحافظة</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>الإجمالي الكلي</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>تاريخ الطلب</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>حالة الطلب (تعديل مباشر)</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)', textAlign: 'center' }}>المنتجات والمعاينة</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  لا توجد طلبات مطابقة لعملية الفلترة أو البحث
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                    #{order.id}
                  </td>
                  
                  <td style={{ padding: '1rem', fontSize: '0.88rem' }}>
                    <div style={{ fontWeight: 800 }}>{order.customer_name || order.customer?.fullName || 'عميل KEMET'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', direction: 'ltr', textAlign: 'right' }}>
                      📞 {order.customer_phone || order.customer?.phone || 'غير مسجل'}
                    </div>
                  </td>

                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--gold-primary)' }}>{order.governorate || order.customer?.governorate || 'القاهرة'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{order.address || order.customer?.address || 'بدون عنوان تفصيلي'}</div>
                  </td>

                  <td style={{ padding: '1rem', fontWeight: 900 }}>
                    <div style={{ color: 'var(--gold-primary)', fontSize: '1.05rem' }}>{order.total_amount || order.total} ج.م</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>شامل الشحن ({order.shipping_fee || order.shipping || 50} ج.م)</div>
                  </td>

                  <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('ar-EG') : (order.date || 'اليوم')}
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <select
                      value={order.status || 'جديد 📦'}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      disabled={isPending}
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.82rem',
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
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedOrderDetails(order)}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      👁️ تفاصيل المنتجات ({Array.isArray(order.items) ? order.items.length : 1})
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Items Modal Preview */}
      {selectedOrderDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0B0F19',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '650px',
            padding: '2rem',
            boxShadow: 'var(--shadow-glow)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                تفاصيل المنتجات للطلب #{selectedOrderDetails.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                style={{ fontSize: '1.8rem', color: 'var(--gold-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {Array.isArray(selectedOrderDetails.items) && selectedOrderDetails.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#111622', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <img src={item.image || item.main_image || '/assets/kemet-hero-banner.jpg'} alt={item.nameAr || 'منتج'} style={{ width: '60px', height: '60px', objectFit: 'contain', background: '#000', borderRadius: '4px' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFF' }}>{item.nameAr || item.nameEn || 'منتج كيميت'}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
                      المقاس: <span style={{ background: 'rgba(212,175,55,0.2)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{item.size || 'M'}</span> | الكمية: {item.quantity || 1}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: 'var(--gold-primary)', fontSize: '1.05rem' }}>
                    {(Number(item.price) || 280) * (item.quantity || 1)} ج.م
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button type="button" className="btn-primary" onClick={() => setSelectedOrderDetails(null)} style={{ padding: '0.65rem 2rem' }}>
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
