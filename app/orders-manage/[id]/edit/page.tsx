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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-8">受注編集</h1>
        <OrderFormEdit orderId={params.id} />
      </div>
    </div>
  );
}
