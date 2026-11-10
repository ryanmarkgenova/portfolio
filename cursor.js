/* Liquid gold blob cursor (vanilla take on BlobCursor).
   - Default: gooey chrome blob with a trail, splashes droplets on click.
   - Over data areas: numbers spill out of it.
   - Over video/photo areas: turns into a camera viewfinder, click to flash. */
(function () {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || reduce) return;

  const o = {
    size: 34, trail: 16, lag: 0.55, stretch: 0.6, wobble: 1,
    splashCount: 6, splashSpeed: 0.5, splashSize: 0.5, regrow: 0.5
  };
  const DATA = '.kpis, .card[data-type="data"], .t-data, .timeline, #skills, .back, .slicers';
  const CAMERA = '.t-video, .t-both, .strip, .paper, #slats';
  const NUMS = ['0', '1', '42', '60K', '0.87', '3', 'SQL', 'p<.05', 'n=40', '∑', 'Δ', '1,024', '98%', 'R²', '7', '0x1F', '404', 'μ', '2027'];

  // ---------- DOM: gooey SVG blob layer + canvas for numbers/viewfinder ----------
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'blob-layer'); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <defs>
      <radialGradient id="gold" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="#FFF4D6"/>
        <stop offset="22%" stop-color="#FFD27A"/>
        <stop offset="55%" stop-color="#D9822B"/>
        <stop offset="85%" stop-color="#7A3E10"/>
        <stop offset="100%" stop-color="#3A1C07"/>
      </radialGradient>
      <filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/>
        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="g"/>
        <feComposite in="SourceGraphic" in2="g" operator="atop"/>
      </filter>
    </defs>
    <g filter="url(#goo)" id="gooGroup"></g>
    <ellipse id="spec" rx="5" ry="3" fill="#fff" opacity=".85"/>`;
  document.body.appendChild(svg);
  const group = svg.querySelector('#gooGroup'), spec = svg.querySelector('#spec');
  const mk = () => { const e = document.createElementNS(NS, 'ellipse'); e.setAttribute('fill', 'url(#gold)'); group.appendChild(e); return e; };

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-fx'; canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const flash = document.createElement('div');
  flash.className = 'cam-flash'; flash.setAttribute('aria-hidden', 'true');
  document.body.appendChild(flash);
  document.documentElement.classList.add('has-blob');

  let W, H, dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); };
  size(); addEventListener('resize', size);

  // ---------- state ----------
  const m = { x: W / 2, y: H / 2, seen: false };
  const head = { x: m.x, y: m.y, vx: 0, vy: 0, el: mk() };
  const trail = Array.from({ length: o.trail }, () => ({ x: m.x, y: m.y, el: mk() }));
  const drops = [];
  const nums = [];
  let mode = 'blob', hoverLink = false, scale = 1, cam = 0, lastNum = 0, hidden = true;

  addEventListener('pointermove', e => {
    m.x = e.clientX; m.y = e.clientY;
    if (!m.seen) { m.seen = true; head.x = m.x; head.y = m.y; trail.forEach(t => { t.x = m.x; t.y = m.y; }); }
    const t = e.target instanceof Element ? e.target : null;
    hoverLink = !!(t && t.closest('a, button, label, input, [role="button"]'));
    mode = t && t.closest(CAMERA) ? 'camera' : t && t.closest(DATA) ? 'data' : 'blob';
    if (hidden) { hidden = false; svg.style.opacity = 1; }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { hidden = true; svg.style.opacity = 0; });

  addEventListener('pointerdown', e => {
    // splash droplets
    for (let i = 0; i < o.splashCount; i++) {
      const a = (Math.PI * 2 * i) / o.splashCount + Math.random() * 0.6;
      const sp = (120 + Math.random() * 160) * o.splashSpeed * 2;
      drops.push({ x: head.x, y: head.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.size * o.splashSize * (0.35 + Math.random() * 0.35), life: 1, el: mk() });
    }
    scale = 0.55; // head shrinks, then regrows
    if (mode === 'camera') {
      flash.style.setProperty('--fx', e.clientX + 'px'); flash.style.setProperty('--fy', e.clientY + 'px');
      flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
      cam = 1.6; // snap the brackets in
    }
  });

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const follow = 1 - Math.pow(1 - (1 - o.lag) * 0.6, dt * 60);
    const px = head.x, py = head.y;
    head.x += (m.x - head.x) * follow; head.y += (m.y - head.y) * follow;
    head.vx = (head.x - px) / dt; head.vy = (head.y - py) / dt;

    const speed = Math.hypot(head.vx, head.vy);
    const ang = Math.atan2(head.vy, head.vx) * 180 / Math.PI;
    const st = Math.min(0.6, speed / 2600) * o.stretch * 2;
    scale += ((hoverLink ? 1.55 : mode === 'camera' ? 0.55 : 1) - scale) * Math.min(1, dt * 8 * (0.5 + o.regrow));
    const wob = 1 + Math.sin(now / 160) * 0.04 * o.wobble;
    const R = o.size / 2 * scale * wob;

    head.el.setAttribute('cx', head.x); head.el.setAttribute('cy', head.y);
    head.el.setAttribute('rx', R * (1 + st)); head.el.setAttribute('ry', R * (1 - st * 0.5));
    head.el.setAttribute('transform', `rotate(${ang} ${head.x} ${head.y})`);
    head.el.setAttribute('opacity', hoverLink ? 0.85 : 1);

    let lx = head.x, ly = head.y;
    trail.forEach((t, i) => {
      const k = 0.55 - i * 0.012;
      t.x += (lx - t.x) * k; t.y += (ly - t.y) * k;
      const r = R * (0.82 - i / o.trail * 0.75);
      t.el.setAttribute('cx', t.x); t.el.setAttribute('cy', t.y);
      t.el.setAttribute('rx', Math.max(0, r)); t.el.setAttribute('ry', Math.max(0, r));
      lx = t.x; ly = t.y;
    });

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vx *= Math.pow(0.04, dt); d.vy *= Math.pow(0.04, dt);
      d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt * 1.2;
      const r = d.r * Math.max(0, d.life);
      d.el.setAttribute('cx', d.x); d.el.setAttribute('cy', d.y); d.el.setAttribute('rx', r); d.el.setAttribute('ry', r);
      if (d.life <= 0) { d.el.remove(); drops.splice(i, 1); }
    }

    spec.setAttribute('cx', head.x - R * 0.35); spec.setAttribute('cy', head.y - R * 0.4);
    spec.setAttribute('rx', R * 0.28); spec.setAttribute('ry', R * 0.16);
    spec.setAttribute('transform', `rotate(-30 ${head.x - R * 0.35} ${head.y - R * 0.4})`);

    // ---------- canvas overlay: numbers + viewfinder ----------
    ctx.clearRect(0, 0, W, H);
    if (mode === 'data' && speed > 40 && now - lastNum > 55 && !hidden) {
      lastNum = now;
      const a = Math.random() * Math.PI * 2;
      nums.push({ x: head.x, y: head.y, vx: Math.cos(a) * 40 - head.vx * 0.05, vy: Math.sin(a) * 40 - head.vy * 0.05 - 20,
        s: NUMS[(Math.random() * NUMS.length) | 0], life: 1, size: 11 + Math.random() * 6 });
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = nums.length - 1; i >= 0; i--) {
      const n = nums[i];
      n.x += n.vx * dt; n.y += n.vy * dt; n.life -= dt * 0.9;
      if (n.life <= 0) { nums.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, n.life * 1.4) * 0.9;
      ctx.fillStyle = n.life > 0.7 ? '#FFC21A' : '#EFE4CF';
      ctx.font = `600 ${n.size}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.fillText(n.s, n.x, n.y);
    }
    ctx.globalAlpha = 1;

    cam += ((mode === 'camera' && !hidden ? 1 : 0) - cam) * Math.min(1, dt * 10);
    if (cam > 0.02) {
      const w = 74 * cam, h = 50 * cam, L = 12 * cam, x = m.x, y = m.y;
      ctx.strokeStyle = `rgba(239,228,207,${Math.min(1, cam)})`; ctx.lineWidth = 2;
      ctx.beginPath();
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
        const cx = x + sx * w / 2, cy = y + sy * h / 2;
        ctx.moveTo(cx, cy - sy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx - sx * L, cy);
      });
      ctx.stroke();
      ctx.globalAlpha = Math.min(1, cam);
      if (Math.floor(now / 500) % 2 === 0) { ctx.fillStyle = '#FF4B3A'; ctx.beginPath(); ctx.arc(x - w / 2 + 6, y - h / 2 - 12, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#EFE4CF'; ctx.font = '600 10px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left';
      ctx.fillText('REC', x - w / 2 + 14, y - h / 2 - 12);
      ctx.textAlign = 'right'; ctx.fillText('CLICK TO SNAP', x + w / 2, y + h / 2 + 14);
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
