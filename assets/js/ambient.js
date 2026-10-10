/* ============================================================
   666pallxXx — AMBIENT LAYER
   Kabut, bara api, dan grid perspektif di latar belakang situs
   ============================================================ */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  let cv, ctx, W = 0, H = 0, DPR = 1, t = 0, running = true;
  let embers = [], smokes = [], stars = [];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function seed() {
    embers = [];
    const n = W < 700 ? 46 : 96;
    for (let i = 0; i < n; i++) {
      embers.push({
        x: Math.random() * W, y: Math.random() * H,
        r: rnd(0.5, 2.3), vy: rnd(-26, -7), vx: rnd(-7, 7),
        a: rnd(0.15, 0.8), ph: Math.random() * TAU,
        c: Math.random() < 0.78 ? [255, 84, 54] : (Math.random() < 0.5 ? [255, 205, 150] : [170, 195, 255])
      });
    }
    smokes = [];
    for (let i = 0; i < 7; i++) {
      smokes.push({
        x: Math.random() * W, y: rnd(H * 0.35, H * 1.05),
        r: rnd(H * 0.22, H * 0.6), vx: rnd(-9, 9), vy: rnd(-4, -1),
        a: rnd(0.018, 0.05),
        c: i % 3 === 0 ? [255, 40, 44] : (i % 3 === 1 ? [90, 120, 255] : [220, 226, 245])
      });
    }
    stars = [];
    for (let i = 0; i < (W < 700 ? 60 : 130); i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: rnd(0.3, 1.2), a: rnd(0.1, 0.6), ph: Math.random() * TAU });
    }
  }

  function resize() {
    if (!cv) return;
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
  }

  function frame(now) {
    if (!running) { requestAnimationFrame(frame); return; }
    const dt = 1 / 60;
    t += dt;
    ctx.clearRect(0, 0, W, H);

    // bintang/debu statis
    ctx.globalCompositeOperation = 'lighter';
    for (const s of stars) {
      const a = s.a * (0.55 + 0.45 * Math.sin(t * 1.6 + s.ph));
      ctx.fillStyle = `rgba(210,224,255,${a.toFixed(3)})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    // kabut
    ctx.globalCompositeOperation = 'source-over';
    for (const s of smokes) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.y < -s.r) { s.y = H + s.r; s.x = Math.random() * W; }
      if (s.x < -s.r) s.x = W + s.r; if (s.x > W + s.r) s.x = -s.r;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${s.a})`);
      g.addColorStop(1, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }

    // bara
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) {
      e.y += e.vy * dt;
      e.x += (e.vx + Math.sin(t * 0.8 + e.ph) * 9) * dt;
      if (e.y < -12) { e.y = H + 12; e.x = Math.random() * W; }
      if (e.x < -12) e.x = W + 12; if (e.x > W + 12) e.x = -12;
      const a = e.a * (0.55 + 0.45 * Math.sin(t * 3 + e.ph));
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 5);
      g.addColorStop(0, `rgba(${e.c[0]},${e.c[1]},${e.c[2]},${a.toFixed(3)})`);
      g.addColorStop(1, `rgba(${e.c[0]},${e.c[1]},${e.c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 5, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  window.Ambient666 = {
    init(el) {
      cv = el; ctx = el.getContext('2d');
      resize();
      window.addEventListener('resize', resize, { passive: true });
      document.addEventListener('visibilitychange', () => { running = !document.hidden; });
      requestAnimationFrame(frame);
    }
  };
})();
