"""Tests for detect_framework: classify a frontend project from its package.json."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from detect_framework import detect_framework  # noqa: E402


def _pkg(deps=None, dev_deps=None, scripts=None):
    return {
        "dependencies": deps or {},
        "devDependencies": dev_deps or {},
        "scripts": scripts or {},
    }


def test_react_vite():
    pkg = _pkg(
        deps={"react": "^18", "react-dom": "^18"},
        dev_deps={"vite": "^5", "@vitejs/plugin-react": "^4"},
        scripts={"dev": "vite", "build": "vite build"},
    )
    r = detect_framework(pkg)
    assert r["framework"] == "react-vite"
    assert r["devCmd"] == "npm run dev"
    assert r["port"] == 5173


def test_nextjs():
    pkg = _pkg(deps={"next": "^14", "react": "^18"}, scripts={"dev": "next dev"})
    r = detect_framework(pkg)
    assert r["framework"] == "next"
    assert r["port"] == 3000


def test_vue_vite():
    pkg = _pkg(deps={"vue": "^3"}, dev_deps={"vite": "^5"}, scripts={"dev": "vite"})
    r = detect_framework(pkg)
    assert r["framework"] == "vue-vite"
    assert r["port"] == 5173


def test_svelte():
    pkg = _pkg(dev_deps={"svelte": "^4", "vite": "^5"}, scripts={"dev": "vite"})
    r = detect_framework(pkg)
    assert r["framework"] == "svelte-vite"


def test_dev_script_missing_falls_back_to_first_serve_like_script():
    pkg = _pkg(deps={"react": "^18"}, dev_deps={"vite": "^5"},
               scripts={"start": "vite", "build": "vite build"})
    r = detect_framework(pkg)
    assert r["devCmd"] == "npm run start"


def test_unknown_framework():
    pkg = _pkg(deps={"jquery": "^3"}, scripts={})
    r = detect_framework(pkg)
    assert r["framework"] == "unknown"
    assert r["devCmd"] is None


def test_explicit_port_in_dev_script_overrides_default():
    pkg = _pkg(deps={"react": "^18"}, dev_deps={"vite": "^5"},
               scripts={"dev": "vite --port 4321"})
    r = detect_framework(pkg)
    assert r["port"] == 4321
