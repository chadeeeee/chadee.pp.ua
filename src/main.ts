import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { CONTACTS, MARQUEE_A, MARQUEE_B, PROJECTS, ROLES, SKILLS, SUPPORT } from "./data";

gsap.registerPlugin(ScrollTrigger);

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document) => Array.from(root.querySelectorAll(s)) as T[];

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
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
  <div class="skill glow">
    <span class="skill-num">0${i + 1}</span>
    <span class="skill-icon">${s.icon}</span>
    <h3>${esc(s.title)}</h3>
    <ul>${s.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
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
  <article class="project glow" style="--h:${p.hue}" data-cursor="${p.live ? "тиць" : "зацінь"}">
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
  <${tag} class="support-card glow${s.featured ? " featured" : ""}" style="--h:${s.hue}" ${attrs}>
    <span class="emoji">${s.emoji}</span>
    <h3>${esc(s.title)}</h3>
    <p>${esc(s.text)}</p>
    <span class="go">${esc(s.go)}</span>
  </${tag}>`;
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
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
document.body.classList.add("loading");

const lenis = reduced ? null : new Lenis({ lerp: 0.09, smoothWheel: true });
if (lenis) {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href")!;
    const target = id === "#top" ? 0 : (document.querySelector(id) as HTMLElement | null);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else window.scrollTo({ top: target === 0 ? 0 : target.offsetTop });
  })
);

const nav = $(".nav");
const bar = $(".progress-bar");
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    bar.style.transform = `scaleX(${self.progress})`;
    nav.classList.toggle("hidden", self.direction === 1 && self.scroll() > 300);
  },
});

/* ═════════════════ Cursor + spotlight ═════════════════ */
if (finePointer && !reduced) {
  document.body.classList.add("has-cursor");
  const cur = $(".cursor");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  const label = $(".cursor-text");
  const spot = $(".spotlight");
  const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
  const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
  const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  const sx = gsap.quickTo(spot, "x", { duration: 1.2, ease: "power3" });
  const sy = gsap.quickTo(spot, "y", { duration: 1.2, ease: "power3" });
  window.addEventListener("pointermove", (e) => {
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); sx(e.clientX); sy(e.clientY);
  });
  document.addEventListener("pointerover", (e) => {
    const t = e.target as HTMLElement;
    const txt = t.closest<HTMLElement>("[data-cursor]");
    const hov = t.closest("a, button, [data-magnetic]");
    cur.classList.toggle("is-text", !!txt && !hov);
    cur.classList.toggle("is-hover", !!hov);
    if (txt) label.textContent = txt.dataset.cursor ?? "";
  });

  // magnetic buttons
  $$("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, .4)" }));
  });

  // cards glow where the mouse is
  $$(".glow").forEach((el) =>
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    })
  );
}

/* ═════════════════ Hero typer ═════════════════ */
const roleEl = $("#role");
function typeRoles() {
  if (reduced) {
    roleEl.textContent = ROLES[0];
    return;
  }
  let r = 0, i = 0, del = false;
  const tick = (): void => {
    const word = ROLES[r];
    if (!del) {
      roleEl.textContent = word.slice(0, ++i);
      if (i === word.length) { del = true; setTimeout(tick, 1700); return; }
      setTimeout(tick, 55 + Math.random() * 60);
      return;
    }
    roleEl.textContent = word.slice(0, --i);
    if (i === 0) { del = false; r = (r + 1) % ROLES.length; setTimeout(tick, 300); return; }
    setTimeout(tick, 28);
  };
  tick();
}

// contact letters do a little hop
$$(".contact-title .char").forEach((c) =>
  c.addEventListener("pointerenter", () => {
    if (gsap.isTweening(c) || reduced) return;
    gsap.timeline().to(c, { y: -18, duration: 0.2, ease: "power2.out" }).to(c, { y: 0, duration: 0.6, ease: "bounce.out" });
  })
);

/* ═════════════════ Clock ═════════════════ */
const clock = $("#clock");
const fmt = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const tickClock = () => (clock.textContent = fmt.format(new Date()));
tickClock();
setInterval(tickClock, 1000);

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

/* ═════════════════ Scroll animations ═════════════════ */
function setupScroll() {
  if (reduced) {
    $$(".about-text .word").forEach((w) => (w.style.opacity = "1"));
    $$<HTMLElement>("[data-count]").forEach((el) => { el.textContent = el.dataset.count!; el.dataset.done = "1"; });
    return;
  }

  // hero gently drifts up and fades as you scroll away
  gsap.to(".hero-title", {
    yPercent: -18, opacity: 0.15, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // marquees speed up with scroll and flip direction
  $$(".marquee").forEach((m) => {
    const dir = +(m.dataset.dir ?? 1);
    const track = $(".marquee-track", m);
    const tween = gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 30, ease: "none", repeat: -1 });
    lenis?.on("scroll", (l: Lenis) => {
      tween.timeScale((l.direction === -1 ? -1 : 1) * (1 + Math.min(Math.abs(l.velocity) * 0.2, 5)));
    });
  });

  $$(".rule").forEach((r) =>
    gsap.from(r, { scaleX: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: r, start: "top 90%" } })
  );

  // titles: letters slide up from a mask
  $$(".big-title [data-split], .contact-title [data-split]").forEach((el) => {
    gsap.from($$(".char", el), {
      yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.03,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // about: words light up as you read
  gsap.to(".about-text .word", {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".about-text", start: "top 80%", end: "bottom 55%", scrub: true },
  });

  const rise = (sel: string, trigger: string, extra: gsap.TweenVars = {}) =>
    gsap.from(sel, { y: 50, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger, start: "top 88%" }, ...extra });
  rise(".about-col", ".about-cols");
  rise(".stat", ".stats");
  rise(".skill", ".skills-grid");
  rise(".support-card", ".support-grid");
  rise(".support-lead", ".support-lead");
  gsap.from(".contact-row", {
    x: -60, opacity: 0, stagger: 0.1, duration: 1, ease: "expo.out",
    scrollTrigger: { trigger: ".contact-list", start: "top 90%" },
  });

  $$<HTMLElement>("[data-count]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: () => {
        const to = +el.dataset.count!;
        const obj = { v: to > 1000 ? to - 30 : 0 };
        gsap.to(obj, {
          v: to, duration: 1.8, ease: "expo.out",
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
          onComplete: () => { el.dataset.done = "1"; el.textContent = el.dataset.count!; },
        });
      },
    });
  });

  // projects: pinned horizontal scroll on desktop, stacked on mobile
  const mm = gsap.matchMedia();
  mm.add("(min-width: 761px)", () => {
    const track = $("#projects-track");
    const cards = $$(".project", track);
    const counter = $("#pc-cur");
    const fill = $(".pc-fill");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: "#projects", start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: (self) => {
          fill.style.transform = `scaleX(${self.progress})`;
          counter.textContent = String(Math.min(cards.length, Math.round(self.progress * (cards.length - 1)) + 1)).padStart(2, "0");
        },
      },
    });
  });
  mm.add("(max-width: 760px)", () => {
    $$(".project").forEach((c) =>
      gsap.from(c, { y: 60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 90%" } })
    );
  });
}

/* ═════════════════ Preloader → intro ═════════════════ */
function intro() {
  const tl = gsap.timeline({
    onComplete: () => {
      document.body.classList.remove("loading");
      lenis?.start();
    },
  });
  tl.to(".pl-word span", { yPercent: -110, duration: 0.6, ease: "power3.in", stagger: 0.03 })
    .to([".pl-bar", ".pl-count"], { opacity: 0, duration: 0.3 }, "<")
    .to("#preloader", { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "-=0.2")
    .set("#preloader", { display: "none" });

  if (reduced) return;
  tl.from(".hero-title .char", { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.04 }, "-=0.5")
    .from(".reveal-up", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, "-=0.9")
    .from(".nav", { y: -80, opacity: 0, duration: 1, ease: "expo.out" }, "-=1")
    .from(".scroll-hint", { opacity: 0, duration: 0.8 }, "-=0.6");
}

function preload() {
  const num = $("#pl-num");
  const fill = $(".pl-fill");
  const obj = { p: 0 };
  if (!reduced) gsap.from(".pl-word span", { yPercent: 110, duration: 0.8, ease: "expo.out", stagger: 0.05 });
  const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  const counter = new Promise<void>((res) =>
    gsap.to(obj, {
      p: 100, duration: reduced ? 0.2 : 1.4, ease: "power2.inOut",
      onUpdate: () => {
        num.textContent = String(Math.round(obj.p));
        fill.style.transform = `scaleX(${obj.p / 100})`;
      },
      onComplete: res,
    })
  );
  Promise.all([fonts, counter]).then(() => {
    setupScroll();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    typeRoles();
    intro();
  });
}
preload();
window.addEventListener("load", () => ScrollTrigger.refresh());
