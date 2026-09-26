import React from 'react';
import { getCustomersFinancialOverviewAction } from '../actions';
import { CustomersFinanceClient } from '../../../components/admin/CustomersFinanceClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export const metadata = {
  title: 'الحساب المالي للعملاء - لوحة تحكم KEMET',
  description: 'إدارة ومتابعة الحسابات المالية للعملاء، أرصدة المحافظ، وسجلات الشراء والتعويضات'
};

export default async function AdminCustomersFinancePage() {
  const financialData = await getCustomersFinancialOverviewAction();

  return (
    <div>
      <CustomersFinanceClient initialData={financialData} />
    </div>
  );
}
