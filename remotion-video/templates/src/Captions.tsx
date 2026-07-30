import { useVideoConfig } from "remotion";

// Simple per-scene lower-third caption. One caption spans its scene.
export const Caption: React.FC<{ text: string; font?: string; primary?: string }> = ({
  text,
  font,
  primary,
}) => {
  const { height } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        bottom: Math.round(height * 0.06),
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "72%",
        padding: "12px 22px",
        borderRadius: 12,
        background: "rgba(0,0,0,0.62)",
        color: "#fff",
        fontFamily: font ?? "Inter, system-ui, sans-serif",
        fontSize: 34,
        lineHeight: 1.35,
        textAlign: "center",
        borderBottom: primary ? `3px solid ${primary}` : undefined,
      }}
    >
      {text}
    </div>
  );
};
