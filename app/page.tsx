'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Resume Round</h1>
        {!loading &&
          (user ? (
            <a
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/login"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Log in
            </a>
          ))}
      </div>

      <p className="mb-8 text-sm text-zinc-600">
        Upload your resume. An AI interviewer will go through it top to bottom,
        ask you questions, and give you a scored report at the end.
      </p>

      <form
        onSubmit={handleStart}
        className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-4">
          <label className="mb-1 block text-sm text-zinc-600">
            Resume (PDF)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:text-white"
          />
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !file}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? 'Reading resume…' : 'Start interview'}
        </button>
      </form>
    </div>
  );
}
