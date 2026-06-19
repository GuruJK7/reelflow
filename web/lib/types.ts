import type { ReelFormat } from "./format";

export type JobStatus = "pending" | "processing" | "done" | "error";

export interface JobResult {
  caption?: string;
  hook?: string;
  hashtags?: string[];
  duration_in?: number;
  duration_out?: number;
}

export interface ReelflowJob {
  id: string;
  user_id: string;
  status: JobStatus;
  input_path: string | null;
  output_path: string | null;
  description: string | null;
  format: ReelFormat;
  options: Record<string, unknown>;
  result: JobResult | null;
  error: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
}
