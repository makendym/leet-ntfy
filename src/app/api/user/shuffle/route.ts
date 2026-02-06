import { NextResponse } from 'next/server';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { StudyService } from '@/lib/services/StudyService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');

    if (!secretKey) {
        return new Response('Missing secret key', { status: 400 });
    }

    try {
        const user = await UserRepository.findBySecretKey(secretKey);
        if (!user) {
            return new Response('User not found', { status: 404 });
        }

        // Trigger an immediate shuffle (isManual=true, forceNewQuestion=true)
        await StudyService.sendStudyNudge(user, true, true);

        // Return a nice confirmation page
        return new Response(`
            <html>
                <body style="background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center;">
                    <div>
                        <h1 style="color: #ffa116; font-size: 3rem;">Shuffled!</h1>
                        <p style="font-size: 1.5rem;">We've sent a new challenge to your phone.</p>
                        <p style="color: #666; font-size: 1.5rem;">You can close this window now.</p>
                    </div>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        console.error('Shuffle Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
