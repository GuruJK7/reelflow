import { readFile, writeFile } from "node:fs/promises";
import { supabase } from "./db.js";
import { env } from "./env.js";

/** Descarga el crudo del bucket de uploads a un archivo local. */
export async function downloadInput(inputPath: string, dest: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from(env.uploadsBucket)
    .download(inputPath);
  if (error || !data) throw new Error(`download: ${error?.message ?? "sin datos"}`);
  const buf = Buffer.from(await data.arrayBuffer());
  await writeFile(dest, buf);
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
