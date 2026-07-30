---
name: remotion-video
description: Compose and render a narrated product video with Remotion from a video-source Manifest, overlaying a HeyGen digital-human presenter as a bottom-left picture-in-picture and a NetMind narration track. Use when asked to turn a project's captured scenes or components into a finished 数字人/口播/demo video — scaffolds a Remotion project, builds a scene timeline, aligns scene durations to per-scene NetMind narration, adds captions/branding, renders a 15-second preview first, then the full 1080p video. Consumes output of the project-to-video-source skill and reuses avatar-video-skill for TTS + digital human.
---

# Remotion Video

## Core Rule

Consume a **`video-source.json` Manifest** (from `project-to-video-source`) and
render a finished video with **Remotion**:

- **Main layer** = the project's scenes (captured mp4 in mode A, imported
  components in mode B).
- **Digital human** = a HeyGen clip as a **bottom-left PiP**, muted (visual only).
- **Audio** = one **NetMind narration** track (also drove the HeyGen lip-sync, so
  it aligns).

```text
scaffold Remotion -> narration+HeyGen (avatar-video-skill) -> align scene durations
  -> 15s preview -> user approval -> full 1080p render
```

Do NOT reimplement TTS or the digital human — reuse **`avatar-video-skill`**.

## Operating Boundaries

- Treat NetMind TTS and HeyGen generation as **paid external actions** (delegated
  to `avatar-video-skill`); get explicit user approval before the first paid run.
- Always render the **15-second preview and get approval before the full render**,
  unless the user explicitly waives the gate.
- Keep the HeyGen PiP **muted**; the NetMind track is the single audio source.
- Write outputs under the Remotion project's `out/` unless told otherwise.
- Do not print API keys or signed URLs.

## Required Workflow

### 1. Scaffold the Remotion project

```bash
npm create video@latest -- --blank video-out      # base project
cd video-out && npm i
node <skill>/scripts/scaffold_remotion.mjs --project video-out \
  --manifest ../video-work/video-source.json --assets ../video-work/assets \
  [--heygen heygen.mp4] [--audio narration.mp3] [--captions]
```

This installs the templates into `src/`, copies assets into `public/assets/`,
and writes `video-source.json` at the project root (imported by `Root.tsx`).

### 2. Produce narration + digital human (avatar-video-skill)

Invoke **`avatar-video-skill`** with the concatenated scene narrations:

- NetMind → `narration.mp3` (full track) **and per-scene segment durations**.
- HeyGen → a presenter clip driven by that audio (the PiP source).

Pass them back via `--audio narration.mp3 --heygen heygen.mp4` (re-run scaffold
or drop into `public/assets/` and set `render.narrationAudio` / `render.heygenClip`).

### 3. Align scene durations to narration

Set each `scene.durationSec` to the real length of that scene's NetMind segment
(from step 2), so main-video cuts land where the presenter finishes each line.
See `references/pip-audio-align.md`. The total composition duration recomputes
automatically in `Root.tsx`.

### 4. Component mode (B) wiring — only if the Manifest has component scenes

- Register imports in `src/scenes.gen.ts`:
  `export const componentRegistry = { "<scene-id>": ImportedComponent }`.
- Adapt `src/AppShell.tsx` to provide the project's context (router, i18n, a
  seeded query client, store) with **static data, no network, no timers**.
- Tame self-clock animations (echarts `animation:false`, reactflow static
  `fitView`); drive reveals with Remotion's `useCurrentFrame`.
- Configure `remotion.config.ts` / bundler to import from the project's `src`
  and share its Tailwind. See `references/composition-guide.md`.

### 5. Preview → approval → full render

```bash
cd video-out
node <skill>/scripts/render_preview.mjs --seconds 15   # -> out/preview.mp4
```

Show `out/preview.mp4`. Ask the user to check: PiP placement/size, lip-sync vs
audio, cut timing vs narration, captions, framing. **Only after approval:**

```bash
node <skill>/scripts/render_preview.mjs --full          # -> out/video.mp4
```

## Templates (installed into the project's `src/`)

| File | Role |
|------|------|
| `Root.tsx` | Registers the `ProjectVideo` composition; duration = Σ scene durations |
| `Video.tsx` | Timeline: `<Series>` of scenes + PiP overlay + `<Audio>` narration |
| `MainLayer.tsx` | Per scene: `<OffthreadVideo>` (A) or registered component (B) |
| `PiP.tsx` | HeyGen presenter, positioned/muted |
| `AppShell.tsx` | Provider harness for component mode (adapt per project) |
| `Captions.tsx` | Optional per-scene lower-third caption |
| `scenes.gen.ts` | Component registry (empty for capture-only) |
| `types.ts` | Manifest TypeScript types |

## Failure Policy

- Manifest asset path missing: confirm `public/assets/<id>.mp4` exists (scaffold
  rewrites paths to `assets/<basename>`).
- Component scene shows "Missing component": register it in `scenes.gen.ts`.
- Render fails on a component (context/undefined): the component needs more in
  `AppShell` or static fixtures — isolate by rendering that scene alone.
- Audio/scene drift: re-derive `durationSec` from the NetMind segment lengths.

## References

- `references/composition-guide.md` — timeline, dimensions/fps, component-mode bundler + Tailwind.
- `references/pip-audio-align.md` — PiP placement and the scene-duration ↔ narration alignment rule.
