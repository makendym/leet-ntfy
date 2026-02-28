import { createClient } from '@supabase/supabase-js';

// We assume variables are loaded via node --env-file=.env.local
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncUserHistory(user) {
    console.log(`\nProcessing user: ${user.leetcode_username}...`);
    
    const query = `
      query recentAcSubmissionList($username: String!, $limit: Int) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          titleSlug
          timestamp
        }
      }
    `;

    const variables = {
        username: user.leetcode_username,
        limit: 100
    };

    try {
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();
        const leetSolves = result.data?.recentAcSubmissionList || [];
        
        if (leetSolves.length === 0) {
            console.log(`  ! No recent AC submissions found on LeetCode.`);
            return;
        }

        // Create a map of Slug -> Timestamp (ISO)
        const leetMap = new Map();
        leetSolves.forEach(s => {
            const date = new Date(parseInt(s.timestamp) * 1000);
            leetMap.set(s.titleSlug, date.toISOString());
        });

        const history = user.solve_history || [];
        let updatedCount = 0;

        // Update timestamps in history if we found a better match from LeetCode
        const updatedHistory = history.map(item => {
            const leetTime = leetMap.get(item.slug);
            // item.solved_at === user.created_at is our placeholder check
            if (leetTime && (item.solved_at === user.created_at || !item.solved_at)) {
                updatedCount++;
                return { ...item, solved_at: leetTime };
            }
            return item;
        });

        if (updatedCount > 0) {
            const { error } = await supabase
                .from('users')
                .update({ solve_history: updatedHistory })
                .eq('id', user.id);

            if (error) throw error;
            console.log(`  ✅ Updated ${updatedCount} timestamps from LeetCode!`);
        } else {
            console.log(`  - No new timestamps to update (already accurate or not in recent AC list).`);
        }

    } catch (err) {
        console.error(`  ❌ Failed to sync ${user.leetcode_username}:`, err.message);
    }
}

async function main() {
    console.log("Starting History Timestamp Sync...");
    
    const { data: users, error } = await supabase
        .from('users')
        .select('id, leetcode_username, solve_history, created_at');

    if (error) {
        console.error("Failed to fetch users:", error);
        return;
    }

    for (const user of users) {
        if (user.leetcode_username) {
            await syncUserHistory(user);
        }
    }

    console.log("\nSync complete!");
}

main();
