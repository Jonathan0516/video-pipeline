#!/usr/bin/env node
// Render the 15-second preview (or a custom range) from a scaffolded Remotion
// project, honoring the avatar-skill preview gate before a full render.
//
// Usage (run inside the Remotion project dir):
//   node render_preview.mjs [--seconds 15] [--out out/preview.mp4] [--full]
//
// --full renders the whole composition instead of the preview window.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function parseArgs(argv) {
  const a = { seconds: 15, out: "out/preview.mp4", full: false, comp: "ProjectVideo" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--seconds") a.seconds = Number(argv[++i]);
    else if (argv[i] === "--out") a.out = argv[++i];
    else if (argv[i] === "--full") a.full = true;
    else if (argv[i] === "--comp") a.comp = argv[++i];
  }
  return a;
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!existsSync("video-source.json")) {
    console.error("[render] run this inside a scaffolded Remotion project (video-source.json missing)");
    process.exit(2);
  }
  const fps = JSON.parse(readFileSync("video-source.json", "utf8")).render?.fps ?? 30;
  mkdirSync(dirname(resolve(a.full ? a.out.replace("preview", "video") : a.out)), { recursive: true });

  const out = a.full ? a.out.replace("preview", "video") : a.out;
  const cmd = ["remotion", "render", a.comp, out];
  if (!a.full) cmd.push(`--frames=0-${Math.max(1, Math.round(a.seconds * fps) - 1)}`);

  console.log(`[render] npx ${cmd.join(" ")}`);
  const res = spawnSync("npx", cmd, { stdio: "inherit" });
  process.exit(res.status ?? 1);
}

main();
