'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import CustomerForm from './customer-form';

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void;
  selectedCustomerId?: string;
}

export default function CustomerSelector({
  onSelect,
  selectedCustomerId,
}: CustomerSelectorProps) {
  const { user, profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        let query = supabase.from('customers').select('*');

        if (profile?.role === 'user') {
          query = query.eq('created_by', user.id);
        }

        const { data, error } = await query.order('customer_name');

        if (error) throw error;
        setCustomers(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [user, profile]);

  useEffect(() => {
    if (searchTerm.length < 1) {
      setFilteredCustomers([]);
      return;
    }

    const filtered = customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleCustomerSelect = (customer: Customer) => {
    onSelect(customer);
    setMode('select');
  };

  const handleFormSuccess = (customer: Customer) => {
    setCustomers((prev) => [
      ...prev.filter((c) => c.id !== customer.id),
      customer,
    ]);
    handleCustomerSelect(customer);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'select' | 'create')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="select">既存得意先から選択</TabsTrigger>
          <TabsTrigger value="create">新規得意先を登録</TabsTrigger>
        </TabsList>

        <TabsContent value="select" className="space-y-4">
          <Input
            placeholder="得意先名またはコードで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm.length >= 1 && filteredCustomers.length === 0 && (
            <div className="text-center text-[#94A3B8] py-8 text-13px">
              「{searchTerm}」に一致する得意先が見つかりません
            </div>
          )}

          {searchTerm.length >= 1 && filteredCustomers.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCustomerId === customer.id
                      ? 'bg-[#EEF2FF] border-[#818CF8]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-[#0F172A]">
                          {customer.customer_code && (
                            <span className="text-[#64748B] mr-2">
                              [{customer.customer_code}]
                            </span>
                          )}
                          {customer.customer_name}
                        </p>
                        {customer.representative_name && (
                          <p className="text-sm text-[#64748B]">
                            {customer.representative_name}
                            {customer.representative_title &&
                              ` (${customer.representative_title})`}
                          </p>
                        )}
                        {customer.contact_email && (
                          <p className="text-sm text-[#6366F1]">
                            {customer.contact_email}
                          </p>
                        )}
                        {customer.customer_address && (
                          <p className="text-xs text-[#94A3B8] mt-1">
                            {customer.customer_address}
                          </p>
                        )}
                      </div>
                      {selectedCustomerId === customer.id && (
                        <div className="text-[#10B981] font-semibold text-13px">選択中</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <Card className="bg-[#EEF2FF] border-[#E0E7FF]">
              <CardContent className="pt-4">
                <p className="text-13px font-semibold text-[#64748B] mb-2">
                  選択中の得意先
                </p>
                <p className="font-semibold text-base text-[#0F172A]">
                  {selectedCustomer.customer_code && (
                    <span className="text-[#64748B] mr-2">
                      [{selectedCustomer.customer_code}]
                    </span>
                  )}
                  {selectedCustomer.customer_name}
                </p>
                {selectedCustomer.customer_postal_code && (
                  <p className="text-13px text-[#64748B]">
                    {selectedCustomer.customer_postal_code}
                  </p>
                )}
                {selectedCustomer.customer_address && (
                  <p className="text-13px text-[#64748B]">
                    {selectedCustomer.customer_address}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create">
          <div className="space-y-4">
            <Button
              onClick={() => setFormOpen(true)}
              className="w-full"
            >
              新規得意先登録フォームを開く
            </Button>

            <CustomerForm
              open={formOpen}
              onOpenChange={setFormOpen}
              onSuccess={handleFormSuccess}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
