'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderListNew } from '@/components/orders/order-list-new';
import Link from 'next/link';
import { useEffect } from 'react';

export default function OrdersManagePage() {
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

  if (authLoading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'developer')) {
    return null;
  }

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#0F0F0F] min-h-screen">
        <div className="px-6 py-6 border-b border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-[#EDEDED]">受注管理</h1>
            <Link href="/orders-manage/new">
              <Button>新規受注</Button>
            </Link>
          </div>
        </div>

        <div className="px-6 py-6">
          <OrderListNew />
        </div>
      </main>
    </div>
  );
}
