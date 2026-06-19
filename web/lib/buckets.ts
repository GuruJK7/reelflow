export const UPLOADS_BUCKET = "reelflow_uploads";
export const OUTPUTS_BUCKET = "reelflow_outputs";

// Límite de subida (debe coincidir con file_size_limit del bucket en la migración).
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1 GB
