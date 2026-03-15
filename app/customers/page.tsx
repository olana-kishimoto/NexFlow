'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import CustomerForm from '@/components/customers/customer-form';
import { CreditCard as Edit, Trash2 } from 'lucide-react';

interface CustomerWithOrderCount extends Customer {
  order_count?: number;
}

export default function CustomersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithOrderCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithOrderCount[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }

    if (
      !authLoading &&
      user &&
      profile?.role !== 'admin' &&
      profile?.role !== 'developer'
    ) {
      router.push('/dashboard');
    }
  }, [user, authLoading, profile, router]);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        let query = supabase.from('customers').select(`
          *,
          orders(id)
        `);

        if (profile?.role === 'user') {
          query = query.eq('created_by', user.id);
        }

        const { data, error } = await query.order('customer_name');

        if (error) throw error;

        const formatted = (data || []).map((c: any) => ({
          ...c,
          order_count: c.orders?.length || 0,
        }));

        setCustomers(formatted);
        setFilteredCustomers(formatted);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [user, profile]);

  useEffect(() => {
    const filtered = customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleFormSuccess = (customer: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...customer, order_count: c.order_count } : c))
    );
    setSelectedCustomer(null);
  };

  const handleDelete = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    if (customer.order_count && customer.order_count > 0) {
      toast({
        title: 'エラー',
        description: '契約がある得意先は削除できません',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('この得意先を削除してもよろしいですか？')) return;

    setDeleting(customerId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      toast({ title: 'success', description: '得意先を削除しました' });
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

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
      <main className="ml-[220px] bg-[#F8FAFC] min-h-screen">
        <div className="px-6 py-6 border-b border-[#E2E8F0]">
          <h1 className="text-base font-semibold text-[#0F172A]">得意先管理</h1>
        </div>
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-8">
            <Button
              onClick={() => {
                setSelectedCustomer(null);
                setFormOpen(true);
              }}
            >
              新規得意先を登録
            </Button>
          </div>

          <Card className="bg-[#FFFFFF] border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#0F172A]">得意先一覧</CardTitle>
                <Input
                  type="text"
                  placeholder="得意先名またはコードで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-[#F8FAFC]" />
                  ))}
                </div>
              ) : filteredCustomers.length === 0 ? (
                <p className="text-center text-[#64748B] py-8">
                  得意先が見つかりません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#E2E8F0]">
                        <TableHead className="text-[#0F172A]">得意先コード</TableHead>
                        <TableHead className="text-[#0F172A]">得意先名</TableHead>
                        <TableHead className="text-[#0F172A]">代表者</TableHead>
                        <TableHead className="text-[#0F172A]">メール</TableHead>
                        <TableHead className="text-[#0F172A]">代理店</TableHead>
                        <TableHead className="text-center text-[#0F172A]">契約件数</TableHead>
                        <TableHead className="text-[#0F172A]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="border-[#E2E8F0]">
                          <TableCell className="font-mono text-sm text-[#0F172A]">
                            {customer.customer_code || '-'}
                          </TableCell>
                          <TableCell className="font-medium text-[#0F172A]">
                            {customer.customer_name}
                          </TableCell>
                          <TableCell className="text-sm text-[#64748B]">
                            {customer.representative_name || '-'}
                            {customer.representative_title &&
                              ` (${customer.representative_title})`}
                          </TableCell>
                          <TableCell className="text-sm text-blue-600">
                            {customer.contact_email || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-[#0F172A]">
                            {customer.agency_name || '-'}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-[#0F172A]">
                            {customer.order_count}件
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(customer)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                編集
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(customer.id)}
                                disabled={
                                  (customer.order_count ?? 0) > 0 ||
                                  deleting === customer.id
                                }
                                className="gap-2 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                削除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <CustomerForm
            open={formOpen}
            onOpenChange={setFormOpen}
            onSuccess={handleFormSuccess}
            initialCustomer={selectedCustomer || undefined}
          />
        </div>
      </main>
    </div>
  );
}
