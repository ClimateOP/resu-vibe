import {
  QAItem,
  InterviewStep,
  FinalReport,
  Provider,
} from '@/types/interview';

const DEFAULT_PROVIDER: Provider =
  process.env.LLM_PROVIDER === 'gemini' ? 'gemini' : 'groq';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// POST with retry on 429/503 (transient overload), friendly errors otherwise.
async function postWithRetry(
  name: string,
  url: string,
  init: RequestInit,
  extract: (data: any) => string | undefined,
): Promise<string> {
  let status = 0;
  let data: any = {};
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, init);
    status = res.status;
    data = await res.json().catch(() => ({}));
    const text = extract(data);
    if (text) return text;
    if (status !== 503 && status !== 429) break;
    await sleep(700 * 2 ** attempt);
  }
  if (status === 503 || status === 429) {
    throw new Error(
      `${name} is busy right now (${status}). Retry, or switch model in the top bar.`,
    );
  }
  throw new Error(
    `${name} error (${status}): ${data?.error?.message ?? JSON.stringify(data)}`,
  );
}

function callGemini(systemPrompt: string, userPrompt: string) {
  const key = process.env.GEMINI_API_KEY;
  return postWithRetry(
    'Gemini',
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
    (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text,
  );
}

function callGroq(systemPrompt: string, userPrompt: string) {
  const key = process.env.GROQ_API_KEY;
  return postWithRetry(
    'Groq',
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    },
    (d) => d?.choices?.[0]?.message?.content,
  );
}

async function callLLM<T>(
  provider: Provider,
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const raw =
    provider === 'gemini'
      ? await callGemini(systemPrompt, userPrompt)
      : await callGroq(systemPrompt, userPrompt);
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as T;
}

const INTERVIEWER_SYSTEM_PROMPT = `
You are a strict but fair technical interviewer conducting the "resume round" of an interview.
You only ask questions grounded in the candidate's resume (education, projects, experience, skills) - never generic HR questions.
Go roughly top to bottom through the resume, but you may probe deeper with a follow-up if an answer is shallow, vague, or you suspect exaggeration.
Keep the interview short and realistic: aim for 6-10 total questions/follow-ups, then stop once you've reasonably covered the resume.

You will be given the resume text and the Q&A log so far (may be empty).

Respond ONLY with a JSON object, no markdown, no preamble, in this exact shape:
{
  "feedback": "<one short sentence of live feedback on the candidate's last answer. Empty string if there is no previous answer yet.>",
  "done": <true if the interview should end now, false otherwise>,
  "question": "<the next question to ask. null if done is true>"
}
`;

export async function getNextInterviewStep(params: {
  resumeText: string;
  qaLog: QAItem[];
  provider?: Provider;
}): Promise<InterviewStep> {
  const userPrompt = `RESUME:\n${params.resumeText}\n\nQ&A LOG SO FAR (JSON):\n${JSON.stringify(
    params.qaLog,
  )}\n\nGiven the above, return the next step as specified.`;
  return callLLM<InterviewStep>(
    params.provider ?? DEFAULT_PROVIDER,
    INTERVIEWER_SYSTEM_PROMPT,
    userPrompt,
  );
}

const REPORT_SYSTEM_PROMPT = `
You are an interview coach. You just watched a mock "resume round" interview.
Given the resume and the full Q&A transcript (with your own live feedback already attached to each answer),
produce a final performance report.

Respond ONLY with a JSON object, no markdown, in this exact shape:
{
  "overallScore": <integer 0-100>,
  "categoryScores": {
    "technicalDepth": <0-100>,
    "communication": <0-100>,
    "confidence": <0-100>,
    "resumeConsistency": <0-100>
  },
  "strengths": ["<short point>", "..."],
  "improvements": ["<short, actionable point>", "..."],
  "summary": "<2-3 sentence overall summary in a coaching tone>"
}
`;

export async function generateReport(params: {
  resumeText: string;
  qaLog: QAItem[];
  provider?: Provider;
}): Promise<FinalReport> {
  const userPrompt = `RESUME:\n${params.resumeText}\n\nFULL TRANSCRIPT (JSON):\n${JSON.stringify(
    params.qaLog,
  )}\n\nGenerate the final report as specified.`;
  return callLLM<FinalReport>(
    params.provider ?? DEFAULT_PROVIDER,
    REPORT_SYSTEM_PROMPT,
    userPrompt,
  );
}
