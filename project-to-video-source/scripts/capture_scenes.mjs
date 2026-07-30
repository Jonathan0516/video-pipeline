#!/usr/bin/env node
// Capture (mode A): drive a running frontend with Playwright and record one
// video per scene, then transcode to mp4 with ffmpeg.
//
// Usage:
//   node capture_scenes.mjs --config scenes.config.json --out-dir assets
//
// Requires (installed in the working project, not in the skill package):
//   npm i -D playwright && npx playwright install chromium
//   ffmpeg on PATH
//
// scenes.config.json:
// {
//   "baseUrl": "http://localhost:5173",
//   "viewport": { "width": 1920, "height": 1080 },
//   "fps": 30,
//   "scenes": [
//     { "id": "home", "route": "/", "durationSec": 6,
//       "actions": [ { "type": "wait", "ms": 800 },
//                    { "type": "click", "selector": "text=Dashboard" },
//                    { "type": "scroll", "y": 400 } ] }
//   ]
// }

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Resolve playwright from the *working project* (where it's a devDep), not from
// this script's location inside the skill package.
async function loadPlaywright() {
  const requireFromCwd = createRequire(pathToFileURL(join(process.cwd(), "noop.js")));
  const pwPath = requireFromCwd.resolve("playwright");
  const mod = await import(pathToFileURL(pwPath).href);
  const chromium = mod.chromium ?? mod.default?.chromium; // playwright is CJS
  if (!chromium) throw new Error("playwright loaded but chromium export missing");
  return { chromium };
}

function parseArgs(argv) {
  const args = { config: "scenes.config.json", outDir: "assets" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config") args.config = argv[++i];
    else if (argv[i] === "--out-dir") args.outDir = argv[++i];
  }
  return args;
}

async function runActions(page, actions = []) {
  for (const a of actions) {
    switch (a.type) {
      case "wait":
        await page.waitForTimeout(a.ms ?? 500);
        break;
      case "click":
        await page.click(a.selector, { timeout: a.timeout ?? 5000 });
        break;
      case "hover":
        await page.hover(a.selector, { timeout: a.timeout ?? 5000 });
        break;
      case "type":
        await page.fill(a.selector, a.text ?? "");
        break;
      case "scroll":
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "smooth" }), a.y ?? 0);
        await page.waitForTimeout(500);
        break;
      case "goto":
        await page.goto(a.url, { waitUntil: "networkidle" });
        break;
      default:
        console.warn(`[capture] unknown action type: ${a.type}`);
    }
  }
}

// Transcode the single webm Playwright wrote for a scene into a trimmed mp4.
function transcodeToMp4(webmPath, mp4Path, durationSec, fps) {
  const res = spawnSync(
    "ffmpeg",
    ["-y", "-i", webmPath, "-t", String(durationSec), "-r", String(fps),
     "-pix_fmt", "yuv420p", "-an", mp4Path],
    { stdio: "inherit" }
  );
  if (res.status !== 0) throw new Error(`ffmpeg failed for ${webmPath}`);
}

async function captureScene(chromium, scene, cfg, outDir) {
  const { width, height } = cfg.viewport ?? { width: 1920, height: 1080 };
  const tmpDir = join(outDir, `.rec-${scene.id}`);
  mkdirSync(tmpDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: { dir: tmpDir, size: { width, height } },
  });
  const page = await context.newPage();

  const url = new URL(scene.route ?? "/", cfg.baseUrl).toString();
  await page.goto(url, { waitUntil: "networkidle" });
  await runActions(page, scene.actions);
  await page.waitForTimeout((scene.durationSec ?? 6) * 1000);

  await context.close(); // flushes the webm
  await browser.close();

  const webm = readdirSync(tmpDir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error(`no video recorded for scene ${scene.id}`);
  const mp4Path = join(outDir, `${scene.id}.mp4`);
  transcodeToMp4(join(tmpDir, webm), mp4Path, scene.durationSec ?? 6, cfg.fps ?? 30);
  rmSync(tmpDir, { recursive: true, force: true });
  return mp4Path;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = JSON.parse(readFileSync(resolve(args.config), "utf8"));
  const outDir = resolve(args.outDir);
  mkdirSync(outDir, { recursive: true });

  let chromium;
  try {
    ({ chromium } = await loadPlaywright());
  } catch {
    console.error("[capture] playwright not found in this project. Run: npm i -D playwright && npx playwright install chromium");
    process.exit(3);
  }

  const results = [];
  for (const scene of cfg.scenes) {
    console.log(`[capture] scene ${scene.id} -> ${scene.route ?? "/"}`);
    results.push(await captureScene(chromium, scene, cfg, outDir));
  }
  console.log(`[capture] done: ${results.length} clip(s) in ${outDir}`);
}

main().catch((e) => {
  console.error(`[capture] ${e.message}`);
  process.exit(1);
});
