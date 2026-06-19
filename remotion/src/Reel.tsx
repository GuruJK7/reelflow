import { AbsoluteFill, OffthreadVideo } from "remotion";
import type { Caption } from "@remotion/captions";
import { Captions } from "./Captions";
import { Hook } from "./brand/Hook";
import type { ReelFormat } from "./formats";

export type ReelProps = {
  videoSrc: string;
  captions: Caption[];
  format: ReelFormat;
  hook: string | null;
  fps: number;
  durationInSeconds: number;
};

export const Reel: React.FC<ReelProps> = ({ videoSrc, captions, hook }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {videoSrc ? (
        <OffthreadVideo
          src={videoSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <Captions captions={captions} />
      {hook ? <Hook text={hook} /> : null}
    </AbsoluteFill>
  );
};
