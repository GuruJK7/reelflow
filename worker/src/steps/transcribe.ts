import path from "node:path";
import { transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import { extractWav16k } from "../ffmpeg.js";
import { env } from "../env.js";
import type { Caption } from "../types.js";

/**
 * Extrae el audio y lo transcribe con whisper.cpp (word-level timestamps),
 * devolviendo captions compatibles con @remotion/captions.
 */
export async function transcribeToCaptions(
  videoFile: string,
  workDir: string,
): Promise<Caption[]> {
  const wav = path.join(workDir, "audio.wav");
  await extractWav16k(videoFile, wav);

  const whisperCppOutput = await transcribe({
    inputPath: wav,
    whisperPath: env.whisperPath,
    whisperCppVersion: env.whisperVersion,
    model: env.whisperModel as Parameters<typeof transcribe>[0]["model"],
    language: env.whisperLang as Parameters<typeof transcribe>[0]["language"],
    tokenLevelTimestamps: true,
    printOutput: false,
  });

  const { captions } = toCaptions({ whisperCppOutput });
  return captions as Caption[];
}
