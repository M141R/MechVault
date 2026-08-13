"""Seed MechVault with a sample Semester 3 / Fluid Mechanics syllabus + real seeded notes."""
import os, shutil
from app import db_models, services

db_models.init_db()
db = db_models.SessionLocal()

OWNER_EMAIL = os.environ.get("MECHVAULT_OWNER_EMAIL", "owner@mechvault.local")
OWNER_PW = os.environ.get("MECHVAULT_OWNER_PW", "owner1234")
if not db.query(db_models.User).filter_by(email=OWNER_EMAIL).first():
    db.add(db_models.User(email=OWNER_EMAIL, name="Owner",
                          password_hash=services.hash_password(OWNER_PW), role="owner"))
    print(f"[seed] created owner  email={OWNER_EMAIL}  password={OWNER_PW}")
else:
    print("[seed] owner already exists")

sem = db.query(db_models.Semester).filter_by(number=3).first()
if not sem:
    sem = db_models.Semester(number=3, name="Mechanical Engineering"); db.add(sem); db.commit()
sub = db.query(db_models.Subject).filter_by(code="ME-201").first()
if not sub:
    sub = db_models.Subject(semester_id=sem.id, name="Fluid Mechanics", code="ME-201"); db.add(sub); db.commit()
mod = db.query(db_models.Module).filter_by(subject_id=sub.id, number=1).first()
if not mod:
    mod = db_models.Module(subject_id=sub.id, number=1, name="Fluid Statics"); db.add(mod); db.commit()

topic_names = [
    "Fluid Properties & Pressure",
    "Pascal's Law & Pressure Measurement",
    "Buoyancy & Floatation",
    "Fluid Kinematics: Lagrangian & Eulerian Descriptions",
]
tids = []
for name in topic_names:
    t = db.query(db_models.Topic).filter_by(module_id=mod.id, name=name).first()
    if not t:
        t = db_models.Topic(module_id=mod.id, name=name); db.add(t); db.commit()
    tids.append(t.id)

NOTE = """## Concept
A **fluid** is a substance that deforms continuously under any applied shear stress (however small). Liquids are nearly incompressible; gases are compressible. The *continuum assumption* treats the fluid as continuously divisible so properties (density, pressure) are point functions.

**Key definitions**
- Density ρ = m/V (kg/m³). Specific weight γ = ρg. Specific gravity = ρ / ρ_water.
- Specific volume = 1/ρ.
- Dynamic viscosity μ: resistance to shear; τ = μ (du/dy).
- Pressure p: normal force per unit area; at a point it is isotropic.

## Key Formulas
- Hydrostatic: `p = p0 + ρ g h`  (gauge: `p = ρ g h`)
- Pascal's law: pressure applied to a confined fluid transmits undiminished in all directions.
- Total force on a plane surface = `p_c · A`, where `p_c` is pressure at the centroid.
- Centre of pressure lies below the centroid for any inclined/vertical surface.

## Derivation / Method
Hydrostatic pressure: take a vertical fluid column of height h and area A. The weight ρ g h A is balanced by the pressure difference → `dp/dz = -ρg` → `p = p0 + ρ g h`.

## Worked Example
**Q:** Gauge pressure at 5 m depth in water (ρ = 1000 kg/m³).
**A:** `p = ρ g h = 1000 · 9.81 · 5 = 49,050 Pa ≈ 49.1 kPa`.

## Common Pitfalls
- Confusing absolute vs gauge pressure (add atmospheric 101.3 kPa for absolute).
- Forgetting pressure is isotropic; don't use vertical-only intuition.
- Buoyancy uses *displaced-fluid* density, not the object's density.

## Exam Tips
- Always state gauge vs absolute.
- Centre-of-pressure: `ȳ_cp = I_G/(A·ȳ) + ȳ`.
- Draw a free-body diagram for floating/immersed bodies.
"""
note = db.query(db_models.Note).filter_by(topic_id=tids[0]).first()
if not note:
    note = db_models.Note(topic_id=tids[0])
note.content_markdown = NOTE
note.status = "published"
note.model = "seeded-by-hermes"
db.add(note); db.commit()
print("[seed] published note for:", topic_names[0])

src = "/opt/data/Module1_Fluid_Statics_Study_Guide.pdf"
if os.path.exists(src) and not db.query(db_models.Paper).filter_by(title="Module 1 Fluid Statics — Study Guide").first():
    dst = os.path.join(db_models.UPLOAD_DIR, "paper_tutorial_1_studyguide.pdf")
    shutil.copy(src, dst)
    text = services.extract_pdf(dst)
    db.add(db_models.Paper(kind="tutorial", subject_id=sub.id, topic_id=tids[0],
                           title="Module 1 Fluid Statics — Study Guide", file_path=dst,
                           extracted_text=text[:20000]))
    db.commit()
    print("[seed] imported tutorial paper from", src)

db.close()
print("[seed] complete.")
