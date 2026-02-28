'use client';

import { Zap, ChevronDown } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface PaceSettingsCardProps {
    user: UserProfile | null;
    onUpdateGoal: (goal: number) => Promise<void>;
    onUpdateInterval: (interval: number) => Promise<void>;
    onToggleDay: (dayIndex: number) => Promise<void>;
}

export function PaceSettingsCard({
    user,
    onUpdateGoal,
    onUpdateInterval,
    onToggleDay
}: PaceSettingsCardProps) {
    return (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#ffa116]" />
                    2. Set Your Pace
                </h2>
                <p className="text-sm text-gray-400 font-medium">Control the intensity and frequency of your study reminders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Daily Goal */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-bold text-gray-200 uppercase tracking-wider">Daily Solved Goal</label>
                        <p className="text-xs text-gray-500">How many problems do you want to conquer daily?</p>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3, 5].map((goal) => (
                            <button
                                key={goal}
                                onClick={() => onUpdateGoal(goal)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${(user?.daily_goal === goal || (!user?.daily_goal && goal === 1))
                                    ? 'bg-[#ffa116]/20 border-[#ffa116] text-[#ffa116]'
                                    : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                                    }`}
                            >
                                {goal}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Nudge Interval */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-bold text-gray-200 uppercase tracking-wider">Reminder Frequency</label>
                        <p className="text-xs text-gray-500">How aggressive should the follow-ups be?</p>
                    </div>
                    <div className="relative">
                        <select
                            value={user?.nudge_interval || 180}
                            onChange={(e) => onUpdateInterval(parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pr-10 text-sm text-[#ffa116] focus:outline-none focus:border-[#ffa116]/50 transition-colors appearance-none cursor-pointer"
                        >
                            <option value={60}>Every 1 hour (Aggressive)</option>
                            <option value={120}>Every 2 hours</option>
                            <option value={180}>Every 3 hours (Standard)</option>
                            <option value={360}>Every 6 hours (Chill)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Weekly Schedule */}
            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-gray-200 uppercase tracking-wider">Weekly Commitment</label>
                    <p className="text-xs text-gray-500">Select the days you want to receive study nudges.</p>
                </div>
                <div className="flex justify-between gap-2">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => {
                        const isSelected = user?.schedule_days?.includes(i) || (!user?.schedule_days);
                        return (
                            <button
                                key={i}
                                onClick={() => onToggleDay(i)}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${isSelected
                                    ? 'bg-[#ffa116]/20 border-[#ffa116] text-[#ffa116]'
                                    : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                                    }`}
                                title={day}
                            >
                                {day.substring(0, 1)}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex items-start gap-3">
                <div className="p-1 bg-[#ffa116] rounded text-black mt-0.5">
                    <Zap className="w-3 h-3 fill-current" />
                </div>
                <p className="text-xs text-orange-200/90 leading-relaxed">
                    <strong>Current Logic:</strong> Your first challenge arrives at <span className="font-bold text-white">8 AM local time</span>.
                    If not solved, you&apos;ll get follow-ups {user?.nudge_interval ? `every ${user.nudge_interval / 60}h` : 'every 3h'} until your
                    daily goal of <span className="font-bold text-white">{user?.daily_goal || 1} {user?.daily_goal === 1 ? 'problem' : 'problems'}</span> is met.
                </p>
            </div>
        </section>
    );
}
