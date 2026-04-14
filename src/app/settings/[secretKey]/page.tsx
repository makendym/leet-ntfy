'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, RefreshCcw } from 'lucide-react';
import { LeetCodeService } from '@/lib/services/LeetCodeService';
import { UserProfile, LeetCodeStats } from '@/lib/types';

// Modular Components
import { StatsBanner } from '@/components/settings/StatsBanner';
import { StudyPathCard } from '@/components/settings/StudyPathCard';
import { PaceSettingsCard } from '@/components/settings/PaceSettingsCard';
import { GroupNudgingCard } from '@/components/settings/GroupNudgingCard';
import { ContentFilterCard } from '@/components/settings/ContentFilterCard';
import { ConnectionGuide } from '@/components/settings/ConnectionGuide';
import { ActiveChallenge } from '@/components/settings/ActiveChallenge';
import { ActivityHeatmap } from '@/components/settings/ActivityHeatmap';

export default function SettingsPage({ params }: { params: Promise<{ secretKey: string }> }) {
    const { secretKey } = use(params);
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<LeetCodeStats | null>(null);
    const [allTopics, setAllTopics] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [nudgeStatus, setNudgeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [planCounts, setPlanCounts] = useState<Record<string, number>>({});
    const [isResetting, setIsResetting] = useState(false);
    const [calendarData, setCalendarData] = useState<any>(null);

    useEffect(() => {
        async function init() {
            // 1. Fetch user by secret key
            try {
                const res = await fetch(`/api/user/settings?secretKey=${secretKey}`);
                if (!res.ok) throw new Error('Unauthorized');
                const userData = await res.json();
                setUser(userData);

                // 2. Fetch LeetCode stats via proxy
                const statsRes = await fetch(`/api/leetcode/stats?username=${userData.leetcode_username}`);
                if (statsRes.ok) {
                    const leetStats = await statsRes.json();
                    setStats(leetStats);
                }

                // 3. Fetch all possible topics
                const topics = await LeetCodeService.getTopics();
                setAllTopics(topics);

                // 4. Fetch study plan counts via proxy
                const plans = ['leetcode-75', 'top-interview-150', 'neetcode-150'];
                const counts: Record<string, number> = {};
                for (const slug of plans) {
                    const res = await fetch(`/api/leetcode/study-plan/questions?slug=${slug}`);
                    if (res.ok) {
                        const qs = await res.json();
                        counts[slug] = qs.length;
                    }
                }
                setPlanCounts(counts);

                // 5. Fetch LeetCode calendar data
                const calendarRes = await fetch(`/api/leetcode/calendar?username=${userData.leetcode_username}`);
                if (calendarRes.ok) {
                    const cal = await calendarRes.json();
                    setCalendarData(cal);
                }

            } catch (err) {
                console.error(err);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, [secretKey, router]);

    const toggleTopic = async (topic: string) => {
        if (!user) return;

        const isRemoving = user.topics.includes(topic);

        if (isRemoving && user.topics.length <= 1) return;

        const newTopics = isRemoving
            ? user.topics.filter(t => t !== topic)
            : [...user.topics, topic];

        setUser({ ...user, topics: newTopics });

        setIsSaving(true);
        try {
            await fetch(`/api/user/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey, topics: newTopics }),
            });
        } catch (err) {
            console.error('Failed to save topics:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDifficulty = async (difficulty: string) => {
        if (!user) return;

        const currentDiffs = user.difficulties || ['Easy', 'Medium'];
        const isRemoving = currentDiffs.includes(difficulty);

        if (isRemoving && currentDiffs.length <= 1) return;

        const newDiffs = isRemoving
            ? currentDiffs.filter(d => d !== difficulty)
            : [...currentDiffs, difficulty];

        setUser({ ...user, difficulties: newDiffs });

        setIsSaving(true);
        try {
            await fetch(`/api/user/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey, difficulties: newDiffs }),
            });
        } catch (err) {
            console.error('Failed to save difficulties:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleDay = async (dayIndex: number) => {
        if (!user) return;

        const currentDays = user.schedule_days || [0, 1, 2, 3, 4, 5, 6];
        const isRemoving = currentDays.includes(dayIndex);

        if (isRemoving && currentDays.length <= 1) return;

        const newDays = isRemoving
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex].sort();

        setUser({ ...user, schedule_days: newDays });

        setIsSaving(true);
        try {
            await fetch(`/api/user/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey, schedule_days: newDays }),
            });
        } catch (err) {
            console.error('Failed to save schedule:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStudyPlan = async (planSlug: string | null) => {
        if (!user) return;

        setUser({ ...user, study_plan_slug: planSlug });

        setIsSaving(true);
        try {
            await fetch(`/api/user/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey, study_plan_slug: planSlug }),
            });
            // Refresh user data silently to get the newly auto-assigned current_question
            const userRes = await fetch(`/api/user/settings?secretKey=${secretKey}`);
            const userData = await userRes.json();
            setUser(userData);
        } catch (err) {
            console.error('Failed to save study plan:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const resetPlan = async (slug: string) => {
        if (!user || isResetting) return;

        const confirmReset = window.confirm(`Are you sure you want to reset your progress for ${slug}? This will start the questions from the beginning.`);
        if (!confirmReset) return;

        setIsResetting(true);
        const newProgress = { ...user.plan_progress };
        delete newProgress[slug];

        setUser({ ...user, plan_progress: newProgress });

        try {
            await fetch(`/api/user/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey, plan_progress: newProgress }),
            });
            // Also trigger a nudge to get the new first question
            testNotification();
        } catch (err) {
            console.error('Failed to reset plan:', err);
        } finally {
            setIsResetting(false);
        }
    };

    const markAsSolved = async (slug: string) => {
        if (!user || !slug) return;
        const currentSolved = user.solved_slugs || [];
        if (currentSolved.includes(slug)) return;

        const now = new Date();
        const solveItem = { slug, solved_at: now.toISOString() };
        const newSolved = [...currentSolved, slug];
        const newHistory = [...(user.solve_history || []), solveItem];

        const isCurrent = user.current_question_slug === slug;
        const updates: any = {
            secretKey,
            solved_slugs: newSolved,
            solve_history: newHistory,
            current_question_slug: isCurrent ? null : user.current_question_slug,
            current_question_title: isCurrent ? null : user.current_question_title,
            last_solve_at: now.toISOString()
        };

        let newPlanProgress = user.plan_progress;
        if (user.study_plan_slug) {
            const planProgress = user.plan_progress || {};
            const currentPlanEntries = planProgress[user.study_plan_slug] || [];

            const isAlreadyInPlan = currentPlanEntries.some((entry: any) =>
                typeof entry === 'string' ? entry === slug : entry.slug === slug
            );

            if (!isAlreadyInPlan) {
                newPlanProgress = {
                    ...planProgress,
                    [user.study_plan_slug]: [
                        ...currentPlanEntries,
                        solveItem
                    ]
                };
                updates.plan_progress = newPlanProgress;
            }
        }

        setUser({
            ...user,
            solved_slugs: newSolved,
            solve_history: newHistory,
            current_question_slug: isCurrent ? null : user.current_question_slug,
            current_question_title: isCurrent ? null : user.current_question_title,
            plan_progress: newPlanProgress,
            last_solve_at: now.toISOString()
        });

        setIsSaving(true);
        try {
            await fetch(`/api/user/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            testNotification();
        } catch (err) {
            console.error('Failed to save solved slug:', err);
        } finally {
            setIsSaving(false);
        }
    };

    async function shuffleQuestion() {
        if (!user) return;
        setNudgeStatus('loading');
        try {
            const res = await fetch(`/api/user/shuffle?key=${secretKey}`);
            if (res.ok) {
                setNudgeStatus('success');
                // Refresh user data to get the new current_question
                const userRes = await fetch(`/api/user/settings?secretKey=${secretKey}`);
                const userData = await userRes.json();
                setUser(userData);
                setTimeout(() => setNudgeStatus('idle'), 3000);
            } else {
                setNudgeStatus('error');
                setTimeout(() => setNudgeStatus('idle'), 3000);
            }
        } catch (err) {
            console.error(err);
            setNudgeStatus('error');
            setTimeout(() => setNudgeStatus('idle'), 3000);
        }
    };

    const testNotification = async () => {
        if (!user) return;
        setNudgeStatus('loading');
        try {
            const res = await fetch(`/api/user/nudge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secretKey })
            });

            if (res.ok) {
                setNudgeStatus('success');
                const userRes = await fetch(`/api/user/settings?secretKey=${secretKey}`);
                const userData = await userRes.json();
                setUser(userData);
                setTimeout(() => setNudgeStatus('idle'), 3000);
            } else {
                setNudgeStatus('error');
                setTimeout(() => setNudgeStatus('idle'), 3000);
            }
        } catch (err) {
            console.error(err);
            setNudgeStatus('error');
            setTimeout(() => setNudgeStatus('idle'), 3000);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-orange-500">
            <RefreshCcw className="w-8 h-8 animate-spin" />
        </div>
    );

    // Derived Progress Logic
    const userTimezone = user?.timezone || 'America/New_York';
    const nowLocal = new Date();
    const todayStr = new Date(nowLocal.toLocaleString('en-US', { timeZone: userTimezone })).toDateString();
    const solvedTodayCount = user?.solve_history?.filter(item => {
        if (!item.solved_at) return false;
        const dateObj = new Date(item.solved_at);
        const solveDayStr = new Date(dateObj.toLocaleString('en-US', { timeZone: userTimezone })).toDateString();
        return solveDayStr === todayStr;
    }).length || 0;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* --- 1. HEADER & TOP NAV --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-[#ffa116] to-[#ff7b16] p-3 rounded-2xl shadow-lg shadow-orange-500/10">
                            <Settings className="w-8 h-8 text-black stroke-[2.5]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Workboard</h1>
                            <p className="text-gray-500 font-medium">Managing <span className="text-[#ffa116]">@{user?.leetcode_username}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        {user && (
                            <div className="flex-grow md:flex-none flex flex-col justify-center gap-1.5 bg-white/5 px-4 h-[52px] rounded-2xl border border-white/5">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">Goal Progress</span>
                                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${solvedTodayCount >= (user.daily_goal || 1) ? 'bg-green-500/20 text-green-500' : 'bg-[#ffa116]/20 text-[#ffa116]'}`}>
                                        {solvedTodayCount}/{user.daily_goal || 1}
                                    </span>
                                </div>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#ffa116] to-orange-400 transition-all duration-1000 shadow-[0_0_10px_rgba(255,161,22,0.3)]"
                                        style={{ width: `${Math.min(100, (solvedTodayCount / (user.daily_goal || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        <button
                            onClick={testNotification}
                            disabled={nudgeStatus !== 'idle'}
                            className="w-[52px] h-[52px] flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all active:scale-95"
                            title="Trigger Manual Nudge"
                        >
                            <RefreshCcw className={`w-6 h-6 text-white ${nudgeStatus === 'loading' ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* --- 2. GRID WORKSPACE (3 Rows, 2 Columns with 2:1 Ratio) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

                    {/* ROW 1: METRICS */}
                    <div className="lg:col-span-2 h-full">
                        <StatsBanner stats={stats} />
                    </div>
                    <div className="lg:col-span-1 h-full">
                        <ActivityHeatmap calendarData={calendarData} timezone={user?.timezone} />
                    </div>

                    {/* ROW 2: CORE CHALLENGE & SYNC */}
                    <div className="lg:col-span-2 flex flex-col gap-8 h-full">
                        <ActiveChallenge
                            user={user}
                            onMarkAsSolved={markAsSolved}
                            onRefresh={shuffleQuestion}
                            isSaving={isSaving}
                            nudgeStatus={nudgeStatus}
                        />

                        <StudyPathCard
                            user={user}
                            planCounts={planCounts}
                            onTogglePlan={toggleStudyPlan}
                            onResetPlan={resetPlan}
                        />
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-4 h-full">
                        <ConnectionGuide user={user} />
                        <div className="flex-1">
                            <GroupNudgingCard />
                        </div>
                    </div>

                    {/* ROW 3: CONFIGURATION & UTILITIES */}
                    <div className="lg:col-span-2 flex flex-col gap-8 h-full">
                        <PaceSettingsCard
                            user={user}
                            onUpdateGoal={async (goal: number) => {
                                if (!user) return;
                                setUser({ ...user, daily_goal: goal });
                                setIsSaving(true);
                                await fetch(`/api/user/settings`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ secretKey, daily_goal: goal }),
                                });
                                setIsSaving(false);
                            }}
                            onUpdateInterval={async (interval: number) => {
                                if (!user) return;
                                setUser({ ...user, nudge_interval: interval });
                                setIsSaving(true);
                                await fetch(`/api/user/settings`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ secretKey, nudge_interval: interval }),
                                });
                                setIsSaving(false);
                            }}
                            onToggleDay={toggleDay}
                        />

                        <ContentFilterCard
                            user={user}
                            allTopics={allTopics}
                            onToggleTopic={toggleTopic}
                            onToggleDifficulty={toggleDifficulty}
                            isSaving={isSaving}
                        />
                    </div>

                    {/* Last item (Sign Out) does not need h-full height stretching per request */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="p-1 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                            <button
                                onClick={() => router.push('/')}
                                className="w-full py-4 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all font-bold text-sm tracking-wide"
                            >
                                Sign Out of Session
                            </button>
                        </div>

                        <div className="text-center">
                            <a
                                href="https://github.com/makendym/leet-ntfy"
                                target="_blank"
                                className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors"
                            >
                                Documentation & Source
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
