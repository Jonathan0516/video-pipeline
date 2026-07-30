# Capture Guide (mode A)

`capture_scenes.mjs` drives the running app with Playwright and records one
video per scene, then transcodes to mp4 with ffmpeg.

## Prerequisites (in the target project)

```bash
npm i -D playwright && npx playwright install chromium   # browser
# ffmpeg must be on PATH
```

Playwright is resolved from the **project's** node_modules (the working dir),
not from the skill package.

## Scene config

```jsonc
{
  "baseUrl": "http://localhost:5173",
  "viewport": { "width": 1920, "height": 1080 },  // record resolution
  "fps": 30,
  "scenes": [
    {
      "id": "dashboard",
      "route": "/dashboard",
      "durationSec": 6,          // how long to hold after actions finish
      "actions": [
        { "type": "wait",   "ms": 800 },
        { "type": "click",  "selector": "text=Reports" },
        { "type": "hover",  "selector": ".chart-card" },
        { "type": "scroll", "y": 500 },
        { "type": "type",   "selector": "#search", "text": "sales" }
      ]
    }
  ]
}
```

### Action types

| type | fields | effect |
|------|--------|--------|
| `wait` | `ms` | pause |
| `click` | `selector`, `timeout?` | click element (Playwright selector, incl. `text=`) |
| `hover` | `selector` | hover |
| `type` | `selector`, `text` | fill an input |
| `scroll` | `y` | smooth-scroll to y |
| `goto` | `url` | navigate mid-scene |

## Tips for clean recordings

- Record at the final delivery resolution (1920×1080 for 1080p).
- Prefer stable selectors (`text=`, `data-testid`, ids) over brittle CSS.
- Seed the app into a good demo state first (log in, pick a workspace) with early
  `goto`/`click`/`type` actions, or a `goto` to a pre-authenticated route.
- `durationSec` is the hold AFTER actions; total clip length ≈ actions time +
  durationSec, then trimmed to `durationSec` frames by ffmpeg — keep actions
  quick or raise `durationSec`.
- Disable app animations that fight determinism if you see flicker (e.g. a
  `?reducedMotion` flag if your app supports one).

## Output

`--out-dir` gets one `<scene-id>.mp4` per scene (h264, yuv420p, no audio).
Point the Manifest's `scene.source.capture` at `assets/<id>.mp4`.
