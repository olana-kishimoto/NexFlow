'use client';

import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { OrderFormNew } from '@/components/orders/order-form-new';
import { OrderListNew } from '@/components/orders/order-list-new';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  const handleOrderCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setShowForm(false);
  };

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#F8FAFC] min-h-screen">
        <div className="px-6 py-6 border-b border-[#E2E8F0]">
          <h1 className="text-base font-semibold text-[#0F172A]">受注入力</h1>
        </div>
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-[#64748B] mt-1">新規受注を登録または管理します</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="h-4 w-4" />
              新規受注入力
            </Button>
          </div>

          {showForm && (
            <Card className="mb-8 bg-[#FFFFFF] border-[#E2E8F0]">
              <CardHeader>
                <CardTitle className="text-[#0F172A]">新規受注情報</CardTitle>
                <CardDescription className="text-[#64748B]">以下の情報を入力して送信してください</CardDescription>
              </CardHeader>
              <CardContent>
                <OrderFormNew />
              </CardContent>
            </Card>
          )}

          <OrderListNew key={refreshKey} />
        </div>
      </main>
    </div>
  );
}
