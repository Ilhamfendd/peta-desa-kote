# Data yang perlu dikumpulkan — Desa Kote

Daftar kerja untuk tim KKN Kelompok 67. Dicek terakhir: **11 Agustus 2026**.

Dua hal sudah jadi dan tinggal diisi: **peta digital** (`/peta`) dan **website
profil desa** (`/`). Dokumen ini memilah mana yang sudah ada, mana yang tinggal
diminta, dan mana yang harus disurvei sendiri.

> **Aturan yang dipegang sejak awal:** tidak ada angka yang boleh dikarang.
> Kolom yang belum ada sumbernya dibiarkan kosong — di peta tampil "Belum diisi",
> di website bagiannya tidak ditampilkan sama sekali. Itu lebih jujur daripada
> diisi perkiraan.

---

## Ringkasan status

| | Jumlah |
|---|---|
| ✅ Sudah terisi dari sumber resmi | 15 kelompok data |
| 📄 Tinggal diminta ke kantor desa | 2 angka + susunan perangkat |
| 🚶 Harus disurvei sendiri | titik tempat + poligon batas |
| ✍️ Perlu ditulis/diputuskan desa | 4 naskah |
| 🌐 Isi website profil | 9 bagian |

Ada dua berkas isian, masing-masing punya cara mengisi sendiri:

| Isi apa | Diisi di mana |
|---|---|
| Statistik, tempat, batas wilayah | Masuk di `/admin`, lalu buka `/peta` → tab **Kelola** |
| Teks halaman website | `situs/konten.json`, lalu `python bangun-situs.py` |

---

## ✅ Sudah terisi — tidak perlu dikerjakan lagi

Sumber utama: **Pemerintah Desa Kote**, formulir *"Permintaan Data Profil Seluruh
Desa se-Kecamatan Singkep Pesisir"* (data 2024), diterima **13 Agustus 2026**.

| Data | Nilai |
|---|---|
| Jumlah penduduk | 1.029 jiwa (2024) |
| Laki-laki / perempuan | 531 / 498 |
| Luas wilayah | 20,79 km² (2.079 ha) |
| Jumlah RT / RW | 10 / 5 |
| Kode wilayah / kode pos | 21.04.06.2004 · 29870 |
| Kepadatan & rasio jenis kelamin | dihitung otomatis (49,5 jiwa/km², 106,6) |
| Kelompok umur | 17 kelompok, laki & perempuan terpisah |
| Pendidikan terakhir | 11 jenjang, Belum sekolah s/d S-3 |
| Mata pencaharian | 18 jenis pekerjaan |
| Agama | Islam 1.017, lainnya nihil |
| Batas wilayah | keempat arah mata angin |
| Fasilitas | masjid 2, musala 2, polindes 1, posyandu 1, pos kamling 4 |
| Kelembagaan | PKK, Karang Taruna, LPM, kader, Linmas, BUMDes, Kopdes |
| Objek wisata | Pulau Serang & perlombaan sampan layar (musiman) |

### ⚠️ Tiga hal yang perlu dikonfirmasi ke kantor desa

Angka-angka di atas disalin **apa adanya** dari formulir desa. Ada tiga
kejanggalan yang sebaiknya ditanyakan — bukan untuk diperbaiki sendiri:

1. **Jumlah totalnya berbeda-beda antar tabel.** Tabel jenis kelamin 2024
   berjumlah **1.029** jiwa; tabel umur, pendidikan, dan agama sama-sama
   berjumlah **1.017**; tabel pekerjaan berjumlah **942**. Selisihnya 12 dan 87
   jiwa. Mana yang jadi pegangan?

2. **Luas wilayah berbeda dengan BPS.** Desa mencatat **2.079 ha (20,79 km²)**,
   BPS mencatat **13,55 km²** — beda hampir 7 km². Yang dipakai di aplikasi
   sekarang adalah angka desa. Menariknya, poligon GADM (21,36 km²) justru
   mendekati angka desa, bukan angka BPS.

3. **Baris kelompok umur "44–45"** menyimpang dari pola lima tahunan, muncul di
   antara 40–44 dan 45–49. Kemungkinan salah ketik di formulir. Disalin apa
   adanya sampai ada kepastian.

---

## 📄 Prioritas 1 — Masih perlu diminta ke kantor desa

Sebagian besar sudah terpenuhi lewat formulir profil desa. Yang **belum**:

Masuk ke: `/peta` → tab **Kelola → Statistik pokok** (harus sudah masuk lewat `/admin`)

- [ ] **Jumlah kepala keluarga (KK)** — satu angka
- [ ] **Jumlah dusun** — satu angka, sekalian nama-namanya

### Sekalian ditanyakan

- [ ] **Nama kepala desa** dan masa jabatannya — formulir hanya mencatat
      jumlahnya (1 kepala desa, 1 sekretaris, 7 perangkat), bukan namanya
- [ ] **Susunan perangkat desa** — nama dan jabatan tiap orang
- [ ] **Alamat kantor desa**, nomor telepon, dan surel resmi
- [ ] **Logo desa** bila ada (berkas gambar) — kalau desa memakai lambang
      Kabupaten Lingga, minta berkasnya
- [ ] **Apakah ada BPD?** — tidak tercantum di formulir, padahal lembaga wajib

---

## 🚶 Prioritas 2 — Survei tempat

Ini bagian **paling bernilai** dan hanya bisa dikerjakan oleh tim di lapangan.
OpenStreetMap hampir tidak memetakan Desa Kote, dan data Google Maps tidak boleh
disalin karena lisensinya. Jadi ini betul-betul kontribusi baru.

Saat ini baru **1 tempat** yang terdata (Dermaga Kote, dari OpenStreetMap).

### Yang perlu dicatat per tempat

Wajib: **nama**, **titik koordinat**, **kategori**
Kalau ada: alamat, nomor telepon/WA, jam buka, foto

### Daftar periksa fasilitas

**Pemerintahan**
- [ ] Kantor Desa Kote
- [ ] Balai desa / aula pertemuan
- [ ] Pos kamling

**Pendidikan**
- [ ] PAUD / TK
- [ ] SD Negeri
- [ ] SMP (bila ada di desa)
- [ ] TPA / madrasah

**Kesehatan**
- [ ] Polindes / Poskesdes
- [ ] Posyandu — semua titiknya, biasanya lebih dari satu
- [ ] Rumah bidan desa
- [ ] Apotek / toko obat

**Rumah ibadah** — BPS mencatat **2 masjid dan 2 musala**, tapi tanpa koordinat
- [ ] Masjid (2)
- [ ] Musala (2)

**Ekonomi & UMKM**
- [ ] Pasar desa
- [ ] Kantor BUMDes
- [ ] Toko / kios besar
- [ ] Usaha rumahan warga (kerupuk ikan, ikan asin, dsb.)

**Kuliner & warung**
- [ ] Warung makan
- [ ] Kedai kopi

**Perikanan** — ini identitas utama desa
- [ ] Dermaga / tambatan perahu nelayan
- [ ] Tempat pelelangan ikan
- [ ] Tambak / keramba

**Pertanian & kebun**
- [ ] Kebun kelapa / karet
- [ ] Lahan pertanian warga

**Wisata**
- [ ] Pantai
- [ ] Pulau Serang *(disebut BPS sebagai objek wisata Desa Kote)*

**Penginapan**
- [ ] Homestay / penginapan warga

**Sosial & budaya**
- [ ] Lapangan olahraga
- [ ] Balai adat / sanggar
- [ ] Pemakaman umum

**Transportasi**
- [ ] Pelabuhan *(BPS: satu-satunya pelabuhan di Kecamatan Singkep Pesisir)*
- [ ] Pangkalan ojek / tambatan perahu penumpang

**Air bersih & infrastruktur**
- [ ] Sumur bor / menara air / PAMSIMAS
- [ ] Tower telekomunikasi
- [ ] Gardu listrik
- [ ] TPS / bank sampah

### Dua cara mengumpulkannya

**A. Survei jalan kaki — paling akurat**
Masuk di `/admin` lewat HP → buka `/peta` → tab **Kelola** →
**Tambah tempat di peta** → tombol
**Pakai lokasi saya** mengambil koordinat GPS → isi nama & kategori → ambil foto
langsung dari kamera. Sekitar 20 tempat bisa selesai dalam satu sore.

**B. Menandai lewat citra satelit — bisa malam hari**
Ganti mode peta ke **Satelit**, kenali bangunannya, klik kanan → **Tambah tempat
di sini**. Cocok untuk tempat yang sudah Anda hafal letaknya.

### Kalau ingin mengisi borongan

Isi berkas CSV di Excel, lalu buka `/peta` → **Kelola → Tempat → Muat dari CSV**. Susunan kolom:

```
Nama;Kategori;Alamat;Kontak;Jam;Website;Keterangan;Lintang;Bujur
Kantor Desa Kote;pemerintahan;Jl. Raya Kote;0812xxxx;Senin–Jumat 08.00–15.00;;;-0.363800;104.506845
```

Wajib hanya **Nama, Lintang, Bujur**. Kategori yang dikenali: `pemerintahan`,
`pendidikan`, `kesehatan`, `ibadah`, `ekonomi`, `kuliner`, `perikanan`,
`pertanian`, `wisata`, `penginapan`, `sosial`, `transportasi`, `air`,
`infrastruktur`, `lainnya`.

---

## 🗺️ Prioritas 3 — Batas wilayah

- [ ] **Batas Desa Kote** — poligon
- [ ] **Batas dusun** — satu poligon per dusun

### Urutan usaha, dari yang terbaik

1. **Minta berkas resmi** ke Bappeda / Dinas PUPR / BPN Kabupaten Lingga.
   Format apa pun boleh: SHP, KML, atau GeoJSON — aplikasi menerima KML dan
   GeoJSON langsung. Ini yang paling sah karena mengikuti penetapan resmi.

2. **Kalau tidak ada**, gunakan **Wilayah → Muat batas usulan**. Poligon dari
   basis data GADM sudah ditanam di aplikasi. Bentuknya masih kasar, tapi
   **luasnya ternyata mendekati**: 21,36 km² berbanding 20,79 km² menurut desa —
   selisih sekitar 3%. Cukup layak sebagai rancangan awal.

   > Penilaian ini berubah setelah data desa masuk. Sebelumnya poligon GADM
   > dibandingkan dengan angka BPS (13,55 km²) dan tampak jauh kebesaran.

3. **Sempurnakan bersama perangkat desa.** Buka mode **Satelit**, geser titik
   batasnya sambil ditunjukkan Pak Kades atau Sekdes. Aplikasi menampilkan luas
   terhitung berdampingan dengan luas resmi, plus peringatan bila melenceng
   lebih dari 15% — jadi ada angka sasaran yang jelas: **20,79 km²**.

> Batas hasil gambar sendiri **bukan penetapan resmi**. Cantumkan itu di laporan.
> Penetapan yang sah dilakukan lewat Perbup/Perdes.

---

## ✍️ Prioritas 4 — Narasi desa

Ditulis atau dikutip dari dokumen desa. Masuk ke **Kelola → Profil & kontak**.

- [ ] **Visi** desa
- [ ] **Misi** desa
- [ ] **Sejarah singkat** — asal usul nama Kote, cerita permukiman pesisirnya
- [ ] **Potensi desa** — sudah ada isian awal dari BPS 2016 (pelabuhan, industri
      mikro, Pulau Serang), tapi **perlu diperiksa apakah masih berlaku**
- [ ] **Website desa** bila ada

---

## 🌐 Prioritas 5 — Isi website profil desa

Sejak website profil dibuat, ada **satu berkas lagi** yang perlu diisi:
`situs/konten.json`. Sunting dengan Notepad, VS Code, atau editor teks apa pun,
lalu jalankan `python bangun-situs.py`.

Skrip itu akan **menyebutkan sendiri bagian mana yang masih kosong** setiap kali
dijalankan — jadi daftar di bawah ini bisa dicek langsung dari layar.

> Bagian yang kosong **tidak ditampilkan** di website. Tidak akan ada tulisan
> "Lorem ipsum" atau nama karangan yang terlanjur ikut terbit.

### Halaman Beranda
- [ ] **Sambutan kepala desa** — judul, isi sambutan, nama, jabatan

### Halaman Profil
- [ ] **Sejarah desa** — asal usul nama Kote *(sama dengan Prioritas 4)*
- [ ] **Visi & misi** *(sama dengan Prioritas 4)*
- [ ] **Batas wilayah** — sebelah utara, timur, selatan, barat

### Halaman Pemerintahan
- [ ] **Perangkat desa** — nama, jabatan, dan foto tiap orang
- [ ] **Lembaga desa** — BPD, LPM, PKK, Karang Taruna, beserta keterangannya

### Halaman Potensi & UMKM
- [ ] **Daftar UMKM warga** — nama usaha, jenis produk, kontak
- [ ] **Periksa ulang isian potensi** — sekarang masih dari BPS 2016

### Halaman Layanan
- [ ] **Jam pelayanan** kantor desa
- [ ] **Daftar surat** yang dilayani — untuk tiap surat: syarat, lama pengurusan,
      biaya. Ini bagian yang paling sering dicari warga.

### Halaman Berita & Kegiatan
- [ ] **Tulisan kegiatan** — judul, tanggal, ringkasan, isi

### Halaman Unduhan
- [ ] **Peta cetak hasil QGIS** — ekspor sebagai PDF atau PNG, lalu taruh
      berkasnya di folder `public/unduhan/`. Otomatis muncul di halaman Unduhan
      lengkap dengan ukuran berkasnya.

Bahan untuk menyusun peta QGIS-nya **sudah tersedia** dan ikut diperbarui sendiri
tiap kali dibangun, di folder yang sama:

| Berkas | Isi |
|---|---|
| `desa-kote-peta-dasar.geojson` | Jalan, garis pantai, perairan, pulau (OSM) |
| `desa-kote-tempat.geojson` | Titik lokasi & fasilitas desa |
| `desa-kote-batas.geojson` | Batas desa & dusun — muncul setelah batasnya digambar |
| `desa-kote-batas-usulan-gadm.geojson` | Rancangan batas GADM, **bukan batas resmi** |

Di QGIS: **Layer → Add Layer → Add Vector Layer**, pilih berkasnya. Sistem
koordinatnya WGS 84 (EPSG:4326).

### Kontak desa
- [ ] **Alamat kantor desa**, telepon, surel — masuk ke `situs.alamat`,
      `situs.telepon`, `situs.email`. Tampil di kaki setiap halaman.
- [ ] **Nama institusi** tim KKN — `situs.institusi`

---

## Setelah data masuk

1. Buka **`/admin`**
2. Tekan **Terbitkan sekarang**
3. Tunggu sekitar satu menit — website dan peta dirakit ulang otomatis

Alamatnya tetap **https://peta-desa-kote.vercel.app** — kode QR dan tautan yang
sudah tersebar tidak akan mati.

Cadangkan berkala dari komputer: `node cadangkan.mjs`.

---

## Catatan penting

**Selalu catat sumber dan tahunnya.** Ada isian khusus di
**Kelola → Statistik pokok → Sumber & tahun data**, dan isinya tampil di tab
Statistik. Data desa tanpa keterangan sumber sulit dipercaya dan sulit
diperbarui orang berikutnya.

**Foto.** Tiap foto sekitar 60–120 KB setelah dikecilkan otomatis, dan disimpan
sebagai berkas tersendiri di server. Tidak ada lagi batas ~5 MB seperti dulu
sewaktu foto ikut disimpan di dalam browser.

**Yang tidak boleh dipakai:** data tempat dari Google Maps. Lisensinya melarang
penyalinan dan penyebaran ulang di luar layanan Google. OpenStreetMap boleh,
asal sumbernya dicantumkan — dan aplikasi sudah mencantumkannya.
