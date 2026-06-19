"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Nocturno } from "@/components/Nocturno";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg("Te enviamos un email para confirmar tu cuenta.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <Nocturno className="h-16 w-16" />
        <h1 className="mt-4 text-2xl font-bold">
          {mode === "login" ? "Iniciá sesión" : "Creá tu cuenta"}
        </h1>
        <p className="mt-1 text-sm text-reelflow-muted">ReelFlow — Reels listos para Instagram</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-reelflow-border bg-reelflow-surface px-4 py-3 outline-none focus:border-reelflow-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Contraseña (mín. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-reelflow-border bg-reelflow-surface px-4 py-3 outline-none focus:border-reelflow-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-reelflow-accent px-4 py-3 font-semibold text-reelflow-bg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "..." : mode === "login" ? "Entrar" : "Registrarme"}
        </button>
      </form>

      {msg ? <p className="mt-4 text-center text-sm text-reelflow-accent">{msg}</p> : null}

      <button
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMsg(null);
        }}
        className="mt-6 text-center text-sm text-reelflow-muted hover:text-reelflow-text"
      >
        {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Iniciá sesión"}
      </button>
    </main>
  );
}
