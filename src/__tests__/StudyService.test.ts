
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudyService } from '../lib/services/StudyService';
import { LeetCodeService } from '../lib/services/LeetCodeService';
import { NotificationService } from '../lib/services/NotificationService';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { UserProfile } from '../lib/types';

// Use vi.mock at the top level to intercept all calls
vi.mock('../lib/supabaseAdmin', () => ({
    supabaseAdmin: {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
    },
    getSupabaseAdmin: vi.fn()
}));
vi.mock('../lib/services/LeetCodeService');
vi.mock('../lib/services/NotificationService');

describe('StudyService Logic', () => {
    const mockUser: UserProfile = {
        id: 'user-123',
        leetcode_username: 'test-user',
        secret_key: 'test-key',
        notification_frequency: 'daily',
        topics: ['Array'],
        difficulties: ['Easy'],
        timezone: 'America/New_York',
        created_at: new Date().toISOString(),
        last_notified_at: "2024-01-01T00:00:00Z",
        current_question_slug: null,
        current_question_title: null,
        last_reset_at: "2024-01-01T00:00:00Z"
    };

    beforeEach(() => {
        vi.resetAllMocks();

        // Use simpler mock assignments that don't rely on mockResolvedValue on undefined properties
        supabaseAdmin.from = vi.fn().mockReturnValue({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
        }) as any;

        NotificationService.sendNotification = vi.fn().mockResolvedValue(true) as any;
        LeetCodeService.isQuestionSolved = vi.fn().mockResolvedValue(false) as any;
        LeetCodeService.getRandomQuestion = vi.fn().mockResolvedValue({
            title: 'Mock Question',
            url: 'https://leetcode.com/problems/mock-question/'
        }) as any;
        LeetCodeService.getStudyPlanQuestions = vi.fn().mockResolvedValue([]) as any;
    });

    it('should allow manual nudges even during cooldown', async () => {
        const user = { ...mockUser, last_notified_at: new Date().toISOString() };
        const result = await StudyService.sendStudyNudge(user as any, true);
        expect(result.success).toBe(true);
    });

    it('should respect the daily goal and stop auto-nudging', async () => {
        const user = {
            ...mockUser,
            daily_goal: 1,
            solved_today: 1,
            last_solve_at: new Date().toISOString()
        };
        const result = await StudyService.sendStudyNudge(user as any, false);
        expect(result.success).toBe(false);
        expect(result.reason).toMatch(/Daily goal met/);
    });

    it('should use the custom nudge interval for cooldown', async () => {
        const lastNotified = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 mins ago
        const user = {
            ...mockUser,
            nudge_interval: 60,
            last_notified_at: lastNotified
        };

        // Should fail if interval is 60 and only 45 passed
        const result = await StudyService.sendStudyNudge(user as any, false);
        expect(result.success).toBe(false);
        expect(result.reason).toContain('Cooldown active (60 minutes)');

        // Should pass if we make it 30 mins interval
        const result2 = await StudyService.sendStudyNudge({ ...user, nudge_interval: 30 } as any, false);
        expect(result2.success).toBe(true);
    });

    it('should reset solved_today on a new day (Lazy Reset)', async () => {
        const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
        const user = {
            ...mockUser,
            solved_today: 5,
            last_solve_at: yesterday
        };

        const result = await StudyService.sendStudyNudge(user as any, false);
        expect(result.success).toBe(true);
        // The service should have reset solved_today internally and allowed the nudge
    });

    it('should enforce the 180-minute (3h) cooldown gap', async () => {
        const now = new Date();
        const recentTime = new Date(now.getTime() - (60 * 60 * 1000)).toISOString(); // 1 hour ago

        const userWithRecentNudge = { ...mockUser, last_notified_at: recentTime };

        const result = await StudyService.sendStudyNudge(userWithRecentNudge, false);

        expect(result.success).toBe(false);
        expect(result.reason).toContain('Cooldown active (180 minutes)');
        expect(NotificationService.sendNotification).not.toHaveBeenCalled();
    });

    it('should allow nudges after 180 minutes have passed', async () => {
        const now = new Date();
        const oldTime = new Date(now.getTime() - (190 * 60 * 1000)).toISOString(); // 3h 10m ago

        const userWithOldNudge = { ...mockUser, last_notified_at: oldTime };

        (LeetCodeService.getRandomQuestion as any).mockResolvedValue({
            title: 'Two Sum',
            url: 'https://leetcode.com/problems/two-sum/',
            difficulty: 'Easy'
        });

        const result = await StudyService.sendStudyNudge(userWithOldNudge, false);

        expect(result.success).toBe(true);
        expect(NotificationService.sendNotification).toHaveBeenCalled();
    });

    it('should trigger celebration when a current question is solved', async () => {
        const userWithActiveQuestion = {
            ...mockUser,
            current_question_slug: 'two-sum',
            current_question_title: 'Two Sum'
        };

        (LeetCodeService.isQuestionSolved as any).mockResolvedValue(true);

        const result = await StudyService.sendStudyNudge(userWithActiveQuestion, false);

        expect(result.status).toBe('celebrated');
        expect(NotificationService.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Challenge Completed'
        }));
    });

    it('should skip automatic nudges before 8 AM local time', async () => {
        const earlyMorning = new Date();
        earlyMorning.setHours(4, 0, 0, 0); // 4 AM

        vi.useFakeTimers();
        vi.setSystemTime(earlyMorning);

        const result = await StudyService.sendStudyNudge(mockUser, false);

        expect(result.success).toBe(false);
        expect(result.reason).toContain('Too early');

        vi.useRealTimers();
    });

    it('should allow manual nudges even during cooldown', async () => {
        const now = new Date();
        const recentTime = new Date(now.getTime() - (30 * 60 * 1000)).toISOString(); // 30 mins ago
        const userInCooldown = { ...mockUser, last_notified_at: recentTime };

        (LeetCodeService.getRandomQuestion as any).mockResolvedValue({
            title: 'Two Sum',
            url: 'https://leetcode.com/problems/two-sum/',
            difficulty: 'Easy'
        });

        const result = await StudyService.sendStudyNudge(userInCooldown, true);

        expect(result.success).toBe(true);
        expect(NotificationService.sendNotification).toHaveBeenCalled();
    });
});
