/* ============================================================
   666pallxXx — PROSEDURAL 3D DRAGON ENGINE
   Ditulis dari nol (tanpa library). Software renderer:
   mesh prosedural -> proyeksi perspektif -> painter's algorithm
   ============================================================ */
(function () {
  'use strict';

  /* ---------- math ---------- */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;

  function norm(a) {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function scale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function rotAxis(p, ax, ang) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const d = ax[0] * p[0] + ax[1] * p[1] + ax[2] * p[2];
    const cr = cross(ax, p);
    return [
      p[0] * c + cr[0] * s + ax[0] * d * (1 - c),
      p[1] * c + cr[1] * s + ax[1] * d * (1 - c),
      p[2] * c + cr[2] * s + ax[2] * d * (1 - c)
    ];
  }
  // frame lokal: fx = arah maju, fy = atas, fz = kanan
  function toWorld(fr, p) {
    return [
      fr.c[0] + fr.fx[0] * p[0] + fr.fy[0] * p[1] + fr.fz[0] * p[2],
      fr.c[1] + fr.fx[1] * p[0] + fr.fy[1] * p[1] + fr.fz[1] * p[2],
      fr.c[2] + fr.fx[2] * p[0] + fr.fy[2] * p[1] + fr.fz[2] * p[2]
    ];
  }

  /* ---------- konfigurasi tampilan ---------- */
  const COL = {
    bone:   [226, 231, 242],
    silver: [168, 179, 201],
    steel:  [104, 114, 138],
    slate:  [58, 64, 82],
    dark:   [26, 29, 40],
    blood:  [150, 16, 34],
    ember:  [255, 74, 60],
    gold:   [232, 190, 130]
  };
  function mixc(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  const LIGHT = {
    key:  norm([-0.42, 0.84, 0.42]),
    rim:  norm([0.78, -0.18, -0.62]),
    fill: norm([-0.72, -0.34, 0.48])
  };

  /* ---------- profil tubuh (u: 0 = ekor, 1 = pangkal leher) ---------- */
  const STATIONS = [
    [0.000, 0.030], [0.018, 0.215], [0.042, 0.300], [0.070, 0.245], [0.105, 0.330], [0.145, 0.392],
    [0.170, 0.450], [0.220, 0.510], [0.275, 0.570], [0.330, 0.630], [0.385, 0.692],
    [0.435, 0.752], [0.480, 0.808], [0.520, 0.855], [0.556, 0.895], [0.590, 0.925],
    [0.622, 0.948], [0.652, 0.965], [0.680, 0.978], [0.706, 0.986], [0.730, 0.992],
    [0.752, 0.995], [0.773, 0.995], [0.793, 0.990], [0.812, 0.980], [0.830, 0.965],
    [0.847, 0.944], [0.863, 0.918], [0.878, 0.888], [0.892, 0.854], [0.905, 0.818],
    [0.917, 0.782], [0.929, 0.746], [0.940, 0.712], [0.950, 0.680], [0.960, 0.652],
    [0.969, 0.628], [0.977, 0.608], [0.985, 0.592], [0.992, 0.580], [1.000, 0.572]
  ];
  const NSTAT = STATIONS.length;
  function radiusAt(u) {
    u = clamp(u, 0, 1);
    let lo = 0, hi = NSTAT - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (STATIONS[mid][0] <= u) lo = mid; else hi = mid;
    }
    const a = STATIONS[lo], b = STATIONS[hi];
    const t = (u - a[0]) / (b[0] - a[0] || 1);
    return lerp(a[1], b[1], t * t * (3 - 2 * t));
  }

  /* ---------- profil kepala (x = maju, y = atas, z = kanan) ---------- */
  const SKULL = [
    { p: [0.00, 0.00, 0.00], r: 0.585, yk: 0.94 },
    { p: [0.30, 0.05, 0.00], r: 0.615, yk: 0.92 },
    { p: [0.60, 0.08, 0.00], r: 0.590, yk: 0.86 },
    { p: [0.88, 0.03, 0.00], r: 0.520, yk: 0.80 },
    { p: [1.14, -0.04, 0.00], r: 0.430, yk: 0.74 },
    { p: [1.40, -0.11, 0.00], r: 0.345, yk: 0.70 },
    { p: [1.64, -0.17, 0.00], r: 0.268, yk: 0.66 },
    { p: [1.85, -0.22, 0.00], r: 0.195, yk: 0.62 },
    { p: [2.02, -0.25, 0.00], r: 0.120, yk: 0.58 },
    { p: [2.12, -0.26, 0.00], r: 0.045, yk: 0.55 }
  ];
  const JAW = [
    { p: [0.16, -0.40, 0.00], r: 0.330, yk: 0.60 },
    { p: [0.52, -0.42, 0.00], r: 0.315, yk: 0.56 },
    { p: [0.92, -0.41, 0.00], r: 0.275, yk: 0.54 },
    { p: [1.30, -0.38, 0.00], r: 0.225, yk: 0.52 },
    { p: [1.64, -0.35, 0.00], r: 0.165, yk: 0.50 },
    { p: [1.92, -0.32, 0.00], r: 0.100, yk: 0.48 },
    { p: [2.07, -0.30, 0.00], r: 0.040, yk: 0.46 }
  ];
  const JAW_HINGE = [-0.05, -0.26, 0];
  const NECK_STEPS = 7;

  /* ---------- state ---------- */
  const api = {
    el: null,
    running: true,
    quality: 1,
    t: 0,
    speed: 1,
    roar: 0,
    roarT: -99,
    mouth: 0,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
    camMode: 0,
    onRoar: null,
    stats: { fps: 60, quads: 0 }
  };

  let canvas, ctx, W = 0, H = 0, DPR = 1;
  let list = [];          // daftar render (semua elemen 3D)
  let parts = [];         // partikel api
  let motes = [];         // partikel aura
  let fog = [];           // kabut volumetrik
  let bodyFrames = [];    // frame tulang punggung
  let bodyCtr = [0, 0, 0];
  let camPos = [0, 0, 90], camTgt = [0, 0, 0], camF = [0, 0, -1], camR = [1, 0, 0], camU = [0, 1, 0];
  let focal = 900;
  let headFrame = null, headCenter = [0, 0, 0], mouthPos = [0, 0, 0];
  let last = 0, fpsAcc = 0, fpsN = 0, qualityTimer = 0;

  /* ---------- push primitif ---------- */
  function pushQuad(a, b, c, d, col, opt) {
    const z = (a[2] + b[2] + c[2] + d[2]) * 0.25;
    const q = {
      k: 0, v: [a, b, c, d], z: z, col: col,
      spec: opt && opt.spec || 0,
      em: opt && opt.em || 0,
      emc: (opt && opt.emc) || COL.ember,
      two: opt && opt.two || 0,
      alpha: opt && opt.alpha !== undefined ? opt.alpha : 1,
      add: opt && opt.add || 0,
      fog: opt && opt.fog !== undefined ? opt.fog : 1,
      flat: opt && opt.flat || 0
    };
    list.push(q);
  }
  function pushTri(a, b, c, col, opt) { pushQuad(a, b, c, a, col, opt); }
  function pushSprite(p, size, col, alpha, add) {
    list.push({ k: 1, v: [p], z: p[2], size: size, col: col, alpha: alpha, add: add || 1 });
  }

  /* ---------- tabung prosedural (kaki, tanduk, tulang sayap, leher) ---------- */
  function tube(path, rads, col, opt) {
    opt = opt || {};
    const seg = opt.seg || 9;
    const rings = [];
    for (let i = 0; i < path.length; i++) {
      const prev = path[Math.max(0, i - 1)], next = path[Math.min(path.length - 1, i + 1)];
      let t = norm(sub(next, prev));
      let ref = Math.abs(t[1]) < 0.92 ? [0, 1, 0] : [1, 0, 0];
      let rz = norm(cross(t, ref));
      let ry = norm(cross(rz, t));
      const tw = (opt.twist || 0) * (i / (path.length - 1 || 1));
      if (tw) { rz = rotAxis(rz, t, tw); ry = rotAxis(ry, t, tw); }
      const c = path[i], r = rads[Math.min(i, rads.length - 1)];
      const ring = new Array(seg);
      const yk = opt.yk || 1, zk = opt.zk || 1;
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        ring[j] = [
          c[0] + ry[0] * ca * r * yk + rz[0] * sa * r * zk,
          c[1] + ry[1] * ca * r * yk + rz[1] * sa * r * zk,
          c[2] + ry[2] * ca * r * yk + rz[2] * sa * r * zk
        ];
      }
      rings.push(ring);
    }
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], B = rings[i + 1];
      const t = i / (rings.length - 1);
      for (let j = 0; j < seg; j++) {
        const j2 = (j + 1) % seg;
        let c = col;
        if (opt.grad) c = mixc(opt.grad[0], opt.grad[1], t);
        pushQuad(A[j], A[j2], B[j2], B[j], c, opt);
      }
    }
    if (opt.cap !== false) {
      const lastR = rings[rings.length - 1];
      let cx = 0, cy = 0, cz = 0;
      for (let j = 0; j < seg; j++) { cx += lastR[j][0]; cy += lastR[j][1]; cz += lastR[j][2]; }
      const cc = [cx / seg, cy / seg, cz / seg];
      for (let j = 0; j < seg; j++) pushTri(lastR[j], lastR[(j + 1) % seg], cc, col, opt);
    }
    return rings;
  }

  /* ============================================================
     TULANG PUNGGUNG + TUBUH
     ============================================================ */
  function buildSpine(t, S, off) {
    const N = S.N;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = (u - 0.42) * S.L;
      const amp = S.amp * (0.10 + Math.pow(u, 1.45));
      const ph = u * S.waveK - t * S.waveW;
      const y = amp * Math.sin(ph) * 0.62 + S.L * 0.012 * Math.sin(u * 2.1 + t * 0.4);
      const z = amp * Math.cos(ph * 0.86 + 0.6);
      pts.push([x + off[0], y + off[1], z + off[2]]);
    }
    // frame
    const frames = [];
    const roll = S.roll;
    for (let i = 0; i <= N; i++) {
      const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(N, i + 1)];
      const fx = norm(sub(next, prev));
      let ref = [0, 1, 0];
      let fz0 = cross(fx, ref);
      if (fz0[0] * fz0[0] + fz0[1] * fz0[1] + fz0[2] * fz0[2] < 1e-6) fz0 = cross(fx, [1, 0, 0]);
      fz0 = norm(fz0);
      let fy0 = norm(cross(fz0, fx));
      const fy = fy0.map((v, k) => v * Math.cos(roll) + fz0[k] * Math.sin(roll) * -1);
      const fz = fy0.map((v, k) => v * Math.sin(roll) + fz0[k] * Math.cos(roll));
      frames.push({ c: pts[i], fx: fx, fy: norm(fy), fz: norm(fz) });
    }
    return frames;
  }

  function buildBody(t, S, off) {
    const frames = buildSpine(t, S, off);
    bodyFrames = frames;
    const seg = S.seg, N = S.N;
    const rings = [];
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i <= N; i++) {
      const fr = frames[i];
      const u = i / N;
      const r = radiusAt(u) * S.girth;
      const ring = new Array(seg);
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * TAU;
        const ca = Math.cos(a), sa = Math.sin(a);
        const yr = r * (1 + 0.10 * ca), zr = r * (0.94 + 0.06 * sa);
        ring[j] = [
          fr.c[0] + fr.fy[0] * ca * yr + fr.fz[0] * sa * zr,
          fr.c[1] + fr.fy[1] * ca * yr + fr.fz[1] * sa * zr,
          fr.c[2] + fr.fy[2] * ca * yr + fr.fz[2] * sa * zr
        ];
      }
      rings.push(ring);
      cx += fr.c[0]; cy += fr.c[1]; cz += fr.c[2];
    }
    bodyCtr = [cx / (N + 1), cy / (N + 1), cz / (N + 1)];

    // kulit
    for (let i = 0; i < N; i++) {
      const A = rings[i], B = rings[i + 1];
      const u = i / N;
      for (let j = 0; j < seg; j++) {
        const j2 = (j + 1) % seg;
        const ang = (j / seg) * TAU;
        const upness = Math.cos(ang) * 0.5 + 0.5;
        let c = mixc(COL.steel, COL.silver, Math.pow(upness, 0.9));
        c = mixc(c, COL.slate, 0.34 * (1 - upness));
        const band = 0.5 + 0.5 * Math.sin(j * 2.4 + u * 26);
        c = mixc(c, COL.bone, 0.16 * band * upness);
        if (u < 0.06) c = mixc(c, COL.dark, 1 - u / 0.06);
        pushQuad(A[j], A[j2], B[j2], B[j], c, { spec: 0.7, em: 0 });
      }
    }
    // tutup ekor
    const tr = rings[0];
    const tc = frames[0].c;
    for (let j = 0; j < seg; j++) pushTri(tr[j], tr[(j + 1) % seg], tc, COL.dark, { spec: 0.3 });
    return { frames: frames, rings: rings, S: S };
  }

  /* ============================================================
     SIRIP PUNGGUNG
     ============================================================ */
  function buildFin(t, body) {
    const S = body.S, frames = body.frames, N = S.N;
    const i0 = Math.floor(N * 0.30), i1 = N - 1;
    let prevTip = null, prevBase = null;
    for (let i = i0; i <= i1; i++) {
      const fr = frames[i], u = i / N;
      const env = Math.pow(Math.sin(Math.PI * clamp((u - 0.30) / 0.70, 0, 1)), 0.42);
      const h = S.girth * (1.0 * env * (0.30 + 0.70 * Math.abs(Math.sin(u * 34 + t * 1.2))));
      const base = add(fr.c, scale(fr.fy, radiusAt(u) * S.girth * 0.88));
      const tip = add(add(base, scale(fr.fy, h)), scale(fr.fx, -h * 0.30));
      if (prevTip) {
        pushQuad(prevBase, base, tip, prevTip, [104, 12, 24], {
          two: 1, spec: 0.2, em: 0.18, emc: COL.ember, alpha: 0.95
        });
      }
      prevTip = tip; prevBase = base;
    }
  }

  /* ============================================================
     LEHER + KEPALA
     ============================================================ */
  function buildHead(t, body, off) {
    const S = body.S, frames = body.frames, N = S.N;
    const fEnd = frames[N];
    const rEnd = radiusAt(1) * S.girth;
    const g = S.girth;
    const HG = g * 1.24;   // skala kepala

    // leher (melanjutkan gelombang)
    const neckPts = [];
    for (let i = 0; i <= NECK_STEPS; i++) {
      const u = 1 + (i / NECK_STEPS) * 0.42;
      const amp = S.amp * (0.10 + Math.pow(Math.min(u, 1), 1.45)) * (1 + 0.25 * (u - 1));
      const ph = u * S.waveK - t * S.waveW;
      const local = [
        (u - 1) * HG * 3.05,
        amp * Math.sin(ph) * 0.5 + g * 0.34 * (u - 1),
        amp * Math.cos(ph * 0.86 + 0.6) * 0.8
      ];
      neckPts.push(add(toWorld(fEnd, local), off));
    }
    const r0 = rEnd, r1 = g * SKULL[0].r;
    const neckRads = [];
    for (let i = 0; i <= NECK_STEPS; i++) {
      const k = i / NECK_STEPS;
      neckRads.push(lerp(r0, r1, k * k * (3 - 2 * k)));
    }
    const neckRings = tube(neckPts, neckRads, COL.silver, {
      seg: S.seg, cap: false,
      grad: [COL.steel, COL.silver]
    });
    // sambungkan leher ke cincin tubuh terakhir
    const lastBody = body.rings[N];
    const firstNeck = neckRings[0];
    for (let j = 0; j < S.seg; j++) {
      const j2 = (j + 1) % S.seg;
      const ang = (j / S.seg) * TAU, up = Math.cos(ang) * 0.5 + 0.5;
      pushQuad(lastBody[j], lastBody[j2], firstNeck[j2], firstNeck[j],
        mixc(COL.slate, COL.silver, up), { spec: 0.5 });
    }
    // sirip leher
    let pT = null, pB = null;
    for (let i = 0; i <= NECK_STEPS; i++) {
      const fr = neckFrameAt(neckPts, i);
      const h = HG * (0.34 + 0.30 * Math.abs(Math.sin(i * 1.3 + t * 2))) * (1 - (i / NECK_STEPS) * 0.45);
      const base = add(neckPts[i], scale(fr.fy, neckRads[i] * 0.9));
      const tip = add(add(base, scale(fr.fy, h)), scale(fr.fx, -h * 0.35));
      if (pT) pushQuad(pB, base, tip, pT, [104, 12, 24], { two: 1, em: 0.18, emc: COL.ember, alpha: 0.95 });
      pT = tip; pB = base;
    }

    /* --- frame tengkorak --- */
    const fHead = neckFrameAt(neckPts, NECK_STEPS);
    const pitch = 0.10 * Math.sin(t * S.waveW - S.waveK * 0.9) - 0.06 + S.headPitch;
    const yaw = 0.16 * Math.sin(t * S.waveW * 0.7 + 1.2) + S.headYaw;
    let fx = rotAxis(fHead.fx, fHead.fz, pitch);
    fx = rotAxis(fx, fHead.fy, yaw);
    const fy = rotAxis(fHead.fy, fHead.fz, pitch);
    const fz = norm(cross(fx, norm(fy)));
    const fyN = norm(cross(fz, fx));
    const hf = { c: neckPts[NECK_STEPS], fx: norm(fx), fy: fyN, fz: fz };
    headFrame = hf;

    const open = api.mouth;
    const jawAng = open * 0.62;

    /* --- cincin tengkorak & rahang --- */
    function ringOf(st, isJaw) {
      const seg = S.seg;
      let p = st.p.map(v => v * HG);
      let r = st.r * HG, yk = st.yk;
      if (isJaw) {
        const hp = JAW_HINGE.map(v => v * HG);
        const d = sub(p, hp);
        const dr = rotAxis(d, [0, 0, 1], -jawAng);
        p = add(hp, dr);
        // rotasi penampang rahang ikut membuka
        const ring = new Array(seg);
        for (let j = 0; j < seg; j++) {
          const a = (j / seg) * TAU;
          const ly = Math.cos(a) * r * yk, lz = Math.sin(a) * r;
          const rl = rotAxis([0, ly, lz], [0, 0, 1], -jawAng * 0.85);
          ring[j] = toWorld(hf, [p[0] + rl[0], p[1] + rl[1], p[2] + rl[2]]);
        }
        return ring;
      }
      const ring = new Array(seg);
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * TAU;
        ring[j] = toWorld(hf, [p[0], p[1] + Math.cos(a) * r * yk, p[2] + Math.sin(a) * r]);
      }
      return ring;
    }

    const skullRings = SKULL.map(s => ringOf(s, false));
    const jawRings = JAW.map(s => ringOf(s, true));
    const seg = S.seg;

    function skinRings(rings, dark) {
      for (let i = 0; i < rings.length - 1; i++) {
        const A = rings[i], B = rings[i + 1];
        const tt = i / (rings.length - 1);
        for (let j = 0; j < seg; j++) {
          const j2 = (j + 1) % seg;
          const up = Math.cos((j / seg) * TAU) * 0.5 + 0.5;
          let c = mixc(dark ? COL.dark : COL.steel, COL.bone, Math.pow(up, 1.1) * (0.55 + 0.45 * (1 - tt)));
          c = mixc(c, COL.silver, 0.35);
          pushQuad(A[j], A[j2], B[j2], B[j], c, { spec: 0.7, em: 0.04, emc: COL.ember });
        }
      }
      // ujung moncong
      const L = rings[rings.length - 1];
      let cx = 0, cy = 0, cz = 0;
      for (let j = 0; j < seg; j++) { cx += L[j][0]; cy += L[j][1]; cz += L[j][2]; }
      const cc = [cx / seg, cy / seg, cz / seg];
      for (let j = 0; j < seg; j++) pushTri(L[j], L[(j + 1) % seg], cc, COL.bone, { spec: 0.8 });
    }
    skinRings(skullRings, false);
    skinRings(jawRings, true);
    // sambung tengkorak -> leher
    const neckLast = neckRings[NECK_STEPS];
    const skullFirst = skullRings[0];
    for (let j = 0; j < seg; j++) {
      const j2 = (j + 1) % seg;
      const up = Math.cos((j / seg) * TAU) * 0.5 + 0.5;
      pushQuad(neckLast[j], neckLast[j2], skullFirst[j2], skullFirst[j], mixc(COL.steel, COL.bone, up), { spec: 0.6 });
    }

    /* --- rongga mulut (pijar) --- */
    const glow = 0.35 + 0.65 * open + 0.25 * Math.sin(t * 9) * open;
    for (let i = 1; i <= 5; i++) {
      const ua = skullRings[i], ub = skullRings[i + 1];
      const la = jawRings[i], lb = jawRings[i + 1];
      const idx = [];
      for (let j = 0; j < seg; j++) {
        const a = (j / seg) * TAU;
        if (Math.cos(a) < 0.05 && Math.abs(Math.sin(a)) < 0.93) idx.push(j);
      }
      for (let q = 0; q < idx.length - 1; q++) {
        const j = idx[q], j2 = idx[q + 1];
        pushQuad(ua[j], ua[j2], ub[j2], ub[j], COL.ember, {
          em: 1, emc: COL.ember, two: 1, alpha: 0.55 * glow, add: 1, fog: 0.2
        });
        pushQuad(la[j], la[j2], lb[j2], lb[j], COL.blood, {
          em: 1, emc: COL.ember, two: 1, alpha: 0.5 * glow, add: 1, fog: 0.2
        });
      }
      // sisi mulut
      for (const jj of [Math.floor(seg * 0.25), Math.floor(seg * 0.75)]) {
        const jn = (jj + 1) % seg;
        pushQuad(ua[jj], ua[jn], la[jn], la[jj], [70, 8, 16], { em: 0.7, emc: COL.blood, two: 1, alpha: 0.9 });
      }
    }
    // lidah
    const tongueBase = toWorld(hf, [0.45 * HG, -0.34 * HG, 0]);
    const tongueTip = toWorld(hf, [1.35 * HG, -0.30 * HG + open * 0.18 * HG, 0]);
    const tfr = hf;
    const tw = 0.13 * HG;
    pushQuad(
      add(tongueBase, scale(tfr.fz, -tw)), add(tongueBase, scale(tfr.fz, tw)),
      add(tongueTip, scale(tfr.fz, tw * 0.4)), add(tongueTip, scale(tfr.fz, -tw * 0.4)),
      [190, 40, 58], { two: 1, em: 0.35, emc: COL.blood, spec: 0.9 }
    );

    /* --- gigi --- */
    function teeth(rings, upper) {
      const spots = upper ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
      for (const i of spots) {
        const R = rings[i];
        const offs = upper ? [0.20, -0.20, 0.05, -0.05] : [0.16, -0.16];
        for (const o of offs) {
          const jj = Math.floor(((o + 0.5) % 1) * seg);
          const base = R[jj];
          const dir = upper ? -1 : 1;
          const ln = (0.16 + 0.10 * Math.abs(Math.sin(i * 2.1 + o * 7))) * HG * (i < 3 ? 1.25 : 0.85);
          const tip = add(add(base, scale(hf.fy, dir * ln * 0.75)), scale(hf.fx, ln * 0.30));
          const side = norm(cross(sub(tip, base), hf.fx));
          const w = ln * 0.22;
          pushTri(sub(base, scale(side, w)), add(base, scale(side, w)), tip, COL.bone,
            { spec: 0.9, flat: 1 });
        }
      }
    }
    teeth(skullRings, true);
    teeth(jawRings, false);

    /* --- mata --- */
    for (const s of [1, -1]) {
      const eyeC = toWorld(hf, [0.60 * HG, 0.17 * HG, s * 0.46 * HG]);
      const socket = toWorld(hf, [0.60 * HG, 0.17 * HG, s * 0.40 * HG]);
      pushSprite(eyeC, 0.30 * HG, COL.ember, 0.95, 1);
      pushSprite(eyeC, 0.85 * HG, [255, 60, 40], 0.30 + 0.25 * open, 1);
      const segE = 8;
      const ax = norm(sub(eyeC, socket));
      let ref = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const rz = norm(cross(ax, ref)), ry = norm(cross(rz, ax));
      const rE = 0.17 * HG;
      const ringE = [];
      for (let j = 0; j < segE; j++) {
        const a = (j / segE) * TAU;
        ringE.push(add(add(eyeC, scale(ry, Math.cos(a) * rE)), scale(rz, Math.sin(a) * rE)));
      }
      for (let j = 0; j < segE; j++) {
        pushTri(ringE[j], ringE[(j + 1) % segE], add(eyeC, scale(ax, 0.10 * HG)), [255, 120, 70],
          { em: 1, emc: COL.ember, spec: 1, fog: 0.15 });
      }
      // duri atas mata
      const browA = toWorld(hf, [0.42 * HG, 0.42 * HG, s * 0.34 * HG]);
      const browB = toWorld(hf, [1.02 * HG, 0.30 * HG, s * 0.52 * HG]);
      const browC = toWorld(hf, [0.72 * HG, 0.66 * HG, s * 0.30 * HG]);
      pushTri(browA, browB, browC, COL.bone, { spec: 0.8, flat: 1 });
    }

    /* --- tanduk --- */
    for (const s of [1, -1]) {
      tube([
        toWorld(hf, [0.02 * HG, 0.36 * HG, s * 0.34 * HG]),
        toWorld(hf, [-0.34 * HG, 0.86 * HG, s * 0.54 * HG]),
        toWorld(hf, [-0.92 * HG, 1.36 * HG, s * 0.66 * HG]),
        toWorld(hf, [-1.66 * HG, 1.72 * HG, s * 0.60 * HG]),
        toWorld(hf, [-2.42 * HG, 1.82 * HG, s * 0.40 * HG])
      ], [0.175 * HG, 0.135 * HG, 0.095 * HG, 0.055 * HG, 0.014 * HG], COL.bone,
        { seg: 8, spec: 0.85, grad: [COL.steel, COL.bone], twist: s * 0.9 });

      tube([
        toWorld(hf, [0.62 * HG, 0.44 * HG, s * 0.30 * HG]),
        toWorld(hf, [0.26 * HG, 0.86 * HG, s * 0.40 * HG]),
        toWorld(hf, [-0.18 * HG, 1.10 * HG, s * 0.32 * HG])
      ], [0.085 * HG, 0.055 * HG, 0.012 * HG], COL.bone, { seg: 7, spec: 0.8 });

      // duri pipi
      for (let k = 0; k < 3; k++) {
        const bx = (0.34 - k * 0.42) * HG, by = (-0.02 - k * 0.06) * HG, bz = s * (0.50 - k * 0.05) * HG;
        tube([
          toWorld(hf, [bx, by, bz]),
          toWorld(hf, [bx - 0.5 * HG, by + 0.1 * HG, bz + s * 0.36 * HG]),
          toWorld(hf, [bx - 0.95 * HG, by + 0.16 * HG, bz + s * 0.6 * HG])
        ], [0.075 * HG, 0.04 * HG, 0.008 * HG], COL.bone, { seg: 6, spec: 0.8 });
      }
    }
    // duri tengkuk
    tube([
      toWorld(hf, [-0.10 * HG, 0.10 * HG, 0]),
      toWorld(hf, [-0.70 * HG, 0.30 * HG, 0]),
      toWorld(hf, [-1.30 * HG, 0.34 * HG, 0])
    ], [0.20 * HG, 0.14 * HG, 0.02 * HG], COL.steel, { seg: 8, yk: 1.25, spec: 0.6 });

    // nostril
    for (const s of [1, -1]) {
      pushSprite(toWorld(hf, [1.94 * HG, -0.14 * HG, s * 0.10 * HG]), 0.09 * HG, [255, 90, 50], 0.75 + 0.25 * open, 1);
    }

    headCenter = hf.c;
    mouthPos = toWorld(hf, [2.15 * HG, -0.24 * HG, 0]);
  }

  function neckFrameAt(pts, i) {
    const prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
    const fx = norm(sub(next, prev));
    let ref = [0, 1, 0];
    let fz = cross(fx, ref);
    if (fz[0] * fz[0] + fz[1] * fz[1] + fz[2] * fz[2] < 1e-6) fz = cross(fx, [1, 0, 0]);
    fz = norm(fz);
    const fy = norm(cross(fz, fx));
    return { c: pts[i], fx: fx, fy: fy, fz: fz };
  }

  /* ============================================================
     SAYAP
     ============================================================ */
  const WING = {
    station: 0.775, span: 13.4, sweep: 0.46, arc: 1.9,
    chord: [6.2, 5.9, 5.2, 4.3, 3.2, 1.9, 0.9]
  };
  function buildWings(t, body) {
    const S = body.S, frames = body.frames, N = S.N, g = S.girth;
    const iW = Math.round(N * WING.station);
    const fr = frames[iW];
    const uW = iW / N;
    const flap = Math.sin(t * S.flapW);
    const dihedral = S.flapA * flap + 0.06;
    const sweepAng = 0.20 * Math.sin(t * S.flapW + 1.15) - 0.06;
    const lat = g * (radiusAt(uW) * 0.70 + 0.24);

    for (const side of [1, -1]) {
      const attach = toWorld(fr, [0, g * 0.40, side * lat]);
      const fSpan = scale(fr.fz, side);
      const fFwd = fr.fx;
      const fUp = fr.fy;
      const span = WING.span * g * 0.66;
      const chordScale = g * 0.66;

      function xf(pLocal) {
        // pLocal: x = sepanjang rentang(0..1 -> 0..span), y = chord, z = tebal
        let v = [pLocal[0], pLocal[1], pLocal[2]];
        // twist (puntir) meningkat ke ujung
        const sN = pLocal[0] / span;
        v = rotAxis(v, [1, 0, 0], (-0.20 * flap + 0.08) * sN * side);
        // dihedral (kepak) di sekitar sumbu rentang
        v = rotAxis(v, [1, 0, 0], dihedral * side * (0.35 + 0.65 * sN));
        // sweep maju/mundur
        v = rotAxis(v, [0, 1, 0], sweepAng * (0.4 + sN));
        return [
          attach[0] + fSpan[0] * v[0] + fUp[0] * v[1] + fFwd[0] * v[2],
          attach[1] + fSpan[1] * v[0] + fUp[1] * v[1] + fFwd[1] * v[2],
          attach[2] + fSpan[2] * v[0] + fUp[2] * v[1] + fFwd[2] * v[2]
        ];
      }

      const NS = 20, NC = 5;
      const chordAt = (sN) => {
        const c = WING.chord;
        const x = sN * (c.length - 1);
        const i = Math.min(c.length - 2, Math.floor(x));
        return lerp(c[i], c[i + 1], x - i) * chordScale;
      };
      const lead = [], trail = [];
      for (let i = 0; i <= NS; i++) {
        const sN = i / NS;
        const r = span * sN;
        const sw = WING.sweep * sN;
        const arcY = WING.arc * g * 0.62 * Math.sin(sN * Math.PI * 0.92) * (1 + 0.10 * flap);
        lead.push([r, arcY, -Math.sin(sw) * r]);
        const ch = chordAt(sN);
        trail.push([r * 0.93, arcY * 0.34, -Math.cos(sw) * ch - r * 0.10]);
      }
      const P = [];
      for (let i = 0; i <= NS; i++) {
        const row = [];
        const sN = i / NS;
        for (let j = 0; j <= NC; j++) {
          const v = j / NC;
          const camber = 0.55 * chordAt(sN) * v * (1 - v) * (0.4 + 0.6 * flap);
          row.push(xf([
            lerp(lead[i][0], trail[i][0], v),
            lerp(lead[i][1], trail[i][1], v) + camber,
            lerp(lead[i][2], trail[i][2], v)
          ]));
        }
        P.push(row);
      }
      // membran
      for (let i = 0; i < NS; i++) {
        for (let j = 0; j < NC; j++) {
          const sN = i / NS, vN = j / NC;
          let c = mixc([30, 33, 44], [60, 20, 28], sN * 0.65);
          c = mixc(c, COL.blood, 0.18 * Math.pow(1 - vN, 2) + 0.08 * sN);
          const vein = Math.exp(-Math.pow((vN - 0.05) * 6, 2));
          pushQuad(P[i][j], P[i][j + 1], P[i + 1][j + 1], P[i + 1][j], c, {
            two: 1, spec: 0.28, alpha: 0.90,
            em: 0.08 + 0.30 * vein + 0.10 * sN, emc: COL.ember, fog: 0.85
          });
        }
      }
      // tulang sayap
      const bonePts = [], boneR = [];
      for (let i = 0; i <= NS; i++) {
        bonePts.push(xf(lead[i]));
        boneR.push(g * (0.20 * (1 - i / NS) + 0.05));
      }
      tube(bonePts, boneR, COL.bone, { seg: 8, spec: 0.85, grad: [COL.silver, COL.bone] });
      // jari
      const fingers = [0.30, 0.50, 0.70, 0.88];
      for (let fi = 0; fi < fingers.length; fi++) {
        const sA = fingers[fi], sB = fi < fingers.length - 1 ? fingers[fi + 1] : 1.0;
        const iA = Math.round(sA * NS);
        const wP = xf(lead[iA]);
        const tP = xf(trail[Math.round(sB * NS)]);
        tube([wP, [
          lerp(wP[0], tP[0], 0.55), lerp(wP[1], tP[1], 0.55), lerp(wP[2], tP[2], 0.55)
        ], tP], [g * 0.085, g * 0.05, g * 0.012], COL.bone, { seg: 6, spec: 0.85 });
        // cakar ujung jari
        const clawDir = norm(sub(tP, wP));
        tube([tP, add(tP, scale(clawDir, g * 0.5)), add(add(tP, scale(clawDir, g * 0.95)), scale(fUp, -g * 0.28))],
          [g * 0.075, g * 0.045, g * 0.006], COL.bone, { seg: 6, spec: 1 });
      }
      // cakar sendi sayap
      tube([attach, xf([g * 0.9, g * 0.5, 0]), xf([g * 1.5, g * 1.1, -g * 0.2])],
        [g * 0.24, g * 0.16, g * 0.02], COL.bone, { seg: 8, spec: 0.9 });
    }
  }

  /* ============================================================
     KAKI
     ============================================================ */
  function buildLegs(t, body) {
    const S = body.S, frames = body.frames, N = S.N, g = S.girth;
    const defs = [
      { u: 0.80, side: 1, ph: 0.0, fore: 1 },
      { u: 0.80, side: -1, ph: Math.PI, fore: 1 },
      { u: 0.33, side: 1, ph: Math.PI * 0.5, fore: 0 },
      { u: 0.33, side: -1, ph: Math.PI * 1.5, fore: 0 }
    ];
    for (const d of defs) {
      const i = Math.round(N * d.u);
      const fr = frames[i];
      const lat = g * radiusAt(d.u) * 0.60;
      const sw = 0.55 * Math.sin(t * S.flapW * 0.9 + d.ph);
      const hip = toWorld(fr, [-g * 0.1 * d.fore, -g * 0.34, d.side * lat]);
      const knee = add(hip, [
        fr.fx[0] * (-g * 1.15 + sw * g * 0.5) + fr.fy[0] * (-g * 0.85) + fr.fz[0] * d.side * g * 0.45,
        fr.fx[1] * (-g * 1.15 + sw * g * 0.5) + fr.fy[1] * (-g * 0.85) + fr.fz[1] * d.side * g * 0.45,
        fr.fx[2] * (-g * 1.15 + sw * g * 0.5) + fr.fy[2] * (-g * 0.85) + fr.fz[2] * d.side * g * 0.45
      ]);
      const ankle = add(knee, [
        fr.fx[0] * (g * (1.0 + sw * 0.7) * d.fore) + fr.fy[0] * (-g * 0.9) + fr.fz[0] * d.side * g * 0.18,
        fr.fx[1] * (g * (1.0 + sw * 0.7) * d.fore) + fr.fy[1] * (-g * 0.9) + fr.fz[1] * d.side * g * 0.18,
        fr.fx[2] * (g * (1.0 + sw * 0.7) * d.fore) + fr.fy[2] * (-g * 0.9) + fr.fz[2] * d.side * g * 0.18
      ]);
      tube([hip, knee], [g * 0.40, g * 0.25], COL.steel, { seg: 9, spec: 0.55, grad: [COL.slate, COL.steel] });
      tube([knee, ankle], [g * 0.20, g * 0.125], COL.steel, { seg: 8, spec: 0.6, grad: [COL.steel, COL.slate] });
      // jari + cakar
      for (let k = -1; k <= 1; k++) {
        const toeEnd = add(ankle, [
          fr.fx[0] * g * 0.72 * d.fore + fr.fy[0] * (-g * 0.22) + fr.fz[0] * k * g * 0.30,
          fr.fx[1] * g * 0.72 * d.fore + fr.fy[1] * (-g * 0.22) + fr.fz[1] * k * g * 0.30,
          fr.fx[2] * g * 0.72 * d.fore + fr.fy[2] * (-g * 0.22) + fr.fz[2] * k * g * 0.30
        ]);
        tube([ankle, toeEnd], [g * 0.11, g * 0.065], COL.slate, { seg: 7, spec: 0.5 });
        const cd = norm(sub(toeEnd, ankle));
        tube([toeEnd, add(toeEnd, scale(cd, g * 0.34)), add(add(toeEnd, scale(cd, g * 0.6)), scale(fr.fy, -g * 0.18))],
          [g * 0.06, g * 0.035, g * 0.006], COL.bone, { seg: 6, spec: 1 });
      }
      // duri siku
      const sp = add(knee, scale(fr.fy, -g * 0.05));
      tube([sp, add(sp, scale(fr.fy, -g * 0.55)), add(add(sp, scale(fr.fy, -g * 0.95)), scale(fr.fx, -g * 0.3))],
        [g * 0.09, g * 0.05, g * 0.008], COL.bone, { seg: 6, spec: 0.9 });
    }
  }

  /* ============================================================
     UJUNG EKOR (bilah)
     ============================================================ */
  function buildTailBlade(t, body) {
    const S = body.S, frames = body.frames, g = S.girth;
    const fr = frames[1], fr2 = frames[4];
    const c = fr.c;
    const h = g * 1.05;
    const a = add(c, scale(fr.fy, h));
    const b = sub(c, scale(fr.fy, h));
    const tip = add(c, scale(fr.fx, -g * 1.7));
    const mid = fr2.c;
    pushTri(a, b, tip, COL.blood, { two: 1, em: 0.45, emc: COL.ember, spec: 0.5, flat: 1 });
    pushTri(a, tip, add(mid, scale(fr.fy, h * 0.55)), COL.dark, { two: 1, em: 0.25, emc: COL.blood, flat: 1 });
    pushTri(b, add(mid, scale(fr.fy, -h * 0.55)), tip, COL.dark, { two: 1, em: 0.25, emc: COL.blood, flat: 1 });
    // duri ekor kecil
    for (let i = 6; i < 18; i += 3) {
      const f = frames[i];
      const u = i / S.N;
      const hh = g * (0.5 - u * 0.32);
      const base = sub(f.c, scale(f.fy, radiusAt(u) * S.girth * 0.85));
      pushTri(sub(base, scale(f.fx, hh * 0.5)), add(base, scale(f.fx, hh * 0.5)), sub(base, scale(f.fy, hh)),
        COL.blood, { two: 1, em: 0.4, emc: COL.ember, flat: 1 });
    }
  }

  /* ============================================================
     PARTIKEL
     ============================================================ */
  function initParticles() {
    motes = [];
    for (let i = 0; i < 90; i++) {
      motes.push({
        u: Math.random(), a: Math.random() * TAU, sp: 0.25 + Math.random() * 0.75,
        rad: 1.4 + Math.random() * 3.4, y: (Math.random() - 0.5) * 3,
        s: 0.05 + Math.random() * 0.16, c: Math.random() < 0.72 ? 0 : (Math.random() < 0.5 ? 1 : 2)
      });
    }
    fog = [];
    for (let i = 0; i < 9; i++) {
      fog.push({
        // offset relatif terhadap tubuh naga -> kabut selalu menemani naga
        o: [(Math.random() - 0.5) * 96, (Math.random() - 0.5) * 46, (Math.random() - 0.5) * 96],
        r: 22 + Math.random() * 40, ph: Math.random() * 6.28,
        c: i % 3 === 0 ? [255, 60, 50] : (i % 3 === 1 ? [120, 150, 255] : [230, 235, 250]),
        a: 0.035 + Math.random() * 0.05
      });
    }
  }
  function spawnEmber(n, power) {
    if (!headFrame) return;
    const hf = headFrame;
    for (let i = 0; i < n; i++) {
      const spread = 0.55;
      const dir = norm([
        hf.fx[0] + (Math.random() - 0.5) * spread,
        hf.fx[1] + (Math.random() - 0.5) * spread + 0.16,
        hf.fx[2] + (Math.random() - 0.5) * spread
      ]);
      const sp = (10 + Math.random() * 26) * power;
      parts.push({
        p: [mouthPos[0], mouthPos[1], mouthPos[2]],
        v: scale(dir, sp),
        life: 0.9 + Math.random() * 1.5,
        age: 0,
        s: 0.18 + Math.random() * 0.85 * power,
        hot: Math.random()
      });
    }
    if (parts.length > 420) parts.splice(0, parts.length - 420);
  }
  function updateParticles(dt, S) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age > p.life) { parts.splice(i, 1); continue; }
      p.v[1] += 3.2 * dt;
      p.v[0] *= 1 - 0.9 * dt; p.v[2] *= 1 - 0.9 * dt;
      p.p = add(p.p, scale(p.v, dt));
      const k = 1 - p.age / p.life;
      const col = p.hot > 0.5 ? [255, 190 - 130 * (1 - k), 90 * k] : [255, 70 + 60 * k, 45];
      pushSprite(p.p, p.s * (0.4 + k), col, 0.85 * k, 1);
    }
    // aura
    for (const m of motes) {
      m.a += dt * m.sp;
      const idx = Math.floor(m.u * (bodyFrames.length - 1));
      const fr = bodyFrames[idx];
      if (!fr) continue;
      const r = m.rad * S.girth * 0.9;
      const pos = [
        fr.c[0] + Math.cos(m.a) * r * 0.9 + fr.fx[0] * m.y,
        fr.c[1] + Math.sin(m.a * 1.1) * r * 0.55 + m.y * 0.5,
        fr.c[2] + Math.sin(m.a) * r * 0.9
      ];
      const c = m.c === 0 ? [255, 78, 56] : (m.c === 1 ? [238, 242, 255] : [120, 160, 255]);
      pushSprite(pos, m.s * S.girth, c, 0.5 + 0.35 * Math.sin(m.a * 3), 1);
    }
  }

  /* ============================================================
     SHADING & PROYEKSI
     ============================================================ */
  const FOGC = [8, 9, 14];
  function shade(q) {
    const v = q.v;
    let nx, ny, nz;
    if (q.flat || v[3] === v[0]) {
      const ax = v[1][0] - v[0][0], ay = v[1][1] - v[0][1], az = v[1][2] - v[0][2];
      const bx = v[2][0] - v[0][0], by = v[2][1] - v[0][1], bz = v[2][2] - v[0][2];
      nx = ay * bz - az * by; ny = az * bx - ax * bz; nz = ax * by - ay * bx;
    } else {
      const ax = v[2][0] - v[0][0], ay = v[2][1] - v[0][1], az = v[2][2] - v[0][2];
      const bx = v[3][0] - v[1][0], by = v[3][1] - v[1][1], bz = v[3][2] - v[1][2];
      nx = ay * bz - az * by; ny = az * bx - ax * bz; nz = ax * by - ay * bx;
    }
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;
    // hadap kamera
    const vx = camPos[0] - v[0][0], vy = camPos[1] - v[0][1], vz = camPos[2] - v[0][2];
    let facing = (nx * vx + ny * vy + nz * vz) > 0;
    if (!facing) {
      if (!q.two) return null;
      nx = -nx; ny = -ny; nz = -nz;
    }
    const c = q.col;
    let r = c[0], g = c[1], b = c[2];
    if (!q.add) {
      const dk = Math.max(0, nx * LIGHT.key[0] + ny * LIGHT.key[1] + nz * LIGHT.key[2]);
      const df = Math.max(0, nx * LIGHT.fill[0] + ny * LIGHT.fill[1] + nz * LIGHT.fill[2]);
      let amb = 0.30;
      let lr = amb + dk * 0.86 + df * 0.20;
      let lg = amb + dk * 0.88 + df * 0.24;
      let lb = amb + dk * 0.94 + df * 0.34;
      r *= lr; g *= lg; b *= lb;
      const bounce = Math.max(0, -(nx * 0.2 + ny * 0.85 + nz * 0.1)) * (0.35 + 0.5 * api.roar);
      r += 190 * bounce * 0.5; g += 34 * bounce * 0.5; b += 26 * bounce * 0.5;
      // fresnel: tepi silhouette menyala merah
      const vdir2 = norm(sub(camPos, v[0]));
      const fres = Math.pow(1 - Math.max(0, nx * vdir2[0] + ny * vdir2[1] + nz * vdir2[2]), 2.3);
      const rimI = fres * (0.85 + 0.6 * api.roar);
      r += 255 * rimI * 0.75; g += 46 * rimI * 0.6; b += 42 * rimI * 0.6;
      // specular
      if (q.spec > 0) {
        const vdir = norm(sub(camPos, v[0]));
        const hx = LIGHT.key[0] + vdir[0], hy = LIGHT.key[1] + vdir[1], hz = LIGHT.key[2] + vdir[2];
        const hl = Math.hypot(hx, hy, hz) || 1;
        const sp = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 34) * q.spec;
        r += 235 * sp; g += 240 * sp; b += 255 * sp;
      }
      if (q.em > 0) {
        r += q.emc[0] * q.em; g += q.emc[1] * q.em; b += q.emc[2] * q.em;
      }
      // fog
      if (q.fog > 0) {
        const d = Math.max(0, q.zc - 16) / 110;
        const f = clamp(d * d * 1.5 * q.fog, 0, 0.82);
        r = lerp(r, FOGC[0] + 26, f); g = lerp(g, FOGC[1] + 6, f); b = lerp(b, FOGC[2] + 8, f);
      }
    }
    return {
      r: clamp(r, 0, 255) | 0, g: clamp(g, 0, 255) | 0, b: clamp(b, 0, 255) | 0,
      facing: facing
    };
  }

  function project(p) {
    const rx = p[0] - camPos[0], ry = p[1] - camPos[1], rz = p[2] - camPos[2];
    const x = rx * camR[0] + ry * camR[1] + rz * camR[2];
    const y = rx * camU[0] + ry * camU[1] + rz * camU[2];
    const z = rx * camF[0] + ry * camF[1] + rz * camF[2];
    if (z < 1.6) return null;
    const k = focal / z;
    return [W * 0.5 + x * k, H * 0.5 - y * k, z];
  }

  /* ---------- kamera ---------- */
  function updateCamera(dt, S) {
    const px = api.pointer.x, py = api.pointer.y;
    api.pointer.tx = lerp(api.pointer.tx, px, 1 - Math.pow(0.001, dt));
    const target = [
      bodyCtr[0] + S.girth * 3.4,
      bodyCtr[1] + S.girth * 1.1,
      bodyCtr[2]
    ];
    let want;
    if (api.camMode === 1 && headFrame) {          // close-up wajah (dari depan)
      const hf = headFrame, g = S.girth;
      const d = g * (7.6 - api.pointer.ty * 1.4);
      const side = hf.fz, fwd = hf.fx;
      const k = 0.55 + api.pointer.tx * 0.42;
      want = [
        hf.c[0] + (fwd[0] * 1.5 + side[0] * k) * d,
        hf.c[1] + (fwd[1] * 1.5 + side[1] * k) * d + g * (1.15 - api.pointer.ty * 0.9),
        hf.c[2] + (fwd[2] * 1.5 + side[2] * k) * d
      ];
      target[0] = hf.c[0] + fwd[0] * g * 0.9;
      target[1] = hf.c[1] + fwd[1] * g * 0.9;
      target[2] = hf.c[2] + fwd[2] * g * 0.9;
    } else {
      const f = bodyFrames[Math.min(bodyFrames.length - 1, Math.round(bodyFrames.length * 0.84))];
      const ang = (api.camMode === 2) ? api.t * 0.20 : (-0.86 + api.pointer.tx * 0.95);
      const dist = S.girth * (api.camMode === 2 ? (19.5 + 6.5 * Math.sin(api.t * 0.15)) : (21 + 2.6 * Math.sin(api.t * 0.22)));
      const height = S.girth * (api.camMode === 2 ? 6.5 * Math.sin(api.t * 0.13) : (5.2 - api.pointer.ty * 5.0));
      let side = [0, 0, 1], fwd = [1, 0, 0];
      if (f) {
        side = f.fz; fwd = f.fx;
        if (api.camMode !== 2) {
          const fs = Math.sqrt(side[0] * side[0] + side[2] * side[2]) || 1;
          const ff = Math.sqrt(fwd[0] * fwd[0] + fwd[2] * fwd[2]) || 1;
          side = [side[0] / fs, 0, side[2] / fs];
          fwd = [fwd[0] / ff, 0, fwd[2] / ff];
        }
      }
      want = [
        target[0] - (side[0] * Math.cos(ang) - Math.sin(ang) * fwd[0]) * dist,
        target[1] + height,
        target[2] - (side[2] * Math.cos(ang) - Math.sin(ang) * fwd[2]) * dist
      ];
    }
    const k = 1 - Math.pow(0.0035, dt);
    camPos = [lerp(camPos[0], want[0], k), lerp(camPos[1], want[1], k), lerp(camPos[2], want[2], k)];
    camTgt = [lerp(camTgt[0], target[0], k), lerp(camTgt[1], target[1], k), lerp(camTgt[2], target[2], k)];
    camF = norm(sub(camTgt, camPos));
    let ref = [0, 1, 0];
    camR = norm(cross(camF, ref));
    camU = norm(cross(camR, camF));
    const vFOV = 0.86;
    focal = (H * 0.5) / Math.tan(vFOV * 0.5);
    if (W / H > 1.7) focal = Math.max(focal, (W * 0.5) / Math.tan(1.25 * 0.5));
  }

  /* ---------- render ---------- */
  let tNow = 0;
  function render() {
    tNow = api.t;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // latar
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    // kabut
    for (const f of fog) {
      const fp = [
        bodyCtr[0] + f.o[0] + Math.sin(tNow * 0.06 + f.ph) * 9,
        bodyCtr[1] + f.o[1] + Math.cos(tNow * 0.05 + f.ph) * 6,
        bodyCtr[2] + f.o[2]
      ];
      const p = project(fp);
      if (!p || p[2] < 8) continue;
      const r = Math.min(f.r * focal / p[2], Math.max(W, H) * 1.5);
      const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], Math.max(4, r));
      gr.addColorStop(0, `rgba(${f.c[0]},${f.c[1]},${f.c[2]},${f.a})`);
      gr.addColorStop(1, `rgba(${f.c[0]},${f.c[1]},${f.c[2]},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(4, r), 0, TAU); ctx.fill();
    }

    // halo di belakang naga
    const hc = project(bodyCtr);
    if (hc && hc[2] > 4) {
      const rr = Math.min((18 + 7 * api.roar) * focal / hc[2] * 1.5, Math.max(W, H) * 1.6);
      const gr = ctx.createRadialGradient(hc[0], hc[1], 0, hc[0], hc[1], Math.max(8, rr));
      gr.addColorStop(0, `rgba(255,52,44,${0.20 + 0.30 * api.roar})`);
      gr.addColorStop(0.45, 'rgba(150,16,34,0.08)');
      gr.addColorStop(1, 'rgba(150,16,34,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(hc[0], hc[1], Math.max(8, rr), 0, TAU); ctx.fill();
    }

    // kumpulkan & proyeksikan
    const drawn = [];
    for (let i = 0; i < list.length; i++) {
      const q = list[i];
      if (q.k === 0) {
        const p0 = project(q.v[0]);
        if (!p0) continue;
        const p1 = project(q.v[1]); if (!p1) continue;
        const p2 = project(q.v[2]); if (!p2) continue;
        const p3 = q.v[3] === q.v[0] ? p0 : project(q.v[3]); if (!p3) continue;
        if (p0[2] < 2.5 || p1[2] < 2.5 || p2[2] < 2.5 || p3[2] < 2.5) continue;
        // backface di ruang layar
        const cross2 = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0]);
        if (cross2 > 0 && !q.two) continue;
        if (cross2 <= 0 && q.two) { /* dua sisi: tetap digambar */ }
        q.zc = (p0[2] + p1[2] + p2[2] + p3[2]) * 0.25;
        const sh = shade(q);
        if (!sh) continue;
        // area terlalu kecil / terlalu dekat kamera -> lewati (hindari overdraw raksasa)
        const area = Math.abs(cross2);
        if (area < 0.35) continue;
        if (area > W * H * 1.3) continue;
        const qminx = Math.min(p0[0], p1[0], p2[0], p3[0]), qmaxx = Math.max(p0[0], p1[0], p2[0], p3[0]);
        const qminy = Math.min(p0[1], p1[1], p2[1], p3[1]), qmaxy = Math.max(p0[1], p1[1], p2[1], p3[1]);
        if (qmaxx < -12 || qminx > W + 12 || qmaxy < -12 || qminy > H + 12) continue;
        drawn.push({ q: q, p: [p0, p1, p2, p3], z: q.zc, sh: sh, sprite: 0, area: area });
      } else {
        const p0 = project(q.v[0]);
        if (!p0 || p0[2] < 3) continue;
        drawn.push({ q: q, p: [p0], z: p0[2], sh: null, sprite: 1 });
      }
    }
    drawn.sort((a, b) => b.z - a.z);

    // gambar
    for (let i = 0; i < drawn.length; i++) {
      const d = drawn[i];
      if (d.sprite) {
        const p = d.p[0];
        const size = clamp(d.q.size * focal / p[2], 0.6, Math.max(W, H) * 1.1);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = clamp(d.q.alpha, 0, 1);
        const c = d.q.col;
        if (size > 3) {
          const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], size);
          gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},1)`);
          gr.addColorStop(0.35, `rgba(${c[0]},${(c[1] * 0.5) | 0},${(c[2] * 0.4) | 0},0.55)`);
          gr.addColorStop(1, `rgba(${c[0]},0,0,0)`);
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(p[0], p[1], size, 0, TAU); ctx.fill();
        } else {
          ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
          ctx.fillRect(p[0] - size * 0.5, p[1] - size * 0.5, size, size);
        }
        continue;
      }
      const sh = d.sh, p = d.p, q = d.q, area = d.area;
      ctx.globalCompositeOperation = q.add ? 'lighter' : 'source-over';
      ctx.globalAlpha = clamp(q.alpha, 0, 1);
      const col = `rgb(${sh.r},${sh.g},${sh.b})`;
      ctx.fillStyle = col;
      const seam = api.quality > 0.8 && area > 9;
      if (seam) { ctx.strokeStyle = col; ctx.lineWidth = 0.8; }
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      ctx.lineTo(p[1][0], p[1][1]);
      ctx.lineTo(p[2][0], p[2][1]);
      if (q.v[3] !== q.v[0]) ctx.lineTo(p[3][0], p[3][1]);
      ctx.closePath();
      ctx.fill();
      if (seam) ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // vignette
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    api.stats.quads = drawn.length;
  }

  /* ---------- frame ---------- */
  function frame(now) {
    if (!api.running) { last = now; requestAnimationFrame(frame); return; }
    const dtRaw = last ? (now - last) / 1000 : 0.016;
    last = now;
    const dt = Math.min(0.05, dtRaw);
    api.t += dt * api.speed;
    const t = api.t;

    // fps + kualitas adaptif
    fpsAcc += dtRaw; fpsN++;
    if (fpsAcc > 0.5) {
      api.stats.fps = fpsN / fpsAcc;
      fpsAcc = 0; fpsN = 0;
      qualityTimer += 0.5;
      if (qualityTimer > 2) {
        qualityTimer = 0;
        if (api.stats.fps < 40 && api.quality > 0.6) { api.quality = Math.max(0.6, api.quality - 0.15); resize(); }
        else if (api.stats.fps > 57 && api.quality < 1) { api.quality = Math.min(1, api.quality + 0.1); resize(); }
      }
    }

    const mobile = W < 760;
    const S = {
      N: Math.round((mobile ? 30 : 42) * (0.7 + 0.3 * api.quality)),
      seg: Math.round((mobile ? 15 : 22) * (0.72 + 0.28 * api.quality)),
      L: 30, girth: 3.25, amp: 2.9, waveK: 7.4, waveW: 2.05,
      flapW: 2.5, flapA: 0.52, roll: 0, headPitch: 0, headYaw: 0
    };

    // jalur terbang (lissajous) + roll mengikuti belokan
    const pathAt = (tt) => [
      Math.sin(tt * 0.185) * 13,
      Math.sin(tt * 0.185 * 1.7) * 4.0 + Math.sin(tt * 0.185 * 0.6) * 1.6,
      Math.cos(tt * 0.185 * 1.31) * 17
    ];
    const off = pathAt(t);
    const ahead = pathAt(t + 0.35), behind = pathAt(t - 0.35);
    const h1 = Math.atan2(ahead[2] - off[2], ahead[0] - off[0]);
    const h0 = Math.atan2(off[2] - behind[2], off[0] - behind[0]);
    let dH = h1 - h0;
    while (dH > Math.PI) dH -= TAU; while (dH < -Math.PI) dH += TAU;
    S.roll = clamp(-dH * 3.4, -0.72, 0.72) + 0.05 * Math.sin(t * 0.7);
    // pointer memengaruhi arah pandang
    S.headYaw = api.pointer.tx * 0.34;
    S.headPitch = -api.pointer.ty * 0.30;
    S.flapA = 0.34 + 0.20 * api.roar;

    // mulut / auman
    const rt = t - api.roarT;
    api.roar = rt < 1.7 ? Math.sin(Math.min(1, rt / 1.7) * Math.PI) : 0;
    const targetMouth = api.roar > 0.02 ? Math.pow(Math.sin(Math.min(1, rt / 1.7) * Math.PI), 0.7) : 0.06 + 0.05 * Math.sin(t * 1.6);
    api.mouth = lerp(api.mouth, targetMouth, 1 - Math.pow(0.002, dt));
    if (api.roar > 0.15 && Math.random() < 0.75) spawnEmber(mobile ? 2 : 4, 0.7 + api.roar);
    if (Math.random() < 0.02) spawnEmber(1, 0.25);

    // auman otomatis
    if (t - (frame._lastAuto || 0) > 11 + Math.random() * 8) {
      frame._lastAuto = t;
      roar();
    }

    // bangun scene
    list = []; listMark = 0;
    const body = buildBody(t, S, off);
    buildFin(t, body);
    buildLegs(t, body);
    buildWings(t, body);
    buildTailBlade(t, body);
    buildHead(t, body, off);
    updateParticles(dt, S);

    updateCamera(dt, S);
    render();
    requestAnimationFrame(frame);
  }
  let listMark = 0;

  function resize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(280, rect.height);
    DPR = clamp(window.devicePixelRatio || 1, 1, 2) * (0.65 + 0.35 * api.quality);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
  }

  function roar() {
    api.roarT = api.t;
    spawnEmber(window.innerWidth < 760 ? 16 : 34, 1.5);
    if (typeof api.onRoar === 'function') api.onRoar();
  }

  function init(el) {
    canvas = el;
    ctx = canvas.getContext('2d', { alpha: false });
    api.el = el;
    resize();
    initParticles();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(frame);
    return api;
  }

  window.Dragon666 = {
    init: init,
    roar: roar,
    api: api,
    setPointer: (x, y) => { api.pointer.tx = clamp(x, -1, 1); api.pointer.ty = clamp(y, -1, 1); },
    setCamMode: (m) => { api.camMode = m; },
    setRunning: (r) => { api.running = r; if (r) last = 0; },
    setSpeed: (s) => { api.speed = s; },
    resize: resize
  };
})();
