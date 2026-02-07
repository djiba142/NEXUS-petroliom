import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL ?? '';
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Debug: vérifier que les variables sont chargées
console.log('🔍 Debug Supabase config:', {
  url: URL ? `${URL.substring(0, 30)}...` : 'MISSING',
  key: KEY ? `${KEY.substring(0, 20)}...` : 'MISSING',
  hasUrl: !!URL,
  hasKey: !!KEY
});

export const supabase: SupabaseClient | null = (URL && KEY) ? createClient(URL, KEY) : null;

export function getSupabase() {
  return supabase;
}