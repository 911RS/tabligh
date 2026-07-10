<div align="center">

<img src="docs/icon.png" width="128" alt="Tabligh"/>

# 🕌 Tabligh

### بَلِّغُوا عَنِّي وَلَوْ آيَةً
_"Sampaikanlah dariku, walau satu ayat."_ — Nabi Muhammad ﷺ (Bukhari)

**Hasilkan secara otomatis reel Al-Qur'an yang sinematik dan tersinkron ala karaoke, lalu terbitkan ke TikTok, Instagram, Facebook & YouTube — terjadwal, tanpa campur tangan.**

Tak perlu memilih apa pun. Penjadwal memilih surah + potongan ayat secara acak, mengambil lantunan yang persis, merender video vertikal dengan penyorotan kata demi kata di atas latar yang menenangkan, lalu mempostingnya beberapa kali sehari.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](tsconfig.json)

🌍 [English](README.md) · [العربية](README.ar.md) · [Français](README.fr.md) · [اردو](README.ur.md) · [Bahasa Indonesia](README.id.md) · [Türkçe](README.tr.md) · [Bahasa Melayu](README.ms.md) · [বাংলা](README.bn.md) · [فارسی](README.fa.md) · [Español](README.es.md)

**▶ Lihat langsung:** [@eQurany di TikTok](https://www.tiktok.com/@eQurany) — setiap video di sana dihasilkan otomatis oleh proyek ini.

<table>
  <tr>
    <td align="center"><b>classic</b></td>
    <td align="center"><b>glass</b></td>
    <td align="center"><b>noor</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/template-classic.jpg" width="250" alt="Template classic — foto + karaoke"/></td>
    <td><img src="docs/screenshots/template-glass.jpg" width="250" alt="Template glassmorphism — kartu buram + gelombang suara"/></td>
    <td><img src="docs/screenshots/template-noor.jpg" width="250" alt="Template noor — Cahaya Ilahi keemasan"/></td>
  </tr>
  <tr>
    <td align="center"><sub>foto + scrim · karaoke emas<br/><i>Al-Husary</i></sub></td>
    <td align="center"><sub>satu kartu buram · gelombang suara langsung<br/><i>Al-Tunaiji · dengan basmala</i></sub></td>
    <td align="center"><sub>halo keemasan · angka bersepuh emas<br/><i>Al-Minshawi · dengan basmala</i></sub></td>
  </tr>
</table>

<sub>Tiga template bawaan — beralih dengan <code>TEMPLATE</code> atau melalui panel/menu. Setiap reel memvariasikan latarnya, dan <code>glass</code> mendapat gelombang suara yang unik di tiap video.</sub>

</div>

---

## ✨ Fitur

- 🎬 **Reel sinematik 1080×1920** — latar foto stok penuh layar (Pexels/Unsplash) dengan lapisan keterbacaan yang kuat, partikel halus yang melayang, dan pergeseran Ken-Burns yang lambat.
- 🎨 **Tiga template visual** — **classic** (foto + scrim), **glass** (satu kartu glassmorphism buram yang menetap dengan gelombang suara langsung), dan **noor** ("Cahaya Ilahi" yang hangat — halo keemasan + angka bersepuh emas). Atur `TEMPLATE` atau beralih di panel/menu.
- 🕋 **Intro Bismillah** — potongan ayat yang dimulai dari ayat 1 selalu dibuka dengan Bismillah milik qari sendiri (dilantunkan, dengan suaranya); secara opsional dapat ditambahkan sebelum *setiap* potongan (`BASMALA=always`). At-Taubah dan Al-Fatihah ditangani dengan benar.
- 🎤 **Isian kata ala karaoke** — setiap kata mencerah selaras dengan lantunan (kanan→kiri), sehingga penonton dapat mengikutinya.
- 🖋️ **Tipografi Arab yang otentik** — teks Utsmani lengkap dengan *syakl* yang benar dalam wajah huruf **Mada** yang modern dan bersih; judul dalam kaligrafi **Aref Ruqaa**.
- 🎯 **Sinkron persis, tanpa AI** — audio berasal dari [everyayah.com](https://everyayah.com) sebagai berkas per-ayat, sehingga pengaturan waktu tiap ayat persis dan gratis (tanpa transkripsi).
- 🔀 **Pemilihan konten otomatis** — surah acak + potongan ayat berurutan acak (panjang dapat dikonfigurasi); surah pendek dirender secara utuh.
- 🌇 **Latar yang aman dan bercita rasa** — kumpulan 50 kata kunci terkurasi (masjid, alam, laut, langit…) plus filter yang membuang foto apa pun yang memuat orang atau apa pun yang tidak pantas. Pilih sumber Anda: **Pexels, Unsplash, atau folder gambar lokal Anda sendiri**.
- 🖥️ **Pusat komando interaktif** — jalankan `tabligh` (tanpa argumen) untuk UI terminal yang memukau guna menghasilkan reel, memulai/menghentikan panel, mengelola antrean, menelusuri riwayat, menyunting pengaturan, dan menjalankan pemeriksaan kesehatan. Terlokalisasi EN/AR/FR.
- 🎞️ **Outro khas** — potongan ayat memudar dan sebuah shalawat (dengan logo Anda) meluncur naik di atas adegan yang sama, lalu seluruh video memudar menjadi hitam.
- 📤 **Penerbitan multi-platform** — TikTok, Instagram Reels, Facebook Reels dan YouTube Shorts melalui [Buffer](https://buffer.com), dapat diaktifkan per platform lewat env.
- 🎛️ **Panel kontrol yang di-hosting sendiri** — UI web terlindungi kata sandi untuk mengelola setiap pengaturan, menghasilkan/mempratinjau/memposting reel, mengantrekan potongan ayat, dan menelusuri riwayat + analitik — semuanya langsung, tanpa deploy ulang. Terlokalisasi (EN/AR/FR, RTL penuh).
- ⏰ **Penjadwal atur-dan-lupakan** — proses yang selalu aktif memposting N kali sehari sesuai zona waktu Anda.
- 🧹 **Ramah disk** — berkas lokal dihapus tepat setelah diposting; objek cloud dipangkas otomatis.
- 🐳 **Deploy satu kontainer** — Dockerfile + bekerja apik di Coolify, Fly, Railway, atau host Docker mana pun.

---

## 🧠 Cara kerjanya

```
config / random pick
        │
        ▼
Quran text + translation  ──►  everyayah per-ayah audio (exact timing)
   (alquran.cloud)                       │
        │                                ▼
        └────────────►  TimedAyah[]  ──►  background (Pexels/Unsplash, person-filtered)
                                          │
                                          ▼
              Chromium renders animated frames (karaoke, particles, outro)
                                          │
                                          ▼
                    ffmpeg → MP4 (1080×1920) + recitation + silent outro
                                          │
                                          ▼
              object storage (public URL)  ──►  Buffer  ──►  TikTok / IG / FB / YT
                                          │
                                          ▼
                              cleanup (local now, cloud after ingest)
```

---

## 🚀 Mulai cepat (lokal)

Persyaratan: **Node ≥ 20** dan **ffmpeg** pada PATH Anda. (Chromium diunduh otomatis oleh Puppeteer.)

```bash
git clone https://github.com/911RS/tabligh.git
cd tabligh
npm install
cp .env.example .env        # fill in what you need (see below)

# Render a specific passage to work/…/reel.mp4 (no publishing)
npm start render -- --surah 112 --from 1 --to 4 --reciter husary --translation en.sahih

# Render a random passage
npm start random

# Everything the CLI can do
npm start
```

`reel.mp4` yang selesai (beserta `ir.json` yang tersinkron waktu) berakhir di `work/<surah>_<range>_<reciter>__<tag>/`.

---

## ⚙️ Konfigurasi

Semuanya digerakkan oleh variabel lingkungan (`.env`). Semuanya opsional kecuali bila sebuah fitur memerlukan kunci.

| Variabel | Tujuan | Bawaan |
|---|---|---|
| `TEMPLATE` | Gaya visual reel: `classic` / `glass` / `noor` | `classic` |
| `BASMALA` | Intro Bismillah: `off` (hanya di ayat 1) / `always` (setiap potongan) | `off` |
| `BACKGROUND_SOURCE` | `auto` / `pexels` / `unsplash` / `local` | `auto` |
| `BACKGROUND_LOCAL_DIR` | Folder gambar potret Anda sendiri (bila sumber = `local`) | _(kosong)_ |
| `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` | Latar foto stok | _(tidak diatur → fallback gradien)_ |
| `BUFFER_ACCESS_TOKEN` | Token API Buffer untuk penerbitan | _(tidak diatur → tanpa penerbitan)_ |
| `BUFFER_TIKTOK_CHANNEL_IDS` | Id channel TikTok dipisah koma | _(kosong)_ |
| `BUFFER_INSTAGRAM_CHANNEL_IDS` | Id channel Instagram Reels | _(kosong)_ |
| `BUFFER_FACEBOOK_CHANNEL_IDS` | Id channel Facebook Reels | _(kosong)_ |
| `BUFFER_YOUTUBE_CHANNEL_IDS` | Id channel YouTube Shorts | _(kosong)_ |
| `MINIO_*` | Penyimpanan kompatibel-S3 (bucket publik tempat Buffer mengambil) | bucket `tabligh`, port `9000` |
| `TZ` / `PUBLISH_TIMES` | Zona waktu + waktu dalam sehari untuk memposting otomatis | `Africa/Tunis` / `07:00,13:00,19:00` |
| `KARAOKE_ENABLED` | Isian kata demi kata tersinkron dengan lantunan | `true` |
| `TEXT_FILL_COLOR` | Warna teks yang dilantunkan (terisi) | `#ffffff` |
| `WATERMARK_ENABLED` / `WATERMARK_HANDLE` | Watermark logo di sudut (`assets/logo.png`) | `true` / _(kosong)_ |
| `FULL_SURAH_MAX_AYAHS` | Surah sependek ini dirender secara utuh | `7` |
| `RANDOM_MIN_AYAHS` / `RANDOM_MAX_AYAHS` | Panjang potongan untuk mode acak | `5` / `10` |
| `MAX_VIDEO_SECONDS` | Batasi panjang lantunan (di luar outro); memangkas ayat-ayat akhir agar pas (menimpa min) | `0` _(tanpa batas)_ |
| `RETENTION_DAYS` / `MINIO_RETENTION_HOURS` | Jendela pembersihan | `7` hari / `24` jam |
| `PORT` / `TRIGGER_TOKEN` | Server HTTP + rahasia untuk endpoint pemicu | `1998` / _(tidak diatur → dinonaktifkan)_ |
| `PANEL_ENABLED` | Sajikan panel kontrol (`false` = tanpa antarmuka, hanya penjadwal) | `true` |
| `UI_LANG` | Bahasa menu-terminal interaktif (`en` / `ar` / `fr`) | `en` |

Lihat [`.env.example`](.env.example) untuk daftar lengkap yang beranotasi. **Nilai-nilai ini menyemai store hanya pada proses pertama** — setelah itu, kelola pengaturan secara langsung di panel atau menu `tabligh`.

**Qari:** `husary`, `minshawy`, `abdulbasit`, `hudhaify`, `ayyoub`, `shuraym`, `husary-muallim`, `tunaiji` — atau folder [everyayah](https://everyayah.com) mentah mana pun. Lihat [`src/quran/reciters.ts`](src/quran/reciters.ts).

**Terjemahan:** id edisi [alquran.cloud](https://alquran.cloud) mana pun, mis. `en.sahih`, `fr.hamidullah`, atau `""` untuk hanya bahasa Arab.

---

## 🖥️ Pusat komando interaktif

Jalankan **`tabligh`** tanpa argumen di terminal untuk membuka menu interaktif — pusat kontrol mandiri untuk segalanya:

<div align="center">
  <img src="docs/screenshots/cli-command-center.jpg" width="720" alt="Pusat komando interaktif Tabligh — TUI master–detail dengan banner gradien, status langsung, menu dan panel kerja"/>
</div>

```
tabligh                 # opens the menu (in a TTY)
```

- **Hasilkan reel** — acak atau pilih potongan ayat; merender secara lokal (dengan progres langsung), lalu menawarkan untuk membuka video atau menerbitkannya.
- **Terbitkan sekarang** — hasilkan + terbitkan dalam satu langkah.
- **Panel kontrol** — **Mulai / Hentikan / Mulai Ulang** panel web sebagai layanan latar belakang, **buka** di peramban Anda, atau **pantau log-nya** — tanpa proses terpisah untuk diawasi.
- **Antrean** — tambah/hapus potongan ayat yang dimainkan penjadwal sebelum pilihan acak.
- **Riwayat & analitik** — total, rincian per platform, postingan terbaru.
- **Pengaturan** — bahasa, sumber latar (termasuk folder lokal), penjadwal aktif/nonaktif, jadwal, konten, channel, dan kunci API — semuanya diterapkan langsung.
- **Doctor** — pemeriksaan kesehatan sekilas (ffmpeg, Chrome, kunci, penyimpanan, disk).

Terlokalisasi dalam **English / العربية / Français** (atur `UI_LANG` atau beralih di Pengaturan). Konteks non-interaktif (pipa, Docker, CI) menampilkan bantuan klasik sebagai gantinya, sehingga scripting tidak terpengaruh. Ada juga `tabligh menu` (memaksanya) dan `tabligh doctor` (menjalankan pemeriksaan kesehatan saja).

## 🎛️ Panel kontrol web & CLI

Buka root aplikasi (`http://localhost:1998`) untuk panel terlindungi kata sandi:

- **Proses pertama** menampilkan layar penyiapan untuk membuat kata sandi Anda (atau jalankan `tabligh init` untuk wizard terminal — kini diakhiri dengan menampilkan URL dasbor Anda dan menawarkan untuk memulai panel).
- **Dasbor** — status, *Generate now* / *+ publish* sekali klik, pratinjau terbaru.
- **Generate** — pilih potongan ayat atau pilih acak, pratinjau sebelum diposting.
- **Pengaturan** — jadwal (zona waktu + pemilih waktu), konten (terjemahan, jumlah ayat, **panjang maksimum**), branding (karaoke, warna isian, partikel, latar animasi, promo outro), id channel platform, kunci API & penyimpanan — diterapkan **langsung**.
- **Antrean** — rencanakan potongan ayat tertentu; penjadwal memainkannya sebelum pilihan acak.
- **Riwayat / Analitik** — setiap render + posting, total, per platform, log terbaru.
- **Bahasa** — beralihkan panel antara English, العربية (RTL) dan Français.

Login dibatasi kecepatannya (5 percobaan → penguncian 15 menit). Setel ulang kata sandi dari server dengan
`tabligh set-password <new>` (mis. `docker exec <container> tabligh set-password …`).

Pengaturan berada dalam store dan bertahan pada volume `/app/data`; `.env` hanya menyemainya pada proses pertama.

### 🌐 Mengakses panel

Aplikasi tidak memiliki domain sendiri — ia hanya mendengarkan pada sebuah port (**`1998`** secara bawaan, timpa dengan `PORT`) di semua antarmuka. URL apa yang Anda buka bergantung pada tempatnya berjalan:

| Tempat berjalan | URL yang Anda buka | HTTPS? |
|---|---|---|
| Komputer Anda sendiri (`npm` / lokal) | `http://localhost:1998` | — (lokal, tidak apa-apa) |
| VPS cloud, port mentah terpapar | `http://<your-server-ip>:1998` | ❌ **tidak** |
| VPS di balik reverse proxy | `https://yourdomain.com` | ✅ disediakan proxy |

- **Secara lokal**, wizard penyiapan mencetak tautan persis saat mulai (`http://localhost:1998`).
- **Di VPS**, menjangkau `http://<server-ip>:1998` juga memerlukan firewall / security group Anda mengizinkan inbound `1998`.
- **⚠️ Jangan biarkan port mentah terpapar ke internet.** Panel menyajikan HTTP polos, sehingga kata sandi login Anda akan berjalan tanpa enkripsi. Tempatkan di balik reverse proxy yang mengakhiri TLS:
  - **[Coolify](https://coolify.io)** (disarankan) — atur domain pada aplikasi dan arahkan ke port `1998`; Traefik dari Coolify menangani routing **dan** sertifikat Let's Encrypt secara otomatis.
  - **Nginx / Caddy** — `proxy_pass http://127.0.0.1:1998` di balik domain + sertifikat Anda.

Aplikasi tidak pernah perlu mengetahui domain publiknya; proxy memiliki domain dan HTTPS lalu meneruskannya ke `1998` secara internal.

---

## 📤 Penerbitan

Penerbitan melewati [Buffer](https://buffer.com), yang menyebarkannya ke setiap platform yang terhubung.

1. Buat akun Buffer dan hubungkan channel TikTok / Instagram / Facebook / YouTube Anda.
2. Atur `BUFFER_ACCESS_TOKEN`, lalu jalankan `npm start channels` untuk mendaftar id channel Anda.
3. Masukkan id ke dalam variabel `BUFFER_*_CHANNEL_IDS` yang sesuai (subset apa pun — hanya TikTok pun boleh).
4. `npm start random -- --publish` (atau biarkan penjadwal yang melakukannya).

Setiap platform mendapat format yang tepat secara otomatis (Reel / Short). Keterangan mencakup surah, rentang ayat, qari, kredit foto, dan tagar.

### Penyimpanan — Anda tidak perlu memasang MinIO

Penyimpanan objek digunakan **hanya untuk penerbitan**: reel diunggah ke bucket S3 sehingga server Buffer dapat mengambilnya dari **URL publik**. Jika Anda hanya merender secara lokal (tanpa penerbitan), Anda **tidak memerlukan penyimpanan sama sekali**.

Pengaturan `MINIO_*` hanyalah kredensial **S3 standar** — penyedia kompatibel-S3 mana pun bisa, tidak hanya MinIO:

| Penyedia | Pasang? | Catatan |
|---|---|---|
| **Cloudflare R2** | ❌ | Paket gratis + bucket publik — paling mudah |
| **AWS S3 / Backblaze B2 / Wasabi / DO Spaces** | ❌ | Bucket cloud + kunci akses |
| **MinIO di-hosting sendiri** | ✅ | Hanya sepadan di server dengan domain publik |

⚠️ **Peringatan lokal:** Buffer mengambil melalui internet publik, jadi `MINIO_PUBLIC_URL` bucket harus dapat dijangkau dari luar mesin Anda. MinIO pada `localhost`/LAN Anda **tidak akan** berfungsi (Buffer tidak dapat menjangkaunya) — gunakan bucket cloud, atau host MinIO di balik domain publik (mis. di kotak yang sama dengan panel Anda). Aplikasi membuat bucket secara otomatis dan mengatur kebijakan public-read pada penerbitan pertama, lalu memangkas objek lama setelah `MINIO_RETENTION_HOURS`.

---

## 🐳 Deployment (penjadwal selalu aktif + panel kontrol)

Satu perintah — persistensi termasuk, tak ada yang perlu disiapkan:

```bash
cp .env.example .env      # fill in your keys (optional — you can also do it in the panel)
docker compose up -d      # scheduler + control panel, on http://localhost:1998
```

Selesai. Pada boot pertama aplikasi **membuat store konfigurasinya sendiri** di `data/store.json`
(disemai dari `.env` Anda) — Anda tidak pernah membuat atau "menautkan" apa pun. `docker-compose.yml`
yang disertakan memasang volume bernama di `/app/data`, sehingga pengaturan, kata sandi panel,
antrean dan riwayat Anda **bertahan lintas restart dan build ulang** secara otomatis.

`serve` (perintah bawaan) memulai:
- **panel kontrol** di `/` — terlindungi kata sandi; kelola pengaturan, hasilkan/pratinjau
  reel, posting sekarang, telusuri riwayat/analitik, dan antrekan potongan ayat. Ubah apa pun langsung,
  tanpa deploy ulang.
- **penjadwal internal** yang merender + menerbitkan pada setiap `PUBLISH_TIMES` di `TZ` Anda;
- `GET /health` dan `GET /trigger?key=<TRIGGER_TOKEN>` yang diamankan token untuk scripting.

**Mode tanpa antarmuka:** jalankan `tabligh serve --no-panel` (atau atur `PANEL_ENABLED=false`) agar
penjadwal tetap memposting sambil **tidak memaparkan permukaan HTTP sama sekali** — ideal jika Anda hanya mengelola aplikasi
dari terminal (menu `tabligh`) dan tidak ingin panel web untuk diamankan.

**Konfigurasi berada dalam store setelah boot pertama** (agar panel dapat menyuntingnya langsung). `.env` hanya
*menyemainya* sekali — untuk mengubah hal-hal nanti, gunakan panel (atau `tabligh set-password` untuk mereset
kata sandi). Hapus `data/store.json` untuk menyemai ulang dari `.env`.

**Di Coolify / Railway / Fly:** arahkan ke repo ini. Jika Anda men-deploy **`docker-compose.yml`**,
volume dibuat untuk Anda — nol langkah manual. Jika Anda menggunakan **Dockerfile** biasa, baris
`VOLUME /app/data` membuat sebagian besar platform mempertahankannya secara otomatis; di Coolify Anda juga bisa
menambahkan satu Persistent Storage yang dipasang di `/app/data`. Atur variabel env Anda dan deploy.

Proses pertama tanpa CLI? Cukup buka panel — ia menampilkan **layar penyiapan** untuk membuat
kata sandi Anda. Lebih suka terminal? Jalankan **`tabligh init`** untuk wizard interaktif.

---

## 🗺️ Peta jalan

- [ ] Mode sumber-YouTube (yt-dlp + Whisper) untuk lantunan sembarang
- [ ] Karaoke forced-alignment sejati (akurat per kata) melalui segmen Quran.com
- [ ] Buku besar de-dup agar potongan ayat tidak berulang sampai Mushaf selesai satu putaran
- [ ] Lebih banyak tata letak / tema

---

## 🙏 Kredit

- Lantunan: **[everyayah.com](https://everyayah.com)** · Teks & terjemahan: **[alquran.cloud](https://alquran.cloud)**
- Latar: **[Pexels](https://pexels.com)** / **[Unsplash](https://unsplash.com)** (dikreditkan di setiap keterangan)
- Font: **Mada** (badan ayat), **Aref Ruqaa** (judul), **Reem Kufi** (outro), **Ubuntu** (UI) (SIL OFL / UFL)
- Perenderan: **Puppeteer** + **ffmpeg**

## 📜 Lisensi

[MIT](LICENSE) — berbuat baiklah dengannya. Mohon tetap sajikan lantunan dan teks Al-Qur'an dengan hormat.

<div align="center">

_Jika ini membantu Anda menyebarkan kebaikan, ⭐ repo ini dan kunjungi **[@eQurany](https://www.tiktok.com/@eQurany)**._

</div>
