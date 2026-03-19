'use client';

import React from 'react';
import { Users, Sparkles, ArrowRight } from 'lucide-react';

export function GroupNudgingCard() {
    return (
        <section className="bg-gradient-to-br from-[#ffa116]/10 to-transparent border border-[#ffa116]/20 rounded-2xl p-6 relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#ffa116]/10 rounded-full blur-3xl transition-all group-hover:bg-[#ffa116]/20" />

            <div className="flex items-center gap-3 text-[#ffa116] mb-4">
                <div className="p-2 bg-[#ffa116]/10 rounded-lg">
                    <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">Group Nudging</h2>
            </div>

            <div className="space-y-4 relative z-10">
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    Study is better with friends. Join forces, track collective goals, and get nudged together.
                </p>

                <div className="flex items-center gap-2 py-1 px-3 bg-white/5 rounded-full border border-white/5 w-fit">
                    <Sparkles className="w-3 h-3 text-[#ffa116]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffa116]/80">Coming Soon</span>
                </div>

                <div className="pt-2">
                    <button
                        disabled
                        className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-gray-500 flex items-center justify-between group-hover:border-[#ffa116]/30 transition-all cursor-not-allowed"
                    >
                        <span>Request Early Access</span>
                        <ArrowRight className="w-4 h-4 opacity-30" />
                    </button>
                </div>
            </div>

            {/* Micro-interaction border shine */}
            <div className="absolute inset-0 border border-white/0 group-hover:border-white/5 rounded-2xl pointer-events-none transition-all" />
        </section>
    );
}
