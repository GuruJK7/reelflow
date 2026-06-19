import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";
import type { Caption } from "../types.js";

export interface ReelCopy {
  hook: string;
  caption: string;
  hashtags: string[];
}

/**
 * Genera copy del Reel (hook + caption + hashtags) vía API de Anthropic.
 * Devuelve null si no hay API key configurada (la IA es opcional).
 */
export async function generateCopy(
  description: string | null,
  captions: Caption[],
): Promise<ReelCopy | null> {
  if (!env.anthropicKey) return null;

  const transcript = captions
    .map((c) => c.text)
    .join(" ")
    .slice(0, 4000);

  const anthropic = new Anthropic({ apiKey: env.anthropicKey });

  const prompt = `Sos experto en social media. A partir de la descripción y la transcripción de un Reel, generá copy en español rioplatense, natural y directo.

Descripción del usuario: ${description || "(sin descripción)"}

Transcripción del video: ${transcript || "(sin audio)"}

Devolvé SOLO un objeto JSON con esta forma EXACTA, sin texto adicional:
{"hook": "...", "caption": "...", "hashtags": ["#...", "#..."]}

- "hook": título corto y potente para poner EN PANTALLA al inicio (máx 8 palabras).
- "caption": texto para Instagram (2-4 líneas, 1-2 emojis, con un call to action).
- "hashtags": 5 a 8 hashtags relevantes (con #).`;

  const msg = await anthropic.messages.create({
    model: env.aiModel,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  const parsed = extractJson(text);
  if (!parsed) return null;

  return {
    hook: typeof parsed.hook === "string" ? parsed.hook : "",
    caption: typeof parsed.caption === "string" ? parsed.caption : "",
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map((h) => String(h))
      : [],
  };
}

function extractJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}
