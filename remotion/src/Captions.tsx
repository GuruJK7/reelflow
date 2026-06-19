import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { THEME } from "./brand/theme";

/** Subtítulos animados estilo TikTok: frase por página, palabra activa resaltada. */
export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  if (!captions || captions.length === 0) return null;

  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 1200,
  });

  const page = pages.find(
    (p) => timeMs >= p.startMs && timeMs < p.startMs + p.durationMs,
  );
  if (!page) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 6% 16%",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontFamily: THEME.font,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.15,
          color: "#fff",
          textShadow: "0 4px 24px rgba(0,0,0,0.75)",
        }}
      >
        {page.tokens.map((t, i) => {
          const active = timeMs >= t.fromMs && timeMs < t.toMs;
          return (
            <span
              key={`${i}-${t.fromMs}`}
              style={{
                color: active ? THEME.accent : "#fff",
                padding: "0 8px",
                display: "inline-block",
                transform: active ? "scale(1.08)" : "scale(1)",
              }}
            >
              {t.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
