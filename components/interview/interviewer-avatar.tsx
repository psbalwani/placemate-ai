'use client';

import { useEffect, useRef } from 'react';

interface InterviewerAvatarProps {
  speaking?: boolean;
  listening?: boolean;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP = { sm: 120, md: 180, lg: 260, xl: 360 };

export function InterviewerAvatar({
  speaking = false,
  listening = false,
  name = 'AI Interviewer',
  size = 'lg',
}: InterviewerAvatarProps) {
  const px = SIZE_MAP[size];
  const blinkRef = useRef<SVGAnimateElement>(null);

  /* Trigger random blinks */
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    function scheduleBlink() {
      const delay = 2500 + Math.random() * 4000;
      t = setTimeout(() => {
        blinkRef.current?.beginElement?.();
        scheduleBlink();
      }, delay);
    }
    scheduleBlink();
    return () => clearTimeout(t);
  }, []);

  const cx = px / 2;
  const cy = px / 2;
  const r = px * 0.38; // face radius

  /* Derived dimensions */
  const eyeY = cy - r * 0.12;
  const eyeOffX = r * 0.30;
  const eyeRx = r * 0.075;
  const eyeRy = r * 0.10;
  const mouthY = cy + r * 0.28;
  const mouthW = r * 0.42;
  const mouthOpenH = speaking ? r * 0.18 : r * 0.04;
  const pupilR = eyeRy * 0.45;
  const noseY = cy + r * 0.08;

  return (
    <>
      <style>{`
        @keyframes av-breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.012); }
        }
        @keyframes av-glow-pulse {
          0%, 100% { opacity: 0.4; r: ${r + 6}px; }
          50% { opacity: 0.85; r: ${r + 14}px; }
        }
        @keyframes av-head-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(${speaking ? -3 : 0}px); }
        }
        @keyframes av-mouth-open {
          0%, 100% { ry: ${r * 0.04}px; }
          30%, 70% { ry: ${r * 0.18}px; }
          15%, 50%, 85% { ry: ${r * 0.08}px; }
        }
        @keyframes av-listen-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .av-face-group {
          transform-origin: ${cx}px ${cy}px;
          animation: av-breathe 3.2s ease-in-out infinite,
                     av-head-bob ${speaking ? '0.45s' : '4s'} ease-in-out infinite;
        }
        .av-mouth {
          animation: ${speaking ? `av-mouth-open 0.38s ease-in-out infinite` : 'none'};
          transform-origin: ${cx}px ${mouthY}px;
        }
        .av-glow {
          animation: ${speaking ? `av-glow-pulse 0.5s ease-in-out infinite` : 'none'};
        }
      `}</style>

      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={name}
        role="img"
      >
        <defs>
          {/* Skin gradient */}
          <radialGradient id="skinGrad" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fde8d0" />
            <stop offset="60%" stopColor="#f5c99a" />
            <stop offset="100%" stopColor="#d4956a" />
          </radialGradient>
          {/* Suit gradient */}
          <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          {/* Shirt */}
          <linearGradient id="shirtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          {/* Inner glow */}
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          {/* Hair gradient */}
          <radialGradient id="hairGrad" cx="50%" cy="20%" r="60%">
            <stop offset="0%" stopColor="#4a3728" />
            <stop offset="100%" stopColor="#2d1f14" />
          </radialGradient>
          {/* Shadow */}
          <filter id="faceShad" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy={px * 0.02} stdDeviation={px * 0.02} floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx={cx} cy={cy} r={px * 0.48} fill="#0d1120" />

        {/* Listening pulse rings */}
        {listening && !speaking && (
          <>
            <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0" className="av-listen-pulse" />
            <style>{`.av-listen-pulse { animation: av-listen-ring 1.6s ease-out infinite; }`}</style>
          </>
        )}

        {/* Speaking glow halo */}
        {speaking && (
          <circle cx={cx} cy={cy} r={r + 10} fill="url(#glowGrad)" className="av-glow" />
        )}

        {/* Ring border — changes color based on state */}
        <circle
          cx={cx} cy={cy} r={r + 3}
          fill="none"
          stroke={speaking ? '#10b981' : listening ? '#3b82f6' : '#1e293b'}
          strokeWidth={speaking ? 2.5 : 1.5}
          opacity={speaking ? 1 : 0.6}
        />

        <g className="av-face-group">
          {/* ── Body / Suit ── */}
          <ellipse
            cx={cx} cy={cy + r * 1.35}
            rx={r * 0.82} ry={r * 0.55}
            fill="url(#suitGrad)"
          />
          {/* Shirt collar */}
          <polygon
            points={`
              ${cx - r * 0.15},${cy + r * 0.82}
              ${cx + r * 0.15},${cy + r * 0.82}
              ${cx + r * 0.22},${cy + r * 1.05}
              ${cx},${cy + r * 0.96}
              ${cx - r * 0.22},${cy + r * 1.05}
            `}
            fill="url(#shirtGrad)"
          />
          {/* Tie */}
          <polygon
            points={`
              ${cx - r * 0.07},${cy + r * 0.90}
              ${cx + r * 0.07},${cy + r * 0.90}
              ${cx + r * 0.06},${cy + r * 1.18}
              ${cx},${cy + r * 1.28}
              ${cx - r * 0.06},${cy + r * 1.18}
            `}
            fill="#059669"
          />
          {/* Tie knot */}
          <ellipse cx={cx} cy={cy + r * 0.94} rx={r * 0.07} ry={r * 0.06} fill="#047857" />

          {/* ── Neck ── */}
          <rect
            x={cx - r * 0.165} y={cy + r * 0.78}
            width={r * 0.33} height={r * 0.26}
            fill="#d4956a"
          />

          {/* ── Head ── */}
          <ellipse
            cx={cx} cy={cy}
            rx={r} ry={r * 1.05}
            fill="url(#skinGrad)"
            filter="url(#faceShad)"
          />

          {/* ── Hair ── */}
          <ellipse
            cx={cx} cy={cy - r * 0.72}
            rx={r * 0.95} ry={r * 0.45}
            fill="url(#hairGrad)"
          />
          {/* Hair sides */}
          <ellipse cx={cx - r * 0.88} cy={cy - r * 0.28} rx={r * 0.14} ry={r * 0.38} fill="url(#hairGrad)" />
          <ellipse cx={cx + r * 0.88} cy={cy - r * 0.28} rx={r * 0.14} ry={r * 0.38} fill="url(#hairGrad)" />

          {/* ── Ears ── */}
          <ellipse cx={cx - r * 0.96} cy={cy + r * 0.05} rx={r * 0.12} ry={r * 0.175} fill="#d4956a" />
          <ellipse cx={cx + r * 0.96} cy={cy + r * 0.05} rx={r * 0.12} ry={r * 0.175} fill="#d4956a" />
          {/* Ear canal */}
          <ellipse cx={cx - r * 0.97} cy={cy + r * 0.05} rx={r * 0.055} ry={r * 0.09} fill="#c4855a" />
          <ellipse cx={cx + r * 0.97} cy={cy + r * 0.05} rx={r * 0.055} ry={r * 0.09} fill="#c4855a" />

          {/* ── Eyebrows ── */}
          <path
            d={`M ${cx - eyeOffX - eyeRx * 1.4} ${eyeY - eyeRy * 1.8} Q ${cx - eyeOffX} ${eyeY - eyeRy * 2.4} ${cx - eyeOffX + eyeRx * 1.4} ${eyeY - eyeRy * 1.8}`}
            stroke="#5a3825" strokeWidth={r * 0.065} fill="none" strokeLinecap="round"
          />
          <path
            d={`M ${cx + eyeOffX - eyeRx * 1.4} ${eyeY - eyeRy * 1.8} Q ${cx + eyeOffX} ${eyeY - eyeRy * 2.4} ${cx + eyeOffX + eyeRx * 1.4} ${eyeY - eyeRy * 1.8}`}
            stroke="#5a3825" strokeWidth={r * 0.065} fill="none" strokeLinecap="round"
          />

          {/* ── Eyes ── */}
          {/* Eye whites */}
          <ellipse cx={cx - eyeOffX} cy={eyeY} rx={eyeRx * 1.35} ry={eyeRy * 1.2} fill="white" />
          <ellipse cx={cx + eyeOffX} cy={eyeY} rx={eyeRx * 1.35} ry={eyeRy * 1.2} fill="white" />
          {/* Irises */}
          <ellipse cx={cx - eyeOffX} cy={eyeY} rx={eyeRx * 0.9} ry={eyeRy * 0.95} fill="#2c5c8a" />
          <ellipse cx={cx + eyeOffX} cy={eyeY} rx={eyeRx * 0.9} ry={eyeRy * 0.95} fill="#2c5c8a" />
          {/* Pupils */}
          <ellipse cx={cx - eyeOffX} cy={eyeY} rx={pupilR} ry={pupilR * 1.05} fill="#1a1a2e" />
          <ellipse cx={cx + eyeOffX} cy={eyeY} rx={pupilR} ry={pupilR * 1.05} fill="#1a1a2e" />
          {/* Eye shine */}
          <ellipse cx={cx - eyeOffX - pupilR * 0.4} cy={eyeY - pupilR * 0.55} rx={pupilR * 0.35} ry={pupilR * 0.3} fill="rgba(255,255,255,0.8)" />
          <ellipse cx={cx + eyeOffX - pupilR * 0.4} cy={eyeY - pupilR * 0.55} rx={pupilR * 0.35} ry={pupilR * 0.3} fill="rgba(255,255,255,0.8)" />

          {/* Eyelid blink overlay (animated) */}
          <ellipse cx={cx - eyeOffX} cy={eyeY} rx={eyeRx * 1.35} ry={0} fill="#d4956a">
            <animate
              ref={blinkRef}
              attributeName="ry"
              values="0;1.2;0"
              dur="0.18s"
              begin="indefinite"
              calcMode="linear"
            />
          </ellipse>
          <ellipse cx={cx + eyeOffX} cy={eyeY} rx={eyeRx * 1.35} ry={0} fill="#d4956a">
            <animate
              attributeName="ry"
              values="0;1.2;0"
              dur="0.18s"
              begin="indefinite"
              calcMode="linear"
            />
          </ellipse>

          {/* ── Nose ── */}
          <ellipse cx={cx} cy={noseY} rx={r * 0.07} ry={r * 0.06} fill="#c4855a" opacity="0.6" />
          <path
            d={`M ${cx - r * 0.11} ${noseY + r * 0.07} Q ${cx} ${noseY + r * 0.04} ${cx + r * 0.11} ${noseY + r * 0.07}`}
            stroke="#c4855a" strokeWidth={r * 0.035} fill="none" strokeLinecap="round" opacity="0.7"
          />

          {/* ── Mouth ── */}
          {/* Lips */}
          <ellipse
            className="av-mouth"
            cx={cx} cy={mouthY}
            rx={mouthW}
            ry={speaking ? undefined : r * 0.04}
          >
            {speaking && (
              <animate
                attributeName="ry"
                values={`${r * 0.04};${r * 0.16};${r * 0.07};${r * 0.18};${r * 0.05};${r * 0.04}`}
                dur="0.52s"
                repeatCount="indefinite"
                calcMode="linear"
              />
            )}
            <animate
              attributeName="fill"
              values="#c0706a;#a05555;#c0706a"
              dur="0.52s"
              repeatCount={speaking ? 'indefinite' : '0'}
            />
          </ellipse>
          {/* Upper lip arc */}
          {!speaking && (
            <path
              d={`M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY - r * 0.05} ${cx + mouthW} ${mouthY}`}
              stroke="#b06060" strokeWidth={r * 0.03} fill="none" strokeLinecap="round"
            />
          )}
          {/* Smile dimples */}
          <circle cx={cx - mouthW * 1.05} cy={mouthY + r * 0.01} r={r * 0.025} fill="#c4855a" opacity="0.5" />
          <circle cx={cx + mouthW * 1.05} cy={mouthY + r * 0.01} r={r * 0.025} fill="#c4855a" opacity="0.5" />

          {/* ── Cheek blush ── */}
          <ellipse cx={cx - r * 0.58} cy={cy + r * 0.22} rx={r * 0.2} ry={r * 0.1} fill="#f97316" opacity="0.08" />
          <ellipse cx={cx + r * 0.58} cy={cy + r * 0.22} rx={r * 0.2} ry={r * 0.1} fill="#f97316" opacity="0.08" />
        </g>

        {/* ── Name badge ── */}
        <rect
          x={cx - r * 0.7} y={cy + r * 1.6}
          width={r * 1.4} height={r * 0.32}
          rx={r * 0.08}
          fill="#10b981" opacity="0.15"
        />
        <text
          x={cx} y={cy + r * 1.81}
          textAnchor="middle"
          fontSize={r * 0.155}
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fill="#10b981"
          opacity="0.9"
        >{name}</text>

        {/* ── Status dot ── */}
        <circle
          cx={cx + r * 0.72} cy={cy + r * 0.72}
          r={r * 0.09}
          fill={speaking ? '#10b981' : listening ? '#3b82f6' : '#94a3b8'}
        >
          {speaking && (
            <animate attributeName="opacity" values="1;0.4;1" dur="0.7s" repeatCount="indefinite" />
          )}
        </circle>
      </svg>
    </>
  );
}
