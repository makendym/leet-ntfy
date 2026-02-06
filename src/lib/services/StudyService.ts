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
        let title = `Daily Nudge: ${topics[0]}`;
        let message = `Solve: ${question.title}`;
        let tags: string[] = ['brain'];
        let priority: 1 | 2 | 3 | 4 | 5 = 3;

        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

        if (shouldUpdateUser) {
            // NEW QUESTION
            priority = 4;
            tags = ['star', 'rocket'];
            title = `New Challenge: ${topics[0]}`;
            message = `Time to tackle: ${question.title}`;
        } else {
            // NUDGE
            priority = 3;
            tags = ['fire', 'muscle'];

            // Subtle time-based variety but keeping it simple
            if (currentHour < 12) {
                title = `Morning Nudge: ${topics[0]}`;
            } else if (currentHour < 17) {
                title = `Afternoon Nudge: ${topics[0]}`;
            } else if (currentHour < 21) {
                title = `Evening Nudge: ${topics[0]}`;
            } else {
                title = `Late Nudge: ${topics[0]}`;
            }

            message = `Goal: Finish ${question.title}`;
        }

        // Send the ntfy notification
        const success = await NotificationService.sendNotification({
            title,
            message,
            topic: user.secret_key,
            tags,
            priority,
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
