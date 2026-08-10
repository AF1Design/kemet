/**
 * Google Analytics 4 (GA4) & Google Tag Manager (GTM) Adapter
 * Standard GA4 Ecommerce Protocol:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

function isGtagAvailable() {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

function pushToDataLayer(eventData) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);
  }
}

export const ga4Adapter = {
  pageView(url, title) {
    if (isGtagAvailable()) {
      window.gtag('event', 'page_view', {
        page_location: url || (typeof window !== 'undefined' ? window.location.href : ''),
        page_title: title || (typeof document !== 'undefined' ? document.title : ''),
      });
    }
    pushToDataLayer({
      event: 'page_view',
      page_location: url,
      page_title: title
    });
  },

  viewItem(product) {
    if (!product) return;
    const price = Number(product.price ?? 280);
    const itemData = {
      item_id: String(product.id || ''),
      item_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
      item_category: product.category || 'Activewear',
      price: price,
      quantity: 1,
    };

    if (isGtagAvailable()) {
      window.gtag('event', 'view_item', {
        currency: 'EGP',
        value: price,
        items: [itemData]
      });
    }
    pushToDataLayer({
      event: 'view_item',
      ecommerce: {
        currency: 'EGP',
        value: price,
        items: [itemData]
      }
    });
  },

  addToCart(product, size = 'standard', quantity = 1) {
    if (!product) return;
    const price = Number(product.price ?? 280);
    const qty = Number(quantity || 1);
    const itemData = {
      item_id: String(product.id || ''),
      item_name: product.nameAr || product.nameEn || product.name || 'منتج KEMET',
      item_category: product.category || 'Activewear',
      item_variant: size,
      price: price,
      quantity: qty
    };

    if (isGtagAvailable()) {
      window.gtag('event', 'add_to_cart', {
        currency: 'EGP',
        value: price * qty,
        items: [itemData]
      });
    }
    pushToDataLayer({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'EGP',
        value: price * qty,
        items: [itemData]
      }
    });
  },

  removeFromCart(item) {
    if (!item) return;
    const price = Number(item.price ?? 280);
    const qty = Number(item.quantity || 1);
    const itemData = {
      item_id: String(item.id || ''),
      item_name: item.nameAr || item.nameEn || item.name || 'منتج KEMET',
      item_category: item.category || 'Activewear',
      item_variant: item.size || 'standard',
      price: price,
      quantity: qty
    };

    if (isGtagAvailable()) {
      window.gtag('event', 'remove_from_cart', {
        currency: 'EGP',
        value: price * qty,
        items: [itemData]
      });
    }
    pushToDataLayer({
      event: 'remove_from_cart',
      ecommerce: {
        currency: 'EGP',
        value: price * qty,
        items: [itemData]
      }
    });
  },

  beginCheckout(cartItems = [], totalAmount = 0) {
    const items = cartItems.map(item => ({
      item_id: String(item.id || ''),
      item_name: item.nameAr || item.nameEn || item.name || 'منتج KEMET',
      item_category: item.category || 'Activewear',
      item_variant: item.size || 'standard',
      price: Number(item.price ?? 280),
      quantity: Number(item.quantity || 1)
    }));

    if (isGtagAvailable()) {
      window.gtag('event', 'begin_checkout', {
        currency: 'EGP',
        value: Number(totalAmount || 0),
        items: items
      });
    }
    pushToDataLayer({
      event: 'begin_checkout',
      ecommerce: {
        currency: 'EGP',
        value: Number(totalAmount || 0),
        items: items
      }
    });
  },

  purchase(order) {
    if (!order) return;
    const orderItems = (order.items || []).map(item => ({
      item_id: String(item.id || ''),
      item_name: item.nameAr || item.nameEn || item.name || 'منتج KEMET',
      item_category: item.category || 'Activewear',
      item_variant: item.size || 'standard',
      price: Number(item.price || item.unit_price || 280),
      quantity: Number(item.quantity || 1)
    }));

    const totalValue = Number(order.total ?? order.total_amount ?? order.totalAmount ?? 0);
    const shipping = Number(order.shipping ?? order.shipping_fee ?? 50);

    if (isGtagAvailable()) {
      window.gtag('event', 'purchase', {
        transaction_id: String(order.id || ''),
        currency: 'EGP',
        value: totalValue,
        shipping: shipping,
        items: orderItems
      });
    }
    pushToDataLayer({
      event: 'purchase',
      ecommerce: {
        transaction_id: String(order.id || ''),
        currency: 'EGP',
        value: totalValue,
        shipping: shipping,
        items: orderItems
      }
    });
  },

  signUp(method = 'email_otp') {
    if (isGtagAvailable()) {
      window.gtag('event', 'sign_up', { method });
    }
    pushToDataLayer({ event: 'sign_up', method });
  },

  login(method = 'password_or_otp') {
    if (isGtagAvailable()) {
      window.gtag('event', 'login', { method });
    }
    pushToDataLayer({ event: 'login', method });
  },

  search(searchTerm) {
    if (!searchTerm) return;
    if (isGtagAvailable()) {
      window.gtag('event', 'search', { search_term: searchTerm });
    }
    pushToDataLayer({ event: 'search', search_term: searchTerm });
  }
};
