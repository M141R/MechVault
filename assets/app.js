/* MechVault — shared interactions: theme, lightbox, scroll-spy, accordion */
(function () {
  "use strict";

  /* ---------- Theme ---------- */
  const THEME_KEY = "mechvault-theme";
  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    document.querySelectorAll(".theme-toggle").forEach((b) => {
      b.innerHTML = t === "dark" ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    });
  }
  applyTheme(getTheme());
  document.addEventListener("click", (e) => {
    const t = e.target.closest(".theme-toggle");
    if (!t) return;
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  /* ---------- Lightbox ---------- */
  let lb = null;
  function ensureLightbox() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = '<button class="lb-close" aria-label="Close">&#10005;</button><img alt="Paper page"/><div class="lb-caption"></div>';
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.classList.contains("lb-close")) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
    return lb;
  }
  function openLightbox(src, caption) {
    const l = ensureLightbox();
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
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-zoom]");
    if (!t) return;
    e.preventDefault();
    openLightbox(t.dataset.zoom, t.dataset.caption || "");
  });

  /* ---------- TOC scroll-spy ---------- */
  const tocLinks = Array.from(document.querySelectorAll(".toc a"));
  const topicEls = tocLinks
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);
  if (tocLinks.length && topicEls.length) {
    const spy = () => {
      const y = window.scrollY + 120;
      let current = topicEls[0] ? topicEls[0].id : null;
      for (const el of topicEls) {
        if (el.offsetTop <= y) current = el.id;
      }
      tocLinks.forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === "#" + current);
      });
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  /* ---------- Accordion ---------- */
  document.addEventListener("click", (e) => {
    const head = e.target.closest(".acc-head");
    if (!head) return;
    const item = head.closest(".acc-item");
    if (item) item.classList.toggle("open");
  });
})();
