'use client';

import { BookOpen, Zap, Check, Plus } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ContentFilterCardProps {
    user: UserProfile | null;
    allTopics: string[];
    onToggleTopic: (topic: string) => Promise<void>;
    onToggleDifficulty: (difficulty: string) => Promise<void>;
    isSaving: boolean;
}

export function ContentFilterCard({
    user,
    allTopics,
    onToggleTopic,
    onToggleDifficulty,
    isSaving
}: ContentFilterCardProps) {
    if (user?.study_plan_slug) return null;

    return (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#ffa116]" />
                    3. Fine-Tune Content
                </h2>
                <p className="text-sm text-gray-400 font-medium">Customize which problems appear in your random mix.</p>
            </div>

            <div className="space-y-6">
                {/* Difficulty Levels */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Challenge Level</label>
                    </div>
                    <div className="flex gap-4">
                        {['Easy', 'Medium', 'Hard'].map(diff => (
                            <button
                                key={diff}
                                onClick={() => onToggleDifficulty(diff)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border flex flex-col items-center gap-3 ${user?.difficulties?.includes(diff)
                                        ? diff === 'Easy' ? 'bg-green-500/10 border-green-500/50 text-green-500' :
                                            diff === 'Medium' ? 'bg-[#ffa116]/10 border-[#ffa116]/50 text-[#ffa116]' :
                                                'bg-red-500/10 border-red-500/50 text-red-500'
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${user?.difficulties?.includes(diff)
                                        ? diff === 'Easy' ? 'bg-green-500 animate-pulse' :
                                            diff === 'Medium' ? 'bg-[#ffa116] animate-pulse' :
                                                'bg-red-500 animate-pulse'
                                        : 'bg-gray-700'
                                    }`} />
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Topics selection */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Study Topics</label>
                        {isSaving && <span className="text-[10px] text-[#ffa116] animate-pulse font-bold uppercase tracking-widest">Syncing...</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {allTopics.map(topic => {
                            const isSelected = user?.topics.includes(topic);
                            return (
                                <button
                                    key={topic}
                                    onClick={() => onToggleTopic(topic)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${isSelected
                                            ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-900/20'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                        }`}
                                >
                                    {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    {topic}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
