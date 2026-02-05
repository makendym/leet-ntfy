import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { StudyService } from '@/lib/services/StudyService';
import { UserProfile } from '@/lib/types';

export async function GET(request: Request) {
    // 1. Basic Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Fetch all users who want notifications
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .neq('notification_frequency', 'none');

        if (error) throw error;

        const results = [];
        for (const user of (users as UserProfile[])) {
            const result = await StudyService.sendStudyNudge(user, false);
            results.push(result);
        }

        return NextResponse.json({ status: 'success', processed: results.filter(r => r.success).length, details: results });
    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
