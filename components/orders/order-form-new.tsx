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
import { addMonths, endOfMonth } from 'date-fns';

interface FormData {
  customer_id: string;
  contract_date: string;
  start_date: string;
  end_date: string;
  payment_due_date: string;
  service_description: string;
  special_notes: string;
  amount: string;
  tax_rate: string;
  commission_rate: string;
}

interface CustomerType {
  id: string;
  customer_name: string;
  customer_code?: string;
}

export function OrderFormNew() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    contract_date: new Date().toISOString().split('T')[0],
    start_date: new Date().toISOString().split('T')[0],
    end_date: addMonths(new Date(), 12).toISOString().split('T')[0],
    payment_due_date: endOfMonth(addMonths(new Date(), 1)).toISOString().split('T')[0],
    service_description: '',
    special_notes: '',
    amount: '',
    tax_rate: '10',
    commission_rate: '0',
  });

  const supabase = createClient();

  useEffect(() => {
    if (selectedCustomer) {
      setFormData((prev) => ({
        ...prev,
        customer_id: selectedCustomer.id,
      }));
    }
  }, [selectedCustomer]);

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

    if (!user) {
      toast.error('ログインしてください');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: selectedCustomer!.id,
            created_by: user.id,
            contract_date: formData.contract_date,
            start_date: formData.start_date,
            end_date: formData.end_date,
            payment_due_date: formData.payment_due_date,
            service_description: formData.service_description,
            special_notes: formData.special_notes || null,
            amount: parseFloat(formData.amount) || 0,
            tax_rate: parseFloat(formData.tax_rate) || 10,
            commission_rate: parseFloat(formData.commission_rate) || 0,
            status: 'draft',
          },
        ])
        .select();

      if (error) throw error;

      const newOrderId = data?.[0]?.id;
      sessionStorage.setItem('highlightOrderId', newOrderId);
      toast.success('受注を登録しました');
      router.push('/orders-manage');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('受注の登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Customer Selection */}
      <Card className="p-6 bg-[#FFFFFF] border border-[#E2E8F0]">
        <div className="space-y-3">
          <Label className="text-13px font-medium text-[#0F172A]">
            得意先 <span className="text-red-600">*</span>
          </Label>
          <CustomerSelector
            selectedCustomerId={selectedCustomer?.id}
            onSelect={setSelectedCustomer}
          />
          {errors.customer_id && (
            <p className="text-13px text-[#EF4444]">{errors.customer_id}</p>
          )}
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Contract Info */}
        <Card className="p-6 bg-[#FFFFFF] border border-[#E2E8F0] space-y-4">
          <h3 className="text-11px font-medium text-[#64748B] uppercase tracking-wide">契約情報</h3>

          <div className="space-y-2">
            <Label htmlFor="contract_date" className="text-13px font-medium text-[#0F172A]">
              契約日 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contract_date"
              type="date"
              value={formData.contract_date}
              onChange={(e) => handleDateChange('contract_date', e.target.value)}
              className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px"
            />
            {errors.contract_date && (
              <p className="text-13px text-[#EF4444]">{errors.contract_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-13px font-medium text-[#0F172A]">
              利用開始日 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleDateChange('start_date', e.target.value)}
              className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px"
            />
            {errors.start_date && (
              <p className="text-13px text-[#EF4444]">{errors.start_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-13px font-medium text-[#0F172A]">
              利用終了日 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleDateChange('end_date', e.target.value)}
              className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px"
            />
            {errors.end_date && (
              <p className="text-13px text-[#EF4444]">{errors.end_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_due_date" className="text-13px font-medium text-[#0F172A]">
              支払期限 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="payment_due_date"
              type="date"
              value={formData.payment_due_date}
              onChange={(e) => handleDateChange('payment_due_date', e.target.value)}
              className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px"
            />
            {errors.payment_due_date && (
              <p className="text-13px text-[#EF4444]">{errors.payment_due_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description" className="text-13px font-medium text-[#0F172A]">
              業務内容 <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="service_description"
              placeholder="業務内容を入力してください"
              value={formData.service_description}
              onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
              className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px min-h-24"
            />
            {errors.service_description && (
              <p className="text-13px text-[#EF4444]">{errors.service_description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_notes" className="text-13px font-medium text-[#0F172A]">
              特約事項
            </Label>
            <Textarea
              id="special_notes"
              placeholder="特約事項があれば入力してください"
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
              className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px min-h-24"
            />
          </div>
        </Card>

        {/* Right Column - Pricing Info */}
        <Card className="p-6 bg-[#FFFFFF] border border-[#E2E8F0] space-y-4">
          <h3 className="text-11px font-medium text-[#64748B] uppercase tracking-wide">料金情報</h3>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-13px font-medium text-[#0F172A]">
              受注金額（税抜） <span className="text-red-600">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px"
            />
            {errors.amount && <p className="text-13px text-[#EF4444]">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate" className="text-13px font-medium text-[#0F172A]">
              消費税率(%) <span className="text-red-600">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="tax_rate"
                type="number"
                placeholder="10"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px"
              />
              <span className="text-13px text-[#64748B]">%</span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-md border border-[#E2E8F0]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-13px text-[#64748B]">税込金額</span>
              <span className="text-13px font-mono text-[#0F172A]">
                ¥{getTaxedAmount().toLocaleString('ja-JP')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_rate" className="text-13px font-medium text-[#0F172A]">
              代理店手数料率(%)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="commission_rate"
                type="number"
                placeholder="0"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-13px"
              />
              <span className="text-13px text-[#64748B]">%</span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] p-4 rounded-md border border-[#E2E8F0]">
            <div className="flex justify-between items-center">
              <span className="text-13px text-[#64748B]">粗利</span>
              <span className="text-13px font-mono text-[#0F172A]">
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
          {loading ? '登録中...' : '受注を登録'}
        </Button>
      </div>
    </form>
  );
}
