'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Settings, Check, Plus, ExternalLink, RefreshCcw, Zap, ChevronDown, Copy, Smartphone, Monitor, RotateCcw } from 'lucide-react';
import { LeetCodeService } from '@/lib/services/LeetCodeService';
import { UserProfile, LeetCodeStats } from '@/lib/types';

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
                const plans = ['leetcode-75', 'top-interview-150'];
                const counts: Record<string, number> = {};
                for (const slug of plans) {
                    const res = await fetch(`/api/leetcode/study-plan/questions?slug=${slug}`);
                    if (res.ok) {
                        const qs = await res.json();
                        counts[slug] = qs.length;
                    }
                }
                setPlanCounts(counts);

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
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-[#ffa116] to-[#ff7b16] p-2 rounded-xl">
                            <Settings className="w-8 h-8 text-black" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Workboard</h1>
                            <p className="text-gray-500">Managing <span className="text-[#ffa116]">@{user?.leetcode_username}</span></p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto">
                        {user && (
                            <div className="hidden md:flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Daily Progress</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${solvedTodayCount >= (user.daily_goal || 1) ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-[#ffa116]'}`}>
                                        {solvedTodayCount} / {user.daily_goal || 1}
                                    </span>
                                </div>
                                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#ffa116] to-orange-400 transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (solvedTodayCount / (user.daily_goal || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={testNotification}
                                disabled={nudgeStatus !== 'idle'}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${nudgeStatus === 'success'
                                    ? 'bg-green-600 text-white'
                                    : nudgeStatus === 'error'
                                        ? 'bg-red-600 text-white'
                                        : !user?.current_question_slug
                                            ? 'bg-[#ffa116] text-black font-bold hover:bg-[#ffb342] shadow-lg shadow-orange-500/20'
                                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                    }`}
                            >
                                {nudgeStatus === 'loading' ? (
                                    <RefreshCcw className="w-4 h-4 animate-spin" />
                                ) : nudgeStatus === 'success' ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Sent!
                                    </>
                                ) : nudgeStatus === 'error' ? (
                                    'Try Again'
                                ) : !user?.current_question_slug ? (
                                    <>
                                        <Zap className="w-4 h-4 fill-current" />
                                        Send My First Challenge
                                    </>
                                ) : (
                                    'Test Notification'
                                )}
                            </button>
                            <a
                                href={`https://ntfy.sh/${user?.secret_key}`}
                                target="_blank"
                                className="flex items-center gap-2 p-2 bg-orange-500/20 text-[#ffa116] rounded-lg hover:bg-orange-500/30 transition-colors border border-orange-500/20"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Getting Started Guide */}
                <section className="bg-orange-500/5 border border-orange-500/10 rounded-2xl overflow-hidden transition-all duration-300">
                    <button
                        onClick={() => setIsHelpOpen(!isHelpOpen)}
                        className="w-full flex items-center justify-between p-6 hover:bg-orange-500/10 transition-colors"
                    >
                        <div className="flex items-center gap-3 text-[#ffa116]">
                            <Zap className="w-6 h-6 fill-orange-500/20" />
                            <h2 className="text-xl font-bold">How to get started</h2>
                        </div>
                        <ChevronDown className={`w-6 h-6 text-[#ffa116] transition-transform ${isHelpOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isHelpOpen && (
                        <div className="p-6 pt-0 space-y-6 border-t border-orange-500/10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                                {/* Step 1 */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-[#ffa116] text-black rounded-full text-sm font-bold">1</span>
                                        <h3 className="font-semibold text-orange-100">Set Your Username</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        We use your <span className="text-orange-400 font-medium">@{user?.leetcode_username}</span> to track your progress and stop notifications once you solve the daily challenge.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-[#ffa116] text-black rounded-full text-sm font-bold">2</span>
                                        <h3 className="font-semibold text-orange-100">Sync Notifications</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            Download the <span className="text-orange-400 font-medium">ntfy app</span> and subscribe to your unique topic:
                                        </p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(user?.secret_key || '');
                                                setIsCopied(true);
                                                setTimeout(() => setIsCopied(false), 2000);
                                            }}
                                            className="w-full p-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group hover:border-[#ffa116]/50 transition-all"
                                        >
                                            <code className="text-gray-300 text-xs font-mono truncate mr-2">{user?.secret_key}</code>
                                            {isCopied ? (
                                                <Check className="w-4 h-4 text-green-500 animate-in fade-in zoom-in" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-[#ffa116] group-hover:scale-110 transition-transform" />
                                            )}
                                        </button>
                                        <div className="flex gap-2">
                                            <a
                                                href="https://apps.apple.com/us/app/ntfy/id1625396347"
                                                target="_blank"
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:border-[#ffa116]/50 transition-colors"
                                            >
                                                <Smartphone className="w-3 h-3" /> iOS
                                            </a>
                                            <a
                                                href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                                                target="_blank"
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:border-[#ffa116]/50 transition-colors"
                                            >
                                                <Monitor className="w-3 h-3" /> Android
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-[#ffa116] text-black rounded-full text-sm font-bold">3</span>
                                        <h3 className="font-semibold text-orange-100">Solve to Stop</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        <span className="text-[#ffa116] font-medium">Important:</span> Make sure you are <span className="text-orange-400 underline">logged in</span> on LeetCode. Once you solve the problem, we&apos;ll automatically stop sending reminders!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Current Challenge Card */}
                {user?.current_question_slug && (
                    <section className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-[#ffa116]/30 rounded-2xl p-6 shadow-xl shadow-orange-500/10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[#ffa116] mb-1">
                                    <Zap className="w-5 h-5 fill-current" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Active Challenge</span>
                                </div>
                                <h2 className="text-2xl font-bold">{user.current_question_title}</h2>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <a
                                        href={`https://leetcode.com/problems/${user.current_question_slug}/`}
                                        target="_blank"
                                        className="flex items-center gap-1 hover:text-[#ffa116] transition-colors"
                                    >
                                        View on LeetCode <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => markAsSolved(user.current_question_slug!)}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-[#ffa116] text-black font-bold rounded-xl hover:bg-[#ffb342] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                                >
                                    <Check className="w-5 h-5 stroke-[3]" />
                                    Mark as Solved
                                </button>
                                <button
                                    onClick={testNotification}
                                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                                    title="Try Another"
                                >
                                    <RefreshCcw className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Topics */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-[#ffa116]" />
                                Study Path
                            </h2>
                            <p className="text-sm text-gray-400">Choose between a curated sequential path or random topics.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { name: 'Random Mix', slug: null, desc: 'Random topics' },
                                    { name: 'LeetCode 75', slug: 'leetcode-75', desc: 'Starter essentials' },
                                    { name: 'Interview 150', slug: 'top-interview-150', desc: 'Top companies' }
                                ].map(plan => {
                                    const solvedCount = plan.slug ? (user?.plan_progress?.[plan.slug]?.length || 0) : 0;
                                    const totalCount = plan.slug ? (planCounts[plan.slug] || 0) : 0;
                                    const progressPercent = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;

                                    return (
                                        <div key={plan.name} className="relative group">
                                            <button
                                                onClick={() => toggleStudyPlan(plan.slug)}
                                                className={`w-full p-4 rounded-xl border text-left transition-all h-full ${user?.study_plan_slug === plan.slug
                                                    ? 'bg-orange-500/10 border-[#ffa116] ring-1 ring-[#ffa116]'
                                                    : 'bg-white/5 border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`text-sm font-bold ${user?.study_plan_slug === plan.slug ? 'text-[#ffa116]' : 'text-gray-300'}`}>
                                                        {plan.name}
                                                    </span>
                                                    {user?.study_plan_slug === plan.slug && <Check className="w-4 h-4 text-[#ffa116]" />}
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2">{plan.desc}</p>

                                                {plan.slug && totalCount > 0 && (
                                                    <div className="space-y-1 mt-auto">
                                                        <div className="flex justify-between text-[10px] text-gray-500">
                                                            <span>{solvedCount}/{totalCount} Solved</span>
                                                            <span>{Math.round(progressPercent)}%</span>
                                                        </div>
                                                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                                            <div
                                                                className="bg-[#ffa116] h-full rounded-full transition-all duration-1000"
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>

                                            {plan.slug && user?.study_plan_slug === plan.slug && solvedCount > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        resetPlan(plan.slug!);
                                                    }}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-[#0a0a0a] border border-white/10 rounded-full text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                                                    title="Reset Plan Progress"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className={`bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 transition-opacity ${user?.study_plan_slug ? 'opacity-40 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#ffa116]" />
                                    Your Study Topics
                                </h2>
                                {isSaving && <span className="text-xs text-[#ffa116] animate-pulse">Saving settings...</span>}
                            </div>
                            <p className="text-sm text-gray-400">Add topics you&apos;ve recently studied to your random rotation.</p>

                            <div className="flex flex-wrap gap-2">
                                {allTopics.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => toggleTopic(topic)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${user?.topics.includes(topic)
                                            ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-900/40'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                            }`}
                                    >
                                        {user?.topics.includes(topic) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className={`bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 transition-opacity ${user?.study_plan_slug ? 'opacity-40 pointer-events-none' : ''}`}>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-[#ffa116]" />
                                Challenge Level
                            </h2>
                            <p className="text-sm text-gray-400">Select the difficulty levels you want to be challenged with.</p>

                            <div className="flex gap-4">
                                {['Easy', 'Medium', 'Hard'].map(diff => (
                                    <button
                                        key={diff}
                                        onClick={() => toggleDifficulty(diff)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border flex flex-col items-center gap-2 ${user?.difficulties?.includes(diff)
                                            ? diff === 'Easy' ? 'bg-green-500/10 border-green-500/50 text-green-500' :
                                                diff === 'Medium' ? 'bg-orange-500/10 border-orange-500/50 text-[#ffa116]' :
                                                    'bg-red-500/10 border-red-500/50 text-red-500'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${user?.difficulties?.includes(diff)
                                            ? diff === 'Easy' ? 'bg-green-500' :
                                                diff === 'Medium' ? 'bg-[#ffa116]' :
                                                    'bg-red-500'
                                            : 'bg-gray-700'
                                            }`} />
                                        {diff}
                                    </button>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Sidebar: Stats */}
                    <div className="space-y-6">
                        <section className="bg-gradient-to-br from-orange-600/5 to-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                                <Zap className="w-5 h-5 text-[#ffa116]" />
                                LeetCode Stats
                            </h2>
                            {stats ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm text-gray-400">Solved</span>
                                        <span className="text-4xl font-bold">{stats.solvedProblems.total}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-green-500">Easy</span>
                                                <span className="text-gray-400">{stats.solvedProblems.easy}</span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(stats.solvedProblems.easy / stats.totalProblems.easy) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-[#ffa116]">Medium</span>
                                                <span className="text-gray-400">{stats.solvedProblems.medium}</span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                                <div className="bg-[#ffa116] h-1.5 rounded-full" style={{ width: `${(stats.solvedProblems.medium / stats.totalProblems.medium) * 100}%` }} />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-red-500">Hard</span>
                                                <span className="text-gray-400">{stats.solvedProblems.hard}</span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5">
                                                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(stats.solvedProblems.hard / stats.totalProblems.hard) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Global Rank</span>
                                            <p className="font-mono text-[#ffa116] font-bold">#{stats.rank.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No stats available</p>
                            )}
                        </section>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl transition-all border border-white/10"
                        >
                            Sign Out
                        </button>

                        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-200">Notification Alerts</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-200">Direct Topic View</p>
                                        <p className="text-xs text-gray-500">View your alerts on web.</p>
                                    </div>
                                    <a
                                        href={`https://ntfy.sh/${user?.secret_key}`}
                                        target="_blank"
                                        className="p-2 hover:bg-orange-500/20 text-[#ffa116] rounded-lg transition-colors border border-transparent hover:border-orange-500/30"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>

                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-gray-200">Daily Solve Goal</p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 5].map((goal) => (
                                                <button
                                                    key={goal}
                                                    onClick={async () => {
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
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${user?.daily_goal === goal || (!user?.daily_goal && goal === 1)
                                                        ? 'bg-orange-500/20 border-[#ffa116] text-[#ffa116]'
                                                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                                                        }`}
                                                >
                                                    {goal}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-tight">Nudge automatically follows up until your goal is met.</p>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <p className="text-sm font-medium text-gray-200">Nudge Interval</p>
                                        <select
                                            value={user?.nudge_interval || 180}
                                            onChange={async (e) => {
                                                const val = parseInt(e.target.value);
                                                if (!user) return;
                                                setUser({ ...user, nudge_interval: val });
                                                setIsSaving(true);
                                                await fetch(`/api/user/settings`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ secretKey, nudge_interval: val }),
                                                });
                                                setIsSaving(false);
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-[#ffa116] focus:outline-none focus:border-[#ffa116]/50"
                                        >
                                            <option value={30}>Every 30 minutes (Aggressive)</option>
                                            <option value={60}>Every 1 hour</option>
                                            <option value={120}>Every 2 hours</option>
                                            <option value={180}>Every 3 hours (Standard)</option>
                                            <option value={360}>Every 6 hours (Chill)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <p className="text-sm font-medium text-gray-200">Weekly Schedule</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => toggleDay(i)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${user?.schedule_days?.includes(i) || (!user?.schedule_days && true)
                                                        ? 'bg-orange-500/20 border-[#ffa116] text-[#ffa116]'
                                                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                                                        }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-tight">Select which days you&apos;ll receive study nudges.</p>
                                </div>

                                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-xs text-orange-200/80 leading-relaxed">
                                    <p><strong>Work Ethic:</strong> Fresh challenge at 8 AM, then reminders {user?.nudge_interval ? `every ${user.nudge_interval / 60}h` : 'every 3h'} until solved!</p>
                                    {user?.daily_goal && user.daily_goal > 1 && (
                                        <p className="mt-1 font-bold">Goal enabled: {user.daily_goal} questions daily.</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

            </div>
        </main>
    );
}
