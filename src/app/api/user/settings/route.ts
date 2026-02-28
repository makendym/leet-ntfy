import { NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { StudyService } from '@/lib/services/StudyService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('secretKey');

    if (!secretKey) {
        return NextResponse.json({ error: 'Secret key is required' }, { status: 400 });
    }

    const user = await UserRepository.findBySecretKey(secretKey);
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // DERIVED PROGRESS LOGIC:
    // We calculate solved_today on-the-fly from solve_history for consistency.
    // This removes the need for manual resets or legacy lazy reset blocks.
    const solvedToday = StudyService.getDailySolvedCount(user);

    // Sync to object for legacy UI components that haven't been updated yet
    if (user.solved_today !== solvedToday) {
        user.solved_today = solvedToday;
        // Optional: Update DB to keep legacy fields in sync for now
        await UserRepository.updateSettings(user.id, { solved_today: solvedToday });
    }

    // Auto-Migration: Convert legacy string[] progress to timestamped objects
    if (user.plan_progress) {
        let hasChanges = false;
        const migratedProgress: any = { ...user.plan_progress };

        for (const [planSlug, entries] of Object.entries(migratedProgress)) {
            const needsMigration = (entries as any[]).some(entry => typeof entry === 'string');
            if (needsMigration) {
                migratedProgress[planSlug] = (entries as any[]).map(entry => {
                    if (typeof entry === 'string') {
                        return { slug: entry, solved_at: user.created_at || new Date().toISOString() };
                    }
                    return entry;
                });
                hasChanges = true;
            }
        }

        if (hasChanges) {
            user.plan_progress = migratedProgress;
            await UserRepository.updateSettings(user.id, { plan_progress: migratedProgress });
        }
    }

    return NextResponse.json(user);
}

export async function PATCH(request: Request) {
    try {
        const { secretKey, ...updates } = await request.json();

        if (!secretKey) {
            return NextResponse.json({ error: 'Secret key is required' }, { status: 400 });
        }

        const user = await UserRepository.findBySecretKey(secretKey);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const success = await UserRepository.updateSettings(user.id, updates);

        if (!success) {
            return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
