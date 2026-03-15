'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import CustomerSelector from '@/components/customers/customer-selector';

interface FormData {
  customer_id: string;
  contract_date: string;
  start_date: string;
  end_date: string;
  payment_due_date: string;
  service_description: string;
  special_terms: string;
  amount: string;
  tax_rate: string;
  commission_rate: string;
}

interface CustomerType {
  id: string;
  customer_name: string;
  customer_code?: string;
}

interface Order {
  id: string;
  customer_id: string;
  contract_date: string;
  start_date: string;
  end_date: string;
  payment_due_date: string;
  service_description: string;
  special_terms: string;
  amount: number;
  tax_rate: number;
  commission_rate: number;
  status: string;
  customers?: {
    customer_name: string;
    customer_code: string;
  };
}

export function OrderFormEdit({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    contract_date: '',
    start_date: '',
    end_date: '',
    payment_due_date: '',
    service_description: '',
    special_terms: '',
    amount: '',
    tax_rate: '',
    commission_rate: '',
  });

  const supabase = createClient();

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customer_id: selectedCustomer.id,
      }));
    }
  }, [selectedCustomer]);

  async function fetchOrder() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, customers(customer_name, customer_code)')
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('受注が見つかりません');
        router.push('/orders-manage');
        return;
      }

      if (data.status !== 'draft') {
        toast.error('下書きステータスのみ編集可能です');
        router.push('/orders-manage');
        return;
      }

      setOrder(data);
      setSelectedCustomer({
        id: data.customer_id,
        customer_name: data.customers?.customer_name || '',
        customer_code: data.customers?.customer_code || '',
      });
      setFormData({
        customer_id: data.customer_id,
        contract_date: data.contract_date,
        start_date: data.start_date,
        end_date: data.end_date,
        payment_due_date: data.payment_due_date,
        service_description: data.service_description,
        special_terms: data.special_terms || '',
        amount: data.amount.toString(),
        tax_rate: data.tax_rate.toString(),
        commission_rate: data.commission_rate.toString(),
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('受注の読み込みに失敗しました');
    } finally {
      setFetchLoading(false);
    }
  }

  const calculateTaxAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const rate = parseFloat(formData.tax_rate) || 0;
    return amount * (rate / 100);
  };

  const calculateGrossProfit = () => {
    const amount = parseFloat(formData.amount) || 0;
    const commission = amount * (parseFloat(formData.commission_rate) || 0) / 100;
    return amount - commission;
  };

  const getTaxedAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const tax = calculateTaxAmount();
    return amount + tax;
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!selectedCustomer) {
      newErrors.customer_id = '得意先を選択してください';
    }
    if (!formData.contract_date) {
      newErrors.contract_date = '契約日を入力してください';
    }
    if (!formData.start_date) {
      newErrors.start_date = '利用開始日を入力してください';
    }
    if (!formData.end_date) {
      newErrors.end_date = '利用終了日を入力してください';
    }
    if (!formData.payment_due_date) {
      newErrors.payment_due_date = '支払期限を入力してください';
    }
    if (!formData.service_description) {
      newErrors.service_description = '業務内容を入力してください';
    }
    if (!formData.amount) {
      newErrors.amount = '受注金額を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('入力内容に不備があります');
      return;
    }

    if (!order) {
      toast.error('受注情報が見つかりません');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          customer_id: selectedCustomer!.id,
          contract_date: formData.contract_date,
          start_date: formData.start_date,
          end_date: formData.end_date,
          payment_due_date: formData.payment_due_date,
          service_description: formData.service_description,
          special_terms: formData.special_terms || null,
          amount: parseFloat(formData.amount) || 0,
          tax_rate: parseFloat(formData.tax_rate) || 10,
          commission_rate: parseFloat(formData.commission_rate) || 0,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('受注を更新しました');
      router.push('/orders-manage');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('受注の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (fetchLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Customer Selection */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-slate-900">
            得意先 <span className="text-red-600">*</span>
          </Label>
          <CustomerSelector
            selectedCustomerId={selectedCustomer?.id}
            onSelect={setSelectedCustomer}
          />
          {errors.customer_id && (
            <p className="text-sm text-red-600">{errors.customer_id}</p>
          )}
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Contract Info */}
        <Card className="p-6 border border-slate-200 space-y-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">契約情報</h3>

          <div className="space-y-2">
            <Label htmlFor="contract_date" className="text-sm font-medium text-slate-700">
              契約日 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contract_date"
              type="date"
              value={formData.contract_date}
              onChange={(e) => handleDateChange('contract_date', e.target.value)}
              className="border-slate-300"
            />
            {errors.contract_date && (
              <p className="text-sm text-red-600">{errors.contract_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-sm font-medium text-slate-700">
              利用開始日 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
              className="border-slate-300"
            />
            {errors.start_date && (
              <p className="text-sm text-red-600">{errors.start_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-sm font-medium text-slate-700">
              利用終了日 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
              className="border-slate-300"
            />
            {errors.end_date && (
              <p className="text-sm text-red-600">{errors.end_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_due_date" className="text-sm font-medium text-slate-700">
              支払期限 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="payment_due_date"
              type="date"
              value={formData.payment_due_date}
              onChange={(e) => handleDateChange('payment_due_date', e.target.value)}
              className="border-slate-300"
            />
            {errors.payment_due_date && (
              <p className="text-sm text-red-600">{errors.payment_due_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description" className="text-sm font-medium text-slate-700">
              業務内容 <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="service_description"
              placeholder="業務内容を入力してください"
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              className="border-slate-300 min-h-24"
            />
            {errors.service_description && (
              <p className="text-sm text-red-600">{errors.service_description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_terms" className="text-sm font-medium text-slate-700">
              特約事項
            </Label>
            <Textarea
              id="special_terms"
              placeholder="特約事項があれば入力してください"
              value={formData.special_terms}
              onChange={(e) => setFormData({ ...formData, special_terms: e.target.value })}
              className="border-slate-300 min-h-24"
            />
          </div>
        </Card>

        {/* Right Column - Pricing Info */}
        <Card className="p-6 border border-slate-200 space-y-4">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">料金情報</h3>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
              受注金額（税抜） <span className="text-red-600">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="border-slate-300"
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate" className="text-sm font-medium text-slate-700">
              消費税率(%) <span className="text-red-600">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="tax_rate"
                type="number"
                placeholder="10"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="border-slate-300"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-600">税込金額</span>
              <span className="text-sm font-mono text-slate-900">
                ¥{getTaxedAmount().toLocaleString('ja-JP')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_rate" className="text-sm font-medium text-slate-700">
              代理店手数料率(%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="commission_rate"
                type="number"
                placeholder="0"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                className="border-slate-300"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">粗利</span>
              <span className="text-sm font-mono text-slate-900">
                ¥{calculateGrossProfit().toLocaleString('ja-JP')}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '更新中...' : '受注を更新'}
        </Button>
      </div>
    </form>
  );
}
