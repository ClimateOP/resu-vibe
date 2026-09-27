'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { InterviewDoc } from '@/types/interview';

type InterviewRow = InterviewDoc & { id: string };

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
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
    const unsub = onSnapshot(q, (snap) => {
      setInterviews(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as InterviewDoc) })),
      );
    });
    return unsub;
  }, [user]);

  if (loading || !user)
    return <div className="mx-auto max-w-xl px-6 py-16">Loading…</div>;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your interviews</h1>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            New attempt
          </a>
          <button
            onClick={() => signOut(auth)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Log out
          </button>
        </div>
      </div>

      {interviews.length === 0 && (
        <p className="text-sm text-zinc-500">
          No interviews yet. Start your first one.
        </p>
      )}

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {interviews.map((iv) => (
          <li
            key={iv.id}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="text-zinc-600">
              {iv.status === 'completed' ? 'Completed' : 'In progress'} ·{' '}
              {(iv.createdAt as any)?.toDate
                ? (iv.createdAt as any).toDate().toLocaleString()
                : 'just now'}
              {iv.finalReport && ` · Score: ${iv.finalReport.overallScore}`}
            </span>
            <a
              href={
                iv.status === 'completed'
                  ? `/report/${iv.id}`
                  : `/interview/${iv.id}`
              }
              className="text-indigo-600"
            >
              {iv.status === 'completed' ? 'View report' : 'Continue'}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
