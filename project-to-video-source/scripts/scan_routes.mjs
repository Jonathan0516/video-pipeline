#!/usr/bin/env node
// Semi-automatic scene drafting: scan a project's source for route definitions
// and emit a scenes-draft JSON (one scene per route) for the user to edit.
//
// Usage:
//   node scan_routes.mjs --src /path/to/project/src --out scenes.draft.json
//
// Supports react-router `<Route path="...">` and `path: "..."` object routes.
// Other frameworks: emits an empty draft with a note so the user fills routes.

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";

function parseArgs(argv) {
  const args = { src: "src", out: "scenes.draft.json", baseUrl: "http://localhost:5173" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--src") args.src = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else if (argv[i] === "--base-url") args.baseUrl = argv[++i];
  }
  return args;
}

const CODE_EXT = new Set([".tsx", ".jsx", ".ts", ".js"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (CODE_EXT.has(extname(name))) files.push(p);
  }
  return files;
}

// A real route path is URL-path-ish: no spaces/newlines/quotes, reasonable length,
// and does not end in a file extension (those are file paths, not routes).
function isRouteLike(s) {
  if (typeof s !== "string" || s.length === 0 || s.length > 60) return false;
  if (!/^[A-Za-z0-9\-_/:*.~]+$/.test(s)) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(s)) return false; // .md, .csv, .txt, .json, ...
  return true;
}

// Collect route paths from both JSX <Route path="x"> and object `path: "x"`.
// The object form is noisy (any `path:` key), so both are validated.
function extractRoutes(src) {
  const routes = new Set();
  const jsx = /<Route[^>]*\bpath=["'`]([^"'`\n]+)["'`]/g;
  const obj = /\bpath:\s*["']([^"'\n]+)["']/g; // single-line string literals only
  let m;
  while ((m = jsx.exec(src))) if (isRouteLike(m[1])) routes.add(m[1]);
  while ((m = obj.exec(src))) if (isRouteLike(m[1])) routes.add(m[1]);
  return routes;
}

function toScene(route) {
  // "/" -> "home"; "/dashboard/:id" -> "dashboard"
  const clean = route.replace(/^\//, "").split("/")[0].replace(/:.*/, "");
  const id = clean || "home";
  return {
    id,
    route: route.replace(/:\w+/g, "1"), // fill params with a placeholder
    durationSec: 6,
    narration: "TODO: narration for this scene.",
    actions: [{ type: "wait", ms: 800 }],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const srcDir = resolve(args.src);

  const all = new Set();
  for (const file of walk(srcDir)) {
    for (const r of extractRoutes(readFileSync(file, "utf8"))) {
      if (!r.startsWith("http") && r !== "*") all.add(r);
    }
  }

  const seenIds = new Set();
  const scenes = [];
  for (const route of [...all].sort()) {
    const scene = toScene(route);
    if (seenIds.has(scene.id)) scene.id = `${scene.id}-${scenes.length}`;
    seenIds.add(scene.id);
    scenes.push(scene);
  }

  const draft = {
    baseUrl: args.baseUrl,
    viewport: { width: 1920, height: 1080 },
    fps: 30,
    _note: scenes.length
      ? "Draft only. Edit narration + actions, drop scenes you don't want, reorder."
      : "No routes auto-detected. Add scenes manually with route + narration + actions.",
    scenes,
  };
  writeFileSync(resolve(args.out), JSON.stringify(draft, null, 2));
  console.log(`[scan] ${scenes.length} route(s) -> ${args.out}`);
}

main();
