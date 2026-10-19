#!/usr/bin/env python3
"""Copies the app screenshots the video is built on into public/shots.

The screenshots come from the docs site (../docs-site/public/screenshots), captured at 2x:
the notebook ones are 2160x1350 (a 1080x675 window), the quick box ones 1600x900. Every scene
redraws the parts that move on top of them, using positions measured on these files (see the
constants in src/components/*Screen.tsx and QuickBox.tsx). If the screenshots change, check
those positions with the Calibration composition in the Studio.

The Turkish quick box and Move dialog screenshots have garbled text from the capture tool; the
video covers that text and types its own, so only their frames are used.
"""
import shutil
import sys
from pathlib import Path

VIDEO = Path(__file__).resolve().parent.parent
SOURCE = VIDEO.parent / "docs-site" / "public" / "screenshots"
TARGET = VIDEO / "public" / "shots"

SHOTS = [f"{name}-{lang}.png" for name in ("quick", "inbox", "page", "page-dark") for lang in ("en", "tr")] + ["move-en.png"]


def main() -> int:
    TARGET.mkdir(parents=True, exist_ok=True)
    missing = [name for name in SHOTS if not (SOURCE / name).exists()]
    if missing:
        print(f"Missing in {SOURCE}: {', '.join(missing)}", file=sys.stderr)
        return 1
    for name in SHOTS:
        shutil.copy2(SOURCE / name, TARGET / name)
        print(f"public/shots/{name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
