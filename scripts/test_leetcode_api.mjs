const GRAPHQL_BASE = 'https://leetcode.com/graphql';

async function testLeetCodeGraphQL(username) {
    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
          }
        }
        recentSubmissionList(username: $username, limit: 5) {
          title
          titleSlug
          statusDisplay
          timestamp
        }
      }
    `;

    const variables = {
        username: username
    };

    console.log(`\n--- Fetching Data for: ${username} ---`);
    
    try {
        const response = await fetch(GRAPHQL_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();
        console.log('API Response:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

const testUsername = process.argv[2] || 'MMidouin';
testLeetCodeGraphQL(testUsername);
