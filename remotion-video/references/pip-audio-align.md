# PiP Placement & Audio Alignment

## PiP (digital-human overlay)

`PiP.tsx` positions the HeyGen clip from the Manifest's `pip` block:

```jsonc
"pip": { "position": "bottom-left", "widthPct": 26, "margin": 48, "radius": 16 }
```

- `position`: `bottom-left` (default) | `bottom-right` | `top-left` | `top-right`.
- `widthPct`: overlay width as % of frame width (height follows the clip aspect).
- `margin`: px inset from the edges. `radius`: corner rounding px.

The clip is **muted** — it exists for the lip-synced visual only. Keep the
presenter out of the corner where the main UI shows important content (bottom-left
suits UIs whose primary action sits top/right).

## The alignment rule

The main video should cut to the next scene exactly when the presenter finishes
narrating the current one. Mechanism:

1. `avatar-video-skill` generates NetMind audio **per scene** (one segment per
   scene's `narration`), and one concatenated `narration.mp3`.
2. For each scene, measure its segment length:
   ```bash
   ffprobe -v error -show_entries format=duration -of csv=p=0 seg-<id>.mp3
   ```
3. Write that number into the scene's `durationSec` in `video-source.json`.
4. `Root.tsx` recomputes the total; the single `<Audio narration.mp3>` now lines
   up with the scene boundaries because both derive from the same segment lengths.

Because the same NetMind audio drove the HeyGen lip-sync, the presenter's mouth,
the narration track, and the scene cuts all agree.

### Tips
- Add a small tail (0.2–0.4s) to `durationSec` so a scene doesn't cut on the last
  syllable — do it consistently for every scene to preserve total alignment.
- If you change a scene's narration, re-measure that segment and update only its
  `durationSec`.
