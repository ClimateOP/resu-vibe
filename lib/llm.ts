import { QAItem, InterviewStep, FinalReport } from '@/types/interview';

const PROVIDER = process.env.LLM_PROVIDER || 'gemini';

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text)
    throw new Error('Gemini returned no content: ' + JSON.stringify(data));
  return text;
}

async function callGrok(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const key = process.env.GROK_API_KEY;
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text)
    throw new Error('Grok returned no content: ' + JSON.stringify(data));
  return text;
}

async function callLLM<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const raw =
    PROVIDER === 'grok'
      ? await callGrok(systemPrompt, userPrompt)
      : await callGemini(systemPrompt, userPrompt);
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
}): Promise<InterviewStep> {
  const userPrompt = `RESUME:\n${params.resumeText}\n\nQ&A LOG SO FAR (JSON):\n${JSON.stringify(
    params.qaLog,
  )}\n\nGiven the above, return the next step as specified.`;
  return callLLM<InterviewStep>(INTERVIEWER_SYSTEM_PROMPT, userPrompt);
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
}): Promise<FinalReport> {
  const userPrompt = `RESUME:\n${params.resumeText}\n\nFULL TRANSCRIPT (JSON):\n${JSON.stringify(
    params.qaLog,
  )}\n\nGenerate the final report as specified.`;
  return callLLM<FinalReport>(REPORT_SYSTEM_PROMPT, userPrompt);
}
