import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { env } from "./env.js";
import { log } from "./log.js";
import { updateJob, setProgress } from "./db.js";
import { downloadInput, uploadOutput } from "./storage.js";
import { probeDurationSeconds } from "./ffmpeg.js";
import { trimSilences } from "./steps/autoeditor.js";
import { transcribeToCaptions } from "./steps/transcribe.js";
import { generateCopy } from "./steps/copy.js";
import { renderReel } from "./steps/render.js";
import type { Job } from "./types.js";

export async function processJob(job: Job): Promise<void> {
  const workDir = path.join(env.workRoot, job.id);
  await mkdir(workDir, { recursive: true });
  try {
    if (!job.input_path) throw new Error("Job sin input_path");
    const ext = path.extname(job.input_path) || ".mp4";
    const raw = path.join(workDir, `raw${ext}`);
    const tight = path.join(workDir, "tight.mp4");
    const finalFile = path.join(workDir, "final.mp4");

    log.info(`[${job.id}] 1/5 descargando crudo`);
    await downloadInput(job.input_path, raw);
    await setProgress(job.id, 10);

    log.info(`[${job.id}] 2/5 auto-editor (silencios)`);
    await trimSilences(raw, tight);
    await setProgress(job.id, 30);
    const duration = await probeDurationSeconds(tight);

    log.info(`[${job.id}] 3/5 whisper (subtítulos)`);
    const captions = await transcribeToCaptions(tight, workDir);
    await setProgress(job.id, 55);

    log.info(`[${job.id}] 4/5 copy (IA)`);
    const copy = await generateCopy(job.description, captions);
    await setProgress(job.id, 65);

    log.info(`[${job.id}] 5/5 render (Remotion)`);
    await renderReel({
      videoFile: tight,
      workDir,
      format: job.format,
      captions,
      hook: copy?.hook ?? null,
      durationInSeconds: duration,
      outFile: finalFile,
      onProgress: (p) => {
        void setProgress(job.id, 65 + Math.round(p * 30)).catch(() => {});
      },
    });
    await setProgress(job.id, 96);

    const outPath = `${job.user_id}/${job.id}/final.mp4`;
    log.info(`[${job.id}] subiendo resultado`);
    await uploadOutput(outPath, finalFile);

    const result: Record<string, unknown> = {
      ...(copy ?? {}),
      duration_out: duration,
    };
    await updateJob(job.id, {
      status: "done",
      output_path: outPath,
      progress: 100,
      finished_at: new Date().toISOString(),
      result,
    });
    log.info(`[${job.id}] ✓ done`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error(`[${job.id}] ✗ ${message}`);
    await updateJob(job.id, {
      status: "error",
      error: message,
      finished_at: new Date().toISOString(),
    }).catch(() => {});
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
