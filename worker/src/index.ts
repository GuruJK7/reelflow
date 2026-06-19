import { env } from "./env.js";
import { log } from "./log.js";
import { claimJob, reapStaleJobs } from "./db.js";
import { processJob } from "./pipeline.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let running = true;
process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

async function loop(): Promise<void> {
  log.info(
    `ReelFlow worker · poll=${env.pollMs}ms · whisper=${env.whisperModel} · IA=${env.anthropicKey ? "on" : "off"}`,
  );

  // Al arrancar: recuperar jobs colgados de una corrida anterior.
  try {
    const reaped = await reapStaleJobs(env.staleMinutes);
    if (reaped > 0) log.info(`reaper inicial: ${reaped} job(s) colgado(s) -> error`);
  } catch (err) {
    log.error(`reaper inicial: ${err instanceof Error ? err.message : String(err)}`);
  }

  let idleTicks = 0;
  while (running) {
    try {
      const job = await claimJob();
      if (job) {
        log.info(`claim ${job.id} (${job.format})`);
        await processJob(job);
        idleTicks = 0;
      } else {
        await sleep(env.pollMs);
        idleTicks++;
        // Cada ~12 ticks ociosos, reapear jobs colgados.
        if (idleTicks % 12 === 0) {
          const reaped = await reapStaleJobs(env.staleMinutes).catch(() => 0);
          if (reaped > 0) log.info(`reaper: ${reaped} job(s) colgado(s) -> error`);
        }
      }
    } catch (err) {
      log.error(`loop: ${err instanceof Error ? err.message : String(err)}`);
      await sleep(env.pollMs);
    }
  }
  log.info("worker detenido");
}

void loop();
