'use client';

import React from 'react';
import { Users, Sparkles } from 'lucide-react';

export function GroupNudgingCard() {
    return (
        <section className="bg-gradient-to-br from-[#ffa116]/5 to-transparent border border-[#ffa116]/10 rounded-2xl p-4 flex items-center justify-between group hover:border-[#ffa116]/30 transition-all h-full">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[#ffa116]/10 rounded-xl">
                    <Users className="w-4 h-4 text-[#ffa116]" />
                </div>
                <div>
                    <h3 className="text-sm font-black tracking-tight text-[#ffa116]/90 leading-none mb-1">Group Nudging</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Coming Soon</p>
                </div>
            </div>

            <div className="p-2 rounded-full bg-white/5 border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-3 h-3 text-[#ffa116]" />
            </div>
        </section>
    );
}
