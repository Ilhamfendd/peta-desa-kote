# Peta Digital Desa Kote

Peta digital interaktif untuk **Desa Kote, Kecamatan Singkep Pesisir, Kabupaten Lingga,
Kepulauan Riau** (kode wilayah `21.04.06.2004`).

Hasil akhirnya **satu berkas**: `peta-desa-kote.html` (±510 KB). Tidak butuh server,
database, pemasangan, kunci API, maupun CDN. Cukup dobel-klik untuk membuka, atau
unggah ke website desa.

---

## Isi peta

| Bagian | Isinya |
|---|---|
| **Beranda** | Identitas desa, angka pokok, visi, kontak, cuaca ringkas |
| **Statistik** | Penduduk, kepadatan, rasio jenis kelamin, piramida umur, pendidikan, mata pencaharian, agama — tiap grafik punya tampilan **Tabel** |
| **Tempat** | Fasilitas dalam **15 kategori**, lengkap dengan **foto**, penyaring, dan tombol bagikan |
| **Cuaca** | Kondisi terkini, prakiraan 7 hari, arah & kekuatan angin, matahari terbit/terbenam, serta **peringatan gelombang** berskala BMKG |
| **Wilayah** | Batas desa (luas & keliling terhitung otomatis), dusun/RW, koordinat, desa sekitar beserta jaraknya |
| **Kelola** | Semua formulir pengisian data, impor/ekspor, dan penerbitan |

### Mode peta

Pemilih bergambar di kiri bawah, dengan gambar mini yang **diambil dari ubin asli
Desa Kote** — jadi pratinjaunya benar-benar memperlihatkan hasilnya:

| Mode | Sumber | Cocok untuk |
|---|---|---|
| **Peta** | OpenStreetMap | Jalan, nama tempat, penggunaan sehari-hari |
| **Satelit** | Esri World Imagery | Melihat rumah, kebun, tambak, garis pantai sebenarnya |
| **Medan** | OpenTopoMap | Kontur, bukit, dan ketinggian |
| **Polos** | CARTO | Latar tenang saat menonjolkan data desa |
| **Luring** | Tertanam di berkas | Tanpa internet sama sekali |

**Batas resolusi citra.** Untuk daerah terpencil seperti Singkep, citra asli
berhenti di zoom tertentu — Esri di **z18**, OpenTopoMap di **z17**. Di atas itu
peta memperbesar ubin terakhir (buram tapi tetap terbaca) dan memberi keterangan
di bilah bawah, alih-alih menampilkan kotak abu-abu *"Map data not yet available"*.

Saklar **Nama tempat** menumpangkan nama desa di atas mode yang tidak punya label
(Satelit dan Luring). Secara otomatis menyala di kedua mode itu dan mati di mode
lain agar nama tidak tercetak dua kali — tapi bisa Anda paksa kapan saja.

### Peta terkunci di wilayah desa

Peta terbuka langsung pada Desa Kote (zoom 15, sekitar 5 km selebar layar) dan
**jelajahnya dibatasi** pada kotak 8 km dari pusat desa. Menggeser keluar akan
ditahan, dan zoom tidak bisa dijauhkan melewati batas itu.

Tujuannya menjaga fokus: ini peta Desa Kote, bukan peta umum yang bisa dipakai
menjelajah ke mana-mana. Bila batas desa sudah digambar, wilayah jelajah otomatis
melebar mengikutinya.

Jangkauannya bisa diubah di **Kelola → Identitas desa → Jangkauan peta** (1–60 km).

### Perkakas GIS

| Perkakas | Cara pakai |
|---|---|
| **Skala grafis** | Di bilah bawah, ikut berubah saat memperbesar peta |
| **Arah mata angin** | Pojok kiri atas peta |
| **Menu klik-kanan** | Klik kanan (atau tekan lama di HP) pada peta: koordinat DMS & desimal, salin koordinat, radius dari sini, ukur dari sini, pusatkan, tambah tempat |
| **Analisis radius** | Menghitung tempat dalam jarak tertentu — mis. jangkauan layanan posyandu. Menampilkan luas, jumlah, dan daftar terurut jarak |
| **Ukur jarak & luas** | Panjang tiap ruas tertulis di titik tengahnya; luas dan keliling di bilah atas |
| **Sorot wilayah desa** | Area di luar batas dibuat kelabu dan pudar, sementara di dalam batas tidak disentuh — jadi desanya yang menonjol, bukan sekelilingnya yang sekadar digelapkan. Bisa dimatikan di panel layer |
| **Kelegapan layer** | Penggeser transparansi tiap layer di panel layer |
| **Tabel atribut** | Semua tempat dalam tabel yang bisa diurutkan per kolom; klik baris untuk melompat ke peta |
| **Ekspor CSV** | Untuk Excel — memakai BOM dan pemisah titik koma agar huruf beraksen tidak rusak |
| **Layar penuh** | Tombol di deretan alat peta, berguna saat presentasi |

Alat lain: cari lokasi saya, pencarian, cetak/PDF, dan mode terang/gelap.

---

### Kategori tempat

15 kategori, dipilih untuk kebutuhan desa pesisir:

| | | |
|---|---|---|
| Pemerintahan | Pendidikan | Kesehatan |
| Rumah ibadah | Ekonomi & UMKM | Kuliner & warung |
| Perikanan | Pertanian & kebun | Wisata |
| Penginapan | Sosial & budaya | Transportasi |
| Air bersih | Infrastruktur | Lainnya |

Warna penanda **sengaja dipisahkan dari palet grafik** (`--pin-*` di `style.css`).
Peta boleh memakai lebih banyak rona karena bentuk ikon ikut membedakan, sementara
palet grafik harus tetap utuh demi keterbacaan bagi penyandang buta warna.

Menambah kategori: tambahkan satu baris di `KATEGORI` (`src/js/00-core.js`) dan satu
warna `--pin-<id>` di `style.css`. Seluruh penyaring, legenda, dan formulir mengikuti
sendiri.

## Identitas visual

Tema mengikuti **logo KKN Kelompok 67 Desa Kote**. Hijau `#263f29` diambil langsung
dari logonya, lalu diturunkan menjadi warna antarmuka yang terukur kontrasnya:

| Peran | Terang | Gelap |
|---|---|---|
| Bilah merek | `#263f29` | `#1c3320` |
| Aksen (tombol, tab aktif, batas desa) | `#2a5a2f` — 7,86:1 | `#5cb767` — 6,99:1 |

Lambang KKN ditanam sebagai **mask alfa** (satu berkas 27 KB), jadi tintanya
mengikuti tema: hijau di atas cakram putih pada bilah atas, dan putih pada kartu
kop Beranda. Tulisan "KKN Kelompok 67" diset sebagai teks, bukan gambar, supaya
tajam di semua ukuran.

Warna grafik statistik **sengaja tidak diubah** — palet itu sudah diuji
keterbacaannya bagi penyandang buta warna, dan mengubahnya demi kecocokan merek
justru akan merusak fungsinya.

**Logo desa** bisa Anda tambahkan sendiri di **Kelola → Identitas desa → Logo desa**.
Gambarnya dikecilkan otomatis ke 256 px agar berkas tetap ringan, lalu tampil di
samping lambang KKN. Nama tim, institusi, dan tahun juga bisa diubah di sana.

> Tidak ada logo resmi Desa Kote di sumber publik, jadi slot ini dibiarkan kosong
> daripada diisi lambang karangan. Bila desa memakai lambang Kabupaten Lingga,
> unggah saja berkasnya.

---

## Berkas pratinjau berisi data karangan

`lokal/contoh-peta-desa-kote.html` dibuat khusus untuk melihat wujud aplikasi dalam
keadaan terisi. **Seluruh angka dan tempat di dalamnya karangan** — bukan data
Desa Kote.

Pengamannya berlapis:

- Berkas **terpisah**; `peta-desa-kote.html` tidak tersentuh dan tetap kosong
- Ada **bilah peringatan** di bagian atas aplikasi yang tidak bisa disembunyikan
- Judul tabnya diawali `[CONTOH]`
- Memakai **penyimpanan browser sendiri** (`…/contoh`), jadi suntingan di sana
  tidak mungkin bocor ke berkas asli
- Tombol **Kosongkan** di bilah itu mengembalikannya ke keadaan kosong

Membatalkannya: **hapus folder `lokal/`.** Tidak ada yang perlu dipulihkan.
Untuk membuatnya lagi: `python buat-contoh.py`

## Cara mengisi data

Peta ini **sengaja dikirim dalam keadaan kosong**. Tidak ada satu angka penduduk pun
yang dikarang — statistik tingkat desa untuk Kote tidak tersedia di sumber publik,
jadi hanya Anda yang bisa mengisinya.

1. Buka `peta-desa-kote.html`.
2. Klik ikon **gembok** di kanan atas untuk menyalakan mode Kelola.
3. Buka tab **Kelola**, isi bagian yang diperlukan.
4. Untuk batas desa: **Wilayah → Gambar batas di peta**, klik mengikuti batas,
   tekan `Enter` bila selesai. Luas dan keliling dihitung sendiri.
5. Untuk fasilitas: **Tempat → Tambah tempat di peta**, klik lokasinya, isi formulir.

Perubahan tersimpan otomatis di browser Anda (`localStorage`).

**Pintasan saat menggambar:** `Enter` selesai · `Esc` batal · `Backspace` mundur satu
titik · seret bulatan untuk menggeser titik · klik bulatan untuk menghapusnya.

### Foto tempat & panel rincian

Klik penanda di peta — atau namanya di daftar Tempat — untuk membuka **panel
rincian**: foto besar, galeri, keterangan lengkap, kontak yang bisa ditelepon,
jam buka, dan koordinat. Klik fotonya untuk melihat **layar penuh** (bisa
digeser dengan panah kiri/kanan, ditutup dengan Esc).

Satu tempat boleh punya **banyak foto**. Foto pertama jadi foto utama.

Saat menambah atau mengubah tempat, tekan **Ambil foto atau pilih dari galeri** — bisa memilih beberapa sekaligus.
Di HP, tombol itu menawarkan kamera maupun galeri. Fotonya dikecilkan otomatis ke
1000 px dan disimpan di dalam data peta — tidak perlu hosting gambar terpisah.

Foto ponsel 4 MB biasanya menyusut jadi sekitar 60–120 KB. Ukuran seluruh data
ditampilkan di **Kelola → Simpan & terbitkan**; penyimpanan browser umumnya
terbatas sekitar 5 MB, jadi pantau angkanya bila memasang banyak foto.

### Batas usulan (semi-otomatis)

Di **Wilayah → Muat batas usulan** tersedia poligon Desa Kote yang sudah ditanam
di dalam berkas, diambil dari basis data **GADM 4.1** (turunan data administratif
Indonesia): **21,36 km²**, **18 titik**.

Gunakan sebagai **rancangan awal**, bukan hasil akhir:

- Hanya 18 titik untuk keliling 20,5 km — rata-rata 1,1 km antar titik, sehingga
  teluk dan tanjung terpotong lurus
- GADM mencatat kecamatannya masih "Singkep", sebelum pemekaran Singkep Pesisir
- **Bukan penetapan resmi.** Batas desa yang sah ditetapkan lewat Perbup/Perdes

Alur yang disarankan: muat usulannya, buka mode **Satelit**, lalu geser titiknya
bersama perangkat desa. Jauh lebih cepat daripada menggambar dari nol.

### Muat banyak tempat sekaligus (CSV)

Daripada mengetik satu per satu, tempat bisa dimuat borongan lewat
**Kelola → Tempat → Muat dari CSV**.

Kolom yang dikenali — hanya tiga pertama yang wajib:

```
Nama ; Kategori ; Alamat ; Kontak ; Jam ; Website ; Keterangan ; Lintang ; Bujur
```

Yang ditangani otomatis: pemisah titik koma maupun koma, tanda kutip, koma di
dalam sel, baris baru di dalam sel, BOM, dan koordinat berkoma desimal
(`104,5098`). Kategori boleh ditulis sebagai id (`perikanan`) atau labelnya
(`Ekonomi & UMKM`); yang tak dikenali jatuh ke *Lainnya*.

Sebelum dimuat, muncul ringkasan: berapa siap, berapa kembar, berapa baris
bermasalah beserta sebabnya, dan sebaran kategorinya. Ada pilihan **lewati yang
sudah ada** (nama sama dalam radius 40 m) dan **ganti seluruh daftar**.

Berkas hasil **Ekspor CSV** bisa langsung dimuat kembali — jadi bisa disunting
di Excel lalu dikembalikan.

#### Mengambil data dari OpenStreetMap

```
python ambil-tempat.py                     # radius 6 km dari pusat Desa Kote
python ambil-tempat.py --radius 25
python ambil-tempat.py --lat -0.49 --lon 104.56 --radius 8 --keluaran dabo.csv
```

Menghasilkan CSV siap muat, lengkap dengan pemetaan tag OSM ke 15 kategori
aplikasi. Objek tanpa nama dilewati, dan yang kembar dibuang.

> **Lisensi:** OpenStreetMap berlisensi ODbL — bebas dipakai dan disebarkan
> selama sumbernya dicantumkan. Aplikasi sudah mencantumkannya di bilah bawah
> peta. Data Google Maps **tidak boleh** dipakai untuk ini.

### Punya berkas dari Bappeda/BPN?

**Kelola → Batas & wilayah** menerima **GeoJSON** dan **KML** (termasuk hasil ekspor
Google Earth) untuk batas desa, dusun, maupun titik fasilitas.

---

## Website profil desa

Proyek ini memuat **dua hal sekaligus** di satu alamat:

| Alamat | Isi |
|---|---|
| `/` | Website profil Desa Kote — beranda, profil, pemerintahan, potensi, layanan, berita, unduhan |
| `/peta` | Peta digital (aplikasi satu berkas yang dijelaskan di atas) |

Seluruh isi website ada di **satu berkas**: `situs/konten.json`. Sunting berkas itu
dengan editor teks apa pun, lalu jalankan:

```
python bangun-situs.py
```

Skrip itu menghasilkan tujuh halaman ke `public/`, menyalin peta ke `public/peta/`,
dan **menyebutkan bagian mana saja yang masih kosong**. Bagian yang kosong tidak
ditampilkan di website — lebih baik tidak ada daripada diisi karangan.

### Halaman unduhan

`public/unduhan/` adalah folder isian bebas: apa pun yang ditaruh di sana muncul
di halaman **Unduhan** lengkap dengan ukuran berkasnya. Ini tempat menaruh **peta
cetak hasil QGIS** (PDF/PNG).

Setiap kali dibangun, skrip juga menuliskan data desa dalam GeoJSON ke folder itu —
`tempat`, `batas`, `peta-dasar`, dan `batas-usulan-gadm`. Berkas-berkas itu bisa
langsung dibuka di QGIS sebagai bahan menyusun peta cetak, sekaligus bisa diunduh
pengunjung. Isinya ikut berubah sendiri setiap kali data desa diperbarui.

Judul berkas bisa dirapikan lewat `situs/konten.json` → `unduhan.keterangan`,
memakai nama berkas sebagai kuncinya.

## Sudah online

**https://peta-desa-kote.vercel.app**
Kode: **https://github.com/Ilhamfendd/peta-desa-kote**

Vercel tersambung ke repo GitHub, jadi **setiap push otomatis diterbitkan**
(sekitar satu menit). Gratis, HTTPS otomatis.

Yang tersaji publik hanya isi folder `public/`. Kode sumber, skrip, dan berkas
contoh berisi data karangan **tidak** ikut — sudah diuji, semuanya 404.

Memperbarui:

```
python terbitkan.py                 # rakit peta + website, commit, push
python terbitkan.py "pesan commit"  # dengan pesan sendiri
```

`terbitkan.py` sudah menjalankan `build.py` dan `bangun-situs.py` lebih dulu, jadi
satu perintah itu cukup.

Kalau datanya diisi lewat mode Kelola di browser: unduh **HTML mandiri**,
timpa `peta-desa-kote.html`, lalu jalankan `python terbitkan.py`.

> Karena sekarang berjalan di HTTPS, tombol **Pakai lokasi saya** (GPS) dan menu
> berbagi bawaan HP ikut berfungsi — keduanya diblokir browser saat berkas dibuka
> langsung lewat `file://`.

Isi alamat itu di **Kelola → Alamat terbit & kode QR** supaya tautan berbagi dan
kode QR menunjuk ke alamat yang benar.

## Cara memasang ke website desa

1. Di tab **Kelola → Simpan & terbitkan**, klik **Unduh HTML mandiri**.
   Berkas yang terunduh sudah berisi peta **dan** data terbaru Anda.
2. Unggah berkas itu ke hosting website desa.
3. Buka langsung lewat tautannya, atau sematkan ke sebuah halaman:

```html
<iframe src="/peta-desa-kote.html" title="Peta Digital Desa Kote"
        style="width:100%;height:640px;border:0;border-radius:12px"
        loading="lazy" allow="geolocation"></iframe>
```

Cocok untuk WordPress, OpenSID, maupun HTML biasa. Bisa juga diunggah gratis ke
GitHub Pages atau Netlify.

### Berbagi & kode QR

Isi **alamat peta di website desa** pada **Kelola → Alamat terbit & kode QR**.
Setelah terisi:

- Tiap tempat punya tombol **Bagikan** — menghasilkan tautan yang langsung membuka
  peta pada tempat itu, misalnya
  `…/peta-desa-kote.html#t=dermaga-nelayan`. Cocok dikirim di grup WhatsApp.
- Tersedia **kode QR** untuk peta maupun untuk satu tempat, bisa diunduh sebagai
  PNG beresolusi tinggi untuk dicetak di banner, papan pengumuman, atau lampiran
  laporan KKN.

Kode QR dibuat di dalam berkas ini sendiri — tanpa layanan luar, jadi tetap
berfungsi meski dibuka tanpa internet.

> **Alur pembaruan:** sunting di browser → **Unduh HTML mandiri** → unggah ulang
> menimpa yang lama. Pengunjung selalu melihat versi terbitan; salinan lokal yang
> lebih lama otomatis dikalahkan oleh versi terbitan yang lebih baru.

Pengunjung website **tidak bisa** mengubah data — mode Kelola hanya memengaruhi
browser orang yang menyalakannya, dan tidak pernah ikut terbit.

Cadangkan berkala lewat **Cadangkan JSON**. **Ekspor GeoJSON** menghasilkan berkas
yang bisa dibuka di QGIS atau ArcGIS.

---

## Kondisi tanpa internet

| Bagian | Tanpa internet |
|---|---|
| Antarmuka, statistik, grafik, daftar tempat | ✅ jalan penuh |
| Batas desa, dusun, penanda, alat ukur | ✅ jalan penuh |
| Mode peta **Luring** | ✅ garis pantai, jalan, perairan tertanam di berkas |
| Mode Peta / Satelit / Medan / Polos | ❌ perlu internet |
| Cuaca | ❌ perlu internet |

Bila ubin gagal dimuat, aplikasi otomatis beralih ke mode **Luring**.

---

## Apa yang masih perlu dikumpulkan

Daftar kerja lengkap ada di **[DATA-YANG-DIBUTUHKAN.md](DATA-YANG-DIBUTUHKAN.md)** —
memilah mana yang sudah terisi, mana yang tinggal diminta ke kantor desa, dan mana
yang harus disurvei sendiri, lengkap dengan daftar periksa fasilitas.

## Data yang sudah terisi

Ditanam lewat `src/data.json`, semuanya dari sumber resmi:

| Data | Nilai | Sumber |
|---|---|---|
| Penduduk | 1.033 jiwa (L 537 · P 496) | Disdukcapil Kab. Lingga, via BPS |
| Luas wilayah | 13,55 km² (12,29% kecamatan) | Setda Kab. Lingga, via BPS |
| RT / RW | 10 / 5 | Setda Kab. Lingga, via BPS |
| Kode pos | 29870 | Wikipedia ID |
| Kode wilayah | 21.04.06.2004 | OSM / Kemendagri |

Sumber utama: **BPS Kabupaten Lingga — [Kecamatan Singkep Pesisir Dalam Angka
2024](https://linggakab.bps.go.id/id/publication/2024/09/26/63a0b930826a98e1426963d2/kecamatan-singkep-pesisir-dalam-angka-2024.html)** (data tahun 2023).

Kepadatan (76 jiwa/km²) dan rasio jenis kelamin (108) dihitung sendiri oleh
aplikasi, dan hasilnya sama persis dengan angka BPS — sekaligus jadi bukti
tabelnya terbaca benar.

**Masih kosong karena tidak ada sumber resmi tingkat desa:** jumlah KK, jumlah
dusun, kelompok umur, pendidikan, mata pencaharian, agama, dan daftar tempat.
BPS mencatat Desa Kote punya 2 masjid dan 2 musala, tetapi **tanpa koordinat** —
jadi tidak ditaruh di peta, karena menebak letaknya sama saja mengarang.

## Sumber data

- **Geometri dasar** — OpenStreetMap ([ODbL](https://www.openstreetmap.org/copyright)):
  47 ruas garis pantai, 198 ruas jalan, 15 badan air, 15 permukiman, 31 pulau,
  sudah disederhanakan dan ditanam ke dalam berkas.
- **Titik pusat desa** — simpul OSM `place=village` "Kote" (`-0,36580, 104,50984`),
  Wikidata `Q12492286`.
- **Cuaca & gelombang** — [Open-Meteo](https://open-meteo.com) (gratis, tanpa kunci API).
  Untuk peringatan dini resmi tetap rujuk [BMKG](https://www.bmkg.go.id).
- **Statistik & fasilitas** — dimasukkan oleh pengelola desa.

> Catatan: OpenStreetMap **belum** memuat poligon batas Desa Kote (hanya satu titik),
> juga hampir tidak memuat bangunan dan fasilitas di wilayah ini. Itulah sebabnya
> batas wilayah dan daftar tempat harus digambar sendiri.

---

## Susunan folder

```
peta-desa-kote/
├── peta-desa-kote.html   ← peta, satu berkas (ikut ke GitHub)
├── src/                  ← sumber peta digital
├── situs/                ← sumber website profil
│   ├── konten.json       ←   seluruh isi website, sunting di sini
│   └── gaya.css
├── public/               ← yang disajikan Vercel
│   ├── *.html            ←   halaman profil (hasil rakitan)
│   ├── peta/index.html   ←   peta digital (hasil salinan)
│   └── unduhan/          ←   berkas unduhan + GeoJSON untuk QGIS
├── *.py                  ← perkakas: build, bangun-situs, terbitkan, ambil-tempat
├── *.md                  ← dokumentasi
└── lokal/                ← berkas kerja, TIDAK PERNAH ikut ke GitHub
```

Berkas di `public/` **tidak disunting langsung** — semuanya hasil rakitan
`build.py` dan `bangun-situs.py`, dan akan tertimpa saat dibangun ulang.
Pengecualiannya `public/unduhan/`, yang memang folder isian.

Folder **`lokal/`** menampung apa pun yang sifatnya hasil olahan atau coba-coba:
berkas pratinjau berisi data karangan, keluaran `ambil-tempat.py`, dan CSV yang
sedang Anda sunting. Seluruh isinya diabaikan git lewat satu baris `lokal/` di
`.gitignore` — jadi berkas baru di situ otomatis aman tanpa perlu diatur lagi.

## Membangun ulang dari sumber

```
python build.py          # src/   -> peta-desa-kote.html
python bangun-situs.py   # situs/ -> public/ (+ salin peta ke public/peta/)
```

```
peta-desa-kote/
├── peta-desa-kote.html      ← hasil akhir, satu berkas
├── build.py                 ← perakit
└── src/
    ├── index.html           ← kerangka + penanda sisipan
    ├── style.css            ← sistem desain (terang/gelap)
    ├── basemap.json         ← geometri OSM tersederhanakan
    ├── logo-kkn-emblem.png  ← mask alfa lambang KKN
    ├── data.json            ← opsional: data awal yang ikut ditanam
    ├── vendor/              ← leaflet.js + leaflet.css
    └── js/
        ├── 00-core.js       ← model data, format angka, geodesi
        ├── 10-map.js        ← peta dasar, layer vektor, penanda
        ├── 20-charts.js     ← grafik SVG tanpa pustaka
        ├── 25-qr.js         ← enkoder kode QR (ditulis sendiri)
        ├── 30-panels.js     ← Beranda, Statistik, Tempat, Wilayah
        ├── 35-gis.js        ← skala, arah, menu konteks, radius, tabel atribut
        ├── 40-weather.js    ← Open-Meteo + skala gelombang BMKG
        ├── 50-edit.js       ← gambar batas, formulir, ukur
        ├── 60-kelola.js     ← impor/ekspor, penerbitan
        └── 99-init.js       ← interaksi, pencarian, tema
```

Berkas JS digabung urut nama. Taruh `src/data.json` bila ingin data awal
ikut tertanam saat membangun.

---

## Catatan teknis

- **Leaflet 1.9.4** ditanam di dalam berkas — tidak ada permintaan ke CDN.
- Grafik digambar sebagai SVG buatan sendiri; tidak ada pustaka chart.
- Warna kategori memakai palet yang sudah diuji keterbacaannya bagi penyandang
  buta warna, dan punya versi tersendiri untuk mode gelap.
- Setiap grafik menyediakan tampilan **Tabel**, jadi tidak ada informasi yang
  hanya tersampaikan lewat warna.
- Masukan pengguna selalu di-escape sebelum ditampilkan; tautan dibatasi pada
  skema `http`, `https`, `mailto`, `tel`, dan `data:image`.
