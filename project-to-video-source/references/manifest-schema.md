# Manifest Schema (`video-source.json`)

The stable contract between `project-to-video-source` (producer) and
`remotion-video` (consumer). Keep backward-compatible; add fields, don't rename.

```jsonc
{
  "project": {
    "name": "NarraNexus",        // required
    "framework": "react-vite",   // detect_framework output
    "devCmd": "npm run dev",
    "port": 5173
  },
  "mode": "capture",             // "capture" | "component" | "hybrid"
  "designTokens": {              // optional; used for captions/branding
    "primary": "#4f46e5",
    "font": "Inter, sans-serif",
    "logo": "assets/logo.svg"
  },
  "pip": {                       // digital-human overlay placement
    "position": "bottom-left",   // bottom-left|bottom-right|top-left|top-right
    "widthPct": 26,              // % of frame width
    "margin": 48,                // px from edges
    "radius": 16                 // corner radius px
  },
  "scenes": [
    {
      "id": "dashboard",         // unique, becomes assets/<id>.mp4
      "route": "/dashboard",
      "durationSec": 6,          // capture: set by you; ideally = narration length
      "narration": "…",          // non-empty; fed to MiniMax by remotion-video
      "source": {
        "capture": "assets/dashboard.mp4",  // mode A (null in pure component mode)
        "component": null                    // mode B: { import, propsFixture }
      }
    }
  ],
  "render": {                    // OPTIONAL — remotion-video fills this in later
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "heygenClip": "assets/heygen.mp4",      // HeyGen presenter (muted, visual only)
    "narrationAudio": "assets/narration.mp3", // MiniMax full track (single audio)
    "captions": true
  }
}
```

## Validation rules (enforced by `gen_manifest.py`)

- `mode` ∈ {capture, component, hybrid}.
- `project.name` required.
- `pip.position` ∈ the four corners.
- Each scene: unique `id`, `durationSec` > 0, non-empty `narration`, and a
  `source` with either a `capture` path or a `component` spec.

## Audio-alignment note

`remotion-video` overwrites each scene's `durationSec` to match the real length
of that scene's MiniMax narration audio, so main-video cuts land exactly where
the presenter finishes the sentence. The values you set here are the pre-audio
draft.
