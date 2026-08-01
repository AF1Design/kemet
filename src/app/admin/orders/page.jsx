import React from 'react';
import { getAdminSupabase } from '../../../lib/supabase/admin';
import { AdminOrdersTable } from '../../../components/admin/AdminOrdersTable';

export const revalidate = 0; // Dynamic real-time admin view

export default async function AdminOrdersPage() {
  let ordersList = [];

  try {
    const supabaseAdmin = getAdminSupabase();

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin orders:', error.message);
    } else if (data) {
      ordersList = data;
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
