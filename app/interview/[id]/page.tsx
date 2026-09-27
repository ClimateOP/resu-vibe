'use client';
import { useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { InterviewDoc, QAItem, InterviewStep } from '@/types/interview';

export default function Interview({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, loading } = useAuth();
  const router = useRouter();

  const [resumeText, setResumeText] = useState('');
  const [qaLog, setQaLog] = useState<QAItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || started.current) return;
    started.current = true;
    (async () => {
      const snap = await getDoc(doc(db, 'interviews', id));
      if (!snap.exists()) return;
      const data = snap.data() as InterviewDoc;
      setResumeText(data.resumeText);
      setQaLog(data.qaLog || []);
      if (data.status === 'completed') {
        router.push(`/report/${id}`);
        return;
      }
      await fetchNextQuestion(data.resumeText, data.qaLog || []);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchNextQuestion(resume: string, log: QAItem[]) {
    setBusy(true);
    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: resume, qaLog: log }),
    });
    const step: InterviewStep = await res.json();

    if (log.length > 0 && step.feedback) {
      const updatedLog = [...log];
      updatedLog[updatedLog.length - 1].feedback = step.feedback;
      setQaLog(updatedLog);
      await updateDoc(doc(db, 'interviews', id), { qaLog: updatedLog });
      log = updatedLog;
    }

    if (step.done) {
      await finishInterview(resume, log);
      return;
    }

    setCurrentQuestion(step.question);
    setBusy(false);
  }

  async function finishInterview(resume: string, log: QAItem[]) {
    setFinishing(true);
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: resume, qaLog: log }),
    });
    const report = await res.json();
    await updateDoc(doc(db, 'interviews', id), {
      status: 'completed',
      finalReport: report,
    });
    router.push(`/report/${id}`);
  }

  async function handleAnswer(e: FormEvent) {
    e.preventDefault();
    if (!answer.trim() || !currentQuestion) return;
    const newLog: QAItem[] = [
      ...qaLog,
      { question: currentQuestion, answer, feedback: '' },
    ];
    setQaLog(newLog);
    setAnswer('');
    setCurrentQuestion(null);
    await updateDoc(doc(db, 'interviews', id), { qaLog: newLog });
    await fetchNextQuestion(resumeText, newLog);
  }

  if (loading || !user)
    return <div className="mx-auto max-w-xl px-6 py-16">Loading…</div>;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Interview in progress</h1>
        <a
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Save & exit
        </a>
      </div>

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

      {finishing && (
        <p className="text-sm text-zinc-500">
          Wrapping up and scoring your interview…
        </p>
      )}

      {!finishing && busy && (
        <p className="text-sm text-zinc-500">Interviewer is thinking…</p>
      )}

      {!finishing && !busy && currentQuestion && (
        <form
          onSubmit={handleAnswer}
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <label className="mb-2 block text-sm font-medium">
            Q{qaLog.length + 1}. {currentQuestion}
          </label>
          <textarea
            rows={5}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer as you would in the real interview…"
            required
            className="mb-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Submit answer
          </button>
        </form>
      )}
    </div>
  );
}
