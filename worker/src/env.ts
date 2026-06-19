import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// En dev cargamos ../.env.local; en Docker las variables vienen del entorno (no sobreescribe).
config({
  path: process.env.REELFLOW_ENV_PATH || path.resolve(process.cwd(), "../.env.local"),
});

const here = path.dirname(fileURLToPath(import.meta.url));

function opt(name: string, fallback: string): string {
  return process.env[name] || fallback;
}
function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || req("SUPABASE_URL"),
  serviceRoleKey: req("SUPABASE_SERVICE_ROLE_KEY"),
  uploadsBucket: opt("REELFLOW_UPLOADS_BUCKET", "reelflow_uploads"),
  outputsBucket: opt("REELFLOW_OUTPUTS_BUCKET", "reelflow_outputs"),
  pollMs: Number(opt("REELFLOW_WORKER_POLL_MS", "5000")),
  margin: opt("REELFLOW_TIGHT_MARGIN", "0.2s"),
  whisperModel: opt("REELFLOW_WHISPER_MODEL", "medium"),
  whisperLang: opt("REELFLOW_WHISPER_LANG", "es"),
  whisperPath: opt("REELFLOW_WHISPER_PATH", "/app/whisper"),
  whisperVersion: opt("REELFLOW_WHISPER_VERSION", "1.5.5"),
  anthropicKey: process.env.ANTHROPIC_API_KEY || "",
  aiModel: opt("REELFLOW_AI_MODEL", "claude-haiku-4-5-20251001"),
  workRoot: opt("REELFLOW_WORK_ROOT", "/app/work"),
  remotionEntry:
    process.env.REELFLOW_REMOTION_ENTRY ||
    path.resolve(here, "../../remotion/src/index.ts"),
};
