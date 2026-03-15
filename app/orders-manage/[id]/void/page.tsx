'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { VoidOrderDialog } from '@/components/orders/void-order-dialog';
import { useEffect, useState } from 'react';

export default function VoidOrderPage({ params }: { params: { id: string } }) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(true);

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
        <VoidOrderDialog
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen);
            if (!newOpen) {
              router.push('/orders-manage');
            }
          }}
          orderId={params.id}
        />
      </div>
    </div>
  );
}
