import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { if (!/Could not parse CSS/.test(String(e.message || e))) errors.push('jsdomError: ' + (e.message || e)); });
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const ctxStub = () => new Proxy({}, {
  get(t, prop) {
    if (prop === 'canvas') return null;
    if (!(prop in t)) {
      t[prop] = (...args) => {
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return { addColorStop() {} };
        return undefined;
      };
    }
    return t[prop];
  },
  set(t, prop, v) { t[prop] = v; return true; }
});

const html = fs.readFileSync('/home/user/WEB666PALLXXX/index.html', 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost:8080/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = function () { return ctxStub(); };
    window.addEventListener('error', e => errors.push('window.onerror: ' + e.message));
  }
});
const { window } = dom;
const { document } = window;

const wait = ms => new Promise(r => setTimeout(r, ms));
await wait(2500);   // biarkan script defer jalan + splash loading

const results = [];
const ok = (name, cond) => results.push([cond ? 'PASS' : 'FAIL', name]);

ok('Dragon666 terpasang', !!window.Dragon666);
ok('Ambient666 terpasang', !!window.Ambient666);
ok('Sound666 terpasang', !!window.Sound666);
ok('splash ada', !!document.getElementById('splash'));
ok('body is-locked saat splash', document.body.classList.contains('is-locked'));

// tunggu splash ready lalu klik MASUK
await wait(2000);
const enter = document.getElementById('sp-enter');
ok('tombol masuk aktif setelah load', !enter.disabled);
enter.click();
await wait(1500);
ok('splash ditutup', document.getElementById('splash').classList.contains('is-gone'));
ok('body entered', document.body.classList.contains('entered'));
ok('body tidak locked', !document.body.classList.contains('is-locked'));

// marquee diduplikasi
ok('marquee track terduplikasi', document.querySelectorAll('.marquee-track span').length >= 10);

// nav aktif setelah scroll event
window.dispatchEvent(new window.Event('scroll'));
ok('progress bar ada', !!document.getElementById('progress'));

// klik tombol naga
document.getElementById('btn-roar').click();
const cam = document.getElementById('btn-cam');
cam.click();
ok('label kamera berubah', document.getElementById('cam-label').textContent === 'CLOSE-UP');
cam.click(); cam.click();
ok('label kamera kembali', document.getElementById('cam-label').textContent === 'IKUTI KURSOR');

// sound toggle (AudioContext tidak ada di jsdom -> harus aman)
document.getElementById('sound-toggle').click();
ok('sound toggle aman tanpa AudioContext', true);

// tahun footer
ok('tahun footer terisi', /\d{4}/.test(document.getElementById('year').textContent));

// jumlah tautan saluran resmi
const hrefs = [...document.querySelectorAll('a[href^="http"]')].map(a => a.href);
for (const u of ['https://whatsapp.com/channel/0029Vb9T7598PgsKcVNjKz1B', 'https://tiktok.com/@palllikeyw', 'https://t.me/uxpall', 'https://www.youtube.com/@xPallOfficial']) {
  ok('tautan resmi ada: ' + u.split('/')[2], hrefs.includes(u));
}

console.log(results.map(r => r[0] + '  ' + r[1]).join('\n'));
console.log('\nERRORS (' + errors.length + '):');
errors.slice(0, 12).forEach(e => console.log(' -', e));
const fails = results.filter(r => r[0] === 'FAIL').length;
console.log(fails === 0 && errors.length === 0 ? '\n✅ E2E OK' : '\n❌ ADA MASALAH');
process.exit(fails === 0 && errors.length === 0 ? 0 : 1);
