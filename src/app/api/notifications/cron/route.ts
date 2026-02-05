import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LeetCodeService } from '@/lib/services/LeetCodeService';
import { NotificationService } from '@/lib/services/NotificationService';
import { UserProfile } from '@/lib/types';

export async function GET(request: Request) {
    // 1. Basic Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Fetch all users who want notifications (simplifying for now)
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .neq('notification_frequency', 'none');

        if (error) throw error;

        const results = [];
        const now = new Date();
        const currentHour = now.getHours();

        // Don't send anything before 8 AM
        if (currentHour < 8) {
            return NextResponse.json({ status: 'success', message: 'Before 8 AM, skipping.' });
        }

        // 3. Process each user
        for (const user of (users as UserProfile[])) {
            if (!user.topics || user.topics.length === 0) continue;

            // 3-hour gap safety check (Temporarily disabled for testing)
            /*
            if (user.last_notified_at) {
                const lastNotified = new Date(user.last_notified_at).getTime();
                const diffHours = (now.getTime() - lastNotified) / (1000 * 60 * 60);
                if (diffHours < 3) continue;
            }
            */

            let question;
            let shouldUpdateUser = false;
            const updates: Partial<UserProfile> = {};

            // Check if user has an active question
            if (user.current_question_slug) {
                const isSolved = await LeetCodeService.isQuestionSolved(
                    user.leetcode_username,
                    user.current_question_slug
                );

                if (!isSolved) {
                    // Sticky: use the same question
                    question = {
                        title: user.current_question_title || 'Current Challenge',
                        url: `https://leetcode.com/problems/${user.current_question_slug}/`
                    };
                } else {
                    // Solved! Clear and pick a new one
                    shouldUpdateUser = true;
                }
            } else {
                // No active question, pick a new one
                shouldUpdateUser = true;
            }

            if (shouldUpdateUser) {
                const randomTopic = user.topics[Math.floor(Math.random() * user.topics.length)];
                question = await LeetCodeService.getRandomQuestion(randomTopic);

                // Track this as the new current question
                const slug = question.url.split('/problems/')[1]?.replace(/\/$/, '');
                updates.current_question_slug = slug;
                updates.current_question_title = question.title;
            }

            if (!question) continue;

            // Get encouraging message based on time
            let message = `Today's Challenge: ${question.title}. You've got this!`;
            let title = `Daily Challenge: ${user.topics[0]}`;

            if (!shouldUpdateUser) {
                title = `Encouraging Nudge: ${user.topics[0]}`;
                if (currentHour >= 8 && currentHour < 12) {
                    message = `Fresh start! Give ${question.title} a quick look whenever you're ready.`;
                } else if (currentHour >= 12 && currentHour < 17) {
                    message = `Mid-day momentum! You're more than capable of handling ${question.title}.`;
                } else if (currentHour >= 17 && currentHour < 21) {
                    message = `Evening focus time! You've solved tougher ones than ${question.title} before.`;
                } else {
                    message = `Before you wrap up – one last push for your ${question.title} goal! You'll feel great crossing it off.`;
                }
            }

            // Send the ntfy notification
            const success = await NotificationService.sendNotification({
                title,
                message,
                topic: user.secret_key,
                actions: [
                    { label: 'Solve Now', url: question.url },
                    { label: 'Manage Settings', url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/${user.secret_key}` }
                ]
            });

            // Update last notified time and any question changes
            updates.last_notified_at = now.toISOString();
            await supabase.from('users').update(updates).eq('id', user.id);

            results.push({ username: user.leetcode_username, success, newQuestion: shouldUpdateUser });
        }

        return NextResponse.json({ status: 'success', processed: results.length, details: results });
    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
