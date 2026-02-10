'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Code, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsLoading(true);
    setError(null);

    try {
      const statsRes = await fetch(`/api/leetcode/stats?username=${username}`);
      if (!statsRes.ok) {
        setError('Could not find that LeetCode user. Please check the spelling.');
        setIsLoading(false);
        return;
      }
      const stats = await statsRes.json();

      // 3. Call API to setup user
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup user');
      }

      // Redirect to unique settings page
      router.push(`/settings/${data.secretKey}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-900/10 blur-[120px] rounded-full" />

      {/* Header/Logo */}
      <div className="z-10 flex items-center gap-3 mb-10">
        <div className="bg-gradient-to-br from-[#ffa116] to-[#ff7b16] p-2 rounded-xl shadow-lg shadow-orange-500/20">
          <Bell className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">LeetNtfy</h1>
      </div>

      {/* Hero Content */}
      <div className="z-10 max-w-2xl text-center space-y-8">
        <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 leading-tight">
          Never miss a <span className="text-[#ffa116]">beat</span> on your coding journey.
        </h2>
        <p className="text-gray-400 text-lg sm:text-xl max-w-lg mx-auto leading-relaxed">
          Get personalized LeetCode nudges delivered straight to your phone. No complex logins, just your username and the topics you want to master.
        </p>

        {/* Action Form */}
        <div className="max-w-md mx-auto w-full px-2">
          <form onSubmit={handleStart} className="mt-8 flex flex-col sm:flex-row items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-2xl border border-white/10 shadow-2xl focus-within:border-[#ffa116]/50 transition-all">
            <div className="relative flex-1 w-full">
              <Code className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="LeetCode Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-white placeholder-gray-600 rounded-xl text-base"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto whitespace-nowrap px-6 py-3 bg-[#ffa116] hover:bg-[#ffb84d] text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Wait...' : (
                <>
                  Let&apos;s Go
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          {error && (
            <p className="text-red-400 text-sm mt-4 animate-shake">{error}</p>
          )}
        </div>

        {/* Features Cloud */}
        <div className="pt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 opacity-40">
          <div className="flex flex-col items-center gap-2 group">
            <Zap className="w-6 h-6 text-[#ffa116]" />
            <span className="text-xs font-bold uppercase tracking-widest">NUDGE SYSTEM</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#ffa116]" />
            <span className="text-xs font-bold uppercase tracking-widest">NO LOGIN</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Code className="w-6 h-6 text-[#ffa116]" />
            <span className="text-xs font-bold uppercase tracking-widest">REAL DATA</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="z-10 mt-auto py-10 flex flex-col items-center gap-4 text-center">
        <p className="text-gray-600 text-[10px] uppercase font-bold tracking-[0.2em] max-w-xs leading-loose">
          Powered by <span className="text-gray-400 font-medium tracking-normal">ntfy.sh</span>
        </p>
        <p className="text-gray-700 text-[10px] uppercase font-bold tracking-[0.2em] max-w-xs leading-loose">
          Not affiliated with LeetCode. Built for the community.
        </p>
      </footer>
    </main>
  );
}
