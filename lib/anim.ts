import type { CSSProperties } from 'react';

// Stagger index for the .rise entrance animation (see globals.css)
export const delay = (i: number) => ({ '--i': i }) as CSSProperties;
