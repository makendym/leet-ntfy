import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { StudyService } from '@/lib/services/StudyService';
import { UserProfile } from '@/lib/types';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const todayDate = now.toISOString().split('T')[0];

        // Fetch users who haven't been reset today
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .neq('notification_frequency', 'none');

        if (error) throw error;

        if (!users) {
            console.warn('No users found to reset.');
            return NextResponse.json({ status: 'success', details: [], message: 'No users to process' });
        }

        const results = [];
        for (const user of (users as UserProfile[])) {
            try {
                const userTimezone = user.timezone || 'America/New_York';

                // Check if it is currently 8 AM in the user's timezone
                let currentHour: number;
                try {
                    const hourString = new Intl.DateTimeFormat('en-US', {
                        hour: 'numeric',
                        hour12: false,
                        timeZone: userTimezone
                    }).format(now);
                    currentHour = parseInt(hourString);
                } catch (tzError) {
                    console.error(`Invalid timezone for user ${user.leetcode_username}: ${userTimezone}`, tzError);
                    // Fallback to UTC or skip? Let's skip with a log.
                    results.push({ username: user.leetcode_username, status: 'error', reason: 'invalid_timezone', timezone: userTimezone });
                    continue;
                }

                // Special Case for Reset: Must be 8 AM and not already reset today
                if (currentHour === 8 && user.last_reset_at !== todayDate) {
                    console.log(`[ResetJob] Triggering reset for ${user.leetcode_username} (Hour: ${currentHour}, TZ: ${userTimezone})`);
                    const result = await StudyService.sendStudyNudge(user, false, true);
                    results.push({ username: user.leetcode_username, status: 'reset_triggered', ...result });
                } else {
                    results.push({ username: user.leetcode_username, status: 'skipped', hour: currentHour, today: todayDate, lastReset: user.last_reset_at });
                }
            } catch (userError: any) {
                console.error(`Failed to process reset for user ${user.leetcode_username}:`, userError);
                results.push({ username: user.leetcode_username, status: 'error', message: userError.message });
            }
        }

        return NextResponse.json({ status: 'success', details: results });
    } catch (error: any) {
        console.error('Reset job failed:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
