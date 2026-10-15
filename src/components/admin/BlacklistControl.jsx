'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { 
  getBlacklistAction, 
  addCustomerToBlacklistAction, 
  removeCustomerFromBlacklistAction 
} from '../../app/admin/actions';
import { normalizePhone } from '../../lib/blacklist';

const PRESET_REASONS = [
  'رفض استلام الأوردر بعد الشحن بدون سبب (شحن على الفاضي)',
  'عدم الرد على المندوب وإلغاء الطلب بعد خروجه للتوصيل',
  'رفض الاستلام والتهرب من دفع مصاريف الشحن',
  'طلبات متكررة وهمية وعدم الجدية',
  'custom'
];

export function BlacklistControl() {
  const [blacklist, setBlacklist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Manual Add Form State
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualOrderId, setManualOrderId] = useState('');
  const [manualSelectedReason, setManualSelectedReason] = useState(PRESET_REASONS[0]);
  const [manualCustomReason, setManualCustomReason] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Blacklist on Mount
  const loadBlacklist = async () => {
    setIsLoading(true);
    try {
      const res = await getBlacklistAction();
      if (res.success && Array.isArray(res.blacklist)) {
        setBlacklist(res.blacklist);
      }
    } catch (err) {
      console.warn('Blacklist load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlacklist();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return blacklist;
    const q = searchQuery.toLowerCase().trim();
    return blacklist.filter(item => 
      (item.phone && item.phone.includes(q)) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.orderId && item.orderId.toLowerCase().includes(q)) ||
      (item.reason && item.reason.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  }, [blacklist, searchQuery]);

  const handleOpenModal = () => {
    setManualPhone('');
    setManualName('');
    setManualOrderId('');
    setManualSelectedReason(PRESET_REASONS[0]);
    setManualCustomReason('');
    setManualNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(manualPhone);
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      setFormError('يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقم يبدأ بـ 01.');
      return;
    }

    const finalReason = manualSelectedReason === 'custom' 
      ? (manualCustomReason.trim() || 'رفض الاستلام بعد الشحن بدون سبب')
      : manualSelectedReason;

    startTransition(async () => {
      try {
        const res = await addCustomerToBlacklistAction({
          phone: cleanPhone,
          name: manualName.trim(),
          orderId: manualOrderId.trim(),
          reason: finalReason,
          notes: manualNotes.trim(),
          addedBy: 'لوحة التحكم (يدوي)'
        });

        if (res.success) {
          setStatusMsg({ type: 'success', text: `تمت إضافة الرقم (${cleanPhone}) إلى قائمة الحظر بنجاح.` });
          setTimeout(() => setStatusMsg(null), 4000);
          handleCloseModal();
          await loadBlacklist();
        } else {
          setFormError(res.error || 'فشلت إضافة العميل لقائمة الحظر.');
        }
      } catch (err) {
        setFormError(err.message || 'حدث خطأ غير متوقع.');
      }
    });
  };

  const handleRemove = (phone, name) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء حظر العميل (${name || phone}) والسماح له باستخدام كوبونات الخصم؟`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await removeCustomerFromBlacklistAction(phone);
        if (res.success) {
          setStatusMsg({ type: 'success', text: `تم إلغاء الحظر عن الرقم (${phone}) بنجاح.` });
          setTimeout(() => setStatusMsg(null), 4000);
          setBlacklist(prev => prev.filter(item => normalizePhone(item.phone) !== normalizePhone(phone)));
        } else {
          alert(res.error || 'فشل إلغاء الحظر.');
        }
      } catch (err) {
        alert(err.message || 'حدث خطأ أثناء إلغاء الحظر.');
      }
    });
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
      
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.3rem', color: '#EF4444', fontWeight: 900 }}>[قائمة الحظر]</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              قائمة الحظر (Blacklist) - منع استخدام كوبونات الخصم
            </h3>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            العملاء المضافين لهذه القائمة يُمنعون تماماً وتلقائياً من استخدام أي كوبونات أو أكواد خصم عند إتمام الطلب (بسبب رفض الاستلام بدون سبب أو شحن الطلب على الفاضي).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="btn-primary"
          style={{
            padding: '0.65rem 1.4rem',
            fontSize: '0.86rem',
            background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
            border: 'none',
            color: '#FFF',
            fontWeight: 800,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
          }}
        >
          + إضافة عميل للقائمة يدويًا
        </button>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${statusMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: statusMsg.type === 'success' ? '#10B981' : '#EF4444',
          fontSize: '0.88rem',
          fontWeight: 800,
          marginBottom: '1.25rem'
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-main)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>إجمالي العملاء في القائمة السوداء</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#EF4444', marginTop: '0.35rem' }}>
            {blacklist.length} عميل
          </div>
        </div>

        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>الحالة المفروضة</span>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gold-primary)', marginTop: '0.5rem' }}>
            حظر فوري لكافة كوبونات الخصم
          </div>
        </div>

        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>نطاق الحظر</span>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981', marginTop: '0.5rem' }}>
            صفحة الدفع + النظام الخلفي (Backend)
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث برقم الهاتف، الاسم، رقم الأوردر، أو سبب الحظر..."
          className="admin-input"
          style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.88rem' }}
        />
      </div>

      {/* Blacklist Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          جاري تحميل قائمة الحظر...
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          background: 'var(--bg-main)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)'
        }}>
          {searchQuery ? 'لا توجد نتائج مطابقة لبحثك في قائمة الحظر.' : 'القائمة نظيفة حالياً ولا يوجد أي عميل محظور من كوبونات الخصم.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>العميل</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>رقم الهاتف</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>سبب الحظر</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>الأوردر المرتبط</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 800 }}>تاريخ الإضافة</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontWeight: 800, textAlign: 'center' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.phone} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease' }}>
                  
                  {/* Name */}
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    <div>{item.name || 'غير محدد'}</div>
                    {item.governorate && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {item.governorate}
                      </span>
                    )}
                  </td>

                  {/* Phone */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#EF4444' }}>
                        {item.phone}
                      </span>
                      <a
                        href={`https://wa.me/2${item.phone.startsWith('0') ? item.phone.slice(1) : item.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          background: '#10B981',
                          color: '#000',
                          fontWeight: 800,
                          textDecoration: 'none'
                        }}
                        title="فتح واتساب العميل"
                      >
                        واتساب
                      </a>
                    </div>
                  </td>

                  {/* Reason */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    <div style={{ maxWidth: '280px', lineHeight: 1.4 }}>
                      <span style={{ color: '#F43F5E', fontWeight: 700 }}>
                        {item.reason}
                      </span>
                      {item.notes && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          ملاحظة: {item.notes}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Related Order */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {item.orderId ? (
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.76rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid var(--border-gold)',
                        color: 'var(--gold-primary)',
                        fontWeight: 800
                      }}>
                        #{item.orderId}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>إضافة يدوية</span>
                    )}
                  </td>

                  {/* Added At */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    {item.addedAt ? new Date(item.addedAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'غير محدد'}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      بواسطة: {item.addedBy || 'الإدارة'}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.phone, item.name)}
                      disabled={isPending}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #10B981',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10B981',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title="فك الحظر والسماح للعميل باستخدام كوبونات الخصم"
                    >
                      فك الحظر
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Add Customer Modal */}
      {mounted && isModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '540px',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(239, 68, 68, 0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', color: '#EF4444', fontWeight: 900 }}>[حظر]</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  إضافة عميل لقائمة الحظر (Blacklist)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              إدخال رقم الهاتف هنا سيمنع العميل فوراً من تطبيق أو الاستفادة من أي كوبونات خصم عند محاولة إتمام الطلب في المتجر.
            </p>

            {formError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                fontSize: '0.85rem',
                fontWeight: 800,
                marginBottom: '1.25rem'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  رقم الهاتف (إلزامي) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="01xxxxxxxxx"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  اسم العميل (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: أحمد محمد"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  رقم الأوردر المرتبط (إن وجد)
                </label>
                <input
                  type="text"
                  placeholder="مثال: KT-4821"
                  value={manualOrderId}
                  onChange={(e) => setManualOrderId(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                  سبب الحظر *
                </label>
                <select
                  value={manualSelectedReason}
                  onChange={(e) => setManualSelectedReason(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%', background: 'var(--bg-main)' }}
                >
                  <option value={PRESET_REASONS[0]}>{PRESET_REASONS[0]}</option>
                  <option value={PRESET_REASONS[1]}>{PRESET_REASONS[1]}</option>
                  <option value={PRESET_REASONS[2]}>{PRESET_REASONS[2]}</option>
                  <option value={PRESET_REASONS[3]}>{PRESET_REASONS[3]}</option>
                  <option value="custom">كتابة سبب مخصص آخر...</option>
                </select>
              </div>

              {manualSelectedReason === 'custom' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                    تفاصيل السبب المخصص *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="اكتب سبب الحظر هنا..."
                    value={manualCustomReason}
                    onChange={(e) => setManualCustomReason(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  ملاحظات إدارية داخلية (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات للفريق..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="admin-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.85rem',
                    background: '#EF4444',
                    border: 'none',
                    color: '#FFF',
                    fontWeight: 800
                  }}
                >
                  {isPending ? 'جاري الحفظ...' : 'تأكيد الإضافة للبلاك ليست'}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
