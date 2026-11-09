import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createScene, type SceneState } from "./scene";
import { createHypercube } from "./hypercube";
import { CONTACTS, MARQUEE_A, MARQUEE_B, PROJECTS, ROLES, SKILLS, SUPPORT } from "./data";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll(s)) as T[];

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const mobile = window.innerWidth < 768 || !finePointer;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/* ═════════════════ Render content from data.ts ═════════════════ */
function fillMarquee(id: string, words: string[]) {
  const html = words.map((w) => `<span class="marquee-item">${esc(w)}</span>`).join("");
  $(`#${id}`).innerHTML = html + html;
}
fillMarquee("mq-a", MARQUEE_A);
fillMarquee("mq-b", MARQUEE_B);

$("#skills-grid").innerHTML = SKILLS.map(
  (s, i) => `
  <div class="skill-wrap" style="perspective:1000px">
    <div class="skill tilt">
      <span class="skill-num">0${i + 1}</span>
      <span class="skill-icon">${s.icon}</span>
      <h3>${esc(s.title)}</h3>
      <ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
    </div>
  </div>`
).join("");

$("#projects-track").innerHTML = PROJECTS.map((p, i) => {
  const badge = p.live
    ? `<span class="badge badge-live">● live</span>`
    : p.repo
      ? `<span class="badge">open source</span>`
      : `<span class="badge">🔒 код закритий</span>`;
  const link = p.live
    ? `<a class="project-link" href="${p.live}" target="_blank" rel="noopener">Глянути вживу ↗</a>`
    : p.repo
      ? `<a class="project-link" href="${p.repo}" target="_blank" rel="noopener">Код на GitHub ↗</a>`
      : "";
  return `
  <article class="project" style="--h:${p.hue}" data-cursor="${p.live ? "тиць" : "зацінь"}">
    <div class="project-art"></div>
    <div class="project-top"><span class="project-idx">${String(i + 1).padStart(2, "0")}</span>${badge}</div>
    <div class="project-body">
      <h3>${esc(p.name)}</h3>
      <div class="tag">${esc(p.tagline)}</div>
      <p>${esc(p.description)}</p>
      <div class="stack">${p.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
      ${link}
    </div>
  </article>`;
}).join("");
$("#pc-total").textContent = String(PROJECTS.length).padStart(2, "0");

type SupportItem = { emoji: string; title: string; text: string; go: string; hue: number; href?: string; action?: () => void; featured?: boolean };
const supportItems: SupportItem[] = [];
if (SUPPORT.monobankJar)
  supportItems.push({ emoji: "🫙", title: "Банка Monobank", text: "Закинь на каву чи на сервер. Навіть 20 гривень — це вже приємно 🙏", go: "задонатити →", hue: 75, href: SUPPORT.monobankJar, featured: true });
if (SUPPORT.usdtTrc20)
  supportItems.push({ emoji: "💎", title: "USDT · TRC20", text: `${SUPPORT.usdtTrc20.slice(0, 6)}…${SUPPORT.usdtTrc20.slice(-6)}`, go: "скопіювати адресу ⧉", hue: 160, action: () => copy(SUPPORT.usdtTrc20, "Адресу скопійовано 💎") });
supportItems.push(
  { emoji: "💼", title: "Замов у мене щось", text: "Найкраща підтримка — це робота. Треба бот, сайт чи застосунок? Пиши, зробимо.", go: "написати в Telegram →", hue: 75, href: "https://t.me/chadeeeeeeeeee", featured: !SUPPORT.monobankJar },
  { emoji: "⭐", title: "Підпишись на GitHub", text: "Безкоштовно, а мені приємно. Там усе нове зʼявляється першим.", go: "github.com/chadeeeee →", hue: 265, href: "https://github.com/chadeeeee" },
  { emoji: "📣", title: "Скинь другу", text: "Є знайомий, якому треба програміст? Скинь йому цей сайт.", go: "поділитися ↗", hue: 320, action: share }
);
$("#support-grid").innerHTML = supportItems
  .map((s, i) => {
    const tag = s.href ? "a" : "button";
    const attrs = s.href ? `href="${s.href}" target="_blank" rel="noopener"` : `type="button" data-action="${i}"`;
    return `
  <div class="support-wrap" style="perspective:1000px">
    <${tag} class="support-card tilt${s.featured ? " featured" : ""}" style="--h:${s.hue}" ${attrs}>
      <span class="emoji">${s.emoji}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
      <span class="go">${esc(s.go)}</span>
    </${tag}>
  </div>`;
  })
  .join("");
$$<HTMLButtonElement>("[data-action]").forEach((b) => b.addEventListener("click", () => supportItems[+b.dataset.action!].action?.()));

$("#contact-list").innerHTML = CONTACTS.map(
  (c) => `
  <a class="contact-row" href="${c.href}" ${c.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
    <span class="mono">${esc(c.label)}</span>
    <span class="val">${esc(c.value)}</span>
    <span class="arr">→</span>
    <span class="mono hint">${esc(c.hint)}</span>
  </a>`
).join("");

/* ═════════════════ Helpers ═════════════════ */
const toastEl = $("#toast");
let toastTimer = 0;
function toast(msg: string) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 2200);
}
async function copy(text: string, msg: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    toast(text);
  }
}
async function share() {
  const url = location.origin.includes("localhost") ? "https://chadee.pp.ua" : location.origin;
  if (navigator.share) {
    try {
      await navigator.share({ title: "chadee — роблю сайти, ботів і застосунки", url });
      return;
    } catch {
      /* cancelled */
    }
  }
  copy(url, "Посилання скопійовано 🚀");
}

function splitChars(el: HTMLElement) {
  const words = (el.textContent ?? "").split(" ");
  el.textContent = "";
  words.forEach((word, wi) => {
    const w = document.createElement("span");
    w.className = "w";
    for (const ch of word) {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch;
      w.appendChild(s);
    }
    el.appendChild(w);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return $$(".char", el);
}
$$("[data-split]").forEach((el) => splitChars(el));

const aboutText = $("[data-words]");
aboutText.innerHTML = (aboutText.textContent ?? "")
  .trim()
  .split(/\s+/)
  .map((w) => `<span class="word">${esc(w)}</span>`)
  .join(" ");

$("#year").textContent = String(new Date().getFullYear());

/* ═════════════════ Smooth scroll ═════════════════ */
const lenis = reduced ? null : new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
if (lenis) {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
document.body.classList.add("loading");
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href")!;
    const target = id === "#top" ? 0 : (document.querySelector(id) as HTMLElement | null);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.8 });
    else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop, behavior: "auto" });
  })
);

/* ═════════════════ WebGL background ═════════════════ */
const scene = createScene($<HTMLCanvasElement>("#bg"), { mobile, reduced });

let mx = 0, my = 0;
window.addEventListener("pointermove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  scene.setMouse((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});

const nav = $(".nav");
const bar = $(".progress-bar");
lenis?.on("scroll", (l: Lenis) => {
  scene.setVelocity(l.velocity);
  nav.classList.toggle("hidden", l.direction === 1 && l.scroll > 300);
});
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    bar.style.transform = `scaleX(${self.progress})`;
    if (!lenis) nav.classList.toggle("hidden", self.direction === 1 && self.scroll() > 300);
  },
});

// Scene choreography: blob flies to a new spot for each section
const looks: [string, Partial<SceneState>][] = [
  [".hero", { blobX: 1.6, blobY: 0.1, blobScale: 1, camZ: 7, hue: 0, spin: 0, warp: 0 }],
  ["#about", { blobX: -2.6, blobY: -0.4, blobScale: 0.62, camZ: 7.5, hue: 0.25, spin: 0.5, warp: 0.1 }],
  ["#skills", { blobX: 2.8, blobY: 1.1, blobScale: 0.55, camZ: 7, hue: 0.45, spin: 1.1, warp: 0.2 }],
  ["#projects", { blobX: 0, blobY: -0.3, blobScale: 1.7, camZ: 9.5, hue: 0.62, spin: 1.6, warp: 0.35 }],
  ["#dimensions", { blobX: 0.5, blobY: 5, blobScale: 0.3, camZ: 8, hue: 0.8, spin: 2.2, warp: 0.1 }],
  ["#support", { blobX: -2.9, blobY: 1.6, blobScale: 0.55, camZ: 7.5, hue: 1.0, spin: 2.8, warp: 0.25 }],
  ["#contact", { blobX: 2.5, blobY: 0.9, blobScale: 0.7, camZ: 7.5, hue: 1.25, spin: 3.4, warp: 0.45 }],
];
looks.forEach(([sel, look]) => {
  const go = () => gsap.to(scene.state, { ...look, duration: 2, ease: "power3.inOut", overwrite: "auto" });
  ScrollTrigger.create({ trigger: sel, start: "top 55%", end: "bottom 45%", onEnter: go, onEnterBack: go });
});

/* ═════════════════ Cursor ═════════════════ */
if (finePointer && !reduced) {
  document.body.classList.add("has-cursor");
  const cur = $(".cursor");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  const label = $(".cursor-text");
  const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
  const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
  const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  window.addEventListener("pointermove", (e) => {
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  });
  document.addEventListener("pointerover", (e) => {
    const t = e.target as HTMLElement;
    const txt = t.closest<HTMLElement>("[data-cursor]");
    const hov = t.closest("a, button, input, [data-magnetic]");
    cur.classList.toggle("is-text", !!txt && !hov);
    cur.classList.toggle("is-hover", !!hov);
    if (txt) label.textContent = txt.dataset.cursor ?? "";
  });
  document.addEventListener("pointerdown", () => gsap.to(ring, { scale: 0.7, duration: 0.15 }));
  document.addEventListener("pointerup", () => gsap.to(ring, { scale: 1, duration: 0.4, ease: "elastic.out(1, .4)" }));
}

/* ═════════════════ Magnetic + tilt ═════════════════ */
if (finePointer && !reduced) {
  $$("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.45);
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, .35)" });
    });
  });

  $$(".tilt").forEach((el) => {
    const max = el.classList.contains("about-card") ? 14 : 10;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
      el.style.setProperty("--ry", `${(px - 0.5) * max}deg`);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
}

/* ═════════════════ Hero details ═════════════════ */
const roleEl = $("#role");
function typeRoles() {
  if (reduced) {
    roleEl.textContent = ROLES[0];
    return;
  }
  let r = 0, i = 0, del = false;
  const tick = () => {
    const word = ROLES[r];
    if (!del) {
      roleEl.textContent = word.slice(0, ++i);
      if (i === word.length) { del = true; return setTimeout(tick, 1700); }
      return setTimeout(tick, 55 + Math.random() * 60);
    }
    roleEl.textContent = word.slice(0, --i);
    if (i === 0) { del = false; r = (r + 1) % ROLES.length; return setTimeout(tick, 300); }
    setTimeout(tick, 28);
  };
  tick();
}

const coords = $("#coords");
const t0 = performance.now();
gsap.ticker.add(() => {
  coords.textContent = `x ${(mx / innerWidth).toFixed(3)} · y ${(my / innerHeight).toFixed(3)} · t ${((performance.now() - t0) / 1000).toFixed(2)}`;
});

// Letters do a flip when you touch them
$$(".hero-title .char, .contact-title .char").forEach((c) => {
  c.addEventListener("pointerenter", () => {
    if (gsap.isTweening(c) || reduced) return;
    gsap.timeline()
      .to(c, { y: -28, rotationY: 180, scale: 1.15, duration: 0.3, ease: "power2.out" })
      .to(c, { y: 0, rotationY: 360, scale: 1, duration: 0.8, ease: "elastic.out(1, .4)" })
      .set(c, { rotationY: 0 });
  });
});

/* ═════════════════ Clock ═════════════════ */
const clock = $("#clock");
const fmt = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", second: "2-digit" });
setInterval(() => (clock.textContent = fmt.format(new Date())), 1000);
clock.textContent = fmt.format(new Date());

/* ═════════════════ Live GitHub stats ═════════════════ */
const repoStat = $("#stat-repos");
fetch("https://api.github.com/users/chadeeeee")
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    if (d && typeof d.public_repos === "number" && d.public_repos > 0) {
      repoStat.dataset.count = String(d.public_repos);
      if (repoStat.dataset.done) repoStat.textContent = String(d.public_repos);
    }
  })
  .catch(() => {});

/* ═════════════════ Hypercube lab ═════════════════ */
const cube = createHypercube($<HTMLCanvasElement>("#hyper"), { reduced });
const range = $<HTMLInputElement>("#dim-range");
const nf = new Intl.NumberFormat("uk-UA");
function setDim(d: number) {
  const { V, E } = cube.setDim(d);
  $("#dim-n").textContent = String(d);
  $("#dim-n-text").textContent = String(d);
  $("#dim-v").textContent = nf.format(V);
  $("#dim-e").textContent = nf.format(E);
  range.value = String(d);
  range.style.setProperty("--fill", `${((d - 3) / 12) * 100}%`);
  $$<HTMLButtonElement>(".dim-presets button").forEach((b) => b.classList.toggle("active", +b.dataset.dim! === d));
  if (!reduced) gsap.fromTo("#dim-n", { scale: 1.4, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.6, ease: "elastic.out(1, .4)" });
}
setDim(4);
range.addEventListener("input", () => setDim(+range.value));
$$<HTMLButtonElement>(".dim-presets button").forEach((b) => b.addEventListener("click", () => setDim(+b.dataset.dim!)));

/* ═════════════════ Scroll animations ═════════════════ */
function setupScroll() {
  if (reduced) {
    $$(".about-text .word").forEach((w) => (w.style.opacity = "1"));
    $$<HTMLElement>("[data-count]").forEach((el) => { el.textContent = el.dataset.count!; el.dataset.done = "1"; });
    return;
  }

  // hero falls back into 3D space as you scroll
  gsap.to(".hero-title", {
    yPercent: -30, rotationX: 35, opacity: 0, transformOrigin: "50% 100%", ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to([".hero-role", ".hero-sub", ".hero-cta", ".hero-eyebrow"], {
    y: -80, opacity: 0, ease: "none", stagger: 0.02,
    scrollTrigger: { trigger: ".hero", start: "20% top", end: "80% top", scrub: true },
  });

  // marquees react to scroll speed
  $$(".marquee").forEach((m) => {
    const dir = +(m.dataset.dir ?? 1);
    const track = $(".marquee-track", m);
    const tween = gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 28, ease: "none", repeat: -1 });
    const skew = gsap.quickTo(track, "skewX", { duration: 0.4 });
    lenis?.on("scroll", (l: Lenis) => {
      const v = l.velocity;
      tween.timeScale((l.direction === -1 ? -1 : 1) * (1 + Math.min(Math.abs(v) * 0.25, 6)));
      skew(gsap.utils.clamp(-12, 12, v * -0.6));
    });
  });

  // section rules draw in
  $$(".rule").forEach((r) =>
    gsap.from(r, { scaleX: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: r, start: "top 90%" } })
  );

  // big titles: chars flip up from below
  $$(".section [data-split], .projects [data-split]").forEach((el) => {
    gsap.from($$(".char", el), {
      yPercent: 110, rotationX: -100, opacity: 0, transformOrigin: "50% 100% -40px",
      duration: 1.1, ease: "expo.out", stagger: 0.035,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // about: words light up as you read
  gsap.to(".about-text .word", {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".about-text", start: "top 80%", end: "bottom 50%", scrub: true },
  });
  gsap.from(".about-card", {
    rotationY: -60, rotationX: 20, z: -400, opacity: 0, duration: 1.6, ease: "expo.out",
    scrollTrigger: { trigger: ".about-card", start: "top 85%" },
  });
  gsap.from(".stat", {
    y: 60, opacity: 0, rotationX: -50, stagger: 0.1, duration: 1, ease: "expo.out",
    scrollTrigger: { trigger: ".stats", start: "top 90%" },
  });
  $$<HTMLElement>("[data-count]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: () => {
        const to = +el.dataset.count!;
        const obj = { v: to > 1000 ? to - 40 : 0 };
        gsap.to(obj, {
          v: to, duration: 2, ease: "expo.out",
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
          onComplete: () => { el.dataset.done = "1"; el.textContent = el.dataset.count!; },
        });
      },
    });
  });

  // skills cards fly in from depth
  gsap.from(".skill-wrap", {
    y: 140, z: -300, rotationX: -45, opacity: 0, stagger: 0.12, duration: 1.4, ease: "expo.out",
    scrollTrigger: { trigger: ".skills-grid", start: "top 85%" },
  });

  // dims + support + contact
  gsap.from(".dims-stage", {
    scale: 0.6, rotationY: 40, opacity: 0, duration: 1.6, ease: "expo.out",
    scrollTrigger: { trigger: ".dims-stage", start: "top 85%" },
  });
  gsap.from(".dim-control", {
    y: 60, opacity: 0, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".dim-control", start: "top 92%" },
  });
  gsap.from(".support-wrap", {
    y: 120, rotationY: 35, rotationX: -20, opacity: 0, stagger: 0.1, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".support-grid", start: "top 88%" },
  });
  gsap.from(".contact-row", {
    x: -120, opacity: 0, stagger: 0.12, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".contact-list", start: "top 90%" },
  });

  // projects: pinned horizontal 3D carousel on desktop, stacked on mobile
  const mm = gsap.matchMedia();
  mm.add("(min-width: 761px)", () => {
    const track = $("#projects-track");
    const cards = $$(".project", track);
    const counter = $("#pc-cur");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const bend = () => {
      const vw = innerWidth;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = (r.left + r.width / 2 - vw / 2) / vw;
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
        c.style.transform = `rotateY(${d * -32}deg) translateZ(${-Math.abs(d) * 220}px) translateY(${Math.abs(d) * 30}px)`;
      });
      counter.textContent = String(best + 1).padStart(2, "0");
    };
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      onUpdate: bend,
      scrollTrigger: { trigger: "#projects", start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true, onRefresh: bend },
    });
    bend();
    return () => cards.forEach((c) => (c.style.transform = ""));
  });
  mm.add("(max-width: 760px)", () => {
    $$(".project").forEach((c) =>
      gsap.from(c, { y: 100, rotationX: -30, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 90%" } })
    );
  });
}

/* ═════════════════ Preloader → intro ═════════════════ */
function intro() {
  const heroChars = $$(".hero-title .char");
  const tl = gsap.timeline({
    onComplete: () => {
      document.body.classList.remove("loading");
      lenis?.start();
    },
  });
  tl.to(".pl-inner", { scale: 1.6, opacity: 0, filter: "blur(12px)", duration: 0.7, ease: "power3.in" })
    .to("#preloader", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.15")
    .set("#preloader", { display: "none" });

  if (reduced) return;
  tl.from(heroChars, {
    x: () => gsap.utils.random(-500, 500),
    y: () => gsap.utils.random(-300, 300),
    z: () => gsap.utils.random(-1200, 600),
    rotationX: () => gsap.utils.random(-180, 180),
    rotationY: () => gsap.utils.random(-180, 180),
    rotationZ: () => gsap.utils.random(-90, 90),
    opacity: 0,
    duration: 2,
    ease: "expo.out",
    stagger: { each: 0.035, from: "random" },
  }, "-=0.8")
    .from(".reveal-up", { y: 50, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 }, "-=1.5")
    .from(".nav", { y: -100, opacity: 0, duration: 1.2, ease: "expo.out" }, "-=1.3")
    .from([".scroll-hint", ".hero-coords"], { opacity: 0, duration: 1 }, "-=0.8");
}

function preload() {
  const num = $("#pl-num");
  const dims = $("#pl-dims");
  const obj = { p: 0 };
  // never let a slow font CDN hold the intro hostage
  const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  const counter = new Promise<void>((res) =>
    gsap.to(obj, {
      p: 100, duration: reduced ? 0.3 : 1.9, ease: "power2.inOut",
      onUpdate: () => {
        num.textContent = String(Math.round(obj.p));
        dims.textContent = `${Math.max(1, Math.ceil((obj.p / 100) * 15))}D`;
      },
      onComplete: res,
    })
  );
  Promise.all([fonts, counter]).then(() => {
    setupScroll();
    // triggers below the pinned projects section were created before the pin — sort by position
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    typeRoles();
    intro();
  });
}
preload();
window.addEventListener("load", () => ScrollTrigger.refresh());
