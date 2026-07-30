# remotion-video

Compose and render a narrated product video with **Remotion** from a
`video-source.json` Manifest: project scenes on the main layer, a **HeyGen
digital-human PiP** bottom-left (muted), and a **NetMind narration** track.

吃 `project-to-video-source` 的 Manifest → Remotion 编排渲染：主画面 = 项目场景，
左下角画中画 = HeyGen 数字人，音轨 = NetMind 配音。

## Install / 安装

Directory **must be named `remotion-video`** (matches `SKILL.md` `name`).

```bash
cp -R remotion-video ~/.codex/skills/     # Codex
cp -R remotion-video ~/.claude/skills/    # Claude Code
```

Invoke explicitly / 显式调用：
- Claude: `Use /remotion-video to render a video from this video-source.json.`
- Codex: `Use $remotion-video to render a video from this video-source.json.`

## Requirements / 依赖

- **Node 18+**, and a Remotion base project (`npm create video@latest -- --blank`).
- **ffmpeg** on PATH.
- Reuses **`avatar-video-skill`** for NetMind TTS + HeyGen (paid; needs
  `NETMIND_API_KEY` + `HEYGEN_API_KEY`).

## Flow / 流程

```bash
npm create video@latest -- --blank video-out && cd video-out && npm i
node <skill>/scripts/scaffold_remotion.mjs --project . \
     --manifest ../video-source.json --assets ../assets \
     --heygen heygen.mp4 --audio narration.mp3 --captions
node <skill>/scripts/render_preview.mjs --seconds 15    # out/preview.mp4  → approve
node <skill>/scripts/render_preview.mjs --full          # out/video.mp4
```

## Templates / 模板

`templates/src/` → `Root.tsx` `Video.tsx` `MainLayer.tsx` `PiP.tsx`
`AppShell.tsx` `Captions.tsx` `scenes.gen.ts` `types.ts`. Copied into the
Remotion project's `src/` by the scaffold.

## Safety / 安全

Keeps the avatar-skill **preview gate**: render 15s → user approval → full render.
NetMind/HeyGen are paid external actions — get approval before the first run.
