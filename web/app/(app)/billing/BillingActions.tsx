"use client";

import { useState } from "react";

export function BillingActions({ currentPlan }: { currentPlan: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function go(path: string, body?: object) {
    setLoading(path + JSON.stringify(body ?? {}));
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = (await res.json()) as { url?: string; error?: string };
      if (d.url) window.location.href = d.url;
      else alert(d.error || "Error");
    } finally {
      setLoading(null);
    }
  }

  if (currentPlan !== "free") {
    return (
      <button
        onClick={() => go("/api/stripe/portal")}
        className="rounded-lg bg-reelflow-accent px-5 py-2.5 font-semibold text-reelflow-bg hover:opacity-90"
      >
        Gestionar suscripción
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => go("/api/stripe/checkout", { plan: "starter" })}
        className="rounded-lg bg-reelflow-accent px-5 py-2.5 font-semibold text-reelflow-bg hover:opacity-90"
      >
        Pasar a Starter
      </button>
      <button
        onClick={() => go("/api/stripe/checkout", { plan: "pro" })}
        className="rounded-lg border border-reelflow-accent px-5 py-2.5 font-semibold text-reelflow-accent hover:bg-reelflow-accent/10"
      >
        Pasar a Pro
      </button>
    </div>
  );
}
