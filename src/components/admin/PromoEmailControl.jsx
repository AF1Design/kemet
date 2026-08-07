'use client';

import React, { useState, useEffect } from 'react';
import { getRegisteredUsersStatsAction, sendMassPromoEmailAction } from '../../app/admin/actions';

export function PromoEmailControl() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [emailsSentCount, setEmailsSentCount] = useState(0);
  const [promoTextAr, setPromoTextAr] = useState('🔥 خصومات KEMET 2027 لفترة محدودة - تسوّق أطقم المنتخبات والأندية الرسمية الآن!');
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Load real registered users count from Supabase DB on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getRegisteredUsersStatsAction();
        if (res?.success) {
          setTotalUsers(res.count || 0);
        }
      } catch (err) {
        console.warn('Error loading user stats:', err);
      }
    }
    loadStats();
  }, []);

  const handleSendMassEmail = async (e) => {
    if (e) e.preventDefault();
    if (!promoTextAr.trim()) return;

    setStatusMsg(null);
    setIsSending(true);

    try {
      const res = await sendMassPromoEmailAction({
        promoTextAr: promoTextAr.trim()
      });

      if (res?.success) {
        const newlySent = res.sentCount || 0;
        setEmailsSentCount(prev => prev + newlySent);

        setStatusMsg({
          type: 'success',
          text: `تم إرسال العرض الترويجي بنجاح إلى ${newlySent} مستخدم مسجّل من أصل ${res.totalRecipients || totalUsers}! 📧✨`
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res?.error || 'حدث خطأ في السيرفر أثناء إرسال البريد الجماعي.'
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'حدث خطأ في شبكة الإرسال.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-gold-bright)',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      boxShadow: 'var(--shadow-glow)',
      marginBottom: '2.5rem'
    }}>
      {/* Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <span>📧</span> مركز إرسال العروض الترويجية بالبريد الإلكتروني
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.3rem 0 0 0' }}>
            نظام بث الرسائل الترويجية الفعلي لجميع عملاء ومتسوقي متجر KEMET المسجلين
          </p>
        </div>

        {/* Stats Badges */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--gold-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.25rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              عدد المستخدمين المسجلين 👥
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
              {totalUsers}
            </span>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10B981',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.25rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>
              وصلهم العرض على البريد 📩
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
              {emailsSentCount}
            </span>
          </div>
        </div>
      </div>

      {/* Form and Action */}
      <form onSubmit={handleSendMassEmail}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            نص العرض الترويجي المراد إرساله:
          </label>
          <textarea
            value={promoTextAr}
            onChange={(e) => setPromoTextAr(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              resize: 'vertical'
            }}
            placeholder="اكتب العرض الترويجي هنا..."
          />
        </div>

        {/* Status Feedback Message */}
        {statusMsg && (
          <div style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            fontWeight: 800,
            marginBottom: '1.25rem',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? '#10B981' : '#EF4444'}`,
            color: statusMsg.type === 'success' ? '#10B981' : '#EF4444'
          }}>
            {statusMsg.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={isSending || !promoTextAr.trim()}
            className="btn-primary"
            style={{
              padding: '0.85rem 2rem',
              fontSize: '0.95rem',
              fontWeight: 900,
              background: 'var(--gold-gradient)',
              color: '#000000',
              opacity: isSending ? 0.7 : 1,
              cursor: isSending ? 'not-allowed' : 'pointer'
            }}
          >
            {isSending ? '⏳ جاري إرسال البريد الجماعي...' : '🚀 إرسال العرض الترويجي لكافة المستخدمين بالبريد'}
          </button>
        </div>
      </form>
    </div>
  );
}
