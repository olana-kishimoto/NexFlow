'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface ContractDetail {
  id: string;
  customer_name: string;
  service_description: string;
  cloudsign_status: string;
  contract_start: string;
  contract_end: string;
  amount: number;
  commission_rate?: number;
}

export default function ContractsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }

    if (!authLoading && user && profile?.role !== 'admin' && profile?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [user, authLoading, profile, router]);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('contracts')
          .select(`
            id,
            cloudsign_document_id,
            cloudsign_status,
            contract_start,
            contract_end,
            orders (
              service_description,
              amount,
              commission_rate,
              customers (
                customer_name
              )
            )
          `)
          .not('cloudsign_document_id', 'is', null);

        if (error) throw error;

        const formatted: ContractDetail[] = (data || []).map((c: any) => ({
          id: c.id,
          customer_name: c.orders?.customers?.customer_name || 'N/A',
          service_description: c.orders?.service_description || 'N/A',
          cloudsign_status: c.cloudsign_status,
          contract_start: c.contract_start,
          contract_end: c.contract_end,
          amount: c.orders?.amount || 0,
          commission_rate: c.orders?.commission_rate,
        }));

        setContracts(formatted);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
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

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary' as const;
      case 'sent':
        return 'outline' as const;
      case 'signed':
        return 'default' as const;
      case 'expired':
        return 'secondary' as const;
      case 'cancelled':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#F8FAFC] min-h-screen">
        <div className="px-6 py-6 border-b border-[#E2E8F0]">
          <h1 className="text-base font-semibold text-[#0F172A]">契約管理</h1>
        </div>
        <div className="px-6 py-6">
          <Card className="bg-[#FFFFFF] border-[#E2E8F0]">
            <CardHeader>
              <CardTitle className="text-[#0F172A]">契約一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-[#F8FAFC]" />
                  ))}
                </div>
              ) : contracts.length === 0 ? (
                <p className="text-center text-[#64748B] py-8">
                  CloudSign連携済みの契約がありません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#E2E8F0]">
                        <TableHead className="text-[#0F172A]">顧客名</TableHead>
                        <TableHead className="text-[#0F172A]">業務内容</TableHead>
                        <TableHead className="text-[#0F172A]">契約期間</TableHead>
                        <TableHead className="text-right text-[#0F172A]">月額金額</TableHead>
                        <TableHead className="text-right text-[#0F172A]">粗利</TableHead>
                        <TableHead className="text-[#0F172A]">ステータス</TableHead>
                        <TableHead className="text-[#0F172A]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((contract) => {
                        const grossProfit =
                          contract.amount *
                          (1 - (contract.commission_rate || 0) / 100);

                        return (
                          <TableRow key={contract.id} className="border-[#E2E8F0]">
                            <TableCell className="font-medium text-[#0F172A]">
                              {contract.customer_name}
                            </TableCell>
                            <TableCell className="text-sm text-[#0F172A]">
                              {contract.service_description}
                            </TableCell>
                            <TableCell className="text-sm text-[#0F172A]">
                              {contract.contract_start} ～ {contract.contract_end}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-[#0F172A]">
                              ¥
                              {contract.amount.toLocaleString('ja-JP')}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              ¥{grossProfit.toLocaleString('ja-JP')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={statusBadgeVariant(
                                  contract.cloudsign_status
                                )}
                              >
                                {contract.cloudsign_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {contract.cloudsign_status === 'sent' ? (
                                <Button size="sm" variant="outline">
                                  確認
                                </Button>
                              ) : (
                                <span className="text-sm text-[#64748B]">-</span>
                              )}
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
      </main>
    </div>
  );
}
