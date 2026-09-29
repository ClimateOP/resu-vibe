'use client';
import { useState, FormEvent, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { useProvider } from '@/lib/useProvider';
import { delay } from '@/lib/anim';
import GlowCard from '@/components/GlowCard';

export default function Home() {
  const { user, loading } = useAuth();
  const { provider } = useProvider();
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setError('');
    } else {
      setError('Please drop a PDF file.');
    }
  }

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const docRef = await addDoc(collection(db, 'interviews'), {
        uid: user.uid,
        resumeText: data.text,
        qaLog: [],
        status: 'in-progress',
        createdAt: serverTimestamp(),
      });
      router.push(`/interview/${docRef.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const needsLogin = !loading && !user;

  return (
    <div className="page">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <span className="hero-tag rise" style={delay(0)}>
              <span className="pulse" /> Resume round · mock interview
            </span>
            <h1 className="hero-name rise" style={delay(1)}>
              Get grilled
              <br />
              on your resume.
            </h1>
            <div className="hero-role rise" style={delay(2)}>
              Upload once.{' '}
              <span className="accent">Answer live. Get scored.</span>
            </div>
            <p className="hero-bio rise" style={delay(3)}>
              An AI interviewer walks your resume top to bottom, pushes back on
              weak answers, and hands you a scored report with exactly what to
              fix before the real thing.
            </p>

            <div className="rise" style={delay(4)}>
              <GlowCard tilt={false} className="glass-strong">
                <form onSubmit={handleStart}>
                  <label
                    className={`dropzone ${drag ? 'drag' : ''} ${file ? 'has-file' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={onDrop}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={(e) => {
                        setFile(e.target.files?.[0] || null);
                        setError('');
                      }}
                    />
                    {file ? (
                      <>
                        <div className="dz-icon">PDF</div>
                        <div className="dz-name">{file.name}</div>
                        <div className="dz-meta">
                          {(file.size / 1024).toFixed(0)} KB · click to replace
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="dz-icon">
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 16V4" />
                            <path d="M7 9l5-5 5 5" />
                            <path d="M5 20h14" />
                          </svg>
                        </div>
                        <div className="dz-name">Drop your resume here</div>
                        <div className="dz-meta">
                          PDF only · or click to browse
                        </div>
                      </>
                    )}
                  </label>

                  {error && <p className="err">{error}</p>}

                  <div className="flex items-center justify-between gap-3">
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={busy || (!!user && !file)}
                    >
                      {busy
                        ? 'Reading resume…'
                        : needsLogin
                          ? 'Log in to start'
                          : 'Start interview'}
                      <span aria-hidden>→</span>
                    </button>
                    <span className="using">
                      Model · <b>{provider === 'gemini' ? 'Gemini' : 'Groq'}</b>
                    </span>
                  </div>
                </form>
              </GlowCard>
            </div>
          </div>

          <div className="rise" style={delay(5)}>
            <GlowCard className="glass-strong preview">
              <div className="preview-head">
                <span className="live-dot" /> Sample round
              </div>

              <div className="msg ai">
                <div className="avatar">AI</div>
                <div className="bubble">
                  <span className="q-index">Q3</span>
                  You list “cut API latency by 40%”. How did you measure that?
                </div>
              </div>
              <div className="msg me">
                <div className="avatar">ME</div>
                <div className="bubble">
                  We profiled p95 before and after, then load-tested on staging
                  with the same traffic replay.
                </div>
              </div>
              <div className="fb">
                <b>Feedback</b>Solid method — quote the baseline number next
                time.
              </div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="num">6–10</div>
                  <div className="lbl">Questions</div>
                </div>
                <div className="hero-stat">
                  <div className="num">Live</div>
                  <div className="lbl">Feedback</div>
                </div>
                <div className="hero-stat">
                  <div className="num">0–100</div>
                  <div className="lbl">Score</div>
                </div>
              </div>
            </GlowCard>
          </div>
        </div>
      </div>
    </div>
  );
}
