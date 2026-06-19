import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(execFile);

/** Duración del video en segundos (vía ffprobe). */
export async function probeDurationSeconds(file: string): Promise<number> {
  const { stdout } = await pexec("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  const d = parseFloat(stdout.trim());
  if (!Number.isFinite(d) || d <= 0)
    throw new Error("No se pudo leer la duración del video");
  return d;
}

/** Extrae audio WAV 16kHz mono (formato que requiere whisper.cpp). */
export async function extractWav16k(input: string, outWav: string): Promise<void> {
  await pexec("ffmpeg", [
    "-y",
    "-i",
    input,
    "-ar",
    "16000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    outWav,
  ]);
}
