'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { InterviewDoc } from '@/types/interview';
import { delay } from '@/lib/anim';
import GlowCard from '@/components/GlowCard';
import Transcript from '@/components/Transcript';

export default function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [interview, setInterview] = useState<InterviewDoc | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, 'interviews', id));
      if (snap.exists()) setInterview(snap.data() as InterviewDoc);
    })();
  }, [user, id]);

  if (loading || !user || !interview) {
    return <div className="page loading-shell">Loading…</div>;
  }

  const { finalReport, qaLog } = interview;

  return (
    <div className="page">
      <div className="wrap">
        <div className="top-row rise" style={delay(0)}>
          <div>
            <span className="section-label">Debrief</span>
            <h1 className="section-title small">Your report</h1>
          </div>
          <Link href="/dashboard" className="link-btn">
            ← Back to dashboard
          </Link>
        </div>

        {!finalReport && <p className="muted">Report not ready yet.</p>}

        {finalReport && (
          <>
            <GlowCard
              tilt={false}
              className="glass-strong report-card rise"
              style={delay(1)}
            >
              <div className="score-hero">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  className="score-ring"
                >
                  <circle cx="60" cy="60" r="52" className="ring-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="ring-fg"
                    style={{
                      strokeDasharray: 2 * Math.PI * 52,
                      strokeDashoffset:
                        2 * Math.PI * 52 * (1 - finalReport.overallScore / 100),
                    }}
                  />
                </svg>
                <div className="score-num">
                  <span>{finalReport.overallScore}</span>
                  <small>/100</small>
                </div>
                <p className="score-summary">{finalReport.summary}</p>
              </div>

              <div className="score-grid">
                {Object.entries(finalReport.categoryScores || {}).map(
                  ([key, val]) => (
                    <div className="score-cell" key={key}>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                      <div className="score-cell-row">
                        <span className="label">{formatLabel(key)}</span>
                        <span className="num-sm">{val}</span>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="two-col">
                <div>
                  <h3 className="mini-title good">Strengths</h3>
                  <ul className="check-list good">
                    {finalReport.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mini-title warn">What to improve</h3>
                  <ul className="check-list warn">
                    {finalReport.improvements?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlowCard>

            <div className="rise" style={{ ...delay(2), marginTop: '3rem' }}>
              <span className="section-label">Transcript</span>
              <h2 className="section-title small">Full conversation</h2>
            </div>

            <GlowCard
              tilt={false}
              className="glass-strong chat-panel rise"
              style={{ ...delay(3), marginTop: '1.5rem' }}
            >
              <Transcript items={qaLog} />
            </GlowCard>

            <div className="center-row rise" style={delay(4)}>
              <Link href="/" className="btn btn-primary">
                Try another attempt <span aria-hidden>→</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}
