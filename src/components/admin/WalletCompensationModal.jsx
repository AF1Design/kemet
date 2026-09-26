'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { getCustomerWalletAction, creditCustomerWalletAction, sendWalletCompensationEmailAction } from '../../app/admin/actions';

export function WalletCompensationModal({
  isOpen,
  onClose,
  customerName = '',
  customerPhone = '',
  customerEmail = '',
  userId = null,
  orderId = null,
  onSuccess = null
}) {
  const [mounted, setMounted] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [amount, setAmount] = useState(100);
  const [giftCategory, setGiftCategory] = useState(orderId ? 'order' : 'occasion');
  const [orderReference, setOrderReference] = useState(orderId ? String(orderId) : '');
  const [occasionText, setOccasionText] = useState('');
  const [reason, setReason] = useState(
    orderId ? `هدية تعويض واعتذار بخصوص الطلب #${orderId}` : 'هدية خاصة تقديراً لثقتكم واختياركم لنا'
  );
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState(null);
  const [creditResult, setCreditResult] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  // Email notification states
  const [emailInput, setEmailInput] = useState(customerEmail || '');
  const [sendEmailNotification, setSendEmailNotification] = useState(Boolean(customerEmail && customerEmail.includes('@')));
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current wallet balance when modal opens
  useEffect(() => {
    if (!isOpen) {
      setCreditResult(null);
      setActionError(null);
      setCopiedText(false);
      setEmailSentStatus(null);
      setEmailErrorMsg(null);
      return;
    }

    const initCat = orderId ? 'order' : 'occasion';
    setGiftCategory(initCat);
    setOrderReference(orderId ? String(orderId) : '');
    setOccasionText('');
    setReason(orderId ? `هدية تعويض واعتذار بخصوص الطلب #${orderId}` : 'هدية خاصة تقديراً لثقتكم واختياركم لنا');

    setEmailInput(customerEmail || '');
    setSendEmailNotification(Boolean(customerEmail && customerEmail.includes('@')));
    setEmailSentStatus(null);
    setEmailErrorMsg(null);

    let isCancelled = false;
    setIsLoadingBalance(true);
    setActionError(null);
    setCreditResult(null);

    async function fetchBalance() {
      try {
        const res = await getCustomerWalletAction({
          userId: userId || null,
          phone: customerPhone || null,
          email: customerEmail || null
        });

        if (!isCancelled) {
          if (res.success && res.wallet) {
            setCurrentBalance(Number(res.wallet.balance || 0));
          } else {
            setCurrentBalance(0);
          }
        }
      } catch (e) {
        if (!isCancelled) setCurrentBalance(0);
      } finally {
        if (!isCancelled) setIsLoadingBalance(false);
      }
    }

    fetchBalance();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, userId, customerPhone, customerEmail, orderId]);

  if (!isOpen || !mounted) return null;

  const handleQuickAmount = (val) => {
    setAmount(val);
  };

  const handleCategoryChange = (category) => {
    setGiftCategory(category);
    if (category === 'order') {
      const ref = orderReference || orderId || '';
      setReason(ref ? `هدية تعويض واعتذار بخصوص الطلب #${ref}` : 'هدية تعويض واعتذار عن طلب');
    } else if (category === 'occasion') {
      const occ = occasionText || 'مناسبة خاصة';
      setReason(`هدية خاصة بمناسبة ${occ}`);
    } else if (category === 'loyalty') {
      setReason('مكافأة ولاء وتقدير لعميل KEMET الدائم');
    } else {
      setReason('هدية ورصيد مشتريات من إدارة KEMET');
    }
  };

  const handleSelectOccasion = (name) => {
    setOccasionText(name);
    setReason(`هدية خاصة بمناسبة ${name}`);
  };

  const handleOrderRefChange = (ref) => {
    setOrderReference(ref);
    setReason(ref ? `هدية تعويض واعتذار بخصوص الطلب #${ref}` : 'هدية تعويض واعتذار عن طلب');
  };

  const handleSubmitCredit = () => {
    const numAmount = Math.max(0, Math.round(Number(amount || 0)));
    if (numAmount <= 0) {
      setActionError('يرجى إدخال مبلغ صحيح أكبر من صفر.');
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        const cleanEmail = emailInput.trim();
        const shouldSendEmail = Boolean(sendEmailNotification && cleanEmail.includes('@'));
        const targetOrderId = giftCategory === 'order' ? (orderReference || orderId || null) : null;

        const res = await creditCustomerWalletAction({
          userId: userId || null,
          phone: customerPhone || null,
          email: cleanEmail || customerEmail || null,
          customerName: customerName || '',
          amount: numAmount,
          reason: reason.trim(),
          orderId: targetOrderId,
          giftType: giftCategory,
          adminName: 'إدارة KEMET',
          sendEmailNotification: shouldSendEmail
        });

        if (res.success) {
          setCreditResult(res);
          setCurrentBalance(res.balance);
          if (res.emailSent) {
            setEmailSentStatus('sent');
          } else if (res.emailError) {
            setEmailSentStatus('failed');
            setEmailErrorMsg(res.emailError);
          }
          if (onSuccess) {
            onSuccess(res);
          }
        } else {
          setActionError(res.error || 'فشل إيداع الرصيد في المحفظة.');
        }
      } catch (err) {
        setActionError(err.message || 'حدث خطأ غير متوقع أثناء إيداع الرصيد.');
      }
    });
  };

  const handleSendEmailNow = async () => {
    const targetEmail = emailInput.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setEmailErrorMsg('يرجى كتابة بريد إلكتروني صحيح للعميل.');
      return;
    }
    setIsSendingEmail(true);
    setEmailErrorMsg(null);
    try {
      const res = await sendWalletCompensationEmailAction({
        recipientEmail: targetEmail,
        customerName: customerName || '',
        amount: creditResult?.creditedAmount || Number(amount || 0),
        balance: creditResult?.balance ?? currentBalance,
        reason: reason.trim(),
        orderId: orderId || null
      });
      if (res.success) {
        setEmailSentStatus('sent');
      } else {
        setEmailSentStatus('failed');
        setEmailErrorMsg(res.error || 'فشل إرسال الإيميل.');
      }
    } catch (err) {
      setEmailSentStatus('failed');
      setEmailErrorMsg(err.message || 'حدث خطأ أثناء إرسال الإيميل.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopyApology = () => {
    if (!creditResult?.apologyText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(creditResult.apologyText).then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2500);
      }).catch(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2500);
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
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
          background: '#0F172A',
          border: '1px solid var(--border-gold)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          padding: '1.75rem',
          color: '#F8FAFC'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
              إيداع رصيد هدية في محفظة العميل
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
              إضافة رصيد مالي لحساب العميل كهدية ليتم خصمه تلقائياً من طلبه القادم
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFF',
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}
          >
            إغلاق
          </button>
        </div>

        {/* Customer Info Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>اسم العميل:</span>
            <strong style={{ color: '#FFF' }}>{customerName || 'عميل غير مسجل'}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>رقم الهاتف:</span>
            <strong style={{ color: '#FFF', direction: 'ltr', display: 'inline-block' }}>{customerPhone || 'بدون هاتف'}</strong>
          </div>
          {customerEmail && (
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>البريد الإلكتروني:</span>
              <strong style={{ color: '#FFF', direction: 'ltr', display: 'inline-block' }}>{customerEmail}</strong>
            </div>
          )}
          {orderId && (
            <div>
              <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>مرجع الطلب:</span>
              <strong style={{ color: 'var(--gold-primary)' }}>#{orderId}</strong>
            </div>
          )}
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.75rem', marginBottom: '0.2rem' }}>رصيد المحفظة الحالي:</span>
            <strong style={{ color: '#10B981', fontSize: '1rem' }}>
              {isLoadingBalance ? 'جاري الفحص...' : `${currentBalance ?? 0} ج.م`}
            </strong>
          </div>
        </div>

        {/* Success View */}
        {creditResult ? (
          <div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10B981', marginBottom: '0.4rem' }}>
                تم إيداع رصيد الهدية بنجاح في محفظة العميل
              </div>
              <div style={{ fontSize: '0.9rem', color: '#E2E8F0' }}>
                تمت إضافة ({creditResult.creditedAmount} ج.م) كهدية. أصبح الرصيد المتاح للعميل: ({creditResult.balance} ج.م).
              </div>
            </div>

            {/* Email Notification Status & Action */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                إشعار البريد الإلكتروني الرسمي:
              </div>

              {emailSentStatus === 'sent' ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#10B981',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981'
                    }} />
                    <span>تم إرسال إيميل الهدية الرسمي بنجاح إلى: <strong style={{ direction: 'ltr', display: 'inline-block' }}>{emailInput}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendEmailNow}
                    disabled={isSendingEmail}
                    style={{
                      background: 'transparent',
                      border: '1px solid #10B981',
                      color: '#10B981',
                      borderRadius: '6px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: isSendingEmail ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSendingEmail ? 'جاري الإرسال...' : 'إعادة الإرسال'}
                  </button>
                </div>
              ) : (
                <div>
                  {emailSentStatus === 'failed' && (
                    <div style={{
                      color: '#F43F5E',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      marginBottom: '0.6rem',
                      background: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px'
                    }}>
                      {emailErrorMsg || 'فشل إرسال الإيميل. يرجى التأكد من البريد والمحاولة مجدداً.'}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="أدخل بريد العميل لإرسال الإشعار"
                      dir="ltr"
                      style={{
                        flex: '1 1 220px',
                        padding: '0.6rem 0.85rem',
                        fontSize: '0.86rem',
                        background: '#020617',
                        color: '#FFF',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        textAlign: 'left'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSendEmailNow}
                      disabled={isSendingEmail || !emailInput.trim()}
                      style={{
                        background: 'var(--gold-primary)',
                        color: '#000',
                        fontWeight: 900,
                        fontSize: '0.86rem',
                        padding: '0.6rem 1.1rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: (isSendingEmail || !emailInput.trim()) ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isSendingEmail ? 'جاري إرسال الإيميل...' : 'إرسال إيميل الهدية الآن'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Gift WhatsApp Message Box */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                نص رسالة الهدية والإشعار للعميل:
              </label>
              <div style={{
                background: '#020617',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.88rem',
                lineHeight: '1.7',
                color: '#CBD5E1',
                whiteSpace: 'pre-line'
              }}>
                {creditResult.apologyText}
              </div>
            </div>

            {/* Action Buttons for WhatsApp & Copy */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {creditResult.whatsAppUrl && (
                <a
                  href={creditResult.whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: '1 1 200px',
                    textAlign: 'center',
                    background: '#10B981',
                    color: '#000',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  إرسال رسالة الهدية واتساب
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyApology}
                style={{
                  flex: '1 1 140px',
                  background: copiedText ? '#10B981' : 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid var(--border-gold)',
                  color: copiedText ? '#000' : 'var(--gold-primary)',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {copiedText ? 'تم نسخ النص' : 'نسخ نص الرسالة'}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <div>
            {actionError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#F43F5E',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 800,
                marginBottom: '1rem'
              }}>
                {actionError}
              </div>
            )}

            {/* Quick Amount Options */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                خيارات سريعة لقيمة الهدية:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[50, 100, 150, 200, 300].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    style={{
                      background: Number(amount) === val ? 'var(--gold-primary)' : 'rgba(212, 175, 55, 0.12)',
                      color: Number(amount) === val ? '#000' : 'var(--gold-primary)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '6px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    +{val} ج.م
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                المبلغ المراد إيداعه (ج.م):
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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

            {/* Customer Email Input & Send Checkbox */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  البريد الإلكتروني للعميل:
                </label>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  (اختياري لإرسال إشعار بريدي رسمي)
                </span>
              </div>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmailInput(val);
                  if (val.includes('@') && !sendEmailNotification) {
                    setSendEmailNotification(true);
                  }
                }}
                placeholder="customer@example.com"
                dir="ltr"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: '#020617',
                  color: '#FFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  textAlign: 'left'
                }}
              />
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.6rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#CBD5E1',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  style={{ accentColor: 'var(--gold-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>إرسال إشعار رسمي فوري لبريد العميل عند إيداع الرصيد</span>
              </label>
            </div>

            {/* Gift Category Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                نوع وتصنيف الهدية:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {[
                  { key: 'order', label: 'تعويض عن طلب' },
                  { key: 'occasion', label: 'مناسبة خاصة' },
                  { key: 'loyalty', label: 'مكافأة ولاء' },
                  { key: 'general', label: 'مخصص / أخرى' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleCategoryChange(item.key)}
                    style={{
                      background: giftCategory === item.key ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.05)',
                      color: giftCategory === item.key ? '#000' : '#FFF',
                      border: giftCategory === item.key ? '1px solid var(--border-gold-bright)' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* If Order Compensation: Order Reference Input */}
            {giftCategory === 'order' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  رقم مرجع الطلب (Order ID):
                </label>
                <input
                  type="text"
                  value={orderReference}
                  onChange={(e) => handleOrderRefChange(e.target.value)}
                  placeholder="مثال: ord_123 أو 1024"
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
              </div>
            )}

            {/* If Occasion Gift: Occasion Suggestions */}
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

            {/* Reason Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                نص السبب المسجل في كشف الحساب والرسائل:
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: هدية خاصة تقديراً لثقتكم"
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

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleSubmitCredit}
                disabled={isPending || isLoadingBalance}
                className="btn-primary"
                style={{
                  flexGrow: 1,
                  padding: '0.85rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 900,
                  background: 'var(--gold-primary)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isPending ? 'not-allowed' : 'pointer'
                }}
              >
                {isPending ? 'جاري إيداع الرصيد في المحفظة...' : `تأكيد إيداع (${Number(amount) || 0} ج.م) كهدية في المحفظة`}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
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
    </div>,
    document.body
  );
}
