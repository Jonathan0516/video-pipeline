import { AbsoluteFill, Audio, Series, staticFile, useVideoConfig } from "remotion";
import { MainLayer } from "./MainLayer";
import { PiP } from "./PiP";
import { Caption } from "./Captions";
import type { Manifest } from "./types";

export const secToFrames = (sec: number, fps: number) => Math.max(1, Math.round(sec * fps));

// The full video: scenes on the main layer (Series), a persistent HeyGen PiP
// overlay, one MiniMax narration track, and optional captions.
export const Video: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const { fps } = useVideoConfig();
  const { scenes, pip, designTokens } = manifest;
  const render = manifest.render ?? {};

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Main layer: one Series.Sequence per scene */}
      <Series>
        {scenes.map((scene) => (
          <Series.Sequence key={scene.id} durationInFrames={secToFrames(scene.durationSec, fps)}>
            <MainLayer scene={scene} />
            {render.captions ? (
              <Caption text={scene.narration} font={designTokens.font} primary={designTokens.primary} />
            ) : null}
          </Series.Sequence>
        ))}
      </Series>

      {/* Persistent digital-human PiP overlay (visual only) */}
      {render.heygenClip ? <PiP pip={pip} clip={render.heygenClip} /> : null}

      {/* Single source of truth for audio: the MiniMax narration */}
      {render.narrationAudio ? <Audio src={staticFile(render.narrationAudio)} /> : null}
    </AbsoluteFill>
  );
};
