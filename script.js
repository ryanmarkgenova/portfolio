(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- film frame flip ---------- */
  const strip = document.getElementById('strip');
  const frameNo = document.getElementById('frameNo');
  const hint = document.getElementById('stripHint');
  strip.addEventListener('click', () => {
    const on = strip.getAttribute('aria-pressed') !== 'true';
    strip.setAttribute('aria-pressed', on);
    frameNo.textContent = on ? '▸ 01B' : '▸ 01A';
    hint.textContent = on ? 'Tap again for the photo' : 'Tap the frame to flip it';
  });

  /* ---------- typewriter role ---------- */
  const typed = document.getElementById('typed');
  const roles = ['Data + Cyber Analyst', 'Data Analyst', 'Cyber Analyst', 'Videographer'];
  if (typed && !reduce) {
    let r = 0, n = roles[0].length, deleting = true;
    const tick = () => {
      const word = roles[r];
      if (deleting) {
        n--;
        if (n <= 0) { deleting = false; r = (r + 1) % roles.length; }
      } else {
        n++;
        if (n >= roles[r].length) { deleting = true; typed.textContent = roles[r]; return setTimeout(tick, 2200); }
      }
      typed.textContent = roles[r].slice(0, Math.max(n, 0));
      setTimeout(tick, deleting ? 45 : 85);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- dashboard filters ---------- */
  const cards = [...document.querySelectorAll('.card')];
  const typeBoxes = [...document.querySelectorAll('input[name="type"]')];
  const areaRadios = [...document.querySelectorAll('input[name="area"]')];
  const count = document.getElementById('projCount');
  const empty = document.getElementById('empty');

  function applyFilters() {
    const types = typeBoxes.filter(b => b.checked).map(b => b.value);
    const area = areaRadios.find(r => r.checked).value;
    let shown = 0;
    cards.forEach(card => {
      const t = card.dataset.type.split(' ');
      const a = card.dataset.area.split(' ');
      const ok = t.some(x => types.includes(x)) && (area === 'all' || a.includes(area));
      card.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = shown;
    empty.hidden = shown > 0;
  }
  function reset() {
    typeBoxes.forEach(b => (b.checked = true));
    areaRadios[0].checked = true;
    applyFilters();
  }
  typeBoxes.concat(areaRadios).forEach(el => el.addEventListener('change', applyFilters));
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('reset2').addEventListener('click', reset);

  /* ---------- hover video previews ----------
     Set data-preview="previews/your-clip.mp4" on a .thumb to turn it on.
     Plays muted on hover (desktop) or when scrolled into view (phones). */
  const thumbs = [...document.querySelectorAll('.thumb[data-preview]')].filter(t => t.dataset.preview);
  thumbs.forEach(t => {
    const v = document.createElement('video');
    v.src = t.dataset.preview; v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata';
    t.prepend(v);
    const card = t.closest('.card');
    card.addEventListener('mouseenter', () => v.play().catch(() => {}));
    card.addEventListener('mouseleave', () => { v.pause(); });
  });
  if (thumbs.length && matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const v = e.target.querySelector('video');
      if (!v) return;
      e.isIntersecting ? v.play().catch(() => {}) : v.pause();
    }), { threshold: 0.6 });
    thumbs.forEach(t => io.observe(t));
  }
})();
