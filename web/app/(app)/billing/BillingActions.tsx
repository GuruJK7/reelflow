"use client";

import { useState } from "react";

export function BillingActions({ currentPlan }: { currentPlan: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string, body?: object) {
    setLoading(path);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = (await res.json()) as { url?: string; error?: string };
      if (d.url) window.location.href = d.url;
      else setError(d.error || "Ocurrió un error");
    } catch {
      setError("No se pudo conectar. Probá de nuevo.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {currentPlan !== "free" ? (
        <button
          onClick={() => go("/api/stripe/portal")}
          disabled={loading !== null}
          className="rounded-lg bg-reelflow-accent px-5 py-2.5 font-semibold text-reelflow-bg hover:opacity-90 disabled:opacity-50"
        >
          Gestionar suscripción
        </button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => go("/api/stripe/checkout", { plan: "starter" })}
            disabled={loading !== null}
            className="rounded-lg bg-reelflow-accent px-5 py-2.5 font-semibold text-reelflow-bg hover:opacity-90 disabled:opacity-50"
          >
            Pasar a Starter
          </button>
          <button
            onClick={() => go("/api/stripe/checkout", { plan: "pro" })}
            disabled={loading !== null}
            className="rounded-lg border border-reelflow-accent px-5 py-2.5 font-semibold text-reelflow-accent hover:bg-reelflow-accent/10 disabled:opacity-50"
          >
            Pasar a Pro
          </button>
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
