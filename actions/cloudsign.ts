'use server';

import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import { ContractPDF } from '@/components/contract/contract-pdf';
import React from 'react';

async function getCloudSignToken(): Promise<string> {
  const supabaseServer = await createClient();
  const { data: settings } = await supabaseServer
    .from('system_settings')
    .select('value')
    .eq('key', 'CLOUDSIGN_CLIENT_ID')
    .maybeSingle();

  if (!settings?.value) {
    throw new Error('CLOUDSIGN_CLIENT_ID not configured');
  }

  const response = await fetch('https://api.cloudsign.jp/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${encodeURIComponent(settings.value)}`,
  });

  if (!response.ok) {
    throw new Error(`Failed to get CloudSign token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createDocument(accessToken: string, contactEmail: string): Promise<string> {
  const response = await fetch('https://api.cloudsign.jp/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Contract_${Date.now()}`,
      contact_email: contactEmail,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create CloudSign document: ${response.statusText}`);
  }

  const data = await response.json();
  return data.document_id;
}

async function uploadPDF(
  accessToken: string,
  documentId: string,
  pdfBuffer: Buffer
): Promise<void> {
  const formData = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  formData.append('file', blob, 'contract.pdf');

  const response = await fetch(`https://api.cloudsign.jp/documents/${documentId}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload PDF: ${response.statusText}`);
  }
}

async function setRecipient(
  accessToken: string,
  documentId: string,
  contactEmail: string
): Promise<void> {
  const response = await fetch(`https://api.cloudsign.jp/documents/${documentId}/recipients`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: contactEmail,
      type: 'signer',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to set recipient: ${response.statusText}`);
  }
}

async function sendDocument(accessToken: string, documentId: string): Promise<void> {
  const response = await fetch(`https://api.cloudsign.jp/documents/${documentId}/sent`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to send document: ${response.statusText}`);
  }
}

export async function sendContractToCloudSign(
  contractId: string,
  orderId: string,
  contactEmail: string
): Promise<{ success: boolean; error?: string; documentId?: string }> {
  try {
    const supabaseServer = await createClient();
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

    const { data: order } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const token = await getCloudSignToken();
    const documentId = await createDocument(token, contactEmail);

    const pdf = await renderToStream(React.createElement(ContractPDF, { order }) as any);
    const chunks: (Buffer | string)[] = [];
    for await (const chunk of pdf) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks.map((c) => (typeof c === 'string' ? Buffer.from(c) : c)));

    await uploadPDF(token, documentId, pdfBuffer);
    await setRecipient(token, documentId, contactEmail);
    await sendDocument(token, documentId);

    const { error: updateError } = await supabaseServer
      .from('contracts')
      .update({
        cloudsign_document_id: documentId,
        cloudsign_status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (updateError) {
      throw updateError;
    }

    return { success: true, documentId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('CloudSign error:', message);
    return { success: false, error: message };
  }
}
