'use client';

import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  shockRadius?: number;
  shockStrength?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
}

interface DotState {
  el: HTMLDivElement;
  cx: number;    // center X in container
  cy: number;    // center Y in container
  // Spring physics state
  dx: number;   // current offset X
  dy: number;   // current offset Y
  vx: number;   // velocity X
  vy: number;   // velocity Y
}

// Spring constants — tuned for smooth, snappy feel
const STIFFNESS  = 0.14;  // how hard it pulls back
const DAMPING    = 0.72;  // how quickly it settles (higher = less oscillation)
const MAX_PUSH   = 18;    // max pixel displacement toward cursor

export default function DotGrid({
  dotSize = 5,
  gap = 15,
  baseColor = '#271E37',
  activeColor = '#5227FF',
  proximity = 120,
  shockRadius = 250,
  shockStrength = 5,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
}: DotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef      = useRef<DotState[]>([]);
  const rafRef       = useRef<number>(0);
  const mouseRef     = useRef({ x: -99999, y: -99999 });

  // Hex → [r, g, b] helper (handles #rgb and #rrggbb)
  const parseHex = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ];
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };

  const baseRgb   = parseHex(baseColor);
  const activeRgb = parseHex(activeColor);

  /* ── Build grid ───────────────────────────────────────── */
  const buildGrid = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    dotsRef.current = [];

    const W    = container.offsetWidth;
    const H    = container.offsetHeight;
    const step = dotSize + gap;
    const cols = Math.floor(W / step);
    const rows = Math.floor(H / step);
    const offX = (W - cols * step + gap) / 2;
    const offY = (H - rows * step + gap) / 2;

    const frag = document.createDocumentFragment();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const left = offX + c * step;
        const top  = offY + r * step;

        const dot = document.createElement('div');
        dot.style.cssText = `
          position:absolute;
          width:${dotSize}px;
          height:${dotSize}px;
          border-radius:50%;
          background:${baseColor};
          left:${left}px;
          top:${top}px;
          will-change:transform,background-color;
          pointer-events:none;
        `;
        frag.appendChild(dot);

        dotsRef.current.push({
          el: dot as HTMLDivElement,
          cx: left + dotSize / 2,
          cy: top  + dotSize / 2,
          dx: 0, dy: 0, vx: 0, vy: 0,
        });
      }
    }
    container.appendChild(frag);
  }, [dotSize, gap, baseColor]);

  /* ── Single RAF physics + color loop ─────────────────── */
  const loop = useCallback(() => {
    const mx  = mouseRef.current.x;
    const my  = mouseRef.current.y;
    const prx = proximity;
    const prxSq = prx * prx;

    const [br, bg, bb] = baseRgb;
    const [ar, ag, ab] = activeRgb;

    for (const dot of dotsRef.current) {
      // ── Distance to cursor ──────────────────────────────
      const ex = dot.cx - mx;
      const ey = dot.cy - my;
      const distSq = ex * ex + ey * ey;

      let targetDx = 0;
      let targetDy = 0;
      let colorT   = 0;

      if (distSq < prxSq) {
        const dist = Math.sqrt(distSq);
        colorT      = 1 - dist / prx;                  // 0→1 as cursor approaches
        const force = colorT * colorT * MAX_PUSH;       // quadratic falloff
        const nx    = dist > 0 ? ex / dist : 0;
        const ny    = dist > 0 ? ey / dist : 0;
        targetDx    = nx * force;                       // push away from cursor
        targetDy    = ny * force;
      }

      // ── Spring toward target ────────────────────────────
      const fx  = (targetDx - dot.dx) * STIFFNESS;
      const fy  = (targetDy - dot.dy) * STIFFNESS;
      dot.vx    = (dot.vx + fx) * DAMPING;
      dot.vy    = (dot.vy + fy) * DAMPING;
      dot.dx   += dot.vx;
      dot.dy   += dot.vy;

      // ── Apply transform (no layout thrash) ─────────────
      dot.el.style.transform = `translate(${dot.dx.toFixed(2)}px,${dot.dy.toFixed(2)}px)`;

      // ── Interpolate colour ──────────────────────────────
      if (colorT > 0) {
        const r = Math.round(br + (ar - br) * colorT);
        const g = Math.round(bg + (ag - bg) * colorT);
        const b = Math.round(bb + (ab - bb) * colorT);
        dot.el.style.backgroundColor = `rgb(${r},${g},${b})`;
      } else {
        dot.el.style.backgroundColor = baseColor;
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [proximity, baseColor, baseRgb, activeRgb]);

  /* ── Shock wave on click (GSAP used only here) ─────── */
  const handleClick = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    for (const dot of dotsRef.current) {
      const dx   = dot.cx - cx;
      const dy   = dot.cy - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > shockRadius) continue;

      const force = (1 - dist / shockRadius) * shockStrength;
      const nx    = dist > 0 ? dx / dist : 0;
      const ny    = dist > 0 ? dy / dist : 0;
      const kick  = force * (resistance / 100);

      // Inject velocity directly — the spring loop will handle return
      dot.vx += nx * kick;
      dot.vy += ny * kick;
    }
  }, [shockRadius, shockStrength, resistance]);

  /* ── Mouse tracking ────────────────────────────────── */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -99999, y: -99999 };
  }, []);

  /* ── Lifecycle ─────────────────────────────────────── */
  useEffect(() => {
    buildGrid();
    rafRef.current = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => { buildGrid(); });
    if (containerRef.current) ro.observe(containerRef.current);

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('mouseleave', handleMouseLeave);
    container?.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseleave', handleMouseLeave);
      container?.removeEventListener('click', handleClick);
    };
  }, [buildGrid, loop, handleMouseMove, handleMouseLeave, handleClick]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ pointerEvents: 'auto' }}
    />
  );
}
