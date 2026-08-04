'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  createProductAction, 
  updateProductAction, 
  saveProductBatchAction,
  toggleProductActiveAction, 
  deleteProductAction,
  updateProductInventoryAction,
  createCategoryAction,
  updateCategoryAction
} from '../../app/admin/actions';

export function ProductTable({ initialProducts, categories: initialCategories }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [categoriesList, setCategoriesList] = useState(initialCategories || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = add new, object = edit

  // New Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [catError, setCatError] = useState(null);

  // Dynamic Custom Size Input State for Product Modal
  const [customSizeCode, setCustomSizeCode] = useState('');
  const [customSizeStock, setCustomSizeStock] = useState(50);

  // Form State with 4 Images & Dynamic Custom Size Variants Array
  const [formData, setFormData] = useState({
    id: '',
    categoryId: 'kits',
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: 280,
    oldPrice: '',
    mainImage: '/assets/kemet-hero-banner.jpg',
    galleryImage1: '',
    galleryImage2: '',
    galleryImage3: '',
    isBestSeller: false,
    isNew: true,
    isActive: true,
    sizeVariants: [
      { size: 'S', stockQuantity: 50 },
      { size: 'M', stockQuantity: 50 },
      { size: 'L', stockQuantity: 50 },
      { size: 'XL', stockQuantity: 50 },
      { size: 'XXL', stockQuantity: 50 }
    ]
  });

  const [formError, setFormError] = useState(null);

  // Lock body scroll when any modal is active to prevent background shifting
  useEffect(() => {
    if (isModalOpen || isCategoryModalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'unset';
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.documentElement.style.overflow = 'unset';
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isCategoryModalOpen]);

  // Extract variants array for display
  const getProductVariants = (prod) => {
    if (!prod || !Array.isArray(prod.product_variants)) {
      return [
        { size: 'M', stock_quantity: 50 },
        { size: 'L', stock_quantity: 50 },
        { size: 'XL', stock_quantity: 50 },
        { size: 'XXL', stock_quantity: 50 }
      ];
    }
    return prod.product_variants;
  };

  // Filter products by search query
  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
      (p.name_en && p.name_en.toLowerCase().includes(q))
    );
  });

  // Open Add New Product Modal
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      id: `kit-${Date.now()}`,
      categoryId: categoriesList[0]?.id || 'kits',
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      price: 280,
      oldPrice: '', // Optional!
      mainImage: '/assets/kemet-hero-banner.jpg',
      galleryImage1: '',
      galleryImage2: '',
      galleryImage3: '',
      isFeatured: false,
      isBestSeller: false,
      isNew: true,
      isActive: true,
      sizeVariants: [
        { size: 'M', stockQuantity: 50 },
        { size: 'L', stockQuantity: 50 },
        { size: 'XL', stockQuantity: 50 },
        { size: 'XXL', stockQuantity: 50 }
      ]
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal with ACTUAL dynamic variant stock quantities & 4 gallery images
  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);

    const gallery = prod.gallery_images || [];
    const dbVariants = getProductVariants(prod);

    const mappedVariants = dbVariants.map(v => ({
      size: v.size,
      stockQuantity: Number(v.stock_quantity ?? 50)
    }));

    setFormData({
      id: prod.id,
      categoryId: prod.category_id || categoriesList[0]?.id || 'kits',
      nameAr: prod.name_ar || '',
      nameEn: prod.name_en || '',
      descriptionAr: prod.description_ar || '',
      descriptionEn: prod.description_en || '',
      price: prod.price || 280,
      oldPrice: prod.old_price || '', // Optional!
      mainImage: prod.main_image || '',
      galleryImage1: gallery[1] || '',
      galleryImage2: gallery[2] || '',
      galleryImage3: gallery[3] || '',
      isFeatured: Boolean(
        prod.is_featured || 
        prod.isFeatured || 
        (Array.isArray(prod.keywords) && prod.keywords.includes('IS_FEATURED_GOLD'))
      ),
      isBestSeller: prod.is_best_seller ?? false,
      isNew: prod.is_new ?? true,
      isActive: prod.is_active ?? true,
      sizeVariants: mappedVariants
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Add Custom Size Variant
  const handleAddCustomSize = () => {
    if (!customSizeCode.trim()) return;
    const cleanSize = customSizeCode.trim().toUpperCase();

    setFormData(prev => {
      const exists = prev.sizeVariants.some(v => v.size === cleanSize);
      if (exists) {
        return {
          ...prev,
          sizeVariants: prev.sizeVariants.map(v => v.size === cleanSize ? { ...v, stockQuantity: Number(customSizeStock) } : v)
        };
      }
      return {
        ...prev,
        sizeVariants: [...prev.sizeVariants, { size: cleanSize, stockQuantity: Number(customSizeStock) }]
      };
    });

    setCustomSizeCode('');
    setCustomSizeStock(50);
  };

  // Remove Size Variant
  const handleRemoveSize = (sizeCode) => {
    setFormData(prev => ({
      ...prev,
      sizeVariants: prev.sizeVariants.filter(v => v.size !== sizeCode)
    }));
  };

  // Update Size Stock
  const handleUpdateSizeStock = (sizeCode, newStock) => {
    setFormData(prev => ({
      ...prev,
      sizeVariants: prev.sizeVariants.map(v => v.size === sizeCode ? { ...v, stockQuantity: Number(newStock) } : v)
    }));
  };

  // Toggle Active Status
  const handleToggleActive = (productId, currentStatus) => {
    startTransition(async () => {
      const res = await toggleProductActiveAction(productId, currentStatus);
      if (res.success) {
        setProducts(prev =>
          prev.map(p => p.id === productId ? { ...p, is_active: res.newStatus } : p)
        );
      } else {
        alert(res.error || 'حدث خطأ أثناء تعديل حالة التفعيل');
      }
    });
  };

  const handleDeleteProduct = (productId, productName) => {
    const confirmDelete = window.confirm(`هل أنت تأكد من رغبتك في حذف المنتج "${productName}" نهائياً من قاعدة البيانات والدكان؟\nهذا الإجراء لا يمكن التراجع عنه.`);
    if (!confirmDelete) return;

    startTransition(async () => {
      const res = await deleteProductAction(productId);
      if (res.success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        alert(`تم حذف المنتج "${productName}" نهائياً بنجاح 🗑️`);
      } else {
        alert(`فشل حذف المنتج: ${res.error}`);
      }
    });
  };

  // Helper to handle local file uploads and convert to Data URL
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Create New Category Submit
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    setCatError(null);

    if (!newCatId.trim() || !newCatNameAr.trim()) {
      setCatError('يرجى ملء معرف القسم واسم القسم بالعربي');
      return;
    }

    startTransition(async () => {
      const res = await createCategoryAction(newCatId, newCatNameAr, newCatNameEn);
      if (res.success) {
        setCategoriesList(prev => [...prev, res.category]);
        setFormData(prev => ({ ...prev, categoryId: res.category.id }));
        setIsCategoryModalOpen(false);
        setNewCatId('');
        setNewCatNameAr('');
        setNewCatNameEn('');
      } else {
        setCatError(res.error);
      }
    });
  };

  // Edit Existing Category Submit
  const handleEditCategorySubmit = (catId, oldNameAr, oldNameEn) => {
    const newAr = window.prompt(`تعديل الاسم بالعربي للقسم (${catId}):`, oldNameAr);
    if (newAr === null || !newAr.trim()) return;
    const newEn = window.prompt(`تعديل الاسم بالإنجليزي للقسم (${catId}):`, oldNameEn || newAr);

    startTransition(async () => {
      const res = await updateCategoryAction(catId, newAr, newEn || newAr);
      if (res.success) {
        setCategoriesList(prev => prev.map(c => c.id === catId ? res.category : c));
        alert(`تم تعديل اسم القسم (${catId}) إلى: "${newAr}" بنجاح 🏷️`);
      } else {
        alert(`فشل تعديل الاسم: ${res.error}`);
      }
    });
  };

  // Submit Product Form (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nameAr.trim() || !formData.price || !formData.mainImage.trim()) {
      setFormError('يرجى ملء اسم المنتج، السعر، والصورة الرئيسية الأولى (Front)');
      return;
    }

    // Construct 4 gallery images array
    const galleryImages = [
      formData.mainImage,
      formData.galleryImage1,
      formData.galleryImage2,
      formData.galleryImage3
    ].filter(Boolean);

    const parsedOldPrice = formData.oldPrice ? Number(formData.oldPrice) : null;

    startTransition(async () => {
      const productPayload = {
        id: editingProduct ? editingProduct.id : formData.id,
        categoryId: formData.categoryId,
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        descriptionAr: formData.descriptionAr,
        descriptionEn: formData.descriptionEn,
        price: Number(formData.price),
        oldPrice: parsedOldPrice,
        mainImage: formData.mainImage,
        galleryImages: galleryImages,
        isBestSeller: formData.isBestSeller,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        isActive: formData.isActive
      };

      const res = await saveProductBatchAction(productPayload, formData.sizeVariants, Boolean(editingProduct));

      if (res.success) {
        const updatedVariants = formData.sizeVariants.map(v => ({
          product_id: productPayload.id,
          size: v.size,
          stock_quantity: Number(v.stockQuantity)
        }));

        if (editingProduct) {
          setProducts(prev =>
            prev.map(p => p.id === editingProduct.id ? { 
              ...p, 
              ...res.product, 
              price: Number(formData.price),
              old_price: parsedOldPrice,
              is_best_seller: formData.isBestSeller,
              is_featured: formData.isFeatured,
              isFeatured: formData.isFeatured,
              is_new: formData.isNew,
              gallery_images: galleryImages,
              product_variants: updatedVariants 
            } : p)
          );
        } else {
          setProducts(prev => [{ 
            ...res.product, 
            price: Number(formData.price),
            old_price: parsedOldPrice,
            is_best_seller: formData.isBestSeller,
            is_featured: formData.isFeatured,
            isFeatured: formData.isFeatured,
            is_new: formData.isNew,
            gallery_images: galleryImages, 
            product_variants: updatedVariants 
          }, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        setFormError(res.error || 'حدث خطأ في حفظ البيانات');
      }
    });
  };

  return (
    <div>
      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 ابحث برقم المنتج أو الاسم (مثال: ريال مدريد)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.8rem 1.25rem', width: '320px', fontSize: '0.95rem' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn-secondary" onClick={() => setIsCategoryModalOpen(true)} style={{ padding: '0.8rem 1.25rem' }}>
            🏷️ إضافة قسم جديد
          </button>
          <button type="button" className="btn-primary" onClick={handleOpenAddModal} style={{ padding: '0.8rem 1.5rem' }}>
            ➕ إضافة منتج جديد للكتالوج
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)' }}>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>الصورة</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>اسم المنتج</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>الفئة</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>السعر الحالي</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>المخزون المتوفر</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)' }}>الحالة</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gold-primary)', textAlign: 'center' }}>التحكم الإداري</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  لا توجد منتجات مطابقة لعملية البحث
                </td>
              </tr>
            ) : (
              filteredProducts.map(prod => {
                const variants = getProductVariants(prod);
                const totalStock = variants.reduce((sum, v) => sum + Number(v.stock_quantity ?? 0), 0);

                return (
                  <tr key={prod.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: prod.is_active ? 1 : 0.6 }}>
                    <td style={{ padding: '0.85rem' }}>
                      <img src={prod.main_image} alt={prod.name_ar} style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    </td>
                    <td style={{ padding: '0.85rem', fontWeight: 800 }}>
                      <div>
                        {prod.name_ar}{' '}
                        {(prod.is_featured || prod.isFeatured || (Array.isArray(prod.keywords) && prod.keywords.includes('IS_FEATURED_GOLD'))) && <span title="منتج مميز VIP Gold Card" style={{ color: '#FFDF73', fontSize: '0.82rem', background: 'rgba(212,175,55,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>👑 مميز</span>}{' '}
                        {prod.is_best_seller && <span title="الأكثر مبيعاً">🔥</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{prod.name_en}</div>
                    </td>
                    <td style={{ padding: '0.85rem', fontSize: '0.85rem' }}>
                      <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-sm)', color: 'var(--gold-primary)' }}>
                        {prod.category_id}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem', fontWeight: 800 }}>
                      <span style={{ color: 'var(--gold-primary)', fontSize: '1rem' }}>{prod.price} ج.م</span>
                      {prod.old_price && (
                        <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                          {prod.old_price} ج.م
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {variants.map(v => {
                          const st = Number(v.stock_quantity ?? 0);
                          return (
                            <span key={v.size} style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', background: st === 0 ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.05)', color: st === 0 ? '#F43F5E' : '#fff' }}>
                              {v.size}: {st}
                            </span>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: totalStock === 0 ? '#F43F5E' : 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 800 }}>
                        {totalStock === 0 ? '⚠️ انتهى المخزون بالكامل' : `إجمالي القطع: ${totalStock}`}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod.id, prod.is_active)}
                          disabled={isPending}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            background: prod.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: prod.is_active ? '#10B981' : '#F43F5E'
                          }}
                        >
                          {prod.is_active ? '🟢 نشط' : '🔴 معطل'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id, prod.name_ar)}
                          disabled={isPending}
                          title="حذف المنتج نهائياً من قاعدة البيانات"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(244,63,94,0.4)',
                            cursor: 'pointer',
                            background: 'rgba(244,63,94,0.1)',
                            color: '#F43F5E'
                          }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleOpenEditModal(prod)}
                        style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                      >
                        ⚙️ تعديل وتحديث المخزون
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add New Category Modal Dialog */}
      {isCategoryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 12, 0.96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.25rem', color: 'var(--gold-primary)' }}>
              🏷️ إضافة قسم جديد لكتالوج المتجر
            </h3>

            {catError && (
              <div style={{ color: '#F43F5E', background: 'rgba(244,63,94,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {catError}
              </div>
            )}

            <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>معرف القسم بالإنكليزي (ID / Slug)</label>
                <input 
                  type="text" 
                  placeholder="مثال: shoes أو accessories" 
                  value={newCatId} 
                  onChange={e => setNewCatId(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.75rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>اسم القسم بالعربي</label>
                <input 
                  type="text" 
                  placeholder="مثال: الأحذية الرياضية" 
                  value={newCatNameAr} 
                  onChange={e => setNewCatNameAr(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.75rem' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>اسم القسم بالإنكليزي (اختياري)</label>
                <input 
                  type="text" 
                  placeholder="مثال: Sports Shoes" 
                  value={newCatNameEn} 
                  onChange={e => setNewCatNameEn(e.target.value)} 
                  style={{ width: '100%', padding: '0.75rem' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ padding: '0.75rem 1.5rem' }}>
                  {isPending ? 'جاري الإضافة...' : 'حفظ القسم الجديد 🏷️'}
                </button>
              </div>
            </form>

            {/* Existing Categories Editor List */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '1rem' }}>
                🏷️ إدارة وتعديل أسماء الأقسام الحالية ({categoriesList.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                {categoriesList.map(cat => (
                  <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FFF' }}>{cat.name_ar}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>({cat.name_en || cat.id})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditCategorySubmit(cat.id, cat.name_ar, cat.name_en)}
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 800, borderRadius: '4px', background: 'rgba(212,175,55,0.15)', color: 'var(--gold-primary)', border: '1px solid var(--border-gold)', cursor: 'pointer' }}
                    >
                      ✏️ تعديل الاسم
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit / Add Modal Dialog */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 12, 0.96)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '780px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '1.5rem', color: 'var(--gold-primary)' }}>
              {editingProduct ? `⚙️ تعديل المنتج والمخزون: ${editingProduct.id}` : '➕ إضافة منتج جديد للكتالوج'}
            </h3>

            {formError && (
              <div style={{ color: '#F43F5E', background: 'rgba(244,63,94,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!editingProduct && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>معرف المنتج (ID)</label>
                  <input type="text" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} required style={{ width: '100%', padding: '0.75rem' }} />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>الاسم بالعربي</label>
                  <input type="text" value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} required style={{ width: '100%', padding: '0.75rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>الاسم بالإنكليزي</label>
                  <input type="text" value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} required style={{ width: '100%', padding: '0.75rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800 }}>الفئة / القسم</label>
                    <button 
                      type="button" 
                      onClick={() => setIsCategoryModalOpen(true)}
                      style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontWeight: 800, cursor: 'pointer' }}
                    >
                      + قسم جديد
                    </button>
                  </div>
                  <select 
                    value={formData.categoryId} 
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem', background: '#000', color: '#fff' }}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_ar || cat.name_en || cat.id} ({cat.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>السعر الحالي (ج.م) *</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required style={{ width: '100%', padding: '0.75rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.3rem' }}>السعر قبل الخصم (اختياري)</label>
                  <input 
                    type="number" 
                    placeholder="اتركه فارغاً إن لم يكن خصم" 
                    value={formData.oldPrice} 
                    onChange={e => setFormData({ ...formData, oldPrice: e.target.value })} 
                    style={{ width: '100%', padding: '0.75rem' }} 
                  />
                </div>
              </div>

              {/* 📷 4 Images Management Section (Front + 3 Catalog Images) */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold)' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 900, marginBottom: '0.8rem', color: 'var(--gold-primary)' }}>
                  🖼️ صور المنتج الأربعة (صورة الواجهة Front + 3 صور معرض الكتالوج)
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {/* Image 1: Main Front View */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gold-primary)' }}>1. صورة الواجهة الأمامية (Front Main) *</span>
                      {formData.mainImage && (
                        <img src={formData.mainImage} alt="Main Preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--gold-primary)' }} />
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="رابط الصورة أو اختر ملف..." 
                      value={formData.mainImage} 
                      onChange={e => setFormData({ ...formData, mainImage: e.target.value })} 
                      required 
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.4rem' }} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileUpload(e, 'mainImage')} 
                      style={{ fontSize: '0.75rem', width: '100%' }} 
                    />
                  </div>

                  {/* Image 2: Catalog Detail 1 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>2. صورة الكتالوج الفرعية الأولى</span>
                      {formData.galleryImage1 && (
                        <img src={formData.galleryImage1} alt="Gallery 1 Preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-gold)' }} />
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="رابط الصورة أو اختر ملف..." 
                      value={formData.galleryImage1} 
                      onChange={e => setFormData({ ...formData, galleryImage1: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.4rem' }} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileUpload(e, 'galleryImage1')} 
                      style={{ fontSize: '0.75rem', width: '100%' }} 
                    />
                  </div>

                  {/* Image 3: Catalog Detail 2 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>3. صورة الكتالوج الفرعية الثانية</span>
                      {formData.galleryImage2 && (
                        <img src={formData.galleryImage2} alt="Gallery 2 Preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-gold)' }} />
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="رابط الصورة أو اختر ملف..." 
                      value={formData.galleryImage2} 
                      onChange={e => setFormData({ ...formData, galleryImage2: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.4rem' }} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileUpload(e, 'galleryImage2')} 
                      style={{ fontSize: '0.75rem', width: '100%' }} 
                    />
                  </div>

                  {/* Image 4: Catalog Detail 3 */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>4. صورة الكتالوج الفرعية الثالثة</span>
                      {formData.galleryImage3 && (
                        <img src={formData.galleryImage3} alt="Gallery 3 Preview" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-gold)' }} />
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="رابط الصورة أو اختر ملف..." 
                      value={formData.galleryImage3} 
                      onChange={e => setFormData({ ...formData, galleryImage3: e.target.value })} 
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.4rem' }} 
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileUpload(e, 'galleryImage3')} 
                      style={{ fontSize: '0.75rem', width: '100%' }} 
                    />
                  </div>
                </div>
              </div>

              {/* 📏 DYNAMIC DYNAMIC CUSTOM SIZES & STOCK MANAGEMENT SECTION */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold-primary)' }}>
                    📏 إدارة مقاسات المنتج ومخزونها (Dynamic Sizes & Stock)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    أضف أي مقاس تراه مناسباً (مثال: 40 للأحذية، XL للملابس)
                  </span>
                </div>

                {/* Size Variants List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                  {formData.sizeVariants.map(item => (
                    <div key={item.size} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--gold-primary)' }}>{item.size}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSize(item.size)} 
                          style={{ color: '#F43F5E', fontSize: '0.75rem', fontWeight: 800, padding: '0 0.3rem' }}
                          title="حذف هذا المقاس"
                        >
                          ❌
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={item.stockQuantity}
                        onChange={e => handleUpdateSizeStock(item.size, e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', textAlign: 'center', fontSize: '0.85rem', background: '#000', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Add Custom Size Control Strip */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(212,175,55,0.05)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px border-gold' }}>
                  <input 
                    type="text" 
                    placeholder="كود المقاس (مثال: 42 أو 3XL)" 
                    value={customSizeCode} 
                    onChange={e => setCustomSizeCode(e.target.value)} 
                    style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }} 
                  />
                  <input 
                    type="number" 
                    min="0"
                    placeholder="الكمية" 
                    value={customSizeStock} 
                    onChange={e => setCustomSizeStock(e.target.value)} 
                    style={{ width: '80px', padding: '0.45rem', fontSize: '0.8rem', textAlign: 'center' }} 
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={handleAddCustomSize} 
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                  >
                    + إضافة المقاس
                  </button>
                </div>
              </div>

              {/* Options Toggles (Featured VIP Gold, Best Seller, & New) */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', color: '#FFDF73' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isFeatured} 
                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} 
                    style={{ width: '18px', height: '18px', accentColor: '#D4AF37' }}
                  />
                  👑 منتج مميز وفاخر (VIP Gold Card) - الكارت الذهبي والسعر الأعلى
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', color: 'var(--gold-primary)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isBestSeller} 
                    onChange={e => setFormData({ ...formData, isBestSeller: e.target.checked })} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  إضافة لقائمة الأعلى مبيعاً 🔥 (Best Seller)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isNew} 
                    onChange={e => setFormData({ ...formData, isNew: e.target.checked })} 
                    style={{ width: '18px', height: '18px' }}
                  />
                  إضافة شارة كولكشن جديد ✨ (New Arrival)
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn-primary" disabled={isPending} style={{ padding: '0.75rem 2rem' }}>
                  {isPending ? 'جاري الحفظ...' : 'حفظ المنتج والمخزون 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
