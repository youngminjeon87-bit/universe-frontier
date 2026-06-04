'use client';

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { supabase } from '@/lib/supabase';
import type { Planet } from '@/types';

interface MapViewerProps {
  onSelectPlanet: (planet: Planet) => void;
}

const PLANET_COLORS: Record<string, number> = {
  'earth-like': 0x3b82f6,
  'crystal':    0xd946ef,
  'mechanical': 0x6b7280,
  'ice':        0x38bdf8,
  'volcanic':   0xef4444,
  'ocean':      0x0ea5e9,
};

export default function MapViewer({ onSelectPlanet }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef  = useRef(onSelectPlanet);
  const [planets, setPlanets]   = useState<Planet[]>([]);
  const [loading, setLoading]   = useState(true);

  // keep callback ref fresh without re-triggering the pixi effect
  useEffect(() => { onSelectRef.current = onSelectPlanet; }, [onSelectPlanet]);

  useEffect(() => {
    async function fetchPlanets() {
      const { data, error } = await supabase.from('planets').select('*');
      if (!error && data) setPlanets(data);
      setLoading(false);
    }
    fetchPlanets();
  }, []);

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const app  = new PIXI.Application();
    const div  = containerRef.current;
    const w    = div.clientWidth;
    const h    = div.clientHeight;

    let destroyed = false;

    const initPixi = async () => {
      await app.init({
        width:           w,
        height:          h,
        backgroundColor: 0x070714,
        antialias:       false,
        resolution:      window.devicePixelRatio || 1,
        autoDensity:     true,
      });

      if (destroyed) { app.destroy(true); return; }
      div.appendChild(app.canvas);

      const world = new PIXI.Container();
      app.stage.addChild(world);
      world.x = w / 2;
      world.y = h / 2;

      // ── Starfield ──────────────────────────────────────────────
      for (let i = 0; i < 200; i++) {
        const g = new PIXI.Graphics();
        g.circle(0, 0, Math.random() > 0.7 ? 2 : 1);
        g.fill({ color: Math.random() > 0.8 ? 0x4fc3f7 : 0xffffff });
        g.x = (Math.random() - 0.5) * 5000;
        g.y = (Math.random() - 0.5) * 5000;
        world.addChild(g);
      }

      // ── Planets ────────────────────────────────────────────────
      planets.forEach((planet) => {
        const pc = new PIXI.Container();
        pc.x = planet.coord_x * 8;
        pc.y = planet.coord_y * 8;

        const color  = PLANET_COLORS[planet.planet_type] ?? 0x3b82f6;
        const radius = planet.is_real ? 14 : 10;

        const g = new PIXI.Graphics();
        g.circle(0, 0, radius);
        g.fill({ color });
        g.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
        g.eventMode = 'static';
        g.cursor    = 'pointer';

        g.on('pointerover', () => { g.alpha = 0.8; g.scale.set(1.15); });
        g.on('pointerout',  () => { g.alpha = 1.0; g.scale.set(1.0);  });
        g.on('pointertap',  () => onSelectRef.current(planet));

        // owned indicator ring
        if (planet.owner_id) {
          const ring = new PIXI.Graphics();
          ring.circle(0, 0, radius + 4);
          ring.stroke({ width: 1.5, color: 0xffd700, alpha: 0.8 });
          pc.addChild(ring);
        }

        pc.addChild(g);

        // label — PixiJS v8 TextStyle uses stroke object (not strokeThickness)
        const label = new PIXI.Text({
          text:  planet.planet_name,
          style: new PIXI.TextStyle({
            fontFamily: 'monospace',
            fontSize:   10,
            fill:       '#ead1a8',
            stroke:     { color: '#180e0c', width: 3 },
          }),
        });
        label.anchor.set(0.5, 0);
        label.y = radius + 4;
        pc.addChild(label);

        world.addChild(pc);
      });

      // ── Pan & Zoom ─────────────────────────────────────────────
      let dragging   = false;
      let dragStart  = { x: 0, y: 0 };
      let worldStart = { x: 0, y: 0 };

      const onMouseDown = (e: MouseEvent) => {
        dragging   = true;
        dragStart  = { x: e.clientX, y: e.clientY };
        worldStart = { x: world.x, y: world.y };
      };
      const onMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        world.x = worldStart.x + (e.clientX - dragStart.x);
        world.y = worldStart.y + (e.clientY - dragStart.y);
      };
      const onMouseUp = () => { dragging = false; };
      const onWheel   = (e: WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const next   = Math.min(Math.max(world.scale.x * factor, 0.2), 4);
        world.scale.set(next);
      };

      app.canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove',     onMouseMove);
      window.addEventListener('mouseup',       onMouseUp);
      app.canvas.addEventListener('wheel',     onWheel, { passive: false });

      // store cleanup refs on the app object
      (app as PIXI.Application & { _cleanup?: () => void })._cleanup = () => {
        app.canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove',     onMouseMove);
        window.removeEventListener('mouseup',       onMouseUp);
        app.canvas.removeEventListener('wheel',     onWheel);
      };
    };

    initPixi();

    return () => {
      destroyed = true;
      const typed = app as PIXI.Application & { _cleanup?: () => void };
      typed._cleanup?.();
      app.destroy(true, { children: true, texture: true });
    };
  }, [loading, planets]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#070714] text-[#EAD1A8] font-pixel text-xs">
        Warping into space grid...
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
