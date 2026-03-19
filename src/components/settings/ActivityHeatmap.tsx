'use client';

import React, { useMemo } from 'react';
import { Calendar, Flame } from 'lucide-react';

interface ActivityHeatmapProps {
    calendarData: {
        submissionCalendar: Record<string, number>;
        streak: number;
        totalActiveDays: number;
    } | null;
    timezone?: string;
}

export function ActivityHeatmap({ calendarData, timezone = 'America/New_York' }: ActivityHeatmapProps) {
    const monthlyGroups = useMemo(() => {
        if (!calendarData) return [];

        const now = new Date();
        const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));

        const groups = [];
        const submissionMap = calendarData.submissionCalendar || {};

        // Generate data for current month and 2 previous months
        for (let i = 2; i >= 0; i--) {
            const firstOfMonth = new Date(localNow.getFullYear(), localNow.getMonth() - i, 1);
            const lastOfMonth = new Date(localNow.getFullYear(), localNow.getMonth() - i + 1, 0);

            // Limit the last month to today
            const limitDate = i === 0 ? localNow : lastOfMonth;

            const monthDays = [];
            const curr = new Date(firstOfMonth);

            while (curr <= limitDate) {
                const utcDate = new Date(Date.UTC(curr.getFullYear(), curr.getMonth(), curr.getDate()));
                const timestamp = Math.floor(utcDate.getTime() / 1000).toString();
                const count = submissionMap[timestamp] || 0;

                monthDays.push({
                    count,
                    label: curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                });
                curr.setDate(curr.getDate() + 1);
            }

            groups.push({
                name: firstOfMonth.toLocaleString('en-US', { month: 'short' }),
                days: monthDays
            });
        }

        return groups;
    }, [calendarData, timezone]);

    const getIntensity = (count: number) => {
        if (count === 0) return 'bg-white/5';
        if (count <= 2) return 'bg-orange-500/30';
        if (count <= 5) return 'bg-orange-500/50';
        if (count <= 8) return 'bg-orange-500/80';
        return 'bg-orange-500';
    };

    if (!calendarData) {
        return (
            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[140px] text-gray-500">
                <div className="animate-pulse flex flex-col items-center gap-2">
                    <Calendar className="w-8 h-8 opacity-20" />
                    <span className="text-xs font-bold uppercase tracking-widest text-center">Syncing LeetCode Activity...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-between h-full w-full">
            <div className="w-full space-y-4">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Activity Map</span>
                    </div>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        Live from LeetCode
                    </span>
                </div>

                <div className="flex items-end gap-5 overflow-x-auto pb-1 scrollbar-none justify-center">
                    {monthlyGroups.map((month, mIdx) => {
                        // Group month days into weeks (columns of 7)
                        const weekCols = [];
                        for (let i = 0; i < month.days.length; i += 7) {
                            weekCols.push(month.days.slice(i, i + 7));
                        }

                        return (
                            <div key={mIdx} className="flex flex-col gap-2">
                                <div className="flex gap-1">
                                    {weekCols.map((week, wIdx) => (
                                        <div key={wIdx} className="flex flex-col gap-1">
                                            {week.map((day, dIdx) => (
                                                <div
                                                    key={dIdx}
                                                    className={`w-3 h-3 rounded-[2.5px] transition-all hover:scale-125 hover:shadow-[0_0_8px_rgba(255,161,22,0.4)] cursor-help ${getIntensity(day.count)}`}
                                                    title={`${day.count} submissions on ${day.label}`}
                                                />
                                            ))}
                                            {/* Fill in empty slots for consistent column height if month doesn't end on full week */}
                                            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
                                                <div key={`empty-${i}`} className="w-3 h-3 rounded-[2.5px] bg-white/[0.02]" />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-[10px] font-black text-gray-500 text-center uppercase tracking-widest">{month.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between w-full pt-4 border-t border-white/5 mt-auto">
                <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <Flame className="w-3 h-3 text-[#ffa116] fill-current" />
                        <span>Streak</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white leading-none tracking-tighter">{calendarData.streak}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Days</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Intensity</span>
                    <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/30" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-[#ffa116]/80 leading-none tracking-tighter">{calendarData.totalActiveDays}</span>
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Days</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
