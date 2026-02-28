-- Migration: Derived Daily Progress & History
-- 1. Add the central solve_history column
ALTER TABLE users ADD COLUMN IF NOT EXISTS solve_history JSONB DEFAULT '[]'::jsonb;

-- 2. Populate solve_history from existing data
-- This logic attempts to merge global solved_slugs with plan-specific progress
-- It prefers timestamps from plan_progress if available.
WITH user_solves AS (
    SELECT 
        u.id,
        (
            SELECT jsonb_agg(DISTINCT solve_item)
            FROM (
                -- Extract from solved_slugs (legacy/global list)
                -- We use the user's created_at as a fallback timestamp for old global solves
                SELECT jsonb_build_object('slug', slug, 'solved_at', u.created_at) as solve_item
                FROM jsonb_array_elements_text(COALESCE(to_jsonb(u.solved_slugs), '[]'::jsonb)) as slug
                
                UNION
                
                -- Extract from plan_progress
                -- We iterate through all plans in the map, and all entries for each plan
                SELECT 
                    CASE 
                        WHEN jsonb_typeof(entry) = 'string' THEN jsonb_build_object('slug', entry, 'solved_at', u.created_at)
                        ELSE entry -- it's already an object {slug, solved_at}
                    END as solve_item
                FROM jsonb_each(COALESCE(u.plan_progress::jsonb, '{}'::jsonb)) as plans(plan_slug, entries),
                jsonb_array_elements(entries) as entry
            ) combined
        ) as aggregated_history
    FROM users u
)
UPDATE users
SET solve_history = COALESCE(user_solves.aggregated_history, '[]'::jsonb)
FROM user_solves
WHERE users.id = user_solves.id;

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_solve_history ON users USING gin (solve_history);

-- Note: We are keeping solved_today and last_solve_at for now to avoid breaking existing code.
-- We will deprecate/remove them in Phase C once the new derived logic is fully verified.
