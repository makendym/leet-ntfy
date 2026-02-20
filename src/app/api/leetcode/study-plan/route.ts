import { NextResponse } from 'next/server';
import { LeetCodeService } from '@/lib/services/LeetCodeService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const details = await LeetCodeService.getStudyPlanDetails(slug);
    if (!details) {
        return NextResponse.json({ error: 'Study plan not found' }, { status: 404 });
    }

    return NextResponse.json(details);
}
