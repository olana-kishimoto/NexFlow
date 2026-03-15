'use client';

import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';

interface UserAddDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserAddDialog({ isOpen, onOpenChange, onSuccess }: UserAddDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.full_name || !formData.password) {
      toast({
        title: 'エラー',
        description: '必須項目を入力してください',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'エラー',
        description: 'パスワードは8文字以上である必要があります',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'エラー',
          description: result.error || 'エラーが発生しました',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'ユーザーを追加しました',
        description: `メール: ${formData.email}\n初期パスワード: ${formData.password}\n本人にパスワードの変更を案内してください。`,
      });

      setFormData({
        email: '',
        full_name: '',
        role: 'user',
        password: '',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FFFFFF] border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">新規ユーザー追加</DialogTitle>
          <DialogDescription className="text-[#64748B]">
            新しいユーザーを追加します
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-13px font-medium text-[#0F172A]">
              氏名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="山田 太郎"
              className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-13px font-medium text-[#0F172A]">
              メールアドレス <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-13px font-medium text-[#0F172A]">
              パスワード <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="最低8文字"
                className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-13px font-medium text-[#0F172A]">
              ロール <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
              <SelectTrigger className="bg-[#FFFFFF] border-[#E2E8F0] text-[#0F172A]">
                <SelectValue placeholder="ロールを選択" />
              </SelectTrigger>
              <SelectContent className="bg-[#FFFFFF] border-[#E2E8F0]">
                <SelectItem value="user" className="text-[#0F172A]">
                  一般ユーザー
                </SelectItem>
                <SelectItem value="admin" className="text-[#0F172A]">
                  管理者
                </SelectItem>
                <SelectItem value="developer" className="text-[#0F172A]">
                  デベロッパー
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#0F172A] text-white hover:bg-[#1E293B]"
            >
              {isLoading ? '追加中...' : '追加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
