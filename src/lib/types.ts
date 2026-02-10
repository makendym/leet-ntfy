export interface UserProfile {
    id: string;
    leetcode_username: string;
    secret_key: string;
    topics: string[];
    notification_frequency: 'daily' | 'weekly' | 'none';
    current_question_slug?: string | null;
    current_question_title?: string | null;
    last_notified_at?: string;
    last_reset_at?: string;
    timezone?: string;
    difficulties?: string[];
    created_at: string;
    study_plan_slug?: string | null;
}

export interface LeetCodeStats {
    username: string;
    solvedProblems: {
        easy: number;
        medium: number;
        hard: number;
        total: number;
    };
    totalProblems: {
        easy: number;
        medium: number;
        hard: number;
        total: number;
    };
    rank: number;
    recentSubmissions: Array<{
        title: string;
        timestamp: string;
        status: string;
    }>;
}

export interface NotificationPayload {
    title: string;
    message: string;
    topic: string;
    tags?: string[];
    priority?: 1 | 2 | 3 | 4 | 5;
    image?: string;
    icon?: string;
    actions?: Array<{
        label: string;
        url: string;
    }>;
}
