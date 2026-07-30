#!/usr/bin/env python3
"""Detect a frontend project's framework, dev command, and port from package.json.

Pure classification helpers plus a small CLI. No network, no side effects beyond
reading the given package.json when invoked as a CLI.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Default dev-server ports by framework family.
_DEFAULT_PORTS = {
    "next": 3000,
    "react-vite": 5173,
    "vue-vite": 5173,
    "svelte-vite": 5173,
    "vite": 5173,
    "angular": 4200,
    "unknown": None,
}

# Scripts that typically start a dev server, in preference order.
_SERVE_SCRIPTS = ("dev", "start", "serve", "preview")


def _all_deps(pkg: dict) -> dict:
    deps = dict(pkg.get("dependencies") or {})
    deps.update(pkg.get("devDependencies") or {})
    return deps


def classify(pkg: dict) -> str:
    """Return a framework id from a package.json dict."""
    deps = _all_deps(pkg)
    has = lambda name: name in deps  # noqa: E731
    has_vite = has("vite")

    if has("next"):
        return "next"
    if has("@angular/core"):
        return "angular"
    if has("react") or has("react-dom"):
        return "react-vite" if has_vite else "react"
    if has("vue"):
        return "vue-vite" if has_vite else "vue"
    if has("svelte") or has("@sveltejs/kit"):
        return "svelte-vite" if has_vite else "svelte"
    if has_vite:
        return "vite"
    return "unknown"


def pick_dev_script(pkg: dict) -> str | None:
    """Return the `npm run <x>` command for the best dev-server script, or None."""
    scripts = pkg.get("scripts") or {}
    for name in _SERVE_SCRIPTS:
        if name in scripts:
            return f"npm run {name}"
    return None


def resolve_port(pkg: dict, framework: str) -> int | None:
    """Resolve the dev port: explicit --port in the dev script wins, else default."""
    scripts = pkg.get("scripts") or {}
    for name in _SERVE_SCRIPTS:
        cmd = scripts.get(name)
        if not cmd:
            continue
        m = re.search(r"--port[= ](\d+)", cmd)
        if m:
            return int(m.group(1))
    return _DEFAULT_PORTS.get(framework)


def detect_framework(pkg: dict) -> dict:
    """Classify a project and resolve its dev command and port."""
    framework = classify(pkg)
    dev_cmd = pick_dev_script(pkg)
    if framework == "unknown":
        # Unknown stack: don't guess a command even if a script exists.
        dev_cmd = None
    return {
        "framework": framework,
        "devCmd": dev_cmd,
        "port": resolve_port(pkg, framework),
    }


def _cli(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Detect frontend framework from package.json")
    ap.add_argument("project", help="Path to the project dir or its package.json")
    args = ap.parse_args(argv)

    p = Path(args.project)
    pkg_path = p / "package.json" if p.is_dir() else p
    if not pkg_path.is_file():
        print(f"error: no package.json at {pkg_path}", file=sys.stderr)
        return 2

    pkg = json.loads(pkg_path.read_text())
    print(json.dumps(detect_framework(pkg), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(_cli())
