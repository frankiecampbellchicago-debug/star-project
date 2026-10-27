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
    for (let i = 0; i < 110; i++) dust.push({ u: Math.random(), off: (Math.random() - 0.5) * 30, r: Math.random() * 1.1 + 0.3, ph: Math.random() * 6.3 });
  }

  // the comet's path: swoops in from the top right, glides just under the title
  // and carries on off the left edge, leaving its trail beneath the name
  let P0, P1, P2;
  function path() {
    const r = title.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const y = (r.bottom - sr.top + 28) / h;
    P0 = [1.1, y - 0.27]; P1 = [0.56, y + 0.035]; P2 = [-Math.max(0.14, 200 / w), y - 0.015];
  }
  function pt(u) {
    const a = (1 - u) ** 2, b = 2 * u * (1 - u), d = u * u;
    return [(a * P0[0] + b * P1[0] + d * P2[0]) * w, (a * P0[1] + b * P1[1] + d * P2[1]) * h];
  }

  const TRAIL = 0.7;
  let lastHead = null;
  const glitter = [];

  // soft round light sprites; the whole comet is painted by stamping these
  function softSprite(rgb) {
    const S = 128, o = document.createElement("canvas");
    o.width = o.height = S;
    const g = o.getContext("2d"), m = S / 2;
    const r = g.createRadialGradient(m, m, 0, m, m, m);
    r.addColorStop(0, `rgba(${rgb},1)`);
    r.addColorStop(0.2, `rgba(${rgb},0.75)`);
    r.addColorStop(0.45, `rgba(${rgb},0.28)`);
    r.addColorStop(0.7, `rgba(${rgb},0.08)`);
    r.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = r; g.fillRect(0, 0, S, S);
    return o;
  }
  const SPR = { white: softSprite("255,255,253"), cream: softSprite("255,240,214"), gold: softSprite("214,178,112"), blue: softSprite("190,208,255") };
  const stamp = (img, x, y, size, alpha) => {
    if (alpha <= 0.002 || size <= 0.2) return;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  };

  // walk the trail from tail (k = 0) to head (k = 1), with a sideways offset
  function stream(tail, t, time, n, side, fn) {
    let prev = pt(tail);
    for (let i = 1; i <= n; i++) {
      const k = i / n;
      const q = pt(tail + (t - tail) * k);
      const dx = q[0] - prev[0], dy = q[1] - prev[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const off = side(k) + Math.sin(k * 14 - time / 500) * 1.6 * (1 - k);
      fn(q[0] + nx * off, q[1] + ny * off, k);
      prev = q;
    }
  }

  function draw(time, p) {
    ctx.clearRect(0, 0, w, h);
    const t = easeInOut(clamp((p - 0.26) / 0.52));
    if (t <= 0) { title.style.setProperty("--x", w + 200 + "px"); lastHead = null; glitter.length = 0; return; }

    const head = pt(t);
    const ahead = pt(Math.min(1, t + 0.002));
    const ang = Math.atan2(ahead[1] - head[1], ahead[0] - head[0]);
    const tail = Math.max(0, t - TRAIL);
    ctx.globalCompositeOperation = "lighter";

    // broad golden dust tail, fanning out and curving away behind the comet
    stream(tail, t, time, 120, (k) => 30 * (1 - k) ** 1.7, (x, y, k) => stamp(SPR.gold, x, y, 18 + 80 * k ** 1.6, 0.1 * k ** 1.1));
    // faint blue ion tail, straighter and to the other side
    stream(tail, t, time, 110, (k) => -12 * (1 - k) ** 1.4, (x, y, k) => stamp(SPR.blue, x, y, 6 + 26 * k ** 2, 0.09 * k ** 1.6));
    // the bright body of the tail
    stream(tail, t, time, 200, () => 0, (x, y, k) => stamp(SPR.cream, x, y, 6 + 30 * k ** 2, 0.28 * k ** 1.05));
    // a fine white-hot core line
    stream(Math.max(tail, t - TRAIL * 0.55), t, time, 160, () => 0, (x, y, k) => stamp(SPR.white, x, y, 2 + 9 * k ** 3, 0.7 * k ** 1.7));

    // once the comet has gone, a fine glowing line stays behind for the name to sit on
    const after = clamp((60 - head[0]) / 260);
    if (after > 0) {
      stream(tail, t, time, 180, () => 0, (x, y, k) => {
        const env = Math.sin(Math.PI * k) ** 0.7;
        stamp(SPR.cream, x, y, 14, 0.11 * env * after);
        stamp(SPR.white, x, y, 3.6, 0.6 * env * after);
      });
    }

    // sparkles caught in the tail
    for (const d of dust) {
      const q = pt(tail + (t - tail) * d.u);
      const a = d.u ** 1.4 * (0.25 + 0.75 * Math.sin(time / 420 + d.ph) ** 4);
      stamp(SPR.white, q[0], q[1] + d.off * (1 - d.u) * 0.9, d.r * 5, a);
    }

    // the head: wide halo, a teardrop coma swept back along the path, a blazing core
    if (head[0] > -120) {
      const flick = 1 + Math.sin(time / 130) * 0.05 + Math.sin(time / 43) * 0.03;
      stamp(SPR.gold, head[0], head[1], 220 * flick, 0.32);
      stamp(SPR.cream, head[0], head[1], 90 * flick, 0.55);
      ctx.save();
      ctx.translate(head[0], head[1]);
      ctx.rotate(ang);
      ctx.translate(-14, 0);
      ctx.scale(2.2, 1);
      stamp(SPR.cream, 0, 0, 46 * flick, 0.9);
      ctx.restore();
      stamp(SPR.white, head[0], head[1], 30 * flick, 1);
      stamp(SPR.white, head[0], head[1], 12, 1);
    }
    ctx.globalAlpha = 1;

    // glitter that drifts off the trail and slowly falls
    if (!REDUCED && glitter.length < 140 && Math.random() < 0.8) {
      const u = tail + (t - tail) * (1 - Math.random() ** 2);
      const q = pt(u);
      glitter.push({ x: q[0], y: q[1], vx: (Math.random() - 0.5) * 0.25, vy: 0.08 + Math.random() * 0.3, life: 1, decay: 0.006 + Math.random() * 0.01, r: 0.4 + Math.random() * 0.9, ph: Math.random() * 6.3 });
    }
    for (let i = glitter.length - 1; i >= 0; i--) {
      const g = glitter[i];
      g.x += g.vx; g.y += g.vy; g.life -= g.decay;
      if (g.life <= 0) { glitter.splice(i, 1); continue; }
      const tw = 0.5 + 0.5 * Math.sin(time / 120 + g.ph);
      stamp(SPR.cream, g.x, g.y, g.r * 7, g.life * tw * 0.8);
    }

    // the head: a teardrop coma pointing back along the trail, with a white-hot core
    if (head[0] > -60) {
      const flick = 1 + Math.sin(time / 120) * 0.05 + Math.sin(time / 41) * 0.03;
      ctx.save();
      ctx.translate(head[0], head[1]);
      ctx.rotate(ang);
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 60 * flick);
      halo.addColorStop(0, "rgba(255,244,220,0.35)");
      halo.addColorStop(0.35, "rgba(207,174,114,0.08)");
      halo.addColorStop(1, "rgba(207,174,114,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(0, 0, 60 * flick, 0, Math.PI * 2); ctx.fill();
      ctx.translate(-9, 0);
      ctx.scale(2.6, 1);
      const coma = ctx.createRadialGradient(0, 0, 0, 0, 0, 11 * flick);
      coma.addColorStop(0, "rgba(255,255,252,1)");
      coma.addColorStop(0.35, "rgba(255,244,222,0.75)");
      coma.addColorStop(1, "rgba(240,214,166,0)");
      ctx.fillStyle = coma;
      ctx.beginPath(); ctx.arc(0, 0, 11 * flick, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(head[0], head[1], 2.4, 0, Math.PI * 2); ctx.fill();
    }

    // a few sparks flicked off the head while it moves
    if (lastHead && !REDUCED) {
      const dx = head[0] - lastHead[0], dy = head[1] - lastHead[1];
      const n = Math.min(2, Math.hypot(dx, dy) / 6);
      for (let i = 0; i < n; i++) {
        const back = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.9;
        const sp = 0.4 + Math.random() * 1.1;
        sparks.push({ x: head[0], y: head[1], vx: Math.cos(back) * sp, vy: Math.sin(back) * sp, life: 1, decay: 0.015 + Math.random() * 0.02 });
      }
    }
    lastHead = head;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vx *= 0.96; s.vy *= 0.96; s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      stamp(SPR.white, s.x, s.y, 6 * s.life + 1, s.life * 0.8);
    }
    // once the comet has flown off the left edge, let the trail melt away there
    // so what stays behind is a soft arc under the name
    ctx.globalAlpha = 1;
    const gone = clamp((40 - head[0]) / 160);
    if (gone > 0) {
      ctx.globalCompositeOperation = "destination-out";
      const fade = ctx.createLinearGradient(0, 0, w * 0.32, 0);
      fade.addColorStop(0, `rgba(0,0,0,${gone})`);
      fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w * 0.32, h);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // the name fades in behind the comet
    title.style.setProperty("--x", (t >= 0.999 ? -300 : head[0] + 6) + "px");
  }

  function progress() {
    const r = hero.getBoundingClientRect();
    return clamp(-r.top / (hero.offsetHeight - innerHeight));
  }

  function tick(time) {
    const p = progress();
    SKY.shine = easeInOut(clamp(p / 0.3));
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

  const stock = (p) => (LEFT[p.id] ? `<span class="stock">Only ${LEFT[p.id]} left</span>` : "");
  const cutPhoto = (p, size) => `<div class="photo cut" data-qv="${p.id}" role="button" tabindex="0" aria-label="Quick view: ${p.name}"><span class="qv-hint">Quick view</span><img src="images/${p.img}-cut-${size}.webp" alt="${p.name}" width="${size}" height="${size}" loading="lazy"></div>`;
  const runHead = (right) => `<div class="run-head"><span>Star Project · Catalogue Vol. 01</span><span>${right}</span></div>`;
  const meta = (p) => {
    const [cname, hex] = COLORWAYS[p.id] || ["", ""];
    const fabric = (DETAILS[p.id] || [])[0] || "";
    return `<div class="meta-line">${cname ? `<span class="swatch" style="--c:${hex}"></span>${cname}` : ""}${fabric ? `<span class="dot-sep"></span><span class="fabric">${fabric}</span>` : ""}</div>`;
  };
  const code = (d, i) => `<span class="style-code">SP-${d.no}-${String(i + 1).padStart(2, "0")}</span>`;

  // a small constellation for each drop, the same every visit (seeded by the drop id)
  function constellation(seed) {
    let x = [...seed].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
    const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
    const pts = Array.from({ length: 7 }, (_, i) => [12 + i * 30 + rnd() * 14, 18 + rnd() * 64]);
    const path = pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
    const branch = `M${pts[2][0].toFixed(1)} ${pts[2][1].toFixed(1)} L${(pts[2][0] + 8).toFixed(1)} ${(pts[2][1] > 50 ? pts[2][1] - 30 : pts[2][1] + 30).toFixed(1)}`;
    return `<svg class="constellation" viewBox="0 0 220 100" aria-hidden="true">
      <path class="c-line" d="${path}" pathLength="1"/><path class="c-line" d="${branch}" pathLength="1"/>
      ${pts.map((q, i) => `<circle class="c-star" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${i % 3 ? 1.4 : 2.2}" style="--d:${(i * 0.35).toFixed(2)}s"/>`).join("")}
    </svg>`;
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
    pages.push({ label, drop: i, html: `<div class="page night">
        ${runHead(`Drop ${d.no}`)}
        ${constellation(d.id)}
        <span class="drop-no">Drop ${d.no} · ${d.date}</span>
        <h3 class="drop-name">${d.name}</h3>
        <p class="drop-story">${d.story}</p>
        <div class="drop-stats"><div><strong>${d.products.length}</strong><span>Pieces</span></div><div><strong>${RUN_SIZE[d.id] || "—"}</strong><span>Made of each</span></div><div><strong>${d.date.split(" ")[1]}</strong><span>${d.date.split(" ")[0]}</span></div></div>
        <div class="feature">
          ${cutPhoto(feat, 800)}
          <div class="feature-info">
            <span class="label">Featured ${code(d, 0)}</span>
            <h4>${feat.name}</h4>
            <p class="desc">${feat.desc}</p>
            ${meta(feat)}
            <span class="price">${money(feat.price)}</span>${stock(feat)}
            ${buyRow(feat)}
          </div>
        </div>
        ${foot("Star Project", `Page ${pages.length}`)}
      </div>` });
    pages.push({ label, drop: i, html: `<div class="page night">
        ${runHead(d.name)}
        <div class="items-head"><h3>In this drop</h3><span class="drop-no">${d.products.length} pieces</span></div>
        <div class="items">
          ${rest.map((p, j) => `<article class="item">
            ${cutPhoto(p, 400)}
            <div>
              <div class="item-top"><h4>${p.name}</h4>${code(d, j + 1)}</div>
              ${meta(p)}
              <span class="price">${money(p.price)}</span>${stock(p)}
              ${buyRow(p)}
            </div>
          </article>`).join("")}
        </div>
        ${foot(`Drop ${d.no}`, `Page ${pages.length}`)}
      </div>` });
  });
  const nd = NEXT_DROP;
  const teaserLabel = `Drop ${nd.no}: Coming soon`;
  pages.push({ label: teaserLabel, drop: DROPS.length, html: `<div class="page night teaser">
      ${runHead(`Drop ${nd.no}`)}
      ${constellation("supernova")}
      <span class="drop-no">Drop ${nd.no} · ${nd.date}</span>
      <h3 class="drop-name">${nd.name}</h3>
      <p class="drop-story">${nd.teaser}</p>
      <div class="countdown" data-launch="${nd.launch}" aria-label="Time until Drop ${nd.no}">
        <div><strong data-u="d">00</strong><span>Days</span></div>
        <div><strong data-u="h">00</strong><span>Hours</span></div>
        <div><strong data-u="m">00</strong><span>Minutes</span></div>
        <div><strong data-u="s">00</strong><span>Seconds</span></div>
      </div>
      <a class="btn small" href="#signup-section">Get first access</a>
      ${foot("Star Project", `Page ${pages.length}`)}
    </div>` });
  pages.push({ label: teaserLabel, drop: DROPS.length, html: `<div class="page night teaser">
      ${runHead("Coming soon")}
      <div class="items-head"><h3>Under wraps</h3><span class="drop-no">Revealed at launch</span></div>
      <div class="mystery">
        ${nd.silhouettes.map((img, i) => `<div class="mystery-item"><div class="photo cut silhouette"><img src="images/${img}-cut-400.webp" alt="" width="400" height="400" loading="lazy"></div><span>Piece ${String(i + 1).padStart(2, "0")}</span></div>`).join("")}
      </div>
      <p class="drop-story mystery-note">Join the list and you'll see the reveal a day before everyone else.</p>
      ${foot(`Drop ${nd.no}`, `Page ${pages.length}`)}
    </div>` });
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

  // the book opens straight onto Drop 01; the front cover stays turned back
  const MIN = 1;
  let single, sheets = [], cur = MIN;

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
    tickCountdown();
    sheets.forEach((s, i) => s.classList.toggle("flipped", i < cur));
    cur = Math.min(cur, maxCur());
    book.classList.add("instant");
    update();
    requestAnimationFrame(() => requestAnimationFrame(() => book.classList.remove("instant")));
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
      front.classList.toggle("seen", showFront); back.classList.toggle("seen", showBack);
      front.setAttribute("aria-hidden", !showFront); back.setAttribute("aria-hidden", !showBack);
    });
    book.classList.toggle("at-start", !single && cur === 0);
    book.classList.toggle("at-end", !single && cur === n);
    prevBtn.disabled = cur <= MIN;
    nextBtn.disabled = cur === maxCur();

    const visible = single ? [pages[cur]] : [pages[cur * 2 - 1], pages[cur * 2]].filter(Boolean);
    const lab = visible.find((p) => p.drop !== undefined) || visible[0];
    const pageNo = single ? `${cur} / ${pages.length - 1}` : `${cur} / ${n}`;
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
    target = clamp(target, MIN, maxCur());
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

  tabs.innerHTML =
    DROPS.map((d, i) => `<button class="drop-tab" type="button" data-drop="${i}">Drop ${d.no} · ${d.name}</button>`).join("") +
    `<button class="drop-tab soon" type="button" data-drop="${DROPS.length}">Drop ${NEXT_DROP.no} · Coming soon</button>`;
  tabs.addEventListener("click", (e) => {
    const t = e.target.closest(".drop-tab");
    if (!t) return;
    const i = +t.dataset.drop;
    go(single ? 1 + i * 2 : i + 1);
  });

  prevBtn.addEventListener("click", () => go(cur - 1));
  nextBtn.addEventListener("click", () => go(cur + 1));

  book.addEventListener("click", (e) => {
    if (e.target.closest("[data-go-next]")) return go(cur + 1);
    if (e.target.closest("[data-go-prev]")) return go(cur - 1);
    const qv = e.target.closest("[data-qv]");
    if (qv) return QuickView.open(qv.dataset.qv, qv);
    const btn = e.target.closest("[data-buy], [data-add]");
    if (!btn) return;
    const row = btn.closest(".buy-row");
    const p = findProduct(row.dataset.id);
    const size = row.querySelector(".size").value;
    Cart.add(p.id, size);
    if (btn.hasAttribute("data-buy")) location.href = "checkout.html";
    else toast(`${p.name}${p.sizes.length > 1 ? ", size " + size : ""} added to your bag.`);
  });

  book.addEventListener("keydown", (e) => {
    const qv = e.target.closest("[data-qv]");
    if (qv && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); QuickView.open(qv.dataset.qv, qv); }
  });

  // live countdown to the next drop
  function tickCountdown() {
    book.querySelectorAll(".countdown").forEach((el) => {
      let ms = Math.max(0, new Date(el.dataset.launch) - Date.now());
      for (const [u, size] of [["d", 86400000], ["h", 3600000], ["m", 60000], ["s", 1000]]) {
        const v = Math.floor(ms / size);
        ms -= v * size;
        el.querySelector(`[data-u="${u}"]`).textContent = String(v).padStart(2, "0");
      }
    });
  }
  setInterval(tickCountdown, 1000);

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
    if (wasSingle !== null) cur = s ? Math.max(MIN, cur * 2 - 1) : Math.max(MIN, Math.ceil(cur / 2));
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

/* ---------- quick view ---------- */
const QuickView = (() => {
  const el = document.createElement("div");
  el.className = "qv";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "qv-name");
  el.hidden = true;
  document.body.appendChild(el);
  let last = null, current = null, size = null;

  function render(p) {
    const drop = DROPS.find((d) => d.products.some((q) => q.id === p.id));
    size = p.sizes.includes("M") ? "M" : p.sizes[0];
    el.innerHTML = `<div class="qv-card">
      <button class="icon-btn qv-close" type="button" aria-label="Close">${ICON.close}</button>
      <div class="qv-photo"><img src="images/${p.img}-cut-800.webp" alt="${p.name}" width="800" height="800"></div>
      <div class="qv-info">
        <span class="label">Drop ${drop.no} · ${drop.name}</span>
        <h2 id="qv-name">${p.name}</h2>
        <div class="qv-price"><span class="price">${money(p.price)}</span>${LEFT[p.id] ? `<span class="stock">Only ${LEFT[p.id]} left</span>` : ""}</div>
        <p class="qv-desc">${p.desc}</p>
        <ul class="qv-details">${(DETAILS[p.id] || []).map((d) => `<li>${d}</li>`).join("")}</ul>
        ${p.sizes.length > 1
          ? `<div class="qv-sizes" role="radiogroup" aria-label="Size">${p.sizes.map((x) => `<button type="button" role="radio" aria-checked="${x === size}" data-size="${x}">${x}</button>`).join("")}</div>`
          : `<p class="qv-one">One size</p>`}
        <div class="qv-actions">
          <button class="btn" type="button" data-qv-buy>Buy now</button>
          <button class="btn ghost" type="button" data-qv-add>Add to bag</button>
        </div>
        <p class="fine">Free shipping over ${money(FREE_SHIP)} · 30-day returns</p>
      </div>
    </div>`;
  }

  function open(id, from) {
    current = findProduct(id);
    if (!current) return;
    last = from || document.activeElement;
    render(current);
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add("open"));
    el.querySelector(".qv-close").focus();
  }
  function close() {
    el.classList.remove("open");
    setTimeout(() => { el.hidden = true; }, 350);
    last?.focus?.();
  }
  el.addEventListener("click", (e) => {
    if (e.target === el || e.target.closest(".qv-close")) return close();
    const b = e.target.closest("[data-size]");
    if (b) {
      size = b.dataset.size;
      el.querySelectorAll("[data-size]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    }
    if (e.target.closest("[data-qv-buy]")) { Cart.add(current.id, size); location.href = "checkout.html"; }
    if (e.target.closest("[data-qv-add]")) {
      Cart.add(current.id, size);
      close();
      toast(`${current.name}${current.sizes.length > 1 ? ", size " + size : ""} added to your bag.`);
    }
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) close(); });
  return { open, close };
})();
