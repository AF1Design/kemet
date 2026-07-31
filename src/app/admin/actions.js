'use server';

import { getAdminSupabase } from '../../lib/supabase/admin.js';

// Helper to safely invoke revalidatePath in Next.js environment
async function safeRevalidate(path) {
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath(path);
  } catch (err) {
    // Ignore when executed outside Next.js server runtime
  }
}

/**
 * Server Action: Creates a new product and inserts initial size variants
 */
export async function createProductAction(productData, sizesWithStock = []) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { data: newProd, error: prodErr } = await supabaseAdmin
      .from('products')
      .insert({
        id: productData.id,
        category_id: productData.categoryId,
        name_ar: productData.nameAr,
        name_en: productData.nameEn,
        description_ar: productData.descriptionAr || '',
        description_en: productData.descriptionEn || '',
        price: Number(productData.price),
        old_price: productData.oldPrice ? Number(productData.oldPrice) : null,
        main_image: productData.mainImage,
        gallery_images: productData.galleryImages || [productData.mainImage],
        is_best_seller: productData.isBestSeller ?? false,
        is_new: productData.isNew ?? true,
        is_active: productData.isActive ?? true,
        keywords: productData.keywords || []
      })
      .select()
      .single();

    if (prodErr) throw prodErr;

    // Insert size variants if provided
    if (sizesWithStock && sizesWithStock.length > 0) {
      const variantsToInsert = sizesWithStock.map(item => ({
        product_id: newProd.id,
        size: item.size,
        stock_quantity: Number(item.stockQuantity ?? 50)
      }));

      const { error: varErr } = await supabaseAdmin
        .from('product_variants')
        .upsert(variantsToInsert, { onConflict: 'product_id,size' });

      if (varErr) console.error('Error inserting variants:', varErr);
    }

    await safeRevalidate('/');
    await safeRevalidate('/category/all');
    await safeRevalidate('/admin/products');

    return { success: true, product: newProd };
  } catch (err) {
    console.error('createProductAction error:', err);
    return { success: false, error: err.message || 'فشل في إضافة المنتج' };
  }
}

/**
 * Server Action: Updates an existing product's details
 */
export async function updateProductAction(productId, updateData) {
  try {
    const supabaseAdmin = getAdminSupabase();

    const { data: updated, error } = await supabaseAdmin
      .from('products')
      .update({
        name_ar: updateData.nameAr,
        name_en: updateData.nameEn,
        description_ar: updateData.descriptionAr,
        description_en: updateData.descriptionEn,
        category_id: updateData.categoryId,
        price: Number(updateData.price),
        old_price: updateData.oldPrice ? Number(updateData.oldPrice) : null,
        main_image: updateData.mainImage,
        gallery_images: updateData.galleryImages,
        is_best_seller: updateData.isBestSeller,
        is_new: updateData.isNew,
        keywords: updateData.keywords
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    await safeRevalidate('/');
    await safeRevalidate('/category/all');
    await safeRevalidate(`/product/${productId}`);
    await safeRevalidate('/admin/products');

    return { success: true, product: updated };
  } catch (err) {
    console.error('updateProductAction error:', err);
    return { success: false, error: err.message || 'فشل في تعديل البيانات' };
  }
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

    await safeRevalidate('/');
    await safeRevalidate('/category/all');
    await safeRevalidate('/admin/products');

    return { success: true, newStatus: !currentActiveStatus };
  } catch (err) {
    console.error('toggleProductActiveAction error:', err);
    return { success: false, error: err.message || 'فشل في تغيير حالة التفعيل' };
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

    await safeRevalidate(`/product/${productId}`);
    await safeRevalidate('/admin/products');

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

    await safeRevalidate('/admin/products');
    return { success: true, category: newCat };
  } catch (err) {
    console.error('createCategoryAction error:', err);
    return { success: false, error: err.message || 'فشل في إضافة القسم' };
  }
}
