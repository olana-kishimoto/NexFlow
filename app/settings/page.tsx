'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

const SETTING_KEYS = [
  'CLOUDSIGN_CLIENT_ID',
  'MF_CLIENT_ID',
  'MF_CLIENT_SECRET',
  'MF_REDIRECT_URI',
  'MF_OFFICE_ID',
  'OPENAI_API_KEY',
];

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }

    if (!authLoading && user && profile?.role !== 'developer') {
      router.push('/dashboard');
    }
  }, [user, authLoading, profile, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || profile?.role !== 'developer') return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .in('key', SETTING_KEYS);

        if (error) throw error;

        const settingsMap: Record<string, string> = {};
        data?.forEach((s: any) => {
          settingsMap[s.key] = s.value;
        });

        SETTING_KEYS.forEach((key) => {
          if (!settingsMap[key]) {
            settingsMap[key] = '';
          }
        });

        setSettings(settingsMap);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, profile]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const supabase = createClient();
      for (const key of SETTING_KEYS) {
        const value = settings[key];
        const existing = await supabase
          .from('system_settings')
          .select('id')
          .eq('key', key)
          .maybeSingle();

        if (existing.data) {
          const { error } = await supabase
            .from('system_settings')
            .update({ value, updated_at: new Date().toISOString() })
            .eq('key', key);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('system_settings')
            .insert([
              {
                key,
                value,
                encrypted: true,
              },
            ]);

          if (error) throw error;
        }
      }

      toast({ title: 'success', description: 'システム設定を保存しました' });
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'エラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'developer') {
    return null;
  }

  const descriptions: Record<string, string> = {
    CLOUDSIGN_CLIENT_ID: 'CloudSign APIのクライアントID',
    MF_CLIENT_ID: 'マネーフォワードのクライアントID',
    MF_CLIENT_SECRET: 'マネーフォワードのクライアントシークレット',
    MF_REDIRECT_URI: 'マネーフォワードのリダイレクトURI',
    MF_OFFICE_ID: 'マネーフォワードのオフィスID',
    OPENAI_API_KEY: 'OpenAI APIキー',
  };

  return (
    <div>
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">システム設定</h1>

        <Card>
          <CardHeader>
            <CardTitle>API認証情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <>
                {SETTING_KEYS.map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-2">
                      {key}
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      {descriptions[key]}
                    </p>
                    <Input
                      type="password"
                      value={settings[key] || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder="••••••••"
                      className="font-mono text-sm"
                    />
                  </div>
                ))}

                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? '保存中...' : '設定を保存'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
