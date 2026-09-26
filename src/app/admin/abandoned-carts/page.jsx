import React from 'react';
import { getAbandonedCartsAction } from '../actions';
import { AbandonedCartsControl } from '../../../components/admin/AbandonedCartsControl';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export const metadata = {
  title: 'السلات المتروكة والعملاء المسجلين - لوحة تحكم KEMET',
  robots: {
    index: false,
    follow: false
  }
};

export default async function AbandonedCartsPage() {
  let abandonedCarts = [];
  let registeredLeads = [];
  let allRegisteredAccounts = [];
  let buyers = [];
  let stats = {
    abandonedCartsCount: 0,
    potentialRevenue: 0,
    registeredLeadsCount: 0,
    totalAccounts: 0,
    buyersCount: 0,
    conversionRate: '0%'
  };

  try {
    const res = await getAbandonedCartsAction();
    if (res.success) {
      abandonedCarts = res.abandonedCarts || [];
      registeredLeads = res.registeredLeads || [];
      allRegisteredAccounts = res.allRegisteredAccounts || [];
      buyers = res.buyers || [];
      stats = res.stats || stats;
    }
  } catch (err) {
    console.error('AbandonedCartsPage load exception:', err);
  }

  return (
    <AbandonedCartsControl
      initialAbandonedCarts={abandonedCarts}
      initialRegisteredLeads={registeredLeads}
      initialAllRegisteredAccounts={allRegisteredAccounts}
      initialBuyers={buyers}
      initialStats={stats}
    />
  );
}
