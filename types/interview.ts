import type { Timestamp } from 'firebase/firestore';

export type Provider = 'gemini' | 'groq';

export interface QAItem {
  question: string;
  answer: string;
  feedback: string;
}

export interface CategoryScores {
  technicalDepth: number;
  communication: number;
  confidence: number;
  resumeConsistency: number;
}

export interface FinalReport {
  overallScore: number;
  categoryScores: CategoryScores;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface InterviewStep {
  feedback: string;
  done: boolean;
  question: string | null;
}

export interface InterviewDoc {
  uid: string;
  resumeText: string;
  qaLog: QAItem[];
  status: 'in-progress' | 'completed';
  createdAt: Timestamp | null;
  finalReport?: FinalReport;
}
