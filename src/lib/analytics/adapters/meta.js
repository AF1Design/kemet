function getFbq() {
  if (typeof window !== 'undefined') {
    if (typeof window.fbq === 'function') {
      return window.fbq;
    }
    if (typeof fbq === 'function') {
      return fbq;
    }
  }
  return null;
}

export const metaAdapter = {
  pageView() {
    const fbq = getFbq();
    if (fbq) {
      fbq('track', 'PageView');
    }
  },

  viewItem(product) {
    if (!product) return;
    const price = Number(product.price ?? 280);
    const fbq = getFbq();
    const payload = {
      content_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
      content_category: product.category || 'Activewear',
      content_ids: [String(product.id || '')],
      content_type: 'product',
      value: price,
      currency: 'EGP'
    };

    if (fbq) {
      console.log('META EVENT: ViewContent', payload);
      fbq('track', 'ViewContent', payload);
    }
  },

  addToCart(product, size = 'standard', quantity = 1) {
    if (!product) return;
    const price = Number(product.price ?? 280);
    const qty = Number(quantity || 1);
    const fbq = getFbq();
    const payload = {
      content_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
      content_category: product.category || 'Activewear',
      content_ids: [String(product.id || '')],
      content_type: 'product',
      value: price * qty,
      currency: 'EGP',
      num_items: qty
    };

    if (fbq) {
      console.log('META EVENT: AddToCart', payload);
      fbq('track', 'AddToCart', payload);
    }
  },

  beginCheckout(cartItems = [], totalAmount = 0) {
    const contentIds = cartItems.map(item => String(item.id || ''));
    const totalQty = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const fbq = getFbq();
    const payload = {
      content_ids: contentIds,
      content_type: 'product',
      value: Number(totalAmount || 0),
      currency: 'EGP',
      num_items: totalQty
    };

    if (fbq) {
      console.log('META EVENT: InitiateCheckout', payload);
      fbq('track', 'InitiateCheckout', payload);
    }
  },

  purchase(order) {
    if (!order) return;
    const contentIds = (order.items || []).map(item => String(item.id || item.product_id || ''));
    const totalValue = Number(order.total ?? order.total_amount ?? order.totalAmount ?? 0);
    const totalQty = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const fbq = getFbq();
    const payload = {
      content_ids: contentIds,
      content_type: 'product',
      value: totalValue,
      currency: 'EGP',
      num_items: totalQty,
      order_id: String(order.id || '')
    };

    if (fbq) {
      console.log('META EVENT: Purchase', payload);
      fbq('track', 'Purchase', payload, {
        eventID: String(order.id || '') // For deduplication with Meta CAPI
      });
    }
  },

  signUp(method = 'email_otp') {
    const fbq = getFbq();
    if (fbq) {
      fbq('track', 'CompleteRegistration', {
        status: true,
        content_name: method
      });
    }
  },

  search(searchTerm) {
    if (!searchTerm) return;
    const fbq = getFbq();
    if (fbq) {
      fbq('track', 'Search', {
        search_string: searchTerm,
        content_category: 'Product Search'
      });
    }
  }
};
