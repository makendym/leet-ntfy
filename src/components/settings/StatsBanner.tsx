'use client';

import { Zap } from 'lucide-react';
import { LeetCodeStats } from '@/lib/types';

interface StatsBannerProps {
    stats: LeetCodeStats | null;
}

export function StatsBanner({ stats }: StatsBannerProps) {
    if (!stats) return null;

    return (
        <section className="bg-gradient-to-br from-orange-600/5 to-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-full">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                        <Zap className="w-4 h-4 text-[#ffa116]" />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Solved</span>
                    </div>
                    <span className="text-4xl font-bold">{stats.solvedProblems.total}</span>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-green-500 font-bold uppercase tracking-wider">Easy</span>
                        <span className="text-gray-400">{stats.solvedProblems.easy} / {stats.totalProblems.easy}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(stats.solvedProblems.easy / stats.totalProblems.easy) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-[#ffa116] font-bold uppercase tracking-wider">Medium</span>
                        <span className="text-gray-400">{stats.solvedProblems.medium} / {stats.totalProblems.medium}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                            className="bg-[#ffa116] h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(stats.solvedProblems.medium / stats.totalProblems.medium) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-red-500 font-bold uppercase tracking-wider">Hard</span>
                        <span className="text-gray-400">{stats.solvedProblems.hard} / {stats.totalProblems.hard}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                        <div
                            className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(stats.solvedProblems.hard / stats.totalProblems.hard) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Global Rank</span>
                    <span className="font-mono text-[#ffa116] font-bold">#{stats.rank.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-widest opacity-60">
                    Live from LeetCode
                </div>
            </div>
        </section>
    );
}
