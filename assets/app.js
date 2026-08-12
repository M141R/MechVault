/* ============================================================
   MechVault — interactions
   theme · search · exam toggle (mid/end) · progress tracker
   accordion · scroll-spy · lightbox · KaTeX · keyboard
   ============================================================ */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------------- Theme ---------------- */
  var THEME_KEY = "mechvault-theme";
  function getTheme() {
    var s = localStorage.getItem(THEME_KEY);
    if (s) return s;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    root.setAttribute("data-theme", t);
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.innerHTML = t === "dark"
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    });
  }
  applyTheme(getTheme());
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".theme-toggle");
    if (!t) return;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  /* ---------------- Lightbox ---------------- */
  var lb = null;
  function ensureLightbox() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = '<button class="lb-close" aria-label="Close">&#10005;</button><img alt="Paper page"/><div class="lb-caption"></div>';
    document.body.appendChild(lb);
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.classList.contains("lb-close")) closeLightbox();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLightbox(); });
    return lb;
  }
  function openLightbox(src, caption) {
    var l = ensureLightbox();
    l.querySelector("img").src = src;
    l.querySelector(".lb-caption").textContent = caption || "";
    l.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  window.openLightbox = openLightbox;
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-zoom]");
    if (!t) return;
    e.preventDefault();
    openLightbox(t.getAttribute("data-zoom"), t.getAttribute("data-caption") || "");
  });

  /* ---------------- Accordion ---------------- */
  document.addEventListener("click", function (e) {
    var head = e.target.closest(".acc-head");
    if (!head) return;
    var item = head.closest(".acc-item");
    if (item) item.classList.toggle("open");
  });

  /* ---------------- Auto-accordion: wrap every .answer-block
     so the "test yourself first" collapsible answers work on
     every subject page without hand-editing markup. ---------------- */
  document.querySelectorAll(".answer-block").forEach(function (ab) {
    var item = document.createElement("div");
    item.className = "acc-item";
    var head = document.createElement("div");
    head.className = "acc-head";
    head.innerHTML = 'Show answer <span class="acc-icon">+</span>';
    ab.classList.add("acc-body");
    ab.parentNode.insertBefore(item, ab);
    item.appendChild(head);
    item.appendChild(ab);
  });

  /* ---------------- Scroll-spy (TOC + tabs) ---------------- */
  function spy(links, sections) {
    if (!links.length || !sections.length) return;
    var current = sections[0].id;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) current = en.target.id;
      });
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });
    }, { rootMargin: "-30% 0px -65% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (tocLinks.length) {
    var tocSecs = tocLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    spy(tocLinks, tocSecs);
  }
  var tabLinks = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  if (tabLinks.length) {
    var tabSecs = tabLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    spy(tabLinks, tabSecs);
  }

  /* ---------------- Exam toggle (mid / end) ---------------- */
  var EXAM_KEY = "mechvault-exam";
  var examBtns = Array.prototype.slice.call(document.querySelectorAll(".exam-toggle button"));
  function applyExam(mode) {
    root.setAttribute("data-exam", mode);
    examBtns.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-exam") === mode ? "true" : "false");
    });
  }
  if (examBtns.length) {
    var savedExam = localStorage.getItem(EXAM_KEY) || "end";
    applyExam(savedExam);
    examBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var m = b.getAttribute("data-exam");
        localStorage.setItem(EXAM_KEY, m);
        applyExam(m);
      });
    });
  }

  /* ---------------- Progress tracker ---------------- */
  var pEl = document.querySelector("[data-progress]");
  if (pEl) {
    var mods = (pEl.getAttribute("data-progress") || "M1,M2,M3,M4,M5").split(",").map(function (s) { return s.trim(); });
    var key = "mechvault-progress-" + (location.pathname.split("/").pop() || "home");
    function load() { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { return {}; } }
    function save(o) { localStorage.setItem(key, JSON.stringify(o)); }
    function render() {
      var st = load();
      var done = mods.filter(function (m) { return st[m]; }).length;
      var pct = Math.round((done / mods.length) * 100);
      var ring = pEl.querySelector(".progress-ring");
      if (ring) { ring.style.setProperty("--p", pct); ring.querySelector("span").textContent = pct + "%"; }
      pEl.querySelectorAll(".progress-mods input").forEach(function (inp) {
        var lab = inp.closest("label");
        if (st[inp.value]) { inp.checked = true; lab.classList.add("done"); }
        else { inp.checked = false; lab.classList.remove("done"); }
      });
    }
    var labels = mods.map(function (m) {
      return '<label><input type="checkbox" value="' + m + '"> ' + m + '</label>';
    }).join("");
    pEl.innerHTML =
      '<span class="pp-title">Revision tracker</span>' +
      '<div class="progress-ring" aria-label="progress"><span>0%</span></div>' +
      '<div class="progress-mods">' + labels + '</div>';
    pEl.querySelectorAll(".progress-mods input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var st = load(); st[inp.value] = inp.checked; save(st); render();
      });
    });
    render();
  }

  /* ---------------- Search ---------------- */
  var searchInput = document.querySelector(".search-input");
  var resultsBox = document.querySelector(".search-results");
  if (searchInput && resultsBox) {
    var INDEX = null;
    fetch("search-index.json").then(function (r) { return r.json(); }).then(function (d) { INDEX = d; if (searchInput.value.trim()) run(searchInput.value); }).catch(function () { INDEX = []; });
    function score(item, q) {
      var hay = (item.t + " " + item.s + " " + item.b).toLowerCase();
      var qi = q.toLowerCase();
      if (item.t.toLowerCase().indexOf(qi) !== -1) return 100;
      if (item.s.toLowerCase().indexOf(qi) !== -1) return 60;
      if (hay.indexOf(qi) !== -1) return 30;
      // token match
      var toks = qi.split(/\s+/);
      var c = 0; toks.forEach(function (t) { if (hay.indexOf(t) !== -1) c++; });
      return c > 0 ? 10 + c * 5 : 0;
    }
    function run(q) {
      if (!INDEX || !q.trim()) { resultsBox.classList.remove("open"); return; }
      var hits = INDEX.map(function (it) { return { it: it, s: score(it, q) }; })
        .filter(function (x) { return x.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 8);
      if (!hits.length) {
        resultsBox.innerHTML = '<div class="sr-empty">No matches for "' + q + '"</div>';
        resultsBox.classList.add("open"); return;
      }
      resultsBox.innerHTML = hits.map(function (x) {
        var it = x.it;
        var snip = it.b.length > 120 ? it.b.slice(0, 120) + "…" : it.b;
        return '<a href="' + it.u + (it.a ? "#" + it.a : "") + '">' +
          '<div class="sr-crumb">' + it.s + '</div>' +
          '<div class="sr-title">' + it.t + '</div>' +
          '<div class="sr-snippet">' + snip + '</div></a>';
      }).join("");
      resultsBox.classList.add("open");
    }
    searchInput.addEventListener("input", function () { run(this.value); });
    searchInput.addEventListener("focus", function () { if (this.value) run(this.value); });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search-wrap")) resultsBox.classList.remove("open");
    });
  }

  /* ---------------- KaTeX ---------------- */
  function renderMath() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  }
  if (document.readyState === "complete") renderMath();
  else window.addEventListener("load", renderMath);

  /* ---------------- Keyboard shortcuts ---------------- */
  document.addEventListener("keydown", function (e) {
    var typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
    if (e.key === "/" && !typing && searchInput) { e.preventDefault(); searchInput.focus(); }
    if ((e.key === "t" || e.key === "T") && !typing && !e.metaKey && !e.ctrlKey) {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next); applyTheme(next);
    }
  });

  /* ---------------- Site config (extensibility) ----------------
     GROW THE SITE BY EDITING ONLY THIS BLOCK — no HTML edits required:
       - Add a SUBJECT : push an object into SITE.semesters.sem3.subjects
       - Add a SEMESTER: add SITE.semesters.semN { … } and push "semN" into SITE.order
       - Add a MODULE  : copy a <section data-module="N"> block on the subject page
                         and add the code to that page's data-progress attribute
     The footer subject links and the home subject cards are generated from this. */
  var SITE = {
    semesters: {
      sem3: {
        id: "sem3",
        label: "3rd Semester",
        subjects: [
          { code: "fm", name: "Fluid Mechanics", file: "fm.html",
            sheet: "SHEET FM-01", meta: ["ME24203 / ME203", "8 papers", "15 figures"], progress: 100,
            blurb: "Continuum, fluid properties, hydrostatics, pressure measurement, buoyancy, kinematics — with Bansal book questions and PYQ tables per topic.",
            tags: [{ t: "Notes ready", c: "tag-high" }, { t: "PYQ bank" }, { t: "Cheat sheet" }] },
          { code: "som", name: "Strength of Materials", file: "som.html",
            sheet: "SHEET SOM-01", meta: ["ME205 / ME24205", "8 papers", "2022-2025"], progress: 100,
            blurb: "Stress & strain, principal stresses, beams, bending & shear, deflection, columns, cylinders — full derivation notes written from the paper analysis.",
            tags: [{ t: "Notes ready", c: "tag-high" }, { t: "PYQ bank" }, { t: "Derivations" }] },
          { code: "thermo", name: "Thermodynamics", file: "thermo.html",
            sheet: "SHEET TH-01", meta: ["ME24201 / ME201", "7 papers", "2022-2025"], progress: 72,
            blurb: "Macroscopic vs microscopic, work & heat, first law, properties of steam, second law, nozzles — with the full PYQ bank.",
            tags: [{ t: "Notes expanding", c: "tag-med" }, { t: "PYQ bank" }] }
        ]
      }
      /* sem4: { id:"sem4", label:"4th Semester", subjects:[
           { code:"tom", name:"Theory of Machines", file:"tom.html",
             sheet:"SHEET TOM-01", meta:["ME...", "..."], progress:0,
             blurb:"...", tags:[{ t:"Planned" }] }
         ] }, */
    },
    order: ["sem3"]
  };

  function renderSiteNav() {
    var cur = SITE.semesters[SITE.order[0]];
    document.querySelectorAll("#site-subjects").forEach(function (nav) {
      nav.innerHTML = cur.subjects.map(function (s) {
        return '<a href="' + s.file + '">' + s.name + "</a>";
      }).join("");
    });
    document.querySelectorAll("#site-semester-label").forEach(function (el) {
      el.textContent = cur.label;
    });
    document.querySelectorAll("#site-semesters").forEach(function (nav) {
      nav.innerHTML = SITE.order.length > 1
        ? SITE.order.map(function (id) {
            var s = SITE.semesters[id];
            var active = id === SITE.order[0] ? ' class="active"' : "";
            return '<a href="#" data-sem="' + id + '"' + active + ">" + s.label + "</a>";
          }).join("")
        : "";
    });
    var grid = document.getElementById("subject-cards");
    if (grid) {
      grid.innerHTML = cur.subjects.map(function (s) {
        var tags = (s.tags || []).map(function (t) {
          return '<span class="tag ' + (t.c || "") + '">' + t.t + "</span>";
        }).join("");
        var meta = (s.meta || []).map(function (m) { return "<span>" + m + "</span>"; }).join("");
        return '<a class="card subject-card" href="' + s.file + '">' +
          '<span class="sheet-no">' + s.sheet + "</span>" +
          '<span class="go">&rarr;</span>' +
          "<h3>" + s.name + "</h3>" +
          '<div class="subject-meta">' + meta + "</div>" +
          "<p>" + s.blurb + "</p>" +
          '<div class="subject-bar"><div class="fill" style="width:' + (s.progress || 0) + '%"></div></div>' +
          '<div class="card-tags">' + tags + "</div>" +
        "</a>";
      }).join("");
    }
  }
  renderSiteNav();
})();
