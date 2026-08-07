'use server';

import { getAdminSupabase } from '../../lib/supabase/admin.js';
import { processAndUploadProductImage } from '../../lib/image-uploader.js';

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

    // Process and Upload Main Image to Supabase Storage as clean .webp URL
    const mainImageUrl = await processAndUploadProductImage({
      imageInput: productData.mainImage,
      productName: productData.nameAr || 'kemet-product',
      nameEn: productData.nameEn || '',
      productId: productData.id || '',
      suffix: 'main'
    });

    // Process and Upload Gallery Images to Supabase Storage as clean .webp URLs
    const rawGallery = productData.galleryImages || [productData.mainImage];
    const galleryUrls = [];
    for (let i = 0; i < rawGallery.length; i++) {
      const gUrl = await processAndUploadProductImage({
        imageInput: rawGallery[i],
        productName: productData.nameAr || 'kemet-product',
        nameEn: productData.nameEn || '',
        productId: productData.id || '',
        suffix: `gallery-${i + 1}`
      });
      if (gUrl) galleryUrls.push(gUrl);
    }

    const payload = {
      name_ar: productData.nameAr,
      name_en: productData.nameEn,
      description_ar: productData.descriptionAr || '',
      description_en: productData.descriptionEn || '',
      category_id: productData.categoryId,
      price: Number(productData.price),
      old_price: productData.oldPrice ? Number(productData.oldPrice) : null,
      main_image: mainImageUrl || productData.mainImage,
      gallery_images: galleryUrls.length > 0 ? galleryUrls : [mainImageUrl],
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

    // Ensure TLS certificate bypass for Resend / external APIs on Node
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    // Sync Variants: Atomic replace - delete old variants and insert exact current sizes list
    if (Array.isArray(sizeVariants)) {
      await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', productData.id);

      if (sizeVariants.length > 0) {
        const variantsToInsert = sizeVariants.map(v => ({
          product_id: productData.id,
          size: v.size,
          stock_quantity: Number(v.stockQuantity ?? 50)
        }));

        const { error: varErr } = await supabaseAdmin
          .from('product_variants')
          .insert(variantsToInsert);

        if (varErr) console.error('Error inserting variants:', varErr);
      }
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
 * Server Action: Fetches all categories list from Supabase
 */
export async function getCategoriesListAction() {
  try {
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*');

    if (!error && data) {
      const filtered = data.filter(c => !c.id.startsWith('_'));
      return { success: true, categories: filtered };
    }
  } catch (err) {
    console.warn('getCategoriesListAction note:', err);
  }
  return { success: false, categories: [] };
}

function toDbStatus(status) {
  if (!status || typeof status !== 'string') return 'pending';
  const clean = status.trim().toLowerCase();
  if (clean.includes('مندوب') || clean === 'out_for_delivery') return 'out_for_delivery';
  if (clean.includes('جديد') || clean === 'pending') return 'pending';
  if (clean.includes('تجهيز') || clean === 'processing') return 'processing';
  if (clean.includes('شحن') || clean === 'shipped') return 'shipped';
  if (clean.includes('تسليم') || clean.includes('توصيل') || clean === 'delivered') return 'delivered';
  if (clean.includes('ملغي') || clean === 'cancelled') return 'cancelled';
  return 'pending';
}

function toDisplayStatus(status, deliveryNotes = '') {
  const cleanStatus = (status || '').toLowerCase();
  if (cleanStatus === 'cancelled' || cleanStatus.includes('ملغي')) return 'ملغي ❌';
  if (cleanStatus === 'delivered' || cleanStatus.includes('تسليم')) return 'تم التسليم ✅';
  if (cleanStatus === 'out_for_delivery' || cleanStatus.includes('مندوب')) return 'مع المندوب 🛵';
  if (cleanStatus === 'shipped' || cleanStatus.includes('شحن')) {
    if (String(deliveryNotes || '').includes('[OUT_FOR_DELIVERY]')) {
      return 'مع المندوب 🛵';
    }
    return 'تم الشحن 🚚';
  }
  if (cleanStatus === 'processing' || cleanStatus.includes('تجهيز')) return 'جاري التجهيز ⚙️';
  return 'جديد 📦';
}

export async function mapDisplayStatusToDb(status) {
  return toDbStatus(status);
}

export async function mapDbStatusToDisplay(status) {
  return toDisplayStatus(status);
}

/**
 * Server Action: Fetches live orders from Supabase DB for a customer by phone, email, or order IDs
 */
export async function getCustomerOrdersAction({ email, phone, userId, orderIds = [] } = {}) {
  try {
    const supabaseAdmin = getAdminSupabase();

    let targetPhone = phone && String(phone).trim() ? String(phone).trim() : null;
    let targetUserId = userId && String(userId).trim() ? String(userId).trim() : null;
    let targetEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;

    // Fetch profile via admin client to resolve phone & user UUID
    if ((targetEmail || targetUserId) && (!targetPhone || !targetUserId)) {
      let profQuery = supabaseAdmin.from('profiles').select('id, phone, email');
      if (targetUserId) {
        profQuery = profQuery.eq('id', targetUserId);
      } else if (targetEmail) {
        profQuery = profQuery.eq('email', targetEmail);
      }

      const { data: prof } = await profQuery.single();
      if (prof) {
        if (prof.id) targetUserId = prof.id;
        if (prof.phone) targetPhone = prof.phone;
      }
    }

    let query = supabaseAdmin.from('orders').select('*, order_items(*)');

    const userConditions = [];
    if (targetPhone) {
      userConditions.push(`customer_phone.eq.${targetPhone}`);
    }
    if (targetUserId) {
      userConditions.push(`user_id.eq.${targetUserId}`);
    }

    let queryConditions = [];
    if (userConditions.length > 0) {
      // Query strictly for logged in user's profile and phone number
      queryConditions = userConditions;
    } else if (Array.isArray(orderIds) && orderIds.length > 0) {
      // Only query by orderIds if NO logged-in user context exists (guest tracking)
      const cleanIds = orderIds.map(id => String(id).trim()).filter(Boolean);
      if (cleanIds.length > 0) {
        queryConditions.push(`id.in.(${cleanIds.join(',')})`);
      }
    }

    if (queryConditions.length > 0) {
      query = query.or(queryConditions.join(','));
    } else {
      return { success: true, orders: [] };
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch all dynamic products from DB to resolve product images for order items
      const { data: dbProducts } = await supabaseAdmin
        .from('products')
        .select('id, name_ar, name_en, main_image');

      const enrichedOrders = data.map(order => {
        const rawItems = order.order_items || order.items || [];
        const enrichedItems = rawItems.map(item => {
          let matchedProd = dbProducts?.find(p => String(p.id) === String(item.product_id || item.id));
          if (!matchedProd && item.product_name_ar) {
            matchedProd = dbProducts?.find(p => p.name_ar && p.name_ar.trim() === item.product_name_ar.trim());
          }
          if (!matchedProd && item.product_name_en) {
            matchedProd = dbProducts?.find(p => p.name_en && p.name_en.trim().toLowerCase() === item.product_name_en.trim().toLowerCase());
          }

          const image = item.image || item.main_image || item.mainImage || matchedProd?.main_image || null;

          return {
            ...item,
            image: image,
            main_image: image,
            mainImage: image
          };
        });

        return {
          ...order,
          order_items: enrichedItems,
          items: enrichedItems
        };
      });

      return { success: true, orders: enrichedOrders };
    }
  } catch (err) {
    console.warn('getCustomerOrdersAction note:', err);
  }
  return { success: false, orders: [] };
}

/**
 * Server Action: Saves a customer order into Supabase orders & order_items tables
 */
export async function createOrderAction(orderData) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const dbStatus = toDbStatus(orderData.status);

    let validUserId = null;
    if (orderData.userId && typeof orderData.userId === 'string') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderData.userId.trim());
      if (isUuid) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', orderData.userId.trim())
          .single();
        if (prof?.id) {
          validUserId = prof.id;
        }
      }
    }

    const orderPayload = {
      id: orderData.id,
      user_id: validUserId,
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

    let { data: newOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) {
      console.warn('First order insert attempt warning:', orderErr.message);
      if (orderErr.code === '23503' || orderErr.code === '22P02' || orderErr.message?.includes('user_id')) {
        orderPayload.user_id = null;
        const retryRes = await supabaseAdmin
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();
        if (!retryRes.error && retryRes.data) {
          newOrder = retryRes.data;
          orderErr = null;
        } else {
          console.error('Retry order insert error:', retryRes.error);
          return { success: false, error: 'فشل حفظ الطلب' };
        }
      } else {
        console.error('Order insert error:', orderErr);
        return { success: false, error: 'فشل حفظ الطلب' };
      }
    }

    // Insert order items if present
    const rawItems = orderData.items || [];
    if (newOrder && rawItems.length > 0) {
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
    const dbStatus = toDbStatus(newStatus);
    const isOutForDelivery = dbStatus === 'out_for_delivery';

    const { data: curr } = await supabaseAdmin.from('orders').select('delivery_notes').eq('id', orderId).single();
    let existingNotes = curr?.delivery_notes || '';

    if (isOutForDelivery) {
      if (!existingNotes.includes('[OUT_FOR_DELIVERY]')) {
        existingNotes = `${existingNotes} [OUT_FOR_DELIVERY]`.trim();
      }
    } else {
      existingNotes = existingNotes.replace(/\[OUT_FOR_DELIVERY\]/g, '').trim();
    }

    const updatePayload = {
      status: dbStatus,
      is_shipped: dbStatus === 'shipped' || dbStatus === 'out_for_delivery' || dbStatus === 'delivered',
      delivery_notes: existingNotes
    };

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
          .maybeSingle();
        if (prof?.email) customerEmail = prof.email;
      }

      if (!customerEmail && updated.customer_phone) {
        const cleanPhone = String(updated.customer_phone).trim();
        const { data: profs } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('phone', cleanPhone);
        if (profs && profs.length > 0 && profs[0]?.email) {
          customerEmail = profs[0].email;
        }
      }

      if (customerEmail) {
        console.log(`Sending order status update email for Order #${updated.id} to ${customerEmail}...`);
        const { getResendClient, SENDER_SUPPORT } = await import('../../lib/resend.js');
        const resend = getResendClient();
        const displayStatus = toDisplayStatus(dbStatus, updated.delivery_notes);

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

        const isCancelled = dbStatus === 'cancelled';

        const cancellationNoticeSection = isCancelled ? `
          <div style="background: #FEF2F2; border: 1px solid #FCA5A5; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center; color: #991B1B;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">⚠️ نأسف لإبلاغك بأنه تم إلغاء الطلب رقم #${updated.id}</div>
            <div style="font-size: 14px; line-height: 1.6; color: #7F1D1D; margin-bottom: 16px;">
              تم إلغاء هذا الطلب بسبب وجود خطأ أو عدم استكمال في بيانات الشحن أو الموبايل المرفقة مع الطلب. يمكنك إعادة الطلب بسهولة عبر الموقع بعد مراجعة البيانات، أو تواصل معنا مباشرة على الواتساب لمعرفة التفاصيل.
            </div>

            <div style="text-align: center; margin-top: 14px;">
              <a href="https://kemetmisr.com" target="_blank" style="display: inline-block; background: #0F172A; color: #FFFFFF; text-decoration: none; padding: 11px 20px; border-radius: 6px; font-size: 14px; font-weight: bold; margin: 5px;">
                🛒 إعادة الطلب من الموقع
              </a>
              <a href="https://api.whatsapp.com/send?phone=201114687759&text=${encodeURIComponent(`مرحباً KEMET، أود الاستفسار عن سبب إلغاء طلبي رقم: #${updated.id}`)}" target="_blank" style="display: inline-block; background: #25D366; color: #FFFFFF; text-decoration: none; padding: 11px 20px; border-radius: 6px; font-size: 14px; font-weight: bold; margin: 5px;">
                💬 معرفة سبب الإلغاء عبر الواتساب
              </a>
            </div>
          </div>
        ` : '';

        const courierNoticeSection = isOutForDelivery ? `
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

            ${cancellationNoticeSection}
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

        // Non-blocking background email notification
        resend.emails.send({
          from: SENDER_SUPPORT,
          to: [customerEmail],
          subject: `تحديث حالة طلبك #${updated.id} - KEMET`,
          html: emailHtml
        }).catch(emailErr => {
          console.warn('Status change email notification warning:', emailErr);
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

/**
 * Server Action: Sends mass promo email campaign to all registered customer emails
 */
export async function sendMassPromoEmailAction(params) {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const supabaseAdmin = getAdminSupabase();
    const emailSet = new Set();

    // 1. Safe fetch registered users from Supabase Auth
    try {
      const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!userErr && userData && userData.users) {
        userData.users.forEach(u => {
          if (u.email && u.email.includes('@')) {
            emailSet.add(u.email.trim().toLowerCase());
          }
        });
      }
    } catch (authErr) {
      console.warn('Auth users fetch note:', authErr);
    }

    // Default system support email
    emailSet.add('support@kemetmisr.com');

    const recipients = Array.from(emailSet);
    let rawText = '';
    if (typeof params === 'string') {
      rawText = params.trim();
    } else if (params && typeof params === 'object') {
      rawText = params.promoTextAr || params.textAr || params.promoText || '';
    }

    const promoContent = rawText ? String(rawText).trim() : '🔥 خصومات KEMET 2027 لفترة محدودة - تسوّق أطقم المنتخبات والأندية الرسمية الآن!';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px; background-color: #FFFFFF;" dir="rtl">
        <div style="text-align: right; margin-bottom: 20px;">
          <img src="https://kemetmisr.com/assets/kemet-text-logo.png" alt="KEMET" style="height: 32px;" />
        </div>
        
        <h2 style="color: #0F172A; font-size: 18px; margin-bottom: 16px;">🔥 عرض ترويجي حصري من KEMET</h2>
        
        <div style="background: #F8FAFC; border: 1px solid #CBD5E1; padding: 18px; border-radius: 6px; font-size: 15px; color: #0F172A; margin: 16px 0; line-height: 1.7;">
          ${promoContent}
        </div>

        <div style="text-align: center; margin: 24px 0 16px 0;">
          <a href="https://kemetmisr.com" target="_blank" style="display: inline-block; background: linear-gradient(90deg, #D4AF37, #FFDF73); color: #000000; font-weight: bold; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; box-shadow: 0 2px 4px rgba(212,175,55,0.25);">
            🛒 تصفّح المتجر واستفد بالعرض الآن
          </a>
        </div>

        <p style="color: #64748B; font-size: 13px; text-align: right; margin-top: 20px;">
          وصلك هذا البريد لأنك مسجّل في متجر KEMET الرسمي.
        </p>

        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
        
        <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
          KEMET — جميع الحقوق محفوظة &copy; 2026 (kemetmisr.com)
        </p>
      </div>
    `;

    const { getResendClient, SENDER_SUPPORT } = await import('../../lib/resend.js');
    const resend = getResendClient();

    // Batch send via Resend with exact delivery & fail tracking
    let sentCount = 0;
    let failedCount = 0;

    for (const email of recipients) {
      try {
        const resendRes = await resend.emails.send({
          from: SENDER_SUPPORT,
          to: [email],
          subject: '🔥 عرض خاص وحصري من KEMET!',
          html: emailHtml
        });

        if (resendRes?.data?.id) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (e) {
        failedCount++;
        console.warn(`Promo email send warning for ${email}:`, e);
      }
    }

    return { 
      success: true, 
      sentCount, 
      failedCount, 
      totalRecipients: recipients.length 
    };
  } catch (err) {
    console.error('sendMassPromoEmailAction error:', err);
    return { success: false, error: err.message || 'فشل إرسال البريد الجماعي' };
  }
}

/**
 * Server Action: Fetches live Banner Control Settings from Supabase DB
 */
export async function getBannerSettingsAction() {
  try {
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', 'banner_config')
      .single();

    if (!error && data) {
      return {
        success: true,
        isVisible: data.description_ar === 'true',
        textAr: data.name_ar || '⚡ شحن مجاني لجميع المحافظات لفترة محدودة! ⚡',
        textEn: data.name_en || ''
      };
    }
  } catch (err) {
    console.warn('getBannerSettingsAction error:', err);
  }
  return {
    success: true,
    isVisible: false,
    textAr: '⚡ شحن مجاني لجميع المحافظات لفترة محدودة! ⚡',
    textEn: ''
  };
}

/**
 * Server Action: Saves Banner Control Settings (Visibility & Text) to Supabase DB
 */
export async function saveBannerSettingsAction({ isVisible, textAr, textEn = '' }) {
  try {
    const supabaseAdmin = getAdminSupabase();
    const cleanText = textAr ? String(textAr).trim() : '⚡ شحن مجاني لجميع المحافظات لفترة محدودة! ⚡';

    const { data, error } = await supabaseAdmin
      .from('categories')
      .upsert({
        id: 'banner_config',
        name_ar: cleanText,
        name_en: textEn || cleanText,
        description_ar: isVisible ? 'true' : 'false',
        description_en: 'BANNER_CONFIG'
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('saveBannerSettingsAction DB error:', error);
      return { success: false, error: `فشل حفظ التغييرات في قاعدة البيانات: ${error.message}` };
    }

    // Synchronize legacy _cms_settings row as well to ensure total backward compatibility across deployed clients
    try {
      const cmsPayload = {
        isPromoActive: isVisible,
        promoTextAr: cleanText,
        promoTextEn: textEn || cleanText,
        isFreeShippingPromo: false
      };

      await supabaseAdmin
        .from('categories')
        .upsert({
          id: '_cms_settings',
          name_ar: JSON.stringify(cmsPayload),
          name_en: 'CMS_SETTINGS',
          description_ar: isVisible ? 'true' : 'false',
          description_en: 'CMS_SETTINGS'
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn('_cms_settings sync note:', e);
    }

    triggerBackgroundRevalidate(['/', '/admin', '/admin/products', '/admin/orders']);

    return {
      success: true,
      banner: {
        isVisible: data.description_ar === 'true',
        textAr: data.name_ar,
        textEn: data.name_en
      }
    };
  } catch (err) {
    console.error('saveBannerSettingsAction exception:', err);
    return { success: false, error: err.message || 'حدث خطأ في السيرفر أثناء حفظ البانر.' };
  }
}

/**
 * Server Action: Fetches real live registered users count from Supabase Auth & Profiles
 */
export async function getRegisteredUsersStatsAction() {
  try {
    const supabaseAdmin = getAdminSupabase();
    let userCount = 0;

    try {
      const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!userErr && userData && userData.users) {
        userCount = userData.users.length;
      }
    } catch (e) {
      console.warn('listUsers note:', e);
    }

    // Fallback/sync check profiles if listUsers returned 0
    if (userCount === 0) {
      const { count } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      userCount = count || 0;
    }

    return { success: true, count: userCount };
  } catch (err) {
    console.error('getRegisteredUsersStatsAction error:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Server Action: Sends a direct, targeted email message to a single order customer
 */
export async function sendDirectCustomerEmailAction({ orderId, recipientEmail, subject, message }) {
  try {
    if (!recipientEmail || !String(recipientEmail).includes('@')) {
      return { success: false, error: 'بريد العميل غير موجود أو غير صحيح.' };
    }
    if (!message || !String(message).trim()) {
      return { success: false, error: 'الرجاء كتابة نص الرسالة للعميل.' };
    }

    const resend = getResendClient();
    const cleanSubject = (subject && String(subject).trim()) || `تحديث بشأن طلبك رقم #${orderId} - KEMET`;
    const cleanMessage = String(message).trim();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F19; color: #FFFFFF; padding: 25px; border-radius: 12px; border: 1px solid #D4AF37; direction: rtl; text-align: right;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 15px;">
          <h1 style="color: #D4AF37; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px;">KEMET</h1>
          <p style="color: #A3A3A3; font-size: 13px; margin-top: 5px;">Build Your Legacy</p>
        </div>
        
        <div style="background: rgba(255,255,255,0.04); padding: 20px; border-radius: 8px; margin-bottom: 20px; border-right: 4px solid #D4AF37;">
          <h2 style="color: #D4AF37; font-size: 18px; margin-top: 0;">رسالة خاصة بشأن الطلب #${orderId} 📩</h2>
          <div style="color: #E5E5E5; font-size: 15px; line-height: 1.8; white-space: pre-wrap; margin-top: 10px;">${cleanMessage}</div>
        </div>

        <div style="font-size: 13px; color: #A3A3A3; text-align: center; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
          <p style="margin: 0;">رقم الطلب المرجعي: <strong style="color: #FFF;">#${orderId}</strong></p>
          <p style="margin: 5px 0 0 0;">شكراً لتسوقك من KEMET - لخدمة العملاء يسعدنا التواصل معك دائماً.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: SENDER_EMAIL,
      to: [recipientEmail.trim().toLowerCase()],
      subject: cleanSubject,
      html: emailHtml
    });

    if (error) {
      console.error('Resend sendDirectCustomerEmailAction error:', error);
      return { success: false, error: error.message || 'فشل إرسال البريد عبر Resend' };
    }

    return { success: true };
  } catch (err) {
    console.error('sendDirectCustomerEmailAction exception:', err);
    return { success: false, error: err.message || 'حدث خطأ أثناء إرسال البريد للعميل' };
  }
}


