'use client';

import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div>
        <Navigation />
        <main className="ml-[220px] bg-[#F8FAFC] min-h-screen">
          <div className="px-6 py-6">
            <Skeleton className="h-6 w-48 mb-8 bg-[#FFFFFF]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 bg-[#FFFFFF]" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <Navigation />
      <main className="ml-[220px] bg-[#F8FAFC] min-h-screen">
        <div className="px-6 py-6 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-base font-semibold text-[#0F172A]">ダッシュボード</h1>
            <p className="text-13px text-[#64748B] mt-2">
              {profile?.full_name} さんのホーム画面です（権限: {profile?.role}）
            </p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 bg-[#FFFFFF] border border-[#E2E8F0]">
              <p className="text-11px font-medium text-[#64748B] uppercase tracking-wide">
                有効契約数
              </p>
              <div className="text-20px font-semibold text-[#0F172A] mt-2 font-mono">—</div>
            </Card>

            <Card className="p-4 bg-[#FFFFFF] border border-[#E2E8F0]">
              <p className="text-11px font-medium text-[#64748B] uppercase tracking-wide">
                今月確定売上
              </p>
              <div className="text-20px font-semibold text-[#0F172A] mt-2 font-mono">¥—</div>
            </Card>

            <Card className="p-4 bg-[#FFFFFF] border border-[#E2E8F0]">
              <p className="text-11px font-medium text-[#64748B] uppercase tracking-wide">
                月次粗利
              </p>
              <div className="text-20px font-semibold text-[#0F172A] mt-2 font-mono">¥—</div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
