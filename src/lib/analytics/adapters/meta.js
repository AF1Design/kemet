/**
 * Meta (Facebook/Instagram) Pixel & Conversions API (CAPI) Client Adapter
 * Standard Meta Pixel Events:
 * https://developers.facebook.com/docs/meta-pixel/reference
 */

function isFbqAvailable() {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

export const metaAdapter = {
  pageView() {
    if (isFbqAvailable()) {
      window.fbq('track', 'PageView');
    }
  },

  viewItem(product) {
    if (!product) return;
    const price = Number(product.price ?? 280);

    if (isFbqAvailable()) {
      window.fbq('track', 'ViewContent', {
        content_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
        content_category: product.category || 'Activewear',
        content_ids: [String(product.id || '')],
        content_type: 'product',
        value: price,
        currency: 'EGP'
      });
    }
  },

  addToCart(product, size = 'standard', quantity = 1) {
    if (!product) return;
    const price = Number(product.price ?? 280);
    const qty = Number(quantity || 1);

    if (isFbqAvailable()) {
      window.fbq('track', 'AddToCart', {
        content_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
        content_category: product.category || 'Activewear',
        content_ids: [String(product.id || '')],
        content_type: 'product',
        value: price * qty,
        currency: 'EGP',
        num_items: qty
      });
    }
  },

  beginCheckout(cartItems = [], totalAmount = 0) {
    const contentIds = cartItems.map(item => String(item.id || ''));
    const totalQty = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    if (isFbqAvailable()) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: contentIds,
        content_type: 'product',
        value: Number(totalAmount || 0),
        currency: 'EGP',
        num_items: totalQty
      });
    }
  },

  purchase(order) {
    if (!order) return;
    const contentIds = (order.items || []).map(item => String(item.id || item.product_id || ''));
    const totalValue = Number(order.total ?? order.total_amount ?? order.totalAmount ?? 0);
    const totalQty = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

    if (isFbqAvailable()) {
      window.fbq('track', 'Purchase', {
        content_ids: contentIds,
        content_type: 'product',
        value: totalValue,
        currency: 'EGP',
        num_items: totalQty,
        order_id: String(order.id || '')
      }, {
        eventID: String(order.id || '') // For deduplication with Meta CAPI
      });
    }
  },

  signUp(method = 'email_otp') {
    if (isFbqAvailable()) {
      window.fbq('track', 'CompleteRegistration', {
        status: true,
        content_name: method
      });
    }
  },

  search(searchTerm) {
    if (!searchTerm) return;
    if (isFbqAvailable()) {
      window.fbq('track', 'Search', {
        search_string: searchTerm,
        content_category: 'Product Search'
      });
    }
  }
};
