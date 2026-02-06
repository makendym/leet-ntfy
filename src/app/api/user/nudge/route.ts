import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { StudyService } from '@/lib/services/StudyService';
import { UserProfile } from '@/lib/types';

export async function POST(request: Request) {
    try {
        const { secretKey } = await request.json();

        if (!secretKey) {
            return NextResponse.json({ error: 'Secret key is required' }, { status: 400 });
        }

        // 1. Fetch user by secret key
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('secret_key', secretKey)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Trigger nudge manually (bypasses safety checks)
        const result = await StudyService.sendStudyNudge(user as UserProfile, true);

        if (!result.success) {
            return NextResponse.json({ error: result.reason || 'Failed to send nudge' }, { status: 500 });
        }

        return NextResponse.json({ status: 'success', details: result });
    } catch (error: any) {
        console.error('Nudge API failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
