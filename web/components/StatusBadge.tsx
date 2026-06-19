import type { JobStatus } from "@/lib/types";

const MAP: Record<JobStatus, { label: string; cls: string }> = {
  pending: { label: "En cola", cls: "bg-yellow-500/15 text-yellow-300" },
  processing: { label: "Procesando", cls: "bg-reelflow-accent/15 text-reelflow-accent" },
  done: { label: "Listo", cls: "bg-green-500/15 text-green-300" },
  error: { label: "Error", cls: "bg-red-500/15 text-red-300" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  const s = MAP[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
