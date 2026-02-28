'use client';

import { Zap, ExternalLink, Check, RefreshCcw } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ActiveChallengeProps {
    user: UserProfile | null;
    onMarkAsSolved: (slug: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    isSaving: boolean;
    nudgeStatus: 'idle' | 'loading' | 'success' | 'error';
}

export function ActiveChallenge({
    user,
    onMarkAsSolved,
    onRefresh,
    isSaving,
    nudgeStatus
}: ActiveChallengeProps) {
    if (!user?.current_question_slug) return null;

    return (
        <section className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-[#ffa116]/30 rounded-2xl p-6 shadow-xl shadow-orange-500/10 mb-8 mt-2">
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
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-[#ffa116] transition-colors"
                        >
                            View on LeetCode <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => onMarkAsSolved(user.current_question_slug!)}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none px-6 py-3 bg-[#ffa116] text-black font-bold rounded-xl hover:bg-[#ffb342] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <RefreshCcw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Check className="w-5 h-5 stroke-[3]" />
                        )}
                        Mark as Solved
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={nudgeStatus !== 'idle'}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                        title="Try Another"
                    >
                        <RefreshCcw className={`w-5 h-5 text-gray-400 group-hover:text-white transition-colors ${nudgeStatus === 'loading' ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </section>
    );
}
