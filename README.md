# Website & Peta Digital Desa Kote

Website profil desa dan peta digital interaktif untuk **Desa Kote, Kecamatan
Singkep Pesisir, Kabupaten Lingga, Kepulauan Riau** (kode wilayah `21.04.06.2004`).

| Alamat | Isinya |
|---|---|
| `/` | Website profil desa |
| `/peta` | Peta digital |
| `/admin` | Halaman pengelolaan — hanya untuk perangkat desa |

Petanya tetap **satu berkas HTML** tanpa kunci API maupun CDN, jadi bisa diunduh
dan dibuka tanpa internet. Data desa disimpan di server supaya bisa disunting
bersama dan dilihat semua pengunjung.

---

## Isi peta

| Bagian | Isinya |
|---|---|
| **Beranda** | Identitas desa, angka pokok, visi, kontak, cuaca ringkas |
| **Statistik** | Penduduk, kepadatan, rasio jenis kelamin, piramida umur, pendidikan, mata pencaharian, agama — tiap grafik punya tampilan **Tabel** |
| **Tempat** | Fasilitas dalam **19 kategori**, lengkap dengan **foto**, penyaring, dan tombol bagikan |
| **Cuaca** | Kondisi terkini, prakiraan 7 hari, arah & kekuatan angin, matahari terbit/terbenam, serta **peringatan gelombang** berskala BMKG |
| **Wilayah** | Batas desa (luas & keliling terhitung otomatis), dusun/RW, koordinat, desa sekitar beserta jaraknya |
| **Kelola** | Formulir pengisian data — hanya muncul bagi pengelola yang sudah masuk |

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

19 kategori, dipilih untuk kebutuhan desa pesisir:

| | | |
|---|---|---|
| Pemerintahan | Pendidikan | Kesehatan |
| Rumah ibadah | Ekonomi & UMKM | Kuliner & warung |
| Perikanan | Pertanian & kebun | Wisata |
| Penginapan | Sosial & budaya | **Olahraga** |
| **Pemakaman** | Transportasi | Air bersih |
| Infrastruktur | **Keamanan** | **Kebencanaan** |
| Lainnya | | |

Empat kategori terakhir ditambahkan setelah survei lapangan pertama: dari 13
tempat, lima terpaksa masuk "Lainnya" karena tidak ada yang cocok — tiga lapangan
dan dua pemakaman.

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

1. Masuk di **`/admin`** dengan akun pengelola.
2. Buka **`/peta`** — tab **Kelola** muncul sendiri karena Anda sudah masuk.
   Tidak ada tombol gembok; hak menyunting datang dari akun, bukan dari saklar.
3. Isi bagian yang diperlukan di tab Kelola.
4. Untuk batas desa: **Wilayah → Gambar batas di peta**, klik mengikuti batas,
   tekan `Enter` bila selesai. Luas dan keliling dihitung sendiri.
5. Untuk fasilitas: **Tempat → Tambah tempat di peta**, klik lokasinya, isi formulir.

Perubahan tersimpan otomatis sebagai **draf di server** — bisa dilanjutkan dari
perangkat lain, dan terlihat oleh sesama pengelola. Yang dilihat warga baru
berubah setelah **Terbitkan** ditekan di `/admin`.

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

Foto ponsel 4 MB biasanya menyusut jadi sekitar 60–120 KB, lalu disimpan sebagai
berkas tersendiri di Vercel Blob. Batas ~5 MB penyimpanan browser yang dulu
membatasi jumlah foto **sudah tidak berlaku**.

### Batas usulan (semi-otomatis)

Di **Wilayah → Muat batas usulan** tersedia poligon Desa Kote yang sudah ditanam
di dalam berkas, diambil dari basis data **GADM 4.1** (turunan data administratif
Indonesia): **21,36 km²**, **18 titik**.

Luasnya **mendekati angka desa** (20,79 km²) — selisih sekitar 3%, jadi cukup
layak sebagai titik berangkat. Tetap **rancangan awal**, bukan hasil akhir:

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

Menghasilkan CSV siap muat, lengkap dengan pemetaan tag OSM ke 19 kategori
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

## Halaman pengelolaan (`/admin`)

Data desa tidak lagi tersimpan di browser masing-masing orang. Perangkat desa
masuk ke **`/admin`** dengan akun sendiri, menyunting, lalu menekan **Terbitkan**.

### Cara kerjanya

```
Pengelola menyunting
   -> tersimpan otomatis sebagai DRAF di Vercel Blob   (seketika, belum dilihat warga)
Tekan "Terbitkan"
   -> draf disalin jadi versi TERBIT
   -> Vercel merakit ulang situs & peta                 (sekitar 1 menit)
   -> warga melihat perubahannya
```

Draf dan versi terbit sengaja dipisah. Akibatnya suntingan setengah jadi tidak
langsung terlihat warga, dan yang terpenting: **situs serta peta tetap statis**.
Peta masih bisa diekspor jadi satu berkas mandiri untuk dipakai luring, persis
seperti sebelumnya.

| Disunting di mana | Isinya |
|---|---|
| `/admin` | Seluruh teks website: sambutan, sejarah, visi–misi, perangkat, lembaga, potensi, UMKM, berita, layanan, kontak |
| `/peta?kelola=1` | Statistik penduduk, titik lokasi, batas wilayah — borang yang sudah ada, kini menyimpan ke draf yang sama |

Peran akun: **admin** (bisa mengatur akun) dan **pengelola** (menyunting dan
menerbitkan). Setiap perubahan tercatat siapa dan kapan, terlihat di Ringkasan.

### Pemasangan (sekali saja)

Perlu akun Vercel yang sudah tersambung ke repo ini.

```bash
npm i -g vercel                              # bila belum ada
vercel link                                  # sambungkan folder ini ke proyek Vercel

vercel blob create-store desa-kote --access private
# BLOB_READ_WRITE_TOKEN otomatis terpasang di proyek
```

> **Harus `private`.** Mode akses itu milik penyimpanannya, bukan per berkas —
> sudah dipastikan dari pesan galat Vercel sendiri: `cache=0 is only available
> for private stores`. Kalau dibuat publik, berkas akun beserta sandi teracaknya
> berada di alamat yang bisa ditebak, sebab nama berkasnya sengaja dibuat tetap.
>
> Foto tetap bisa dilihat pengunjung: disajikan lewat rute `/api/foto`, yang
> hanya melayani berkas di bawah `desa/foto/` — bukan dengan membuka seluruh
> penyimpanan.
>
> Kalau terlanjur terbuat sebagai publik, hapus dan buat ulang:
> `vercel blob delete-store <storeId>`

Lalu tambahkan dua env var lagi di **Vercel → Settings → Environment Variables**:

| Nama | Isi |
|---|---|
| `SESI_RAHASIA` | Teks acak minimal 16 karakter. Buat dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `VERCEL_DEPLOY_HOOK` | Alamat Deploy Hook dari **Settings → Git → Deploy Hooks** (cabang `main`) |

Terakhir, buat admin pertama dari komputer sendiri:

```bash
vercel env pull .env.local
node buat-admin.mjs "Nama Kepala Desa" kades katasandiyangpanjang
```

Akun berikutnya dibuat lewat `/admin` → **Akun pengelola**. Ganti kata sandi
pertama itu segera, karena sandi yang diketik di terminal tercatat di riwayat.

> **Kalau `VERCEL_DEPLOY_HOOK` belum diisi**, tombol Terbitkan tetap menyimpan
> versi terbit tetapi situsnya tidak dirakit ulang — halaman admin mengatakannya
> apa adanya, tidak pura-pura berhasil.

### Cadangan & pindah akun

Tidak perlu membuat akun Vercel baru sekarang. Pakai akun yang sudah ada; nanti
saat desa punya akun sendiri, proyeknya bisa dipindahkan.

```bash
node cadangkan.mjs                        # -> lokal/cadangan-YYYY-MM-DD/
node pulihkan.mjs lokal/cadangan-2026-08-13
```

Cadangan berisi akun pengelola, draf, versi terbit, dan seluruh foto. Taruhnya
di `lokal/` yang tidak ikut ke GitHub — **di dalamnya ada data akun.**

**Dua cara memindahkan ke akun desa:**

1. **Transfer proyek lewat Vercel** — Settings → General → Transfer Project.
   Penyimpanan Blob bisa ikut berpindah, tapi Vercel sendiri melaporkan
   kemungkinan gagal sebagian (`resourceTransferErrors`). Jalankan
   `node cadangkan.mjs` **sebelum** transfer, apa pun yang terjadi.

2. **Pasang ulang dari nol** — lebih panjang, tapi selalu bisa: akun desa
   mengimpor repo GitHub yang sama, membuat penyimpanan Blob sendiri, memasang
   `SESI_RAHASIA` dan `VERCEL_DEPLOY_HOOK`, lalu `node pulihkan.mjs <cadangan>`.
   Akun dan kata sandi lama tetap berlaku.

`pulihkan.mjs` menulis ulang alamat foto, karena penyimpanan yang baru memberi
alamat berbeda — tanpa itu semua foto akan tampil rusak. Bagian ini sudah diuji.

### Kalau server sedang mati

Peta tetap terbuka dan tetap menampilkan data hasil perakitan terakhir. Yang
hilang hanya kemampuan menyunting. Ini disengaja: `sambungServer()` gagal diam,
dan pengunjung biasa tidak pernah menunggu jaringan untuk apa pun.

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

Kalau datanya diisi lewat `/admin` atau tab Kelola di peta, tidak ada langkah
manual sama sekali: tekan **Terbitkan**, dan Vercel merakit ulang sendiri.
`terbitkan.py` hanya diperlukan bila yang berubah adalah **kodenya**.

> Karena berjalan di HTTPS, tombol **Pakai lokasi saya** (GPS) dan menu berbagi
> bawaan HP ikut berfungsi — keduanya diblokir browser saat berkas dibuka
> langsung lewat `file://`.

## Memasang di website desa yang sudah ada

Website ini **sudah menjadi** website desa, jadi biasanya tidak perlu disematkan
ke mana-mana. Kalau desa tetap memakai situs lain (OpenSID, WordPress), cukup
tautkan saja:

```html
<a href="https://peta-desa-kote.vercel.app/peta">Peta Digital Desa Kote</a>
```

Menyematkan lewat `<iframe>` juga bisa, tetapi tautan biasa lebih ramah di HP dan
tidak memotong tinggi peta.

## Berbagi & kode QR

Alamat peta sudah tetap — `https://peta-desa-kote.vercel.app/peta` — jadi tidak
ada yang perlu diisi lagi.

- Tiap tempat punya tombol **Bagikan**: menghasilkan tautan yang langsung membuka
  peta pada tempat itu, misalnya `…/peta#t=dermaga-nelayan`. Cocok dikirim di grup
  WhatsApp.
- Tersedia **kode QR** untuk peta maupun untuk satu tempat, bisa diunduh sebagai
  PNG beresolusi tinggi untuk dicetak di banner, papan pengumuman, atau lampiran
  laporan KKN.

Kode QR dibuat di dalam berkas ini sendiri — tanpa layanan luar, jadi tetap
berfungsi meski dibuka tanpa internet.

**Pengunjung tidak bisa mengubah apa pun.** Tab Kelola hanya muncul bagi pengelola
yang sudah masuk, dan setiap penyimpanan diperiksa lagi di sisi server — bukan
sekadar disembunyikan di tampilan.

Cadangan seluruh data dibuat dari komputer dengan `node cadangkan.mjs`. Berkas
GeoJSON untuk QGIS tersedia di halaman **Unduhan**, ikut diperbarui setiap kali
data desa berubah.

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
| Penduduk | 1.029 jiwa (L 531 · P 498), 2024 | Pemerintah Desa Kote |
| Luas wilayah | 20,79 km² (2.079 ha) | Pemerintah Desa Kote |
| Kelompok umur | 17 kelompok, L/P terpisah | Pemerintah Desa Kote |
| Pendidikan | 11 jenjang | Pemerintah Desa Kote |
| Mata pencaharian | 18 jenis | Pemerintah Desa Kote |
| Agama | Islam 1.017 | Pemerintah Desa Kote |
| Batas wilayah | keempat arah | Pemerintah Desa Kote |
| RT / RW | 10 / 5 | Setda Kab. Lingga, via BPS |
| Kode pos | 29870 | Wikipedia ID |
| Kode wilayah | 21.04.06.2004 | OSM / Kemendagri |

Sumber utama: **Pemerintah Desa Kote**, formulir *"Permintaan Data Profil Seluruh
Desa se-Kecamatan Singkep Pesisir"* (data 2024), diterima 13 Agustus 2026.
Sebelumnya dipakai [BPS Kecamatan Singkep Pesisir Dalam Angka
2024](https://linggakab.bps.go.id/id/publication/2024/09/26/63a0b930826a98e1426963d2/kecamatan-singkep-pesisir-dalam-angka-2024.html)
(data 2023), yang kini tinggal jadi pembanding.

Kepadatan (49,5 jiwa/km²) dan rasio jenis kelamin (106,6) dihitung sendiri oleh
aplikasi dari angka di atas.

**Tiga kejanggalan dalam formulir desa** — angkanya disalin apa adanya, belum
disesuaikan, dan sudah dicatat di `src/data.json` bagian `_sumber`:

1. Total tiap tabel berbeda: jenis kelamin **1.029**, umur/pendidikan/agama
   **1.017**, pekerjaan **942**.
2. Luas wilayah menurut desa **20,79 km²**, menurut BPS **13,55 km²**.
   Poligon GADM (21,36 km²) justru mendekati angka desa.
3. Baris kelompok umur **"44–45"** menyimpang dari pola lima tahunan.

**Masih kosong:** jumlah KK, jumlah dusun, nama perangkat desa, dan daftar
tempat berkoordinat. Formulir desa mencatat 2 masjid dan 2 musala, tetapi
**tanpa koordinat** — jadi tidak ditaruh di peta, karena menebak letaknya sama
saja mengarang.

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
