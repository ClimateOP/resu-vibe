'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { delay } from '@/lib/anim';
import GlowCard from '@/components/GlowCard';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(
        code === 'auth/email-already-in-use'
          ? 'That email is already registered.'
          : code === 'auth/weak-password'
            ? 'Password should be at least 6 characters.'
            : err instanceof Error
              ? err.message
              : 'Something went wrong.',
      );
      setBusy(false);
    }
  }

  return (
    <div className="page center">
      <div className="wrap wrap-auth">
        <div className="rise" style={delay(0)}>
          <span className="section-label">Get started</span>
          <h1 className="section-title">Create your account</h1>
          <p className="section-sub">
            Practice the resume round before the real one.
          </p>
        </div>

        <div className="rise" style={{ ...delay(1), marginTop: '2rem' }}>
          <GlowCard tilt={false} className="glass-strong">
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="err">{error}</p>}
              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={busy}
              >
                {busy ? 'Creating account…' : 'Sign up'}
              </button>
            </form>
          </GlowCard>
        </div>

        <p className="switch rise" style={delay(2)}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
