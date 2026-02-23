import { supabaseAdmin as supabase } from '../src/lib/supabaseAdmin';
import { StudyService } from '../src/lib/services/StudyService';

/**
 * Bulk add solved slugs to a user's persistent history.
 * Usage: npx tsx scripts/bulk-solve.ts <username> <slug1> <slug2> ...
 */
async function bulkSolve() {
    const [, , username, ...slugs] = process.argv;

    if (!username || slugs.length === 0) {
        console.log('Usage: npx tsx scripts/bulk-solve.ts <username> <slug1> <slug2> ...');
        return;
    }

    console.log(`Searching for user: @${username}...`);
    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('leetcode_username', username)
        .single();

    if (fetchError || !user) {
        console.error('User not found:', fetchError?.message);
        return;
    }

    const currentSolved = user.solved_slugs || [];
    const newSolved = Array.from(new Set([...currentSolved, ...slugs]));

    console.log(`Adding ${slugs.length} new slugs to history...`);

    const { error: updateError } = await supabase
        .from('users')
        .update({ solved_slugs: newSolved })
        .eq('id', user.id);

    if (updateError) {
        console.error('Update failed:', updateError.message);
        return;
    }

    console.log('✅ History updated successfully!');
    console.log('Triggering a fresh nudge to find your next unsolved challenge...');

    await StudyService.sendStudyNudge(user, true, true);
    console.log('✨ All set! Check your notification for the new question.');
}

bulkSolve();
