'use client';

import React, { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { 
  creditCustomerWalletAction, 
  adjustCustomerWalletAction, 
  sendWalletCompensationEmailAction 
} from '../../app/admin/actions';

export function CustomerFinancialDetailModal({
  customer,
  isOpen,
  onClose,
  onCustomerUpdated
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'deposit' | 'adjust' | 'ledger' | 'orders'

  // Deposit State
  const [depositAmount, setDepositAmount] = useState(100);
  const [giftCategory, setGiftCategory] = useState('occasion'); // 'order' | 'occasion' | 'loyalty' | 'general'
  const [selectedOrderId, setSelectedOrderId] = useState(
    customer?.orders && customer.orders.length > 0 ? String(customer.orders[0].id) : ''
  );
  const [occasionText, setOccasionText] = useState('');
  const [depositReason, setDepositReason] = useState('هدية خاصة تقديراً لثقتكم واختياركم لنا');
  const [depositEmail, setDepositEmail] = useState(customer?.email || '');
  const [sendDepositEmail, setSendDepositEmail] = useState(Boolean(customer?.email && customer.email.includes('@')));
  const [depositResult, setDepositResult] = useState(null);
  const [depositError, setDepositError] = useState(null);
  const [copiedApology, setCopiedApology] = useState(false);
  const [isPendingDeposit, startDepositTransition] = useTransition();

  // Adjustment State (Fixing mistake/excess deposit)
  const [targetBalance, setTargetBalance] = useState(customer?.currentBalance ?? 0);
  const [adjustmentReason, setAdjustmentReason] = useState('تصحيح وتعديل رصيد المحفظة بواسطة الإدارة');
  const [adjustmentError, setAdjustmentError] = useState(null);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState(false);
  const [isPendingAdjustment, startAdjustmentTransition] = useTransition();

  if (!isOpen || !customer) return null;

  const currentBal = Number(customer.currentBalance || 0);
  const numTargetBal = Math.max(0, Math.round(Number(targetBalance || 0)));
  const balanceDiff = numTargetBal - currentBal;

  const handleSelectGiftCategory = (category) => {
    setGiftCategory(category);
    if (category === 'order') {
      const oId = selectedOrderId || (customer.orders?.[0]?.id) || '';
      setDepositReason(oId ? `هدية تعويض واعتذار بخصوص الطلب #${oId}` : 'هدية تعويض واعتذار عن طلب');
    } else if (category === 'occasion') {
      const occ = occasionText || 'مناسبة خاصة';
      setDepositReason(`هدية خاصة بمناسبة ${occ}`);
    } else if (category === 'loyalty') {
      setDepositReason('مكافأة ولاء وتقدير لعميل KEMET الدائم');
    } else {
      setDepositReason('هدية ورصيد مشتريات من إدارة KEMET');
    }
  };

  const handleSelectOccasion = (name) => {
    setOccasionText(name);
    setDepositReason(`هدية خاصة بمناسبة ${name}`);
  };

  const handleOrderChange = (oId) => {
    setSelectedOrderId(oId);
    setDepositReason(oId ? `هدية تعويض واعتذار بخصوص الطلب #${oId}` : 'هدية تعويض واعتذار عن طلب');
  };

  const handleSubmitDeposit = () => {
    const numAmount = Math.max(0, Math.round(Number(depositAmount || 0)));
    if (numAmount <= 0) {
      setDepositError('يرجى إدخال مبلغ صحيح أكبر من صفر.');
      return;
    }

    setDepositError(null);
    startDepositTransition(async () => {
      try {
        const cleanEmail = depositEmail.trim();
        const shouldSend = Boolean(sendDepositEmail && cleanEmail.includes('@'));
        const orderIdToAttach = giftCategory === 'order' ? (selectedOrderId || null) : null;

        const res = await creditCustomerWalletAction({
          userId: customer.userId || null,
          phone: customer.phone || null,
          email: cleanEmail || customer.email || null,
          customerName: customer.name || '',
          amount: numAmount,
          reason: depositReason.trim(),
          orderId: orderIdToAttach,
          giftType: giftCategory,
          adminName: 'إدارة KEMET',
          sendEmailNotification: shouldSend
        });

        if (res.success) {
          setDepositResult(res);
          if (onCustomerUpdated) {
            onCustomerUpdated({
              ...customer,
              currentBalance: res.balance,
              walletTransactions: [res.transaction, ...(customer.walletTransactions || [])]
            });
          }
        } else {
          setDepositError(res.error || 'فشل إيداع الرصيد.');
        }
      } catch (err) {
        setDepositError(err.message || 'حدث خطأ أثناء إيداع الرصيد.');
      }
    });
  };

  const handleSubmitAdjustment = () => {
    if (numTargetBal === currentBal) {
      setAdjustmentError('الرصيد الجديد مطابق للرصيد الحالي، لم يتم إجراء أي تغيير.');
      return;
    }

    setAdjustmentError(null);
    startAdjustmentTransition(async () => {
      try {
        const res = await adjustCustomerWalletAction({
          userId: customer.userId || null,
          phone: customer.phone || null,
          email: customer.email || null,
          newBalance: numTargetBal,
          reason: adjustmentReason.trim() || 'تعديل وتصحيح رصيد المحفظة بواسطة الإدارة',
          adminName: 'إدارة KEMET'
        });

        if (res.success) {
          setAdjustmentSuccess(true);
          if (onCustomerUpdated) {
            onCustomerUpdated({
              ...customer,
              currentBalance: res.balance,
              walletTransactions: [res.transaction, ...(customer.walletTransactions || [])]
            });
          }
        } else {
          setAdjustmentError(res.error || 'فشل تعديل الرصيد.');
        }
      } catch (err) {
        setAdjustmentError(err.message || 'حدث خطأ أثناء تعديل الرصيد.');
      }
    });
  };

  const handleCopyApology = () => {
    if (!depositResult?.apologyText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(depositResult.apologyText).then(() => {
        setCopiedApology(true);
        setTimeout(() => setCopiedApology(false), 2500);
      }).catch(() => {
        setCopiedApology(true);
        setTimeout(() => setCopiedApology(false), 2500);
      });
    }
  };

  return createPortal(
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(5px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        direction: 'rtl'
      }}
    >
      <div
        className="admin-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0B1120',
          border: '1px solid var(--border-gold)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#F8FAFC'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          background: '#0F172A',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                {customer.name || 'عميل'}
              </h3>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: customer.isRegistered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: customer.isRegistered ? '#10B981' : '#F59E0B',
                border: `1px solid ${customer.isRegistered ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}>
                {customer.isRegistered ? 'حساب مسجل' : 'عميل زائر'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', fontSize: '0.82rem', color: '#94A3B8' }}>
              {customer.phone && (
                <span>الهاتف: <strong style={{ color: '#E2E8F0', direction: 'ltr', display: 'inline-block' }}>{customer.phone}</strong></span>
              )}
              {customer.email && (
                <span>البريد: <strong style={{ color: '#E2E8F0', direction: 'ltr', display: 'inline-block' }}>{customer.email}</strong></span>
              )}
              {customer.registeredAt && (
                <span>تاريخ التسجيل: {new Date(customer.registeredAt).toLocaleDateString('ar-EG')}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFF',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}
          >
            إغلاق النافذة
          </button>
        </div>

        {/* Customer KPI Mini Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          padding: '1rem 1.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>رصيد المحفظة الحالي</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: currentBal > 0 ? '#10B981' : 'var(--gold-primary)' }}>
              {currentBal} ج.م
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>إجمالي المشتريات</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
              {customer.totalSpent || 0} ج.م
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>عدد الطلبات</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
              {customer.orders?.length || 0}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.75rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>إجمالي الهدايا الممنوحة</span>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
              {customer.totalGiftCredited || 0} ج.م
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: '#0F172A',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'نظرة عامة وسريعة' },
            { id: 'deposit', label: 'إيداع رصيد هدية / تعويض' },
            { id: 'adjust', label: 'تعديل وتصحيح الرصيد (إصلاح خطأ)' },
            { id: 'ledger', label: `سجل المحفظة (${customer.walletTransactions?.length || 0})` },
            { id: 'orders', label: `سجل الطلبات (${customer.orders?.length || 0})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setDepositResult(null);
                setDepositError(null);
                setAdjustmentError(null);
                setAdjustmentSuccess(false);
              }}
              style={{
                background: activeTab === tab.id ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === tab.id ? '#000' : '#E2E8F0',
                border: activeTab === tab.id ? '1px solid var(--border-gold-bright)' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.45rem 0.95rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: activeTab === tab.id ? 900 : 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* Fast Action Card 1: Deposit */}
                <div style={{
                  background: 'rgba(212, 175, 55, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--gold-primary)', fontSize: '1.05rem', fontWeight: 900 }}>
                      إيداع رصيد هدية أو تعويض
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                      إضافة رصيد مالي لحساب العميل كهدية مناسبة أو تعويض عن طلب محدد، مع إرسال إشعار فوري عبر واتساب والبريد.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('deposit')}
                    style={{
                      marginTop: '1.25rem',
                      background: 'var(--gold-primary)',
                      color: '#000',
                      border: 'none',
                      padding: '0.65rem 1rem',
                      borderRadius: '6px',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    فتح نموذج الإيداع الآن
                  </button>
                </div>

                {/* Fast Action Card 2: Correction */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#F59E0B', fontSize: '1.05rem', fontWeight: 900 }}>
                      تعديل وتصحيح الرصيد (إصلاح خطأ)
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                      إذا قمت بإيداع مبلغ إضافي بالخطأ للعميل، يمكنك تصحيح الرصيد مباشرة وضبط القيمة المعتمدة وتسجيل سبب التصحيح.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetBalance(currentBal);
                      setActiveTab('adjust');
                    }}
                    style={{
                      marginTop: '1.25rem',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '0.65rem 1rem',
                      borderRadius: '6px',
                      fontWeight: 900,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    تعديل الرصيد وتصحيحه
                  </button>
                </div>

              </div>

              {/* Latest Transactions Preview */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                    آخر حركات المحفظة:
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ledger')}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    عرض كل الحركات ({customer.walletTransactions?.length || 0})
                  </button>
                </div>

                {customer.walletTransactions && customer.walletTransactions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {customer.walletTransactions.slice(0, 3).map((txn, idx) => (
                      <div
                        key={txn.id || idx}
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#F1F5F9', marginBottom: '0.2rem' }}>
                            {txn.reason || (txn.type === 'credit' ? 'إيداع هدية' : 'استخدام رصيد')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {txn.createdAt ? new Date(txn.createdAt).toLocaleString('ar-EG') : ''}
                            {txn.orderId && ` | طلب #${txn.orderId}`}
                            {txn.adminName && ` | بواسطة: ${txn.adminName}`}
                          </div>
                        </div>
                        <div style={{
                          fontWeight: 900,
                          fontSize: '1rem',
                          color: (txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? '#10B981' : '#F43F5E',
                          direction: 'ltr'
                        }}>
                          {(txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? `+${txn.amount} ج.م` : `-${txn.amount} ج.م`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: '#94A3B8', fontSize: '0.84rem' }}>
                    لا توجد أي حركات مسجلة في محفظة هذا العميل حتى الآن.
                  </div>
                )}
              </div>

              {/* Latest Orders Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
                    آخر طلبات الشراء:
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    عرض كل الطلبات ({customer.orders?.length || 0})
                  </button>
                </div>

                {customer.orders && customer.orders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {customer.orders.slice(0, 3).map(order => (
                      <div
                        key={order.id}
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#F1F5F9', marginBottom: '0.2rem' }}>
                            طلب رقم: #{order.id}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {new Date(order.created_at).toLocaleDateString('ar-EG')} | الحالة: {order.status}
                          </div>
                        </div>
                        <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--gold-primary)' }}>
                          {order.total_amount} ج.م
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', color: '#94A3B8', fontSize: '0.84rem' }}>
                    لم يقم العميل بتسجيل أي طلبات شراء حتى الآن.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: DEPOSIT (GIFT / COMPENSATION) */}
          {activeTab === 'deposit' && (
            <div>
              {depositResult ? (
                /* Success View */
                <div>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10B981', marginBottom: '0.4rem' }}>
                      تم إيداع رصيد الهدية بنجاح في محفظة العميل
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#CBD5E1' }}>
                      الرصيد الجديد المعتمد: <strong style={{ color: 'var(--gold-primary)' }}>{depositResult.balance} ج.م</strong>
                    </div>
                    {depositResult.emailSent && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#10B981', fontWeight: 700 }}>
                        تم إرسال إشعار بريدي رسمي للعميل بنجاح.
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Text Preview */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      نص الرسالة والإشعار المعتمد:
                    </label>
                    <div style={{
                      background: '#020617',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      padding: '1rem',
                      fontSize: '0.86rem',
                      lineHeight: '1.7',
                      color: '#CBD5E1',
                      whiteSpace: 'pre-line'
                    }}>
                      {depositResult.apologyText}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {depositResult.whatsAppUrl && (
                      <a
                        href={depositResult.whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: '1 1 200px',
                          textAlign: 'center',
                          background: '#10B981',
                          color: '#000',
                          fontWeight: 900,
                          fontSize: '0.92rem',
                          padding: '0.8rem 1rem',
                          borderRadius: '8px',
                          textDecoration: 'none'
                        }}
                      >
                        إرسال رسالة الإشعار عبر واتساب
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyApology}
                      style={{
                        background: copiedApology ? '#10B981' : 'rgba(212, 175, 55, 0.15)',
                        border: '1px solid var(--border-gold)',
                        color: copiedApology ? '#000' : 'var(--gold-primary)',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        padding: '0.8rem 1.25rem',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedApology ? 'تم نسخ النص' : 'نسخ نص الرسالة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFF',
                        padding: '0.8rem 1.25rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      العودة للملف المالي
                    </button>
                  </div>
                </div>
              ) : (
                /* Deposit Form */
                <div>
                  {depositError && (
                    <div style={{
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.35)',
                      color: '#F43F5E',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      marginBottom: '1.25rem'
                    }}>
                      {depositError}
                    </div>
                  )}

                  {/* Quick Amounts */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                      اختر قيمة الهدية أو اكتب المبلغ:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {[50, 100, 150, 200, 300, 500].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDepositAmount(val)}
                          style={{
                            background: Number(depositAmount) === val ? 'var(--gold-primary)' : 'rgba(212, 175, 55, 0.12)',
                            color: Number(depositAmount) === val ? '#000' : 'var(--gold-primary)',
                            border: '1px solid var(--border-gold)',
                            borderRadius: '6px',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          +{val} ج.م
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="المبلغ بالجنيه المصري"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '1.1rem',
                        fontWeight: 900,
                        background: '#020617',
                        color: 'var(--gold-primary)',
                        border: '1px solid var(--border-gold)',
                        borderRadius: '8px'
                      }}
                    />
                  </div>

                  {/* Gift Category Selector */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                      نوع وتصنيف الهدية:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                      {[
                        { key: 'occasion', label: 'مناسبة خاصة' },
                        { key: 'order', label: 'تعويض عن طلب محدد' },
                        { key: 'loyalty', label: 'مكافأة ولاء وتقدير' },
                        { key: 'general', label: 'مخصص / أخرى' }
                      ].map(item => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSelectGiftCategory(item.key)}
                          style={{
                            background: giftCategory === item.key ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.05)',
                            color: giftCategory === item.key ? '#000' : '#FFF',
                            border: giftCategory === item.key ? '1px solid var(--border-gold-bright)' : '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Selector (if order compensation) */}
                  {giftCategory === 'order' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        اختر طلب العميل أو اكتب رقم المرجع:
                      </label>
                      {customer.orders && customer.orders.length > 0 ? (
                        <select
                          value={selectedOrderId}
                          onChange={(e) => handleOrderChange(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            background: '#020617',
                            color: '#FFF',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            borderRadius: '6px',
                            marginBottom: '0.4rem'
                          }}
                        >
                          {customer.orders.map(o => (
                            <option key={o.id} value={o.id}>
                              طلب #{o.id} - بتاريخ {new Date(o.created_at).toLocaleDateString('ar-EG')} - بقيمة {o.total_amount} ج.م ({o.status})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={selectedOrderId}
                          onChange={(e) => handleOrderChange(e.target.value)}
                          placeholder="اكتب رقم الطلب المرجعي..."
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            background: '#020617',
                            color: '#FFF',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            borderRadius: '6px'
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Occasion Selector (if occasion gift) */}
                  {giftCategory === 'occasion' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        اختر أو اكتب المناسبة:
                      </label>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {['عيد الفطر المبارك', 'عيد الأضحى المبارك', 'رأس السنة', 'عيد ميلاد العميل', 'بلاك فرايداي'].map(occ => (
                          <button
                            key={occ}
                            type="button"
                            onClick={() => handleSelectOccasion(occ)}
                            style={{
                              background: occasionText === occ ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              border: occasionText === occ ? '1px solid var(--gold-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                              color: occasionText === occ ? 'var(--gold-primary)' : '#CBD5E1',
                              borderRadius: '4px',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {occ}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={occasionText}
                        onChange={(e) => handleSelectOccasion(e.target.value)}
                        placeholder="أو اكتب اسم المناسبة هنا..."
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          background: '#020617',
                          color: '#FFF',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px'
                        }}
                      />
                    </div>
                  )}

                  {/* Reason Text */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      سبب الإيداع المسجل في كشف الحساب:
                    </label>
                    <input
                      type="text"
                      value={depositReason}
                      onChange={(e) => setDepositReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        background: '#020617',
                        color: '#FFF',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px'
                      }}
                    />
                  </div>

                  {/* Email & Notification Checkbox */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      البريد الإلكتروني للعميل (اختياري للإشعار الرسمي):
                    </label>
                    <input
                      type="email"
                      value={depositEmail}
                      onChange={(e) => {
                        setDepositEmail(e.target.value);
                        if (e.target.value.includes('@') && !sendDepositEmail) {
                          setSendDepositEmail(true);
                        }
                      }}
                      placeholder="customer@example.com"
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.88rem',
                        background: '#020617',
                        color: '#FFF',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        textAlign: 'left'
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: '#CBD5E1' }}>
                      <input
                        type="checkbox"
                        checked={sendDepositEmail}
                        onChange={(e) => setSendDepositEmail(e.target.checked)}
                        style={{ accentColor: 'var(--gold-primary)', width: '16px', height: '16px' }}
                      />
                      <span>إرسال إشعار بريدي فوري للعميل عند إيداع الرصيد</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleSubmitDeposit}
                      disabled={isPendingDeposit}
                      style={{
                        flexGrow: 1,
                        background: 'var(--gold-primary)',
                        color: '#000',
                        border: 'none',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        cursor: isPendingDeposit ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isPendingDeposit ? 'جاري إيداع الرصيد...' : `تأكيد إيداع (${Number(depositAmount) || 0} ج.م) في المحفظة`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFF',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADJUSTMENT (FIXING ACCIDENTAL EXCESS DEPOSIT) */}
          {activeTab === 'adjust' && (
            <div>
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.4rem 0', color: '#F59E0B', fontSize: '1rem', fontWeight: 900 }}>
                  تعديل وتصحيح رصيد المحفظة (إصلاح خطأ إيداع)
                </h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#CBD5E1', lineHeight: '1.6' }}>
                  يتيح هذا الإجراء تصحيح رصيد العميل مباشرة في حال تم تحويل أو إيداع مبلغ بالخطأ أو زيادة غير مقصودة. يتم ضبط الرصيد الجديد مباشرة مع تسجيل حركة تصحيح مالية واضحة في كشف الحساب.
                </p>
              </div>

              {adjustmentSuccess ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981', marginBottom: '0.5rem' }}>
                    تم تعديل وتصحيح رصيد المحفظة بنجاح
                  </div>
                  <div style={{ fontSize: '0.92rem', color: '#CBD5E1', marginBottom: '1.25rem' }}>
                    الرصيد الفعلي المعتمد الحالي أصبح: <strong style={{ color: 'var(--gold-primary)' }}>{numTargetBal} ج.م</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    style={{
                      background: 'var(--gold-primary)',
                      color: '#000',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontWeight: 900,
                      cursor: 'pointer'
                    }}
                  >
                    العودة لنظرة عامة على الحساب
                  </button>
                </div>
              ) : (
                <div>
                  {adjustmentError && (
                    <div style={{
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.35)',
                      color: '#F43F5E',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      marginBottom: '1.25rem'
                    }}>
                      {adjustmentError}
                    </div>
                  )}

                  {/* Current Balance Display */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.25rem'
                  }}>
                    <span style={{ fontSize: '0.88rem', color: '#94A3B8', fontWeight: 700 }}>
                      الرصيد الحالي المسجل في المحفظة:
                    </span>
                    <strong style={{ fontSize: '1.25rem', color: '#10B981', fontWeight: 900 }}>
                      {currentBal} ج.م
                    </strong>
                  </div>

                  {/* Target New Balance Input */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.4rem' }}>
                      الرصيد الصحيح الجديد المطلوب اعتماده (ج.م):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={targetBalance}
                      onChange={(e) => setTargetBalance(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '1.2rem',
                        fontWeight: 900,
                        background: '#020617',
                        color: '#FFF',
                        border: '1px solid var(--border-gold)',
                        borderRadius: '8px'
                      }}
                    />
                  </div>

                  {/* Live Difference Calculation Banner */}
                  <div style={{
                    background: balanceDiff < 0 ? 'rgba(244, 63, 94, 0.1)' : (balanceDiff > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
                    border: `1px solid ${balanceDiff < 0 ? 'rgba(244, 63, 94, 0.3)' : (balanceDiff > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)')}`,
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.25rem',
                    fontSize: '0.88rem',
                    fontWeight: 800
                  }}>
                    {balanceDiff < 0 && (
                      <span style={{ color: '#F43F5E' }}>
                        تنبيه: سيتم خصم ({Math.abs(balanceDiff)} ج.م) من محفظة العميل لتصحيح الرصيد من {currentBal} ج.م إلى {numTargetBal} ج.م.
                      </span>
                    )}
                    {balanceDiff > 0 && (
                      <span style={{ color: '#10B981' }}>
                        ملاحظة: سيتم إضافة ({balanceDiff} ج.م) إلى محفظة العميل لزيادة الرصيد من {currentBal} ج.م إلى {numTargetBal} ج.م.
                      </span>
                    )}
                    {balanceDiff === 0 && (
                      <span style={{ color: '#94A3B8' }}>
                        الرصيد الجديد مطابق للرصيد المسجل حالياً، لم يتم احتساب أي فارق.
                      </span>
                    )}
                  </div>

                  {/* Reason for adjustment */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      سبب التعديل والتصحيح (يُسجل في كشف حركة الحساب):
                    </label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      placeholder="مثال: تصحيح خطأ إيداع مبلغ إضافي بدون وجه حق"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        background: '#020617',
                        color: '#FFF',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px'
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleSubmitAdjustment}
                      disabled={isPendingAdjustment || balanceDiff === 0}
                      style={{
                        flexGrow: 1,
                        background: balanceDiff < 0 ? '#F43F5E' : 'var(--gold-primary)',
                        color: balanceDiff < 0 ? '#FFF' : '#000',
                        border: 'none',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        cursor: (isPendingAdjustment || balanceDiff === 0) ? 'not-allowed' : 'pointer',
                        opacity: balanceDiff === 0 ? 0.6 : 1
                      }}
                    >
                      {isPendingAdjustment ? 'جاري تطبيق التصحيح...' : `تأكيد تصحيح الرصيد إلى (${numTargetBal} ج.م)`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#FFF',
                        padding: '0.85rem 1.25rem',
                        borderRadius: '8px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WALLET LEDGER */}
          {activeTab === 'ledger' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                  كشف حركات المحفظة بالتفصيل
                </h4>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                  إجمالي الحركات: {customer.walletTransactions?.length || 0}
                </span>
              </div>

              {customer.walletTransactions && customer.walletTransactions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {customer.walletTransactions.map((txn, idx) => (
                    <div
                      key={txn.id || idx}
                      style={{
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '0.85rem 1.1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: (txn.type === 'credit' || txn.type === 'gift') ? 'rgba(16, 185, 129, 0.15)' : (txn.type?.includes('adjustment') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)'),
                            color: (txn.type === 'credit' || txn.type === 'gift') ? '#10B981' : (txn.type?.includes('adjustment') ? '#F59E0B' : '#F43F5E')
                          }}>
                            {txn.type === 'credit' || txn.type === 'gift' ? 'إيداع هدية' : (txn.type === 'adjustment_credit' ? 'تصحيح (إضافة)' : (txn.type === 'adjustment_debit' ? 'تصحيح (خصم)' : 'خصم استخدام'))}
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: '#F1F5F9' }}>
                            {txn.reason || 'حركة محفظة'}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          التاريخ: {txn.createdAt ? new Date(txn.createdAt).toLocaleString('ar-EG') : 'غير محدد'}
                          {txn.orderId && ` | مرجع الطلب: #${txn.orderId}`}
                          {txn.adminName && ` | المنفذ: ${txn.adminName}`}
                          {txn.balanceBefore !== undefined && txn.balanceAfter !== undefined && ` | الرصيد: (${txn.balanceBefore} -> ${txn.balanceAfter} ج.م)`}
                        </div>
                      </div>

                      <div style={{
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        color: (txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? '#10B981' : '#F43F5E',
                        direction: 'ltr',
                        whiteSpace: 'nowrap'
                      }}>
                        {(txn.type === 'credit' || txn.type === 'gift' || txn.type === 'adjustment_credit') ? `+${txn.amount} ج.م` : `-${txn.amount} ج.م`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', color: '#94A3B8' }}>
                  لا توجد أي حركات في كشف المحفظة حتى الآن.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                  سجل طلبات العميل
                </h4>
                <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                  إجمالي الطلبات: {customer.orders?.length || 0}
                </span>
              </div>

              {customer.orders && customer.orders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customer.orders.map(order => (
                    <div
                      key={order.id}
                      style={{
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--gold-primary)' }}>
                            طلب #{order.id}
                          </strong>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#CBD5E1'
                          }}>
                            {order.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                          التاريخ: {new Date(order.created_at).toLocaleString('ar-EG')}
                          {order.notes && ` | ملاحظات: ${order.notes}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>إجمالي الفاتورة</span>
                          <strong style={{ fontSize: '1.15rem', color: '#F8FAFC' }}>{order.total_amount} ج.م</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderId(String(order.id));
                            setGiftCategory('order');
                            setDepositReason(`هدية تعويض واعتذار بخصوص الطلب #${order.id}`);
                            setActiveTab('deposit');
                          }}
                          style={{
                            background: 'rgba(212, 175, 55, 0.12)',
                            border: '1px solid var(--border-gold)',
                            color: 'var(--gold-primary)',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          إيداع هدية لهذا الطلب
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', color: '#94A3B8' }}>
                  لا توجد طلبات مسجلة لهذا العميل حتى الآن.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
}
