import { NextRequest, NextResponse } from 'next/server';
import { generateReport } from '@/lib/llm';
import { Provider, QAItem } from '@/types/interview';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, qaLog, provider } = (await req.json()) as {
      resumeText: string;
      qaLog: QAItem[];
      provider?: Provider;
    };
    const report = await generateReport({ resumeText, qaLog, provider });
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
