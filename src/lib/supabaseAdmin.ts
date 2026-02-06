import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    if (typeof window === 'undefined') {
        console.error('CRITICAL: Supabase Service Role Key is missing on the server. Database access will fail.');
    }
}

// This client is for SERVER-SIDE use only. 
// It bypasses RLS and should never be used in frontend code.
let adminClient: any = null;

export const getSupabaseAdmin = () => {
    if (typeof window !== 'undefined') {
        throw new Error('supabaseAdmin cannot be used in the browser');
    }

    if (adminClient) return adminClient;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error('CRITICAL: Supabase credentials missing for Admin client.');
    }

    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    return adminClient;
};

// For backward compatibility with the "import { supabaseAdmin as supabase }" pattern
// We can use a Proxy or just rename the usages. Let's rename the usages for safety.
export const supabaseAdmin = typeof window === 'undefined' ?
    new Proxy({} as any, {
        get: (target, prop) => {
            const client = getSupabaseAdmin();
            return (client as any)[prop];
        }
    }) : null;
