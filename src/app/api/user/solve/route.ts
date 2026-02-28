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

        // 2. Mark as solved in database using centralized history
        const now = new Date();
        const solveItem = { slug: user.current_question_slug, solved_at: now.toISOString() };
        const solveHistory = [...(user.solve_history || []), solveItem];
        const solvedSlugs = user.solved_slugs || [];

        const updates: any = {
            last_solve_at: now.toISOString(),
            solve_history: solveHistory
        };

        if (!solvedSlugs.includes(user.current_question_slug)) {
            updates.solved_slugs = [...solvedSlugs, user.current_question_slug];
        }

        // Sync plan_progress
        if (user.study_plan_slug) {
            const planProgress = user.plan_progress || {};
            const currentPlanEntries = planProgress[user.study_plan_slug] || [];

            const isAlreadyInPlan = currentPlanEntries.some((entry: any) =>
                typeof entry === 'string' ? entry === user.current_question_slug : entry.slug === user.current_question_slug
            );

            if (!isAlreadyInPlan) {
                updates.plan_progress = {
                    ...planProgress,
                    [user.study_plan_slug]: [
                        ...currentPlanEntries,
                        solveItem
                    ]
                };
            }
        }

        // Calculate derived count for immediate response
        const tempUser = { ...user, ...updates } as UserProfile;
        const solvedToday = StudyService.getDailySolvedCount(tempUser);
        const goal = user.daily_goal || 1;

        // Sync legacy solved_today for UI compatibility
        updates.solved_today = solvedToday;

        await supabase.from('users').update(updates).eq('id', user.id);

        // 3. Trigger nudge calculation (celebration + next problem)
        // Note: StudyService.sendStudyNudge will re-fetch or use the updated history to celebrate
        const celebration = await StudyService.sendStudyNudge(tempUser, true);

        // If goal not met, send the next problem immediately
        if (solvedToday < goal) {
            // Need to re-fetch or merge updates for the next nudge
            await StudyService.sendStudyNudge(tempUser, true, true);
        }

        return NextResponse.json({ status: 'success', details: celebration, solvedToday, goal });
    } catch (error) {
        console.error('Solve API failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
