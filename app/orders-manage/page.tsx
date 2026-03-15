'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Order } from '@/lib/types';
import Link from 'next/link';

export default function OrdersManagePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }

    if (!authLoading && user && profile?.role !== 'admin' && profile?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [user, authLoading, profile, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            customers (
              customer_name,
              representative_title,
              representative_name,
              customer_address,
              customer_postal_code,
              contact_email,
              agency_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const formatted = (data || []).map((order: any) => ({
          ...order,
          customer_name: order.customers?.customer_name || 'N/A',
          representative_title: order.customers?.representative_title,
          representative_name: order.customers?.representative_name,
          customer_address: order.customers?.customer_address,
          customer_postal_code: order.customers?.customer_postal_code,
          contact_email: order.customers?.contact_email,
          agency_name: order.customers?.agency_name,
        }));
        setOrders(formatted);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

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

  const filteredOrders = orders.filter(
    (o) =>
      (o.customer_name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (o.contact_email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
  );

  const statusCounts = {
    draft: orders.filter((o) => o.status === 'draft').length,
    submitted: orders.filter((o) => o.status === 'submitted').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">受注管理</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                下書き
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.draft}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                提出済み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.submitted}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                キャンセル
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statusCounts.cancelled}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                合計受注数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>受注一覧</CardTitle>
              <Input
                type="text"
                placeholder="顧客名またはメール検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                受注が見つかりません
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>顧客名</TableHead>
                      <TableHead>業務内容</TableHead>
                      <TableHead>契約期間</TableHead>
                      <TableHead className="text-right">税込金額</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>作成日</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const totalAmount = order.amount * (1 + order.tax_rate / 100);

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.customer_name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.service_description.substring(0, 50)}...
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.start_date} ～ {order.end_date}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ¥{totalAmount.toLocaleString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === 'draft'
                                  ? 'secondary'
                                  : order.status === 'submitted'
                                    ? 'default'
                                    : 'destructive'
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(order.created_at).toLocaleDateString(
                              'ja-JP'
                            )}
                          </TableCell>
                          <TableCell>
                            <Link href={`/orders/${order.id}`}>
                              <Button size="sm" variant="outline">
                                詳細
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
