/**
 * KEMET Marketing Analytics - Deduplication & Idempotency Layer
 * Prevents duplicate event triggers (especially Purchase) caused by re-renders, back/forward navigation, or page refreshes.
 */

const inMemoryPurchases = new Set();
const lastCartAddEvents = new Map();

/**
 * Checks if a specific order ID has already fired a Purchase event.
 * @param {string} orderId 
 * @returns {boolean}
 */
export function isPurchaseAlreadyTracked(orderId) {
  if (!orderId || typeof orderId !== 'string' || !orderId.trim()) return false;
  const key = String(orderId).trim();
  
  // 1. Check in-memory session registry
  if (inMemoryPurchases.has(key)) {
    return true;
  }

  // 2. Check browser sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(`kemet_tracked_purchase_${key}`);
      if (stored === '1') {
        inMemoryPurchases.add(key);
        return true;
      }
    } catch (e) {
      // Ignore sessionStorage security/quota errors
    }
  }

  return false;
}

/**
 * Marks an order ID as tracked to prevent subsequent duplicate Purchase events.
 * @param {string} orderId 
 */
export function markPurchaseAsTracked(orderId) {
  if (!orderId) return;
  const key = String(orderId).trim();
  inMemoryPurchases.add(key);

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(`kemet_tracked_purchase_${key}`, '1');
    } catch (e) {
      // Ignore sessionStorage errors
    }
  }
}

/**
 * Debounces rapid consecutive AddToCart clicks for the exact same product & size within 1.2 seconds.
 * @param {string} productId 
 * @param {string} size 
 * @returns {boolean} true if allowed, false if debounced duplicate
 */
export function shouldAllowAddToCart(productId, size = 'standard') {
  const key = `${productId}_${size}`;
  const now = Date.now();
  const lastTime = lastCartAddEvents.get(key) || 0;

  if (now - lastTime < 1200) {
    return false; // Debounced
  }

  lastCartAddEvents.set(key, now);
  return true;
}
