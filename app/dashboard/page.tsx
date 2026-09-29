'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { InterviewDoc } from '@/types/interview';
import { delay } from '@/lib/anim';
import GlowCard from '@/components/GlowCard';

type InterviewRow = InterviewDoc & { id: string };

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRow[] | null>(null);
  const [indexError, setIndexError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'interviews'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setInterviews(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as InterviewDoc) })),
        );
      },
      (err) => {
        if (err.code === 'failed-precondition') setIndexError(true);
      },
    );
    return unsub;
  }, [user]);

  if (loading || !user) {
    return <div className="page loading-shell">Loading…</div>;
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="top-row rise" style={delay(0)}>
          <div>
            <span className="section-label">Your history</span>
            <h1 className="section-title">Past attempts</h1>
          </div>
          <Link href="/" className="btn btn-primary">
            New attempt <span aria-hidden>→</span>
          </Link>
        </div>

        {indexError && (
          <p className="err rise" style={delay(1)}>
            Firestore needs a composite index for this query — open the link
            from the browser console error once to auto-create it, then refresh.
          </p>
        )}

        {interviews && interviews.length === 0 && (
          <p className="muted rise" style={delay(1)}>
            No interviews yet. Start your first one above.
          </p>
        )}

        <div className="list rise" style={delay(1)}>
          {interviews?.map((iv, i) => (
            <GlowCard tilt={false} className="row" key={iv.id} style={delay(i)}>
              <div className="row-main">
                <span className={`badge ${iv.status}`}>
                  {iv.status === 'completed' ? 'Completed' : 'In progress'}
                </span>
                <span className="row-date">
                  {iv.createdAt
                    ? iv.createdAt.toDate().toLocaleString()
                    : 'just now'}
                </span>
                {iv.finalReport && (
                  <span className="row-score">
                    {iv.finalReport.overallScore}/100
                  </span>
                )}
              </div>
              <Link
                href={
                  iv.status === 'completed'
                    ? `/report/${iv.id}`
                    : `/interview/${iv.id}`
                }
                className="row-link"
              >
                {iv.status === 'completed' ? 'View report' : 'Continue'}{' '}
                <span aria-hidden>→</span>
              </Link>
            </GlowCard>
          ))}
        </div>
      </div>
    </div>
  );
}
