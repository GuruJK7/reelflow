import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UPLOADS_BUCKET, OUTPUTS_BUCKET } from "@/lib/buckets";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("reelflow_jobs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ job: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // RLS: solo devuelve el job si es del usuario.
  const { data: job } = await supabase
    .from("reelflow_jobs")
    .select("input_path,output_path,status")
    .eq("id", params.id)
    .single();
  if (!job) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (job.status === "processing")
    return NextResponse.json(
      { error: "No se puede borrar un Reel en proceso" },
      { status: 409 },
    );

  // Borrar la FILA primero y confirmar que afectó filas ANTES de tocar storage
  // (evita borrar el input de un job vivo si el delete no elimina nada).
  const { data: deleted, error } = await supabase
    .from("reelflow_jobs")
    .delete()
    .eq("id", params.id)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted || deleted.length === 0)
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 409 });

  // Solo tras confirmar el borrado de la fila, limpiar objetos de storage.
  const admin = createAdminClient();
  if (job.input_path)
    await admin.storage.from(UPLOADS_BUCKET).remove([job.input_path]);
  if (job.output_path)
    await admin.storage.from(OUTPUTS_BUCKET).remove([job.output_path]);
  return NextResponse.json({ ok: true });
}
