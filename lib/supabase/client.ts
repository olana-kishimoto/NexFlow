import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

let instance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return null as any;
  }

  if (!instance) {
    instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return instance;
}

export const supabase = new Proxy(
  {},
  {
    get: (_target, prop) => {
      if (typeof window === 'undefined') {
        return undefined;
      }
      const client = getSupabaseClient();
      return (client as any)?.[prop];
    },
  }
) as any;
