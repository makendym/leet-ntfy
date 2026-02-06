import { NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/UserRepository';

export async function POST(request: Request) {
    try {
        const { username, timezone = 'America/New_York' } = await request.json();

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // 1. Check if user already exists
        let user = await UserRepository.findByUsername(username);

        // 2. If not, create them
        if (!user) {
            user = await UserRepository.create(username, timezone);
        }

        if (!user) {
            return NextResponse.json({ error: 'Failed to find or create user' }, { status: 500 });
        }

        // 3. Return the secret key for redirection
        return NextResponse.json({ secretKey: user.secret_key });
    } catch (error) {
        console.error('API Setup Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
