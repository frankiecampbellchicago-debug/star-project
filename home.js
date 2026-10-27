const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0z" fill="#cfae72"/></svg>';

/* ---------- hero: stars light up, then the comet writes the name ---------- */
(() => {
  const hero = document.querySelector(".hero");
  const stage = hero.querySelector(".hero-stage");
  const c = document.getElementById("comet");
  const ctx = c.getContext("2d");
  const title = hero.querySelector("h1");
  const intro = hero.querySelector(".hero-intro");
  const hint = hero.querySelector(".hero-hint");
  let w, h, dpr;
  const sparks = [];
  const dust = []; // sparkles left behind along the trail

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = stage.clientWidth; h = stage.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dust.length = 0;
    path();
    for (let i = 0; i < 90; i++) dust.push({ u: Math.random(), off: (Math.random() - 0.5) * 26, r: Math.random() * 1.1 + 0.3, ph: Math.random() * 6.3 });
  }

  // the comet's path: swoops in from the top right and levels out just under
  // the title, so the name ends up sitting on top of the trail
  let P0, P1, P2;
  function path() {
    const r = title.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const y = (r.bottom - sr.top + 26) / h;
    P0 = [1.08, y - 0.24]; P1 = [0.56, y + 0.025]; P2 = [0.07, y];
  }
  function pt(u) {
    const a = (1 - u) ** 2, b = 2 * u * (1 - u), d = u * u;
    return [(a * P0[0] + b * P1[0] + d * P2[0]) * w, (a * P0[1] + b * P1[1] + d * P2[1]) * h];
  }

  const TRAIL = 0.6;
  let lastHead = null;

  // one smooth tapered ribbon from the tail (thin, faded) to the head (wide, bright)
  function ribbon(tail, t, maxW, stops, blur, blurColor) {
    const N = 90, pts = [];
    for (let i = 0; i <= N; i++) pts.push(pt(tail + ((t - tail) * i) / N));
    const left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const half = (maxW / 2) * (i / N) ** 1.4;
      left.push([pts[i][0] + nx * half, pts[i][1] + ny * half]);
      right.push([pts[i][0] - nx * half, pts[i][1] - ny * half]);
    }
    const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[N][0], pts[N][1]);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    ctx.save();
    ctx.fillStyle = g;
    ctx.shadowBlur = blur; ctx.shadowColor = blurColor;
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    left.forEach((q) => ctx.lineTo(q[0], q[1]));
    ctx.arc(pts[N][0], pts[N][1], maxW / 2, 0, Math.PI * 2);
    for (let i = N; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw(time, p) {
    ctx.clearRect(0, 0, w, h);
    const t = easeInOut(clamp((p - 0.26) / 0.5));
    if (t <= 0) { title.style.setProperty("--x", w + 200 + "px"); lastHead = null; return; }

    const head = pt(t);
    const tail = Math.max(0, t - TRAIL);

    // soft outer glow, then the bright core
    ribbon(tail, t, 22, [[0, "rgba(207,174,114,0)"], [0.55, "rgba(207,174,114,0.06)"], [1, "rgba(232,212,170,0.28)"]], 28, "rgba(207,174,114,0.5)");
    ribbon(tail, t, 5, [[0, "rgba(207,174,114,0)"], [0.45, "rgba(222,198,152,0.35)"], [0.85, "rgba(246,236,214,0.85)"], [1, "rgba(255,252,245,1)"]], 12, "rgba(255,240,210,0.6)");

    // sparkles hanging in the trail, thicker near the head
    for (const d of dust) {
      const q = pt(tail + (t - tail) * d.u);
      const a = d.u ** 1.5 * (0.35 + 0.65 * Math.sin(time / 380 + d.ph) ** 2);
      ctx.fillStyle = `rgba(250,240,220,${a})`;
      ctx.beginPath(); ctx.arc(q[0], q[1] + d.off * (1 - d.u * 0.6), d.r, 0, Math.PI * 2); ctx.fill();
    }

    // the head: halo, light spikes and a white-hot core
    const flick = 1 + Math.sin(time / 110) * 0.05 + Math.sin(time / 37) * 0.02;
    const R = 46 * flick;
    const halo = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], R);
    halo.addColorStop(0, "rgba(255,252,245,0.9)");
    halo.addColorStop(0.12, "rgba(250,234,200,0.45)");
    halo.addColorStop(0.4, "rgba(207,174,114,0.12)");
    halo.addColorStop(1, "rgba(207,174,114,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(head[0], head[1], R, 0, Math.PI * 2); ctx.fill();
    const spike = (dx, dy, len) => {
      const g = ctx.createLinearGradient(head[0], head[1], head[0] + dx * len, head[1] + dy * len);
      g.addColorStop(0, "rgba(255,250,240,0.8)");
      g.addColorStop(1, "rgba(255,250,240,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(head[0], head[1]); ctx.lineTo(head[0] + dx * len, head[1] + dy * len); ctx.stroke();
    };
    const sl = 70 * flick, sv = 28 * flick;
    spike(1, 0, sl); spike(-1, 0, sl); spike(0, 1, sv); spike(0, -1, sv);
    ctx.fillStyle = "#fffdf8";
    ctx.beginPath(); ctx.arc(head[0], head[1], 3.2, 0, Math.PI * 2); ctx.fill();

    // sparks fly off the head while it moves
    if (lastHead && !REDUCED) {
      const dx = head[0] - lastHead[0], dy = head[1] - lastHead[1];
      const n = Math.min(3, Math.hypot(dx, dy) / 4);
      for (let i = 0; i < n; i++) {
        const ang = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 1.2;
        const sp = 0.4 + Math.random() * 1.4;
        sparks.push({ x: head[0], y: head[1], vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + 0.1, life: 1, decay: 0.01 + Math.random() * 0.018 });
      }
    }
    lastHead = head;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vx *= 0.97; s.vy *= 0.97; s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(246,232,204,${s.life * 0.9})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.1 * s.life + 0.2, 0, Math.PI * 2); ctx.fill();
    }

    // the name fades in, letter by letter, in the comet's wake
    title.style.setProperty("--x", (t >= 0.999 ? -300 : head[0] + 8) + "px");
  }

  function progress() {
    const r = hero.getBoundingClientRect();
    return clamp(-r.top / (hero.offsetHeight - innerHeight));
  }

  function tick(time) {
    const p = progress();
    SKY.shine = easeInOut(clamp(p / 0.3));
    intro.style.opacity = 1 - clamp(p / 0.12);
    hint.style.opacity = 1 - clamp(p / 0.04);
    hero.classList.toggle("done", p > 0.8);
    draw(time, p);
    requestAnimationFrame(tick);
  }

  size();
  addEventListener("resize", size);
  if (REDUCED) {
    hero.classList.add("static", "done");
    const once = () => { size(); draw(0, 1); };
    once();
    addEventListener("resize", once);
  } else requestAnimationFrame(tick);
})();

/* ---------- the catalogue: a book you flip through ---------- */
(() => {
  const book = document.getElementById("book");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const status = document.getElementById("page-status");
  const tabs = document.getElementById("drop-tabs");

  const lastWordAccent = (s) => {
    const parts = s.split(" ");
    const last = parts.pop();
    return (parts.length ? parts.join(" ") + " " : "") + `<span class="accent">${last}</span>`;
  };

  function buyRow(p) {
    const def = p.sizes.includes("M") ? "M" : p.sizes[0];
    const opts = p.sizes.map((s) => `<option${s === def ? " selected" : ""}>${s}</option>`).join("");
    return `<div class="buy-row" data-id="${p.id}">
      ${p.sizes.length > 1 ? `<select class="size" aria-label="Size for ${p.name}">${opts}</select>` : `<select class="size" aria-label="Size for ${p.name}" hidden><option>${def}</option></select>`}
      <button class="btn small" type="button" data-buy>Buy now</button>
      <button class="btn ghost small" type="button" data-add>Add to bag</button>
    </div>`;
  }

  const foot = (l, r) => `<div class="page-foot"><span>${l}</span><span>${r}</span></div>`;

  // build the page list in reading order
  const pages = [];
  pages.push({ label: "Cover", html: `<div class="page cover">
      <div class="cover-star">${STAR_SVG}</div>
      <h3>Star Project</h3>
      <div class="vol">Catalogue, Volume One</div>
      <p>${DROPS.length} drops inside. Turn the page to begin.</p>
      <button class="btn ghost small" type="button" data-go-next>Open the catalogue</button>
      ${foot("Vol. 01", new Date().getFullYear())}
    </div>` });
  DROPS.forEach((d, i) => {
    const [feat, ...rest] = d.products;
    const label = `Drop ${d.no}: ${d.name}`;
    pages.push({ label, drop: i, html: `<div class="page paper">
        <span class="drop-no">Drop ${d.no} · ${d.date}</span>
        <h3 class="drop-name">${lastWordAccent(d.name)}</h3>
        <p class="drop-story">${d.story}</p>
        <div class="feature">
          ${photo(feat, 800)}
          <div class="feature-info">
            <span class="label">Featured</span>
            <h4>${feat.name}</h4>
            <p class="desc">${feat.desc}</p>
            <span class="price">${money(feat.price)}</span>
            ${buyRow(feat)}
          </div>
        </div>
        ${foot("Star Project", `Page ${pages.length + 1}`)}
      </div>` });
    pages.push({ label, drop: i, html: `<div class="page paper">
        <div class="items-head"><h3>In this drop</h3><span class="drop-no">${d.products.length} pieces</span></div>
        <div class="items">
          ${rest.map((p) => `<article class="item">
            ${photo(p)}
            <div>
              <h4>${p.name}</h4>
              <p class="desc">${p.desc}</p>
              <span class="price">${money(p.price)}</span>
              ${buyRow(p)}
            </div>
          </article>`).join("")}
        </div>
        ${foot(`Drop ${d.no}`, `Page ${pages.length + 1}`)}
      </div>` });
  });
  pages.push({ label: "Back cover", html: `<div class="page cover">
      <div class="cover-star">${STAR_SVG}</div>
      <h3>More soon</h3>
      <div class="vol">The next drop is on its way</div>
      <ul class="back-cover-list">
        <li><strong>Free shipping</strong><span>On orders over ${money(FREE_SHIP)}</span></li>
        <li><strong>Easy returns</strong><span>30 days, unworn</span></li>
        <li><strong>Limited runs</strong><span>Once a drop sells out, it's gone</span></li>
      </ul>
      <a class="btn small" href="#signup">Get first access</a>
      ${foot("Star Project", "Vol. 01")}
    </div>` });

  let single, sheets = [], cur = 0;

  function build() {
    single = matchMedia("(max-width: 860px)").matches;
    const groups = [];
    if (single) pages.forEach((p) => groups.push([p, null]));
    else for (let i = 0; i < pages.length; i += 2) groups.push([pages[i], pages[i + 1]]);
    book.innerHTML = groups.map(([f, b], i) => `<div class="sheet" data-i="${i}">
        <div class="face front">${f.html}<button class="corner" type="button" data-go-next aria-label="Next page"></button></div>
        <div class="face back">${b ? b.html + '<button class="corner" type="button" data-go-prev aria-label="Previous page"></button>' : ""}</div>
      </div>`).join("");
    sheets = [...book.children];
    sheets.forEach((s, i) => s.classList.toggle("flipped", i < cur));
    cur = Math.min(cur, maxCur());
    update(false);
  }

  const maxCur = () => (single ? sheets.length - 1 : sheets.length);

  function update() {
    const n = sheets.length;
    sheets.forEach((s, i) => {
      const flipped = i < cur;
      s.classList.toggle("flipped", flipped);
      if (!s.classList.contains("turning")) s.style.zIndex = flipped ? i + 1 : n - i;
      // only the pages you can see can be clicked or tabbed into
      const front = s.querySelector(".front"), back = s.querySelector(".back");
      const showFront = i === cur, showBack = !single && i === cur - 1;
      front.inert = !showFront; back.inert = !showBack;
      front.setAttribute("aria-hidden", !showFront); back.setAttribute("aria-hidden", !showBack);
    });
    book.classList.toggle("at-start", !single && cur === 0);
    book.classList.toggle("at-end", !single && cur === n);
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === maxCur();

    const visible = single ? [pages[cur]] : [pages[cur * 2 - 1], pages[cur * 2]].filter(Boolean);
    const lab = visible.find((p) => p.drop !== undefined) || visible[0];
    const pageNo = single ? `${cur + 1} / ${pages.length}` : `${cur + 1} / ${n + 1}`;
    status.innerHTML = `<strong>${lab.label}</strong><br>${pageNo}`;
    tabs.querySelectorAll(".drop-tab").forEach((t) => t.setAttribute("aria-current", String(t.dataset.drop === String(lab.drop ?? "cover"))));
  }

  function turn(sheet) {
    sheet.classList.add("turning");
    sheet.style.zIndex = sheets.length + 2;
    clearTimeout(sheet._t);
    sheet._t = setTimeout(() => { sheet.classList.remove("turning"); update(); }, 1150);
  }

  function go(target) {
    target = clamp(target, 0, maxCur());
    if (target === cur) return;
    const dir = target > cur ? 1 : -1;
    const steps = Math.abs(target - cur);
    for (let s = 0; s < steps; s++) {
      setTimeout(() => {
        const idx = dir > 0 ? cur : cur - 1;
        cur += dir;
        turn(sheets[idx]);
        update();
      }, s * 160);
    }
  }

  tabs.innerHTML = `<button class="drop-tab" type="button" data-drop="cover">Cover</button>` +
    DROPS.map((d, i) => `<button class="drop-tab" type="button" data-drop="${i}">Drop ${d.no} · ${d.name}</button>`).join("");
  tabs.addEventListener("click", (e) => {
    const t = e.target.closest(".drop-tab");
    if (!t) return;
    if (t.dataset.drop === "cover") return go(0);
    const i = +t.dataset.drop;
    go(single ? 1 + i * 2 : i + 1);
  });

  prevBtn.addEventListener("click", () => go(cur - 1));
  nextBtn.addEventListener("click", () => go(cur + 1));

  book.addEventListener("click", (e) => {
    if (e.target.closest("[data-go-next]")) return go(cur + 1);
    if (e.target.closest("[data-go-prev]")) return go(cur - 1);
    const btn = e.target.closest("[data-buy], [data-add]");
    if (!btn) return;
    const row = btn.closest(".buy-row");
    const p = findProduct(row.dataset.id);
    const size = row.querySelector(".size").value;
    Cart.add(p.id, size);
    if (btn.hasAttribute("data-buy")) location.href = "checkout.html";
    else toast(`${p.name}${p.sizes.length > 1 ? ", size " + size : ""} added to your bag.`);
  });

  // swipe to turn on touch screens
  let sx = null, sy = null;
  book.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { sx = e.clientX; sy = e.clientY; } });
  book.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(cur + (dx < 0 ? 1 : -1));
  });

  // arrow keys while the book is on screen
  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.5 }).observe(book);
  addEventListener("keydown", (e) => {
    if (!inView || e.target.closest("input, select, textarea") || document.querySelector(".drawer.open")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
  });

  let wasSingle = null;
  const rebuild = () => {
    const s = matchMedia("(max-width: 860px)").matches;
    if (s === wasSingle) return;
    // keep roughly the same place when switching between one and two pages
    if (wasSingle !== null) cur = s ? Math.max(0, cur * 2 - 1) : Math.ceil(cur / 2);
    wasSingle = s;
    build();
  };
  addEventListener("resize", rebuild);
  rebuild();
})();

/* ---------- first-access list (preview: no inbox connected yet) ---------- */
(() => {
  const form = document.getElementById("signup");
  const note = document.getElementById("signup-note");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    if (!input.checkValidity()) {
      input.setAttribute("aria-invalid", "true");
      note.className = "form-note";
      note.textContent = "Please enter a valid email address.";
      input.focus();
      return;
    }
    input.removeAttribute("aria-invalid");
    note.className = "form-note ok";
    note.textContent = "You're on the list. We'll email you before the next drop goes live.";
    form.reset();
  });
})();
