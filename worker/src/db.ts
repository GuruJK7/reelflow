import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import type { Job } from "./types.js";

/** Cliente con service_role: bypassa RLS (es el worker). */
export const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Toma atómicamente el job pendiente más viejo (FOR UPDATE SKIP LOCKED). */
export async function claimJob(): Promise<Job | null> {
  const { data, error } = await supabase.rpc("reelflow_claim_job");
  if (error) throw new Error(`claim_job: ${error.message}`);
  return (data as Job | null) ?? null;
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<void> {
  const { error } = await supabase.from("reelflow_jobs").update(patch).eq("id", id);
  if (error) throw new Error(`update_job: ${error.message}`);
}

export async function setProgress(id: string, progress: number): Promise<void> {
  await updateJob(id, { progress });
}
