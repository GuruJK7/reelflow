import type { ReelFormat } from "./formats.js";

export type { ReelFormat };

export type JobStatus = "pending" | "processing" | "done" | "error";

export interface Job {
  id: string;
  user_id: string;
  status: JobStatus;
  input_path: string | null;
  output_path: string | null;
  description: string | null;
  format: ReelFormat;
  options: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}

/** Formato de subtítulo compatible con @remotion/captions. */
export interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
}
