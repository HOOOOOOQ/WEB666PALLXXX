# Jalankan & Test di Termux (Android)

Situs ini **static murni** (HTML/CSS/JS vanilla, tanpa build step), jadi jalan di Termux
bahkan **tanpa server sekalipun**.

## 1. Pasang bahan

```bash
pkg update && pkg upgrade -y
pkg install -y python nodejs git
```

## 2. Ambil kode

```bash
# PENTING: kode situs ada di branch arena/74abe853-web666pallxxx
git clone -b arena/74abe853-web666pallxxx https://github.com/HOOOOOOQ/WEB666PALLXXX
cd WEB666PALLXXX
```

## 3. Test

```bash
# uji end-to-end (butuh node; jsdom di-install otomatis sebagai devDependency)
npm install
npm test            # mode http (butuh server jalan, lihat bawah)
MODE=file npm test  # mode buka-file-langsung, tanpa server
```

## 4. Jalanankan

**Opsi A — buka langsung (paling cepat):**

```bash
termux-open index.html
```

Tab browser terbuka; situs berfungsi penuh dari `file://`
(splash, naga 3D, semua saluran).

**Opsi B — server lokal (disarankan, persis seperti produksi):**

```bash
python -m http.server 8080 --bind 0.0.0.0
```

Lalu buka `http://localhost:8080` di browser HP.
Dari perangkat lain di WiFi yang sama: `http://<IP-HP>:8080`
(cek IP dengan `ifconfig | grep inet`).

**Opsi C — server Node:**

```bash
npm start            # sama dengan opsi B (python)
# atau
npx serve -l 8080
```

## 5. Catatan performa di HP

- Naga 3D punya **kualitas adaptif**: kalau FPS turun, resolusi & kepadatan mesh
  diturunkan otomatis — tetap mulus di HP kelas bawah.
- Kalau browser menanyakan izin notifikasi/audio: audio ambien mati secara default;
  nyalakan lewat tombol equalizer di header situs.
- Gunakan Chrome/Firefox terbaru di Android untuk hasil terbaik.

## 6. Deploy ke Vercel langsung dari Termux (opsional)

```bash
npm i -g vercel
vercel login        # buka link yang muncul di browser HP
vercel --prod       # deploy folder ini
```

Langkah lengkap + pasang domain: lihat README bagian
**“Deploy ke Vercel & pasang domain”**.
