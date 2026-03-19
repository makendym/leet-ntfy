const GRAPHQL_BASE = 'https://leetcode.com/graphql';

async function testLeetCodeCalendar(username) {
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

    console.log(`\n--- Fetching Calendar for: ${username} ---`);
    
    try {
        const response = await fetch(GRAPHQL_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();
        console.log('API Response:', JSON.stringify(result, null, 2));

        if (result.data?.matchedUser?.userCalendar?.submissionCalendar) {
            const calendar = JSON.parse(result.data.matchedUser.userCalendar.submissionCalendar);
            console.log('\nParsed Calendar (first 5 entries):');
            const entries = Object.entries(calendar).slice(0, 5);
            entries.forEach(([ts, count]) => {
                const date = new Date(parseInt(ts) * 1000);
                console.log(` - ${date.toDateString()}: ${count}`);
            });
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

const testUsername = process.argv[2] || 'MMidouin';
testLeetCodeCalendar(testUsername);
