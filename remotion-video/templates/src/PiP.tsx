import { OffthreadVideo, staticFile } from "remotion";
import type { Pip } from "./types";

// HeyGen digital-human presenter as a picture-in-picture overlay.
// Muted on purpose: the audio comes from the single NetMind narration track;
// HeyGen provides only the lip-synced visual.
export const PiP: React.FC<{ pip: Pip; clip: string }> = ({ pip, clip }) => {
  const isBottom = pip.position.startsWith("bottom");
  const isLeft = pip.position.endsWith("left");
  const style: React.CSSProperties = {
    position: "absolute",
    [isBottom ? "bottom" : "top"]: pip.margin,
    [isLeft ? "left" : "right"]: pip.margin,
    width: `${pip.widthPct}%`,
    borderRadius: pip.radius,
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
  };
  return (
    <div style={style}>
      <OffthreadVideo src={staticFile(clip)} muted style={{ width: "100%", display: "block" }} />
    </div>
  );
};
