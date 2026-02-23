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

        if (!user.current_question_slug) {
            return NextResponse.json({ error: 'No active challenge' }, { status: 400 });
        }

        // 2. Mark as solved in database
        const solvedSlugs = user.solved_slugs || [];
        if (!solvedSlugs.includes(user.current_question_slug)) {
            const updatedSolvedSlugs = [...solvedSlugs, user.current_question_slug];

            await supabase.from('users').update({
                solved_slugs: updatedSolvedSlugs
            }).eq('id', user.id);

            // Re-fetch or update the local user object for the nudge logic
            user.solved_slugs = updatedSolvedSlugs;
        }

        // 3. Trigger nudge celebration (it will see the question as solved now)
        const result = await StudyService.sendStudyNudge(user as UserProfile, true);

        return NextResponse.json({ status: 'success', details: result });
    } catch (error) {
        console.error('Solve API failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
