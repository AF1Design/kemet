'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { updateCustomerOrderAction } from '../../app/admin/actions';

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export function AdminOrderEditModal({ order, catalogProducts = [], isOpen, onClose, onOrderUpdated }) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState([]);
  const [shippingFee, setShippingFee] = useState(50);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add Product Sub-form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProductSize, setNewProductSize] = useState('M');
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [newProductCustomPrice, setNewProductCustomPrice] = useState('');

  const [isPending, startTransition] = useTransition();

  // Populate form on open
  useEffect(() => {
    if (order && isOpen) {
      const orderItems = (order.items || []).map((it, idx) => ({
        uniqueKey: `${it.id || it.product_id || 'item'}_${it.size || 'M'}_${idx}_${Date.now()}`,
        id: it.id || it.product_id || null,
        nameAr: it.nameAr || it.name_ar || it.title || 'منتج KEMET',
        nameEn: it.nameEn || it.name_en || '',
        size: String(it.size || 'M').trim(),
        quantity: Number(it.quantity || 1),
        price: Number(it.price !== undefined ? it.price : (it.unit_price || 0))
      }));

      setItems(orderItems);
      setShippingFee(Number(order.shipping_fee !== undefined ? order.shipping_fee : 50));
      setCustomerName(order.customer_name || order.customer?.fullName || '');
      setCustomerPhone(order.customer_phone || order.customer?.phone || '');
      setCustomerEmail(order.customer_email || order.customer?.email || '');
      setGovernorate(order.governorate || order.customer?.governorate || '');
      setAddress(order.address || order.customer?.address || '');
      setNotes(order.notes || order.delivery_notes || order.customer?.notes || '');
      setSendEmailNotification(Boolean(order.customer_email || order.customer?.email));
      setSaveError(null);

      // Default selected product for adding
      if (catalogProducts.length > 0) {
        setSelectedProductId(catalogProducts[0].id);
        const defaultProd = catalogProducts[0];
        const defaultSize = (defaultProd.variants && defaultProd.variants[0]?.size) || 'M';
        setNewProductSize(defaultSize);
        setNewProductQuantity(1);
        setNewProductCustomPrice(String(defaultProd.price || 470));
      }
    }
  }, [order, isOpen, catalogProducts]);

  if (!isOpen || !order || !mounted) return null;

  // Real-time calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const finalTotal = Math.max(0, subtotal + Math.max(0, Number(shippingFee || 0)));

  // Selected product object for dynamic sizes in "Add Product"
  const currentCatalogProduct = catalogProducts.find(p => String(p.id) === String(selectedProductId)) || catalogProducts[0];
  const availableVariants = (currentCatalogProduct?.variants || []).filter(v => v && v.size);
  const availableSizesForNewProduct = availableVariants.length > 0
    ? availableVariants.map(v => v.size)
    : DEFAULT_SIZES;

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const prod = catalogProducts.find(p => String(p.id) === String(productId));
    if (prod) {
      const firstSize = (prod.variants && prod.variants[0]?.size) || 'M';
      setNewProductSize(firstSize);
      setNewProductCustomPrice(String(prod.price || 470));
    }
  };

  // Item modifications
  const handleItemPriceChange = (uniqueKey, newPrice) => {
    const numericPrice = Math.max(0, Number(newPrice) || 0);
    setItems(prev => prev.map(item => item.uniqueKey === uniqueKey ? { ...item, price: numericPrice } : item));
  };

  const handleItemQuantityChange = (uniqueKey, delta) => {
    setItems(prev => prev.map(item => {
      if (item.uniqueKey === uniqueKey) {
        const nextQty = Math.max(1, Number(item.quantity || 1) + delta);
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const handleItemSizeChange = (uniqueKey, newSize) => {
    setItems(prev => prev.map(item => item.uniqueKey === uniqueKey ? { ...item, size: newSize } : item));
  };

  const handleRemoveItem = (uniqueKey) => {
    if (items.length <= 1) {
      if (!window.confirm('تنبيه: هذا هو المنتج الوحيد في الطلب. هل أنت متأكد من حذفه؟')) {
        return;
      }
    }
    setItems(prev => prev.filter(item => item.uniqueKey !== uniqueKey));
  };

  // Add new product from catalog to current order
  const handleAddProductToOrder = () => {
    if (!currentCatalogProduct) return;

    const unitPrice = Number(newProductCustomPrice) >= 0 ? Number(newProductCustomPrice) : Number(currentCatalogProduct.price || 470);
    const qty = Math.max(1, Number(newProductQuantity) || 1);

    const newItem = {
      uniqueKey: `added_${currentCatalogProduct.id}_${newProductSize}_${Date.now()}`,
      id: currentCatalogProduct.id,
      nameAr: currentCatalogProduct.nameAr || currentCatalogProduct.name_ar || 'منتج KEMET',
      nameEn: currentCatalogProduct.nameEn || currentCatalogProduct.name_en || '',
      size: newProductSize,
      quantity: qty,
      price: unitPrice
    };

    setItems(prev => [...prev, newItem]);
  };

  // Submit and Save
  const handleSaveOrder = () => {
    if (items.length === 0) {
      setSaveError('يجب أن يحتوي الطلب على منتج واحد على الأقل.');
      return;
    }

    setSaveError(null);

    startTransition(async () => {
      try {
        const payload = {
          orderId: order.id,
          customer: {
            fullName: customerName.trim(),
            phone: customerPhone.trim(),
            email: customerEmail.trim().toLowerCase(),
            governorate: governorate.trim(),
            address: address.trim(),
            notes: notes.trim()
          },
          items: items.map(it => ({
            id: it.id,
            nameAr: it.nameAr,
            nameEn: it.nameEn,
            size: it.size,
            quantity: Number(it.quantity || 1),
            price: Number(it.price || 0)
          })),
          shippingFee: Math.max(0, Number(shippingFee || 0)),
          sendNotificationEmail: Boolean(sendEmailNotification && customerEmail.includes('@')),
          isAdminEdit: true
        };

        const res = await updateCustomerOrderAction(payload);

        if (res.success) {
          if (onOrderUpdated) {
            onOrderUpdated({
              ...order,
              customer_name: customerName.trim(),
              customer_phone: customerPhone.trim(),
              customer_email: customerEmail.trim().toLowerCase(),
              governorate: governorate.trim(),
              address: address.trim(),
              notes: notes.trim(),
              subtotal: res.subtotal !== undefined ? res.subtotal : subtotal,
              shipping_fee: res.shippingFee !== undefined ? res.shippingFee : shippingFee,
              total_amount: res.totalAmount !== undefined ? res.totalAmount : finalTotal,
              items: payload.items,
              order_items: payload.items.map(it => ({
                product_id: it.id,
                product_name_ar: it.nameAr,
                product_name_en: it.nameEn,
                size: it.size,
                quantity: it.quantity,
                unit_price: it.price,
                total_price: it.price * it.quantity
              }))
            });
          }
          onClose();
        } else {
          setSaveError(res.error || 'فشل حفظ التعديلات.');
        }
      } catch (err) {
        setSaveError(err.message || 'حدث خطأ غير متوقع أثناء الحفظ.');
      }
    });
  };

  return createPortal(
    <div
      className="admin-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="admin-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
              تعديل تفاصيل وأسعار الطلب #{order.id}
            </h3>
            <span style={{ fontSize: '0.82rem', color: '#94A3B8' }}>
              العميل: {customerName || 'غير محدد'} | تحكم كامل في بنود الطلب، الأسعار، ومصاريف الشحن
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94A3B8',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="إغلاق النافذة"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="admin-modal-body">
          
          {saveError && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#F43F5E',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 700
            }}>
              {saveError}
            </div>
          )}

          {/* Section 1: Current Order Items Editor */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                منتجات الطلب الحالية ({items.length})
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                يمكنك كتابة أي سعر تريده لكل قطعة بحرية
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, index) => {
                const prodRef = catalogProducts.find(p => String(p.id) === String(item.id));
                const itemAvailableSizes = (prodRef?.variants || []).length > 0
                  ? prodRef.variants.map(v => v.size)
                  : DEFAULT_SIZES;

                const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);

                return (
                  <div
                    key={item.uniqueKey || index}
                    className="admin-modal-item-card"
                  >
                    {/* Product Name */}
                    <div style={{ flex: '1 1 180px' }}>
                      <div style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
                        {item.nameAr}
                      </div>
                      {item.nameEn && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {item.nameEn}
                        </div>
                      )}
                    </div>

                    {/* Controls Row (Size, Quantity, Price) */}
                    <div className="admin-item-controls-row">
                      {/* Size Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.2rem' }}>
                          المقاس
                        </label>
                        <select
                          value={item.size}
                          onChange={(e) => handleItemSizeChange(item.uniqueKey, e.target.value)}
                          style={{
                            background: '#131A2A',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#FFFFFF',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {itemAvailableSizes.map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Counter */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.2rem' }}>
                          الكمية
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item.uniqueKey, -1)}
                            style={{
                              background: '#1E293B',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#FFFFFF',
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: 900
                            }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 800, color: '#FFFFFF', fontSize: '0.9rem' }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item.uniqueKey, 1)}
                            style={{
                              background: '#1E293B',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#FFFFFF',
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: 900
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Unit Price Custom Input */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.2rem' }}>
                          سعر القطعة (ج.م)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemPriceChange(item.uniqueKey, e.target.value)}
                          style={{
                            width: '85px',
                            background: '#131A2A',
                            border: '1px solid var(--border-gold)',
                            color: 'var(--gold-primary)',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    </div>

                    {/* Line Total & Remove Action */}
                    <div className="admin-item-total-row" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ textAlign: 'left', minWidth: '70px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block' }}>الإجمالي</span>
                        <span style={{ fontWeight: 900, color: '#FFFFFF', fontSize: '0.95rem' }}>
                          {lineTotal} ج.م
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.uniqueKey)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.12)',
                          border: '1px solid rgba(244, 63, 94, 0.35)',
                          color: '#F43F5E',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="حذف هذا المنتج من الطلب"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Add New Product from Catalog */}
          <div
            style={{
              background: 'rgba(212, 175, 55, 0.04)',
              border: '1px dashed rgba(212, 175, 55, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}
          >
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--gold-primary)' }}>
              إضافة منتج جديد من الكتالوج لهذا الطلب
            </h4>

            <div className="admin-add-product-grid">
              {/* Select Product */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  اختر المنتج
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  {catalogProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} ({p.price} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Size */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  المقاس
                </label>
                <select
                  value={newProductSize}
                  onChange={(e) => setNewProductSize(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  {availableSizesForNewProduct.map(sz => (
                    <option key={sz} value={sz}>{sz}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  الكمية
                </label>
                <input
                  type="number"
                  min="1"
                  value={newProductQuantity}
                  onChange={(e) => setNewProductQuantity(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Custom Unit Price */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  سعر القطعة (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProductCustomPrice}
                  onChange={(e) => setNewProductCustomPrice(e.target.value)}
                  placeholder="سعر القطعة"
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid var(--border-gold)',
                    color: 'var(--gold-primary)',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}
                />
              </div>

              {/* Add Button */}
              <div>
                <button
                  type="button"
                  onClick={handleAddProductToOrder}
                  style={{
                    background: 'var(--gold-primary)',
                    color: '#000000',
                    border: 'none',
                    padding: '0.48rem 1.1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  إضافة للطلب
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Customer Information & Delivery Address */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
              بيانات التواصل والتسليم
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  اسم العميل
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  البريد الإلكتروني (لتلقي التحديثات)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  المحافظة
                </label>
                <input
                  type="text"
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  العنوان بالتفصيل
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#131A2A',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Financial Summary & Shipping Control */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(11, 15, 25, 0.95) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'block' }}>إجمالي المنتجات</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {subtotal} ج.م
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                  مصاريف الشحن (ج.م)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(Math.max(0, Number(e.target.value) || 0))}
                    style={{
                      width: '90px',
                      background: '#131A2A',
                      border: '1px solid var(--border-gold)',
                      color: 'var(--gold-primary)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShippingFee(0)}
                    style={{
                      background: Number(shippingFee) === 0 ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.08)',
                      color: Number(shippingFee) === 0 ? '#000000' : '#FFFFFF',
                      border: 'none',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    شحن مجاني
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', display: 'block', fontWeight: 700 }}>
                  المبلغ الإجمالي المطلوب تحصيله
                </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                  {finalTotal} ج.م
                </span>
              </div>
            </div>

            {/* Email Sync Toggle */}
            <div style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  disabled={!customerEmail.includes('@')}
                  style={{ width: '17px', height: '17px', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.88rem', color: '#FFFFFF', fontWeight: 700 }}>
                  إرسال إشعار فوري للعميل بالبريد الإلكتروني بتفاصيل البنود والأسعار المعدلة
                </span>
              </label>
              {!customerEmail.includes('@') && (
                <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '0.35rem', paddingRight: '1.65rem' }}>
                  تنبيه: لا يوجد بريد إلكتروني مسجل للعميل. أضف بريده أعلاه لتفعيل الإشعار المباشر.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="admin-modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94A3B8',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSaveOrder}
            disabled={isPending}
            style={{
              background: 'var(--gold-primary)',
              border: 'none',
              color: '#000000',
              padding: '0.65rem 1.65rem',
              borderRadius: '8px',
              fontSize: '0.92rem',
              fontWeight: 900,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isPending ? 'جاري حفظ ومزامنة التعديلات...' : 'حفظ وتأكيد التعديلات'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
