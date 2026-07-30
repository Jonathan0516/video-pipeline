"""Tests for gen_manifest: assemble and validate the video-source Manifest."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import pytest  # noqa: E402
from gen_manifest import build_manifest, validate_manifest, ManifestError  # noqa: E402


def _project():
    return {"name": "Demo", "framework": "react-vite", "devCmd": "npm run dev", "port": 5173}


def _scenes():
    return [
        {"id": "home", "route": "/", "narration": "Welcome to Demo."},
        {"id": "dash", "route": "/dashboard", "narration": "The dashboard.", "durationSec": 8},
    ]


def test_build_capture_manifest_shape():
    m = build_manifest(_project(), mode="capture", scenes=_scenes())
    assert m["mode"] == "capture"
    assert m["project"]["name"] == "Demo"
    assert len(m["scenes"]) == 2
    # capture mode wires an asset path and leaves component null
    home = m["scenes"][0]
    assert home["source"]["capture"] == "assets/home.mp4"
    assert home["source"]["component"] is None


def test_pip_defaults_applied():
    m = build_manifest(_project(), mode="capture", scenes=_scenes())
    assert m["pip"] == {"position": "bottom-left", "widthPct": 26, "margin": 48, "radius": 16}


def test_pip_overrides_merge():
    m = build_manifest(_project(), mode="capture", scenes=_scenes(),
                       pip={"position": "bottom-right", "widthPct": 30})
    assert m["pip"]["position"] == "bottom-right"
    assert m["pip"]["widthPct"] == 30
    assert m["pip"]["margin"] == 48  # untouched default preserved


def test_duration_default_and_override():
    m = build_manifest(_project(), mode="capture", scenes=_scenes())
    assert m["scenes"][0]["durationSec"] == 5   # default
    assert m["scenes"][1]["durationSec"] == 8   # explicit


def test_component_mode_wires_component_source():
    scenes = [{"id": "card", "route": "/", "narration": "A card.",
               "component": {"import": "src/components/dashboard/Card.tsx", "propsFixture": "fixtures/card.ts"}}]
    m = build_manifest(_project(), mode="component", scenes=scenes)
    src = m["scenes"][0]["source"]
    assert src["capture"] is None
    assert src["component"]["import"].endswith("Card.tsx")


def test_validate_accepts_built_manifest():
    m = build_manifest(_project(), mode="capture", scenes=_scenes())
    validate_manifest(m)  # should not raise


def test_validate_rejects_bad_mode():
    m = build_manifest(_project(), mode="capture", scenes=_scenes())
    m["mode"] = "wat"
    with pytest.raises(ManifestError):
        validate_manifest(m)


def test_validate_rejects_duplicate_scene_ids():
    scenes = [{"id": "x", "route": "/", "narration": "a"},
              {"id": "x", "route": "/b", "narration": "b"}]
    with pytest.raises(ManifestError):
        validate_manifest(build_manifest(_project(), mode="capture", scenes=scenes))


def test_build_rejects_empty_narration():
    scenes = [{"id": "x", "route": "/", "narration": ""}]
    with pytest.raises(ManifestError):
        build_manifest(_project(), mode="capture", scenes=scenes)


def test_build_rejects_unknown_mode():
    with pytest.raises(ManifestError):
        build_manifest(_project(), mode="nope", scenes=_scenes())
