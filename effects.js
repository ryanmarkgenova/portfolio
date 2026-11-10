/* Motion layer: Lenis smooth scroll, GSAP reveals, bokeh + flares,
   and vanilla versions of MicroSlats, PaperCrumple and DodgeField. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const hex = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };

  /* ================= Lenis smooth scrolling ================= */
  let lenis = null;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -64, duration: 1.4 }); }
    }));
  }

  /* ================= GSAP reveals ================= */
  if (hasGsap && !reduce) {
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
    intro.from('.hi', { y: 24, opacity: 0, duration: 0.6 })
      .from('.name .swash', { y: 50, opacity: 0, duration: 1 }, '-=0.3')
      .from('.name .wide', { yPercent: 70, opacity: 0, duration: 0.85 }, '-=0.65')
      .from('.role', { opacity: 0, duration: 0.5 }, '-=0.35')
      .from('.rule-line .line', { scaleX: 0, transformOrigin: 'left center', duration: 0.9 }, '-=0.3')
      .from(['.lede', '.hero .ctas'], { y: 18, opacity: 0, stagger: 0.1, duration: 0.6 }, '-=0.6')
      .from('.strip', { y: -120, rotation: -14, opacity: 0, duration: 1.2, ease: 'back.out(1.5)' }, 0.25)
      .from('.strip-hint', { opacity: 0, duration: 0.5 }, '-=0.3');

    gsap.utils.toArray('.sec-head').forEach(h => {
      gsap.from(h.children, { y: 34, opacity: 0, stagger: 0.08, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: h, start: 'top 86%', once: true } });
    });

    gsap.utils.toArray('.kpi').forEach((k, i) => {
      gsap.from(k, { y: 24, opacity: 0, duration: 0.6, delay: i * 0.07, ease: 'power2.out',
        scrollTrigger: { trigger: k, start: 'top 90%', once: true } });
      const b = k.querySelector('b');
      const m = b && b.textContent.match(/^(\d+)(.*)$/);
      if (m && b.id !== 'projCount') {
        const obj = { v: 0 }, end = +m[1], suf = m[2];
        gsap.to(obj, { v: end, duration: 1.4, ease: 'power2.out', delay: i * 0.07,
          scrollTrigger: { trigger: k, start: 'top 90%', once: true },
          onUpdate: () => { b.textContent = Math.round(obj.v) + suf; } });
      }
    });

    gsap.utils.toArray('.card').forEach((c, i) => {
      gsap.from(c, { y: 50, opacity: 0, duration: 0.8, delay: (i % 3) * 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: c, start: 'top 92%', once: true } });
    });
    document.querySelectorAll('.slicers input, .reset, #reset2').forEach(el =>
      el.addEventListener('change', () => setTimeout(() => ScrollTrigger.refresh(), 50)));

    const prog = document.querySelector('.tl-progress');
    if (prog) gsap.fromTo(prog, { scaleY: 0 }, { scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 55%', scrub: 0.6 } });
    gsap.utils.toArray('.tl').forEach(t => {
      gsap.from(t, { x: -30, opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: t, start: 'top 85%', once: true } });
    });

    gsap.utils.toArray('.skillgrid').forEach(g => {
      gsap.from(g.children, { y: 26, scale: 0.92, opacity: 0, stagger: 0.05, duration: 0.55, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: g, start: 'top 88%', once: true } });
    });

    gsap.from('.about-in > *', { y: 40, opacity: 0, stagger: 0.15, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: '.about', start: 'top 75%', once: true } });

    // gentle parallax on the hero glow and film frame
    gsap.to('.strip-wrap', { yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ================= Bokeh + orange lens flares ================= */
  (function bokeh() {
    const c = document.getElementById('fx');
    if (!c) return;
    const x = c.getContext('2d');
    let W, H, dpr = Math.min(devicePixelRatio || 1, 1.5);
    const N = innerWidth < 700 ? 12 : 22;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const dots = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(), r: rnd(16, 90), a: rnd(0.035, 0.11),
      hue: rnd(22, 42), depth: rnd(0.15, 0.8), vx: rnd(-0.004, 0.004), vy: rnd(-0.01, -0.003)
    }));
    let mx = 0.7, my = 0.25, tmx = 0.7, tmy = 0.25;
    addEventListener('pointermove', e => { tmx = e.clientX / innerWidth; tmy = e.clientY / innerHeight; }, { passive: true });
    function size() { W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    let last = performance.now();
    function draw(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      x.clearRect(0, 0, W, H);
      const sy = scrollY;
      // bokeh orbs
      for (const d of dots) {
        if (!reduce) { d.x += d.vx * dt; d.y += d.vy * dt; }
        let py = ((d.y * H - sy * d.depth * 0.35) % (H + 200) + H + 200) % (H + 200) - 100;
        let px = ((d.x % 1) + 1) % 1 * W;
        const g = x.createRadialGradient(px, py, 0, px, py, d.r);
        const col = `hsla(${d.hue},95%,62%,`;
        g.addColorStop(0, col + d.a * 0.55 + ')');
        g.addColorStop(0.72, col + d.a * 0.8 + ')');
        g.addColorStop(0.88, col + d.a + ')');
        g.addColorStop(1, col + '0)');
        x.fillStyle = g; x.beginPath(); x.arc(px, py, d.r, 0, Math.PI * 2); x.fill();
      }
      // flare (fades out as you leave the hero)
      mx = lerp(mx, tmx, 0.04); my = lerp(my, tmy, 0.04);
      const fa = clamp(1 - sy / (H * 0.9), 0, 1);
      if (fa > 0.01) {
        const fx = W * (0.78 + (mx - 0.5) * 0.08), fy = H * (0.2 + (my - 0.5) * 0.06);
        x.save(); x.globalAlpha = fa;
        // hot core
        let g = x.createRadialGradient(fx, fy, 0, fx, fy, 160);
        g.addColorStop(0, 'rgba(255,230,180,.55)'); g.addColorStop(0.2, 'rgba(255,150,60,.25)'); g.addColorStop(1, 'rgba(255,120,30,0)');
        x.fillStyle = g; x.beginPath(); x.arc(fx, fy, 160, 0, Math.PI * 2); x.fill();
        // anamorphic streak
        x.save(); x.translate(fx, fy); x.scale(1, 0.035);
        g = x.createRadialGradient(0, 0, 0, 0, 0, W * 0.6);
        g.addColorStop(0, 'rgba(255,190,110,.55)'); g.addColorStop(0.4, 'rgba(255,130,40,.18)'); g.addColorStop(1, 'rgba(255,120,30,0)');
        x.fillStyle = g; x.beginPath(); x.arc(0, 0, W * 0.6, 0, Math.PI * 2); x.fill(); x.restore();
        // ghosts along the line through the frame center
        const cx = W / 2, cy = H / 2;
        [[0.55, 26, .1], [0.9, 12, .14], [1.35, 46, .07], [1.75, 18, .1]].forEach(([t, r, a]) => {
          const gx = lerp(fx, cx, t * 1.2), gy = lerp(fy, cy, t * 1.2);
          x.beginPath();
          for (let i = 0; i < 6; i++) { const ang = Math.PI / 3 * i + Math.PI / 6; x.lineTo(gx + r * Math.cos(ang), gy + r * Math.sin(ang)); }
          x.closePath(); x.fillStyle = `rgba(255,${150 + r},70,${a})`; x.fill();
        });
        x.restore();
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  })();

  /* ================= MicroSlats (vanilla) ================= */
  function microSlats(canvas, o) {
    const ctx = canvas.getContext('2d');
    const col = hex(o.color), gl = hex(o.glintColor), bg = hex(o.backgroundColor);
    let W, H, dpr = Math.min(devicePixelRatio || 1, 2), cols, rows, energy, mouse = { x: -9999, y: -9999 };
    const sw = o.slatWidth * o.scale, sh = o.slatHeight * o.scale, gap = o.gap * o.scale;
    function size() {
      const r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / (sw + gap)) + 1; rows = Math.ceil(H / (sh + gap)) + 1;
      energy = new Float32Array(cols * rows);
    }
    size(); addEventListener('resize', size);
    if (o.interactive) {
      canvas.parentElement.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    }
    const dir = o.direction * Math.PI / 180, dx = Math.cos(dir), dy = Math.sin(dir);
    const rr = Math.min(sw, sh) / 2 * o.roundness;
    let t0 = null, last = 0, visible = true, raf;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(canvas);
    function frame(now) {
      raf = null;
      if (t0 === null) t0 = now;
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      const intro = o.intro ? clamp(t / o.introDuration, 0, 1) : 1;
      const decay = Math.pow(0.04, dt / o.trail);
      ctx.fillStyle = `rgb(${bg})`; ctx.fillRect(0, 0, W, H);
      const ph = t * o.speed;
      for (let r = 0; r < rows; r++) {
        const y = r * (sh + gap);
        const depth = y / H;                      // 0 = far (top), 1 = near (bottom)
        const persp = lerp(1 - o.perspective, 1, depth);
        const fogF = 1 - o.fog * (1 - depth) * 0.9;
        for (let c = 0; c < cols; c++) {
          const x = c * (sw + gap);
          const u = (x * dx + y * dy) / 220, v = (x * -dy + y * dx) / 220;
          let h = Math.sin(u * 2.2 / persp + ph * 2.1) * 0.62
            + Math.sin(u * 5.1 / persp - ph * 1.4 + v * 1.7) * 0.28 * o.chop
            + Math.sin(v * 3.3 + ph * 1.75 + u) * 0.22 * o.chop;
          h = h * 0.5 + 0.5;                          // 0..1 swell
          const i = r * cols + c;
          if (o.interactive) {
            const ddx = x + sw / 2 - mouse.x, ddy = y + sh / 2 - mouse.y;
            const d = Math.sqrt(ddx * ddx + ddy * ddy);
            const inf = Math.exp(-(d * d) / (2 * (o.cursorSize * o.scale) ** 2)) * o.cursorStrength;
            energy[i] = Math.max(energy[i] * decay, inf);
          }
          let b = 0.18 + 0.55 * h + energy[i] * 0.55;
          b = clamp((b - 0.5) * o.contrast + 0.5, 0, 1) * fogF;
          // intro sweeps in from the bottom-left
          const reveal = clamp(intro * 1.6 - (1 - depth) * 0.4 - c / cols * 0.2, 0, 1);
          b *= reveal;
          const glint = clamp((h - 0.82) / 0.18, 0, 1) * o.glint * reveal * fogF + energy[i] * 0.25;
          const R = lerp(lerp(bg[0], col[0], b), gl[0], clamp(glint, 0, 1));
          const G = lerp(lerp(bg[1], col[1], b), gl[1], clamp(glint, 0, 1));
          const B = lerp(lerp(bg[2], col[2], b), gl[2], clamp(glint, 0, 1));
          ctx.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
          const hh = sh * (0.82 + 0.18 * h);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y + (sh - hh) / 2, sw, hh, rr); else ctx.rect(x, y + (sh - hh) / 2, sw, hh);
          ctx.fill();
        }
      }
      if (visible && !o.paused && !reduce) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
  const slats = document.getElementById('slats');
  if (slats) microSlats(slats, {
    color: '#D9822B', glintColor: '#FFE9BF', backgroundColor: '#120D09',
    slatWidth: 10, slatHeight: 25, gap: 3, roundness: 0.75, interactive: true,
    cursorStrength: 1, cursorSize: 40, trail: 1.4, intro: true, scale: innerWidth < 700 ? 1.1 : 1.5,
    speed: 0.6, direction: 250, chop: 0.55, glint: 0.7, contrast: 1.25, perspective: 0.55, fog: 0.55,
    introDuration: 1.5, paused: false
  });

  /* ================= PaperCrumple (vanilla three.js) ================= */
  function paperCrumple(host, o) {
    if (!window.THREE) return;
    // Browsers block WebGL from reading local files, so keep the still print when opened straight from disk
    if (location.protocol === 'file:') { const h = document.querySelector('.paper-hint'); if (h) h.textContent = 'Crumple works on the live site'; return; }
    const T = THREE;
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
    const fallback = host.querySelector('img'); if (fallback) fallback.hidden = true;
    const W = host.clientWidth || o.width, H = o.sceneHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);
    const scene = new T.Scene();
    const cam = new T.PerspectiveCamera(32, W / H, 0.1, 100);
    const ph = 2.2, pw = ph * (o.width / o.height);
    cam.position.set(0, 0, (ph / 2) / Math.tan(T.MathUtils.degToRad(16)) * 1.35);
    scene.add(new T.AmbientLight(0xfff4e6, 0.65));
    const sun = new T.DirectionalLight(0xffe3c2, o.lightIntensity);
    const la = T.MathUtils.degToRad(o.lightAngle);
    sun.position.set(Math.cos(la) * 3, Math.sin(-la) * 3 + 1, 4); scene.add(sun);

    // paper texture with the photo printed on it
    const cv = document.createElement('canvas'); cv.width = 1024; cv.height = Math.round(1024 * o.height / o.width);
    const cx = cv.getContext('2d');
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const grain = document.createElement('canvas'); grain.width = grain.height = 256;
    (function () {
      const g = grain.getContext('2d'), id = g.createImageData(256, 256), d = id.data;
      for (let i = 0; i < d.length; i += 4) { const n = 128 + (Math.random() - 0.5) * 255; d[i] = d[i + 1] = d[i + 2] = n; d[i + 3] = 255; }
      g.putImageData(id, 0, 0);
    })();
    function paint(img) {
      cx.globalCompositeOperation = 'source-over';
      cx.fillStyle = o.paperColor; cx.fillRect(0, 0, cv.width, cv.height);
      if (img) {
        const m = cv.width * 0.06, bw = cv.width - m * 2, bh = cv.height - m * 2 - cv.height * 0.08;
        const s = Math.min(bw / img.width, bh / img.height), iw = img.width * s, ih = img.height * s;
        cx.drawImage(img, (cv.width - iw) / 2, m + (bh - ih) / 2, iw, ih);
        cx.fillStyle = '#5a4a3a'; cx.font = 'italic 34px "Bodoni Moda", Georgia, serif'; cx.textAlign = 'center';
        cx.fillText(o.caption || '', cv.width / 2, cv.height - m * 0.9);
      }
      cx.globalAlpha = o.paperTexture * 2.2; cx.globalCompositeOperation = 'overlay';
      cx.fillStyle = cx.createPattern(grain, 'repeat'); cx.fillRect(0, 0, cv.width, cv.height);
      cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
      tex.needsUpdate = true;
    }
    paint(null);
    const im = new Image(); im.onload = () => paint(im); im.src = o.src;

    const geo = new T.PlaneGeometry(pw, ph, o.detail, o.detail);
    const pos = geo.attributes.position, orig = Float32Array.from(pos.array);
    const mat = new T.MeshStandardMaterial({ map: tex, roughness: o.roughness, metalness: 0, side: T.DoubleSide });
    const mesh = new T.Mesh(geo, mat); scene.add(mesh);

    // seeded folds
    let s = o.seed >>> 0;
    const rand = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const folds = Array.from({ length: o.foldCount }, () => {
      const a = rand() * Math.PI, nx = Math.cos(a), ny = Math.sin(a);
      return { nx, ny, d: (rand() - 0.5) * pw * 0.6, amp: (0.12 + rand() * 0.22) * (rand() < 0.5 ? -1 : 1) };
    });
    const noise = (x, y) => (Math.sin(x * 2.3 + y * 1.7) + Math.sin(x * 3.7 - y * 2.9 + 1.3) * 0.6 + Math.sin(x * 5.9 + y * 4.3 + 2.1) * 0.35) / 1.95;
    function shape(c) {
      for (let i = 0; i < pos.count; i++) {
        const x = orig[i * 3], y = orig[i * 3 + 1];
        let z = 0;
        for (const f of folds) {
          const dist = x * f.nx + y * f.ny - f.d;
          z += f.amp * c * (Math.abs(dist) * (0.4 + o.foldSharpness) - Math.abs(f.d) * 0.2);
          z += o.creaseStrength * c * 0.08 * Math.sign(dist) * Math.exp(-Math.abs(dist) * 18);
        }
        z += o.wrinkleDepth * c * 0.05 * noise(x * 3, y * 3);
        const shrink = 1 - 0.38 * c;
        pos.array[i * 3] = x * shrink + o.wrinkleDepth * c * 0.03 * noise(y * 5, x * 2);
        pos.array[i * 3 + 1] = y * shrink + o.wrinkleDepth * c * 0.03 * noise(x * 4, y * 5);
        pos.array[i * 3 + 2] = z;
      }
      pos.needsUpdate = true; geo.computeVertexNormals();
    }
    let c = 0, cTarget = 0, dragging = false, start = null, off = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, lastP = null;
    const pxToWorld = ph / H * 1.35;
    const el = renderer.domElement; el.style.touchAction = 'none'; el.style.cursor = 'grab';
    el.addEventListener('pointerdown', e => {
      if (o.disabled) return;
      dragging = true; cTarget = o.crumpleAmount; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
      start = { x: e.clientX - off.x / pxToWorld, y: e.clientY + off.y / pxToWorld }; lastP = { x: e.clientX, y: e.clientY };
      host.classList.add('is-crumpled');
    });
    el.addEventListener('pointermove', e => {
      if (!dragging || !o.draggable) return;
      let dx = e.clientX - start.x, dy = e.clientY - start.y;
      const len = Math.hypot(dx, dy); if (len > o.dragRadius) { dx *= o.dragRadius / len; dy *= o.dragRadius / len; }
      off.x = dx * pxToWorld; off.y = -dy * pxToWorld;
      vel.x = e.clientX - lastP.x; vel.y = e.clientY - lastP.y; lastP = { x: e.clientX, y: e.clientY };
    });
    const up = () => {
      if (!dragging) return; dragging = false; el.style.cursor = 'grab';
      if (o.releaseBehavior === 'restore') cTarget = 0;
      host.classList.remove('is-crumpled');
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const dur = cTarget > c ? o.crumpleDuration : o.releaseDuration;
      c += (cTarget - c) * clamp(dt / (dur * 0.35), 0, 1);
      shape(c);
      if (!dragging && o.returnToOrigin) { off.x *= 0.88; off.y *= 0.88; }
      vel.x *= 0.85; vel.y *= 0.85;
      mesh.position.x = lerp(mesh.position.x, off.x, 0.25);
      mesh.position.y = lerp(mesh.position.y, off.y, 0.25);
      const rot = T.MathUtils.degToRad(o.dragRotation);
      mesh.rotation.y = lerp(mesh.rotation.y, clamp(vel.x * 0.05, -1, 1) * rot + c * 0.25, 0.15);
      mesh.rotation.x = lerp(mesh.rotation.x, clamp(vel.y * 0.05, -1, 1) * rot - c * 0.15, 0.15);
      mesh.rotation.z = T.MathUtils.degToRad(o.rotation) + c * 0.2;
      renderer.render(scene, cam);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  const paper = document.getElementById('paper');
  if (paper) paperCrumple(paper, {
    src: paper.dataset.src, caption: paper.dataset.caption, width: 400, height: 460, sceneHeight: 420,
    releaseBehavior: 'restore', crumpleAmount: 0.85, crumpleDuration: 0.55, releaseDuration: 0.4,
    foldCount: 6, foldSharpness: 0.6, wrinkleDepth: 0.65, creaseStrength: 0.18, paperColor: '#f4f0e8',
    paperTexture: 0.08, draggable: true, returnToOrigin: true, roughness: 0.92, lightIntensity: 1.8,
    lightAngle: -35, dragRotation: 10, dragRadius: 180, rotation: -3, seed: 7, detail: 64, disabled: false
  });

  /* ================= DodgeField (vanilla) ================= */
  function dodgeField(field, o) {
    const target = field.querySelector('.dodge-target');
    const label = field.querySelector('.dodge-label');
    let ox = 0, oy = 0, dodges = 0, gave = false, caught = false, fleeing = false, idleTimer;
    const render = () => {
      label.textContent = caught ? o.caughtText : gave ? 'Okay, okay' : dodges ? `Nope x${dodges}` : 'Catch me';
    };
    const place = (ms, ease) => {
      target.style.transition = `transform ${ms}ms ${ease}`;
      target.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
    };
    const home = () => { ox = 0; oy = 0; place(o.returnDuration, `cubic-bezier(.34,${1 + o.returnBounce * 4},.64,1)`); fleeing = false; };
    function flee(px, py) {
      if (gave || caught) return;
      const fr = field.getBoundingClientRect(), tr = target.getBoundingClientRect();
      const cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
      const dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy) || 1;
      if (d > o.radius) return;
      if (!fleeing) { dodges++; fleeing = true; if (dodges >= o.patience) { gave = true; render(); home(); return; } }
      const push = o.reach * Math.pow(1 - d / o.radius, 1 / o.falloff) + 8;
      ox += (o.axis !== 'y' ? dx / d * push : 0); oy += (o.axis !== 'x' ? dy / d * push : 0);
      const mx = fr.width / 2 - tr.width / 2 - 6, my = fr.height / 2 - tr.height / 2 - 6;
      ox = clamp(ox, -mx, mx); oy = clamp(oy, -my, my);
      place(o.fleeDuration, 'cubic-bezier(.2,.8,.3,1)'); render();
      clearTimeout(idleTimer); idleTimer = setTimeout(() => { fleeing = false; }, 450);
    }
    field.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') flee(e.clientX, e.clientY); });
    field.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && !e.target.closest('.dodge-target')) flee(e.clientX, e.clientY); });
    field.addEventListener('pointerleave', () => { if (!gave) setTimeout(home, 600); });
    const openForm = () => {
      caught = true; render(); field.classList.add('caught');
      ox = 0; oy = 0; place(200, 'ease');
      const form = field.querySelector('.reach');
      setTimeout(() => {
        field.querySelector('.dodge-game').hidden = true; form.hidden = false;
        if (window.gsap) gsap.from(form.children, { y: 14, opacity: 0, stagger: 0.04, duration: 0.45, ease: 'power2.out' });
        form.querySelector('input').focus({ preventScroll: true });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, 650);
    };
    target.addEventListener('click', () => { if (gave || dodges >= o.patience) openForm(); });
    const skip = field.querySelector('.dodge-skip'); if (skip) skip.addEventListener('click', openForm);
    place(0, 'linear'); render();
  }
  const dodge = document.getElementById('dodge');
  if (dodge) dodgeField(dodge, { reach: 72, radius: 120, falloff: 2, fleeDuration: 130, returnDuration: 620,
    returnBounce: 0.1, axis: 'both', patience: 4, caughtText: 'You got me' });

  /* ================= Contact form ================= */
  // Paste your Formspree endpoint here, e.g. 'https://formspree.io/f/abcdwxyz'
  const FORM_ENDPOINT = 'https://formspree.io/f/xvkkjzrw';
  const reach = document.getElementById('reach');
  if (reach) reach.addEventListener('submit', async e => {
    e.preventDefault();
    const status = document.getElementById('reachStatus');
    const data = Object.fromEntries(new FormData(reach));
    if (!data.name || !data.email || !data.message) { status.textContent = 'Fill in your name, email and a message.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) { status.textContent = 'That email doesn\'t look right.'; return; }
    if (!FORM_ENDPOINT) { status.textContent = 'The form isn\'t connected yet. Reach me on LinkedIn for now.'; return; }
    status.textContent = 'Sending...';
    try {
      const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error();
      reach.reset(); status.textContent = 'Sent. I\'ll get back to you soon.';
    } catch (err) { status.textContent = 'That didn\'t send. Try again, or message me on LinkedIn.'; }
  });
})();
