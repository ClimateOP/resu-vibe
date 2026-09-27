import { NextRequest, NextResponse } from 'next/server';
import { generateReport } from '@/lib/llm';
import { QAItem } from '@/types/interview';

export async function POST(req: NextRequest) {
  try {
    const { resumeText, qaLog } = (await req.json()) as {
      resumeText: string;
      qaLog: QAItem[];
    };
    const report = await generateReport({ resumeText, qaLog });
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
