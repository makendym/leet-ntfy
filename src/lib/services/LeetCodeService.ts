import { LeetCodeStats } from '../types';

export class LeetCodeService {
  private static readonly API_BASE = 'https://leetcode-stats-api.herokuapp.com';
  private static readonly GRAPHQL_BASE = 'https://leetcode.com/graphql';

  static async getUserStats(username: string): Promise<LeetCodeStats | null> {
    const query = `
          query getUserProfile($username: String!) {
            allQuestionsCount {
              difficulty
              count
            }
            matchedUser(username: $username) {
              username
              profile {
                ranking
              }
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `;
    const variables = { username };

    try {
      const response = await fetch(this.GRAPHQL_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      const result = await response.json();

      if (result.errors || !result.data.matchedUser) {
        return null;
      }

      const data = result.data;
      const solvedStats = data.matchedUser.submitStats.acSubmissionNum;
      const totalStats = data.allQuestionsCount;

      const getSolved = (diff: string) => solvedStats.find((s: any) => s.difficulty === diff)?.count || 0;
      const getTotal = (diff: string) => totalStats.find((s: any) => s.difficulty === diff)?.count || 0;

      return {
        username,
        solvedProblems: {
          easy: getSolved('Easy'),
          medium: getSolved('Medium'),
          hard: getSolved('Hard'),
          total: getSolved('All'),
        },
        totalProblems: {
          easy: getTotal('Easy'),
          medium: getTotal('Medium'),
          hard: getTotal('Hard'),
          total: getTotal('All'),
        },
        rank: data.matchedUser.profile.ranking,
        recentSubmissions: [],
      };
    } catch (error) {
      console.error('Error fetching LeetCode stats via GraphQL:', error);
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
                isPaidOnly
              }
            }
          }
        `;

    // Improved slug generation (e.g. "Heap (Priority Queue)" -> "heap-priority-queue")
    const tagSlug = topic.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[()]/g, '')
      .replace(/-+/g, '-');

    const filters: any = { tags: [tagSlug] };

    if (difficulties && difficulties.length > 0) {
      // Pick a random difficulty from the selected ones to increase variety
      const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      filters.difficulty = randomDifficulty.toUpperCase();
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
      const questions = data?.data?.problemsetQuestionList?.questions || [];

      // Filter out premium questions
      return questions.filter((q: any) => !q.isPaidOnly);
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
        url: `https://leetcode.com/problems/${question.titleSlug}/`,
        difficulty: question.difficulty
      };
    }

    console.warn(`No questions found for topic: ${topic} with difficulties: ${difficulties}. Falling back to mock data.`);

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
      url: `https://leetcode.com/problems/${slug}/`,
      difficulty: 'Easy' // Default fallback difficulty
    };
  }

  static async isQuestionSolved(username: string, questionSlug: string, localSolvedSlugs?: string[]): Promise<{ solved: boolean; timestamp?: string; isPaidOnly?: boolean }> {
    // First check local history
    if (localSolvedSlugs && localSolvedSlugs.includes(questionSlug)) {
      return { solved: true };
    }

    const query = `
          query recentSubmissionList($username: String!, $limit: Int, $questionSlug: String!) {
            recentSubmissionList(username: $username, limit: $limit) {
             titleSlug
             statusDisplay
             timestamp
           }
           question(titleSlug: $questionSlug) {
             isPaidOnly
           }
         }
       `;

    const variables = {
      username,
      questionSlug,
      limit: 100
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

      const solution = submissions.find((s: any) =>
        s.titleSlug === questionSlug && s.statusDisplay === 'Accepted'
      );

      const isPaidOnly = data?.data?.question?.isPaidOnly;

      if (solution) {
        // Convert unix timestamp string to ISO string
        const date = new Date(parseInt(solution.timestamp) * 1000);
        return { solved: true, timestamp: date.toISOString(), isPaidOnly };
      }

      return { solved: false, isPaidOnly };
    } catch (error) {
      console.error('Error checking question status:', error);
      return { solved: false };
    }
  }

  static async getStudyPlanDetails(planSlug: string) {
    const query = `
          query studyPlanV2Detail($slug: String!) {
            studyPlanV2Detail(planSlug: $slug) {
              name
              planSubGroups {
                name
                slug
                questions {
                  title
                  titleSlug
                  difficulty
                  paidOnly
                }
              }
            }
          }
        `;

    const variables = { slug: planSlug };

    try {
      const response = await fetch(this.GRAPHQL_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      return data?.data?.studyPlanV2Detail || null;
    } catch (error) {
      console.error('Error fetching study plan details:', error);
      return null;
    }
  }

  static async getStudyPlanQuestions(planSlug: string) {
    const query = `
          query studyPlanV2Detail($slug: String!) {
            studyPlanV2Detail(planSlug: $slug) {
              planSubGroups {
                questions {
                  title
                  titleSlug
                  difficulty
                  paidOnly
                }
              }
            }
          }
        `;

    const variables = { slug: planSlug };

    try {
      const response = await fetch(this.GRAPHQL_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      const data = await response.json();
      const subGroups = data?.data?.studyPlanV2Detail?.planSubGroups || [];

      // Flatten all questions from all sub-groups and filter out premium
      const questions = subGroups.flatMap((group: any) => group.questions || []);

      return questions
        .filter((q: any) => !q.paidOnly)
        .map((q: any) => ({
          title: q.title,
          url: `https://leetcode.com/problems/${q.titleSlug}/`,
          difficulty: q.difficulty
        }));
    } catch (error) {
      console.error('Error fetching study plan questions:', error);
      return [];
    }
  }

  static async getUserCalendar(username: string) {
    const query = `
      query userCalendar($username: String!) {
        matchedUser(username: $username) {
          userCalendar {
            activeYears
            streak
            totalActiveDays
            submissionCalendar
          }
        }
      }
    `;

    const variables = { username };

    try {
      const response = await fetch(this.GRAPHQL_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();
      const calendarData = result.data?.matchedUser?.userCalendar;
      if (calendarData?.submissionCalendar) {
        try {
          calendarData.submissionCalendar = JSON.parse(calendarData.submissionCalendar);
        } catch (e) {
          console.error('Error parsing submission calendar:', e);
        }
      }
      return calendarData || null;
    } catch (error) {
      console.error('Error fetching user calendar:', error);
      return null;
    }
  }
}
