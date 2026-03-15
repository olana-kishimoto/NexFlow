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
import { UserAddDialog } from '@/components/users/user-add-dialog';

export default function UsersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleToggleStatus = async (userId: string, isSuspended: boolean) => {
    try {
      const endpoint = isSuspended ? '/api/users/activate' : '/api/users/suspend'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'エラーが発生しました')
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])

      toast({
        title: 'success',
        description: isSuspended ? 'ユーザーを有効化しました' : 'ユーザーを停止しました',
      })
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
        variant: 'destructive',
      })
    }
  }

  const handleUserAdded = async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to refresh users:', error);
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

  const activeCount = users.length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const developerCount = users.filter((u) => u.role === 'developer').length;

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#F8FAFC] min-h-screen">
        <div className="px-6 py-6 border-b border-[#E2E8F0]">
          <h1 className="text-base font-semibold text-[#0F172A]">ユーザー管理</h1>
        </div>
        <div className="px-6 py-6">
          <div className="flex justify-between items-center mb-8">
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              新規ユーザー
            </Button>
          </div>

          <UserAddDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSuccess={handleUserAdded}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#FFFFFF] border-[#E2E8F0]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#64748B]">
                  アクティブユーザー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0F172A]">{activeCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#FFFFFF] border-[#E2E8F0]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#64748B]">
                  管理者
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0F172A]">{adminCount}</div>
              </CardContent>
            </Card>

            <Card className="bg-[#FFFFFF] border-[#E2E8F0]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-[#64748B]">
                  デベロッパー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#0F172A]">{developerCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#FFFFFF] border-[#E2E8F0]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#0F172A]">ユーザー一覧</CardTitle>
                <Input
                  type="text"
                  placeholder="名前またはメール検索..."
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
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-[#64748B] py-8">
                  ユーザーが見つかりません
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#E2E8F0]">
                        <TableHead className="text-[#0F172A]">名前</TableHead>
                        <TableHead className="text-[#0F172A]">メール</TableHead>
                        <TableHead className="text-[#0F172A]">権限</TableHead>
                        <TableHead className="text-[#0F172A]">ステータス</TableHead>
                        <TableHead className="text-[#0F172A]">作成日</TableHead>
                        <TableHead className="text-[#0F172A]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id} className="border-[#E2E8F0]">
                          <TableCell className="font-medium text-[#0F172A]">
                            {u.full_name}
                          </TableCell>
                          <TableCell className="text-sm text-[#0F172A]">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{u.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">有効</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-[#0F172A]">
                            {new Date(u.created_at).toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(u.id, false)}
                            >
                              停止
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
