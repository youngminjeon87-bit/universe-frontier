'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Planet, Profile } from '@/types';

interface Props {
  planet:      Planet;
  profile:     Profile | null;
  onClose:     () => void;
  onPurchased: (updated: Profile) => void;
}

const TYPE_EMOJI: Record<string, string> = {
  'earth-like': '🌍',
  crystal:      '💎',
  mechanical:   '⚙️',
  ice:          '❄️',
  volcanic:     '🌋',
  ocean:        '🌊',
};

export default function PlanetDetailModal({ planet, profile, onClose, onPurchased }: Props) {
  const [buying,  setBuying]  = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const isOwned    = !!planet.owner_id;
  const isMyPlanet = planet.owner_id === profile?.id;
  const canAfford  = (profile?.cash ?? 0) >= planet.price;

  const handleBuy = async () => {
    if (!profile || isOwned || !canAfford) return;
    setBuying(true);
    setMessage(null);

    // 단일 PostgreSQL 함수로 원자적 처리 (레이스 컨디션 방지)
    const { error } = await supabase.rpc('purchase_planet', {
      p_planet_id: planet.id,
      p_buyer_id:  profile.id,
    });

    if (error) {
      setMessage({ text: error.message, ok: false });
      setBuying(false);
      return;
    }

    onPurchased({ ...profile, cash: profile.cash - planet.price });
    setMessage({ text: '🎉 행성 구매 완료! 이제 당신의 우주입니다.', ok: true });
    setBuying(false);
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div className="w-full max-w-sm bg-[#2C1E1A] border-4 border-[#EAD1A8] shadow-[8px_8px_0px_0px_rgba(0,0,0,0.6)] rounded-sm relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#EAD1A8] hover:text-red-400 text-xl leading-none"
        >
          ✕
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#EAD1A8]/30 text-center">
          <div className="text-5xl mb-3">{TYPE_EMOJI[planet.planet_type] ?? '🪐'}</div>
          <h2 className="font-pixel text-[10px] text-[#EAD1A8] leading-relaxed tracking-wide">
            {planet.planet_name}
          </h2>
          {planet.is_real && (
            <span className="text-[9px] text-[#69F0AE] uppercase tracking-wider">
              ✦ Real Astronomy Data
            </span>
          )}
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-3">
          <Row label="Type"  value={planet.planet_type} />
          <Row label="Coord" value={`X:${planet.coord_x}  Y:${planet.coord_y}  Z:${planet.coord_z}`} />
          <Row label="Price" value={`${planet.price.toLocaleString()} CASH`} color="text-[#FFD700]" />
          <Row
            label="Status"
            value={isMyPlanet ? '✦ YOURS' : isOwned ? 'Claimed' : 'Available'}
            color={isOwned ? 'text-red-400' : 'text-[#69F0AE]'}
          />
          {profile && (
            <Row
              label="Your Cash"
              value={`${profile.cash.toLocaleString()} CASH`}
              color={canAfford ? 'text-[#EAD1A8]' : 'text-red-400'}
            />
          )}

          {planet.description && (
            <p className="text-xs text-[#EAD1A8]/60 leading-relaxed border-t border-[#EAD1A8]/20 pt-3">
              {planet.description}
            </p>
          )}
        </div>

        {/* Action */}
        <div className="px-6 pb-6 space-y-3">
          {!isOwned && !isMyPlanet && (
            <button
              onClick={handleBuy}
              disabled={buying || !canAfford || !profile}
              className="w-full bg-[#EAD1A8] hover:bg-[#d6bc92] active:translate-y-0.5 text-[#2C1E1A] font-bold py-3 text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] border-b-4 border-r-4 border-[#bca17c] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {buying
                ? '⏳ Processing...'
                : !canAfford
                ? '💸 Not Enough Cash'
                : `🚀 Purchase — ${planet.price.toLocaleString()} CASH`}
            </button>
          )}

          {isMyPlanet && (
            <div className="text-center text-xs text-[#69F0AE] border border-[#69F0AE]/40 rounded py-2">
              ✦ This planet belongs to you
            </div>
          )}

          {isOwned && !isMyPlanet && (
            <div className="text-center text-xs text-red-400 border border-red-400/40 rounded py-2">
              ✗ Already claimed by another explorer
            </div>
          )}

          {message && (
            <div className={`text-xs text-center p-2 rounded border ${
              message.ok
                ? 'border-[#69F0AE]/60 text-[#69F0AE] bg-[#69F0AE]/5'
                : 'border-red-500/60 text-red-300 bg-red-500/5'
            }`}>
              {message.ok ? message.text : `⚠️ ${message.text}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color = 'text-[#EAD1A8]' }: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-[#EAD1A8]/50 shrink-0">{label}</span>
      <span className={`text-right ${color}`}>{value}</span>
    </div>
  );
}
