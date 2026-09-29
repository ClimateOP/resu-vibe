'use client';
import { useRef, ReactNode, CSSProperties, MouseEvent } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tilt?: boolean;
}

export default function GlowCard({
  children,
  className = '',
  style,
  tilt = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${(x / r.width) * 100}%`);
    el.style.setProperty('--my', `${(y / r.height) * 100}%`);
    if (tilt) {
      const rx = ((y - r.height / 2) / (r.height / 2)) * -4;
      const ry = ((x - r.width / 2) / (r.width / 2)) * 4;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  }

  function onLeave() {
    if (ref.current && tilt) {
      ref.current.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
    }
  }

  return (
    <div
      ref={ref}
      className={`glass-card ${className}`}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
