#!/usr/bin/env python3
"""Map images to careers based on document.xml structure."""
import zipfile
from xml.etree import ElementTree as ET

DOCX = "/home/z/my-project/upload/FOTOS DE LAS CARRERAS (1).docx"

NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "pic": "http://schemas.openxmlformats.org/drawingml/2006/picture",
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}

with zipfile.ZipFile(DOCX, 'r') as z:
    # Load rels (rId -> media filename)
    rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8")
    rels_tree = ET.fromstring(rels_xml)
    rels = {}
    for r in rels_tree:
        rid = r.attrib.get("Id")
        target = r.attrib.get("Target")
        if "media" in (target or ""):
            rels[rid] = target.replace("media/", "")
    
    print("Rels (rId -> file):")
    for rid, t in rels.items():
        print(f"  {rid} -> {t}")
    
    # Load document.xml and walk paragraphs in order
    doc_xml = z.read("word/document.xml").decode("utf-8")
    doc_tree = ET.fromstring(doc_xml)
    body = doc_tree.find("w:body", NS)
    
    print("\n\n=== Document content in order ===")
    current_career = None
    for elem in body.iter():
        tag = elem.tag.split("}")[-1]
        if tag == "t":
            text = (elem.text or "").strip()
            if text:
                print(f"[TEXT] {text}")
        elif tag == "blip":
            embed = elem.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
            if embed:
                img_file = rels.get(embed, "??")
                print(f"  [IMAGE] rId={embed} -> {img_file}")
