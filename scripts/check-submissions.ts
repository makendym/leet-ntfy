async function checkSubmissions(username: string) {
    const GRAPHQL_BASE = 'https://leetcode.com/graphql';
    const query = `
      query recentSubmissionList($username: String!, $limit: Int) {
        recentSubmissionList(username: $username, limit: $limit) {
          title
          titleSlug
          statusDisplay
        }
      }
    `;
    const variables = { username, limit: 100 };

    try {
        const response = await fetch(GRAPHQL_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });
        const data = await response.json();
        const submissions = data?.data?.recentSubmissionList || [];
        console.log(`Submissions for ${username}:`);
        submissions.forEach((s: any, i: number) => {
            console.log(`${i + 1}. [${s.statusDisplay}] ${s.title} (${s.titleSlug})`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

const username = process.argv[2] || 'MMidouin';
checkSubmissions(username);
