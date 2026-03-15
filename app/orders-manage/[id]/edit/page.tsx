'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { OrderFormEdit } from '@/components/orders/order-form-edit';
import { useEffect } from 'react';

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }

    if (!authLoading && user && profile?.role !== 'admin' && profile?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [user, authLoading, profile, router]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#0F0F0F] min-h-screen">
        <div className="px-6 py-6 border-b border-[#2A2A2A]">
          <h1 className="text-base font-semibold text-[#EDEDED]">受注編集</h1>
        </div>

        <div className="px-6 py-6">
          <OrderFormEdit orderId={params.id} />
        </div>
      </main>
    </div>
  );
}
