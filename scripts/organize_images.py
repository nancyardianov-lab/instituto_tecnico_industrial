#!/usr/bin/env python3
"""Organize images into career folders based on mapping."""
import shutil
from pathlib import Path

SRC = Path("/home/z/my-project/scripts/extracted/images/FOTOS DE LAS CARRERAS (1)")
DST = Path("/home/z/my-project/scripts/career_images")
DST.mkdir(parents=True, exist_ok=True)

# Mapping based on document order:
MAPPING = {
    "instalaciones": ["image1.jpeg", "image2.jpeg", "image3.jpeg", "image4.jpeg", "image5.jpeg"],
    "electricidad": ["image6.jpeg"],
    "computacion": ["image7.jpeg", "image8.jpeg", "image9.jpeg", "image10.jpeg", "image11.jpeg", "image12.jpeg", "image13.jpeg"],
    "costura": ["image14.jpeg", "image15.jpeg", "image16.jpeg", "image17.jpeg", "image18.jpeg", "image19.jpeg"],
    "dibujo": ["image20.jpeg", "image21.jpeg", "image22.jpeg", "image23.jpeg", "image24.jpeg", "image25.jpeg", "image26.jpeg", "image27.jpeg", "image28.jpeg", "image29.jpeg", "image30.jpeg", "image31.jpeg"],
    "mecanica": [],  # No photos available
}

for career, imgs in MAPPING.items():
    target = DST / career
    target.mkdir(parents=True, exist_ok=True)
    for i, img in enumerate(imgs, 1):
        src = SRC / img
        if src.exists():
            # Renaming with sequential numbers per career
            new_name = f"foto_{i:02d}.jpeg"
            shutil.copy2(src, target / new_name)
            print(f"  {career}/{new_name}  ({src.stat().st_size} bytes)")
        else:
            print(f"  MISSING: {src}")

# Also extract the logo image from TRIFOLIAR
import glob
TRI_DIRS = glob.glob("/home/z/my-project/scripts/extracted/images/TRIFOLIAR*")
LOGO_DIR = DST / "logo"
LOGO_DIR.mkdir(parents=True, exist_ok=True)
if TRI_DIRS:
    TRI_DIR = Path(TRI_DIRS[0])
    for f in TRI_DIR.iterdir():
        if f.stat().st_size > 1000:  # Skip tiny images
            shutil.copy2(f, LOGO_DIR / f.name)
            print(f"  logo/{f.name}  ({f.stat().st_size} bytes)")

# Also logo from datos tecnico
DAT_DIR = Path("/home/z/my-project/scripts/extracted/images/datos tecnico")
for f in DAT_DIR.iterdir():
    shutil.copy2(f, LOGO_DIR / f.name)
    print(f"  logo/{f.name}  ({f.stat().st_size} bytes)")

print("\n\n=== Final structure ===")
for d in sorted(DST.iterdir()):
    if d.is_dir():
        files = list(d.iterdir())
        print(f"{d.name}/ ({len(files)} files)")
        for f in sorted(files)[:3]:
            print(f"  {f.name}")
        if len(files) > 3:
            print(f"  ... and {len(files)-3} more")
