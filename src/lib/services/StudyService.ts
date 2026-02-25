import { supabaseAdmin as supabase } from '../supabaseAdmin';
import { LeetCodeService } from './LeetCodeService';
import { NotificationService } from './NotificationService';
import { UserProfile } from '../types';

export class StudyService {
    static async sendStudyNudge(user: UserProfile, isManual: boolean = false, forceNewQuestion: boolean = false) {
        // Fallback for empty topics
        const topics = (user.topics && user.topics.length > 0) ? user.topics : ['Array'];

        const now = new Date();
        const userTimezone = user.timezone || 'America/New_York';

        // --- LAZY RESET LOGIC ---
        // If the user's last solve was on a different day, reset solved_today
        const todayStr = new Date(now.toLocaleString('en-US', { timeZone: userTimezone })).toDateString();
        const lastSolveStr = user.last_solve_at ? new Date(new Date(user.last_solve_at).toLocaleString('en-US', { timeZone: userTimezone })).toDateString() : '';

        let solvedToday = user.solved_today || 0;
        if (lastSolveStr && lastSolveStr !== todayStr) {
            solvedToday = 0;
            // We'll update this in the database later if we send a nudge or if someone calls solve
        }

        // Use Intl to get the hour in the user's timezone
        const currentHour = parseInt(new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: userTimezone
        }).format(now));

        // Safety checks (skipped for manual triggers and forced resets)
        if (!isManual && !forceNewQuestion) {
            // 1. Goal Check: If already hit the daily goal, stop nudging
            const goal = user.daily_goal || 1;
            if (solvedToday >= goal) {
                return { success: false, reason: `Daily goal met (${solvedToday}/${goal})` };
            }

            // 2. Time Check: Don't send anything before 8 AM in user's timezone
            if (currentHour < 8) return { success: false, reason: `Too early (${currentHour}h in ${userTimezone})` };

            // 3. Schedule check (Day of week)
            const userDay = new Date(now.toLocaleString('en-US', { timeZone: userTimezone })).getDay();
            const allowedDays = user.schedule_days || [0, 1, 2, 3, 4, 5, 6];
            if (!allowedDays.includes(userDay)) {
                return { success: false, reason: `Not a scheduled day (Day ${userDay} in ${userTimezone})` };
            }

            // 4. Cooldown safety check (using nudge_interval)
            if (user.last_notified_at) {
                const lastNotified = new Date(user.last_notified_at).getTime();
                const diffMinutes = (now.getTime() - lastNotified) / (1000 * 60);
                const interval = user.nudge_interval || 180;
                if (diffMinutes < interval) return { success: false, reason: `Cooldown active (${interval} minutes)` };
            }
        }

        let question;
        let shouldUpdateUser = forceNewQuestion;
        const updates: Partial<UserProfile> = {};

        // Check if user has an active question (skip if forcing new one)
        if (!shouldUpdateUser && user.current_question_slug) {
            const isSolved = await LeetCodeService.isQuestionSolved(
                user.leetcode_username,
                user.current_question_slug,
                user.solved_slugs
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

                // 2. Clear current question and persist the solve to local history
                updates.current_question_slug = null;
                updates.current_question_title = null;
                updates.last_notified_at = now.toISOString();

                // Append to solved_slugs if not already there
                const solvedSlugs = user.solved_slugs || [];
                if (!solvedSlugs.includes(user.current_question_slug)) {
                    updates.solved_slugs = [...solvedSlugs, user.current_question_slug];
                }
                await supabase.from('users').update(updates).eq('id', user.id);

                return { success: true, status: 'celebrated', username: user.leetcode_username };
            }
        } else if (!user.current_question_slug || shouldUpdateUser) {
            // No active question or shuffle requested, pick a new one
            shouldUpdateUser = true;
        }

        if (shouldUpdateUser) {
            if (user.study_plan_slug) {
                const planQuestions = await LeetCodeService.getStudyPlanQuestions(user.study_plan_slug);
                if (planQuestions.length > 0) {
                    // Find the first unsolved question in the plan
                    for (const q of planQuestions) {
                        const slug = q.url.split('/problems/')[1]?.split(/[/?#]/)[0];
                        const isSolved = await LeetCodeService.isQuestionSolved(user.leetcode_username, slug, user.solved_slugs);
                        if (!isSolved) {
                            question = q;
                            break;
                        }
                    }
                }
            }

            // Fallback to random if no plan, empty plan, or all plan questions solved
            if (!question) {
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                question = await LeetCodeService.getRandomQuestion(randomTopic, user.difficulties);
            }
        }

        if (!question) return { success: false, reason: 'Question fetch failed' };

        if (shouldUpdateUser) {
            // Track this as the new current question
            const slug = question.url.split('/problems/')[1]?.split(/[/?#]/)[0];
            updates.current_question_slug = slug;
            updates.current_question_title = question.title;
        }

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
        const priority: 1 | 2 | 3 | 4 | 5 = (shouldUpdateUser || forceNewQuestion) ? 4 : 3;

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
            clickUrl: question.url,
            priority,
            icon: `${process.env.NEXT_PUBLIC_APP_URL}/icon.png`,
            image: `https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000&auto=format&fit=crop`, // Generic code image
            actions: [
                {
                    label: 'Marked as Solved',
                    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/user/solve`,
                    type: 'http',
                    method: 'POST',
                    body: JSON.stringify({ secretKey: user.secret_key })
                },
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

            // Persist the (potentially reset) solved_today count
            if (lastSolveStr !== todayStr) {
                updates.solved_today = solvedToday;
            }

            await supabase.from('users').update(updates).eq('id', user.id);
        }

        return {
            success,
            username: user.leetcode_username,
            isNewQuestion: shouldUpdateUser,
            reason: success ? undefined : 'Notification Service failed'
        };
    }
}
