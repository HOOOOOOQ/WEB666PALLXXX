# 666pallxXx — 666 FAMILY / 666 GVNK 🔥

Situs resmi **Saluran Pall**: satu pintu untuk semua lini resmi keluarga —
WhatsApp Channel, TikTok, Telegram, dan YouTube.

Dibangun sebagai **static website tanpa dependensi runtime**: HTML + CSS + vanilla JS.
Highlight utamanya adalah **naga 3D prosedural** yang dirender realtime di browser
(software renderer tulisan sendiri: mesh prosedural → proyeksi perspektif →
painter's algorithm → shading fresnel), lengkap dengan kepakan sayap, semburan api,
dan tiga mode kamera.

## Saluran Resmi

| Saluran   | Tautan                                                    |
|-----------|-----------------------------------------------------------|
| WhatsApp  | https://whatsapp.com/channel/0029Vb9T7598PgsKcVNjKz1B      |
| TikTok    | https://tiktok.com/@palllikeyw                            |
| Telegram  | https://t.me/uxpall                                       |
| YouTube   | https://www.youtube.com/@xPallOfficial                    |

> Hanya empat tautan di atas yang resmi. Selain itu bukan bagian dari 666 FAMILY.

## Menjalankan

Tidak butuh build step. Cukup serve foldernya:

```bash
npm start                 # python3 -m http.server 8080
# atau
python3 -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Struktur

```
index.html            Halaman utama (splash, hero naga, saluran, anggota, galeri, kode, gabung)
assets/
  css/style.css       Tema dark/white + aksen merah 666, splash screen, kartu tilt-3D
  js/dragon.js        Engine naga 3D prosedural (renderer, mesh, partikel, kamera)
  js/ambient.js       Latar kabut + bara api + debu bintang (canvas 2D)
  js/app.js           Splash, navigasi, kursor, reveal, counter, audio ambien (WebAudio)
tests/
  e2e-dom.mjs         Uji end-to-end berbasis jsdom (splash, nav, tautan resmi, tanpa error)
```

## Uji

```bash
npm install     # hanya jsdom untuk pengujian
npm test
```

## Fitur

- **Splash screen sinematik**: sigil SVG yang menggambar dirinya sendiri, progress bar,
  tombol "MASUK KE SARANG", transisi shutter, dan bisa dilewati.
- **Naga 3D realtime** (~1.600 poligon/frame): tubuh bersisik, tanduk, gigi, mata menyala,
  sayap membran berkepak, sirip punggung, ekor berbilah, semburan api saat mengaum.
  Naga mengikuti kursor/gyroscope; klik naga atau tombol 🔥 untuk membuatnya mengaum.
  Mode kamera: ikuti kursor / close-up wajah / orbit sinematik.
- **Kualitas adaptif**: resolusi & kepadatan mesh menyesuaikan FPS perangkat.
- **Audio ambien prosedural** (WebAudio, tanpa file): drone rendah + angin + lonceng,
  plus efek auman. Mati secara default; nyalakan lewat tombol equalizer di header.
- **Dark / white theme** dengan aksen merah 666, kursor kustom, kartu tilt-3D,
  marquee, scroll reveal, progress bar, dan footer watermark raksasa.
- Responsif penuh + menghormati `prefers-reduced-motion`.

## Kustomisasi Cepat

- Ganti nama anggota di bagian `#anggota` (`index.html`).
- Warna tema di `:root` pada `assets/css/style.css` (`--red`, `--bg`, dst.).
- Perilaku naga di objek `S` dalam `frame()` pada `assets/js/dragon.js`
  (`girth`, `amp`, `waveK`, `flapW`, dll.).

---

© 666pallxXx — 666 FAMILY / 666 GVNK. Yang masuk keluarga, tidak ditinggal.
