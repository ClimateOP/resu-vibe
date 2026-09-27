'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { InterviewDoc } from '@/types/interview';

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

  if (loading || !user || !interview)
    return <div className="mx-auto max-w-xl px-6 py-16">Loading…</div>;

  const { finalReport, qaLog } = interview;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your report</h1>
        <a
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Back to dashboard
        </a>
      </div>

      {!finalReport && (
        <p className="text-sm text-zinc-500">Report not ready yet.</p>
      )}

      {finalReport && (
        <>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-4xl font-semibold">
              {finalReport.overallScore}
              <span className="text-base font-normal text-zinc-400">/100</span>
            </div>
            <p className="mt-2 text-sm text-zinc-700">{finalReport.summary}</p>

            <div className="my-5 grid grid-cols-2 gap-3">
              {Object.entries(finalReport.categoryScores || {}).map(
                ([key, val]) => (
                  <div key={key} className="rounded-md bg-indigo-50 p-3">
                    <div className="text-xl font-semibold">{val}</div>
                    <div className="text-xs text-zinc-500">
                      {formatLabel(key)}
                    </div>
                  </div>
                ),
              )}
            </div>

            <h3 className="mb-1 mt-4 font-medium">Strengths</h3>
            <ul className="divide-y divide-zinc-200 text-sm text-zinc-700">
              {finalReport.strengths?.map((s, i) => (
                <li key={i} className="py-1.5">
                  {s}
                </li>
              ))}
            </ul>

            <h3 className="mb-1 mt-4 font-medium">What to improve</h3>
            <ul className="divide-y divide-zinc-200 text-sm text-zinc-700">
              {finalReport.improvements?.map((s, i) => (
                <li key={i} className="py-1.5">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <h2 className="mb-4 mt-10 text-lg font-semibold">Full transcript</h2>
          {qaLog.map((qa, i) => (
            <div key={i} className="mb-6 border-l-2 border-zinc-200 pl-4">
              <div className="mb-1 font-medium">
                Q{i + 1}. {qa.question}
              </div>
              <div className="mb-1 whitespace-pre-wrap text-zinc-700">
                {qa.answer}
              </div>
              {qa.feedback && (
                <div className="text-sm text-indigo-600">{qa.feedback}</div>
              )}
            </div>
          ))}

          <a
            href="/"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Try another attempt
          </a>
        </>
      )}
    </div>
  );
}

function formatLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}
