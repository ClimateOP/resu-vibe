import { NextRequest, NextResponse } from 'next/server';
import { getNextInterviewStep } from '@/lib/llm';
import { QAItem } from '@/types/interview';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, qaLog } = (await req.json()) as {
      resumeText: string;
      qaLog: QAItem[];
    };
    const step = await getNextInterviewStep({ resumeText, qaLog: qaLog || [] });
    return NextResponse.json(step);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
