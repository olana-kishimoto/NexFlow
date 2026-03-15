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
  const [loading, setLoading] = useState(true);
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
        setFilteredCustomers(data || []);
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

          {loading ? (
            <div className="text-center text-gray-600 py-8">読み込み中...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center text-gray-600 py-8">
              得意先が見つかりません
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCustomerId === customer.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {customer.customer_code && (
                            <span className="text-gray-600 mr-2">
                              [{customer.customer_code}]
                            </span>
                          )}
                          {customer.customer_name}
                        </p>
                        {customer.representative_name && (
                          <p className="text-sm text-gray-600">
                            {customer.representative_name}
                            {customer.representative_title &&
                              ` (${customer.representative_title})`}
                          </p>
                        )}
                        {customer.contact_email && (
                          <p className="text-sm text-blue-600">
                            {customer.contact_email}
                          </p>
                        )}
                        {customer.customer_address && (
                          <p className="text-xs text-gray-500 mt-1">
                            {customer.customer_address}
                          </p>
                        )}
                      </div>
                      {selectedCustomerId === customer.id && (
                        <div className="text-green-600 font-semibold">選択中</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedCustomer && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  選択中の得意先
                </p>
                <p className="font-semibold text-lg">
                  {selectedCustomer.customer_code && (
                    <span className="text-gray-600 mr-2">
                      [{selectedCustomer.customer_code}]
                    </span>
                  )}
                  {selectedCustomer.customer_name}
                </p>
                {selectedCustomer.customer_postal_code && (
                  <p className="text-sm text-gray-600">
                    {selectedCustomer.customer_postal_code}
                  </p>
                )}
                {selectedCustomer.customer_address && (
                  <p className="text-sm text-gray-600">
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
