'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import CustomerSelector from '@/components/customers/customer-selector';

interface OrderFormProps {
  onSuccess?: () => void;
}

export default function OrderForm({ onSuccess }: OrderFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    contract_date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    service_description: '',
    special_notes: '',
    amount: '',
    tax_rate: '10',
    commission_rate: '',
    payment_due_date: '',
  });

  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (name === 'amount' || name === 'tax_rate' || name === 'commission_rate') {
      const amount = parseFloat(updated.amount) || 0;
      const rate = parseFloat(updated.tax_rate) || 0;
      const commissionRate = parseFloat(updated.commission_rate) || 0;

      const tax = amount * (rate / 100);
      const total = amount + tax;
      const profit = amount * (1 - commissionRate / 100);

      setTaxAmount(tax);
      setTotalAmount(total);
      setGrossProfit(profit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) throw new Error('未認証');
      if (!selectedCustomer) throw new Error('得意先を選択してください');

      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: selectedCustomer.id,
            created_by: user.id,
            ...formData,
            amount: parseFloat(formData.amount) || 0,
            tax_rate: parseFloat(formData.tax_rate) || 10,
            commission_rate: parseFloat(formData.commission_rate) || 0,
            payment_due_date: formData.payment_due_date || null,
            status: 'draft',
          },
        ])
        .select();

      if (error) throw error;

      toast({ title: 'success', description: '受注を作成しました' });
      setFormData({
        contract_date: new Date().toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        service_description: '',
        special_notes: '',
        amount: '',
        tax_rate: '10',
        commission_rate: '',
        payment_due_date: '',
      });
      setSelectedCustomer(null);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">得意先選択 *</h3>
        <CustomerSelector
          onSelect={setSelectedCustomer}
          selectedCustomerId={selectedCustomer?.id}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">契約情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">契約日 *</label>
            <Input
              type="date"
              name="contract_date"
              value={formData.contract_date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">利用開始日 *</label>
            <Input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">利用終了日 *</label>
            <Input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">支払期限</label>
            <Input
              type="date"
              name="payment_due_date"
              value={formData.payment_due_date}
              onChange={handleChange}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">業務内容 *</label>
            <Textarea
              name="service_description"
              value={formData.service_description}
              onChange={handleChange}
              required
              rows={3}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">特約事項</label>
            <Textarea
              name="special_notes"
              value={formData.special_notes}
              onChange={handleChange}
              rows={3}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">料金情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">受注金額（税抜） *</label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">消費税率 (%)</label>
            <Input
              type="number"
              name="tax_rate"
              value={formData.tax_rate}
              onChange={handleChange}
              step="0.1"
            />
          </div>
        </div>

        {formData.amount && (
          <Card className="mt-4 bg-blue-50">
            <CardContent className="pt-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>消費税額:</span>
                <span className="font-semibold">¥{taxAmount.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>税込合計:</span>
                <span className="font-bold">¥{totalAmount.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">代理店手数料率 (%)</label>
          <Input
            type="number"
            name="commission_rate"
            value={formData.commission_rate}
            onChange={handleChange}
            step="0.01"
          />
        </div>

        {grossProfit > 0 && (
          <Card className="mt-4 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm font-semibold">
                <span>粗利:</span>
                <span>¥{grossProfit.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? '送信中...' : '受注を作成'}
        </Button>
      </div>
    </form>
  );
}
