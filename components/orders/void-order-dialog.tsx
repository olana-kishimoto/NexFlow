'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface VoidOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
}

export function VoidOrderDialog({ open, onOpenChange, orderId }: VoidOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleVoid = async () => {
    if (!reason.trim()) {
      toast.error('無効化理由を入力してください');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'void',
          void_reason: reason,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('受注を無効化しました');
      onOpenChange(false);
      router.refresh();
      router.push('/orders-manage');
    } catch (error) {
      console.error('Error voiding order:', error);
      toast.error('受注の無効化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>この受注を無効にしますか？</AlertDialogTitle>
          <AlertDialogDescription>
            無効にした受注は編集できなくなります。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <Label htmlFor="void_reason" className="text-sm font-medium text-slate-700">
            無効化理由 <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="void_reason"
            placeholder="無効化理由を入力してください"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border-slate-300 min-h-20"
          />
        </div>

        <div className="flex justify-end gap-3">
          <AlertDialogCancel disabled={loading}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleVoid}
            disabled={loading || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? '処理中...' : '無効にする'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
