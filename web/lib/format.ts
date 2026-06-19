export type ReelFormat = "9:16" | "1:1" | "4:5" | "16:9";

export const FORMATS: Record<
  ReelFormat,
  { label: string; width: number; height: number; hint: string }
> = {
  "9:16": { label: "9:16", width: 1080, height: 1920, hint: "Reels / Stories / TikTok" },
  "1:1": { label: "1:1", width: 1080, height: 1080, hint: "Feed cuadrado" },
  "4:5": { label: "4:5", width: 1080, height: 1350, hint: "Feed vertical" },
  "16:9": { label: "16:9", width: 1920, height: 1080, hint: "YouTube / horizontal" },
};

export const FORMAT_KEYS = Object.keys(FORMATS) as ReelFormat[];
export const DEFAULT_FORMAT: ReelFormat = "9:16";

export function isReelFormat(v: unknown): v is ReelFormat {
  return typeof v === "string" && v in FORMATS;
}
