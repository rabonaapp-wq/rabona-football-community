import React from 'react';

const rnd = (seed: number, n: number) => {
  const x = Math.sin(seed * 97.13 + n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

let counter = 0;

export function PitchArt({
  seed = 0,
  className = '',
}: {
  seed?: number;
  className?: string;
}) {
  const id = React.useMemo(() => `a_${++counter}_${Math.floor(seed)}`, [seed]);
  const r = (n: number) => rnd(seed + 1, n);

  const h = 138 + Math.floor(r(1) * 28);
  const lx = 70 + r(2) * 260;
  const bx = 110 + r(3) * 180;
  const by = 205 + r(4) * 50;
  const flip = r(5) > 0.5 ? -1 : 1;

  const bands = [150, 160, 174, 194, 222, 258, 300].map((y, k, a) =>
    k < a.length - 1 && k % 2 === 0 ? (
      <rect
        key={y}
        x="0"
        y={y}
        width="400"
        height={a[k + 1] - y}
        fill="#fff"
        opacity="0.045"
      />
    ) : null
  );

  return (
    <svg
      className={`art ${className}`}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h}, 55%, 4%)`} />
          <stop offset="1" stopColor={`hsl(${h}, 55%, 13%)`} />
        </linearGradient>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${h}, 65%, 14%)`} />
          <stop offset="1" stopColor={`hsl(${h}, 75%, 27%)`} />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eaffee" stopOpacity="0.6" />
          <stop offset="1" stopColor="#eaffee" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7dffb0" stopOpacity="0.35" />
          <stop offset="1" stopColor="#7dffb0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}s)`} />
      <ellipse cx={lx} cy="165" rx="190" ry="60" fill={`url(#${id}g)`} />
      <polygon
        points={`${lx - 5},-10 ${lx + 5},-10 ${lx + 95},172 ${lx - 95},172`}
        fill={`url(#${id}l)`}
        opacity="0.45"
      />
      <polygon
        points={`${lx + flip * 140 - 4},-10 ${lx + flip * 140 + 4},-10 ${lx + flip * 140 + 70},172 ${lx + flip * 140 - 70},172`}
        fill={`url(#${id}l)`}
        opacity="0.22"
      />
      <rect y="150" width="400" height="150" fill={`url(#${id}p)`} />
      {bands}
      <g fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="1.6">
        <line x1="0" y1="191" x2="400" y2="191" />
        <ellipse cx="200" cy="191" rx="72" ry="19" />
        <path d="M95 300 L125 232 H275 L305 300" />
        <path d="M150 300 L162 268 H238 L250 300" />
      </g>
      <ellipse cx={bx} cy={by + 9} rx="12" ry="3.4" fill="#000" opacity="0.4" />
      <circle cx={bx} cy={by} r="9" fill="#f5f5f5" />
      <path
        d={`m${bx} ${by - 4} 3.8 2.8-1.4 4.4h-4.8l-1.4-4.4z`}
        fill="#0b0b0b"
      />
      <path
        d={`M-20 ${290 - r(6) * 20} L420 ${210 + r(7) * 40} L420 300 L-20 300z`}
        fill="#00C853"
        opacity="0.07"
      />
    </svg>
  );
}
