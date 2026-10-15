import { getAdminSupabase } from './supabase/admin.js';
import { normalizePhone } from './wallet.js';

export { normalizePhone };

const BLACKLIST_CONFIG_ID = 'blacklist_config';

/**
 * Fetches the complete blacklist array from Supabase categories table
 */
export async function getBlacklistData() {
  try {
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', BLACKLIST_CONFIG_ID)
      .maybeSingle();

    if (!error && data && data.name_ar) {
      const parsed = JSON.parse(data.name_ar);
      if (Array.isArray(parsed)) {
        return { success: true, blacklist: parsed };
      }
    }
  } catch (err) {
    console.warn('getBlacklistData note:', err);
  }
  return { success: true, blacklist: [] };
}

/**
 * Saves the complete blacklist array to Supabase
 */
export async function saveBlacklistData(blacklistArray) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanList = Array.isArray(blacklistArray) ? blacklistArray : [];
    const cleanJson = JSON.stringify(cleanList);

    const { error } = await supabaseAdmin
      .from('categories')
      .upsert({
        id: BLACKLIST_CONFIG_ID,
        name_ar: cleanJson,
        name_en: 'BLACKLIST_CONFIG',
        description_ar: 'قائمة العملاء المحظورين من استخدام كوبونات الخصم',
        description_en: 'JSON_CONFIG'
      }, { onConflict: 'id' });

    if (error) {
      console.error('saveBlacklistData DB error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('saveBlacklistData exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Checks whether a given customer (by phone, email, or userId) is in the blacklist
 */
export async function isCustomerBlacklisted({ phone = null, email = null, userId = null }) {
  try {
    const { blacklist } = await getBlacklistData();
    if (!blacklist || blacklist.length === 0) {
      return { isBlacklisted: false, entry: null };
    }

    const cleanPhone = normalizePhone(phone);
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanUid = userId ? String(userId).trim() : '';

    const entry = blacklist.find(item => {
      const itemPhone = normalizePhone(item.phone);
      if (cleanPhone && itemPhone && cleanPhone === itemPhone) return true;

      const itemEmail = item.email ? String(item.email).trim().toLowerCase() : '';
      if (cleanEmail && itemEmail && cleanEmail === itemEmail) return true;

      const itemUid = item.userId ? String(item.userId).trim() : '';
      if (cleanUid && itemUid && cleanUid === itemUid) return true;

      return false;
    });

    if (entry) {
      return { isBlacklisted: true, entry };
    }
  } catch (err) {
    console.warn('isCustomerBlacklisted check error:', err);
  }
  return { isBlacklisted: false, entry: null };
}

/**
 * Adds or updates a customer in the blacklist
 */
export async function addCustomerToBlacklist({
  phone,
  name = '',
  email = '',
  reason = 'رفض الاستلام بعد الشحن بدون سبب',
  orderId = '',
  orderAmount = 0,
  governorate = '',
  address = '',
  notes = '',
  addedBy = 'لوحة التحكم'
}) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) {
    return { success: false, error: 'رقم الهاتف غير صحيح' };
  }

  const { blacklist } = await getBlacklistData();
  const list = [...blacklist];

  const nowIso = new Date().toISOString();
  const existingIndex = list.findIndex(item => normalizePhone(item.phone) === cleanPhone);

  const entryData = {
    phone: cleanPhone,
    name: String(name || '').trim(),
    email: email ? String(email).trim().toLowerCase() : '',
    reason: String(reason || 'رفض الاستلام بعد الشحن بدون سبب').trim(),
    orderId: orderId ? String(orderId).trim() : '',
    orderAmount: Number(orderAmount || 0),
    governorate: String(governorate || '').trim(),
    address: String(address || '').trim(),
    notes: String(notes || '').trim(),
    blockedActions: ['coupons'],
    addedAt: existingIndex >= 0 ? (list[existingIndex].addedAt || nowIso) : nowIso,
    updatedAt: nowIso,
    addedBy: String(addedBy || 'لوحة التحكم').trim()
  };

  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...entryData };
  } else {
    list.unshift(entryData);
  }

  const saveRes = await saveBlacklistData(list);
  if (!saveRes.success) {
    return saveRes;
  }

  return { success: true, entry: entryData, total: list.length };
}

/**
 * Removes a customer from the blacklist by phone
 */
export async function removeCustomerFromBlacklist(phone) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) {
    return { success: false, error: 'رقم الهاتف غير محدد' };
  }

  const { blacklist } = await getBlacklistData();
  const filtered = blacklist.filter(item => normalizePhone(item.phone) !== cleanPhone);

  const saveRes = await saveBlacklistData(filtered);
  if (!saveRes.success) {
    return saveRes;
  }

  return { success: true, removedPhone: cleanPhone, total: filtered.length };
}
