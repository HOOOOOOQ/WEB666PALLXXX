/* ============================================================
   666pallxXx — APP / INTERAKSI
   splash screen, navigasi, kursor, tilt 3D, audio, reveal
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mq = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  // penyimpanan aman: beberapa WebView / mode privat melempar exception
  const store = {
    get(k) { try { return window.localStorage ? window.localStorage.getItem(k) : null; } catch (e) { return null; } },
    set(k, v) { try { if (window.localStorage) window.localStorage.setItem(k, v); } catch (e) { /* abaikan */ } }
  };
  const reduceMotion = mq('(prefers-reduced-motion: reduce)');

  /* ==========================================================
     AUDIO AMBIEN (WebAudio, tanpa file eksternal)
     ========================================================== */
  const Sound666 = (function () {
    let ctxA = null, master = null, on = false, ready = false, bellTimer = null;

    function ensure() {
      if (ready) return ctxA;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxA = new AC();
      master = ctxA.createGain();
      master.gain.value = 0;
      master.connect(ctxA.destination);

      // drone rendah
      const filt = ctxA.createBiquadFilter();
      filt.type = 'lowpass'; filt.frequency.value = 320; filt.Q.value = 6;
      const gDrone = ctxA.createGain(); gDrone.gain.value = 0.20;
      filt.connect(gDrone); gDrone.connect(master);
      [55, 55.6, 82.5, 110.3].forEach((f, i) => {
        const o = ctxA.createOscillator();
        o.type = i % 2 ? 'sawtooth' : 'triangle';
        o.frequency.value = f;
        const g = ctxA.createGain(); g.gain.value = i > 1 ? 0.10 : 0.24;
        o.connect(g); g.connect(filt); o.start();
      });
      // LFO filter
      const lfo = ctxA.createOscillator(); lfo.frequency.value = 0.06;
      const lfoG = ctxA.createGain(); lfoG.gain.value = 170;
      lfo.connect(lfoG); lfoG.connect(filt.frequency); lfo.start();

      // angin (noise)
      const len = ctxA.sampleRate * 3;
      const buf = ctxA.createBuffer(1, len, ctxA.sampleRate);
      const d = buf.getChannelData(0);
      let lastV = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; lastV = (lastV + 0.02 * w) / 1.02; d[i] = lastV * 3.2; }
      const noise = ctxA.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const nf = ctxA.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 420; nf.Q.value = 0.7;
      const ng = ctxA.createGain(); ng.gain.value = 0.10;
      noise.connect(nf); nf.connect(ng); ng.connect(master); noise.start();

      ready = true;
      return ctxA;
    }

    function bells() {
      if (bellTimer) return;
      const tick = () => {
        if (on && ctxA) {
          const notes = [220, 246.94, 293.66, 329.63, 440];
          const f = notes[(Math.random() * notes.length) | 0];
          const o = ctxA.createOscillator(); o.type = 'sine'; o.frequency.value = f;
          const o2 = ctxA.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.01;
          const g = ctxA.createGain();
          const now = ctxA.currentTime;
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.055, now + 0.4);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 6);
          const g2 = ctxA.createGain(); g2.gain.value = 0.3;
          o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
          o.start(now); o2.start(now); o.stop(now + 6.2); o2.stop(now + 6.2);
        }
        bellTimer = setTimeout(tick, 5000 + Math.random() * 9000);
      };
      tick();
    }

    return {
      toggle() {
        ensure();
        if (!ctxA) return false;
        if (ctxA.state === 'suspended') ctxA.resume();
        on = !on;
        const now = ctxA.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setTargetAtTime(on ? 0.5 : 0, now, 0.6);
        if (on) bells();
        return on;
      },
      isOn() { return on; },
      roar() {
        ensure(); if (!ctxA) return;
        const now = ctxA.currentTime;
        const o = ctxA.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(150, now);
        o.frequency.exponentialRampToValueAtTime(38, now + 1.5);
        const f = ctxA.createBiquadFilter(); f.type = 'lowpass';
        f.frequency.setValueAtTime(1400, now);
        f.frequency.exponentialRampToValueAtTime(180, now + 1.6);
        const g = ctxA.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(on ? 0.42 : 0.0, now + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
        o.connect(f); f.connect(g); g.connect(ctxA.destination);
        o.start(now); o.stop(now + 1.9);
        // desis
        const len = ctxA.sampleRate * 1.4;
        const buf = ctxA.createBuffer(1, len, ctxA.sampleRate);
        const dd = buf.getChannelData(0);
        for (let i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctxA.createBufferSource(); src.buffer = buf;
        const bp = ctxA.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
        const g2 = ctxA.createGain(); g2.gain.value = on ? 0.16 : 0.0;
        src.connect(bp); bp.connect(g2); g2.connect(ctxA.destination); src.start(now);
      },
      click() {
        ensure(); if (!ctxA || !on) return;
        const now = ctxA.currentTime;
        const o = ctxA.createOscillator(); o.type = 'square'; o.frequency.value = 1100;
        const g = ctxA.createGain();
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        o.connect(g); g.connect(ctxA.destination); o.start(now); o.stop(now + 0.08);
      },
      riser() {
        ensure(); if (!ctxA) return;
        const now = ctxA.currentTime;
        const o = ctxA.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(60, now);
        o.frequency.exponentialRampToValueAtTime(600, now + 1.1);
        const f = ctxA.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        const g = ctxA.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.16, now + 0.9);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        o.connect(f); f.connect(g); g.connect(ctxA.destination);
        o.start(now); o.stop(now + 1.5);
      },
      unlock() { ensure(); if (ctxA && ctxA.state === 'suspended') ctxA.resume(); }
    };
  })();
  window.Sound666 = Sound666;

  /* ==========================================================
     SPLASH SCREEN
     ========================================================== */
  function initSplash() {
    const sp = $('#splash');
    if (!sp) return;
    const bar = $('#sp-bar'), num = $('#sp-num'), status = $('#sp-status');
    const enter = $('#sp-enter'), skip = $('#sp-skip');
    const lines = [
      'MEMUAT INTI 666 …', 'MENGHUBUNGKAN SALURAN PALL …',
      'MEMBANGKITKAN NAGA …', 'MENYALAKAN API …', 'SINKRON 666 FAMILY …',
      '666 GVNK SIAP …'
    ];
    const visited = store.get('666_visited') === '1';
    const total = visited ? 1200 : 2600;
    let p = 0, done = false, started = performance.now();

    const tick = setInterval(() => {
      const el = performance.now() - started;
      p = clamp(Math.round((el / total) * 100), 0, 100);
      if (bar) bar.style.width = p + '%';
      if (num) num.textContent = String(p).padStart(3, '0');
      if (status) status.textContent = lines[Math.min(lines.length - 1, Math.floor((p / 100) * lines.length))];
      if (p >= 100) {
        clearInterval(tick);
        done = true;
        sp.classList.add('is-ready');
        if (enter) enter.removeAttribute('disabled');
        if (visited) setTimeout(closeSplash, 350);
      }
    }, 40);

    function closeSplash() {
      if (sp.classList.contains('is-gone')) return;
      Sound666.unlock();
      Sound666.riser();
      sp.classList.add('is-closing');
      document.body.classList.remove('is-locked');
      setTimeout(() => {
        sp.classList.add('is-gone');
        sp.setAttribute('aria-hidden', 'true');
        document.body.classList.add('entered');
        Sound666.roar();
        if (window.Dragon666) window.Dragon666.roar();
        const hero = $('#beranda');
        if (hero) hero.classList.add('hero--live');
      }, 1150);
      store.set('666_visited', '1');
    }
    if (enter) enter.addEventListener('click', () => { if (done) closeSplash(); });
    if (skip) skip.addEventListener('click', closeSplash);
    sp.addEventListener('click', (e) => {
      if (e.target === sp || e.target.classList.contains('sp-bg')) { if (done) closeSplash(); }
    });
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && !sp.classList.contains('is-gone')) {
        e.preventDefault(); closeSplash();
      }
    });
  }

  /* ==========================================================
     HEADER / NAV / PROGRESS
     ========================================================== */
  function initNav() {
    const hdr = $('#hdr'), prog = $('#progress'), burger = $('#burger'), drawer = $('#drawer');
    const links = $$('[data-nav]');
    const secs = $$('main section[id]');

    function onScroll() {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
      if (hdr) hdr.classList.toggle('hdr--solid', y > 40);
      let cur = '';
      for (const s of secs) {
        if (s.getBoundingClientRect().top <= window.innerHeight * 0.35) cur = s.id;
      }
      links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + cur));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger && drawer) {
      burger.addEventListener('click', () => {
        const open = drawer.classList.toggle('is-open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        Sound666.click();
      });
      $$('a', drawer).forEach(a => a.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        burger.classList.remove('is-open');
      }));
    }

    // smooth scroll
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const el = $(id);
        if (!el) return;
        e.preventDefault();
        Sound666.click();
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 68, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    const top = $('#to-top');
    if (top) {
      window.addEventListener('scroll', () => top.classList.toggle('is-on', window.scrollY > 700), { passive: true });
      top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    }
  }

  /* ==========================================================
     KURSOR KUSTOM
     ========================================================== */
  function initCursor() {
    const dot = $('#cursor'), ring = $('#cursor-ring');
    if (!dot || !ring || mq('(pointer: coarse)')) {
      if (dot) dot.style.display = 'none';
      if (ring) ring.style.display = 'none';
      return;
    }
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = `translate3d(${mx - 4}px, ${my - 4}px, 0)`;
      ring.style.transform = `translate3d(${rx - 19}px, ${ry - 19}px, 0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', (e) => {
      const hit = e.target.closest('a,button,.tilt,input');
      ring.classList.toggle('is-hot', !!hit);
      dot.classList.toggle('is-hot', !!hit);
    });
    document.addEventListener('mousedown', () => ring.classList.add('is-down'));
    document.addEventListener('mouseup', () => ring.classList.remove('is-down'));
  }

  /* ==========================================================
     REVEAL ON SCROLL
     ========================================================== */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(e => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    els.forEach((e, i) => { e.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms'; io.observe(e); });
  }

  /* ==========================================================
     COUNTER
     ========================================================== */
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length || !('IntersectionObserver' in window)) {
      els.forEach(e => { e.textContent = e.dataset.count + (e.dataset.suffix || ''); });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const target = parseFloat(el.dataset.count);
        const dur = 1500, t0 = performance.now();
        const suffix = el.dataset.suffix || '';
        (function step(now) {
          const k = clamp((now - t0) / dur, 0, 1);
          const e = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(target * e).toLocaleString('id-ID') + suffix;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.5 });
    els.forEach(e => io.observe(e));
  }

  /* ==========================================================
     TILT 3D KARTU
     ========================================================== */
  function initTilt() {
    if (mq('(pointer: coarse)')) return;
    $$('.tilt').forEach(card => {
      const glow = $('.tilt-glow', card);
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', ((0.5 - y) * 16).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((x - 0.5) * 20).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        card.classList.add('is-tilting');
        if (glow) glow.style.opacity = '1';
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
        card.classList.remove('is-tilting');
        if (glow) glow.style.opacity = '0';
      });
    });
  }

  /* ==========================================================
     NAGA: pointer, tombol, visibilitas
     ========================================================== */
  function initDragon() {
    const cv = $('#dragon');
    if (!cv || !window.Dragon666) return;
    const D = window.Dragon666;
    D.init(cv);
    D.onRoar = null;
    if (window.Dragon666.api) window.Dragon666.api.onRoar = () => Sound666.roar();

    window.addEventListener('mousemove', (e) => {
      D.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return;
      D.setPointer((e.touches[0].clientX / window.innerWidth) * 2 - 1, (e.touches[0].clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma === null) return;
      D.setPointer(clamp(e.gamma / 32, -1, 1), clamp((e.beta - 45) / 40, -1, 1));
    }, { passive: true });

    const roarBtn = $('#btn-roar'), camBtn = $('#btn-cam');
    if (roarBtn) roarBtn.addEventListener('click', () => {
      Sound666.unlock(); D.roar();
      if (roarBtn.animate) roarBtn.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }],
        { duration: 260, easing: 'ease-out' }
      );
    });
    const modes = ['IKUTI KURSOR', 'CLOSE-UP', 'ORBIT'];
    let m = 0;
    if (camBtn) camBtn.addEventListener('click', () => {
      m = (m + 1) % modes.length;
      D.setCamMode(m);
      const lbl = document.getElementById('cam-label'); if (lbl) lbl.textContent = modes[m];
      Sound666.click();
    });
    cv.addEventListener('click', () => { Sound666.unlock(); D.roar(); });

    // hemat baterai: stop kalau hero tidak terlihat
    const hero = $('#beranda');
    if (hero && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => {
        D.setRunning(en[0].isIntersecting && !document.hidden);
      }, { threshold: 0.02 });
      io.observe(hero);
    }
    document.addEventListener('visibilitychange', () => D.setRunning(!document.hidden));

    // HUD fps
    const hud = $('#dragon-hud');
    const ffps = $('#ftr-fps');
    if (hud) setInterval(() => {
      const fps = Math.round(D.api.stats.fps);
      hud.textContent = `${fps} FPS · ${D.api.stats.quads} POLIGON · 3D REALTIME`;
      if (ffps) ffps.textContent = `siaga · ${fps} fps`;
    }, 500);
  }

  /* ==========================================================
     LAIN-LAIN: jam, tahun, marquee duplikat, tombol audio
     ========================================================== */
  function initMisc() {
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

    const clock = $('#clock');
    if (clock) {
      const upd = () => {
        const d = new Date();
        clock.textContent = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
      };
      upd(); setInterval(upd, 1000);
    }

    $$('.marquee-track').forEach(tr => { tr.innerHTML += tr.innerHTML; });

    const snd = $('#sound-toggle');
    if (snd) {
      snd.addEventListener('click', () => {
        const on = Sound666.toggle();
        snd.classList.toggle('is-on', on);
        snd.setAttribute('aria-pressed', on ? 'true' : 'false');
        const lbl = $('#sound-label');
        if (lbl) lbl.textContent = on ? 'AUDIO: NYALA' : 'AUDIO: MATI';
        $$('.eq i').forEach((b, i) => b.style.animationPlayState = on ? 'running' : 'paused');
      });
      $$('.eq i').forEach(b => { b.style.animationPlayState = 'paused'; });
    }

    // salin handle
    $$('[data-copy]').forEach(el => {
      el.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(el.dataset.copy);
          const old = el.dataset.label || 'SALIN';
          el.dataset.label = 'TERSALIN!';
          const span = el.querySelector('.copy-txt');
          if (span) span.textContent = 'TERSALIN ✓';
          Sound666.click();
          setTimeout(() => { if (span) span.textContent = old; }, 1400);
        } catch (err) { /* clipboard ditolak */ }
      });
    });

    // glitch judul acak
    const gl = $('#glitch-title');
    if (gl && !reduceMotion) {
      setInterval(() => {
        gl.classList.add('is-glitching');
        setTimeout(() => gl.classList.remove('is-glitching'), 420);
      }, 4200);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-locked');
    initSplash();
    initNav();
    initCursor();
    initReveal();
    initCounters();
    initTilt();
    initDragon();
    initMisc();
    if (window.Ambient666 && $('#ambient')) window.Ambient666.init($('#ambient'));
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
      window.addEventListener(ev, () => Sound666.unlock(), { once: true, passive: true }));
  });
})();
