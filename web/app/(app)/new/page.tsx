"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadVideoResumable } from "@/lib/upload";
import {
  FORMAT_KEYS,
  FORMATS,
  DEFAULT_FORMAT,
  type ReelFormat,
} from "@/lib/format";
import { Progress } from "@/components/Progress";
import { UPLOADS_BUCKET, MAX_UPLOAD_BYTES } from "@/lib/buckets";

export default function NewReelPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<ReelFormat>(DEFAULT_FORMAT);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "creating">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const busy = stage !== "idle";

  function pick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("El archivo debe ser un video.");
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setError("El video supera el máximo de 1 GB.");
      return;
    }
    setError(null);
    setFile(f);
  }

  async function submit() {
    if (!file) {
      setError("Elegí un video primero.");
      return;
    }
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const ext = file.name.includes(".")
        ? (file.name.split(".").pop() || "mp4").toLowerCase()
        : "mp4";
      const objectName = `${user.id}/${crypto.randomUUID()}/raw.${ext}`;

      setStage("uploading");
      setProgress(0);
      await uploadVideoResumable({
        file,
        objectName,
        bucket: UPLOADS_BUCKET,
        onProgress: setProgress,
      });

      setStage("creating");
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description, format, input_path: objectName }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        throw new Error(j.error || "No se pudo crear el job");
      }
      const { id } = (await res.json()) as { id: string };
      router.push(`/jobs/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error");
      setStage("idle");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nuevo Reel</h1>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Seleccionar video"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver ? "border-reelflow-accent bg-reelflow-accent/5" : "border-reelflow-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div>
            <p className="font-medium">{file.name}</p>
            <p className="mt-1 text-xs text-reelflow-muted">
              {(file.size / 1024 / 1024).toFixed(1)} MB · clic para cambiar
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium">Arrastrá tu video acá</p>
            <p className="mt-1 text-xs text-reelflow-muted">o hacé clic para elegir (MP4, MOV…)</p>
          </div>
        )}
      </div>

      {/* Descripción */}
      <label className="mt-6 block text-sm font-medium">Descripción corta</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Ej: Tip rápido de finanzas para emprendedores, tono directo y motivador."
        className="mt-2 w-full rounded-lg border border-reelflow-border bg-reelflow-surface px-4 py-3 outline-none focus:border-reelflow-accent"
      />
      <p className="mt-1 text-xs text-reelflow-muted">
        La usamos para generar el copy del Reel (título, caption y hashtags).
      </p>

      {/* Formato */}
      <label className="mt-6 block text-sm font-medium">Formato</label>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FORMAT_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFormat(k)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              format === k
                ? "border-reelflow-accent bg-reelflow-accent/10"
                : "border-reelflow-border hover:border-reelflow-muted"
            }`}
          >
            <div className="font-semibold">{FORMATS[k].label}</div>
            <div className="text-xs text-reelflow-muted">{FORMATS[k].hint}</div>
          </button>
        ))}
      </div>

      {/* Acción */}
      <div className="mt-8">
        {stage === "uploading" ? (
          <div>
            <p className="text-sm text-reelflow-muted">Subiendo… {progress}%</p>
            <Progress value={progress} />
          </div>
        ) : null}
        {stage === "creating" ? (
          <p className="text-sm text-reelflow-muted">Creando el job…</p>
        ) : null}
        {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
        <button
          onClick={submit}
          disabled={busy || !file}
          className="mt-3 w-full rounded-lg bg-reelflow-accent px-4 py-3 font-semibold text-reelflow-bg hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Procesando…" : "Generar Reel"}
        </button>
      </div>
    </div>
  );
}
