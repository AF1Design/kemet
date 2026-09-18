'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

export function SupplierPreparationManifestModal({
  isOpen,
  onClose,
  orders = [],
  catalogProducts = []
}) {
  const [statusFilter, setStatusFilter] = useState('unshipped'); // 'unshipped' | 'new' | 'processing' | 'delivered' | 'all'
  const [dateFrom, setDateFrom] = useState(''); // 'YYYY-MM-DD'
  const [dateTo, setDateTo] = useState('');     // 'YYYY-MM-DD'
  const [supplierPhone, setSupplierPhone] = useState('01018237667');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [copySuccess, setCopySuccess] = useState(false);

  // Map products by ID or Name to get image
  const productImagesMap = useMemo(() => {
    const map = new Map();
    (catalogProducts || []).forEach(p => {
      if (p.id && p.mainImage) map.set(String(p.id).trim(), p.mainImage);
      if (p.nameAr && p.mainImage) map.set(String(p.nameAr).trim().toLowerCase(), p.mainImage);
      if (p.nameEn && p.mainImage) map.set(String(p.nameEn).trim().toLowerCase(), p.mainImage);
    });
    return map;
  }, [catalogProducts]);

  // Filter orders according to status selection and date range
  const relevantOrders = useMemo(() => {
    return (orders || []).filter(o => {
      // 1. Filter by Status
      const st = (o.status || '').trim();
      const lower = st.toLowerCase();
      let statusMatches = true;
      if (statusFilter === 'unshipped') {
        statusMatches = st === 'جديد' || st === 'جاري التجهيز' || lower === 'pending' || lower === 'processing';
      } else if (statusFilter === 'new') {
        statusMatches = st === 'جديد' || lower === 'pending';
      } else if (statusFilter === 'processing') {
        statusMatches = st === 'جاري التجهيز' || lower === 'processing';
      } else if (statusFilter === 'delivered') {
        statusMatches = st === 'تم التسليم' || lower === 'delivered' || st === 'تم التوصيل' || st === 'مكتمل';
      }
      if (!statusMatches) return false;

      // 2. Filter by Date Range (created_at)
      if (dateFrom || dateTo) {
        const orderDateStr = o.created_at || o.createdAt;
        if (!orderDateStr) return false;
        const orderDate = new Date(orderDateStr);
        if (isNaN(orderDate.getTime())) return false;

        if (dateFrom) {
          const from = new Date(dateFrom + 'T00:00:00');
          if (orderDate < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo + 'T23:59:59.999');
          if (orderDate > to) return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, dateFrom, dateTo]);

  // Aggregate items by model and size
  const { manifestList, totalPiecesCount, sizeTotals } = useMemo(() => {
    const map = {};
    const sTotals = {};
    let totalPieces = 0;

    relevantOrders.forEach(order => {
      const items = Array.isArray(order.items) && order.items.length > 0
        ? order.items
        : Array.isArray(order.order_items) && order.order_items.length > 0
        ? order.order_items
        : [];

      items.forEach(item => {
        const name = (item.nameAr || item.product_name_ar || item.name || item.title || 'منتج كيميت').trim();
        const rawSize = String(item.size || 'M').trim().toUpperCase();
        const size = rawSize.replace(/^SIZE\s*/i, '');
        const qty = Number(item.quantity || 1);
        const pId = item.id || item.product_id || '';

        if (!map[name]) {
          const image = productImagesMap.get(String(pId).trim()) || productImagesMap.get(name.toLowerCase()) || null;
          map[name] = {
            name: name,
            productId: pId,
            image: image,
            sizes: {},
            totalQty: 0
          };
        }

        map[name].sizes[size] = (map[name].sizes[size] || 0) + qty;
        map[name].totalQty += qty;
        totalPieces += qty;

        sTotals[size] = (sTotals[size] || 0) + qty;
      });
    });

    const list = Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
    return { manifestList: list, totalPiecesCount: totalPieces, sizeTotals: sTotals };
  }, [relevantOrders, productImagesMap]);

  // Summary label for selected date range
  const dateRangeSummary = useMemo(() => {
    if (dateFrom && dateTo) {
      if (dateFrom === dateTo) return `بتاريخ ${dateFrom}`;
      return `عن الفترة من ${dateFrom} إلى ${dateTo}`;
    }
    if (dateFrom) return `من تاريخ ${dateFrom} حتى الآن`;
    if (dateTo) return `حتى تاريخ ${dateTo}`;
    return '';
  }, [dateFrom, dateTo]);

  // Generate WhatsApp message text for supplier or inventory report
  const whatsappMessage = useMemo(() => {
    if (manifestList.length === 0) {
      return statusFilter === 'delivered'
        ? 'لا توجد طلبيات مسجلة بحالة تم التسليم حالياً.'
        : 'لا توجد طلبيات معلقة حالياً في شيت التجهيز.';
    }

    const lines = [];
    lines.push('السلام عليكم ورحمة الله،');
    lines.push('مع حضرتك متجر كيميت');
    const periodLabel = dateRangeSummary ? ` (${dateRangeSummary})` : '';
    if (statusFilter === 'delivered') {
      lines.push(`بيان جرد الطلبيات المسلَّمة للعملاء${periodLabel} (${manifestList.length} موديل - إجمالي ${totalPiecesCount} قطعة تم تسليمها):`);
    } else {
      lines.push(`بيان طلبيات البضاعة المطلوب تجهيزها وتوريدها${periodLabel} (${manifestList.length} موديل - إجمالي ${totalPiecesCount} قطعة):`);
    }
    lines.push('');

    manifestList.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.name}:`);
      const sizesEntries = Object.entries(item.sizes);
      sizesEntries.forEach(([sz, q]) => {
        lines.push(`   - مقاس ${sz}: عدد ${q} قطعة`);
      });
      lines.push(`   المجموع: ${item.totalQty} قطعة`);
      lines.push('');
    });

    lines.push('----------------------------------------');
    if (statusFilter === 'delivered') {
      lines.push(`إجمالي عدد التيشيرتات المسلَّمة: ${totalPiecesCount} قطعة.`);
      if (dateRangeSummary) lines.push(`الفترة المحددة: ${dateRangeSummary}.`);
      lines.push('كشف جرد رسمي لمتجر كيميت.');
    } else {
      lines.push(`إجمالي عدد التيشيرتات المطلوب توريدها: ${totalPiecesCount} قطعة.`);
      if (dateRangeSummary) lines.push(`الفترة المحددة: ${dateRangeSummary}.`);
      lines.push('برجاء تأكيد استلام البيان والبدء في التجهيز.');
    }

    return lines.join('\n');
  }, [manifestList, totalPiecesCount, statusFilter, dateRangeSummary]);

  const handleCopyText = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(whatsappMessage).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = whatsappMessage;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const cleanDigits = supplierPhone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = '2' + fullNumber;
    } else if (!fullNumber.startsWith('20')) {
      fullNumber = '20' + fullNumber;
    }
    const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleCheck = (modelName) => {
    setCheckedItems(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.88)',
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
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-gold-bright)',
          borderRadius: 'var(--radius-lg)',
          padding: 'clamp(1rem, 3vw, 2rem)',
          maxWidth: '1050px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-glow)',
          direction: 'rtl',
          margin: 'auto',
          position: 'relative'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
            position: 'sticky',
            top: '-2rem',
            background: 'var(--bg-card)',
            zIndex: 20,
            paddingTop: '0.5rem'
          }}
        >
          <div>
            <h3 style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.55rem)', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
              {statusFilter === 'delivered' ? 'شيت جرد الطلبيات المسلَّمة' : 'شيت تحضير وتوريد البضاعة من المصنع'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.35rem 0 0 0' }}>
              {statusFilter === 'delivered'
                ? 'كشف جرد تفصيلي بحسب الموديلات والمقاسات لكافة الطلبيات التي تم تسليمها للعملاء بالفعل'
                : 'كشف مجمع وفوري بجميع موديلات ومقاسات التيشيرتات المطلوبة في طلبيات المتجر الحالية'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: '#FFF',
              fontSize: '1.4rem',
              cursor: 'pointer',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              lineHeight: 1
            }}
            title="إغلاق الشاشة"
          >
            &times;
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem'
          }}
        >
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid var(--gold-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              {statusFilter === 'delivered' ? 'إجمالي القطع المسلَّمة (جرد)' : 'إجمالي القطع المطلوبة'}
            </span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
              {totalPiecesCount} قطعة
            </span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              عدد الموديلات المختلفة
            </span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFF' }}>
              {manifestList.length} موديل
            </span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              {statusFilter === 'delivered' ? 'عدد الطلبيات المسلَّمة' : 'عدد الطلبيات المشمولة'}
            </span>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFF' }}>
              {relevantOrders.length} أوردر
            </span>
          </div>

          <div
            style={{
              background: (dateFrom || dateTo) ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.04)',
              border: (dateFrom || dateTo) ? '1px solid var(--gold-primary)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              فترة الجرد الحالية
            </span>
            <span style={{ fontSize: (dateFrom || dateTo) ? '0.92rem' : '1.4rem', fontWeight: 900, color: (dateFrom || dateTo) ? 'var(--gold-primary)' : '#FFF', display: 'block', marginTop: '0.35rem' }}>
              {dateRangeSummary || 'كافة التواريخ'}
            </span>
          </div>
        </div>

        {/* Filter & Supplier Actions Bar */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                تصفية الطلبات:
              </span>
              {[
                { id: 'unshipped', label: 'غير المشحونة (جديد + جاري التجهيز)' },
                { id: 'new', label: 'الجديدة فقط' },
                { id: 'processing', label: 'جاري التجهيز فقط' },
                { id: 'delivered', label: 'تم التسليم (للجرد)' },
                { id: 'all', label: 'جميع الطلبات' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: statusFilter === f.id ? '1px solid var(--gold-primary)' : '1px solid var(--border-color)',
                    background: statusFilter === f.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: statusFilter === f.id ? 'var(--gold-primary)' : 'var(--text-primary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Supplier Phone Setting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                رقم المورد:
              </span>
              {isEditingPhone ? (
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.82rem', width: '120px', textAlign: 'center' }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className="btn-primary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    حفظ
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 900, color: 'var(--gold-primary)', direction: 'ltr', fontSize: '0.88rem' }}>
                    {supplierPhone}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                  >
                    تغيير
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Date Range Filter Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                تحديد فترة الجرد:
              </span>

              {/* Date From */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: dateFrom ? '1px solid var(--gold-primary)' : '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 800 }}>من:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  title="تاريخ بداية الفترة"
                />
              </div>

              {/* Date To */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: dateTo ? '1px solid var(--gold-primary)' : '1px solid var(--border-color)'
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', fontWeight: 800 }}>إلى:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  title="تاريخ نهاية الفترة"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setDateFrom(today);
                    setDateTo(today);
                  }}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  اليوم
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const today = now.toISOString().split('T')[0];
                    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setDateFrom(past);
                    setDateTo(today);
                  }}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  آخر 7 أيام
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const today = now.toISOString().split('T')[0];
                    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setDateFrom(past);
                    setDateTo(today);
                  }}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  آخر 30 يوم
                </button>

                {(dateFrom || dateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    style={{
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid #EF4444',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444'
                    }}
                  >
                    مسح التاريخ
                  </button>
                )}
              </div>
            </div>

            {/* Active Period Label */}
            {dateRangeSummary && (
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--gold-primary)',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid var(--gold-primary)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                الفترة المختارة: {dateRangeSummary}
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px dashed var(--border-color)', paddingTop: '0.85rem' }}>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={manifestList.length === 0}
              style={{
                flex: '1 1 200px',
                padding: '0.75rem 1.25rem',
                background: '#25D366',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.92rem',
                fontWeight: 900,
                cursor: manifestList.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              {statusFilter === 'delivered' ? 'مراسلة المورد / الإدارة ببيان الجرد عبر واتساب' : 'مراسلة المورد عبر واتساب مباشرة'}
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              disabled={manifestList.length === 0}
              className="btn-secondary"
              style={{
                flex: '1 1 180px',
                padding: '0.75rem 1.25rem',
                fontSize: '0.9rem',
                fontWeight: 800,
                border: '1px solid var(--gold-primary)',
                color: 'var(--gold-primary)',
                background: copySuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.1)',
                cursor: manifestList.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {copySuccess ? 'تم نسخ البيان بنجاح' : (statusFilter === 'delivered' ? 'نسخ بيان الجرد للواتساب' : 'نسخ نص البيان للواتساب')}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={manifestList.length === 0}
              className="btn-secondary"
              style={{
                padding: '0.75rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: manifestList.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {statusFilter === 'delivered' ? 'طباعة كشف الجرد' : 'طباعة الشيت'}
            </button>
          </div>
        </div>

        {/* Manifest Table */}
        {manifestList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)'
            }}
          >
            {statusFilter === 'delivered'
              ? 'لا توجد طلبيات مسجلة بحالة تم التسليم حالياً.'
              : 'لا توجد طلبيات مطابقة للفلتر المحدد حالياً. جميع الطلبات مشحونة أو لا توجد منتجات جديدة.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', minWidth: '780px' }}>
              <thead>
                <tr style={{ background: 'rgba(212, 175, 55, 0.1)', borderBottom: '1px solid var(--border-gold)' }}>
                  <th style={{ padding: '0.85rem 1rem', width: '50px', textAlign: 'center', color: 'var(--gold-primary)', fontWeight: 900 }}>
                    م
                  </th>
                  <th style={{ padding: '0.85rem 1rem', width: '70px', textAlign: 'center', color: 'var(--gold-primary)', fontWeight: 800 }}>
                    الصورة
                  </th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 900 }}>
                    اسم موديل التيشيرت
                  </th>
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 900 }}>
                    {statusFilter === 'delivered' ? 'توزيع المقاسات المسلَّمة' : 'توزيع المقاسات المطلوبة'}
                  </th>
                  <th style={{ padding: '0.85rem 1rem', width: '110px', textAlign: 'center', color: 'var(--gold-primary)', fontWeight: 900 }}>
                    المجموع
                  </th>
                  <th style={{ padding: '0.85rem 1rem', width: '120px', textAlign: 'center', color: 'var(--gold-primary)', fontWeight: 800 }}>
                    {statusFilter === 'delivered' ? 'مكتمل التسليم' : 'تم الاستلام'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {manifestList.map((item, idx) => {
                  const isChecked = Boolean(checkedItems[item.name]);

                  return (
                    <tr
                      key={item.name}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: isChecked ? 'rgba(16, 185, 129, 0.06)' : (idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'),
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '0.9rem', textAlign: 'center', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        {idx + 1}
                      </td>

                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: '46px',
                              height: '46px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            تيشيرت
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 800, color: '#FFF', fontSize: '0.95rem', lineHeight: '1.4' }}>
                          {item.name}
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {Object.entries(item.sizes).map(([sz, q]) => (
                            <span
                              key={sz}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '4px',
                                background: 'rgba(212, 175, 55, 0.14)',
                                border: '1px solid rgba(212, 175, 55, 0.35)',
                                color: '#FFF',
                                fontSize: '0.85rem',
                                fontWeight: 800
                              }}
                            >
                              <span style={{ color: 'var(--gold-primary)' }}>{sz}:</span>
                              <span style={{ fontWeight: 900, color: '#10B981' }}>{q}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.3rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--gold-gradient)',
                            color: '#000',
                            fontWeight: 900,
                            fontSize: '0.95rem'
                          }}
                        >
                          {item.totalQty} قطعة
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(item.name)}
                            style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              accentColor: '#10B981',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{ fontSize: '0.78rem', color: isChecked ? '#10B981' : 'var(--text-secondary)', fontWeight: 700 }}>
                            {isChecked ? (statusFilter === 'delivered' ? 'تم التدقيق' : 'تم الاستلام') : 'معلق'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Footer Row */}
              <tfoot>
                <tr style={{ background: 'rgba(0, 0, 0, 0.6)', borderTop: '2px solid var(--border-gold)' }}>
                  <td colSpan={3} style={{ padding: '1rem', fontWeight: 900, color: 'var(--gold-primary)', fontSize: '1rem' }}>
                    {statusFilter === 'delivered' ? 'الإجمالي العام لكافة الموديلات المسلَّمة:' : 'الإجمالي العام لجميع الموديلات المطلوبة:'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {Object.entries(sizeTotals).map(([sz, count]) => (
                        <span key={sz} style={{ fontSize: '0.82rem', color: '#FFF', fontWeight: 700 }}>
                          {sz}: <strong style={{ color: 'var(--gold-primary)' }}>{count}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, color: '#10B981', fontSize: '1.15rem' }}>
                    {totalPiecesCount} قطعة
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {Object.values(checkedItems).filter(Boolean).length} من {manifestList.length} {statusFilter === 'delivered' ? 'تم تدقيقه' : 'تم استلامه'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
