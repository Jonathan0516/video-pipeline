# project-to-video-source

Read **any frontend web project** and emit a `video-source.json` Manifest +
`assets/` for a narrated product video. Pairs with **`remotion-video`** (renders)
and **`avatar-video-skill`** (NetMind TTS + HeyGen digital human).

读任意前端项目 → 生成视频素材清单（Manifest + 录像/组件），交给 `remotion-video` 渲染。

## Install / 安装

Directory **must be named `project-to-video-source`** (matches `SKILL.md` `name`).

```bash
cp -R project-to-video-source ~/.codex/skills/     # Codex
cp -R project-to-video-source ~/.claude/skills/    # Claude Code
```

Invoke explicitly / 显式调用：
- Claude: `Use /project-to-video-source to read this frontend project into a video-source Manifest.`
- Codex: `Use $project-to-video-source to read this frontend project into a video-source Manifest.`

## Requirements / 依赖

- **Python 3.11+** — `detect_framework.py`, `gen_manifest.py`
- **Node 18+** — `scan_routes.mjs`, `capture_scenes.mjs`
- **capture mode (A):** in the *target project* `npm i -D playwright && npx playwright install chromium`, plus **ffmpeg** on PATH.

## Flow / 流程

```bash
python3 scripts/detect_framework.py <project>                 # framework + dev cmd + port
node    scripts/scan_routes.mjs --src <project>/src --out scenes.draft.json
# edit scenes.draft.json: narration + actions + durations
node    scripts/capture_scenes.mjs --config scenes.draft.json --out-dir assets   # mode A
python3 scripts/gen_manifest.py scenes.draft.json --out video-source.json        # validated Manifest
```

## Tests / 测试

```bash
python3 -m pytest tests/          # detect_framework + gen_manifest
```

## Safety / 安全

Reads the target project read-only. Starting its dev server / a headless browser
runs the project's code locally — confirm before doing so. See `SKILL.md`.
