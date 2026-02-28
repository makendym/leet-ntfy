import { NextResponse } from 'next/server';
import { LeetCodeService } from '@/lib/services/LeetCodeService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Plan slug is required' }, { status: 400 });
    }

    try {
        const questions = await LeetCodeService.getStudyPlanQuestions(slug);
        return NextResponse.json(questions);
    } catch (error: any) {
        console.error('LeetCode study plan proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch study plan questions' }, { status: 500 });
    }
}
