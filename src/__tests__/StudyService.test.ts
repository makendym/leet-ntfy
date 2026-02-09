
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudyService } from '../lib/services/StudyService';
import { LeetCodeService } from '../lib/services/LeetCodeService';
import { NotificationService } from '../lib/services/NotificationService';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { UserProfile } from '../types';

// Use vi.mock at the top level to intercept all calls
vi.mock('../lib/supabaseAdmin');
vi.mock('./LeetCodeService');
vi.mock('./NotificationService');

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
        last_notified_at: null,
        current_question_slug: null,
        current_question_title: null,
        last_reset_at: null
    };

    beforeEach(() => {
        vi.resetAllMocks();

        // Use simpler mock assignments that don't rely on mockResolvedValue on undefined properties
        supabaseAdmin.from = vi.fn().mockReturnValue({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
        }) as any;

        NotificationService.sendNotification = vi.fn().mockResolvedValue(true) as any;
        LeetCodeService.isQuestionSolved = vi.fn() as any;
        LeetCodeService.getRandomQuestion = vi.fn() as any;
    });

    it('should enforce the 180-minute (3h) cooldown gap', async () => {
        const now = new Date();
        const recentTime = new Date(now.getTime() - (60 * 60 * 1000)).toISOString(); // 1 hour ago

        const userWithRecentNudge = { ...mockUser, last_notified_at: recentTime };

        const result = await StudyService.sendStudyNudge(userWithRecentNudge, false);

        expect(result.success).toBe(false);
        expect(result.reason).toContain('Cooldown active (3 hours)');
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
});
