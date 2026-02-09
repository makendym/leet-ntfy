
async function fetchQuestions(topic, difficulties) {
    const GRAPHQL_BASE = 'https://leetcode.com/graphql';
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

    // Improved slug generation
    const tagSlug = topic.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[()]/g, '')
        .replace(/-+/g, '-');

    const filters = { tags: [tagSlug] };
    
    if (difficulties && difficulties.length > 0) {
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
        const response = await fetch(GRAPHQL_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();
        return data?.data?.problemsetQuestionList?.questions || [];
    } catch (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
}

async function test(topic, difficulties, count = 5) {
    console.log(`\n--- Testing Topic: "${topic}" | Difficulties: [${difficulties.join(', ')}] ---`);
    for (let i = 0; i < count; i++) {
        const questions = await fetchQuestions(topic, difficulties);
        if (questions.length > 0) {
            const q = questions[Math.floor(Math.random() * questions.length)];
            console.log(`[${i+1}] Result: "${q.title}" | Difficulty: ${q.difficulty} | Slug: ${q.titleSlug}`);
        } else {
            console.log(`[${i+1}] Result: NO QUESTIONS FOUND`);
        }
    }
}

async function runTests() {
    // Test multiple difficulties for Array
    await test('Array', ['Easy', 'Medium'], 5);
    
    // Test Heap tag fix
    await test('Heap (Priority Queue)', ['Easy', 'Medium', 'Hard'], 5);
    
    // Test single difficulty
    await test('String', ['Medium'], 3);
}

runTests();
