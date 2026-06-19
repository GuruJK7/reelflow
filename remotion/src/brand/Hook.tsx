import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "./theme";
import { Nocturno } from "./Nocturno";

/** Título/hook en pantalla durante los primeros ~3s, con entrada por spring. */
export const Hook: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame > fps * 3) return null;

  const appear = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: "9%" }}
    >
      <div
        style={{
          transform: `scale(${appear})`,
          opacity,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "rgba(10,14,23,0.72)",
          border: `2px solid ${THEME.accent}`,
          borderRadius: 22,
          padding: "16px 26px",
          maxWidth: "84%",
        }}
      >
        <Nocturno style={{ width: 46, height: 46, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: THEME.font,
            fontWeight: 800,
            fontSize: 46,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {text}
        </span>
      </div>
    </AbsoluteFill>
  );
};
