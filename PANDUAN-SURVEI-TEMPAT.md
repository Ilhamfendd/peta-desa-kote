# Panduan mendata tempat — Desa Kote

Untuk anggota KKN Kelompok 67 yang turun ke lapangan.
Tidak perlu tahu apa-apa soal komputer. Cukup HP yang ada internet dan GPS.

---

## Sebelum berangkat

**1. Minta akun.** Setiap orang yang mendata perlu akun sendiri, supaya terlihat
siapa memasukkan apa. Minta ke Ilham — dia membuatkannya lewat `/admin` →
**Akun pengelola** → **Tambah pengelola**. Catat nama pengguna dan kata sandinya.

**2. Nyalakan GPS 5 menit sebelum mulai**, dan berdirilah di ruang terbuka
sebentar. GPS HP perlu waktu mengunci satelit. Kalau langsung dipakai dari dalam
ruangan, titiknya bisa meleset puluhan meter dan harus diulang.

**3. Bawa daftar** `formulir-survei-tempat.csv` (bisa dibuka di HP, atau dicetak).
Isinya 23 tempat — coret yang sudah didata supaya tidak ada yang terlewat.

---

## Cara masuk

1. Buka **peta-desa-kote.vercel.app/admin** di browser HP
2. Masukkan nama pengguna dan kata sandi Anda
3. Setelah masuk, buka **peta-desa-kote.vercel.app/peta**

Kalau berhasil, di kanan atas peta muncul tulisan **nama Anda · tersambung**,
dan di deretan tab bawah muncul tab **Kelola**. Kalau tab Kelola tidak muncul,
berarti belum masuk — ulangi dari langkah 1.

> Cukup masuk sekali. Selama tidak menekan Keluar, sesinya bertahan 12 jam.

---

## Mendata satu tempat

**Berdirilah di depan tempatnya**, lalu:

1. Buka tab **Tempat** di bawah
2. Tekan **Tambah tempat di peta**
3. Tekan **Pakai lokasi saya** — koordinat terisi sendiri dari GPS
4. Isi **Nama** — tulis nama resminya, bukan singkatan
5. Pilih **Kategori** — lihat daftar di formulir, sudah ditentukan untuk tiap tempat
6. Isi yang Anda tahu saja: alamat/patokan, nomor HP pengurus, jam buka, keterangan
7. Tekan **Ambil foto atau pilih dari galeri** → foto langsung dari kamera
8. **Simpan**

Sekitar satu menit per tempat. Tersimpan otomatis ke server — tidak perlu menekan
apa pun lagi, dan tidak hilang kalau HP mati.

### Kalau GPS meleset

Setelah menekan Pakai lokasi saya, lihat titiknya di peta. Kalau jelas melenceng
(misalnya jatuh di laut atau di rumah orang), **geser titiknya langsung di peta**
sampai pas. Ganti dulu tampilan peta ke **Satelit** lewat kotak kecil di kiri
bawah — jauh lebih mudah mengenali bangunannya.

---

## Foto

**1–3 foto per tempat.** Yang paling berguna:

| Urutan | Isi foto |
|---|---|
| 1 | Tampak depan bangunan, agak menyamping supaya terlihat utuh |
| 2 | Papan nama, kalau ada — ini yang paling membantu orang mengenali |
| 3 | Suasana sekitar atau kegiatan yang sedang berlangsung |

Ambil dari luar, siang hari, jangan melawan matahari. Foto dikecilkan otomatis
jadi sekitar 100 KB, jadi tidak boros kuota.

**Jangan memotret orang tanpa izin**, terutama anak-anak di PAUD dan sekolah.
Minta izin ke pengurus atau guru dulu.

---

## Aturan yang tidak boleh dilanggar

**Jangan mengarang apa pun.** Kolom yang tidak Anda ketahui, biarkan kosong.
Kosong itu jujur dan bisa dilengkapi orang berikutnya; isian karangan merusak
seluruh data dan sulit ketahuan.

Ini berlaku untuk nomor telepon, jam buka, nama resmi — semuanya. Kalau ragu,
tanyakan ke pengurus tempatnya, atau kosongkan dan beri catatan.

**Pilih kategori yang paling tepat, jangan asal "Lainnya".** Sekarang ada 19
kategori — termasuk **Olahraga** (lapangan), **Pemakaman** (TPU), **Keamanan**
(pos kamling), dan **Kebencanaan** (titik kumpul, jalur evakuasi). Kategori yang
tepat membuat penyaring dan legenda peta berguna; kalau semua masuk "Lainnya",
peta jadi sulit dibaca.

**Jangan menyalin dari Google Maps.** Lisensinya melarang. Koordinat dari GPS HP
Anda sendiri tidak masalah — itu pengukuran Anda sendiri.

---

## Daftar 23 tempat

Sembilan di antaranya bertanda **PERIKSA** di kolom Keterangan — artinya ada yang
perlu dipastikan di lapangan, biasanya nama resminya. Perbaiki langsung di isian
Nama, lalu hapus tanda PERIKSA-nya.

**Dusun 1** — Masjid Dusun 1 · Surau Dusun 1 · TPU Cik Mat Dusun 1
**Dusun 2** — Musala Dusun 2 · TPU Dusun 2
**Dusun 3** — Masjid Dusun 3

**Pemerintahan** — Kantor Desa Kote · Balai Desa · Kantor BPD · Pos Masuk Kote
**Pendidikan** — SD 03 Singkep · PAUD · PAUD (kedua) · Pesantren
**Kesehatan** — Polindes
**Ekonomi & perikanan** — Pelabuhan · BBI · PT Ketam · Kopdes Merah Putih Kote
**Olahraga & budaya** — Lapangan Bola · Lapangan Voli Kejora · Lapangan Voli Gelamit · Sanggar

> **Ada dua PAUD** di daftar yang diberikan. Kalau ternyata hanya ada satu,
> hapus salah satunya. Kalau memang dua, beri nama yang membedakan.

> **Cocok dengan data kantor desa:** desa mencatat 2 masjid dan 2 musala.
> Daftar ini memuat Masjid Dusun 1, Masjid Dusun 3, Musala Dusun 2, dan Surau
> Dusun 1 — pas. Kalau di lapangan ternyata ada yang kelima, catat, karena berarti
> data kantor desa perlu diperbarui.

---

## Soal berkas CSV

`formulir-survei-tempat.csv` itu **daftar periksa**, bukan tempat mengisi data.
Kalau diimpor apa adanya, aplikasi akan menolak semuanya dengan alasan
"koordinat tidak terbaca" — itu wajar, bukan kerusakan.

Isi datanya lewat aplikasi seperti di atas. CSV hanya dipakai kalau Anda sudah
punya koordinatnya lebih dulu, misalnya menandai dari citra satelit sambil duduk.
Kalau begitu: isi kolom **Lintang** dan **Bujur**, lalu `/peta` → **Kelola** →
**Tempat & fasilitas** → **Muat dari CSV**.

Titik maupun koma desimal sama-sama diterima (`-0.363800` atau `-0,363800`),
jadi tidak perlu mengubah pengaturan Excel.

---

## Menggambar batas dusun

Peta dinding di kantor desa memuat pembagian dusun. Isinya cocok dengan data
kantor desa — **2 + 1 + 2 = 5 RW** dan **4 + 2 + 4 = 10 RT**, persis angka resmi.

| Dusun | Isinya | Letak di peta dinding |
|---|---|---|
| **Dusun I** | 2 RW · 4 RT | sisi timur, ke arah Dabo |
| **Dusun II** | 1 RW · 2 RT | bagian tengah |
| **Dusun III** | 2 RW · 4 RT | sisi barat, ke arah Jagoh |

**Foto peta dinding tidak bisa langsung dijadikan batas di aplikasi.** Peta itu
sketsa: tidak ada koordinat, tidak berskala, dan sengaja digambar agar muat di
kertas. Kalau dijiplak begitu saja, yang tersimpan adalah garis karangan yang
tampak resmi — lebih berbahaya daripada dibiarkan kosong.

Cara menggambarnya yang benar, sekitar 10 menit per dusun:

1. Masuk di `/admin`, lalu buka `/peta`
2. Ganti tampilan peta ke **Satelit** lewat kotak kecil di kiri bawah
3. Buka tab **Wilayah** → **Gambar batas dusun**
4. Klik mengikuti batasnya, tekan `Enter` bila selesai
5. Isi namanya: **Dusun I**, **Dusun II**, atau **Dusun III**

**Lakukan bersama perangkat desa atau kepala dusun.** Bawa foto peta dinding
sebagai acuan, tapi yang menentukan garisnya adalah orang yang tahu batas
sebenarnya di lapangan. Di peta dinding, batas dusun tampak mengikuti
patokan alam — Sungai Bacok di barat, Sungai Perkis di timur, serta punggung
Bukit Panjang, Bukit Buang, Bukit Gelamid, dan Bukit Bendera.

> **Batas desa yang sekarang tampil juga masih rancangan.** Isinya poligon GADM
> bawaan aplikasi (`sumber: GADM 4.1 — perlu diperiksa`), belum pernah
> disesuaikan. Perlu digeser mengikuti batas sebenarnya, dengan sasaran luas
> **20,79 km²**.

---

## Sesudah selesai

Data sudah tersimpan begitu ditekan Simpan, tapi **belum dilihat warga**.

Supaya tampil di website: buka **/admin** → **Ringkasan** → **Terbitkan sekarang**.
Tunggu sekitar satu menit. Cukup ditekan sekali di akhir, bukan tiap tempat.

Periksa hasilnya di **peta-desa-kote.vercel.app/peta** — semua titik harus muncul.

---

## Kalau tersendat

| Gejala | Penyebab biasanya |
|---|---|
| Tab **Kelola** tidak muncul | Belum masuk, atau sesi 12 jam sudah habis — masuk lagi di `/admin` |
| **Pakai lokasi saya** tidak jalan | Izin lokasi ditolak. Buka pengaturan browser → izinkan Lokasi |
| Titik GPS jauh melenceng | GPS belum terkunci. Tunggu di ruang terbuka, atau geser titiknya manual di mode Satelit |
| Muncul "Titik ini … hampir pasti salah" | Ditolak karena lebih dari 25 km dari desa — GPS belum mengunci, atau koordinat salah ketik. Tekan **Pakai lokasi saya** lagi |
| Muncul "Tersimpan, tapi letaknya … dari pusat desa" | Tetap tersimpan, hanya diingatkan. Kalau memang benar (misalnya di ujung desa), abaikan saja |
| Ketelitian tertulis ratusan meter | Browser memakai perkiraan jaringan, bukan satelit. Keluar ke ruang terbuka, tunggu, lalu ulangi |
| Foto gagal diunggah | Sinyal lemah. Simpan dulu tempatnya tanpa foto, fotonya ditambahkan belakangan |
| Muncul "Gagal menyimpan ke server" | Internet putus. Jangan tutup halamannya — tunggu sinyal, lalu ubah apa saja sedikit agar tersimpan ulang |

Kalau ada yang aneh, catat nama tempat dan apa yang terjadi, jangan dipaksa.
Lebih baik satu tempat tertunda daripada datanya masuk salah.
