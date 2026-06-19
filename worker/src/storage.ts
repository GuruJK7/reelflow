import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { pipeline as streamPipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { supabase } from "./db.js";
import { env } from "./env.js";

/**
 * Descarga el crudo del bucket de uploads a un archivo local EN STREAMING
 * (no carga el video entero en memoria — evita OOM con archivos grandes).
 */
export async function downloadInput(inputPath: string, dest: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from(env.uploadsBucket)
    .createSignedUrl(inputPath, 120);
  if (error || !data) throw new Error(`signed url: ${error?.message ?? "sin datos"}`);

  const res = await fetch(data.signedUrl);
  if (!res.ok || !res.body) throw new Error(`download HTTP ${res.status}`);
  await streamPipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

/** Sube el resultado al bucket de outputs. */
export async function uploadOutput(
  outPath: string,
  localFile: string,
  contentType = "video/mp4",
): Promise<void> {
  const body = await readFile(localFile);
  const { error } = await supabase.storage
    .from(env.outputsBucket)
    .upload(outPath, body, { contentType, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
}

/** Borra el crudo del bucket de uploads (ya no se necesita tras procesar). */
export async function deleteInput(inputPath: string): Promise<void> {
  await supabase.storage.from(env.uploadsBucket).remove([inputPath]);
}
