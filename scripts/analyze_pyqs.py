#!/usr/bin/env python3
"""
Analyse the real PYQ bank and emit a per-subject high-yield file.

WHAT IT MEASURES
Every question in the subject is matched against every tracker topic's signals,
then scored on recurrence across real papers. Recurrence is the only evidence
we have for "important", so nothing here is invented: a topic with one
appearance is reported as one appearance.

THE BUG THIS FILE REPLACES
The first version only compared a topic against the questions filed under the
same module. That silently zeroed every topic whose questions were filed
elsewhere. In SOM the Euler-buckling questions sit in module 3 while the topic
`som.m4.t1` ("Euler's buckling load") lives in module 4, so a recurring
five-marker scored zero. Matching now runs across the whole subject, and each
topic records the modules it was actually asked in — which also exposes
genuine module-assignment mismatches in the bank instead of hiding them.

HONESTY RULES
- Counts come from src/lib/tracker/pyq-bank.json only.
- No topic is dropped for having no evidence; it is reported with count 0.
- `askedIn` differing from the topic's own module is surfaced, not corrected:
  the bank is the record of what the paper printed, and rewriting it needs a
  decision from the owner, not a heuristic.
"""

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path("D:/Code/MechVault")
BANK = ROOT / "src" / "lib" / "tracker" / "pyq-bank.json"
OUT = ROOT / "src" / "lib" / "tracker" / "high-yield.json"

SIGNALS = {
    # ---------------- SOM ----------------
    "som.m1.t1": [r"principal stress", r"mohr", r"maximum shear",
                  r"normal and shear stress", r"stresses on an inclined plane",
                  r"state of stress", r"butt.weld", r"glue joint", r"glued along"],
    "som.m1.t2": [r"strain rosette", r"strain transformation", r"principal strain",
                  r"measured strain", r"strain components", r"principal strain",
                  r"stress components whose normal", r"stress components acting"],
    "som.m2.t1": [r"shear force and bending moment", r"shear force and bending",
                  r"sfd", r"bm diagram", r"bending moment diagram",
                  r"shear force, bending moment", r"bending moment equation",
                  r"sign convention", r"support reactions?"],
    "som.m2.t2": [r"second moment of area", r"moment of inertia", r"parallel.*axes",
                  r"neutral axis", r"i.section", r"t.section", r"cross.section is made",
                  r"stepped web", r"maximum resisting moment"],
    "som.m2.t3": [r"bending stress", r"shear stress in a beam",
                  r"shearing stress in beam", r"shearing stress of a rectangular beam",
                  r"shear stress of a rectangular beam", r"distribution of shear stress",
                  r"flexure formula", r"flexural stress",
                  r"stress distribution due to bending"],
    "som.m3.t1": [r"double integration", r"macaulay", r"elastic curve",
                  r"maximum deflection", r"deflections?\b", r"deflect the"],
    "som.m3.t2": [r"moment.area", r"moment area"],
    "som.m3.t3": [r"torsion", r"angle of twist", r"power transmitted", r"solid shaft",
                  r"steel shaft", r"circular shaft", r"shafts?\b"],
    "som.m4.t1": [r"buckling", r"euler", r"long column", r"column"],
    "som.m4.t2": [r"castigliano", r"strain energy", r"energy method"],
    "som.m4.t3": [r"thin circular ring", r"energy method", r"half ring",
                  r"circular bar bent"],
    "som.m5.t1": [r"thin cylinder", r"thin.walled", r"thin cylinder", r"hoop stress",
                  r"longitudinal stress", r"circumferential stress", r"tangential stress",
                  r"cylindrical pressure vessel", r"shell"],
    "som.m5.t2": [r"thick cylinder", r"thick-walled", r"thick cylinder", r"lam[eé]"],
    "som.m5.t3": [r"rotating disc", r"disc of uniform"],
    # Curved beams and the shear centre are asked under module 4 in the bank
    # but the syllabus text for SOM does not list them. They are mapped to
    # som.m4.t1 only if the owner decides they belong; until then they stay
    # unmatched and are reported as unmatched questions, not as coverage.
    # ---------------- FM ----------------
    "fm.m1.t1": [r"viscosity", r"viscous", r"surface tension", r"continuum"],
    "fm.m1.t2": [r"centre of pressure", r"center of pressure", r"hydrostatic force"],
    "fm.m1.t3": [r"buoyancy", r"meta.?centre", r"metacentric", r"floatation"],
    "fm.m1.t4": [r"manometer", r"piezometer", r"measurement of pressure"],
    "fm.m2.t1": [r"streamline", r"path ?line", r"streak ?line", r"eulerian", r"lagrangian"],
    "fm.m2.t2": [r"continuity", r"mass conservation", r"conservation of mass"],
    "fm.m2.t3": [r"bernoulli", r"euler.?s equation", r"navier"],
    "fm.m2.t4": [r"venturi", r"pitot", r"orifice", r"torricelli"],
    "fm.m3.t1": [r"reynolds", r"darcy", r"weiso"],
    "fm.m3.t2": [r"minor loss", r"pipes in series", r"pipes in parallel",
                  r"energy gradient", r"hydraulic gradient"],
    "fm.m3.t3": [r"flow measurement", r"discharge", r"coefficient of discharge"],
    "fm.m3.t4": [r"boundary layer", r"separation"],
    "fm.m4.t1": [r"jet on", r"vane", r"pelton"],
    "fm.m4.t2": [r"impulse and reaction", r"draft tube", r"reaction turbine"],
    "fm.m4.t3": [r"unit quantities", r"specific speed", r"governing", r"model law",
                  r"similarity"],
    "fm.m5.t1": [r"manometric head", r"centrifugal pump", r"vane angle",
                  r"work done"],
    "fm.m5.t2": [r"reciprocating pump", r"indicator diagram", r"slip"],
    # ---------------- THERMO ----------------
    "thermo.m1.t1": [r"\bsystem\b", r"surroundings", r"control volume"],
    "thermo.m1.t2": [r"pure substance", r"steam table", r"ideal gas", r"zeroth law"],
    "thermo.m1.t3": [r"work", r"heat"],
    "thermo.m2.t1": [r"first law", r"internal energy"],
    "thermo.m2.t2": [r"enthalpy", r"specific heat"],
    "thermo.m2.t3": [r"steady flow", r"sfee", r"control volume"],
    "thermo.m3.t1": [r"second law", r"heat engine", r"refrigerator", r"heat pump"],
    "thermo.m3.t2": [r"reversib", r"carnot", r"irreversib"],
    "thermo.m4.t1": [r"entropy", r"clausius"],
    "thermo.m4.t2": [r"exergy", r"irreversibility"],
    "thermo.m5.t1": [r"maxwell", r"clausius.?clapeyron", r"joule"],
    # ---------------- MATERIALS ----------------
    "materials.m1.t1": [r"crystal structure", r"unit cell", r"crystallograph"],
    "materials.m1.t2": [r"miller indices", r"crystal direction", r"crystal plane"],
    "materials.m1.t3": [r"crystal defect", r"dislocation", r"vacancy"],
    "materials.m2.t1": [r"phase rule", r"degrees of freedom", r"gibbs"],
    "materials.m2.t2": [r"lever rule", r"binary phase diagram", r"equilibrium diagram"],
    "materials.m2.t3": [r"iron.?carbon", r"fe.?c diagram", r"\bsteel\b", r"cast iron"],
    "materials.m3.t1": [r"ttt", r"transformation curve", r"isothermal"],
    "materials.m3.t2": [r"heat treatment", r"annealing", r"hardening", r"tempering",
                       r"normalizing"],
    "materials.m3.t3": [r"jominy", r"hardenability", r"end.quench"],
    "materials.m4.t1": [r"cast iron", r"grey iron", r"spheroidal"],
    "materials.m4.t2": [r"non.ferrous", r"aluminium alloy", r"brass"],
    "materials.m4.t3": [r"stainless steel", r"superalloy", r"maraging"],
    "materials.m4.t4": [r"ceramic", r"refractory"],
    "materials.m4.t5": [r"polymer", r"composite"],
    "materials.m5.t1": [r"hardness", r"tensile test", r"mechanical propert"],
    "materials.m5.t2": [r"fatigue", r"impact", r"creep"],
    "materials.m5.t3": [r"corrosion", r"oxidation", r"rusting"],
    # ---------------- MANUFACTURING ----------------
    "manufacturing.m1.t1": [r"pattern", r"allowance", r"draft angle", r"sand casting"],
    "manufacturing.m1.t2": [r"gating", r"runner", r"sprue"],
    "manufacturing.m1.t3": [r"die cast", r"centrifugal cast", r"investment cast"],
    "manufacturing.m2.t1": [r"tool geometry", r"rake angle", r"clearance angle",
                            r"single point"],
    "manufacturing.m2.t2": [r"orthogonal cutting", r"shear plane", r"chip"],
    "manufacturing.m2.t3": [r"tool failure", r"tool wear", r"tool life",
                           r"cutting tool material"],
    "manufacturing.m3.t1": [r"lathe", r"turning"],
    "manufacturing.m3.t2": [r"shaper"],
    "manufacturing.m3.t3": [r"milling", r"milling machine", r"drilling"],
    "manufacturing.m3.t4": [r"grinding", r"grinding wheel"],
    "manufacturing.m4.t1": [r"recrystall", r"recovery", r"grain growth", r"cold work",
                            r"hot work"],
    "manufacturing.m4.t2": [r"rolling", r"rolling mill"],
    "manufacturing.m4.t3": [r"forging", r"forging die"],
    "manufacturing.m4.t4": [r"extrusion", r"blanking", r"piercing", r"deep drawing",
                            r"bending"],
    "manufacturing.m5.t1": [r"gas welding", r"oxy.?acetylene"],
    "manufacturing.m5.t2": [r"arc welding", r"mmaw", r"smaw", r"gtaw", r"gmaw",
                            r"submerged arc"],
    "manufacturing.m5.t3": [r"resistance weld", r"solder", r"braz"],
    # ---------------- NUMERICAL ----------------
    "numerical.m1.t1": [r"truncation", r"round.?off", r"significant digit",
                        r"propagation of error"],
    "numerical.m1.t2": [r"bisection", r"regula.?falsi", r"false position"],
    "numerical.m1.t3": [r"newton.?raphson", r"secant"],
    "numerical.m2.t1": [r"gaussian elimination", r"gauss.?jordan"],
    "numerical.m2.t2": [r"\blu\b", r"crout"],
    "numerical.m2.t3": [r"jacobi", r"gauss.?seidel", r"diagonally dominant"],
    "numerical.m3.t1": [r"lagrange"],
    "numerical.m3.t2": [r"divided difference", r"newton.?s divided"],
    "numerical.m3.t3": [r"forward difference", r"backward difference"],
    "numerical.m4.t1": [r"differenti", r"first derivative", r"second derivative"],
    "numerical.m4.t2": [r"trapezoidal", r"trapezium"],
    "numerical.m4.t3": [r"simpson"],
    "numerical.m5.t1": [r"euler.?s method"],
    "numerical.m5.t2": [r"modified euler", r"heun"],
    "numerical.m5.t3": [r"runge.?kutta", r"\brk4\b", r"\brk2\b"],
}


def compile_signals():
    return {k: [re.compile(p, re.I) for p in v] for k, v in SIGNALS.items()}


def main():
    bank = json.loads(BANK.read_text(encoding="utf-8"))
    sigs = compile_signals()

    out = {}
    for slug, subject in bank.items():
        subject_topics = {k: v for k, v in sigs.items() if k.startswith(slug + ".")}

        # Flatten every question in the subject once. Topics are matched
        # against ALL of them, not just their own module's slice.
        questions = []
        for m in subject.get("modules", []):
            for p in m.get("papers", []):
                for q in p.get("questions", []):
                    questions.append({
                        "qno": q.get("qno", ""),
                        "text": q.get("text", ""),
                        "marks": q.get("marks"),
                        "paper": p.get("paper", ""),
                        "type": p.get("type") or "",
                        "inferred": bool(p.get("moduleTagInferred")),
                        "module": m["module"],
                    })

        rows = []
        claimed = set()
        for key, pats in subject_topics.items():
            own_module = int(key.split(".")[1][1:])
            hits = []
            for q in questions:
                if any(pat.search(q["text"]) for pat in pats):
                    hits.append(q)
                    claimed.add(id(q))

            papers = sorted({(h["paper"], h["type"]) for h in hits})
            asked_in = sorted({h["module"] for h in hits})
            rows.append({
                "key": key,
                "module": own_module,
                "appearances": len(hits),
                "papers": len(papers),
                "marks": sum(h["marks"] or 0 for h in hits),
                "softEvidence": any(h["inferred"] for h in hits),
                # Empty when the topic was only ever asked in its own module.
                "crossModule": bool(asked_in) and asked_in != [own_module],
                "askedIn": asked_in,
                "questions": [
                    {"qno": h["qno"], "paper": h["paper"], "type": h["type"],
                     "marks": h["marks"], "module": h["module"]}
                    for h in hits
                ],
            })

        rows.sort(key=lambda r_: (-r_["appearances"], -r_["marks"], r_["key"]))

        modules = []
        for m in subject.get("modules", []):
            mid = m["module"]
            mrows = [r_ for r_ in rows if r_["module"] == mid]
            modules.append({
                "module": mid,
                "name": m.get("name", ""),
                "questionCount": sum(
                    1 for q in questions if q["module"] == mid
                ),
                "paperCount": len({
                    (q["paper"], q["type"]) for q in questions if q["module"] == mid
                }),
                "topics": mrows,
            })

        unmatched = [q for q in questions if id(q) not in claimed]
        out[slug] = {
            "code": subject.get("code", slug.upper()),
            "modules": modules,
            "unmatchedQuestions": [
                {"qno": q["qno"], "paper": q["paper"], "type": q["type"],
                 "module": q["module"], "text": q["text"][:200]}
                for q in unmatched
            ],
        }

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    for slug, s in out.items():
        total_q = sum(m["questionCount"] for m in s["modules"])
        topics = [t for m in s["modules"] for t in m["topics"]]
        zero = [t for t in topics if t["appearances"] == 0]
        cross = [t for t in topics if t["crossModule"]]
        print(f"{slug:14} q={total_q:4}  topics={len(topics):3}  "
              f"zero={len(zero):2}  cross-module={len(cross):2}  "
              f"unmatched-q={len(s['unmatchedQuestions']):3}")

    som = out.get("som", {})
    cross = [t for m in som.get("modules", []) for t in m["topics"] if t["crossModule"]]
    if cross:
        print("\nSOM topics asked outside their own module:")
        for t in cross:
            print(f"   {t['key']} (module {t['module']}) asked in {t['askedIn']}"
                  f"  {t['appearances']}x")
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()