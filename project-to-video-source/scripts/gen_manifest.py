#!/usr/bin/env python3
"""Assemble and validate the video-source Manifest.

The Manifest is the stable contract between project-to-video-source (producer)
and remotion-video (consumer). Keep this schema backward-compatible.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

VALID_MODES = ("capture", "component", "hybrid")
DEFAULT_DURATION_SEC = 5
DEFAULT_PIP = {"position": "bottom-left", "widthPct": 26, "margin": 48, "radius": 16}
VALID_PIP_POSITIONS = ("bottom-left", "bottom-right", "top-left", "top-right")


class ManifestError(ValueError):
    """Raised when a Manifest is malformed or cannot be built."""


def _build_source(mode: str, scene: dict) -> dict:
    """Wire the per-scene source object for the given mode."""
    component = scene.get("component")
    if mode == "component" or (mode == "hybrid" and component):
        if not component:
            raise ManifestError(f"scene {scene.get('id')!r}: component mode needs a 'component' spec")
        return {"capture": None, "component": component}
    # capture (and hybrid scenes without a component)
    return {"capture": f"assets/{scene['id']}.mp4", "component": None}


def build_manifest(project: dict, mode: str, scenes: list[dict],
                   design_tokens: dict | None = None, pip: dict | None = None) -> dict:
    """Assemble a Manifest from project info, mode, and a scene list."""
    if mode not in VALID_MODES:
        raise ManifestError(f"unknown mode {mode!r}; expected one of {VALID_MODES}")
    if not scenes:
        raise ManifestError("at least one scene is required")

    pip_merged = {**DEFAULT_PIP, **(pip or {})}

    out_scenes = []
    for scene in scenes:
        sid = scene.get("id")
        if not sid:
            raise ManifestError("every scene needs an 'id'")
        if not (scene.get("narration") or "").strip():
            raise ManifestError(f"scene {sid!r}: narration must be non-empty")
        out_scenes.append({
            "id": sid,
            "route": scene.get("route", "/"),
            "durationSec": scene.get("durationSec", DEFAULT_DURATION_SEC),
            "narration": scene["narration"],
            "source": _build_source(mode, scene),
        })

    manifest = {
        "project": project,
        "mode": mode,
        "designTokens": design_tokens or {},
        "pip": pip_merged,
        "scenes": out_scenes,
    }
    validate_manifest(manifest)
    return manifest


def validate_manifest(m: dict) -> None:
    """Validate a Manifest in place; raise ManifestError on the first problem."""
    if m.get("mode") not in VALID_MODES:
        raise ManifestError(f"invalid mode: {m.get('mode')!r}")
    if not isinstance(m.get("project"), dict) or not m["project"].get("name"):
        raise ManifestError("project.name is required")

    pip = m.get("pip") or {}
    if pip.get("position") not in VALID_PIP_POSITIONS:
        raise ManifestError(f"invalid pip.position: {pip.get('position')!r}")

    scenes = m.get("scenes") or []
    if not scenes:
        raise ManifestError("manifest has no scenes")

    seen = set()
    for s in scenes:
        sid = s.get("id")
        if sid in seen:
            raise ManifestError(f"duplicate scene id: {sid!r}")
        seen.add(sid)
        if not isinstance(s.get("durationSec"), (int, float)) or s["durationSec"] <= 0:
            raise ManifestError(f"scene {sid!r}: durationSec must be a positive number")
        src = s.get("source") or {}
        if not src.get("capture") and not src.get("component"):
            raise ManifestError(f"scene {sid!r}: source needs a capture path or a component spec")


def _cli(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Build a video-source Manifest from a scenes draft")
    ap.add_argument("scenes_json", help="JSON file: {project, mode, scenes, designTokens?, pip?}")
    ap.add_argument("--out", default="video-source.json")
    args = ap.parse_args(argv)

    draft = json.loads(Path(args.scenes_json).read_text())
    try:
        manifest = build_manifest(
            draft["project"], draft.get("mode", "capture"), draft["scenes"],
            design_tokens=draft.get("designTokens"), pip=draft.get("pip"),
        )
    except (ManifestError, KeyError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    Path(args.out).write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"wrote {args.out} ({len(manifest['scenes'])} scenes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(_cli())
