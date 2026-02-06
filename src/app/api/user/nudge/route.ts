import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
        // If debug params provided, we set them on the user object temporarily
        const { problemSlug, problemTitle } = await request.clone().json();
        const testUser = { ...user } as UserProfile;

        if (problemSlug && problemTitle) {
            testUser.current_question_slug = problemSlug;
            testUser.current_question_title = problemTitle;
        }

        const result = await StudyService.sendStudyNudge(testUser, true);

        if (!result.success) {
            return NextResponse.json({ error: result.reason || 'Failed to send nudge' }, { status: 500 });
        }

        return NextResponse.json({ status: 'success', details: result });
    } catch (error: any) {
        console.error('Nudge API failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
