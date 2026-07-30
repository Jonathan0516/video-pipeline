import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { AppShell } from "./AppShell";
import { componentRegistry } from "./scenes.gen";
import type { Scene } from "./types";

// The main (background) layer for a scene.
// - capture (A): full-frame recorded video of the real app.
// - component (B): the imported project component, wrapped in AppShell.
export const MainLayer: React.FC<{ scene: Scene }> = ({ scene }) => {
  const { capture, component } = scene.source;

  if (capture) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <OffthreadVideo
          src={staticFile(capture)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  if (component) {
    // Component modules are registered in ./scenes.gen.ts (created by scaffold).
    // Rendered inside AppShell for deterministic context.
    const Comp = componentRegistry[scene.id];
    if (!Comp) {
      return (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "#f55" }}>
          Missing component for scene "{scene.id}". Register it in scenes.gen.ts.
        </AbsoluteFill>
      );
    }
    return (
      <AbsoluteFill style={{ backgroundColor: "#fff" }}>
        <AppShell route={scene.route}>
          <Comp />
        </AppShell>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", color: "#f55" }}>
      Scene "{scene.id}" has no source.
    </AbsoluteFill>
  );
};
