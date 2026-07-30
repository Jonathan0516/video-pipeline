#!/usr/bin/env node
// Drop the remotion-video templates + manifest + assets into a Remotion project.
//
// Prereq: create the base project first (interactive-free):
//   npm create video@latest -- --blank my-video
//
// Usage:
//   node scaffold_remotion.mjs --project my-video --manifest video-source.json \
//        --assets ./assets [--heygen heygen.mp4] [--audio narration.mp3]
//
// Copies templates/src/* into <project>/src, the manifest to
// <project>/video-source.json, and assets into <project>/public/assets.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = resolve(HERE, "..", "templates", "src");

function parseArgs(argv) {
  const a = { project: null, manifest: "video-source.json", assets: null, heygen: null, audio: null, captions: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--project") a.project = argv[++i];
    else if (k === "--manifest") a.manifest = argv[++i];
    else if (k === "--assets") a.assets = argv[++i];
    else if (k === "--heygen") a.heygen = argv[++i];
    else if (k === "--audio") a.audio = argv[++i];
    else if (k === "--captions") a.captions = true;
  }
  if (!a.project) throw new Error("--project <remotion-project-dir> is required");
  return a;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const project = resolve(args.project);
  if (!existsSync(project)) throw new Error(`project dir not found: ${project} (run "npm create video@latest -- --blank" first)`);

  // 1. templates -> src
  const srcDir = join(project, "src");
  mkdirSync(srcDir, { recursive: true });
  cpSync(TEMPLATES, srcDir, { recursive: true });

  // 2. assets -> public/assets
  const publicAssets = join(project, "public", "assets");
  mkdirSync(publicAssets, { recursive: true });
  if (args.assets && existsSync(resolve(args.assets))) {
    cpSync(resolve(args.assets), publicAssets, { recursive: true });
  }

  const manifest = JSON.parse(readFileSync(resolve(args.manifest), "utf8"));
  manifest.render = manifest.render ?? {};
  manifest.render.captions = args.captions || !!manifest.render.captions;

  // 3. rewrite scene capture paths to public-relative (assets/<id>.mp4)
  for (const scene of manifest.scenes) {
    if (scene.source?.capture) {
      scene.source.capture = `assets/${basename(scene.source.capture)}`;
    }
  }

  // 4. heygen clip + narration audio -> public/assets
  const copyInto = (srcFile, name) => {
    cpSync(resolve(srcFile), join(publicAssets, name));
    return `assets/${name}`;
  };
  if (args.heygen) manifest.render.heygenClip = copyInto(args.heygen, "heygen.mp4");
  if (args.audio) manifest.render.narrationAudio = copyInto(args.audio, "narration.mp3");

  // 5. write manifest next to src (Root.tsx imports ../video-source.json)
  writeFileSync(join(project, "video-source.json"), JSON.stringify(manifest, null, 2));

  console.log(`[scaffold] templates + manifest + assets installed into ${project}`);
  console.log(`[scaffold] next: cd ${args.project} && npm run dev   (preview)`);
  console.log(`[scaffold]       npx remotion render ProjectVideo out/video.mp4   (full render)`);
}

main();
