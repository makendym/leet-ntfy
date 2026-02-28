-- Migration V2: Add missing columns for goals, timing, and study plan progress
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS difficulties text[] DEFAULT '{Easy, Medium}',
ADD COLUMN IF NOT EXISTS schedule_days integer[] DEFAULT '{0,1,2,3,4,5,6}',
ADD COLUMN IF NOT EXISTS daily_goal integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS nudge_interval integer DEFAULT 180,
ADD COLUMN IF NOT EXISTS solved_today integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS solved_slugs text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_solve_at timestamptz,
ADD COLUMN IF NOT EXISTS study_plan_slug text,
ADD COLUMN IF NOT EXISTS plan_progress jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_reset_at text;

-- Optional: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_secret_key ON users(secret_key);
CREATE INDEX IF NOT EXISTS idx_users_leetcode_username ON users(leetcode_username);
