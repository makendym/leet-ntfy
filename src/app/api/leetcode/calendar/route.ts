import { NextResponse } from 'next/server';
import { LeetCodeService } from '@/lib/services/LeetCodeService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        const calendar = await LeetCodeService.getUserCalendar(username);
        if (!calendar) {
            return NextResponse.json({ error: 'User calendar not found' }, { status: 404 });
        }
        return NextResponse.json(calendar);
    } catch (error: any) {
        console.error('LeetCode calendar proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch LeetCode calendar' }, { status: 500 });
    }
}
