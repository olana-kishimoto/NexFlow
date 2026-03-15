'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function OrderList() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        let query = supabase.from('orders').select(`
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
        `);

        if (profile?.role === 'user') {
          query = query.eq('created_by', user.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

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
  }, [user, profile]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">受注がまだありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">業務内容: {order.service_description}</p>
              </div>
              <Badge variant="outline">{order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">契約金額</span>
                <p className="font-semibold">
                  ¥{(order.amount * (1 + order.tax_rate / 100)).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-gray-600">契約期間</span>
                <p className="font-semibold">{order.start_date} ～ {order.end_date}</p>
              </div>
              <div>
                <span className="text-gray-600">担当メール</span>
                <p className="font-semibold text-blue-600">{order.contact_email}</p>
              </div>
              <div>
                <span className="text-gray-600">作成日</span>
                <p className="font-semibold">{new Date(order.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Link href={`/orders/${order.id}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  詳細・PDF生成
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
