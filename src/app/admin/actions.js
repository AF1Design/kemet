'use server';

import { getAdminSupabase } from '../../lib/supabase/admin.js';

// Helper to safely invoke revalidatePath in Next.js environment without blocking response
async function triggerBackgroundRevalidate(paths = []) {
  try {
    const { revalidatePath } = await import('next/cache');
    paths.forEach(p => {
      try {
        revalidatePath(p);
      } catch (e) {}
    });
  } catch (err) {
    // Ignore when executed outside Next.js server runtime
  }
}

/**
 * Unified Fast Batch Action: Creates or Updates a product & variants in a single parallel query!
 */
export async function saveProductBatchAction(productData, sizeVariants = [], isEditMode = false) {
  try {
    const supabaseAdmin = getAdminSupabase();

    let keywords = Array.from(new Set(productData.keywords || []));
    if (productData.isFeatured) {
      if (!keywords.includes('IS_FEATURED_GOLD')) keywords.push('IS_FEATURED_GOLD');
    } else {
      keywords = keywords.filter(k => k !== 'IS_FEATURED_GOLD');
    }

    const payload = {
      name_ar: productData.nameAr,
      name_en: productData.nameEn,
      description_ar: productData.descriptionAr || '',
      description_en: productData.descriptionEn || '',
      category_id: productData.categoryId,
      price: Number(productData.price),
      old_price: productData.oldPrice ? Number(productData.oldPrice) : null,
      main_image: productData.mainImage,
      gallery_images: productData.galleryImages || [productData.mainImage],
      is_best_seller: productData.isBestSeller ?? false,
      is_new: productData.isNew ?? true,
      is_active: productData.isActive ?? true,
      keywords: keywords
    };

    let productResult = null;

    if (isEditMode) {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('products')
        .update(payload)
        .eq('id', productData.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      productResult = updated;
    } else {
      payload.id = productData.id;
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('products')
        .insert(payload)
        .select()
        .single();

      if (insertErr) throw insertErr;
      productResult = inserted;
    }

    // Parallel Variant Upsert Query if variants provided
    if (sizeVariants && sizeVariants.length > 0) {
      const variantsToUpsert = sizeVariants.map(v => ({
        product_id: productData.id,
        size: v.size,
        stock_quantity: Number(v.stockQuantity ?? 50)
      }));

      const { error: varErr } = await supabaseAdmin
        .from('product_variants')
        .upsert(variantsToUpsert, { onConflict: 'product_id,size' });

      if (varErr) console.error('Error upserting variants:', varErr);
    }

    // Trigger non-blocking background revalidation
    triggerBackgroundRevalidate(['/', '/category/all', '/admin/products', `/product/${productData.id}`]);

    return { success: true, product: productResult };
  } catch (err) {
    console.error('saveProductBatchAction error:', err);
    return { success: false, error: err.message || 'فشل حفظ المنتج' };
  }
}

/**
 * Server Action: Creates a new product
 */
export async function createProductAction(productData, sizesWithStock = []) {
  return saveProductBatchAction(productData, sizesWithStock, false);
}

/**
 * Server Action: Updates an existing product's details
 */
export async function updateProductAction(productId, updateData) {
  return saveProductBatchAction({ id: productId, ...updateData }, updateData.sizeVariants || [], true);
}

/**
 * Server Action: Soft-deletes or toggles a product's active status (is_active)
 */
export async function toggleProductActiveAction(productId, currentActiveStatus) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: !currentActiveStatus })
      .eq('id', productId);

    if (error) throw error;

    triggerBackgroundRevalidate(['/', '/category/all', '/admin/products']);

    return { success: true, newStatus: !currentActiveStatus };
  } catch (err) {
    console.error('toggleProductActiveAction error:', err);
    return { success: false, error: err.message || 'فشل في تغيير حالة التفعيل' };
  }
}

/**
 * Server Action: Deletes a product permanently from Supabase
 */
export async function deleteProductAction(productId) {
  try {
    const supabaseAdmin = getAdminSupabase();

    await supabaseAdmin.from('product_variants').delete().eq('product_id', productId);

    const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);
    if (error) throw error;

    triggerBackgroundRevalidate(['/', '/category/all', '/admin/products']);

    return { success: true };
  } catch (err) {
    console.error('deleteProductAction error:', err);
    return { success: false, error: err.message || 'فشل في حذف المنتج نهائياً' };
  }
}

/**
 * Server Action: Updates inventory stock quantity for product variants
 */
export async function updateProductInventoryAction(productId, sizeVariants) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const variantsToUpsert = sizeVariants.map(v => ({
      product_id: productId,
      size: v.size,
      stock_quantity: Number(v.stockQuantity)
    }));

    const { error } = await supabaseAdmin
      .from('product_variants')
      .upsert(variantsToUpsert, { onConflict: 'product_id,size' });

    if (error) throw error;

    triggerBackgroundRevalidate([`/product/${productId}`, '/admin/products']);

    return { success: true };
  } catch (err) {
    console.error('updateProductInventoryAction error:', err);
    return { success: false, error: err.message || 'فشل في تحديث المخزون' };
  }
}

/**
 * Server Action: Creates a new category in Supabase
 */
export async function createCategoryAction(catId, nameAr, nameEn = '') {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { data: newCat, error } = await supabaseAdmin
      .from('categories')
      .insert({
        id: catId.trim().toLowerCase(),
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || nameAr.trim()
      })
      .select()
      .single();

    if (error) throw error;

    triggerBackgroundRevalidate(['/', '/category/all', '/admin/products']);
    return { success: true, category: newCat };
  } catch (err) {
    console.error('createCategoryAction error:', err);
    return { success: false, error: err.message || 'فشل في إضافة القسم' };
  }
}

/**
 * Server Action: Updates an existing category name (Arabic & English) in Supabase
 */
export async function updateCategoryAction(catId, nameAr, nameEn) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { data: updatedCat, error } = await supabaseAdmin
      .from('categories')
      .update({
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || nameAr.trim()
      })
      .eq('id', catId)
      .select()
      .single();

    if (error) throw error;

    triggerBackgroundRevalidate(['/', '/category/all', '/admin/products']);

    return { success: true, category: updatedCat };
  } catch (err) {
    console.error('updateCategoryAction error:', err);
    return { success: false, error: err.message || 'فشل في تعديل اسم القسم' };
  }
}

/**
 * Server Action: Saves a customer order into Supabase orders table
 */
export async function createOrderAction(orderData) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { data: newOrder, error } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderData.id,
        user_id: orderData.userId || null,
        customer_name: orderData.customer?.fullName || 'عميل KEMET',
        customer_phone: orderData.customer?.phone || '',
        governorate: orderData.customer?.governorate || 'القاهرة',
        address: orderData.customer?.address || '',
        notes: orderData.customer?.notes || '',
        subtotal: Number(orderData.subtotal),
        shipping_fee: Number(orderData.shipping),
        total_amount: Number(orderData.total),
        status: orderData.status || 'جديد 📦',
        items: orderData.items || []
      })
      .select()
      .single();

    if (error) throw error;

    triggerBackgroundRevalidate(['/admin/orders', '/my-orders']);

    return { success: true, order: newOrder };
  } catch (err) {
    console.error('createOrderAction error:', err);
    return { success: false, error: err.message || 'فشل حفظ الطلب' };
  }
}

/**
 * Server Action: Updates order status in Supabase orders table
 */
export async function updateOrderStatusAction(orderId, newStatus) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    triggerBackgroundRevalidate(['/admin/orders', '/my-orders']);

    return { success: true, order: updated };
  } catch (err) {
    console.error('updateOrderStatusAction error:', err);
    return { success: false, error: err.message || 'فشل تحديث حالة الطلب' };
  }
}
