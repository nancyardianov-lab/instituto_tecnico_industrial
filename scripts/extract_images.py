#!/usr/bin/env python3
"""Extract all images from docx files and save them organized."""
import zipfile
from pathlib import Path
import shutil

UPLOAD_DIR = Path("/home/z/my-project/upload")
IMG_OUT_DIR = Path("/home/z/my-project/scripts/extracted/images")
IMG_OUT_DIR.mkdir(parents=True, exist_ok=True)

for docx_path in sorted(UPLOAD_DIR.glob("*.docx")):
    stem = docx_path.stem
    target_dir = IMG_OUT_DIR / stem
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n=== Extracting images from: {docx_path.name} ===")
    with zipfile.ZipFile(str(docx_path), 'r') as z:
        image_files = [n for n in z.namelist() if n.startswith("word/media/")]
        print(f"  Found {len(image_files)} images")
        for img in image_files:
            out_name = Path(img).name
            out_path = target_dir / out_name
            with z.open(img) as src, open(out_path, "wb") as dst:
                shutil.copyfileobj(src, dst)
            print(f"    Saved: {out_path}")

print("\n\n=== ALL EXTRACTED IMAGES ===")
for d in sorted(IMG_OUT_DIR.iterdir()):
    print(f"\n{d.name}/")
    for f in sorted(d.iterdir()):
        size = f.stat().st_size
        print(f"  {f.name}  ({size} bytes)")
