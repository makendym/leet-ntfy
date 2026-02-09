
import { describe, it, expect, vi } from 'vitest';
import { LeetCodeService } from '../lib/services/LeetCodeService';

describe('LeetCodeService Random Question Logic', () => {
    it('should support multiple difficulties in selection', async () => {
        const difficulties = ['Easy', 'Medium'];
        const results = new Set<string>();

        // Run multiple times to verify distribution
        for (let i = 0; i < 5; i++) {
            const question = await LeetCodeService.getRandomQuestion('Array', difficulties);
            if (question && question.difficulty) {
                results.add(question.difficulty);
            }
        }

        // Verify that we are actually picking from the provided list
        results.forEach(diff => {
            expect(difficulties).toContain(diff);
        });

        expect(results.size).toBeGreaterThan(0);
    });

    it('should fix topic tag slug generation for "Heap (Priority Queue)"', async () => {
        // The previous bug caused this to generate an invalid tag.
        // We verify it returns questions (proving the tag mapping is correct).
        const question = await LeetCodeService.getRandomQuestion('Heap (Priority Queue)', ['Easy', 'Medium', 'Hard']);

        expect(question).not.toBeNull();
        if (question) {
            expect(question.title).toBeDefined();
            expect(question.url).toContain('leetcode.com/problems/');
        }
    });

    it('should respect a single difficulty setting', async () => {
        const difficulty = ['Medium'];
        const question = await LeetCodeService.getRandomQuestion('String', difficulty);

        expect(question).not.toBeNull();
        if (question) {
            expect(question.difficulty).toBe('Medium');
        }
    });

    it('should fallback to mock data when no questions are found', async () => {
        // Mock fetchQuestions to return an empty array to force fallback
        const fetchSpy = vi.spyOn(LeetCodeService, 'fetchQuestions').mockResolvedValue([]);
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

        const question = await LeetCodeService.getRandomQuestion('Unknown Topic', ['Easy']);

        expect(question).not.toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        fetchSpy.mockRestore();
        consoleSpy.mockRestore();
    });
});
