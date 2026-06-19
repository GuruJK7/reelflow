import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isReelFormat, DEFAULT_FORMAT } from "@/lib/format";
import { checkQuota } from "@/lib/quota";

/** Crea un job (status pending) con el input ya subido. */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    description?: unknown;
    format?: unknown;
    input_path?: unknown;
  } | null;
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const description =
    typeof body.description === "string" ? body.description.slice(0, 2000) : null;
  const format = isReelFormat(body.format) ? body.format : DEFAULT_FORMAT;
  const input_path = typeof body.input_path === "string" ? body.input_path : null;

  if (!input_path) {
    return NextResponse.json({ error: "Falta input_path" }, { status: 400 });
  }
  // Defensa: el input debe vivir en la carpeta del propio usuario.
  if (!input_path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "input_path inválido" }, { status: 403 });
  }

  // Gating por plan: cupo mensual de Reels.
  const quota = await checkQuota();
  if (!quota.ok) {
    return NextResponse.json(
      {
        error: `Alcanzaste el límite de tu plan (${quota.used}/${quota.quota} este mes). Mejorá tu plan en Facturación.`,
      },
      { status: 402 },
    );
  }

  const { data, error } = await supabase
    .from("reelflow_jobs")
    .insert({ user_id: user.id, description, format, input_path })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

/** Lista los jobs del usuario (RLS limita a los propios). */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("reelflow_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}
