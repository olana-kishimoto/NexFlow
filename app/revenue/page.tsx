'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
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

interface RevenueWithDetails {
  id: string;
  target_month: string;
  revenue_amount: number;
  gross_profit: number;
  invoice_status: string;
  cloudsign_status?: string;
  customer_name: string;
  service_description: string;
  agency_name?: string;
  mf_billing_id?: string;
}

export default function RevenuePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [revenues, setRevenues] = useState<RevenueWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().split('T')[0].slice(0, 7)
  );
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchRevenues = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('monthly_revenues')
          .select(`
            id,
            target_month,
            revenue_amount,
            gross_profit,
            invoice_status,
            mf_billing_id,
            contracts (
              cloudsign_status,
              orders (
                service_description,
                customers (
                  customer_name
                )
              )
            )
          `)
          .eq('target_month', `${selectedMonth}-01`);

        if (error) throw error;

        const formatted: RevenueWithDetails[] = (data || []).map((r: any) => ({
          id: r.id,
          target_month: r.target_month,
          revenue_amount: r.revenue_amount,
          gross_profit: r.gross_profit,
          invoice_status: r.invoice_status,
          cloudsign_status: r.contracts?.cloudsign_status,
          mf_billing_id: r.mf_billing_id,
          customer_name: r.contracts?.orders?.customers?.customer_name || 'N/A',
          service_description: r.contracts?.orders?.service_description || 'N/A',
          agency_name: r.contracts?.orders?.customers?.agency_name,
        }));

        setRevenues(formatted);

        const total = formatted.reduce((sum, r) => sum + r.revenue_amount, 0);
        const profit = formatted.reduce((sum, r) => sum + r.gross_profit, 0);
        const pending = formatted.filter((r) => r.invoice_status === 'pending').length;

        setTotalRevenue(total);
        setTotalProfit(profit);
        setPendingCount(pending);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenues();
  }, [user, selectedMonth]);

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

  if (!user) return null;

  const badgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary' as const;
      case 'invoiced':
        return 'default' as const;
      case 'cancelled':
        return 'destructive' as const;
      case 'sent':
        return 'outline' as const;
      case 'signed':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#0F0F0F] min-h-screen">
        <div className="px-6 py-6 border-b border-[#2A2A2A]">
          <h1 className="text-base font-semibold text-[#EDEDED]">売上管理</h1>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#888888]">
                  月額売上
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EDEDED]">
                  ¥{totalRevenue.toLocaleString('ja-JP')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#888888]">
                  月次粗利
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ¥{totalProfit.toLocaleString('ja-JP')}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#888888]">
                  請求待ち件数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingCount}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#888888]">
                  対象月
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-sm bg-[#2A2A2A] border-[#3A3A3A] text-[#EDEDED]"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-[#EDEDED]">月次売上一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-[#2A2A2A]" />
                  ))}
                </div>
              ) : revenues.length === 0 ? (
                <p className="text-center text-[#888888] py-8">
                  対象月の売上がありません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2A2A]">
                        <TableHead className="text-[#EDEDED]">顧客名</TableHead>
                        <TableHead className="text-[#EDEDED]">業務内容</TableHead>
                        <TableHead className="text-[#EDEDED]">代理店</TableHead>
                        <TableHead className="text-right text-[#EDEDED]">月額売上</TableHead>
                        <TableHead className="text-right text-[#EDEDED]">粗利</TableHead>
                        <TableHead className="text-[#EDEDED]">CloudSign状況</TableHead>
                        <TableHead className="text-[#EDEDED]">請求状況</TableHead>
                        <TableHead className="text-[#EDEDED]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenues.map((revenue) => (
                        <TableRow key={revenue.id} className="border-[#2A2A2A]">
                          <TableCell className="font-medium text-[#EDEDED]">
                            {revenue.customer_name}
                          </TableCell>
                          <TableCell className="text-sm text-[#EDEDED]">
                            {revenue.service_description}
                          </TableCell>
                          <TableCell className="text-sm text-[#EDEDED]">
                            {revenue.agency_name || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-[#EDEDED]">
                            ¥{revenue.revenue_amount.toLocaleString('ja-JP')}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            ¥{revenue.gross_profit.toLocaleString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {revenue.cloudsign_status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={badgeVariant(revenue.invoice_status)}>
                              {revenue.invoice_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {revenue.invoice_status === 'pending' ? (
                              <Button size="sm" variant="outline">
                                請求作成
                              </Button>
                            ) : (
                              <span className="text-sm text-[#888888]">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
