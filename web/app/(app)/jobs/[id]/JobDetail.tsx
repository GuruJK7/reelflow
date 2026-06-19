"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReelflowJob } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/Progress";

export function JobDetail({ initialJob }: { initialJob: ReelflowJob }) {
  const [job, setJob] = useState<ReelflowJob>(initialJob);
  const [url, setUrl] = useState<string | null>(null);

  // Polling mientras el job está activo
  useEffect(() => {
    if (job.status === "done" || job.status === "error") return;
    let cancelled = false;
    const t = setInterval(async () => {
      const res = await fetch(`/api/jobs/${job.id}`);
      if (res.ok && !cancelled) {
        const data = (await res.json()) as { job: ReelflowJob };
        setJob(data.job);
      }
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [job.id, job.status]);

  // Cuando está listo, pedir URL firmada del resultado
  useEffect(() => {
    if (job.status === "done" && !url) {
      fetch(`/api/jobs/${job.id}/output-url`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { url?: string } | null) => {
          if (d?.url) setUrl(d.url);
        });
    }
  }, [job.status, job.id, url]);

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-reelflow-muted hover:text-reelflow-text">
        ← Volver
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {job.description?.slice(0, 60) || "Reel"}
        </h1>
        <StatusBadge status={job.status} />
      </div>
      <p className="mt-1 text-sm text-reelflow-muted">
        Formato {job.format} · creado {new Date(job.created_at).toLocaleString("es")}
      </p>

      {/* Estado en proceso */}
      {(job.status === "pending" || job.status === "processing") && (
        <div className="mt-8 rounded-xl border border-reelflow-border bg-reelflow-surface/60 p-6">
          <p className="text-reelflow-muted">
            {job.status === "pending"
              ? "En cola, el worker lo tomará en breve…"
              : "Procesando: recorte de silencios → subtítulos → render…"}
          </p>
          <Progress value={job.status === "processing" ? job.progress : 5} />
        </div>
      )}

      {/* Error */}
      {job.status === "error" && (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
          <p className="font-medium text-red-300">No se pudo procesar el Reel</p>
          <p className="mt-1 text-sm text-reelflow-muted">{job.error}</p>
        </div>
      )}

      {/* Resultado */}
      {job.status === "done" && (
        <div className="mt-8 space-y-6">
          <div className="overflow-hidden rounded-xl border border-reelflow-border bg-black">
            {url ? (
              <video
                src={url}
                controls
                playsInline
                aria-label="Reel generado"
                className="mx-auto max-h-[70vh]"
              />
            ) : (
              <div className="p-12 text-center text-reelflow-muted">Cargando preview…</div>
            )}
          </div>

          {url ? (
            <a
              href={url}
              download
              className="inline-block rounded-lg bg-reelflow-accent px-6 py-3 font-semibold text-reelflow-bg hover:opacity-90"
            >
              Descargar Reel
            </a>
          ) : null}

          {job.result ? <CopyBlock result={job.result} /> : null}
        </div>
      )}
    </div>
  );
}

function CopyBlock({ result }: { result: NonNullable<ReelflowJob["result"]> }) {
  return (
    <div className="rounded-xl border border-reelflow-border bg-reelflow-surface/60 p-5">
      <h2 className="font-semibold text-reelflow-accent">Copy sugerido</h2>
      {result.hook ? (
        <Field label="Hook / Título" value={result.hook} />
      ) : null}
      {result.caption ? <Field label="Caption" value={result.caption} /> : null}
      {result.hashtags && result.hashtags.length > 0 ? (
        <Field label="Hashtags" value={result.hashtags.join(" ")} />
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-reelflow-muted">
          {label}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-xs text-reelflow-accent hover:underline"
        >
          Copiar
        </button>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}
