import { supabase } from '../supabase';
import { LeetCodeService } from './LeetCodeService';
import { NotificationService } from './NotificationService';
import { UserProfile } from '../types';

export class StudyService {
    static async sendStudyNudge(user: UserProfile, isManual: boolean = false) {
        // Fallback for empty topics
        const topics = (user.topics && user.topics.length > 0) ? user.topics : ['Array'];

        const now = new Date();
        const currentHour = now.getHours();

        // Safety checks (skipped for manual triggers)
        if (!isManual) {
            // Don't send anything before 8 AM
            if (currentHour < 8) return { success: false, reason: 'Too early' };

            // 3-hour gap safety check
            if (user.last_notified_at) {
                const lastNotified = new Date(user.last_notified_at).getTime();
                const diffHours = (now.getTime() - lastNotified) / (1000 * 60 * 60);
                if (diffHours < 3) return { success: false, reason: 'Cooldown active' };
            }
        }

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
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            question = await LeetCodeService.getRandomQuestion(randomTopic);

            // Track this as the new current question
            const slug = question.url.split('/problems/')[1]?.replace(/\/$/, '');
            updates.current_question_slug = slug;
            updates.current_question_title = question.title;
        }

        if (!question) return { success: false, reason: 'Question fetch failed' };

        // Messaging Logic
        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

        const templates = [
            { title: 'Daily Nudge', message: `Here's your next problem: ${question.title}. Let's go.` },
            { title: 'Time to Practice', message: `Solve today's problem: ${question.title}.` },
            { title: 'Reminder', message: `Your problem for today: ${question.title}. Time to tackle it.` }
        ];

        const selected = pick(templates);
        let title = selected.title;
        let message = selected.message;
        let priority: 1 | 2 | 3 | 4 | 5 = shouldUpdateUser ? 4 : 3;

        // Send the ntfy notification
        const success = await NotificationService.sendNotification({
            title,
            message,
            topic: user.secret_key,
            priority,
            icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`,
            image: `https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000&auto=format&fit=crop`, // Generic code image
            actions: [
                { label: 'Solve Now', url: question.url },
                { label: 'Manage Settings', url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/${user.secret_key}` }
            ]
        });

        if (success) {
            // Update last notified time and any question changes
            updates.last_notified_at = now.toISOString();
            await supabase.from('users').update(updates).eq('id', user.id);
        }

        return { success, username: user.leetcode_username, isNewQuestion: shouldUpdateUser };
    }
}
