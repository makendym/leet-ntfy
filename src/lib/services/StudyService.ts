import { supabase } from '../supabase';
import { LeetCodeService } from './LeetCodeService';
import { NotificationService } from './NotificationService';
import { UserProfile } from '../types';

export class StudyService {
    static async sendStudyNudge(user: UserProfile, isManual: boolean = false, forceNewQuestion: boolean = false) {
        // Fallback for empty topics
        const topics = (user.topics && user.topics.length > 0) ? user.topics : ['Array'];

        const now = new Date();
        const userTimezone = user.timezone || 'America/New_York';

        // Use Intl to get the hour in the user's timezone
        const currentHour = parseInt(new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: userTimezone
        }).format(now));

        // Safety checks (skipped for manual triggers and forced resets)
        if (!isManual && !forceNewQuestion) {
            // Don't send anything before 8 AM in user's timezone
            if (currentHour < 8) return { success: false, reason: `Too early (${currentHour}h in ${userTimezone})` };

            // 2-hour gap safety check
            if (user.last_notified_at) {
                const lastNotified = new Date(user.last_notified_at).getTime();
                const diffMinutes = (now.getTime() - lastNotified) / (1000 * 60);
                if (diffMinutes < 120) return { success: false, reason: 'Cooldown active (2 hours)' };
            }
        }

        let question;
        let shouldUpdateUser = forceNewQuestion;
        const updates: Partial<UserProfile> = {};

        // Check if user has an active question (skip if forcing new one)
        if (!shouldUpdateUser && user.current_question_slug) {
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
                // --- SUCCESS CELEBRATION FLOW ---
                // 1. Send immediate success notification
                await NotificationService.sendNotification({
                    title: 'Challenge Completed',
                    message: `Amazing work! You've solved ${user.current_question_title || 'the challenge'}. Enjoy your win!`,
                    topic: user.secret_key,
                    priority: 5, // Max priority for celebration
                    icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`,
                    image: `https://images.unsplash.com/photo-1550305080-4e0455ca7bc4?q=80&w=1000&auto=format&fit=crop`, // Trophy/Celebration image
                });

                // 2. Clear the current question so we don't notify success twice
                updates.current_question_slug = null;
                updates.current_question_title = null;
                updates.last_notified_at = now.toISOString();
                await supabase.from('users').update(updates).eq('id', user.id);

                return { success: true, status: 'celebrated', username: user.leetcode_username };
            }
        } else if (!user.current_question_slug || shouldUpdateUser) {
            // No active question or shuffle requested, pick a new one
            shouldUpdateUser = true;
        }

        if (shouldUpdateUser) {
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            question = await LeetCodeService.getRandomQuestion(randomTopic, user.difficulties);

            // Track this as the new current question
            const slug = question.url.split('/problems/')[1]?.replace(/\/$/, '');
            updates.current_question_slug = slug;
            updates.current_question_title = question.title;
        }

        if (!question) return { success: false, reason: 'Question fetch failed' };

        // Messaging Logic
        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

        const templates = [
            { title: 'Daily Nudge', message: `Here's your next problem: ${question.title}. LET'S GO!` },
            { title: 'Time to Practice', message: `CRUSH today's problem: ${question.title}.` },
            { title: 'Reminder', message: `Your problem for today: ${question.title}. Time to TACKLE it!` }
        ];

        const selected = pick(templates);
        let title = selected.title;
        let message = selected.message;
        let priority: 1 | 2 | 3 | 4 | 5 = (shouldUpdateUser || forceNewQuestion) ? 4 : 3;

        // If it's a forced reset, use a more distinct title
        if (forceNewQuestion) {
            title = `New Day, New Goal`;
            message = `Fresh start for today: ${question.title}. You've got this!`;
        }

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
                { label: 'Try Another', url: `${process.env.NEXT_PUBLIC_APP_URL}/api/user/shuffle?key=${user.secret_key}` },
                { label: 'Settings', url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/${user.secret_key}` }
            ]
        });

        if (success) {
            // Update last notified time and any question changes
            updates.last_notified_at = now.toISOString();
            if (forceNewQuestion) {
                updates.last_reset_at = now.toISOString().split('T')[0]; // Store only date
            }
            await supabase.from('users').update(updates).eq('id', user.id);
        }

        return { success, username: user.leetcode_username, isNewQuestion: shouldUpdateUser };
    }
}
