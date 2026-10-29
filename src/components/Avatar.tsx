import React from 'react';
import { PitchArt } from './PitchArt';

export const getInitial = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim();
  const w = trimmed.startsWith('أكاديمية') ? trimmed.split(' ')[1] || trimmed : trimmed;
  return (w.startsWith('ال') && w.length > 2 ? w[2] : w[0]) || '';
};

export function Avatar({
  name,
  seed = 1,
  size = 44,
  img,
  className = '',
  isSquare = false,
  style,
}: {
  name: string;
  seed?: number;
  size?: number;
  img?: string;
  className?: string;
  isSquare?: boolean;
  style?: React.CSSProperties;
}) {
  const fontSize = Math.round(size * 0.4);

  return (
    <div
      className={`av ${isSquare ? 'sq' : ''} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${fontSize}px`,
        ...style,
      }}
    >
      {img ? (
        <img
          src={img}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          <PitchArt seed={seed} />
          <span>{getInitial(name)}</span>
        </>
      )}
    </div>
  );
}
