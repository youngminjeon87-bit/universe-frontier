'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              username: username || `Explorer_${Math.floor(1000 + Math.random() * 9000)}`,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg('가입 완료! 이메일을 확인하거나 로그인하세요.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '인증 중 오류가 발생했습니다.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A16] px-4 relative overflow-hidden font-mono">
      {/* Starfield background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1E112A] via-[#0A0A16] to-[#030308] z-0" />
      <Stars />

      {/* Login card */}
      <div className="w-full max-w-md bg-[#2C1E1A] border-4 border-[#EAD1A8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] p-8 relative z-10 rounded-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#EAD1A8] tracking-widest uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] font-pixel">
            🌌 Universe Frontier
          </h1>
          <p className="text-xs text-[#4FC3F7] mt-2 uppercase tracking-wider">
            {isSignUp ? 'Establish a new colony' : 'Return to your sectors'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950 border-2 border-red-500 text-red-200 text-xs rounded">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-teal-950 border-2 border-teal-500 text-teal-200 text-xs rounded">
            ✨ {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs uppercase text-[#EAD1A8] mb-1 font-semibold">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter explorer name"
                className="w-full bg-[#180E0C] border-2 border-[#EAD1A8] px-3 py-2 text-sm text-[#EAD1A8] focus:outline-none focus:ring-1 focus:ring-[#4FC3F7]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs uppercase text-[#EAD1A8] mb-1 font-semibold">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="explorer@orbit.com"
              className="w-full bg-[#180E0C] border-2 border-[#EAD1A8] px-3 py-2 text-sm text-[#EAD1A8] focus:outline-none focus:ring-1 focus:ring-[#4FC3F7]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase text-[#EAD1A8] mb-1 font-semibold">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#180E0C] border-2 border-[#EAD1A8] px-3 py-2 text-sm text-[#EAD1A8] focus:outline-none focus:ring-1 focus:ring-[#4FC3F7]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#EAD1A8] hover:bg-[#d6bc92] active:translate-y-1 text-[#2C1E1A] font-bold py-2.5 px-4 text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] border-b-4 border-r-4 border-[#bca17c] transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Begin Expedition' : 'Initialize Warp'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-xs text-[#4FC3F7] hover:underline uppercase tracking-wide cursor-pointer"
          >
            {isSignUp ? 'Already registered? Log In' : 'New Explorer? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stars() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() > 0.85 ? 2 : 1,
    opacity: 0.3 + Math.random() * 0.7,
  }));

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
