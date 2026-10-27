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
  const HOME = !!document.querySelector(".hero");
  const COLORS = [[250, 248, 242], [250, 248, 242], [250, 248, 242], [214, 226, 255], [214, 226, 255], [255, 228, 186]];
  const pick = () => COLORS[(Math.random() * COLORS.length) | 0];
  let w, h, dpr, dust = [], stars = [], bright = [], meteors = [], nextMeteor = 1.5;

  // soft glow + light-spike sprites, drawn once per colour and reused every frame
  const sprites = new Map();
  function sprite(col) {
    const key = col.join();
    if (sprites.has(key)) return sprites.get(key);
    const S = 128, o = document.createElement("canvas");
    o.width = o.height = S;
    const g = o.getContext("2d"), m = S / 2, rgb = col.join(",");
    const halo = g.createRadialGradient(m, m, 0, m, m, m * 0.5);
    halo.addColorStop(0, `rgba(${rgb},1)`);
    halo.addColorStop(0.08, `rgba(${rgb},0.8)`);
    halo.addColorStop(0.3, `rgba(${rgb},0.12)`);
    halo.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = halo; g.fillRect(0, 0, S, S);
    const ray = (x1, y1, x2, y2) => {
      const lg = g.createLinearGradient(x1, y1, x2, y2);
      lg.addColorStop(0, `rgba(${rgb},0)`); lg.addColorStop(0.5, `rgba(${rgb},0.9)`); lg.addColorStop(1, `rgba(${rgb},0)`);
      g.strokeStyle = lg; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    };
    ray(0, m, S, m); ray(m, S * 0.18, m, S * 0.82);
    sprites.set(key, o);
    return o;
  }

  function build() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = w * h;
    // a faint diagonal band where the dust gathers, like a far-off galaxy arm
    const ang = -0.42, cx = w / 2, cy = h / 2, diag = Math.hypot(w, h);
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    dust = Array.from({ length: Math.min(2200, Math.round(area / 900)) }, () => {
      let x, y;
      if (Math.random() < 0.55) {
        const along = (Math.random() - 0.5) * diag, off = gauss() * diag * 0.09;
        x = cx + Math.cos(ang) * along - Math.sin(ang) * off;
        y = cy + Math.sin(ang) * along + Math.cos(ang) * off;
      } else { x = Math.random() * w; y = Math.random() * h; }
      return { x, y, r: 0.3 + Math.random() * 0.5, a: 0.25 + Math.random() * 0.55, col: pick(), depth: 0.1 + Math.random() * 0.2 };
    });
    stars = Array.from({ length: Math.min(600, Math.round(area / 2400)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.6 + Math.random() ** 2 * 1.1, base: 0.5 + Math.random() * 0.5, col: pick(),
      phase: Math.random() * 6.3, speed: 0.5 + Math.random() * 1.6, depth: 0.3 + Math.random() * 0.5,
    }));
    bright = Array.from({ length: Math.round(16 + area / 45000) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      size: 22 + Math.random() ** 2 * 44, col: pick(),
      phase: Math.random() * 6.3, speed: 0.4 + Math.random(), depth: 0.6 + Math.random() * 0.4,
    }));
  }

  const wrapY = (y, depth, sy) => { let v = (y - sy * depth * 0.06) % h; return v < 0 ? v + h : v; };

  function spawn(t) {
    const big = Math.random() < 0.14;
    const leftward = Math.random() < 0.75;
    const a = leftward ? Math.PI * (0.76 + Math.random() * 0.14) : Math.PI * (0.1 + Math.random() * 0.14);
    meteors.push({
      x: leftward ? w * (0.35 + Math.random() * 0.75) : w * (Math.random() * 0.6),
      y: -20 + Math.random() * h * 0.45,
      a, born: t, big,
      life: big ? 1.8 + Math.random() * 0.8 : 0.55 + Math.random() * 0.7,
      speed: big ? 380 + Math.random() * 200 : 700 + Math.random() * 600,
      len: big ? 260 + Math.random() * 160 : 70 + Math.random() * 150,
      width: big ? 2.4 : 0.8 + Math.random() * 1,
      col: Math.random() < 0.3 ? [255, 228, 186] : [255, 252, 246],
    });
  }

  function drawMeteor(m, t) {
    const k = (t - m.born) / m.life;
    if (k >= 1) return false;
    const fade = Math.sin(Math.min(1, k * 1.15) * Math.PI) ** 0.8;
    const dist = (t - m.born) * m.speed;
    const ca = Math.cos(m.a), sa = Math.sin(m.a);
    const hx = m.x + ca * dist, hy = m.y + sa * dist;
    const L = m.len * Math.min(1, k * 4);
    const tx = hx - ca * L, ty = hy - sa * L;
    const rgb = m.col.join(",");
    const nx = -sa, ny = ca, hw = m.width / 2;
    const g = ctx.createLinearGradient(hx, hy, tx, ty);
    g.addColorStop(0, `rgba(${rgb},${0.95 * fade})`);
    g.addColorStop(0.3, `rgba(${rgb},${0.35 * fade})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(hx + nx * hw, hy + ny * hw);
    ctx.lineTo(tx, ty);
    ctx.lineTo(hx - nx * hw, hy - ny * hw);
    ctx.arc(hx, hy, hw, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
    ctx.fill();
    const gs = (m.big ? 46 : 22) * fade;
    ctx.globalAlpha = fade * (m.big ? 0.9 : 0.7);
    ctx.drawImage(sprite(m.col), hx - gs / 2, hy - gs / 2, gs, gs);
    ctx.globalAlpha = 1;
    if (m.big) { // big ones leave glittering dust
      for (let i = 0; i < 6; i++) {
        const u = Math.random() * 0.7;
        ctx.fillStyle = `rgba(${rgb},${(1 - u) * fade * 0.6})`;
        ctx.fillRect(hx - ca * L * u + (Math.random() - 0.5) * 8, hy - sa * L * u + (Math.random() - 0.5) * 8, 1.2, 1.2);
      }
    }
    return true;
  }

  function draw(t) {
    t /= 1000;
    ctx.clearRect(0, 0, w, h);
    const s = SKY.shine;
    const sy = scrollY;

    for (const d of dust) {
      ctx.fillStyle = `rgba(${d.col.join(",")},${d.a * (0.45 + 0.55 * s)})`;
      ctx.fillRect(d.x, wrapY(d.y, d.depth, sy), d.r * 2, d.r * 2);
    }
    for (const st of stars) {
      const tw = 0.55 + 0.25 * Math.sin(t * st.speed + st.phase) + 0.2 * Math.sin(t * st.speed * 2.7 + st.phase * 1.3);
      const a = st.base * (0.4 + 0.6 * s * tw);
      ctx.fillStyle = `rgba(${st.col.join(",")},${a})`;
      ctx.beginPath(); ctx.arc(st.x, wrapY(st.y, st.depth, sy), st.r * (1 + 0.3 * s), 0, Math.PI * 2); ctx.fill();
    }
    // the brightest stars bloom with soft halos and light spikes as the sky lights up
    for (const b of bright) {
      const tw = 0.7 + 0.3 * Math.sin(t * b.speed + b.phase);
      const y = wrapY(b.y, b.depth, sy);
      const size = b.size * (0.35 + 0.65 * s) * (0.85 + 0.15 * tw);
      ctx.globalAlpha = (0.35 + 0.65 * s) * tw;
      ctx.drawImage(sprite(b.col), b.x - size / 2, y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;

    // shooting stars: frequent on the homepage, rare elsewhere
    if (!REDUCED) {
      if (t > nextMeteor && meteors.length < 4) {
        spawn(t);
        nextMeteor = t + (HOME ? (0.7 + Math.random() * 1.8) * (1.6 - s * 0.8) : 5 + Math.random() * 7);
      }
      meteors = meteors.filter((m) => drawMeteor(m, t));
      requestAnimationFrame(draw);
    }
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
      head.x += (m.x - head.x) * 0.42;
      head.y += (m.y - head.y) * 0.42;
      const dx = head.x - px, dy = head.y - py;
      const speed = Math.hypot(dx, dy);
      if (speed > 0.4) trail.unshift({ x: head.x, y: head.y });
      else if (trail.length) trail.pop(); // tail pulls in when the mouse rests
      if (trail.length > 9) trail.pop();
      if (speed > 2 && Math.random() < Math.min(0.9, speed / 14)) {
        spark(head.x, head.y, Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 1.2, 0.3 + Math.random() * 0.9);
      }
    } else trail.length = 0;

    const ink = dark ? "23,20,28" : "255,250,240";
    const gold = dark ? "126,95,42" : "207,174,114";

    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94; p.life -= p.decay;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${p.gold ? gold : ink},${p.life * 0.9})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life * 0.8 + 0.2, 0, Math.PI * 2); ctx.fill();
    }

    if (m.on) {
      // tapered tail as one smooth shape
      if (trail.length > 2) {
        const L = [], R = [];
        const n = trail.length;
        for (let i = 0; i < n; i++) {
          const a = trail[Math.max(0, i - 1)], b = trail[Math.min(n - 1, i + 1)];
          const ddx = b.x - a.x, ddy = b.y - a.y, len = Math.hypot(ddx, ddy) || 1;
          const half = 2.4 * (1 - i / (n - 1));
          L.push([trail[i].x - (ddy / len) * half, trail[i].y + (ddx / len) * half]);
          R.push([trail[i].x + (ddy / len) * half, trail[i].y - (ddx / len) * half]);
        }
        const g = ctx.createLinearGradient(trail[0].x, trail[0].y, trail[n - 1].x, trail[n - 1].y);
        g.addColorStop(0, `rgba(${ink},0.9)`);
        g.addColorStop(0.4, `rgba(${gold},0.55)`);
        g.addColorStop(1, `rgba(${gold},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(L[0][0], L[0][1]);
        L.forEach((q) => ctx.lineTo(q[0], q[1]));
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
        ctx.closePath(); ctx.fill();
      }
      const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 11);
      g.addColorStop(0, `rgba(${dark ? gold : ink},0.5)`);
      g.addColorStop(1, `rgba(${dark ? gold : ink},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(head.x, head.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgb(${ink})`;
      ctx.beginPath(); ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2); ctx.fill();
      ring += ((hover ? 15 : 0) - ring) * 0.2;
      if (ring > 0.5) {
        ctx.strokeStyle = `rgba(${gold},${ring / 15})`;
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
