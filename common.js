// Shared on every page: starfield, comet cursor, cart + bag drawer.
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const FREE_SHIP = 150;
const SHIP_STANDARD = 8;

/* ---------- starfield ---------- */
const SKY = { shine: 1 };
(() => {
  const c = document.getElementById("sky");
  if (!c) return;
  const ctx = c.getContext("2d");
  let w, h, dpr, stars = [];

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(700, Math.round((w * h) / 2600));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() ** 2 * 1.2 + 0.35,
      base: Math.random() ** 1.6,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.8,
      depth: 0.2 + Math.random() * 0.8,
      warm: Math.random() < 0.16,
    }));
  }

  function draw(t) {
    t /= 1000;
    ctx.clearRect(0, 0, w, h);
    const s = SKY.shine;
    const sy = scrollY;
    for (const st of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * st.speed + st.phase);
      const dim = 0.12 + st.base * 0.3;
      const lit = Math.min(1, 0.3 + st.base * 0.9) * (0.5 + 0.5 * tw);
      const a = dim + (lit - dim) * s;
      const r = st.r * (1 + 0.45 * s * st.base);
      let y = (st.y - sy * st.depth * 0.06) % h;
      if (y < 0) y += h;
      ctx.fillStyle = st.warm ? `rgba(230,205,160,${a})` : `rgba(244,239,230,${a})`;
      ctx.beginPath();
      ctx.arc(st.x, y, r, 0, Math.PI * 2);
      ctx.fill();
      // the brightest stars get a small four-point glint once the sky lights up
      if (st.base > 0.82 && s > 0.4) {
        const len = r * 7 * s * (0.4 + 0.6 * tw);
        ctx.strokeStyle = `rgba(244,239,230,${a * 0.5})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(st.x - len, y); ctx.lineTo(st.x + len, y);
        ctx.moveTo(st.x, y - len); ctx.lineTo(st.x, y + len);
        ctx.stroke();
      }
    }
    if (!REDUCED) requestAnimationFrame(draw);
  }

  build();
  addEventListener("resize", () => { build(); if (REDUCED) draw(0); });
  if (REDUCED) { SKY.shine = 1; draw(0); } else requestAnimationFrame(draw);
  SKY.redraw = () => REDUCED && draw(0);
})();

/* ---------- comet cursor ---------- */
(() => {
  if (REDUCED || !matchMedia("(pointer: fine)").matches) return;
  const c = document.createElement("canvas");
  c.id = "cursor-fx";
  c.setAttribute("aria-hidden", "true");
  document.body.appendChild(c);
  document.documentElement.classList.add("comet-cursor");
  const ctx = c.getContext("2d");
  let w, h, dpr;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener("resize", size);

  const m = { x: -100, y: -100, on: false };
  const head = { x: -100, y: -100 };
  const trail = [];
  const sparks = [];
  let hover = false, dark = false, ring = 0;

  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (!m.on) { head.x = e.clientX; head.y = e.clientY; }
    m.x = e.clientX; m.y = e.clientY; m.on = true;
    const el = e.target instanceof Element ? e.target : null;
    hover = !!el?.closest("a, button, select, input, label, [role=button]");
    dark = !!el?.closest(".paper, .face, .drawer, .panel, .toast") && !el?.closest(".cover");
  });
  document.addEventListener("pointerleave", () => { m.on = false; });
  addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    for (let i = 0; i < 14; i++) spark(head.x, head.y, Math.random() * Math.PI * 2, 1.2 + Math.random() * 2.2);
  });

  function spark(x, y, ang, sp) {
    sparks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, decay: 0.018 + Math.random() * 0.03, r: 0.5 + Math.random() * 1.3, gold: Math.random() < 0.5 });
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    if (m.on) {
      const px = head.x, py = head.y;
      head.x += (m.x - head.x) * 0.38;
      head.y += (m.y - head.y) * 0.38;
      const dx = head.x - px, dy = head.y - py;
      const speed = Math.hypot(dx, dy);
      trail.unshift({ x: head.x, y: head.y });
      if (trail.length > 16) trail.pop();
      // shed sparks off the back of the comet as it moves
      const n = Math.min(3, speed / 7);
      for (let i = 0; i < n; i++) {
        const back = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 1.1;
        spark(head.x, head.y, back, 0.4 + Math.random() * 1.2);
      }
    } else trail.length = 0;

    const ink = dark ? "23,20,28" : "244,239,230";
    const gold = dark ? "126,95,42" : "207,174,114";

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life -= p.decay;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${p.gold ? gold : ink},${p.life})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + 0.2, 0, Math.PI * 2); ctx.fill();
    }

    if (m.on) {
      for (let i = 1; i < trail.length; i++) {
        const k = 1 - i / trail.length;
        ctx.strokeStyle = `rgba(${i < 4 ? ink : gold},${k * 0.8})`;
        ctx.lineWidth = 3.2 * k;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 10);
      g.addColorStop(0, `rgba(${ink},0.55)`);
      g.addColorStop(1, `rgba(${ink},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(head.x, head.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgb(${ink})`;
      ctx.beginPath(); ctx.arc(head.x, head.y, 2.6, 0, Math.PI * 2); ctx.fill();
      ring += ((hover ? 16 : 0) - ring) * 0.2;
      if (ring > 0.5) {
        ctx.strokeStyle = `rgba(${gold},${ring / 16})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(head.x, head.y, ring, 0, Math.PI * 2); ctx.stroke();
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- cart ---------- */
const Cart = (() => {
  const KEY = "sp-cart";
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch { items = []; }
  items = items.filter((i) => findProduct(i.id));
  const listeners = [];
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    listeners.forEach((fn) => fn());
  };
  return {
    get items() { return items; },
    add(id, size, qty = 1) {
      const hit = items.find((i) => i.id === id && i.size === size);
      if (hit) hit.qty += qty; else items.push({ id, size, qty });
      save();
    },
    setQty(idx, qty) { if (qty < 1) items.splice(idx, 1); else items[idx].qty = qty; save(); },
    remove(idx) { items.splice(idx, 1); save(); },
    clear() { items = []; save(); },
    count: () => items.reduce((s, i) => s + i.qty, 0),
    subtotal: () => items.reduce((s, i) => s + findProduct(i.id).price * i.qty, 0),
    onChange(fn) { listeners.push(fn); },
  };
})();

const ICON = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 5l14 14M19 5L5 19"/></svg>',
};

function photo(p, w = 400) {
  return `<div class="photo"><img src="images/${p.img}-${w}.webp" alt="${p.name}" width="${w}" height="${w}" loading="lazy"></div>`;
}

function lineHTML(it, idx) {
  const p = findProduct(it.id);
  return `<div class="line">
    ${photo(p)}
    <div>
      <h4>${p.name}</h4>
      <div class="meta">${p.drop} · ${it.size}</div>
      <div class="qty" role="group" aria-label="Quantity for ${p.name}">
        <button type="button" data-qty="${idx}" data-d="-1" aria-label="Decrease">−</button>
        <span aria-live="polite">${it.qty}</span>
        <button type="button" data-qty="${idx}" data-d="1" aria-label="Increase">+</button>
      </div>
    </div>
    <div class="right">
      <span class="price">${money(p.price * it.qty)}</span>
      <button type="button" class="remove" data-remove="${idx}">Remove</button>
    </div>
  </div>`;
}

function bindLineButtons(root) {
  root.addEventListener("click", (e) => {
    const q = e.target.closest("[data-qty]");
    if (q) { const i = +q.dataset.qty; Cart.setQty(i, Cart.items[i].qty + +q.dataset.d); }
    const r = e.target.closest("[data-remove]");
    if (r) Cart.remove(+r.dataset.remove);
  });
}

/* ---------- bag drawer ---------- */
const Bag = (() => {
  const scrim = document.createElement("div");
  scrim.className = "scrim";
  const d = document.createElement("aside");
  d.className = "drawer";
  d.setAttribute("role", "dialog");
  d.setAttribute("aria-modal", "true");
  d.setAttribute("aria-labelledby", "bag-title");
  d.innerHTML = `
    <div class="drawer-head"><h2 id="bag-title">Your bag</h2><button class="icon-btn" type="button" data-close aria-label="Close bag">${ICON.close}</button></div>
    <div class="ship-bar"><span data-ship></span><div class="track"><div class="fill" data-fill></div></div></div>
    <div class="drawer-body" data-body></div>
    <div class="drawer-foot" data-foot>
      <div class="sum-row"><span>Subtotal</span><span data-sub></span></div>
      <p class="fine">Shipping and taxes are worked out at checkout.</p>
      <a class="btn" href="checkout.html">Checkout</a>
    </div>`;
  document.body.append(scrim, d);
  const body = d.querySelector("[data-body]");
  let lastFocus = null;

  function render() {
    const items = Cart.items;
    document.querySelectorAll(".bag-count").forEach((el) => {
      if (el.textContent !== String(Cart.count())) { el.textContent = Cart.count(); el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    });
    const sub = Cart.subtotal();
    d.querySelector("[data-sub]").textContent = money(sub);
    d.querySelector("[data-foot]").hidden = !items.length;
    const left = FREE_SHIP - sub;
    d.querySelector("[data-ship]").textContent = left > 0 ? `You're ${money(left)} away from free shipping.` : "Your order ships free.";
    d.querySelector("[data-fill]").style.width = Math.min(100, (sub / FREE_SHIP) * 100) + "%";
    body.innerHTML = items.length
      ? items.map(lineHTML).join("")
      : `<div class="empty"><p>Your bag is empty.</p><a class="btn ghost" href="index.html#catalogue" data-close>Open the catalogue</a></div>`;
  }

  function open() {
    lastFocus = document.activeElement;
    scrim.classList.add("open"); d.classList.add("open");
    setTimeout(() => d.querySelector("[data-close]").focus(), 60);
  }
  function close() {
    scrim.classList.remove("open"); d.classList.remove("open");
    lastFocus?.focus?.();
  }
  scrim.addEventListener("click", close);
  d.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && d.classList.contains("open")) close(); });
  bindLineButtons(body);
  document.querySelectorAll(".bag-btn").forEach((b) => b.addEventListener("click", open));
  Cart.onChange(render);
  render();
  return { open, close };
})();

/* ---------- small helpers ---------- */
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2600);
}

(() => {
  const header = document.querySelector(".site-header");
  const onScroll = () => header?.classList.toggle("solid", scrollY > innerHeight * 0.6 || document.body.dataset.solid === "1");
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());
})();
