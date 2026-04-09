'use client';

import { Zap, Check, RotateCcw } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface StudyPathCardProps {
    user: UserProfile | null;
    planCounts: Record<string, number>;
    onTogglePlan: (slug: string | null) => Promise<void>;
    onResetPlan: (slug: string) => Promise<void>;
}

export function StudyPathCard({
    user,
    planCounts,
    onTogglePlan,
    onResetPlan
}: StudyPathCardProps) {
    const plans = [
        { name: 'Random Mix', slug: null, desc: 'Randomly selected topics' },
        { name: 'LeetCode 75', slug: 'leetcode-75', desc: 'The essential starter set' },
        { name: 'Interview 150', slug: 'top-interview-150', desc: 'Top company interview set' }
    ];

    return (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#ffa116]" />
                    1. Choose Your Path
                </h2>
                <p className="text-sm text-gray-400 font-medium"> Curated sequential paths or a randomized mix based on your interests.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map(plan => {
                    const planItems = plan.slug ? (user?.plan_progress?.[plan.slug] || []) : [];
                    const uniqueSlugs = new Set(planItems.map((item: any) => typeof item === 'string' ? item : item.slug));
                    const totalCount = plan.slug ? (planCounts[plan.slug] || 0) : 0;
                    
                    // Cap at totalCount to prevent over-100% progress when bonus problems are assigned
                    const solvedCount = totalCount > 0 ? Math.min(uniqueSlugs.size, totalCount) : uniqueSlugs.size;
                    const progressPercent = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;

                    return (
                        <div key={plan.name} className="relative group">
                            <button
                                onClick={() => onTogglePlan(plan.slug)}
                                className={`w-full p-5 rounded-2xl border text-left transition-all h-full flex flex-col ${user?.study_plan_slug === plan.slug
                                        ? 'bg-[#ffa116]/10 border-[#ffa116] ring-1 ring-[#ffa116]'
                                        : 'bg-white/5 border-white/10 hover:border-white/30'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`font-bold ${user?.study_plan_slug === plan.slug ? 'text-[#ffa116]' : 'text-gray-200'}`}>
                                        {plan.name}
                                    </span>
                                    {user?.study_plan_slug === plan.slug && (
                                        <div className="bg-[#ffa116] rounded-full p-0.5">
                                            <Check className="w-3 h-3 text-black stroke-[3]" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mb-6 leading-relaxed flex-grow">{plan.desc}</p>

                                {plan.slug && totalCount > 0 && (
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                            <span className="text-gray-500">{solvedCount}/{totalCount} items</span>
                                            <span className="text-[#ffa116]">{Math.round(progressPercent)}%</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-[#ffa116] to-orange-400 h-full rounded-full transition-all duration-1000"
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
                                        onResetPlan(plan.slug!);
                                    }}
                                    className="absolute -top-2 -right-2 p-2 bg-[#0a0a0a] border border-white/10 rounded-full text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
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
    );
}
