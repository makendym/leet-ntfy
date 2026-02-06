import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { StudyService } from '@/lib/services/StudyService';
import { UserProfile } from '@/lib/types';

export async function GET() {
    try {
        // Find the test user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', '19290961-f1cb-4858-a8d8-3e5acd2e8893')
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'Test user not found' }, { status: 404 });
        }

        // Mock the House Robber problem
        const debugUser = {
            ...user,
            current_question_slug: 'house-robber',
            current_question_title: 'House Robber'
        } as UserProfile;

        const result = await StudyService.sendStudyNudge(debugUser, true);

        return NextResponse.json({
            message: 'House Robber nudge sent!',
            details: result
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
