import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanId } from "@/lib/plans";

/** Plan activo del usuario (default free). */
export async function getUserPlan(): Promise<PlanId> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data } = await supabase
    .from("reelflow_subscriptions")
    .select("plan,status")
    .eq("user_id", user.id)
    .single();

  if (!data) return "free";
  if (data.status !== "active" && data.status !== "trialing") return "free";
  return (data.plan as PlanId) ?? "free";
}

/** Uso del mes y si todavía hay cupo en el plan. */
export async function checkQuota(): Promise<{
  ok: boolean;
  used: number;
  quota: number;
  plan: PlanId;
}> {
  const supabase = createClient();
  const plan = await getUserPlan();
  const quota = PLANS[plan].monthlyQuota;

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  // RLS limita el conteo a los jobs del propio usuario.
  // No contamos jobs en error (no consumieron un Reel útil).
  const { count } = await supabase
    .from("reelflow_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", start.toISOString())
    .neq("status", "error");

  const used = count ?? 0;
  return { ok: used < quota, used, quota, plan };
}
