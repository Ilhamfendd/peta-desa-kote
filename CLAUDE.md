# Konteks proyek — Peta Digital Desa Kote

Peta digital satu berkas untuk **Desa Kote, Singkep Pesisir, Kab. Lingga, Kepulauan Riau**.
Dibuat oleh tim **KKN Kelompok 67**. Tujuan akhirnya dipasang di website desa.

Pengguna berbahasa Indonesia dan bukan programmer — **seluruh antarmuka, komentar
kode, dan penjelasan memakai bahasa Indonesia.**

## Aturan yang tidak boleh dilanggar

1. **Jangan pernah mengarang data desa.** Statistik penduduk tingkat desa untuk Kote
   tidak ada di sumber publik. Berkas terbit dikirim **kosong**; angka hanya boleh
   masuk lewat halaman pengelolaan oleh perangkat desa. Bila butuh data contoh untuk menguji
   tampilan, taruh di luar folder proyek dan beri label jelas.
2. **Jangan sunting berkas hasil rakitan.** `peta-desa-kote.html` dirakit dari
   `src/` oleh `build.py`; seluruh `public/*.html` dan `public/peta/index.html`
   dirakit dari `situs/` oleh `bangun-situs.py`. Sunting sumbernya, lalu bangun
   ulang. Satu-satunya isi `public/` yang boleh disentuh langsung adalah
   `public/unduhan/` — itu folder isian.
3. **Jangan ubah palet warna grafik statistik.** Palet kategorikal itu sudah
   tervalidasi untuk buta warna. Warna merek hanya mengendalikan antarmuka
   (bilah atas, tombol, aksen, batas desa) — bukan seri grafik.

## Alur kerja

```
python build.py          # src/   -> peta-desa-kote.html (satu berkas ~654 KB)
python bangun-situs.py   # situs/ -> public/ (7 halaman + salinan peta)
python terbitkan.py      # jalankan keduanya, lalu commit & push
```

Satu alamat memuat dua hal: **profil desa di `/`**, **peta digital di `/peta`**.
Peta tetap satu berkas mandiri yang bisa dibuka lewat `file://`; karena itu
tautan pulang ke situs desa pada merek kiri-atas hanya dipasang bila
`location.protocol` berupa http(s) — jangan diubah jadi `href` tetap di HTML.

Modul JS di `src/js/` digabung urut nama (`00-` … `99-`) menjadi satu skrip klasik.
Karena satu lingkup, deklarasi `function` ter-hoist antar berkas — tapi `const`/`let`
tingkat atas **tidak** menempel di `window` (penting saat menguji lewat iframe;
pakai `w.eval('S.data…')`).

Penanda sisipan di `src/index.html`: `__LEAFLET_CSS__`, `__APP_CSS__`, `__LEAFLET_JS__`,
`__APP_JS__`, `__BASEMAP__`, `__DESA_DATA__`, `__LOGO_KKN__`.

**Jangan pernah menaruh literal `</script>` di dalam kode JS** — akan menutup blok
skrip lebih awal. `build.py` sudah menjaga ini; tulis `'<' + '/script>'` bila perlu.

## Cara menguji (wajib, jangan hanya baca kode)

Chrome headless tersedia di
`C:\Program Files\Google\Chrome\Application\chrome.exe`.

- **Tangkap layar:** `--headless=new --screenshot=out.png --window-size=1400,900
  --virtual-time-budget=9000 file:///…`
  Catatan: viewport hasil tidak sama dengan `--window-size` (PNG-nya terkrop).
  Ukur lewat DOM bila menyelidiki tata letak.
- **Uji perilaku:** suntik skrip yang menaruh hasil di `document.body[data-diag]`,
  jalankan dengan `--dump-dom`, lalu ambil dengan regex. Decode stdout sebagai
  UTF-8 (`stdout.decode('utf-8','replace')`) — cp1252 akan gagal.
- Bug interaksi (mis. tombol mati) **hanya ketahuan lewat klik tersimulasi**
  (`dispatchEvent(new MouseEvent('click', {bubbles:true}))`), bukan dari membaca kode.
- Selalu `node --check` hasil gabungan JS sebelum membangun.

**Dua jebakan tangkapan layar yang berulang kali menyesatkan:**

1. **Chrome membatasi lebar jendela minimum (~500 px).** `--window-size=412,800`
   tetap menghasilkan viewport 500 px, sedangkan PNG-nya 412 px — jadi gambarnya
   *terkrop*, bukan meluap. Sebelum menyimpulkan ada luapan, bandingkan
   `document.documentElement.scrollWidth` dengan `innerWidth`. Untuk menguji
   ponsel sungguhan, sematkan aplikasi dalam `<iframe width="412">` di jendela
   yang lebih besar.
2. **Animasi zoom/pan Leaflet sering tidak selesai** di bawah
   `--virtual-time-budget`, sehingga `getZoom()` seolah tidak berubah.
   Pakai `setZoom(z, {animate:false})`, atau mata-matai pemanggilan fungsinya —
   jangan menyimpulkan tombolnya rusak.

## Tata letak & kepadatan

Sasaran viewport: **1536×744** (layar 1920×1080 dengan penskalaan Windows 125%),
bukan 1440×900. Tingginya pendek, jadi kepadatan sidebar penting.

Angka ditampilkan lewat `blokStat()` — satu nilai utama besar lalu baris ringkas
(`.stat-blok`). Susunan kartu kotak yang lama menghabiskan ~420 px hanya untuk
lima angka; yang sekarang ~180 px. **Jangan kembali ke kartu-per-angka.**

Tingkat ukuran huruf yang berlaku: angka utama 30 px › suhu di Beranda 22 px ›
teks isi 13 px › judul kartu 11 px kapital. Judul grafik ikut aturan
`.card > h3, .chart-head h3` — biarkan tetap satu tingkat.

Seluruh alat peta berada dalam **satu tumpukan** `#map-tools`, termasuk tombol
zoom buatan sendiri; `.leaflet-control-container` sengaja disembunyikan karena
kontrol zoom bawaan menimpa dua tombol teratas.

## Keadaan data

OpenStreetMap untuk wilayah ini sangat tipis: **tidak ada poligon batas desa**
(hanya simpul `place=village` di `-0,36580, 104,50984`, kode `21.04.06.2004`),
tidak ada bangunan, dan hampir tidak ada POI. `src/basemap.json` berisi geometri
yang sudah ditarik dan disederhanakan (garis pantai, jalan, perairan, pulau,
permukiman). Untuk menariknya ulang, pakai mirror `overpass.kumi.systems` —
yang resmi sering sibuk.

Cuaca & gelombang dari Open-Meteo (tanpa kunci API), termasuk API kelautan
karena Kote adalah desa pesisir.

## Halaman pengelolaan & penyimpanan server

Sejak versi 2, data desa disimpan di **Vercel Blob**, bukan di localStorage.
Alurnya: sunting → **draf** (`desa/draf.json`, tersimpan seketika) → Terbitkan →
**terbit** (`desa/terbit.json`, publik) → deploy hook → perakitan ulang.

`build.py` dan `bangun-situs.py` mengambil versi terbit lewat `alat.py`
(`GET /api/terbit`) **hanya bila env `VERCEL` ada**. Di komputer sendiri keduanya
tetap memakai berkas repo, supaya perakitan bisa jalan tanpa internet.

Fungsi API ada di `api/` (Node ESM — `package.json` wajib punya `"type": "module"`).
Berkas berawalan `_` bukan rute. Tidak memakai pustaka auth: scrypt + kue
bertanda HMAC dari `node:crypto` (`api/_lib/sesi.js`).

**`@vercel/blob` wajib v2 ke atas.** Versi 0.x hanya mengenal `access: 'public'`
dan tidak punya `get()`. Sempat terpasang 0.27.3 dan itu diam-diam mematikan
seluruh rencana penyimpanan privat — berkas akun akan gagal ditulis, atau lebih
buruk, tersimpan terbuka di alamat yang mudah ditebak (`addRandomSuffix: false`).
Jangan turunkan versinya.

**Aturan yang tidak boleh dilanggar di sini:**

1. **Peta wajib tetap hidup tanpa server.** `sambungServer()` harus gagal diam.
   Jangan pernah menunggu jaringan sebelum peta digambar — itu merusak pemakaian
   luring, yang jadi alasan berkas mandiri ini ada.
2. **`meta.diperbarui` menentukan siapa yang menang** antara data terbit dan
   salinan localStorage. `build.py` mengisinya dari waktu ubah `data.json`.
   Pernah terjadi: data diperbarui tapi cap waktunya tidak, sehingga salinan lama
   di browser diam-diam menang dan peta tampak kosong. Jangan tulis tangan.
3. **Jangan kembalikan draf lewat `/api/terbit`.** Rute itu terbuka untuk umum;
   yang boleh keluar hanya yang sudah diterbitkan.

**Jebakan CSS yang sudah menelan waktu:** atribut `hidden` kalah oleh `display`
apa pun. `.masuk-latar` memakai `display:grid`, jadi layar masuk tetap tergambar
menutupi ruang kerja walau `hidden` sudah dipasang. `situs/admin.html` sekarang
punya `[hidden]{display:none!important}`. Ini hanya ketahuan lewat tangkapan
layar — pemeriksaan DOM justru bilang semuanya benar.

**Menguji tanpa Blob:** salin `api/` ke luar proyek, ganti `_lib/simpan.js`
dengan tiruan di memori, tambahkan `{"type":"module"}`, lalu panggil handler-nya
dengan req/res tiruan. Chrome `--screenshot` memotret saat `load`, sebelum
pemuatan asinkron selesai — untuk memotret keadaan akhir, `--dump-dom` dulu,
buang blok skripnya, baru potret berkas hasilnya.

## Website profil (`situs/`)

Arahnya **peta laut**, karena Kote desa pesisir — bukan templat website desa.
Tiga keputusan yang saling menopang, jangan dibongkar sebagian:

1. **Hero-nya garis pantai Kote yang sebenarnya**, ditarik dari `src/basemap.json`
   oleh `hero_svg()` dan digambar sebagai linework peta laut. Bukan hiasan:
   kalau basemap diperbarui, hero ikut berubah.
2. **Tipografi mengikuti kaidah peta navigasi** — perairan diset serif miring
   (`.laut`, Newsreader italic), daratan diset sans tegak (Instrument Sans).
   Kelas `.laut` dipasang dari `sifat: "laut"` di `konten.json`.
3. **Magenta `#a8306f` adalah warna konvensi**, bukan selera — peta laut mencetak
   suar dan catatan peringatan dengan magenta. Dipakai tipis untuk penanda saja.

Palet: `--laut-dalam #0c2229`, `--laut #14424c`, `--kertas #f3f4f1`, ditambah
hijau KKN yang sudah ada. Ini **terpisah** dari palet aplikasi peta.

Aturan isi: bagian kosong **tidak dirender**, dan disebut di akhir proses bangun
sebagai pengingat. Jangan menggantinya dengan teks contoh atau nama karangan.

## Identitas visual

Hijau `#263f29` diambil dari logo KKN. Aksen `#2a5a2f` (terang) / `#5cb767` (gelap).
Logo ditanam sebagai **mask alfa** (`src/logo-kkn-emblem.png`), jadi warnanya
mengikuti `currentColor`. Slot logo desa dibiarkan kosong dan bisa diunggah sendiri —
tidak ada lambang resmi Desa Kote di sumber publik, jangan dibuatkan.

## Kode QR (`src/js/25-qr.js`)

Ditulis sendiri: mode byte, koreksi galat M, versi 1–10. Sudah diuji dua lapis —
dibandingkan modul-per-modul dengan pustaka `qrcode` Python (**0 beda**) dan
dipindai balik dengan OpenCV (`cv2.QRCodeDetector`). `qrMatriks(teks, topengPaksa)`
menerima argumen kedua khusus untuk pembandingan itu.

Dua jebakan yang sudah menelan waktu di sini, jangan diulang:
informasi format memakai **bit tertinggi lebih dulu** (`bits >> (14 - i)`), dan
salinan keduanya hanya **7** modul di kolom 8 — sebab `(n-8, 8)` adalah modul
gelap tetap, bukan bagian informasi format.

## Urutan penangan klik (`aksiKlik` di 99-init.js)

Penangan memakai `e.target.closest(...)` yang menelusuri **ke atas**. Karena itu
tombol yang berada di dalam sebuah baris daftar juga cocok dengan selektor
barisnya. **Tombol di dalam wajib diperiksa lebih dulu daripada pembungkusnya** —
kalau tidak, `return` milik baris akan mematikan tombolnya. Ini pernah membuat
tombol Hapus/Ubah pada daftar Tempat dan Dusun tidak berfungsi sama sekali.

## Sorot wilayah desa

Poligon selebar dunia dengan batas desa sebagai lubang, **digambar oleh Leaflet
sendiri** (`L.polygon([dunia, cincinDesa])`) di pane `p-fokus`. Warnanya dari
`--kabut` / `--kabut-legap`.

**Pernah dicoba dan gagal:** `<div>` di atas peta dengan `backdrop-filter` +
`mask-image`. Efeknya lebih bagus (luar jadi kelabu, dalam berwarna penuh),
tetapi elemen DOM di luar sistem transform Leaflet **mustahil sejalan selama
animasi zoom** — Leaflet menskalakan panelnya sendiri, topeng piksel-layar
tertinggal. Menyembunyikannya selama zoom hanya menutupi gejala dan terasa
seperti fitur yang hilang. Jangan diulang tanpa memindahkan overlay ke dalam
sistem layer Leaflet.

## Panel Leaflet & kelegapan

Tiap layer punya panel sendiri (`p-jalan`, `p-tempat`, …) yang dibuat di `buatPeta`
lewat `URUTAN_PANE`. Ini yang memungkinkan kelegapan diatur per layer — cukup
mengubah `opacity` panelnya, tanpa menyentuh gaya tiap fitur. **Setiap layer baru
wajib menyertakan `pane: 'p-<id>'`**, kalau tidak ia akan jatuh ke panel bawaan
dan lepas dari pengatur kelegapan maupun urutan tumpukan.

## Yang masih terbuka

- Pengguna menilai tata letaknya **masih terlalu umum**; identitas visual sudah
  dikerjakan, penataan ulang belum. Usulan yang sudah disampaikan: Beranda sebagai
  ringkasan visual, dan panel khusus nelayan (gelombang + angin + pasang dalam
  satu layar).
- **Layer jalur (garis)** belum ada — peta baru bisa memuat titik dan area, padahal
  jalan lingkungan, jalur evakuasi, dan rute perahu berbentuk garis.
- **Detail per dusun** belum ada: dusun hanya menyimpan nama dan geometri, belum
  bisa diisi jumlah penduduk atau nama kepala dusun.
- Mode **Luring** belum membedakan darat dan laut dengan isian warna — OSM tidak
  menyediakan poligon daratan untuk area ini, hanya garis pantai.
