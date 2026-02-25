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
        const now = new Date();
        const userTimezone = user.timezone || 'America/New_York';
        const todayStr = new Date(now.toLocaleString('en-US', { timeZone: userTimezone })).toDateString();
        const lastSolveStr = user.last_solve_at ? new Date(new Date(user.last_solve_at).toLocaleString('en-US', { timeZone: userTimezone })).toDateString() : '';

        // Reset if it's a new day
        let solvedToday = (lastSolveStr === todayStr) ? (user.solved_today || 0) : 0;
        solvedToday += 1;

        const updates: any = {
            last_solve_at: now.toISOString(),
            solved_today: solvedToday
        };

        if (!solvedSlugs.includes(user.current_question_slug)) {
            updates.solved_slugs = [...solvedSlugs, user.current_question_slug];
        }

        await supabase.from('users').update(updates).eq('id', user.id);

        // 3. Trigger nudge calculation
        // First, send the celebration for the current solve
        const celebration = await StudyService.sendStudyNudge(user as UserProfile, true);

        // If goal not met, send the next problem immediately
        const goal = user.daily_goal || 1;
        if (solvedToday < goal) {
            // Need to re-fetch or merge updates for the next nudge
            const updatedUser = { ...user, ...updates } as UserProfile;
            await StudyService.sendStudyNudge(updatedUser, true, true);
        }

        return NextResponse.json({ status: 'success', details: celebration, solvedToday, goal });
    } catch (error) {
        console.error('Solve API failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
