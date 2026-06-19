import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";

/**
 * Sube un video al Storage de Supabase de forma resumible (protocolo TUS).
 * Necesario para archivos grandes (>6MB). El archivo va directo del browser
 * al Storage; no pasa por ninguna función serverless.
 */
export async function uploadVideoResumable(opts: {
  file: File;
  objectName: string; // {user_id}/{jobId}/raw.ext
  bucket: string;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(opts.file, {
      endpoint: `${projectUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: opts.bucket,
        objectName: opts.objectName,
        contentType: opts.file.type || "video/mp4",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024, // Supabase resumable exige chunks de 6MB
      onError: (err) => reject(err),
      onProgress: (sent, total) =>
        opts.onProgress?.(total ? Math.round((sent / total) * 100) : 0),
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
}
