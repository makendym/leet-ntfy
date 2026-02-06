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

        // Get message
        let message = `Today's Challenge: ${question.title}. You've got this!`;
        let title = `Daily Challenge: ${topics[0]}`;

        if (!shouldUpdateUser) {
            title = `Encouraging Nudge: ${topics[0]}`;
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

        if (success) {
            // Update last notified time and any question changes
            updates.last_notified_at = now.toISOString();
            await supabase.from('users').update(updates).eq('id', user.id);
        }

        return { success, username: user.leetcode_username, isNewQuestion: shouldUpdateUser };
    }
}
