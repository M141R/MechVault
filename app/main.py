"""MechVault — FastAPI app (auth, content, viewer+watermark, progress, dashboard, AI ingest)."""
import os, html, re, json
from datetime import datetime, date
from fastapi import FastAPI, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.status import HTTP_303_SEE_OTHER
from . import db_models, services

BASE_DIR = db_models.BASE_DIR
UPLOAD_DIR = db_models.UPLOAD_DIR
app = FastAPI(title="MechVault")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "app", "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "app", "static")), name="static")
COOKIE = "mv_session"


# ---------- helpers ----------
def current_user(request: Request):
    tok = request.cookies.get(COOKIE)
    if not tok:
        return None
    email = services.read_session(tok)
    return services.get_user_by_email(email) if email else None


def redirect(to):
    return RedirectResponse(to, status_code=HTTP_303_SEE_OTHER)


def inline(s):
    s = html.escape(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    return s


def md_to_html(md):
    if not md:
        return ""
    out, in_ul, in_ol, in_code = [], False, False, False
    for ln in md.split("\n"):
        if ln.strip().startswith("```"):
            if in_code:
                out.append("</pre>"); in_code = False
            else:
                out.append("<pre>"); in_code = True
            continue
        if in_code:
            out.append(html.escape(ln)); continue
        m = re.match(r"^(#{1,4})\s+(.*)", ln)
        if m:
            if in_ul: out.append("</ul>"); in_ul = False
            if in_ol: out.append("</ol>"); in_ol = False
            out.append(f"<h{len(m.group(1))}>{inline(m.group(2))}</h{len(m.group(1))}>"); continue
        m = re.match(r"^(\d+)\.\s+(.*)", ln)
        if m:
            if not in_ol: out.append("<ol>"); in_ol = True
            if in_ul: out.append("</ul>"); in_ul = False
            out.append(f"<li>{inline(m.group(2))}</li>"); continue
        if ln.strip().startswith("- "):
            if not in_ul: out.append("<ul>"); in_ul = True
            if in_ol: out.append("</ol>"); in_ol = False
            out.append(f"<li>{inline(ln.strip()[2:])}</li>"); continue
        if in_ul: out.append("</ul>"); in_ul = False
        if in_ol: out.append("</ol>"); in_ol = False
        if ln.strip() == "":
            continue
        out.append(f"<p>{inline(ln)}</p>")
    if in_ul: out.append("</ul>")
    if in_ol: out.append("</ol>")
    return "\n".join(out)


def ctx(request, **kw):
    u = current_user(request)
    base = {"request": request, "user": u, "ai_on": services.ai_available()}
    base.update(kw)
    return base


# ---------- auth ----------
@app.get("/login", response_class=HTMLResponse)
def login_get(request: Request):
    return templates.TemplateResponse(request,"auth.html", ctx(request, mode="login", error=""))


@app.post("/login")
def login_post(request: Request, email: str = Form(...), password: str = Form(...)):
    u = services.get_user_by_email(email.strip().lower())
    if not u or not services.verify_password(password, u.password_hash):
        return templates.TemplateResponse(request,"auth.html", ctx(request, mode="login", error="Invalid credentials"))
    r = redirect("/dashboard")
    r.set_cookie(COOKIE, services.make_session(u.email), httponly=True)
    return r


@app.get("/register", response_class=HTMLResponse)
def register_get(request: Request):
    return templates.TemplateResponse(request,"auth.html", ctx(request, mode="register", error=""))


@app.post("/register")
def register_post(request: Request, name: str = Form(...), email: str = Form(...),
                 password: str = Form(...)):
    email = email.strip().lower()
    if services.get_user_by_email(email):
        return templates.TemplateResponse(request,"auth.html", ctx(request, mode="register", error="Email already registered"))
    db = db_models.SessionLocal()
    owner_exists = db.query(db_models.User).first()
    u = db_models.User(email=email, name=name, password_hash=services.hash_password(password),
                       role="owner" if not owner_exists else "student", is_approved=True)
    db.add(u); db.commit(); db.close()
    r = redirect("/dashboard")
    r.set_cookie(COOKIE, services.make_session(email), httponly=True)
    return r


@app.post("/logout")
def logout():
    r = redirect("/")
    r.delete_cookie(COOKIE)
    return r


# ---------- public / hero ----------
@app.get("/", response_class=HTMLResponse)
def hero(request: Request):
    db = db_models.SessionLocal()
    sems = db.query(db_models.Semester).order_by(db_models.Semester.number).all()
    db.close()
    return templates.TemplateResponse(request,"hero.html", ctx(request, semesters=sems))


@app.get("/semester/{sid}", response_class=HTMLResponse)
def semester(request: Request, sid: int):
    db = db_models.SessionLocal()
    s = db.query(db_models.Semester).get(sid)
    subs = db.query(db_models.Subject).filter_by(semester_id=sid).all()
    db.close()
    return templates.TemplateResponse(request,"semester.html", ctx(request, semester=s, subjects=subs))


@app.get("/subject/{subid}", response_class=HTMLResponse)
def subject(request: Request, subid: int):
    db = db_models.SessionLocal()
    s = db.query(db_models.Subject).get(subid)
    sem = db.query(db_models.Semester).get(s.semester_id)
    mods = db.query(db_models.Module).filter_by(subject_id=subid).order_by(db_models.Module.number).all()
    modules = []
    for m in mods:
        topics = db.query(db_models.Topic).filter_by(module_id=m.id).all()
        modules.append((m, topics))
    papers = db.query(db_models.Paper).filter_by(subject_id=subid).all()
    db.close()
    return templates.TemplateResponse(request,"subject.html", ctx(request, subject=s, semester=sem,
                                                          modules=modules, papers=papers))


@app.get("/topic/{tid}", response_class=HTMLResponse)
def topic(request: Request, tid: int):
    db = db_models.SessionLocal()
    t = db.query(db_models.Topic).get(tid)
    mod = db.query(db_models.Module).get(t.module_id)
    sub = db.query(db_models.Subject).get(mod.subject_id)
    sem = db.query(db_models.Semester).get(sub.semester_id)
    note = db.query(db_models.Note).filter_by(topic_id=tid).first()
    resources = db.query(db_models.Resource).filter_by(topic_id=tid).all()
    papers = db.query(db_models.Paper).filter_by(topic_id=tid).all()
    prog = None
    u = current_user(request)
    if u:
        prog = db.query(db_models.Progress).filter_by(user_id=u.id, topic_id=tid).first()
    db.close()
    return templates.TemplateResponse(request,"topic.html", ctx(request, topic=t, module=mod, subject=sub,
        semester=sem, note=note, resources=resources, papers=papers, progress=prog,
        note_html=md_to_html(note.content_markdown) if note else ""))


# ---------- paper viewer + watermarked download ----------
@app.get("/paper/{pid}")
def paper(request: Request, pid: int, download: bool = False):
    db = db_models.SessionLocal()
    p = db.query(db_models.Paper).get(pid)
    db.close()
    if not p:
        return Response("Not found", status_code=404)
    u = current_user(request)
    if u and u.role == "owner":
        data = open(p.file_path, "rb").read()
    else:
        email = u.email if u else "guest"
        data = services.add_watermark(p.file_path, email)
    headers = {}
    if download:
        headers["Content-Disposition"] = f'attachment; filename="{p.kind}_{pid}.pdf"'
    return Response(data, media_type="application/pdf", headers=headers)


# ---------- dashboard / analytics ----------
@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    u = current_user(request)
    if not u:
        return redirect("/login")
    db = db_models.SessionLocal()
    subjects = []
    semesters = db.query(db_models.Semester).order_by(db_models.Semester.number).all()
    total_topics = 0
    done_topics = 0
    lag = []  # (subject, module, topic, mastery, freq)
    for sem in semesters:
        for s in db.query(db_models.Subject).filter_by(semester_id=sem.id):
            tcount = 0
            for m in db.query(db_models.Module).filter_by(subject_id=s.id):
                for t in db.query(db_models.Topic).filter_by(module_id=m.id):
                    tcount += 1; total_topics += 1
                    prog = db.query(db_models.Progress).filter_by(user_id=u.id, topic_id=t.id).first()
                    mastery = prog.mastery if prog else 0
                    completed = prog.completed if prog else False
                    if completed: done_topics += 1
                    # frequency = papers referencing topic
                    freq = db.query(db_models.Paper).filter_by(topic_id=t.id).count()
                    lag.append((s.name, m.name, t.name, mastery, freq, t.id))
            if tcount:
                subjects.append(s)
    # study time
    sessions = db.query(db_models.StudySession).filter_by(user_id=u.id).all()
    total_min = sum(x.minutes for x in sessions)
    by_subject = {}
    for x in sessions:
        sname = db.query(db_models.Subject).get(x.subject_id).name if x.subject_id else "—"
        by_subject[sname] = by_subject.get(sname, 0) + x.minutes
    db.close()
    # recommended minutes/week heuristic: 5 hrs per active subject
    rec_week = len(subjects) * 300
    return templates.TemplateResponse(request,"dashboard.html", ctx(request, user=u,
        total_topics=total_topics, done_topics=done_topics, lag=lag,
        total_min=total_min, by_subject=by_subject, rec_week=rec_week,
        subjects=subjects))


# ---------- progress + time logging ----------
@app.post("/progress")
def progress(request: Request, topic_id: int = Form(...), mastery: int = Form(0),
            completed: bool = Form(False)):
    u = current_user(request)
    if not u:
        return redirect("/login")
    db = db_models.SessionLocal()
    p = db.query(db_models.Progress).filter_by(user_id=u.id, topic_id=topic_id).first()
    if not p:
        p = db_models.Progress(user_id=u.id, topic_id=topic_id)
        db.add(p)
    p.mastery = mastery; p.completed = completed; p.updated_at = datetime.utcnow()
    db.commit(); db.close()
    return Response("ok")


@app.post("/api/pulse")
def pulse(request: Request, subject_id: int = Form(...), seconds: int = Form(0)):
    u = current_user(request)
    if not u or subject_id <= 0:
        return Response("ok")
    mins = max(1, round(seconds / 60))
    today = date.today()
    db = db_models.SessionLocal()
    sess = db.query(db_models.StudySession).filter_by(user_id=u.id, subject_id=subject_id,
        source="auto").all()
    same = [x for x in sess if x.created_at.date() == today]
    if same:
        same[0].minutes += mins
        db.commit()
    else:
        db.add(db_models.StudySession(user_id=u.id, subject_id=subject_id, minutes=mins,
                                      source="auto"))
        db.commit()
    db.close()
    return Response("ok")


@app.post("/session/add")
def session_add(request: Request, subject_id: int = Form(...), minutes: int = Form(...),
               note: str = Form("")):
    u = current_user(request)
    if not u:
        return redirect("/login")
    db = db_models.SessionLocal()
    db.add(db_models.StudySession(user_id=u.id, subject_id=subject_id, minutes=minutes,
                                  source="manual", note=note))
    db.commit(); db.close()
    return redirect("/dashboard")


# ---------- admin ----------
def require_owner(request: Request):
    u = current_user(request)
    if not u or u.role != "owner":
        return redirect("/")
    return u


@app.get("/admin", response_class=HTMLResponse)
def admin(request: Request):
    if isinstance(require_owner(request), RedirectResponse):
        return require_owner(request)
    db = db_models.SessionLocal()
    sems = db.query(db_models.Semester).order_by(db_models.Semester.number).all()
    subs = db.query(db_models.Subject).all()
    notes = db.query(db_models.Note).all()
    users = db.query(db_models.User).all()
    topics = db.query(db_models.Topic).all()
    topics_by_id = {t.id: t.name for t in topics}
    mods = db.query(db_models.Module).all()
    db.close()
    return templates.TemplateResponse(request,"admin.html", ctx(request, semesters=sems, subjects=subs,
        notes=notes, users=users, topics=topics, topics_by_id=topics_by_id, modules=mods, ai_on=services.ai_available()))


@app.post("/admin/semester")
def admin_semester(request: Request, number: int = Form(...), name: str = Form(...)):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    db.add(db_models.Semester(number=number, name=name)); db.commit(); db.close()
    return redirect("/admin")


@app.post("/admin/subject")
def admin_subject(request: Request, semester_id: int = Form(...), name: str = Form(...),
                  code: str = Form("")):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    db.add(db_models.Subject(semester_id=semester_id, name=name, code=code)); db.commit(); db.close()
    return redirect("/admin")


@app.post("/admin/module")
def admin_module(request: Request, subject_id: int = Form(...), number: int = Form(...),
                 name: str = Form(...)):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    db.add(db_models.Module(subject_id=subject_id, number=number, name=name)); db.commit(); db.close()
    return redirect("/admin")


@app.post("/admin/topic")
def admin_topic(request: Request, module_id: int = Form(...), name: str = Form(...),
                description: str = Form("")):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    db.add(db_models.Topic(module_id=module_id, name=name, description=description)); db.commit(); db.close()
    return redirect("/admin")


@app.post("/admin/resource")
async def admin_resource(request: Request, topic_id: int = Form(...), kind: str = Form(...),
                         files: list[UploadFile] = File(...)):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    for f in files:
        data = await f.read()
        fname = f.filename
        path = os.path.join(UPLOAD_DIR, f"res_{topic_id}_{kind}_{fname}")
        open(path, "wb").write(data)
        if kind in ("book", "ppt", "syllabus", "other"):
            text = services.extract_pdf(path) if fname.lower().endswith(".pdf") else (
                services.extract_pptx(path) if fname.lower().endswith(".pptx") else "")
            db.add(db_models.Resource(topic_id=topic_id, kind=kind, filename=fname,
                                      extracted_text=text))
            # discard binary for book/ppt to save space
            if kind in ("book", "ppt"):
                try: os.remove(path)
                except Exception: pass
        else:
            db.add(db_models.Resource(topic_id=topic_id, kind=kind, filename=fname,
                                      extracted_text=""))
    db.commit(); db.close()
    # trigger AI generation for the topic
    jid = services.start_generation(topic_id)
    return redirect(f"/admin?job={jid}")


@app.post("/admin/paper")
async def admin_paper(request: Request, kind: str = Form(...), subject_id: int = Form(...),
                      topic_id: int = Form(0), title: str = Form(...),
                      file: UploadFile = File(...)):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    data = await file.read()
    fname = file.filename
    path = os.path.join(UPLOAD_DIR, f"paper_{kind}_{subject_id}_{fname}")
    open(path, "wb").write(data)
    text = services.extract_pdf(path) if fname.lower().endswith(".pdf") else ""
    db.add(db_models.Paper(kind=kind, subject_id=subject_id, topic_id=topic_id or None,
                           title=title, file_path=path, extracted_text=text))
    db.commit(); db.close()
    return redirect("/admin")


@app.post("/admin/note/publish/{nid}")
def note_publish(request: Request, nid: int):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    n = db.query(db_models.Note).get(nid)
    if n: n.status = "published"; db.commit()
    db.close()
    return redirect("/admin")


@app.post("/admin/note/edit/{nid}")
def note_edit(request: Request, nid: int, content: str = Form(...)):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    n = db.query(db_models.Note).get(nid)
    if n: n.content_markdown = content; n.status = "draft"; db.commit()
    db.close()
    return redirect("/admin")


@app.get("/admin/job/{jid}", response_class=HTMLResponse)
def job_status(request: Request, jid: int):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    j = db.query(db_models.Job).get(jid)
    db.close()
    return HTMLResponse(f"<span class='badge'>Job #{jid}: {j.status}</span> {'<small>'+j.message+'</small>' if j.message else ''}")


@app.post("/admin/user/role/{uid}")
def user_role(request: Request, uid: int, role: str = Form(...)):
    if isinstance(require_owner(request), RedirectResponse): return require_owner(request)
    db = db_models.SessionLocal()
    u = db.query(db_models.User).get(uid)
    if u: u.role = role; db.commit()
    db.close()
    return redirect("/admin")


# ---------- markdown endpoint for note preview ----------
@app.get("/note/{nid}/html", response_class=HTMLResponse)
def note_html(request: Request, nid: int):
    db = db_models.SessionLocal()
    n = db.query(db_models.Note).get(nid)
    db.close()
    return HTMLResponse(md_to_html(n.content_markdown) if n else "")
