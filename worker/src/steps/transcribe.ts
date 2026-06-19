import path from "node:path";
import { transcribe, toCaptions } from "@remotion/install-whisper-cpp";
import { extractWav16k } from "../ffmpeg.js";
import { env } from "../env.js";
import type { Caption } from "../types.js";

// Modelos válidos de whisper.cpp; si la env trae basura, caemos a 'medium'.
const VALID_MODELS = new Set([
  "tiny", "tiny.en", "base", "base.en", "small", "small.en",
  "medium", "medium.en", "large-v1", "large-v2", "large-v3", "large-v3-turbo",
]);

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

  const model = VALID_MODELS.has(env.whisperModel) ? env.whisperModel : "medium";

  const whisperCppOutput = await transcribe({
    inputPath: wav,
    whisperPath: env.whisperPath,
    whisperCppVersion: env.whisperVersion,
    model: model as Parameters<typeof transcribe>[0]["model"],
    language: env.whisperLang as Parameters<typeof transcribe>[0]["language"],
    tokenLevelTimestamps: true,
    printOutput: false,
  });

  const { captions } = toCaptions({ whisperCppOutput });
  return captions as Caption[];
}
