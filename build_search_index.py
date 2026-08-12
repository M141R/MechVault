import re, html, json, os

ROOT = "/opt/data/fm-fluid-statics-study"
SUBJECTS = {
    "fm.html": "Fluid Mechanics",
    "som.html": "Strength of Materials",
    "thermo.html": "Thermodynamics",
}

def strip_tags(s):
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

entries = []
seen = set()

entries.append({"t": "MechVault — 3rd Semester Study Hub", "s": "Home",
                "u": "index.html", "a": "", "b": "MechVault — BIT Mesra ME 3rd semester study hub for Fluid Mechanics, Strength of Materials and Thermodynamics."})

for fname, subj in SUBJECTS.items():
    path = os.path.join(ROOT, fname)
    with open(path, encoding="utf-8") as f:
        content = f.read()

    for m in re.finditer(r'class="topic"\s+id="([^"]+)">(.*?)</h3>', content, re.DOTALL):
        anchor = m.group(1)
        h3 = strip_tags(m.group(2))
        if not h3:
            continue
        pos = m.end()
        snippet = strip_tags(content[pos:pos + 700])[:180]
        key = (fname, anchor)
        if key in seen:
            continue
        seen.add(key)
        entries.append({
            "t": h3,
            "s": f"{subj} · Notes",
            "u": fname,
            "a": anchor,
            "b": snippet,
        })

    for sec, label in [("syllabus", "Syllabus"), ("cheat", "Cheat Sheet")]:
        if re.search(r'id="' + sec + r'"', content):
            key = (fname, sec)
            if key not in seen:
                seen.add(key)
                entries.append({
                    "t": f"{subj} — {label}",
                    "s": f"{subj} · {label}",
                    "u": fname,
                    "a": sec,
                    "b": f"{label} for {subj} (BIT Mesra 3rd semester).",
                })

out = os.path.join(ROOT, "search-index.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=1)

print("Total entries:", len(entries))
bad = 0
for e in entries:
    if not e["a"]:
        continue
    with open(os.path.join(ROOT, e["u"]), encoding="utf-8") as f:
        c = f.read()
    if f'id="{e["a"]}"' not in c:
        bad += 1
        print("MISSING anchor:", e["u"], "#", e["a"], e["t"])
print("Bad anchors:", bad)
for e in entries[:5]:
    print(" -", e["u"], "#" + e["a"], "|", e["t"])
