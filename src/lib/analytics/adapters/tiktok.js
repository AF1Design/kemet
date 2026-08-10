/**
 * TikTok Pixel & Events API Adapter
 * Standard TikTok Pixel Events:
 * https://ads.tiktok.com/help/article/standard-events-reference
 */

function isTtqAvailable() {
  return typeof window !== 'undefined' && typeof window.ttq === 'object' && typeof window.ttq.track === 'function';
}

export const tiktokAdapter = {
  pageView() {
    if (isTtqAvailable()) {
      window.ttq.page();
    }
  },

  viewItem(product) {
    if (!product) return;
    const price = Number(product.price ?? 280);

    if (isTtqAvailable()) {
      window.ttq.track('ViewContent', {
        content_id: String(product.id || ''),
        content_type: 'product',
        content_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
        content_category: product.category || 'Activewear',
        price: price,
        value: price,
        currency: 'EGP'
      });
    }
  },

  addToCart(product, size = 'standard', quantity = 1) {
    if (!product) return;
    const price = Number(product.price ?? 280);
    const qty = Number(quantity || 1);

    if (isTtqAvailable()) {
      window.ttq.track('AddToCart', {
        content_id: String(product.id || ''),
        content_type: 'product',
        content_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
        content_category: product.category || 'Activewear',
        quantity: qty,
        price: price,
        value: price * qty,
        currency: 'EGP'
      });
    }
  },

  beginCheckout(cartItems = [], totalAmount = 0) {
    const contents = cartItems.map(item => ({
      content_id: String(item.id || ''),
      content_type: 'product',
      content_name: item.nameAr || item.nameEn || item.name || 'منتج KEMET',
      quantity: Number(item.quantity || 1),
      price: Number(item.price ?? 280)
    }));

    if (isTtqAvailable()) {
      window.ttq.track('InitiateCheckout', {
        contents: contents,
        value: Number(totalAmount || 0),
        currency: 'EGP'
      });
    }
  },

  purchase(order) {
    if (!order) return;
    const contents = (order.items || []).map(item => ({
      content_id: String(item.id || item.product_id || ''),
      content_type: 'product',
      content_name: item.nameAr || item.nameEn || item.name || 'منتج KEMET',
      quantity: Number(item.quantity || 1),
      price: Number(item.price || item.unit_price || 280)
    }));

    const totalValue = Number(order.total ?? order.total_amount ?? order.totalAmount ?? 0);

    if (isTtqAvailable()) {
      window.ttq.track('CompletePayment', {
        contents: contents,
        value: totalValue,
        currency: 'EGP'
      }, {
        event_id: String(order.id || '') // For deduplication with TikTok Events API
      });
    }
  },

  signUp(method = 'email_otp') {
    if (isTtqAvailable()) {
      window.ttq.track('CompleteRegistration', {
        description: method
      });
    }
  },

  search(searchTerm) {
    if (!searchTerm) return;
    if (isTtqAvailable()) {
      window.ttq.track('Search', {
        query: searchTerm
      });
    }
  }
};
