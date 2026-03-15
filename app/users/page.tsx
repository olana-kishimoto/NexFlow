'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Profile } from '@/lib/types';

export default function UsersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }

    if (!authLoading && user && profile?.role !== 'admin' && profile?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [user, authLoading, profile, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus as any } : u))
      );

      toast({ title: 'success', description: 'ユーザーを更新しました' });
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
        variant: 'destructive',
      });
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

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const developerCount = users.filter((u) => u.role === 'developer').length;

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#0F0F0F] min-h-screen">
        <div className="px-6 py-6 border-b border-[#2A2A2A]">
          <h1 className="text-base font-semibold text-[#EDEDED]">ユーザー管理</h1>
        </div>
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-8">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              新規ユーザー
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#888888]">
                  アクティブユーザー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EDEDED]">{activeCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#888888]">
                  管理者
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EDEDED]">{adminCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#888888]">
                  デベロッパー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#EDEDED]">{developerCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1A1A1A] border-[#2A2A2A]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#EDEDED]">ユーザー一覧</CardTitle>
                <Input
                  type="text"
                  placeholder="名前またはメール検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-[#2A2A2A] border-[#3A3A3A] text-[#EDEDED] placeholder-[#666666]"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-[#2A2A2A]" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-[#888888] py-8">
                  ユーザーが見つかりません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2A2A2A]">
                        <TableHead className="text-[#EDEDED]">名前</TableHead>
                        <TableHead className="text-[#EDEDED]">メール</TableHead>
                        <TableHead className="text-[#EDEDED]">権限</TableHead>
                        <TableHead className="text-[#EDEDED]">ステータス</TableHead>
                        <TableHead className="text-[#EDEDED]">作成日</TableHead>
                        <TableHead className="text-[#EDEDED]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id} className="border-[#2A2A2A]">
                          <TableCell className="font-medium text-[#EDEDED]">
                            {u.full_name}
                          </TableCell>
                          <TableCell className="text-sm text-[#EDEDED]">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                u.status === 'active' ? 'default' : 'secondary'
                              }
                            >
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-[#EDEDED]">
                            {new Date(u.created_at).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(u.id, u.status)}
                            >
                              {u.status === 'active' ? '停止' : '有効'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
