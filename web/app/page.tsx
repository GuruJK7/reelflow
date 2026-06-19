import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Nocturno } from "@/components/Nocturno";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
      <Nocturno className="h-24 w-24" />
      <h1 className="mt-8 text-4xl font-bold tracking-tight sm:text-6xl">
        Subí un video crudo.{" "}
        <span className="text-reelflow-accent">Bajá un Reel listo.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-reelflow-muted">
        ReelFlow recorta los silencios, agrega subtítulos animados en español
        palabra por palabra y exporta en 9:16, 1:1, 4:5 o 16:9 — listo para
        Instagram en minutos.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {user ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-reelflow-accent px-6 py-3 font-semibold text-reelflow-bg hover:opacity-90"
          >
            Ir a mi panel
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-lg bg-reelflow-accent px-6 py-3 font-semibold text-reelflow-bg hover:opacity-90"
            >
              Empezar gratis
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-reelflow-border px-6 py-3 font-semibold hover:bg-reelflow-surface"
            >
              Iniciar sesión
            </Link>
          </>
        )}
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          { t: "Silencios fuera", d: "Cortes automáticos con ritmo natural (auto-editor)." },
          { t: "Subtítulos animados", d: "Transcripción en español, palabra por palabra." },
          { t: "Multi-formato", d: "9:16, 1:1, 4:5 y 16:9 desde el mismo video." },
        ].map((f) => (
          <div
            key={f.t}
            className="rounded-xl border border-reelflow-border bg-reelflow-surface/60 p-5 text-left"
          >
            <h3 className="font-semibold text-reelflow-accent">{f.t}</h3>
            <p className="mt-1 text-sm text-reelflow-muted">{f.d}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
