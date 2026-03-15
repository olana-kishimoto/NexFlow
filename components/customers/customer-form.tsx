'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: Customer) => void;
  initialCustomer?: Customer;
}

export default function CustomerForm({
  open,
  onOpenChange,
  onSuccess,
  initialCustomer,
}: CustomerFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_code: initialCustomer?.customer_code || '',
    customer_name: initialCustomer?.customer_name || '',
    representative_title: initialCustomer?.representative_title || '',
    representative_name: initialCustomer?.representative_name || '',
    customer_postal_code: initialCustomer?.customer_postal_code || '',
    customer_address: initialCustomer?.customer_address || '',
    contact_email: initialCustomer?.contact_email || '',
    agency_name: initialCustomer?.agency_name || '',
    notes: initialCustomer?.notes || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) throw new Error('未認証');

      if (!formData.customer_name.trim()) {
        throw new Error('得意先名は必須です');
      }

      const supabase = createClient();
      if (initialCustomer) {
        const { data, error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', initialCustomer.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (data) {
          toast({ title: 'success', description: '得意先を更新しました' });
          onSuccess?.(data);
          onOpenChange(false);
        }
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert([
            {
              created_by: user.id,
              ...formData,
            },
          ])
          .select()
          .maybeSingle();

        if (error) {
          if (error.code === '23505') {
            throw new Error('この得意先コードは既に使用されています');
          }
          throw error;
        }

        if (data) {
          toast({ title: 'success', description: '得意先を登録しました' });
          setFormData({
            customer_code: '',
            customer_name: '',
            representative_title: '',
            representative_name: '',
            customer_postal_code: '',
            customer_address: '',
            contact_email: '',
            agency_name: '',
            notes: '',
          });
          onSuccess?.(data);
          onOpenChange(false);
        }
      }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialCustomer ? '得意先を編集' : '新規得意先を登録'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">得意先コード</label>
              <Input
                type="text"
                name="customer_code"
                value={formData.customer_code}
                onChange={handleChange}
                placeholder="任意（一意である必要があります）"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                得意先名 *
              </label>
              <Input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                代表者職名
              </label>
              <Input
                type="text"
                name="representative_title"
                value={formData.representative_title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                代表者氏名
              </label>
              <Input
                type="text"
                name="representative_name"
                value={formData.representative_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">郵便番号</label>
              <Input
                type="text"
                name="customer_postal_code"
                value={formData.customer_postal_code}
                onChange={handleChange}
                placeholder="100-0001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">メール</label>
              <Input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">住所</label>
              <Input
                type="text"
                name="customer_address"
                value={formData.customer_address}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">代理店名</label>
              <Input
                type="text"
                name="agency_name"
                value={formData.agency_name}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">備考</label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? '送信中...'
                : initialCustomer
                  ? '更新'
                  : '登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
