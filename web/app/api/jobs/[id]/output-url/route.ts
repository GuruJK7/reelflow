import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const OUTPUTS_BUCKET = process.env.REELFLOW_OUTPUTS_BUCKET || "reelflow_outputs";

/** Devuelve una URL firmada (1h) para previsualizar/descargar el resultado. */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: job } = await supabase
    .from("reelflow_jobs")
    .select("output_path,status")
    .eq("id", params.id)
    .single();

  if (!job?.output_path) {
    const msg =
      job?.status === "error"
        ? "El job terminó con error"
        : "El Reel todavía no está listo";
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(OUTPUTS_BUCKET)
    .createSignedUrl(job.output_path, 3600);

  if (error || !data)
    return NextResponse.json({ error: "No se pudo firmar la URL" }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
