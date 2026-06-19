import { Composition } from "remotion";
import { Reel, type ReelProps } from "./Reel";
import { FORMATS } from "./formats";

const DEFAULT_PROPS: ReelProps = {
  videoSrc: "",
  captions: [],
  format: "9:16",
  hook: null,
  fps: 30,
  durationInSeconds: 10,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Reel"
      component={Reel}
      defaultProps={DEFAULT_PROPS}
      fps={30}
      width={1080}
      height={1920}
      durationInFrames={300}
      calculateMetadata={({ props }: { props: ReelProps }) => {
        const { width, height } = FORMATS[props.format] ?? FORMATS["9:16"];
        const fps = props.fps || 30;
        return {
          width,
          height,
          fps,
          durationInFrames: Math.max(
            1,
            Math.round((props.durationInSeconds || 1) * fps),
          ),
        };
      }}
    />
  );
};
