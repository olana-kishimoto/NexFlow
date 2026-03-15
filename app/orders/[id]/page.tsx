'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !params.id) return;

      try {
        let query = supabase
          .from('orders')
          .select('*')
          .eq('id', params.id as string);

        if (profile?.role === 'user') {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (!data) {
          router.push('/orders');
          return;
        }

        setOrder(data);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [user, profile, params.id, router]);

  if (authLoading || loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const amountWithTax = order.amount_before_tax * (1 + order.tax_rate / 100);
  const taxAmount = order.amount_before_tax * (order.tax_rate / 100);
  const commissionAmount = order.amount_before_tax * ((order.agency_commission_rate || 0) / 100);
  const grossProfit = order.amount_before_tax * (1 - (order.agency_commission_rate || 0) / 100);

  return (
    <div>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{order.customer_name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                顧客情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">顧客名</span>
                <p className="font-semibold">{order.customer_name}</p>
              </div>
              {order.representative_title && (
                <div>
                  <span className="text-gray-600">代表者職名</span>
                  <p className="font-semibold">{order.representative_title}</p>
                </div>
              )}
              {order.representative_name && (
                <div>
                  <span className="text-gray-600">代表者氏名</span>
                  <p className="font-semibold">{order.representative_name}</p>
                </div>
              )}
              {order.postal_code && (
                <div>
                  <span className="text-gray-600">郵便番号</span>
                  <p className="font-semibold">{order.postal_code}</p>
                </div>
              )}
              {order.address && (
                <div>
                  <span className="text-gray-600">住所</span>
                  <p className="font-semibold">{order.address}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">担当メール</span>
                <p className="font-semibold text-blue-600">{order.contact_email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                契約期間
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">契約日</span>
                <p className="font-semibold">{order.contract_date}</p>
              </div>
              <div>
                <span className="text-gray-600">利用開始日</span>
                <p className="font-semibold">{order.start_date}</p>
              </div>
              <div>
                <span className="text-gray-600">利用終了日</span>
                <p className="font-semibold">{order.end_date}</p>
              </div>
              {order.payment_due_date && (
                <div>
                  <span className="text-gray-600">支払期限</span>
                  <p className="font-semibold">{order.payment_due_date}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>業務内容</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{order.service_description}</p>
          </CardContent>
        </Card>

        {order.special_terms && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>特約事項</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{order.special_terms}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>料金情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">受注金額（税抜）</span>
                <span className="font-semibold">
                  ¥{order.amount_before_tax.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">消費税 ({order.tax_rate}%)</span>
                <span className="font-semibold">
                  ¥{taxAmount.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-3 font-bold">
                <span>合計（税込）</span>
                <span>¥{amountWithTax.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</span>
              </div>

              {order.agency_commission_rate ? (
                <>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">代理店手数料率</span>
                      <span className="font-semibold">{order.agency_commission_rate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">代理店手数料</span>
                      <span className="font-semibold text-red-600">
                        -¥{commissionAmount.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {order.agency_name && (
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-gray-600">代理店名</span>
                        <span className="font-semibold">{order.agency_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-sm border-t pt-3 font-bold text-green-600">
                    <span>粗利</span>
                    <span>¥{grossProfit.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/api/contract-pdf?orderId=${order.id}`;
              link.download = `contract_${order.customer_name}_${order.contract_date}.pdf`;
              link.click();
            }}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            契約書PDF ダウンロード
          </Button>
        </div>
      </div>
    </div>
  );
}
