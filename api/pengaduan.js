// POST   /api/pengaduan              kirim pengaduan          (terbuka untuk warga)
// GET    /api/pengaduan?tiket=...    lihat status satu tiket  (terbuka)
// GET    /api/pengaduan              daftar seluruh pengaduan (perlu masuk)
// PATCH  /api/pengaduan              ubah status & tanggapan  (perlu masuk)
//
// Susunan kolomnya mengikuti SP4N-LAPOR!, sistem pengaduan resmi nasional:
// judul, isi/kronologi, tanggal kejadian, lokasi, kategori — ditambah nomor
// tiket supaya warga bisa menengok tindak lanjutnya tanpa perlu punya akun.
//
// PELINDUNGAN DATA (UU 27/2022): pengaduan memuat data pribadi. Karena itu
//   · nama dan kontak BOLEH dikosongkan — pengaduan anonim tetap diterima
//   · isinya disimpan privat, hanya terbaca pengelola yang sudah masuk
//   · rute publik hanya mengembalikan STATUS, tidak pernah isi laporan
//   · warga harus mencentang persetujuan sebelum mengirim

import crypto from 'node:crypto';
import { wajibMasuk } from './_lib/sesi.js';
import { bacaJSON, tulisJSON } from './_lib/simpan.js';

const BERKAS = 'desa/pengaduan.json';

const BATAS = { judul: 150, isi: 4000, lokasi: 200, nama: 100, kontak: 100 };
const KATEGORI = new Set([
  'infrastruktur', 'pelayanan', 'kebersihan', 'keamanan',
  'bantuan-sosial', 'kesehatan', 'pendidikan', 'lainnya',
]);
const STATUS = new Set(['baru', 'diproses', 'selesai', 'ditolak']);

const JEDA_MENIT = 3;        // satu pengirim, satu pengaduan per 3 menit
const MAKS_PER_JAM = 20;     // rem kasar terhadap banjir kiriman

const bersih = (v, maks) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, maks);

/** Sidik pengirim untuk penahan laju — dicincang, alamat IP-nya tidak disimpan. */
function sidik(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'tak-dikenal';
  return crypto.createHash('sha256').update(ip + '|kote').digest('hex').slice(0, 16);
}

function nomorTiket() {
  const t = new Date();
  const bln = String(t.getMonth() + 1).padStart(2, '0');
  const acak = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `KOTE-${String(t.getFullYear()).slice(2)}${bln}-${acak}`;
}

/** Yang boleh dilihat umum: hanya perjalanan tiketnya, bukan isinya. */
const ringkasPublik = (p) => ({
  tiket: p.tiket,
  status: p.status,
  kategori: p.kategori,
  dikirim: p.dikirim,
  ditanggapi: p.ditanggapi || null,
  tanggapan: p.tanggapan || '',
});

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const semua = (await bacaJSON(BERKAS)) || { daftar: [], laju: {} };

    // ── Warga menengok status tiketnya ──
    if (req.method === 'GET' && req.query?.tiket) {
      const tiket = bersih(req.query.tiket, 40).toUpperCase();
      const p = semua.daftar.find((x) => x.tiket === tiket);
      if (!p) return res.status(404).json({ galat: 'Nomor tiket tidak ditemukan.' });
      return res.status(200).json({ pengaduan: ringkasPublik(p) });
    }

    // ── Pengelola membaca semuanya ──
    if (req.method === 'GET') {
      const sesi = wajibMasuk(req, res);
      if (!sesi) return;
      return res.status(200).json({
        daftar: [...semua.daftar].sort((a, b) => b.dikirim.localeCompare(a.dikirim)),
      });
    }

    // ── Warga mengirim pengaduan ──
    if (req.method === 'POST') {
      const b = req.body || {};

      // Perangkap lalat: kolom tersembunyi yang hanya diisi robot pengirim spam.
      if (bersih(b.alamatSurat, 50)) return res.status(200).json({ tiket: nomorTiket() });

      if (b.setuju !== true) {
        return res.status(400).json({ galat: 'Centang dulu persetujuan penggunaan data.' });
      }

      const judul = bersih(b.judul, BATAS.judul);
      const isi = String(b.isi ?? '').trim().slice(0, BATAS.isi);
      if (judul.length < 5) return res.status(400).json({ galat: 'Judul terlalu pendek — tulis inti masalahnya.' });
      if (isi.length < 20) return res.status(400).json({ galat: 'Ceritakan kejadiannya lebih lengkap, minimal 20 huruf.' });

      const kategori = KATEGORI.has(b.kategori) ? b.kategori : 'lainnya';
      const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(String(b.tanggal || '')) ? b.tanggal : '';

      // Penahan laju — memakai sidik tercincang, bukan alamat IP.
      const s = sidik(req);
      const sekarang = Date.now();
      const laju = semua.laju || {};
      Object.keys(laju).forEach((k) => { if (sekarang - laju[k] > 3600e3) delete laju[k]; });
      if (laju[s] && sekarang - laju[s] < JEDA_MENIT * 60e3) {
        return res.status(429).json({
          galat: `Mohon tunggu ${JEDA_MENIT} menit sebelum mengirim pengaduan berikutnya.`,
        });
      }
      if (Object.keys(laju).length > MAKS_PER_JAM * 5) {
        return res.status(429).json({ galat: 'Sedang banyak kiriman. Coba lagi beberapa saat lagi.' });
      }

      const p = {
        tiket: nomorTiket(),
        judul, isi, kategori, tanggal,
        lokasi: bersih(b.lokasi, BATAS.lokasi),
        nama: bersih(b.nama, BATAS.nama),          // boleh kosong — pengaduan anonim
        kontak: bersih(b.kontak, BATAS.kontak),
        status: 'baru',
        dikirim: new Date().toISOString(),
        ditanggapi: null,
        tanggapan: '',
      };

      laju[s] = sekarang;
      semua.daftar.push(p);
      semua.laju = laju;
      await tulisJSON(BERKAS, semua, { publik: false });

      return res.status(201).json({
        tiket: p.tiket,
        pesan: 'Pengaduan terkirim. Simpan nomor tiketnya untuk menengok tindak lanjut.',
      });
    }

    // ── Pengelola menanggapi ──
    if (req.method === 'PATCH') {
      const sesi = wajibMasuk(req, res);
      if (!sesi) return;

      const tiket = bersih(req.body?.tiket, 40).toUpperCase();
      const p = semua.daftar.find((x) => x.tiket === tiket);
      if (!p) return res.status(404).json({ galat: 'Nomor tiket tidak ditemukan.' });

      if (req.body?.status !== undefined) {
        if (!STATUS.has(req.body.status)) return res.status(400).json({ galat: 'Status tidak dikenali.' });
        p.status = req.body.status;
      }
      if (req.body?.tanggapan !== undefined) p.tanggapan = String(req.body.tanggapan).trim().slice(0, BATAS.isi);

      p.ditanggapi = new Date().toISOString();
      p.olehPengelola = sesi.nama;
      await tulisJSON(BERKAS, semua, { publik: false });
      return res.status(200).json({ pengaduan: p });
    }

    return res.status(405).json({ galat: 'Metode tidak didukung' });
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }
}
