"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReelflowJob } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/Progress";

export function JobsList({ initialJobs }: { initialJobs: ReelflowJob[] }) {
  const [jobs, setJobs] = useState<ReelflowJob[]>(initialJobs);
  const hasActive = jobs.some(
    (j) => j.status === "pending" || j.status === "processing",
  );

  useEffect(() => {
    if (!hasActive) return;
    let cancelled = false;
    const t = setInterval(async () => {
      const res = await fetch("/api/jobs");
      if (res.ok && !cancelled) {
        const data = (await res.json()) as { jobs: ReelflowJob[] };
        setJobs(data.jobs);
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [hasActive]);

  return (
    <ul className="space-y-3">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link
            href={`/jobs/${j.id}`}
            className="block rounded-xl border border-reelflow-border bg-reelflow-surface/60 p-4 transition-colors hover:border-reelflow-accent"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-medium">
                {j.description?.slice(0, 70) || "Reel sin descripción"}
              </span>
              <StatusBadge status={j.status} />
            </div>
            <div className="mt-1 text-xs text-reelflow-muted">
              {j.format} · {new Date(j.created_at).toLocaleString("es")}
            </div>
            {j.status === "processing" ? <Progress value={j.progress} /> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
