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
    .select("input_path,output_path")
    .eq("id", params.id)
    .single();
  if (!job) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Borrar objetos de storage (no hay policy de delete para usuarios → admin).
  const admin = createAdminClient();
  if (job.input_path)
    await admin.storage.from(UPLOADS_BUCKET).remove([job.input_path]);
  if (job.output_path)
    await admin.storage.from(OUTPUTS_BUCKET).remove([job.output_path]);

  // RLS permite borrar solo jobs propios y que no estén 'processing'.
  const { error } = await supabase.from("reelflow_jobs").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
