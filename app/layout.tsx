import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Space_Grotesk, Spline_Sans } from 'next/font/google';
import { AuthProvider } from '@/lib/useAuth';
import { ModelProvider } from '@/lib/useProvider';
import Navbar from '@/components/Navbar';
import Cursor from '@/components/Cursor';

const space = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});
const spline = Spline_Sans({
  subsets: ['latin'],
  variable: '--font-spline',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ResuVibe — Resume round, rehearsed',
  description:
    'Practice the resume round of your interview with an AI interviewer.',
};

export const viewport: Viewport = { themeColor: '#050505' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${space.variable} ${spline.variable}`}>
        <div className="bg-layer" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <AuthProvider>
          <ModelProvider>
            <Cursor />
            <Navbar />
            <main>{children}</main>
          </ModelProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
