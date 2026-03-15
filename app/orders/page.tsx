'use client';

import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import OrderForm from '@/components/orders/order-form';
import OrderList from '@/components/orders/order-list';

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">受注入力</h1>
            <p className="text-gray-600 mt-1">新規受注を登録または管理します</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            新規受注入力
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>新規受注情報</CardTitle>
              <CardDescription>以下の情報を入力して送信してください</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderForm onSuccess={handleOrderCreated} />
            </CardContent>
          </Card>
        )}

        <OrderList key={refreshKey} />
      </div>
    </div>
  );
}
