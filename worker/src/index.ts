import { env } from "./env.js";
import { log } from "./log.js";
import { claimJob } from "./db.js";
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
  while (running) {
    try {
      const job = await claimJob();
      if (job) {
        log.info(`claim ${job.id} (${job.format})`);
        await processJob(job);
      } else {
        await sleep(env.pollMs);
      }
    } catch (err) {
      log.error(`loop: ${err instanceof Error ? err.message : String(err)}`);
      await sleep(env.pollMs);
    }
  }
  log.info("worker detenido");
}

void loop();
