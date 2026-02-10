import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudyService } from '../lib/services/StudyService';
import { LeetCodeService } from '../lib/services/LeetCodeService';
import { NotificationService } from '../lib/services/NotificationService';
import { UserProfile } from '../lib/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('../lib/supabaseAdmin', () => ({
    supabaseAdmin: {
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null }))
            }))
        }))
    }
}));

vi.mock('../lib/services/LeetCodeService');
vi.mock('../lib/services/NotificationService');

describe('StudyService (Study Plans)', () => {
    const mockUser: UserProfile = {
        id: 'user-123',
        leetcode_username: 'testuser',
        secret_key: 'secret-123',
        topics: ['Array'],
        notification_frequency: 'daily',
        last_notified_at: '2020-01-01T00:00:00Z', // Old date to avoid cooldown
        last_reset_at: '2020-01-01',
        timezone: 'UTC',
        difficulties: ['EASY', 'MEDIUM'],
        created_at: new Date().toISOString(),
        study_plan_slug: 'leetcode-75'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(NotificationService.sendNotification).mockResolvedValue(true);
    });

    it('should pick the first unsolved question from the study plan', async () => {
        console.log('\n--- VERIFYING SEQUENTIAL PLAN LOGIC ---');
        const planQuestions = [
            { title: 'Merge Strings Alternately', url: 'https://leetcode.com/problems/merge-strings-alternately/', difficulty: 'EASY' },
            { title: 'Greatest Common Divisor', url: 'https://leetcode.com/problems/greatest-common-divisor-of-strings/', difficulty: 'MEDIUM' },
            { title: 'Kids With Candies', url: 'https://leetcode.com/problems/kids-with-the-greatest-number-of-candies/', difficulty: 'HARD' }
        ];

        console.log(`1. Plan loaded with ${planQuestions.length} items`);
        vi.mocked(LeetCodeService.getStudyPlanQuestions).mockResolvedValue(planQuestions);

        // Mock Problem 1 as solved, Problem 2 as unsolved
        console.log('2. Simulating User State: [Merge Strings] is DONE, [Greatest Common Divisor] is NEW');
        vi.mocked(LeetCodeService.isQuestionSolved)
            .mockResolvedValueOnce(true)   // Question 1 solved
            .mockResolvedValueOnce(false);  // Question 2 unsolved

        const result = await StudyService.sendStudyNudge(mockUser, true);

        expect(result.success).toBe(true);
        expect(LeetCodeService.getStudyPlanQuestions).toHaveBeenCalledWith('leetcode-75');

        // Should have sent notification for Problem 2
        const notificationCall = vi.mocked(NotificationService.sendNotification).mock.calls[0][0];
        console.log(`3. Resulting Nudge: "${notificationCall.message}"`);

        expect(notificationCall.message).toContain('Greatest Common Divisor');
        console.log('--- TEST PASSED: SEQUENTIAL LOGIC VERIFIED ---');
    });

    it('should fallback to random topics if all plan questions are solved', async () => {
        const planQuestions = [
            { title: 'Problem 1', url: 'https://leetcode.com/problems/problem-1/', difficulty: 'EASY' }
        ];

        vi.mocked(LeetCodeService.getStudyPlanQuestions).mockResolvedValue(planQuestions);
        vi.mocked(LeetCodeService.isQuestionSolved).mockResolvedValue(true); // All solved

        const randomQuestion = { title: 'Random Hack', url: 'https://leetcode.com/problems/random-hack/', difficulty: 'EASY' };
        vi.mocked(LeetCodeService.getRandomQuestion).mockResolvedValue(randomQuestion);

        const result = await StudyService.sendStudyNudge(mockUser, true);

        expect(result.success).toBe(true);
        const notificationCall = vi.mocked(NotificationService.sendNotification).mock.calls[0][0];
        expect(notificationCall.message).toContain('Random Hack');
    });

    it('should fallback to random topics if study plan fetch fails or is empty', async () => {
        vi.mocked(LeetCodeService.getStudyPlanQuestions).mockResolvedValue([]);

        const randomQuestion = { title: 'Random Hack', url: 'https://leetcode.com/problems/random-hack/', difficulty: 'EASY' };
        vi.mocked(LeetCodeService.getRandomQuestion).mockResolvedValue(randomQuestion);

        const result = await StudyService.sendStudyNudge(mockUser, true);

        expect(result.success).toBe(true);
        expect(LeetCodeService.getRandomQuestion).toHaveBeenCalled();
    });

    it('should list all 75 problems from the study plan', async () => {
        console.log('\n--- LISTING ALL 75 LEETCODE PROBLEMS ---');

        const filePath = path.join(process.cwd(), 'src/__tests__/fixtures/leetcode-75.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const studyPlanData = JSON.parse(fileContent);

        const subGroups = studyPlanData.data.studyPlanV2Detail.planSubGroups;
        const allQuestions = subGroups.flatMap((group: any) => group.questions);

        console.log(`Total questions found: ${allQuestions.length}`);

        allQuestions.forEach((q: any, index: number) => {
            console.log(`${(index + 1).toString().padStart(2, ' ')}. [${q.difficulty.padStart(6, ' ')}] ${q.title}`);
        });

        expect(allQuestions.length).toBe(75);
        console.log('--- END OF LIST ---');
    });

    it('should list all 150 problems from the Top Interview 150 study plan', async () => {
        console.log('\n--- LISTING ALL 150 TOP INTERVIEW PROBLEMS ---');

        const filePath = path.join(process.cwd(), 'src/__tests__/fixtures/top-interview-150.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const studyPlanData = JSON.parse(fileContent);

        const subGroups = studyPlanData.data.studyPlanV2Detail.planSubGroups;
        const allQuestions = subGroups.flatMap((group: any) => group.questions);

        console.log(`Total questions found: ${allQuestions.length}`);

        allQuestions.forEach((q: any, index: number) => {
            console.log(`${(index + 1).toString().padStart(3, ' ')}. [${q.difficulty.padStart(6, ' ')}] ${q.title}`);
        });

        expect(allQuestions.length).toBe(150);
        console.log('--- END OF LIST ---');
    });
});
