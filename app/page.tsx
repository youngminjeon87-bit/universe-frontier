'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import type { Profile, Planet } from '@/types';

// PixiJS는 SSR 불가 → dynamic import
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
          <span className="text-[#4FC3F7]">
            👤 {profile?.username ?? '—'}
          </span>
          <span className="text-[#FFD700] font-bold">
            💰 {profile?.cash?.toLocaleString() ?? 0} CASH
          </span>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="text-[#EAD1A8] hover:text-red-400 transition-colors text-xs uppercase"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapViewer onSelectPlanet={setSelected} />
        </div>

        {/* Planet Detail Panel */}
        {selectedPlanet && (
          <PlanetPanel
            planet={selectedPlanet}
            profile={profile}
            onClose={() => setSelected(null)}
            onPurchased={(updatedProfile) => setProfile(updatedProfile)}
          />
        )}
      </main>
    </div>
  );
}

// ── Planet Detail Panel ──────────────────────────────────────────────────────

interface PlanetPanelProps {
  planet:      Planet;
  profile:     Profile | null;
  onClose:     () => void;
  onPurchased: (updated: Profile) => void;
}

function PlanetPanel({ planet, profile, onClose, onPurchased }: PlanetPanelProps) {
  const [buying,  setBuying]  = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isOwned    = !!planet.owner_id;
  const isMyPlanet = planet.owner_id === profile?.id;
  const canAfford  = (profile?.cash ?? 0) >= planet.price;

  const handleBuy = async () => {
    if (!profile || isOwned || !canAfford) return;
    setBuying(true);
    setMessage(null);

    const { error: cashError } = await supabase
      .from('profiles')
      .update({ cash: profile.cash - planet.price })
      .eq('id', profile.id);

    if (cashError) {
      setMessage('결제 오류: ' + cashError.message);
      setBuying(false);
      return;
    }

    const { error: planetError } = await supabase
      .from('planets')
      .update({ owner_id: profile.id, purchased_at: new Date().toISOString() })
      .eq('id', planet.id)
      .is('owner_id', null); // 동시 구매 방지

    if (planetError) {
      await supabase.from('profiles').update({ cash: profile.cash }).eq('id', profile.id);
      setMessage('구매 실패: 이미 누군가 구매했습니다.');
      setBuying(false);
      return;
    }

    onPurchased({ ...profile, cash: profile.cash - planet.price });
    setMessage('🎉 행성 구매 완료!');
    setBuying(false);
  };

  const TYPE_EMOJI: Record<string, string> = {
    'earth-like': '🌍', crystal: '💎', mechanical: '⚙️',
    ice: '❄️', volcanic: '🌋', ocean: '🌊',
  };

  return (
    <aside className="w-72 shrink-0 bg-[#2C1E1A] border-l-2 border-[#EAD1A8] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#EAD1A8]/40">
        <span className="font-pixel text-[10px] text-[#EAD1A8]">PLANET INFO</span>
        <button onClick={onClose} className="text-[#EAD1A8] hover:text-red-400 text-lg leading-none">
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4 text-sm">
        <div className="text-center">
          <div className="text-4xl mb-2">{TYPE_EMOJI[planet.planet_type] ?? '🪐'}</div>
          <h2 className="font-pixel text-[10px] text-[#EAD1A8] leading-relaxed">
            {planet.planet_name}
          </h2>
          {planet.is_real && (
            <span className="text-[10px] text-[#69F0AE]">✦ Real Astronomy Data</span>
          )}
        </div>

        <div className="space-y-2 text-xs">
          <Row label="Type"  value={planet.planet_type} />
          <Row label="Coord" value={`X:${planet.coord_x} Y:${planet.coord_y} Z:${planet.coord_z}`} />
          <Row label="Price" value={`${planet.price.toLocaleString()} CASH`} highlight />
          <Row
            label="Owner"
            value={isMyPlanet ? '✦ YOU' : isOwned ? 'Owned' : 'Available'}
            highlight={!isOwned}
          />
        </div>

        {planet.description && (
          <p className="text-xs text-[#EAD1A8]/70 leading-relaxed border-t border-[#EAD1A8]/20 pt-3">
            {planet.description}
          </p>
        )}

        {!isOwned && (
          <button
            onClick={handleBuy}
            disabled={buying || !canAfford}
            className="w-full bg-[#EAD1A8] hover:bg-[#d6bc92] active:translate-y-0.5 text-[#2C1E1A] font-bold py-2 text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] border-b-4 border-r-4 border-[#bca17c] transition-all disabled:opacity-40"
          >
            {buying ? 'Processing...' : !canAfford ? 'Not Enough Cash' : `Buy — ${planet.price} CASH`}
          </button>
        )}

        {isMyPlanet && (
          <div className="text-center text-xs text-[#69F0AE] border border-[#69F0AE]/40 rounded p-2">
            ✦ This is your planet
          </div>
        )}

        {message && (
          <div className={`text-xs text-center p-2 rounded border ${
            message.startsWith('🎉')
              ? 'border-[#69F0AE] text-[#69F0AE]'
              : 'border-red-500 text-red-300'
          }`}>
            {message}
          </div>
        )}
      </div>
    </aside>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[#EAD1A8]/50 shrink-0">{label}</span>
      <span className={`text-right ${highlight ? 'text-[#FFD700]' : 'text-[#EAD1A8]'}`}>{value}</span>
    </div>
  );
}
