/**
 * KEMET Unified Marketing Analytics Layer
 * Dispatches standard e-commerce events across GA4, GTM, Meta Pixel, and TikTok Pixel.
 * All tracking calls are non-blocking, error-safe, and respect strict deduplication.
 */

import { ga4Adapter } from './adapters/ga4';
import { metaAdapter } from './adapters/meta';
import { tiktokAdapter } from './adapters/tiktok';
import { isPurchaseAlreadyTracked, markPurchaseAsTracked, shouldAllowAddToCart } from './deduplication';

/**
 * 1. Page View Event
 */
export function trackPageView(url, title) {
  try {
    ga4Adapter.pageView(url, title);
    metaAdapter.pageView();
    tiktokAdapter.pageView();
  } catch (err) {
    // Fail silently in production to avoid affecting user experience
  }
}

/**
 * 2. View Item / View Content Event
 */
export function trackViewItem(product) {
  if (!product) return;
  try {
    ga4Adapter.viewItem(product);
    metaAdapter.viewItem(product);
    tiktokAdapter.viewItem(product);
  } catch (err) {}
}

/**
 * 3. Add to Cart Event (with rapid-click debouncing)
 */
export function trackAddToCart(product, size = 'standard', quantity = 1) {
  if (!product) return;
  const prodId = String(product.id || '');
  if (!shouldAllowAddToCart(prodId, size)) return;

  try {
    ga4Adapter.addToCart(product, size, quantity);
    metaAdapter.addToCart(product, size, quantity);
    tiktokAdapter.addToCart(product, size, quantity);
  } catch (err) {}
}

/**
 * 4. Remove from Cart Event
 */
export function trackRemoveFromCart(item) {
  if (!item) return;
  try {
    ga4Adapter.removeFromCart(item);
  } catch (err) {}
}

/**
 * 5. Begin Checkout / Initiate Checkout Event
 */
export function trackBeginCheckout(cartItems = [], totalAmount = 0) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return;
  try {
    ga4Adapter.beginCheckout(cartItems, totalAmount);
    metaAdapter.beginCheckout(cartItems, totalAmount);
    tiktokAdapter.beginCheckout(cartItems, totalAmount);
  } catch (err) {}
}

/**
 * 6. Purchase / Complete Payment Event (STRICT DEDUPLICATION BY ORDER ID)
 */
export function trackPurchase(order) {
  if (!order || !order.id) return;
  const orderId = String(order.id).trim();

  // Guard: Never fire duplicate purchase for the same order ID
  if (isPurchaseAlreadyTracked(orderId)) {
    return;
  }

  // Mark order as tracked immediately
  markPurchaseAsTracked(orderId);

  try {
    ga4Adapter.purchase(order);
    metaAdapter.purchase(order);
    tiktokAdapter.purchase(order);
  } catch (err) {}
}

/**
 * 7. Sign Up / Complete Registration Event
 */
export function trackSignUp(method = 'email_otp') {
  try {
    ga4Adapter.signUp(method);
    metaAdapter.signUp(method);
    tiktokAdapter.signUp(method);
  } catch (err) {}
}

/**
 * 8. Login Event
 */
export function trackLogin(method = 'password_or_otp') {
  try {
    ga4Adapter.login(method);
  } catch (err) {}
}

/**
 * 9. Search Event
 */
export function trackSearch(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) return;
  const term = searchTerm.trim();
  try {
    ga4Adapter.search(term);
    metaAdapter.search(term);
    tiktokAdapter.search(term);
  } catch (err) {}
}
