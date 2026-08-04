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

function toDbStatus(status) {
  if (!status || typeof status !== 'string') return 'pending';
  if (status.includes('مندوب') || status === 'out_for_delivery') return 'shipped';
  if (status.includes('جديد') || status === 'pending') return 'pending';
  if (status.includes('التجهيز') || status === 'processing') return 'processing';
  if (status.includes('الشحن') || status === 'shipped') return 'shipped';
  if (status.includes('التسليم') || status.includes('التوصيل') || status === 'delivered') return 'delivered';
  if (status.includes('ملغي') || status === 'cancelled') return 'cancelled';
  return 'pending';
}

function toDisplayStatus(status, deliveryNotes = '') {
  const notesStr = String(deliveryNotes || '');
  if (notesStr.includes('[OUT_FOR_DELIVERY]')) {
    return 'مع المندوب 🛵';
  }
  switch (status) {
    case 'pending': return 'جديد 📦';
    case 'processing': return 'جاري التجهيز ⚙️';
    case 'shipped': return 'تم الشحن 🚚';
    case 'out_for_delivery': return 'مع المندوب 🛵';
    case 'delivered': return 'تم التسليم ✅';
    case 'cancelled': return 'ملغي ❌';
    default: return status || 'جديد 📦';
  }
}

export async function mapDisplayStatusToDb(status) {
  return toDbStatus(status);
}

export async function mapDbStatusToDisplay(status) {
  return toDisplayStatus(status);
}

/**
 * Server Action: Saves a customer order into Supabase orders & order_items tables
 */
export async function createOrderAction(orderData) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const dbStatus = toDbStatus(orderData.status);

    const orderPayload = {
      id: orderData.id,
      user_id: orderData.userId || null,
      customer_name: orderData.customer?.fullName || orderData.customerName || 'عميل KEMET',
      customer_phone: orderData.customer?.phone || orderData.customerPhone || '',
      governorate: orderData.customer?.governorate || orderData.governorate || 'القاهرة',
      address: orderData.customer?.address || orderData.address || '',
      delivery_notes: orderData.customer?.notes || orderData.notes || '',
      subtotal: Number(orderData.subtotal || 0),
      shipping_fee: Number(orderData.shipping || orderData.shipping_fee || 0),
      total_amount: Number(orderData.total || orderData.total_amount || 0),
      payment_method: orderData.paymentMethod || 'COD',
      status: dbStatus,
      is_shipped: dbStatus === 'shipped' || dbStatus === 'delivered'
    };

    const { data: newOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) throw orderErr;

    // Insert order items if present
    const rawItems = orderData.items || [];
    if (rawItems.length > 0) {
      const { data: existingProducts } = await supabaseAdmin
        .from('products')
        .select('id');
      
      const validProductIds = new Set((existingProducts || []).map(p => String(p.id)));

      const itemsToInsert = rawItems.map(item => {
        const rawProdId = item.id || item.product_id ? String(item.id || item.product_id) : null;
        const validProdId = validProductIds.has(rawProdId) ? rawProdId : null;

        return {
          order_id: newOrder.id,
          product_id: validProdId,
          product_name_ar: item.nameAr || item.name_ar || item.title || 'منتج KEMET',
          product_name_en: item.nameEn || item.name_en || '',
          size: item.size || 'M',
          unit_price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          total_price: Number(item.price || 0) * Number(item.quantity || 1)
        };
      });

      const { error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsErr) console.error('Error inserting order items:', itemsErr);
    }

    triggerBackgroundRevalidate(['/admin/orders', '/my-orders']);

    return { success: true, order: newOrder };
  } catch (err) {
    console.error('createOrderAction error:', err);
    return { success: false, error: err.message || 'فشل حفظ الطلب' };
  }
}

/**
 * Server Action: Updates order status in Supabase orders table & sends rich status email
 */
export async function updateOrderStatusAction(orderId, newStatus, trackingNumber = null) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const isOutForDelivery = newStatus.includes('مندوب') || newStatus === 'out_for_delivery';
    const dbStatus = toDbStatus(newStatus);

    const updatePayload = {
      status: dbStatus,
      is_shipped: true
    };

    if (isOutForDelivery) {
      const { data: curr } = await supabaseAdmin.from('orders').select('delivery_notes').eq('id', orderId).single();
      const existingNotes = curr?.delivery_notes || '';
      if (!existingNotes.includes('[OUT_FOR_DELIVERY]')) {
        updatePayload.delivery_notes = `${existingNotes} [OUT_FOR_DELIVERY]`.trim();
      }
    }

    if (trackingNumber && String(trackingNumber).trim()) {
      updatePayload.tracking_number = String(trackingNumber).trim();
    }

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (error) throw error;

    // Send email notification to customer if email is available
    try {
      let customerEmail = null;
      if (updated.user_id) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', updated.user_id)
          .single();
        if (prof?.email) customerEmail = prof.email;
      }

      if (!customerEmail && updated.customer_phone) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('phone', updated.customer_phone)
          .single();
        if (prof?.email) customerEmail = prof.email;
      }

      if (customerEmail) {
        const { getResendClient, SENDER_SUPPORT } = await import('../../lib/resend.js');
        const resend = getResendClient();
        const displayStatus = isOutForDelivery ? 'مع المندوب 🛵' : toDisplayStatus(dbStatus, updated.delivery_notes);

        const itemsRows = (updated.order_items || []).map(item => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 14px; font-weight: bold; color: #0F172A;">${item.product_name_ar || 'منتج KEMET'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 14px; text-align: center; color: #475569;">${item.size || 'M'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 14px; text-align: center; color: #475569;">${item.quantity || 1}</td>
            <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 14px; text-align: left; font-weight: bold; color: #0F172A;">${(item.unit_price || 0) * (item.quantity || 1)} ج.م</td>
          </tr>
        `).join('');

        const trackingSection = updated.tracking_number ? `
          <div style="background: #EFF6FF; border: 1px solid #93C5FD; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <div style="font-size: 14px; color: #1E40AF; margin-bottom: 6px; font-weight: bold;">📦 كود تتبع الشحنة لدى البريد المصري:</div>
            <div style="font-size: 22px; font-weight: 900; color: #1E3A8A; letter-spacing: 2px; margin-bottom: 12px; font-family: monospace;">${updated.tracking_number}</div>
            <a href="https://kemetmisr.com/track-order" target="_blank" style="display: inline-block; background: #2563EB; color: #FFFFFF; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-size: 14px; font-weight: bold;">
              تتبع الشحنة الآن على موقع KEMET 🚚
            </a>
          </div>
        ` : '';

        const courierNoticeSection = isOutForDelivery || updated.delivery_notes?.includes('[OUT_FOR_DELIVERY]') ? `
          <div style="background: #FEF9C3; border: 1px solid #FDE047; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center; color: #854D0E; font-size: 15px; font-weight: bold; line-height: 1.6;">
            🛵 أوردرك اليوم مع المندوب وفي الطريق إليك خلال ساعات! يرجى التواجد في العنوان وتوافر الهاتف لتسهيل استلام الشحنة.
          </div>
        ` : '';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px; background-color: #FFFFFF;">
            <div style="text-align: left; margin-bottom: 20px;">
              <img src="https://kemetmisr.com/assets/kemet-text-logo.png" alt="KEMET" style="height: 32px;" />
            </div>
            
            <h2 style="color: #0F172A; font-size: 20px; margin-bottom: 16px;">تحديث حالة طلبك رقم #${updated.id}</h2>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              عزيزنا العميل <strong>${updated.customer_name || 'عميل KEMET'}</strong>،
            </p>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              تم تحديث حالة طلبك رقم <strong style="color: #0F172A;">#${updated.id}</strong> في KEMET إلى:
            </p>

            <div style="background: #F8FAFC; border: 1px solid #CBD5E1; padding: 15px; border-radius: 6px; text-align: center; font-size: 18px; font-weight: bold; color: #0F172A; margin: 16px 0;">
              ${displayStatus}
            </div>

            ${courierNoticeSection}
            ${trackingSection}

            <h3 style="color: #0F172A; font-size: 16px; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #F1F5F9; padding-bottom: 6px;">📋 تفاصيل المنتجات والطلب:</h3>
            
            <table border="0" cellPadding="0" cellSpacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 16px;">
              <thead>
                <tr style="background: #F8FAFC;">
                  <th style="padding: 8px 10px; text-align: right; font-size: 13px; color: #64748B;">المنتج</th>
                  <th style="padding: 8px 10px; text-align: center; font-size: 13px; color: #64748B;">المقاس</th>
                  <th style="padding: 8px 10px; text-align: center; font-size: 13px; color: #64748B;">الكمية</th>
                  <th style="padding: 8px 10px; text-align: left; font-size: 13px; color: #64748B;">السعر</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div style="background: #F8FAFC; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: #334155;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>عنوان التسليم:</span>
                <strong>${updated.governorate} (${updated.address})</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>مصاريف الشحن:</span>
                <strong>${updated.shipping_fee || 50} ج.م</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #0F172A; margin-top: 8px; border-top: 1px solid #CBD5E1; padding-top: 8px;">
                <span>الإجمالي الكلي:</span>
                <strong>${updated.total_amount} ج.م</strong>
              </div>
            </div>

            <p style="color: #64748B; font-size: 14px;">
              يمكنك متابعة حالة طلبك ومحتوياته في أي وقت من خلال قسم "طلباتي" في حسابك على الموقع.
            </p>

            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
            
            <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
              KEMET — جميع الحقوق محفوظة &copy; 2026 (kemetmisr.com)
            </p>
          </div>
        `;

        await resend.emails.send({
          from: SENDER_SUPPORT,
          to: [customerEmail],
          subject: `تحديث حالة طلبك #${updated.id} - KEMET`,
          html: emailHtml
        });
      }
    } catch (emailErr) {
      console.warn('Status change email notification warning:', emailErr);
    }

    triggerBackgroundRevalidate(['/admin/orders', '/my-orders']);

    return { success: true, order: updated };
  } catch (err) {
    console.error('updateOrderStatusAction error:', err);
    return { success: false, error: err.message || 'فشل تحديث حالة الطلب' };
  }
}


/**
 * Server Action: Deletes an order and its items from Supabase database
 */
export async function deleteOrderAction(orderId) {
  try {
    const supabaseAdmin = getAdminSupabase();

    // 1. Delete order items first
    const { error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsErr) console.warn('Order items delete warning:', itemsErr);

    // 2. Delete main order
    const { error: orderErr } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderErr) throw orderErr;

    triggerBackgroundRevalidate(['/admin/orders', '/my-orders']);

    return { success: true };
  } catch (err) {
    console.error('deleteOrderAction error:', err);
    return { success: false, error: err.message || 'فشل حذف الطلب' };
  }
}

