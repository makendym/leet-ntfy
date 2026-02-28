'use client';

import { useState } from 'react';
import { Smartphone, Monitor, Check, Copy, ExternalLink, Zap } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ConnectionGuideProps {
    user: UserProfile | null;
}

export function ConnectionGuide({ user }: ConnectionGuideProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (!user) return;
        navigator.clipboard.writeText(user.secret_key);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 text-orange-400">
                <Smartphone className="w-6 h-6" />
                <h2 className="text-lg font-bold">Sync Mobile</h2>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                    Download the <span className="text-white font-medium italic underline decoration-[#ffa116]">ntfy app</span> and subscribe to your unique topic:
                </p>

                <button
                    onClick={handleCopy}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between group hover:border-[#ffa116]/50 transition-all active:scale-[0.98]"
                >
                    <code className="text-[#ffa116] text-xs font-mono truncate mr-2 font-bold">{user?.secret_key}</code>
                    {isCopied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4 text-gray-500 group-hover:text-[#ffa116] transition-colors" />
                    )}
                </button>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <a
                        href="https://apps.apple.com/us/app/ntfy/id1625396347"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 hover:border-[#ffa116]/30 transition-all"
                    >
                        <ExternalLink className="w-3 h-3 text-[#ffa116]" /> iOS
                    </a>
                    <a
                        href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 hover:border-[#ffa116]/30 transition-all"
                    >
                        <ExternalLink className="w-3 h-3 text-[#ffa116]" /> Android
                    </a>
                </div>
            </div>

            <div className="pt-4 border-t border-white/5">
                <a
                    href={`https://ntfy.sh/${user?.secret_key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-3 bg-[#ffa116]/5 rounded-xl group hover:bg-[#ffa116]/10 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-[#ffa116]" />
                        <span className="text-xs font-bold text-gray-300">Open Web View</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
            </div>
        </section>
    );
}
