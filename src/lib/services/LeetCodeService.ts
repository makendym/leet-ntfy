import { LeetCodeStats } from '../types';

export class LeetCodeService {
    private static readonly API_BASE = 'https://leetcode-stats-api.herokuapp.com';
    private static readonly GRAPHQL_BASE = 'https://leetcode.com/graphql';

    static async getUserStats(username: string): Promise<LeetCodeStats | null> {
        try {
            const response = await fetch(`${this.API_BASE}/${username}`);
            const data = await response.json();

            if (data.status === 'error') {
                throw new Error(data.message || 'Failed to fetch LeetCode stats');
            }

            return {
                username,
                solvedProblems: {
                    easy: data.easySolved,
                    medium: data.mediumSolved,
                    hard: data.hardSolved,
                    total: data.totalSolved,
                },
                totalProblems: {
                    easy: data.totalEasy,
                    medium: data.totalMedium,
                    hard: data.totalHard,
                    total: data.totalQuestions,
                },
                rank: data.ranking,
                recentSubmissions: [], // This API doesn't provide recent submissions in detail
            };
        } catch (error) {
            console.error('Error fetching LeetCode stats:', error);
            return null;
        }
    }

    static async getTopics(): Promise<string[]> {
        // Static list for now, we could fetch these from LeetCode or a local mapping
        return [
            'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
            'Sorting', 'Greedy', 'Depth-First Search', 'Database', 'Binary Search',
            'Matrix', 'Tree', 'Breadth-First Search', 'Bit Manipulation', 'Two Pointers',
            'Prefix Sum', 'Heap (Priority Queue)', 'Binary Tree', 'Simulation', 'Stack'
        ];
    }

    static async fetchQuestions(topic: string, difficulties?: string[]) {
        const query = `
          query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
            problemsetQuestionList: questionList(
              categorySlug: $categorySlug
              limit: $limit
              skip: $skip
              filters: $filters
            ) {
              questions: data {
                title
                titleSlug
                difficulty
              }
            }
          }
        `;

        const filters: any = { tags: [topic.toLowerCase().replace(/ /g, '-')] };
        if (difficulties && difficulties.length > 0) {
            filters.difficulty = difficulties[0].toUpperCase(); // LeetCode API usually takes one difficulty in this specific filter field, or we might need to adjust based on API behavior. Actually, for the problemsetQuestionList, it's often a single value or handled differently. Let's try passing the first one or adjusting for multiple if possible.
            // Actually, many wrappers show it as: filters: { difficulty: "MEDIUM" }
        }

        const variables = {
            categorySlug: "",
            skip: 0,
            limit: 50,
            filters
        };

        try {
            const response = await fetch(this.GRAPHQL_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, variables }),
            });

            const data = await response.json();
            return data?.data?.problemsetQuestionList?.questions || [];
        } catch (error) {
            console.error('Error fetching questions from LeetCode:', error);
            return [];
        }
    }

    static async getRandomQuestion(topic: string, difficulties?: string[]) {
        const questions = await this.fetchQuestions(topic, difficulties);

        if (questions && questions.length > 0) {
            const question = questions[Math.floor(Math.random() * questions.length)];
            return {
                title: question.title,
                url: `https://leetcode.com/problems/${question.titleSlug}/`
            };
        }

        // Fallback to mock data if API fails or returns empty
        const mockQuestions: Record<string, string[]> = {
            'Array': ['Two Sum', 'Best Time to Buy and Sell Stock', 'Contains Duplicate'],
            'String': ['Valid Palindrome', 'Valid Anagram', 'Longest Common Prefix'],
            'Hash Table': ['Two Sum', 'Group Anagrams', 'Top K Frequent Elements'],
            'Dynamic Programming': ['Climbing Stairs', 'Coin Change', 'Longest Increasing Subsequence'],
        };

        const fallbackList = mockQuestions[topic] || ['Two Sum', 'Reverse Integer', 'Palindrome Number'];
        const title = fallbackList[Math.floor(Math.random() * fallbackList.length)];
        const slug = title.toLowerCase().replace(/ /g, '-');

        return {
            title,
            url: `https://leetcode.com/problems/${slug}/`
        };
    }

    static async isQuestionSolved(username: string, questionSlug: string): Promise<boolean> {
        const query = `
          query recentSubmissionList($username: String!, $limit: Int) {
            recentSubmissionList(username: $username, limit: $limit) {
              titleSlug
              statusDisplay
            }
          }
        `;

        const variables = {
            username,
            limit: 20
        };

        try {
            const response = await fetch(this.GRAPHQL_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query, variables }),
            });

            const data = await response.json();
            const submissions = data?.data?.recentSubmissionList || [];

            return submissions.some((s: any) =>
                s.titleSlug === questionSlug && s.statusDisplay === 'Accepted'
            );
        } catch (error) {
            console.error('Error checking question status:', error);
            return false;
        }
    }
}
