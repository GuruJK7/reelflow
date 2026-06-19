import Link from "next/link";
import { Nocturno } from "./Nocturno";

export function Header({ email }: { email?: string | null }) {
  return (
    <header className="flex items-center justify-between border-b border-reelflow-border px-6 py-4">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Nocturno className="h-7 w-7" />
        <span>ReelFlow</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {email ? <span className="hidden text-reelflow-muted sm:inline">{email}</span> : null}
        <Link
          href="/new"
          className="rounded-md bg-reelflow-accent px-3 py-1.5 font-medium text-reelflow-bg hover:opacity-90"
        >
          Nuevo Reel
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-reelflow-muted hover:text-reelflow-text">
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
