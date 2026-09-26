import { getAdminSupabase } from './supabase/admin.js';

/**
 * Normalizes Egyptian mobile phone numbers to a consistent 11-digit format starting with '01'
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith('201')) {
    return '0' + digits.slice(2);
  }
  if (digits.length === 13 && digits.startsWith('00201')) {
    return '0' + digits.slice(4);
  }
  return digits;
}

/**
 * Generates canonical database key for user wallet in categories table
 */
export function getWalletStorageKey({ userId, phone }) {
  if (userId) {
    const cleanUid = String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return `_wallet_u_${cleanUid}`;
  }
  const cleanPhone = normalizePhone(phone);
  if (cleanPhone) {
    return `_wallet_p_${cleanPhone}`;
  }
  return null;
}

/**
 * Fetches customer wallet balance and transaction ledger
 */
export async function getCustomerWalletData({ userId = null, phone = null, email = null }) {
  const defaultWallet = {
    balance: 0,
    transactions: [],
    userId: userId || null,
    phone: normalizePhone(phone) || null,
    email: email ? String(email).trim().toLowerCase() : null,
    updatedAt: new Date().toISOString()
  };

  try {
    const supabaseAdmin = getAdminSupabase();

    // 1. Try resolving primary key by userId if present
    let walletRecord = null;
    let foundKey = null;

    if (userId) {
      const uKey = getWalletStorageKey({ userId });
      const { data: uData } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', uKey)
        .maybeSingle();

      if (uData && uData.name_ar) {
        try {
          walletRecord = JSON.parse(uData.name_ar);
          foundKey = uKey;
        } catch (e) {}
      }
    }

    // 2. If not found by userId, try by phone
    const cleanPhone = normalizePhone(phone);
    if (!walletRecord && cleanPhone) {
      const pKey = getWalletStorageKey({ phone: cleanPhone });
      const { data: pData } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', pKey)
        .maybeSingle();

      if (pData && pData.name_ar) {
        try {
          walletRecord = JSON.parse(pData.name_ar);
          foundKey = pKey;
        } catch (e) {}
      }
    }

    // 3. If found by phone and user has userId now, auto-migrate to userId primary key
    if (walletRecord && userId && foundKey && foundKey.startsWith('_wallet_p_')) {
      const newUKey = getWalletStorageKey({ userId });
      walletRecord.userId = userId;
      walletRecord.phone = cleanPhone || walletRecord.phone;
      walletRecord.email = email || walletRecord.email;

      await supabaseAdmin.from('categories').upsert({
        id: newUKey,
        name_ar: JSON.stringify(walletRecord),
        name_en: 'USER_WALLET',
        description_ar: walletRecord.phone || '',
        description_en: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }

    // 4. Return result if record found
    if (walletRecord) {
      return {
        balance: Math.max(0, Number(walletRecord.balance || 0)),
        transactions: Array.isArray(walletRecord.transactions) ? walletRecord.transactions : [],
        userId: walletRecord.userId || userId,
        phone: walletRecord.phone || cleanPhone,
        email: walletRecord.email || email,
        updatedAt: walletRecord.updatedAt || new Date().toISOString()
      };
    }

    return defaultWallet;
  } catch (err) {
    console.error('getCustomerWalletData error:', err);
    return defaultWallet;
  }
}

/**
 * Credits customer wallet with compensation funds and records ledger entry
 */
export async function creditCustomerWallet({
  userId = null,
  phone = null,
  email = null,
  amount,
  reason = 'هدية ورصيد مشتريات',
  adminName = 'إدارة KEMET',
  orderId = null,
  giftType = 'general'
}) {
  const numAmount = Math.max(0, Math.round(Number(amount || 0)));
  if (numAmount <= 0) {
    throw new Error('قيمة الرصيد المضاف يجب أن تكون أكبر من صفر.');
  }

  const cleanPhone = normalizePhone(phone);
  if (!userId && !cleanPhone) {
    throw new Error('يجب تحديد معرف العميل أو رقم الهاتف لإيداع الرصيد.');
  }

  const supabaseAdmin = getAdminSupabase();

  // Read current wallet data
  const currentWallet = await getCustomerWalletData({ userId, phone: cleanPhone, email });
  const currentBalance = Number(currentWallet.balance || 0);
  const newBalance = currentBalance + numAmount;

  const transaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'credit',
    amount: numAmount,
    balanceBefore: currentBalance,
    balanceAfter: newBalance,
    reason: String(reason || 'هدية ورصيد مشتريات').trim(),
    giftType: giftType ? String(giftType).trim() : 'general',
    adminName: String(adminName || 'إدارة KEMET').trim(),
    orderId: orderId ? String(orderId).trim() : null,
    createdAt: new Date().toISOString()
  };

  const updatedTransactions = [transaction, ...(currentWallet.transactions || [])].slice(0, 50);

  const newWalletData = {
    balance: newBalance,
    transactions: updatedTransactions,
    userId: userId || currentWallet.userId,
    phone: cleanPhone || currentWallet.phone,
    email: email || currentWallet.email,
    updatedAt: new Date().toISOString()
  };

  const storageKey = getWalletStorageKey({ userId: newWalletData.userId, phone: newWalletData.phone });
  if (!storageKey) {
    throw new Error('تعذر إنشاء مفتاح المحفظة للعميل.');
  }

  // 1. Persist to categories table store
  const { error: upsertErr } = await supabaseAdmin
    .from('categories')
    .upsert({
      id: storageKey,
      name_ar: JSON.stringify(newWalletData),
      name_en: 'USER_WALLET',
      description_ar: newWalletData.phone || '',
      description_en: newWalletData.userId || 'GUEST',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (upsertErr) {
    console.error('creditCustomerWallet DB error:', upsertErr);
    throw upsertErr;
  }

  // 2. Also keep phone-indexed record for guest/phone sync if userId exists
  if (newWalletData.userId && newWalletData.phone) {
    const pKey = getWalletStorageKey({ phone: newWalletData.phone });
    if (pKey && pKey !== storageKey) {
      await supabaseAdmin.from('categories').upsert({
        id: pKey,
        name_ar: JSON.stringify(newWalletData),
        name_en: 'USER_WALLET',
        description_ar: newWalletData.phone,
        description_en: newWalletData.userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }
  }

  // 3. Update Supabase Auth user_metadata if userId exists
  if (newWalletData.userId) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(newWalletData.userId, {
        user_metadata: { wallet_balance: newBalance }
      });
    } catch (authErr) {
      console.warn('user_metadata update note:', authErr.message);
    }
  }

  return {
    success: true,
    balance: newBalance,
    previousBalance: currentBalance,
    creditedAmount: numAmount,
    transaction
  };
}

/**
 * Debits customer wallet when using store credit at checkout
 */
export async function debitCustomerWallet({
  userId = null,
  phone = null,
  email = null,
  amount,
  reason = 'استخدام الرصيد في طلب شراء',
  orderId = null
}) {
  const numAmount = Math.max(0, Math.round(Number(amount || 0)));
  if (numAmount <= 0) {
    throw new Error('قيمة الخصم يجب أن تكون أكبر من صفر.');
  }

  const cleanPhone = normalizePhone(phone);
  if (!userId && !cleanPhone) {
    throw new Error('يجب تحديد معرف العميل أو رقم الهاتف لخصم الرصيد.');
  }

  const supabaseAdmin = getAdminSupabase();

  // Read current wallet data
  const currentWallet = await getCustomerWalletData({ userId, phone: cleanPhone, email });
  const currentBalance = Number(currentWallet.balance || 0);

  if (currentBalance < numAmount) {
    return {
      success: false,
      error: `رصيد المحفظة المتاح (${currentBalance} ج.م) غير كافٍ لخصم (${numAmount} ج.م).`
    };
  }

  const newBalance = Math.max(0, currentBalance - numAmount);

  const transaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'debit',
    amount: numAmount,
    balanceBefore: currentBalance,
    balanceAfter: newBalance,
    reason: String(reason || 'استخدام الرصيد في طلب شراء').trim(),
    orderId: orderId ? String(orderId).trim() : null,
    createdAt: new Date().toISOString()
  };

  const updatedTransactions = [transaction, ...(currentWallet.transactions || [])].slice(0, 50);

  const newWalletData = {
    balance: newBalance,
    transactions: updatedTransactions,
    userId: userId || currentWallet.userId,
    phone: cleanPhone || currentWallet.phone,
    email: email || currentWallet.email,
    updatedAt: new Date().toISOString()
  };

  const storageKey = getWalletStorageKey({ userId: newWalletData.userId, phone: newWalletData.phone });

  // 1. Persist to categories table store
  const { error: upsertErr } = await supabaseAdmin
    .from('categories')
    .upsert({
      id: storageKey,
      name_ar: JSON.stringify(newWalletData),
      name_en: 'USER_WALLET',
      description_ar: newWalletData.phone || '',
      description_en: newWalletData.userId || 'GUEST',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (upsertErr) {
    console.error('debitCustomerWallet DB error:', upsertErr);
    throw upsertErr;
  }

  // 2. Also keep phone-indexed record synced
  if (newWalletData.userId && newWalletData.phone) {
    const pKey = getWalletStorageKey({ phone: newWalletData.phone });
    if (pKey && pKey !== storageKey) {
      await supabaseAdmin.from('categories').upsert({
        id: pKey,
        name_ar: JSON.stringify(newWalletData),
        name_en: 'USER_WALLET',
        description_ar: newWalletData.phone,
        description_en: newWalletData.userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }
  }

  // 3. Update Supabase Auth user_metadata if userId exists
  if (newWalletData.userId) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(newWalletData.userId, {
        user_metadata: { wallet_balance: newBalance }
      });
    } catch (authErr) {
      console.warn('user_metadata update note:', authErr.message);
    }
  }

  return {
    success: true,
    balance: newBalance,
    debitedAmount: numAmount,
    transaction
  };
}

/**
 * Generates the standardized text for WhatsApp gift notification message (Zero emojis)
 */
export function generateWalletApologyMessage({ customerName, amount, reason = null, orderId = null, giftType = 'general' }) {
  const cleanName = customerName && String(customerName).trim() ? String(customerName).trim() : 'عزيزنا العميل';
  const cleanAmount = Math.max(0, Math.round(Number(amount || 0)));
  const customReason = reason && String(reason).trim() ? String(reason).trim() : null;

  let reasonLine = 'تقديراً لثقتكم واختياركم لنا';
  if (orderId) {
    reasonLine = `تقديراً لكم واعتذاراً عن أي مشكلة أو تأخير بخصوص الطلب رقم #${orderId}`;
  } else if (customReason && !customReason.includes('هدية ورصيد مشتريات من إدارة KEMET')) {
    reasonLine = `يسعدنا إهداؤكم بمناسبة: ${customReason}`;
  }

  return `مرحباً ${cleanName}، يسعدنا التواصل معك من متجر KEMET.
${reasonLine}، تم إيداع رصيد مالي بقيمة (${cleanAmount} ج.م) في محفظة حسابكم كهدية خاصة.
يمكنكم استخدام هذا الرصيد بالكامل لخصمه من قيمة طلبكم القادم عبر الموقع فوراً:
https://kemetmisr.com

فريق خدمة عملاء KEMET في خدمتكم دائماً.`;
}

/**
 * Builds direct WhatsApp URL for sending gift notification with occasion/order details
 */
export function getWalletApologyWhatsAppUrl({ phone, customerName, amount, reason = null, orderId = null, giftType = 'general' }) {
  const rawPhone = String(phone || '').replace(/\D/g, '');
  if (!rawPhone) return null;
  const internationalPhone = rawPhone.startsWith('20') ? rawPhone : (rawPhone.startsWith('0') ? '2' + rawPhone : '20' + rawPhone);
  const text = generateWalletApologyMessage({ customerName, amount, reason, orderId, giftType });
  return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Directly sets or adjusts customer wallet balance (e.g. correcting extra funds added by mistake)
 */
export async function adjustCustomerWallet({
  userId = null,
  phone = null,
  email = null,
  newBalance,
  reason = 'تعديل وتصحيح رصيد المحفظة بواسطة الإدارة',
  adminName = 'إدارة KEMET'
}) {
  const targetBalance = Math.max(0, Math.round(Number(newBalance || 0)));
  const cleanPhone = normalizePhone(phone);
  if (!userId && !cleanPhone) {
    throw new Error('يجب تحديد معرف العميل أو رقم الهاتف لتعديل الرصيد.');
  }

  const supabaseAdmin = getAdminSupabase();

  // Read current wallet data
  const currentWallet = await getCustomerWalletData({ userId, phone: cleanPhone, email });
  const currentBalance = Number(currentWallet.balance || 0);
  const diff = targetBalance - currentBalance;

  const transaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: diff >= 0 ? 'adjustment_credit' : 'adjustment_debit',
    amount: Math.abs(diff),
    balanceBefore: currentBalance,
    balanceAfter: targetBalance,
    reason: String(reason || (diff >= 0 ? 'إضافة وتصحيح رصيد بواسطة الإدارة' : 'خصم وتصحيح رصيد زائد بواسطة الإدارة')).trim(),
    adminName: String(adminName || 'إدارة KEMET').trim(),
    createdAt: new Date().toISOString()
  };

  const updatedTransactions = [transaction, ...(currentWallet.transactions || [])].slice(0, 50);

  const newWalletData = {
    balance: targetBalance,
    transactions: updatedTransactions,
    userId: userId || currentWallet.userId || null,
    phone: cleanPhone || currentWallet.phone || null,
    email: email || currentWallet.email || null,
    updatedAt: new Date().toISOString()
  };

  const storageKey = getWalletStorageKey({ userId: newWalletData.userId, phone: newWalletData.phone });
  if (!storageKey) {
    throw new Error('تعذر إنشاء مفتاح تخزين المحفظة.');
  }

  // 1. Upsert primary record in categories
  const { error: upsertErr } = await supabaseAdmin
    .from('categories')
    .upsert({
      id: storageKey,
      name_ar: JSON.stringify(newWalletData),
      name_en: 'USER_WALLET',
      description_ar: newWalletData.phone || '',
      description_en: newWalletData.userId || 'GUEST',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (upsertErr) {
    console.error('adjustCustomerWallet DB error:', upsertErr);
    throw upsertErr;
  }

  // 2. Keep phone-indexed record synced
  if (newWalletData.userId && newWalletData.phone) {
    const pKey = getWalletStorageKey({ phone: newWalletData.phone });
    if (pKey && pKey !== storageKey) {
      await supabaseAdmin.from('categories').upsert({
        id: pKey,
        name_ar: JSON.stringify(newWalletData),
        name_en: 'USER_WALLET',
        description_ar: newWalletData.phone,
        description_en: newWalletData.userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    }
  }

  // 3. Update Supabase Auth user_metadata if userId exists
  if (newWalletData.userId) {
    try {
      await supabaseAdmin.auth.admin.updateUserById(newWalletData.userId, {
        user_metadata: { wallet_balance: targetBalance }
      });
    } catch (authErr) {
      console.warn('user_metadata update note:', authErr.message);
    }
  }

  return {
    success: true,
    balance: targetBalance,
    previousBalance: currentBalance,
    diff,
    transaction
  };
}

/**
 * Fetches all customer wallets from database for financial ledger overview
 */
export async function getAllCustomerWallets() {
  try {
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .like('id', '_wallet_%');

    if (error) {
      console.error('getAllCustomerWallets error:', error);
      return [];
    }

    const wallets = [];
    const seenUids = new Set();
    const seenPhones = new Set();

    (data || []).forEach(row => {
      try {
        if (!row.name_ar) return;
        const parsed = JSON.parse(row.name_ar);
        if (!parsed || typeof parsed !== 'object') return;

        const uid = parsed.userId;
        const phone = parsed.phone ? normalizePhone(parsed.phone) : null;

        if (uid && seenUids.has(uid)) return;
        if (!uid && phone && seenPhones.has(phone)) return;

        if (uid) seenUids.add(uid);
        if (phone) seenPhones.add(phone);

        wallets.push({
          id: row.id,
          userId: uid,
          phone,
          email: parsed.email || null,
          balance: Math.max(0, Number(parsed.balance || 0)),
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          updatedAt: parsed.updatedAt || row.updated_at
        });
      } catch (e) {}
    });

    return wallets;
  } catch (err) {
    console.error('getAllCustomerWallets exception:', err);
    return [];
  }
}

