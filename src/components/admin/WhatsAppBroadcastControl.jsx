'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getWhatsAppBroadcastCustomersAction } from '../../app/admin/actions';

const WA_CAMPAIGN_PRESETS = [
  {
    id: 'channel_invite',
    title: '📢 دعوة قناة الواتساب الحصرية (VIP)',
    description: 'دعوة العملاء للانضمام لقناة KEMET لمعرفة الكوليكشن الجديد والاستطلاعات والهدايا',
    badge: 'الأكثر طلباً',
    text: `أهلًا بيك يا {name} في KEMET،
إحنا بنحضّر لحاجات جديدة، ورأيك يهمنا في اللي جاي.
على قناة KEMET على واتساب، هتقدر تشارك في استطلاعات الرأي، وتعرف الجديد قبل ما ينزل على السوشيال ميديا.
اسأله كروية و هداية و فلوجات واحنا بنختار الخامات و كمان هنشاركك كل حاجه وقت التصنيع
انضم لينا وخليك قريب من كل جديد.

انضم لقناة KEMET على واتساب:
https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q`
  },
  {
    id: 'winter_launch',
    title: '❄️ كوليكشن تراكات الأندية الشتوي وصل! ⚽🔥',
    description: 'إشعار بوصول تشكيلة التراكات الشتوية الجديدة للأندية والمنتخبات',
    badge: 'شتوي 2026',
    text: `أهلًا بيك يا {name}،
كوليكشن تراكات الأندية الشتوي وصل رسميًا في KEMET! ⚽🔥
أحدث تشكيلة تراكات تدريب شتوية لأقوى الأندية والمنتخبات بخامات ثقيلة وتقفيل مريح للتمارين والتجمعات.
المقاسات متوفرة دلوقتي بكميات محدودة جداً.

تقدر تختار تراك فريقك وتطلب مباشرة من موقعنا:
https://kemetmisr.com/category/winter

وانضم لقناتنا على واتساب عشان يوصلك كل جديد أول بأول:
https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q`
  },
  {
    id: 'promo_discount',
    title: '🎁 عرض خاص وكود خصم حصري',
    description: 'إرسال كود خصم خاص للعميل لتشجيعه على إتمام طلب جديد',
    badge: 'خصومات',
    text: `أهلًا بيك يا {name}،
يسعدنا تقديم كود خصم حصري خاص بك لطلبك القادم من KEMET! 🎁
استخدم كود: KEMET22
واستمتع بسعر مخفض على تشكيلة الأطقم والتيشيرتات الرياضية الرسمية بنسخة اللاعبين Player Edition.

اطلب طقمك المفضل الآن من موقعنا:
https://kemetmisr.com

وانضم لقناة الواتساب لعروض وكوبونات حصرية:
https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q`
  },
  {
    id: 'custom',
    title: '✍️ رسالة وعرض مخصص بحرية',
    description: 'كتابة نص الرسالة والعرض المخصص بنفسك وإرساله لجميع العملاء',
    badge: 'مخصص',
    text: `أهلًا بيك يا {name} في KEMET،
عندنا عرض خاص ومميز جداً بنقدمه لعملائنا الكرام.

تابع كل تفاصيل العرض وانضم لقناتنا على واتساب:
https://whatsapp.com/channel/0029Vb6Oet06mYPNwa13nL3Q`
  }
];

export function WhatsAppBroadcastControl() {
  const [selectedPresetId, setSelectedPresetId] = useState('channel_invite');
  const [messageTemplate, setMessageTemplate] = useState(WA_CAMPAIGN_PRESETS[0].text);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'sent'
  const [sentMap, setSentMap] = useState({});
  const [directPhone, setDirectPhone] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load sent tracking from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`kemet_wa_sent_${selectedPresetId}`);
      if (saved) {
        setSentMap(JSON.parse(saved));
      } else {
        setSentMap({});
      }
    } catch (e) {}
  }, [selectedPresetId]);

  // Save sent status to localStorage
  const markAsSent = (customerId) => {
    const nextMap = {
      ...sentMap,
      [customerId]: {
        sentAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0]
      }
    };
    setSentMap(nextMap);
    try {
      localStorage.setItem(`kemet_wa_sent_${selectedPresetId}`, JSON.stringify(nextMap));
    } catch (e) {}
  };

  const handleResetSentStatus = () => {
    if (!window.confirm('هل أنت متأكد من إعادة تعيين حالات الإرسال لهذه الحملة؟')) return;
    setSentMap({});
    try {
      localStorage.removeItem(`kemet_wa_sent_${selectedPresetId}`);
    } catch (e) {}
  };

  // Fetch real customers from Supabase
  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true);
      try {
        const res = await getWhatsAppBroadcastCustomersAction();
        if (res.success && Array.isArray(res.customers)) {
          setCustomers(res.customers);
        }
      } catch (err) {
        console.warn('Failed to load whatsapp broadcast customers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setMessageTemplate(preset.text);
  };

  // Build Personalized message for a specific customer
  const buildPersonalizedMessage = (customerName = '') => {
    const cleanName = (customerName || '').trim();
    const displayName = cleanName && cleanName !== 'عميل مسجل' && cleanName !== 'عميل المتجر' && cleanName !== 'عميل سلة متروكة'
      ? cleanName.split(' ')[0]
      : 'صديقنا';
    return messageTemplate.replace(/{name}/g, displayName);
  };

  // Build Click-to-Chat URL
  const buildWhatsAppUrl = (waPhone, customerName = '') => {
    if (!waPhone) return null;
    const finalMsg = buildPersonalizedMessage(customerName);
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(finalMsg)}`;
  };

  // Handle direct test send
  const handleDirectSend = (e) => {
    e.preventDefault();
    const cleanDigits = directPhone.replace(/\D/g, '');
    if (!cleanDigits) return;
    let full = cleanDigits;
    if (full.startsWith('01') && full.length === 11) full = '2' + full;
    else if (full.startsWith('1') && full.length === 10) full = '20' + full;
    const url = `https://wa.me/${full}?text=${encodeURIComponent(buildPersonalizedMessage('كابتن'))}`;
    window.open(url, '_blank');
  };

  // Copy full message
  const handleCopyMessage = () => {
    const textToCopy = messageTemplate.replace(/{name}/g, 'صديقنا العزيز');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = !searchQuery.trim() ||
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery) ||
        (c.waPhone || '').includes(searchQuery) ||
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());

      const isSent = Boolean(sentMap[c.id || c.phone]);
      const matchesStatus =
        statusFilter === 'all' ? true :
        statusFilter === 'sent' ? isSent :
        statusFilter === 'pending' ? (!isSent && c.hasPhone) : true;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter, sentMap]);

  // Statistics
  const totalWithPhone = useMemo(() => customers.filter(c => c.hasPhone).length, [customers]);
  const totalSentCount = useMemo(() => {
    return customers.filter(c => c.hasPhone && sentMap[c.id || c.phone]).length;
  }, [customers, sentMap]);
  const totalPendingCount = Math.max(0, totalWithPhone - totalSentCount);

  // Send next pending customer
  const handleSendNextCustomer = () => {
    const nextCust = customers.find(c => c.hasPhone && !sentMap[c.id || c.phone]);
    if (!nextCust) {
      alert('تم إرسال الرسالة لجميع العملاء في القائمة بنجاح! 🎉');
      return;
    }
    const url = buildWhatsAppUrl(nextCust.waPhone, nextCust.name);
    if (url) {
      markAsSent(nextCust.id || nextCust.phone);
      window.open(url, '_blank');
    }
  };

  return (
    <div 
      id="whatsapp"
      style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid rgba(37, 211, 102, 0.35)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '2rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 25px rgba(37, 211, 102, 0.1)',
        position: 'relative'
      }}
    >
      {/* Header Title with WhatsApp Icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '1.7rem',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)'
          }}>
            💬
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                عروض ورسائل الواتساب (WhatsApp Marketing)
              </h2>
              <span style={{ 
                background: 'rgba(37, 211, 102, 0.15)', 
                color: '#25D366', 
                border: '1px solid rgba(37, 211, 102, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 900,
                padding: '0.2rem 0.6rem',
                borderRadius: '999px'
              }}>
                إرسال مباشر بنقرة واحدة
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
              أرسل دعوة قناة الواتساب الرسمية، عروض التراكات الشتوية، وأكواد الخصم لكافة عملائك بنقرة زر واحدة لكل عميل.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleCopyMessage}
            className="btn-secondary"
            style={{ 
              padding: '0.6rem 1.1rem', 
              fontSize: '0.85rem', 
              fontWeight: 800,
              background: copyFeedback ? 'rgba(37, 211, 102, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: copyFeedback ? '#25D366' : 'var(--text-primary)',
              borderColor: copyFeedback ? '#25D366' : 'var(--border-color)'
            }}
          >
            {copyFeedback ? '✓ تم نسخ النص بنجاح' : '📋 نسخ نص الرسالة'}
          </button>

          <button
            type="button"
            onClick={handleSendNextCustomer}
            disabled={totalPendingCount === 0}
            className="btn-primary"
            style={{ 
              padding: '0.6rem 1.3rem', 
              fontSize: '0.88rem', 
              fontWeight: 900,
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: '#FFFFFF',
              border: 'none',
              boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)',
              cursor: totalPendingCount === 0 ? 'not-allowed' : 'pointer',
              opacity: totalPendingCount === 0 ? 0.6 : 1
            }}
          >
            🚀 فتح محادثة العميل التالي ({totalPendingCount})
          </button>
        </div>
      </div>

      {/* Campaign Statistics Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>
            إجمالي العملاء بأرقام هواتف
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
            {totalWithPhone} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>عميل</span>
          </div>
        </div>

        <div style={{ background: 'rgba(37, 211, 102, 0.06)', border: '1px solid rgba(37, 211, 102, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#25D366', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>
            تم الإرسال لهم بنجاح ✅
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#25D366' }}>
            {totalSentCount} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>عميل</span>
          </div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.15rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 800, display: 'block', marginBottom: '0.4rem' }}>
            المتبقي للإرسال ⏳
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#F59E0B' }}>
            {totalPendingCount} <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>عميل</span>
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
              نسبة اكتمال الحملة:
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#25D366' }}>
              {totalWithPhone > 0 ? Math.round((totalSentCount / totalWithPhone) * 100) : 0}%
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', marginTop: '0.65rem', overflow: 'hidden' }}>
            <div style={{ 
              width: `${totalWithPhone > 0 ? Math.round((totalSentCount / totalWithPhone) * 100) : 0}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #25D366, #10B981)',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          {totalSentCount > 0 && (
            <button
              type="button"
              onClick={handleResetSentStatus}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'left', marginTop: '0.5rem', textDecoration: 'underline' }}
            >
              إعادة تعيين حالات الإرسال لهذه الحملة
            </button>
          )}
        </div>
      </div>

      {/* Preset Selection Tabs */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.65rem' }}>
          اختر قالب الرسالة أو اكتب رسالتك المخصصة:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          {WA_CAMPAIGN_PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                style={{
                  textAlign: 'right',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #25D366' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: isSelected ? '#25D366' : '#FFFFFF' }}>
                    {p.title}
                  </span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'var(--gold-primary)', fontWeight: 800 }}>
                    {p.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message Editor & Live WhatsApp Bubble Simulation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Editor Box */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
            <label style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
              محتوى رسالة الواتساب:
            </label>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              استخدم <code style={{ color: '#25D366', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{'{name}'}</code> لاستبداله تلقائياً باسم العميل
            </span>
          </div>
          <textarea
            rows={10}
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.95rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(37, 211, 102, 0.4)',
              background: 'var(--bg-deep)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              عدد الحروف: {messageTemplate.length} حرف
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              style={{ background: 'none', border: 'none', color: '#25D366', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {copyFeedback ? 'تم النسخ!' : 'نسخ النص للحافظة'}
            </button>
          </div>
        </div>

        {/* Live WhatsApp Simulation Bubble */}
        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.45rem' }}>
            معاينة شكل الرسالة كما ستظهر للعميل في واتساب:
          </label>
          <div style={{
            background: '#0B141A',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            minHeight: '230px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {/* WhatsApp Message Bubble */}
            <div style={{
              background: '#005C4B',
              color: '#E9EDEF',
              padding: '0.85rem 1rem',
              borderRadius: '12px 0px 12px 12px',
              maxWidth: '92%',
              marginRight: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              position: 'relative',
              direction: 'rtl',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#25D366', fontWeight: 900, marginBottom: '0.25rem' }}>
                KEMET Official Store
              </div>
              <div style={{ fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {buildPersonalizedMessage('أحمد')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.35rem', marginTop: '0.45rem', fontSize: '0.7rem', color: 'rgba(233, 237, 239, 0.6)' }}>
                <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ color: '#53BDEB' }}>✓✓</span>
              </div>
            </div>
          </div>

          {/* Quick Direct Test Send Form */}
          <form onSubmit={handleDirectSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
            <input
              type="text"
              placeholder="اكتب رقمك لتجربة الرسالة (مثال: 010xxxxxxxx)"
              value={directPhone}
              onChange={(e) => setDirectPhone(e.target.value)}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-deep)',
                color: 'var(--text-primary)',
                direction: 'ltr',
                textAlign: 'right'
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: '0.65rem 1.15rem',
                fontSize: '0.84rem',
                fontWeight: 900,
                background: 'rgba(37, 211, 102, 0.2)',
                color: '#25D366',
                border: '1px solid #25D366',
                whiteSpace: 'nowrap'
              }}
            >
              📲 تجربة إرسال للرقم
            </button>
          </form>
        </div>
      </div>

      {/* Customers List Section Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        marginBottom: '1rem',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '1.75rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
            قائمة عملاء المتجر وأزرار الإرسال الفردي (Click-to-Chat)
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            اضغط على زر "إرسال واتساب" بجانب أي عميل لفتح المحادثة مباشرة في واتساب مع نص الرسالة مجهزاً باسمه.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '0.2rem', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '4px',
                border: 'none',
                background: statusFilter === 'all' ? '#25D366' : 'transparent',
                color: statusFilter === 'all' ? '#000' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              الكل ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '4px',
                border: 'none',
                background: statusFilter === 'pending' ? '#F59E0B' : 'transparent',
                color: statusFilter === 'pending' ? '#000' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              المتبقي ({totalPendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('sent')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '4px',
                border: 'none',
                background: statusFilter === 'sent' ? '#25D366' : 'transparent',
                color: statusFilter === 'sent' ? '#000' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              تم الإرسال ({totalSentCount})
            </button>
          </div>

          {/* Search Box */}
          <input
            type="text"
            placeholder="بحث بالاسم أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.5rem 0.95rem',
              fontSize: '0.84rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-deep)',
              color: 'var(--text-primary)',
              minWidth: '200px'
            }}
          />
        </div>
      </div>

      {/* Customers Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          جاري تحميل بيانات العملاء وأرقام الهواتف...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
          لا يوجد عملاء يطابقون خيارات البحث أو التصفية الحالية.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(37, 211, 102, 0.08)', borderBottom: '1px solid rgba(37, 211, 102, 0.3)' }}>
                <th style={{ padding: '0.9rem 1rem', color: '#25D366', fontWeight: 800 }}>اسم العميل</th>
                <th style={{ padding: '0.9rem 1rem', color: '#25D366', fontWeight: 800 }}>رقم الهاتف (واتساب)</th>
                <th style={{ padding: '0.9rem 1rem', color: '#25D366', fontWeight: 800 }}>مصدر العميل</th>
                <th style={{ padding: '0.9rem 1rem', color: '#25D366', fontWeight: 800 }}>الطلبات</th>
                <th style={{ padding: '0.9rem 1rem', color: '#25D366', fontWeight: 800 }}>حالة الإرسال</th>
                <th style={{ padding: '0.9rem 1rem', color: '#25D366', fontWeight: 800, textAlign: 'center' }}>زر الإرسال عبر الواتساب</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const isSent = Boolean(sentMap[c.id || c.phone]);
                const sentData = sentMap[c.id || c.phone];
                const waUrl = buildWhatsAppUrl(c.waPhone, c.name);

                return (
                  <tr 
                    key={c.id || c.phone} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: isSent ? 'rgba(37, 211, 102, 0.03)' : 'transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    {/* Customer Name */}
                    <td style={{ padding: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: 'rgba(212, 175, 55, 0.15)',
                          color: 'var(--gold-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 900
                        }}>
                          {(c.name || 'ع')[0]}
                        </span>
                        <div>
                          <div>{c.name || 'عميل المتجر'}</div>
                          {c.email && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone Number */}
                    <td style={{ padding: '1rem', direction: 'ltr', textAlign: 'right', fontWeight: 800 }}>
                      {c.phone ? (
                        <span style={{ color: c.hasPhone ? 'var(--gold-primary)' : 'var(--text-muted)' }}>
                          {c.phone}
                        </span>
                      ) : (
                        <span style={{ color: '#F43F5E', fontSize: '0.8rem' }}>غير مسجل</span>
                      )}
                    </td>

                    {/* Source */}
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: c.source?.includes('مسجل') ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                        color: c.source?.includes('مسجل') ? 'var(--gold-primary)' : 'var(--text-secondary)'
                      }}>
                        {c.source || 'عميل'}
                      </span>
                    </td>

                    {/* Orders Count */}
                    <td style={{ padding: '1rem', fontWeight: 700 }}>
                      {c.ordersCount > 0 ? (
                        <span style={{ color: '#10B981' }}>{c.ordersCount} طلب</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>

                    {/* Sent Status Badge */}
                    <td style={{ padding: '1rem' }}>
                      {isSent ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: 'rgba(37, 211, 102, 0.15)',
                          color: '#25D366',
                          border: '1px solid rgba(37, 211, 102, 0.3)'
                        }}>
                          تم الإرسال ✅ {sentData?.sentAt ? `(${sentData.sentAt})` : ''}
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-secondary)'
                        }}>
                          لم يتم الإرسال
                        </span>
                      )}
                    </td>

                    {/* Send WhatsApp Action Button */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {c.hasPhone && waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markAsSent(c.id || c.phone)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            padding: '0.45rem 1.15rem',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 900,
                            background: isSent ? 'rgba(37, 211, 102, 0.15)' : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            color: isSent ? '#25D366' : '#FFFFFF',
                            border: isSent ? '1px solid rgba(37, 211, 102, 0.4)' : 'none',
                            boxShadow: isSent ? 'none' : '0 2px 8px rgba(37, 211, 102, 0.35)',
                            transition: 'all 0.15s ease',
                            cursor: 'pointer'
                          }}
                        >
                          <span>💬</span>
                          <span>{isSent ? 'إرسال مجدداً' : 'إرسال واتساب'}</span>
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          لا يتوفر رقم هاتف
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
