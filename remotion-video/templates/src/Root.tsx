import { Composition } from "remotion";
import { Video, secToFrames } from "./Video";
import type { Manifest } from "./types";
import manifest from "../video-source.json";

// Total duration is the sum of scene durations. Dimensions/fps come from the
// manifest's render block (defaults: 1080p @ 30fps).
const FPS = manifest.render?.fps ?? 30;
const WIDTH = manifest.render?.width ?? 1920;
const HEIGHT = manifest.render?.height ?? 1080;

const totalFrames = (manifest as Manifest).scenes.reduce(
  (sum, s) => sum + secToFrames(s.durationSec, FPS),
  0
);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ProjectVideo"
      component={Video}
      durationInFrames={Math.max(1, totalFrames)}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ manifest: manifest as Manifest }}
    />
  );
};
