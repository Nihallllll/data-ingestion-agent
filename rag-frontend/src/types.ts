export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

export interface Source {
  content: string;
  similarity: number;
  type: string;
  source: 'Discord' | 'Github';
  username?: string;
  filename?: string;
  timestamp?: string;
}

export interface QueryRequest {
  question: string;
  source?: 'Discord' | 'Github';
}

export interface ProgressUpdate {
  type: 'progress';
  step: string;
  progress: number;
}

export interface ResultUpdate {
  type: 'result';
  answer: string;
  sources: Source[];
  timestamp: string;
}

export interface ErrorUpdate {
  type: 'error';
  error: string;
}

export type StreamUpdate = ProgressUpdate | ResultUpdate | ErrorUpdate;
