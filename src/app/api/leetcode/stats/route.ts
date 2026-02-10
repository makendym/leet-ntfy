import { NextResponse } from 'next/server';
import { LeetCodeService } from '@/lib/services/LeetCodeService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    try {
        const stats = await LeetCodeService.getUserStats(username);
        if (!stats) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('LeetCode proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch LeetCode stats' }, { status: 500 });
    }
}
