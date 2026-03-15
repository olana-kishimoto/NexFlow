'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function Navigation() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (!user) return null;

  const navItems = [
    { label: '受注入力', href: '/orders', roles: ['user', 'admin', 'developer'] },
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

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="font-bold text-lg text-blue-600">
            NexFlow Hub
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-600">
              {profile?.full_name} ({profile?.role})
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
