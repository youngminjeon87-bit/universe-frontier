'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import PlanetDetailModal from '@/components/PlanetDetailModal';
import type { Profile, Planet } from '@/types';

const MapViewer = dynamic(() => import('@/components/MapViewer'), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile]         = useState<Profile | null>(null);
  const [selectedPlanet, setSelected] = useState<Planet | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070714] text-[#EAD1A8] font-pixel text-xs">
        Loading Universe...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#070714] text-[#EAD1A8] overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#2C1E1A] border-b-2 border-[#EAD1A8] shrink-0 z-10">
        <h1 className="font-pixel text-xs text-[#EAD1A8] tracking-widest">
          🌌 UNIVERSE FRONTIER
        </h1>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#4FC3F7]">👤 {profile?.username ?? '—'}</span>
          <span className="text-[#FFD700] font-bold">
            💰 {profile?.cash?.toLocaleString() ?? 0} CASH
          </span>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="text-[#EAD1A8] hover:text-red-400 transition-colors uppercase"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Map (full screen) ── */}
      <main className="flex-1 relative overflow-hidden">
        <MapViewer onSelectPlanet={setSelected} />
      </main>

      {/* ── Planet Modal (overlay) ── */}
      {selectedPlanet && (
        <PlanetDetailModal
          planet={selectedPlanet}
          profile={profile}
          onClose={() => setSelected(null)}
          onPurchased={(updated) => {
            setProfile(updated);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
