import React from 'react';
import { getAdminSupabase } from '../../../lib/supabase/admin';
import { AdminOrdersTable } from '../../../components/admin/AdminOrdersTable';
import { mapDbStatusToDisplay } from '../actions';

export const revalidate = 0; // Dynamic real-time admin view

export default async function AdminOrdersPage() {
  let ordersList = [];

  try {
    const supabaseAdmin = getAdminSupabase();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin orders:', error.message);
    } else if (data) {
      ordersList = await Promise.all(data.map(async o => ({
        id: o.id,
        status: await mapDbStatusToDisplay(o.status),
        created_at: o.created_at,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        governorate: o.governorate,
        address: o.address,
        notes: o.delivery_notes,
        subtotal: Number(o.subtotal),
        shipping_fee: Number(o.shipping_fee),
        total_amount: Number(o.total_amount),
        customer: {
          fullName: o.customer_name,
          phone: o.customer_phone,
          governorate: o.governorate,
          address: o.address,
          notes: o.delivery_notes
        },
        items: (o.order_items || []).map(item => ({
          id: item.product_id,
          nameAr: item.product_name_ar,
          nameEn: item.product_name_en,
          size: item.size,
          quantity: item.quantity,
          price: Number(item.unit_price)
        }))
      })));
    }
  } catch (err) {
    console.error('Unhandled error in AdminOrdersPage:', err);
  }

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
          <span className="brand-glow">📦 إدارة ومتابعة جميع طلبات العملاء</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          استعرض تفاصيل الشحنات، غير حالة الطلب في قاعدة البيانات، وتابع تفاصيل العنوان والتواصل فورياً
        </p>
      </div>

      <AdminOrdersTable initialOrders={ordersList} />
    </div>
  );
}
