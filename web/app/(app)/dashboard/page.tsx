import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JobsList } from "./JobsList";
import type { ReelflowJob } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("reelflow_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const jobs = (data ?? []) as ReelflowJob[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis Reels</h1>
        <Link
          href="/new"
          className="rounded-md bg-reelflow-accent px-4 py-2 font-medium text-reelflow-bg hover:opacity-90"
        >
          Nuevo Reel
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-reelflow-border p-12 text-center">
          <p className="text-reelflow-muted">Todavía no tenés Reels.</p>
          <Link
            href="/new"
            className="mt-4 inline-block rounded-md bg-reelflow-accent px-4 py-2 font-medium text-reelflow-bg hover:opacity-90"
          >
            Subí tu primer video
          </Link>
        </div>
      ) : (
        <JobsList initialJobs={jobs} />
      )}
    </div>
  );
}
