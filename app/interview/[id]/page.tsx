'use client';
import { useEffect, useRef, useState, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';
import { useProvider } from '@/lib/useProvider';
import { InterviewDoc, QAItem, InterviewStep } from '@/types/interview';
import Transcript from '@/components/Transcript';
import GlowCard from '@/components/GlowCard';

export default function Interview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const { provider } = useProvider();
  const router = useRouter();

  const [resumeText, setResumeText] = useState('');
  const [qaLog, setQaLog] = useState<QAItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const [retryStage, setRetryStage] = useState<'question' | 'report' | null>(
    null,
  );
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaLog, currentQuestion, busy]);

  async function fetchNextQuestion(resume: string, log: QAItem[]) {
    setBusy(true);
    setError('');
    setRetryStage(null);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume, qaLog: log, provider }),
      });
      const step: InterviewStep & { error?: string } = await res.json();
      if (step.error) throw new Error(step.error);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setRetryStage('question');
    } finally {
      setBusy(false);
    }
  }

  async function finishInterview(resume: string, log: QAItem[]) {
    setFinishing(true);
    setError('');
    setRetryStage(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: resume, qaLog: log, provider }),
      });
      const report = await res.json();
      if (report.error) throw new Error(report.error);
      await updateDoc(doc(db, 'interviews', id), {
        status: 'completed',
        finalReport: report,
      });
      router.push(`/report/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setRetryStage('report');
      setFinishing(false);
    }
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

  function retry() {
    if (retryStage === 'report') {
      finishInterview(resumeText, qaLog);
    } else if (retryStage === 'question') {
      fetchNextQuestion(resumeText, qaLog);
    }
  }

  if (loading || !user)
    return <div className="page loading-shell">Loading…</div>;

  return (
    <div className="page">
      <div className="wrap wrap-chat">
        <div className="top-row">
          <div>
            <span className="section-label">In progress</span>
            <h1 className="section-title small">Resume round</h1>
          </div>
          <button
            className="link-btn"
            onClick={() => router.push('/dashboard')}
          >
            Save &amp; exit
          </button>
        </div>

        <GlowCard tilt={false} className="glass-strong chat-panel">
          <Transcript items={qaLog} />

          {finishing && (
            <div className="msg ai">
              <div className="avatar">AI</div>
              <div className="bubble typing">
                Wrapping up and scoring your interview
                <span className="dots">
                  <i /> <i /> <i />
                </span>
              </div>
            </div>
          )}

          {!finishing && busy && (
            <div className="msg ai">
              <div className="avatar">AI</div>
              <div className="bubble typing">
                Interviewer is thinking
                <span className="dots">
                  <i /> <i /> <i />
                </span>
              </div>
            </div>
          )}

          {!finishing && !busy && currentQuestion && (
            <div className="msg ai">
              <div className="avatar">AI</div>
              <div className="bubble">
                <span className="q-index">Q{qaLog.length + 1}</span>
                {currentQuestion}
              </div>
            </div>
          )}

          {error && (
            <div className="err-row">
              <p className="err">{error}</p>
              <button className="btn btn-ghost btn-sm" onClick={retry}>
                Retry
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </GlowCard>

        {!finishing && !busy && currentQuestion && (
          <form className="answer-bar" onSubmit={handleAnswer}>
            <textarea
              className="input"
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer as you would in the real interview…"
              required
            />
            <button className="btn btn-primary" type="submit">
              Send <span aria-hidden>→</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
