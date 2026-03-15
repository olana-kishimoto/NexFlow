'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

export function Navigation() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (!user) return null;

  const navItems = [
    { label: '受注管理', href: '/orders-manage', roles: ['admin', 'developer'] },
    { label: '得意先管理', href: '/customers', roles: ['admin', 'developer'] },
    { label: '売上管理', href: '/revenue', roles: ['admin', 'developer'] },
    { label: 'ダッシュボード', href: '/dashboard', roles: ['admin', 'developer'] },
    { label: '契約管理', href: '/contracts', roles: ['admin', 'developer'] },
    { label: 'ユーザー管理', href: '/users', roles: ['admin', 'developer'] },
    { label: 'システム設定', href: '/settings', roles: ['developer'] },
  ];

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(profile?.role || 'user')
  );

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#0F1117] border-r border-[#1C2333] flex flex-col">
      <div className="h-12 flex items-center px-4 border-b border-[#1C2333]">
        <Link href="/dashboard" className="font-semibold text-sm text-[#EDEDED]">
          NexFlow
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {filteredItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center h-8 px-3 rounded-md text-13px transition-all ${
                active
                  ? 'bg-[#1F2937] text-[#EDEDED] border-l-2 border-[#6366F1]'
                  : 'text-[#888888] hover:bg-[#1F2937] hover:text-[#EDEDED]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1C2333] p-3 space-y-2">
        <div className="text-11px text-[#888888] uppercase tracking-wide px-3">
          {profile?.full_name}
        </div>
        <div className="text-10px text-[#555555] px-3 mb-2">{profile?.role}</div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center h-8 px-3 rounded-md text-13px text-[#EF4444] hover:bg-[#450A0A] transition-all"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          ログアウト
        </button>
      </div>
    </aside>
  );
}
