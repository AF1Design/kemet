'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  createProductAction, 
  updateProductAction, 
  saveProductBatchAction,
  toggleProductActiveAction, 
  deleteProductAction,
  updateProductInventoryAction,
  getCategoriesListAction,
  updateCategoryAction,
  createCategoryAction,
  getHomepageSectionsAction,
  saveHomepageSectionsAction
} from '../../app/admin/actions';
import { useApp } from '../../context/AppContext';

export function ProductTable({ initialProducts, categories: initialCategories }) {
  const { setDbCategories } = useApp();
  const [products, setProducts] = useState(initialProducts || []);
  const [categoriesList, setCategoriesList] = useState(initialCategories || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = add new, object = edit

  // Homepage Sections CMS Modal State
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false);
  const [homepageSections, setHomepageSections] = useState([]);
  const [isSavingSections, setIsSavingSections] = useState(false);

  // New Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatNameAr, setNewCatNameAr] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [catError, setCatError] = useState(null);

  // Inline Category Editing State
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatAr, setEditCatAr] = useState('');
  const [editCatEn, setEditCatEn] = useState('');

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

  // Automatic Client-Side Image Resizer & WebP Converter (Max 1200px, 85% Quality WebP)
  const compressAndConvertToWebP = (file, maxDimension = 1200, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculate aspect-ratio preserved new dimensions
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP format
          let webpDataUrl = canvas.toDataURL('image/webp', quality);
          if (!webpDataUrl.startsWith('data:image/webp')) {
            webpDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(webpDataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = e.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Helper to handle local file uploads, resize & convert to WebP automatically
  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedWebPDataUrl = await compressAndConvertToWebP(file, 1200, 0.85);
      setFormData(prev => ({
        ...prev,
        [fieldName]: optimizedWebPDataUrl
      }));
    } catch (err) {
      console.warn('WebP conversion note, falling back to raw upload:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          [fieldName]: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
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
        if (setDbCategories) setDbCategories(prev => [...prev, res.category]);
        setFormData(prev => ({ ...prev, categoryId: res.category.id }));
        setIsCategoryModalOpen(false);
        setNewCatId('');
        setNewCatNameAr('');
        setNewCatNameEn('');
        // Re-fetch all categories from DB
        const fresh = await getCategoriesListAction();
        if (fresh.success && fresh.categories && setDbCategories) {
          setDbCategories(fresh.categories);
        }
      } else {
        setCatError(res.error);
      }
    });
  };

  // Save Inline Edited Category Name
  const handleSaveCategoryEdit = (catId) => {
    if (!editCatAr.trim()) {
      alert('⚠️ يرجى كتابة الاسم بالعربي للقسم');
      return;
    }

    startTransition(async () => {
      const res = await updateCategoryAction(catId, editCatAr, editCatEn || editCatAr);
      if (res.success && res.category) {
        const updatedCatObj = {
          ...res.category,
          name_ar: res.category.name_ar,
          name_en: res.category.name_en,
          nameAr: res.category.name_ar,
          nameEn: res.category.name_en
        };
        setCategoriesList(prev => prev.map(c => c.id === catId ? updatedCatObj : c));
        if (setDbCategories) setDbCategories(prev => prev.map(c => c.id === catId ? updatedCatObj : c));
        setEditingCatId(null);

        // Re-fetch all categories from DB
        const fresh = await getCategoriesListAction();
        if (fresh.success && fresh.categories && setDbCategories) {
          setDbCategories(fresh.categories);
        }
        alert(`✅ تم حفظ وتعديل اسم القسم (${catId}) إلى: "${res.category.name_ar}" بنجاح 🏷️`);
      } else {
        alert(`⚠️ فشل تعديل الاسم: ${res.error || 'خطأ بالسيرفر'}`);
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

        const returnedMainImage = res.product?.main_image || formData.mainImage;
        const returnedGalleryImages = res.product?.gallery_images || galleryImages;

        if (editingProduct) {
          setProducts(prev =>
            prev.map(p => p.id === editingProduct.id ? { 
              ...p, 
              ...res.product, 
              main_image: returnedMainImage,
              gallery_images: returnedGalleryImages,
              price: Number(formData.price),
              old_price: parsedOldPrice,
              is_best_seller: formData.isBestSeller,
              is_featured: formData.isFeatured,
              isFeatured: formData.isFeatured,
              is_new: formData.isNew,
              product_variants: updatedVariants 
            } : p)
          );
        } else {
          setProducts(prev => [{ 
            ...res.product, 
            main_image: returnedMainImage,
            gallery_images: returnedGalleryImages,
            price: Number(formData.price),
            old_price: parsedOldPrice,
            is_best_seller: formData.isBestSeller,
            is_featured: formData.isFeatured,
            isFeatured: formData.isFeatured,
            is_new: formData.isNew,
            product_variants: updatedVariants 
          }, ...prev]);
        }
        setIsModalOpen(false);
      } else {
        setFormError(res.error || 'حدث خطأ في حفظ البيانات');
      }
    });
  };

  const handleOpenSectionsModal = async () => {
    setIsSectionsModalOpen(true);
    const res = await getHomepageSectionsAction();
    if (res.success && res.sections) {
      setHomepageSections(res.sections);
    }
  };

  const handleToggleSection = (secId) => {
    setHomepageSections(prev =>
      prev.map(s => s.id === secId ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const handleMoveSection = (index, direction) => {
    setHomepageSections(prev => {
      const list = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;
      return list.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  const handleChangeLimit = (secId, limitNum) => {
    setHomepageSections(prev =>
      prev.map(s => s.id === secId ? { ...s, limit: Number(limitNum) } : s)
    );
  };

  const handleUpdateSectionField = (secId, field, value) => {
    setHomepageSections(prev =>
      prev.map(s => s.id === secId ? { ...s, [field]: value } : s)
    );
  };

  const handleAddCategoryToHomepage = (cat) => {
    if (homepageSections.some(s => s.categoryId === cat.id)) {
      alert('هذا القسم مضاف بالفعل في قائمة أقسام الواجهة');
      return;
    }
    const newSec = {
      id: `cat_${cat.id}`,
      titleAr: cat.name_ar || cat.nameAr,
      titleEn: cat.name_en || cat.nameEn || cat.id,
      subtitleAr: `استعرض أحدث تشكيلة من ${cat.name_ar || cat.nameAr}`,
      subtitleEn: `Explore all products in ${cat.name_en || cat.nameEn}`,
      categoryId: cat.id,
      filterType: 'category',
      enabled: true,
      order: homepageSections.length + 1,
      limit: 6
    };
    setHomepageSections(prev => [...prev, newSec]);
  };

  const handleSaveSections = async () => {
    setIsSavingSections(true);
    try {
      const res = await saveHomepageSectionsAction(homepageSections);
      if (res.success) {
        alert('✅ تم حفظ وتحديث عناوين وترتيب أقسام الصفحة الرئيسية بنجاح 🎠');
        setIsSectionsModalOpen(false);
      } else {
        alert(`⚠️ فشل حفظ الإعدادات: ${res.error}`);
      }
    } catch (err) {
      alert(`حدث خطأ: ${err.message}`);
    } finally {
      setIsSavingSections(false);
    }
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleOpenSectionsModal}
            style={{
              padding: '0.8rem 1.5rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid var(--border-gold)',
              background: 'rgba(212,175,55,0.12)',
              color: 'var(--gold-primary)'
            }}
          >
            🎛️ إدارة وترتيب أقسام الواجهة
          </button>

          <button type="button" className="btn-primary" onClick={handleOpenAddModal} style={{ padding: '0.8rem 1.75rem' }}>
            ⚽ إضافة منتج جديد
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--gold-primary)', margin: 0 }}>
                    🖼️ صور المنتج الأربعة (صورة الواجهة Front + 3 صور معرض الكتالوج)
                  </label>
                  <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', color: '#10B981', fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    ⚡ الضغط التلقائي مفعّل (تحويل لـ WebP وتصغير أبعاد 1200px)
                  </span>
                </div>

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

      {/* Homepage Sections CMS Modal */}
      {isSectionsModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold-bright)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎛️ إدارة وترتيب أقسام وسلايدرات الواجهة</span>
              <button type="button" onClick={() => setIsSectionsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              تحكم في ظهور وترتيب الأقسام الأفقية (السلايدرات) في الصفحة الرئيسية، وحدد عدد المنتجات المعروضة في كل سلايدر.
            </p>

            {/* Sections List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {homepageSections.map((sec, idx) => (
                <div
                  key={sec.id}
                  style={{
                    background: sec.enabled ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.03)',
                    border: sec.enabled ? '1px solid var(--border-gold)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    opacity: sec.enabled ? 1 : 0.65,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Top Bar: Reorder, Controls & Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Reorder Buttons */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, 'up')}
                          disabled={idx === 0}
                          style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid var(--border-color)',
                            color: idx === 0 ? 'var(--text-secondary)' : 'var(--gold-primary)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            cursor: idx === 0 ? 'not-allowed' : 'pointer'
                          }}
                          title="تحريك لأعلى"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSection(idx, 'down')}
                          disabled={idx === homepageSections.length - 1}
                          style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid var(--border-color)',
                            color: idx === homepageSections.length - 1 ? 'var(--text-secondary)' : 'var(--gold-primary)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            cursor: idx === homepageSections.length - 1 ? 'not-allowed' : 'pointer'
                          }}
                          title="تحريك لأسفل"
                        >
                          ▼
                        </button>
                      </div>

                      <span style={{ color: 'var(--gold-primary)', fontWeight: 900, fontSize: '0.9rem' }}>
                        القسم #{idx + 1}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        ({sec.filterType === 'best_seller' ? 'الأكثر مبيعاً' : `فئة: ${sec.categoryId}`})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {/* Limit Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>العدد:</span>
                        <select
                          value={sec.limit || 6}
                          onChange={e => handleChangeLimit(sec.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--gold-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          {[4, 6, 8, 10, 12].map(n => (
                            <option key={n} value={n} style={{ background: '#0B0F19', color: '#FFF' }}>
                              {n} منتجات
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Enable / Disable Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleSection(sec.id)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          borderRadius: 'var(--radius-md)',
                          border: sec.enabled ? '1px solid #10B981' : '1px solid #F43F5E',
                          background: sec.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
                          color: sec.enabled ? '#10B981' : '#F43F5E',
                          cursor: 'pointer'
                        }}
                      >
                        {sec.enabled ? 'ظاهر بالواجهة ✅' : 'مخفي ❌'}
                      </button>
                    </div>
                  </div>

                  {/* Editable Titles Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        عنوان القسم في الواجهة (عربي):
                      </label>
                      <input
                        type="text"
                        value={sec.titleAr || ''}
                        onChange={e => handleUpdateSectionField(sec.id, 'titleAr', e.target.value)}
                        placeholder="مثال: أفضل المنتجات 🔥"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(0,0,0,0.4)',
                          color: '#FFFFFF'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Section Title (English):
                      </label>
                      <input
                        type="text"
                        value={sec.titleEn || ''}
                        onChange={e => handleUpdateSectionField(sec.id, 'titleEn', e.target.value)}
                        placeholder="e.g. Best Sellers 🔥"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(0,0,0,0.4)',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-en)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Available Categories to Homepage Sections */}
            <div style={{ marginBottom: '1.75rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--gold-primary)', marginBottom: '0.5rem' }}>
                ➕ إضافة فئات الكتالوج الأخرى إلى الصفحة الرئيسية:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {categoriesList.map(cat => {
                  const isAlreadyAdded = homepageSections.some(s => s.categoryId === cat.id);
                  if (isAlreadyAdded) return null;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleAddCategoryToHomepage(cat)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(212,175,55,0.12)',
                        border: '1px solid var(--border-gold)',
                        color: 'var(--gold-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      + {cat.name_ar || cat.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsSectionsModalOpen(false)} style={{ padding: '0.65rem 1.25rem' }}>
                إلغاء
              </button>
              <button
                type="button"
                className="btn-gold"
                onClick={handleSaveSections}
                disabled={isSavingSections}
                style={{ padding: '0.65rem 1.75rem' }}
              >
                {isSavingSections ? 'جاري الحفظ...' : '💾 حفظ وتحديث الواجهة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
