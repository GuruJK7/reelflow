import http from "node:http";
import path from "node:path";
import handler from "serve-handler";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { env } from "../env.js";
import type { Caption } from "../types.js";
import type { ReelFormat } from "../formats.js";

let cachedServeUrl: string | null = null;

/** Bundlea el proyecto Remotion una sola vez (cacheado entre jobs). */
async function getServeUrl(): Promise<string> {
  if (cachedServeUrl) return cachedServeUrl;
  cachedServeUrl = await bundle({ entryPoint: env.remotionEntry });
  return cachedServeUrl;
}

export interface RenderInput {
  videoFile: string;
  workDir: string;
  format: ReelFormat;
  captions: Caption[];
  hook?: string | null;
  durationInSeconds: number;
  outFile: string;
  onProgress?: (p: number) => void;
}

export async function renderReel(input: RenderInput): Promise<void> {
  // Servimos el work dir por http para que <OffthreadVideo> cargue el video local.
  const server = http.createServer((req, res) => {
    void handler(req, res, { public: input.workDir });
  });
  const port = await new Promise<number>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") resolve(addr.port);
      else reject(new Error("No se pudo abrir el servidor local de assets"));
    });
  });

  try {
    const videoSrc = `http://localhost:${port}/${path.basename(input.videoFile)}`;
    const fps = 30;
    const inputProps = {
      videoSrc,
      captions: input.captions,
      format: input.format,
      hook: input.hook ?? null,
      fps,
      durationInSeconds: input.durationInSeconds,
    };

    const serveUrl = await getServeUrl();
    const composition = await selectComposition({
      serveUrl,
      id: "Reel",
      inputProps,
    });
    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      outputLocation: input.outFile,
      inputProps,
      onProgress: ({ progress }) => input.onProgress?.(progress),
      // Render por software: funciona headless sin GPU (Render/Docker Linux).
      chromiumOptions: { gl: "swangle" },
    });
  } finally {
    server.close();
  }
}
