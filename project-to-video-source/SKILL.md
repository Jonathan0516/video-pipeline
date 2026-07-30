---
name: project-to-video-source
description: Turn any frontend web project into a video-source Manifest (scenes + assets) for narrated product videos. Use when asked to read/ingest a frontend project (React, Vue, Svelte, Next, Vite, etc.) and produce the source material for a demo/marketing/口播 video — detects the framework and dev server, records the running app scene-by-scene with Playwright (capture mode), or wires selected components for frame-exact Remotion rendering (component mode), then emits video-source.json consumed by the remotion-video skill.
---

# Project → Video Source

## Core Rule

Read **any frontend project** and produce a **`video-source.json` Manifest** plus
an `assets/` folder. This Manifest is the stable contract consumed by the
**`remotion-video`** skill. This skill does NOT render the final video — it only
prepares the source material.

```text
detect framework -> pick mode -> draft scenes -> capture/wire scenes -> emit Manifest
```

This skill is a workflow guide. It grants no network, billing, or filesystem
permissions beyond reading the target project you are pointed at.

## Operating Boundaries

- Read the target project read-only. Never modify the user's frontend source.
- Starting the project's dev server runs its code locally — confirm with the user
  before launching a dev server or a headless browser.
- Keep everything deterministic and offline where possible; the goal is a
  reproducible Manifest, not live data.
- Write outputs only under a work dir you own (default `video-work/`) unless the
  user names another location.
- Do not print secrets from the target project's `.env`.

## Modes (ask the user; default capture)

| Mode | How the main video is produced | Works on any project? |
|------|-------------------------------|-----------------------|
| **capture (A)** | Playwright records the running app scene-by-scene | ✅ yes, default |
| **component (B)** | Import selected components into Remotion, frame-exact | ⚠️ per-project wiring |
| **hybrid** | capture for most scenes, component for a few emphasis shots | mixed |

Capture is the generic path — any framework that runs in a browser works with no
project changes. Component mode is opt-in for precision shots and requires
per-project provider/fixture wiring (see `remotion-video`'s AppShell).

## Required Workflow

### 1. Detect framework

```bash
python3 scripts/detect_framework.py <project-dir>
# -> { framework, devCmd, port }
```

If `framework` is `unknown` or `devCmd` is null, ask the user for the start
command and port.

### 2. Choose mode

Ask the user: capture (A) / component (B) / hybrid. Default A.

### 3. Draft scenes (semi-automatic)

```bash
node scripts/scan_routes.mjs --src <project-dir>/src --out video-work/scenes.draft.json \
  --base-url http://localhost:<port>
```

This scans react-router `<Route path>` / object routes and drafts one scene per
route. **Have the user edit the draft**: keep the scenes they want, set
`narration`, `durationSec`, and `actions` (click/scroll/type to demo the flow).
For non-React routers or when nothing is detected, add scenes by hand.

### 4a. Capture mode: record scenes

Start the project's dev server (confirm first), wait for the port, then:

```bash
cd <project-dir> && npm i -D playwright && npx playwright install chromium
node <skill>/scripts/capture_scenes.mjs --config video-work/scenes.draft.json --out-dir video-work/assets
```

Each scene becomes `video-work/assets/<id>.mp4`. Requires `ffmpeg` on PATH.

### 4b. Component mode: wire components

For each component scene, record in the draft:
`{ id, route, narration, durationSec, component: { import: "src/…/Card.tsx", propsFixture: "fixtures/card.ts" } }`.
The `remotion-video` skill supplies the `AppShell` harness and registry.

### 5. Emit the Manifest

```bash
python3 scripts/gen_manifest.py video-work/scenes.draft.json --out video-work/video-source.json
```

`gen_manifest.py` validates the Manifest (modes, unique scene ids, positive
durations, non-empty narration, pip position). Fix any reported error before
handing off.

### 6. Extract design tokens (optional, improves branding)

Note the project's primary color, font, and logo path (from CSS variables, the
Tailwind config, or `public/`) into the Manifest's `designTokens`. See
`references/framework-detect.md`.

### Hand off

Give `video-work/video-source.json` + `video-work/assets/` to the
**`remotion-video`** skill.

## Failure Policy

- Dev server won't start / port never ready: stop, surface the server's own error, ask the user.
- `scan_routes` finds nothing: fall back to manual scene entry.
- Playwright missing: `npm i -D playwright && npx playwright install chromium` in the target project.
- A capture is black/short: check the route loaded and actions' selectors resolve; re-run that scene only.

## References

- `references/manifest-schema.md` — the Manifest contract, field by field.
- `references/framework-detect.md` — supported stacks, ports, design-token extraction.
- `references/capture-guide.md` — writing scene `actions`, viewport/fps, tips for clean recordings.
