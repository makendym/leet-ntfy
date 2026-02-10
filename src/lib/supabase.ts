import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    console.warn('⚠️ Supabase credentials missing on server. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
}

let publicClient: any = null;

export const supabase = typeof window !== 'undefined' || (supabaseUrl && supabaseAnonKey) ?
  new Proxy({} as any, {
    get: (target, prop) => {
      if (!publicClient) {
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase Anon Key is missing. Check your .env.local');
        }
        publicClient = createClient(supabaseUrl, supabaseAnonKey);
      }
      return (publicClient as any)[prop];
    }
  }) : null;
