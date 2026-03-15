import { getSupabaseClient } from './supabase/client';

export { getSupabaseClient } from './supabase/client';

export function getSupabase() {
  return getSupabaseClient();
}

export const supabase = getSupabaseClient();
