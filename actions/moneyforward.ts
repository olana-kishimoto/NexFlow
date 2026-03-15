'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

const supabaseServer = getSupabaseServerClient();

interface MFBillingItem {
  name: string;
  unit_price: number;
  quantity: number;
  excise: string;
}

async function getMFSettings() {
  const { data: settings } = await supabaseServer
    .from('system_settings')
    .select('key, value')
    .in('key', [
      'MF_CLIENT_ID',
      'MF_CLIENT_SECRET',
      'MF_REDIRECT_URI',
      'MF_OFFICE_ID',
    ]);

  const config: Record<string, string> = {};
  settings?.forEach((s) => {
    config[s.key] = s.value;
  });

  return config;
}

async function refreshMFToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const config = await getMFSettings();

  const response = await fetch('https://app.moneyforward.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.MF_CLIENT_ID,
      client_secret: config.MF_CLIENT_SECRET,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh MF token: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
  };
}

async function createPartner(
  accessToken: string,
  partnerName: string
): Promise<string> {
  const response = await fetch('https://app.moneyforward.com/api/v3/partners', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      partner: {
        name: partnerName,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create partner: ${response.statusText}`);
  }

  const data = await response.json();
  return data.partner.id;
}

async function createBilling(
  accessToken: string,
  departmentId: string,
  billingDate: string,
  dueDate: string
): Promise<string> {
  const response = await fetch('https://app.moneyforward.com/api/v3/invoice_template_billings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoice_template_billing: {
        department_id: departmentId,
        billing_date: billingDate,
        due_date: dueDate,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create billing: ${response.statusText}`);
  }

  const data = await response.json();
  return data.invoice_template_billing.id;
}

async function addBillingItem(
  accessToken: string,
  billingId: string,
  item: MFBillingItem
): Promise<void> {
  const response = await fetch(
    `https://app.moneyforward.com/api/v3/billings/${billingId}/items`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billing_item: {
          name: item.name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          excise: item.excise,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to add billing item: ${response.statusText}`);
  }
}

export async function createMFInvoice(
  revenueId: string,
  contractId: string,
  partnerName: string,
  serviceDescription: string,
  amount: number,
  targetMonth: string,
  accessToken: string,
  refreshToken: string
): Promise<{ success: boolean; error?: string; billingId?: string }> {
  try {
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return { success: false, error: '認証が必要です' };
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'developer'].includes(profile.role)) {
      return { success: false, error: '権限がありません' };
    }

    let currentAccessToken = accessToken;
    let currentRefreshToken = refreshToken;

    try {
      const refreshed = await refreshMFToken(currentRefreshToken);
      currentAccessToken = refreshed.accessToken;
      currentRefreshToken = refreshed.refreshToken;
    } catch (e) {
      console.warn('Failed to refresh token, using existing:', e);
    }

    const config = await getMFSettings();
    if (!config.MF_OFFICE_ID) {
      throw new Error('MF_OFFICE_ID not configured');
    }

    const billingDate = new Date(targetMonth).toISOString().split('T')[0];
    const dueDate = new Date(new Date(targetMonth).setMonth(new Date(targetMonth).getMonth() + 1))
      .toISOString()
      .split('T')[0];

    const billingId = await createBilling(
      currentAccessToken,
      config.MF_OFFICE_ID,
      billingDate,
      dueDate
    );

    const item: MFBillingItem = {
      name: serviceDescription,
      unit_price: Math.round(amount),
      quantity: 1,
      excise: 'ten_percent',
    };

    await addBillingItem(currentAccessToken, billingId, item);

    const { error: updateError } = await supabaseServer
      .from('monthly_revenues')
      .update({
        invoice_status: 'invoiced',
        mf_billing_id: billingId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', revenueId);

    if (updateError) {
      throw updateError;
    }

    return { success: true, billingId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('MoneyForward error:', message);
    return { success: false, error: message };
  }
}

export async function generateCSVExport(
  revenues: Array<{
    id: string;
    target_month: string;
    revenue_amount: number;
    gross_profit: number;
  }>
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return { success: false, error: '認証が必要です' };
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'developer'].includes(profile.role)) {
      return { success: false, error: '権限がありません' };
    }

    let csv = 'ID,対象月,月額売上,粗利\n';

    revenues.forEach((revenue) => {
      csv += `"${revenue.id}","${revenue.target_month}","${revenue.revenue_amount}","${revenue.gross_profit}"\n`;
    });

    return { success: true, data: csv };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
