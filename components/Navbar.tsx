'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { useProvider } from '@/lib/useProvider';

export default function Navbar() {
  const { user, loading } = useAuth();
  const { provider, setProvider } = useProvider();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);
  const active = (href: string) => (pathname === href ? 'active' : '');

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <Link href="/" className="logo" onClick={close}>
        <span className="dot" />
        ResuVibe<span className="logo-accent">.</span>
      </Link>

      <ul className={`nav-links ${open ? 'open' : ''}`}>
        <li>
          <Link href="/" className={active('/')} onClick={close}>
            Home
          </Link>
        </li>
        {user && (
          <li>
            <Link
              href="/dashboard"
              className={active('/dashboard')}
              onClick={close}
            >
              Dashboard
            </Link>
          </li>
        )}
        {!loading && (
          <li>
            {user ? (
              <button
                className="nav-auth"
                onClick={async () => {
                  close();
                  await signOut(auth);
                  router.push('/');
                }}
              >
                Log out
              </button>
            ) : (
              <Link href="/login" className={active('/login')} onClick={close}>
                Log in
              </Link>
            )}
          </li>
        )}
      </ul>

      <div className="nav-right">
        <div
          className="seg"
          data-value={provider}
          role="group"
          aria-label="AI model"
        >
          <span className="seg-thumb" />
          <button
            aria-pressed={provider === 'gemini'}
            onClick={() => setProvider('gemini')}
          >
            Gemini
          </button>
          <button
            aria-pressed={provider === 'groq'}
            onClick={() => setProvider('groq')}
          >
            Groq
          </button>
        </div>
        <button
          className="menu-toggle"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
