import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "../env.js";

const pexec = promisify(execFile);

/**
 * Recorta los silencios con auto-editor (--margin para un ritmo natural).
 * El binario vive en el venv del contenedor (en el PATH).
 */
export async function trimSilences(input: string, output: string): Promise<void> {
  await pexec(
    "auto-editor",
    [input, "--margin", env.margin, "--no-open", "-o", output],
    { maxBuffer: 64 * 1024 * 1024 },
  );
}
