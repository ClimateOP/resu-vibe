'use client';
import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on real mouse devices
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches)
      return;
    document.documentElement.classList.add('custom-cursor');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const place = (el: HTMLDivElement | null, x: number, y: number) => {
      if (el)
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };
    place(dot.current, mx, my);
    place(ring.current, rx, ry);

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      place(dot.current, mx, my);
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      place(ring.current, rx, ry);
      raf = requestAnimationFrame(loop);
    };

    const hoverables = 'a, button, label, .glass-card, .dropzone, .seg';
    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(hoverables))
        ring.current?.classList.add('hovering');
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(hoverables))
        ring.current?.classList.remove('hovering');
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.documentElement.classList.remove('custom-cursor');
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" />
      <div ref={dot} className="cursor-dot" />
    </>
  );
}
