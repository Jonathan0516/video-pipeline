# Remotion Project-to-Video Skills — Design

Date: 2026-07-30
Status: Approved (interactive section-by-section approval)

## Goal

A reusable skill set that turns **any frontend project** into a narrated video
with a HeyGen digital-human presenter overlaid in the bottom-left (PiP) and
NetMind narration, composed/rendered by **Remotion**. NarraNexus is the first
target; the skills must generalize to other frontend projects.

## Decisions

- **Main video** = the frontend project's UI.
- **Digital human** = HeyGen clip, PiP bottom-left, muted (visual only).
- **Audio** = single NetMind narration track (also drove HeyGen lip-sync → aligns).
- **Mode is chosen by the user at runtime**, default A:
  - **A (capture)** — Playwright records the real running app. Generic, zero
    project changes. Primary path.
  - **B (component)** — import the project's React components into Remotion for
    frame-exact control. Per-project wiring; optional, for precision shots.
  - **hybrid** — A for most scenes, B for a few emphasis shots.
- **Scene scripting** = semi-automatic: auto-scan routes → draft scenes → user edits.
- **Packaging** = three independently installable skill folders (Codex + Claude),
  same style as `avatar-video-skill`. Skill packages contain NO target-project
  code; the Remotion project is scaffolded at runtime inside the target project.
- **Location** = same repo `rachel-digital-human-production`, three sibling skills.

## Architecture (three skills)

```
avatar-video-skill (existing)   NetMind TTS + HeyGen digital human
        ▲ reused by remotion-video
project-to-video-source         any frontend project → Manifest + assets/
        │  Manifest contract (stable interface)
        ▼
remotion-video                  Manifest + narration + portrait → final.mp4
```

### Manifest contract (`video-source.json`)

The decoupling interface. `remotion-video` only reads this; it never inspects
the source framework.

```jsonc
{
  "project": { "name": "NarraNexus", "framework": "react-vite", "devCmd": "npm run dev", "port": 5173 },
  "mode": "capture",                    // capture | component | hybrid
  "designTokens": { "primary": "#...", "font": "...", "logo": "assets/logo.svg" },
  "pip": { "position": "bottom-left", "widthPct": 26, "margin": 48, "radius": 16 },
  "scenes": [
    {
      "id": "dashboard-overview",
      "route": "/dashboard",
      "durationSec": 6,                 // derived from narration audio length
      "narration": "这是 NarraNexus 的总览面板…",
      "source": {
        "capture": "assets/dashboard-overview.mp4",   // mode A
        "component": null                              // mode B: { import, propsFixture }
      }
    }
  ]
}
```

## Skill 1: project-to-video-source

1. **Framework detect** — read `package.json` deps/scripts → classify
   (`react-vite`, `next`, `vue`, `svelte`, …), resolve dev/build/preview cmd +
   port. Fallback: ask user for start command + port.
2. **Mode select** — ask user A/B/hybrid (default A).
3a. **Capture (A)** — start dev server (background, poll port ready) → Playwright
   fixed viewport + fps → per scene: navigate route + run actions → recordVideo
   webm → ffmpeg → `assets/<scene>.mp4`. Extract designTokens (CSS vars /
   tailwind config / `public/` logo).
3b. **Component (B)** — generate scene templates importing the component + a
   `fixtures.ts` for static props; provide reusable `AppShell` harness
   (i18n / MemoryRouter / seeded QueryClient / zustand); tame self-clock
   animations (echarts `animation:false`, reactflow static `fitView`; reveals via
   Remotion `useCurrentFrame`).
4. **Emit** — `video-source.json` + `assets/`.

Scene scripting is **semi-automatic**: auto-scan routes → draft `scenes.config`
(one segment per page) → user edits actions + narration.

## Skill 2: remotion-video

1. Scaffold Remotion project inside target (or a work dir).
2. Read Manifest → `<Series>` timeline; per scene `MainLayer` =
   `<OffthreadVideo>` (A) or `AppShell`-wrapped component (B).
3. **PiP** — HeyGen clip bottom-left, configurable position/size/radius, muted.
4. **Audio alignment** — call `avatar-video-skill`: NetMind per-scene narration +
   HeyGen lip-synced clip. **Scene duration = narration audio length.** One
   `<Audio>` NetMind track = single source of truth.
5. **Brand & captions** — apply designTokens to intro / lower-thirds / captions.
6. **Render** — 15s preview → user approval → full `remotion render` →
   `outputs/final-1080p.mp4`. Preserves avatar-skill's preview gate.

`remotion-video` does not reimplement TTS/avatar; it reuses `avatar-video-skill`.

## Packaging & layout

```
rachel-digital-human-production/
├── avatar-video-skill/            (existing)
├── project-to-video-source/
│   ├── SKILL.md, agents/openai.yaml
│   ├── references/  (manifest-schema.md, framework-detect.md, capture-guide.md)
│   └── scripts/     (detect_framework.py, capture_scenes.mjs, gen_manifest.py)
└── remotion-video/
    ├── SKILL.md, agents/openai.yaml
    ├── references/  (composition-guide.md, pip-audio-align.md)
    ├── scripts/     (scaffold_remotion.mjs, render_preview.mjs)
    └── templates/   (Root.tsx, MainLayer.tsx, PiP.tsx, AppShell.tsx)
```

Install: `cp -R <skill> ~/.codex/skills/` (and `~/.claude/skills/`). Each ships a
provider-neutral description + dual-platform README.

## Testing

- `detect_framework` / `gen_manifest`: pytest on sample `package.json` → expected output.
- `capture_scenes.mjs`: minimal Vite demo, record 1 segment, assert mp4 duration > 0, non-black frames.
- `remotion-video`: fixed Manifest, render 1s, assert output mp4 decodes.
- E2E: NarraNexus semi-auto → 15s preview → manual review of PiP + alignment.

## Out of scope (YAGNI, first cut)

- Non-web (native/mobile) projects.
- Auto-generating narration copy (user provides script / per-scene narration).
- Advanced motion-graphics beyond intro/lower-thirds/captions.
