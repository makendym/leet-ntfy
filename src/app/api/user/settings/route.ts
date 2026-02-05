import { NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/UserRepository';

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
