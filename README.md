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

## Deploy ke Vercel & pasang domain

Situs ini static murni → Vercel bisa serve langsung dari repo ini tanpa build step.
Konfigurasi bawaan sudah ada di [`vercel.json`](vercel.json)
(clean URL, cache asset 1 tahun, header keamanan).

### Cara 1 — Import dari GitHub (paling mudah, tanpa CLI)

1. Buka <https://vercel.com/new> → login → **Import Git Repository** →
   pilih `HOOOOOOQ/WEB666PALLXXX`.
2. Framework Preset: **Other**. Build Command & Output Directory: **kosongkan**.
3. **Deploy**. Dapat URL `https://<project>.vercel.app`.
4. Pasang domain: **Project → Settings → Domains → Add** → ketik domainmu →
   ikuti catatan DNS yang ditampilkan Vercel.

### Cara 2 — CLI (dari laptop atau bahkan Termux)

```bash
npm i -g vercel
vercel login          # otentikasi lewat browser
cd WEB666PALLXXX
vercel                # deploy preview
vercel --prod         # deploy produksi
vercel domains add <domain-kamu>   # ikat domain ke project ini
```

### DNS untuk domain

| Tipe   | Name / Host | Value                    | Catatan                 |
|--------|-------------|--------------------------|-------------------------|
| `A`    | `@`         | `76.76.21.21`            | domain tanpa www        |
| `CNAME`| `www`       | `cname.vercel-dns.com`   | subdomain www           |

- SSL/HTTPS terbit otomatis beberapa menit setelah domain terverifikasi.
- Panduan lengkap langkah Termux ada di [`TERMUX.md`](TERMUX.md).

## Kustomisasi Cepat

- Section `#anggota` sengaja anonim (identitas disegel). Kalau mau menampilkan nama asli keluarga, ganti isi kartu di bagian itu (`index.html`).
- Warna tema di `:root` pada `assets/css/style.css` (`--red`, `--bg`, dst.).
- Perilaku naga di objek `S` dalam `frame()` pada `assets/js/dragon.js`
  (`girth`, `amp`, `waveK`, `flapW`, dll.).

---

© 666pallxXx — 666 FAMILY / 666 GVNK. Yang masuk keluarga, tidak ditinggal.
