// Shape of the video-source Manifest consumed by remotion-video.
// Mirrors project-to-video-source/scripts/gen_manifest.py. Keep in sync.

export type PipPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";

export interface SceneSource {
  capture: string | null; // asset path relative to public/ (mode A)
  component: {
    import: string; // path to the component module
    propsFixture?: string;
  } | null; // (mode B)
}

export interface Scene {
  id: string;
  route: string;
  durationSec: number;
  narration: string;
  source: SceneSource;
}

export interface Pip {
  position: PipPosition;
  widthPct: number;
  margin: number;
  radius: number;
}

export interface Manifest {
  project: { name: string; framework?: string; devCmd?: string; port?: number };
  mode: "capture" | "component" | "hybrid";
  designTokens: { primary?: string; font?: string; logo?: string };
  pip: Pip;
  scenes: Scene[];
  // Injected by remotion-video after avatar-video-skill runs:
  render?: {
    fps?: number;
    width?: number;
    height?: number;
    heygenClip?: string; // public/-relative HeyGen presenter clip (muted, visual only)
    narrationAudio?: string; // public/-relative full MiniMax narration track
    captions?: boolean;
  };
}
