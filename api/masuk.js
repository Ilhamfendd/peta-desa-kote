// POST /api/masuk  { pengguna, sandi }
import {
  daftarPengguna, simpanPengguna, sandiCocok, buatKue, tanpaSandi,
} from './_lib/sesi.js';

const MAKS_GAGAL = 5;
const LAMA_KUNCI = 15 * 60 * 1000;   // 15 menit

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ galat: 'Metode tidak didukung' });

  const { pengguna, sandi } = req.body || {};
  if (!pengguna || !sandi) {
    return res.status(400).json({ galat: 'Nama pengguna dan kata sandi harus diisi.' });
  }

  let daftar;
  try {
    daftar = await daftarPengguna();
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }

  if (!daftar.length) {
    return res.status(503).json({
      galat: 'Belum ada pengguna sama sekali. Jalankan "node buat-admin.mjs" sekali untuk membuat admin pertama.',
    });
  }

  const orang = daftar.find((p) => p.pengguna.toLowerCase() === String(pengguna).toLowerCase().trim());

  // Jawaban dibuat sama persis untuk "pengguna tidak ada" dan "sandi salah",
  // supaya tidak bisa dipakai menebak siapa saja yang punya akun.
  const tolak = () => res.status(401).json({ galat: 'Nama pengguna atau kata sandi salah.' });

  if (!orang) {
    // Tetap jalankan kerja seberat pemeriksaan sandi, agar lamanya jawaban
    // tidak membocorkan ada tidaknya akun tersebut.
    sandiCocok(String(sandi), 'a'.repeat(32), 'b'.repeat(128));
    return tolak();
  }

  if (orang.terkunciSampai && orang.terkunciSampai > Date.now()) {
    const menit = Math.ceil((orang.terkunciSampai - Date.now()) / 60000);
    return res.status(429).json({
      galat: `Terlalu banyak percobaan gagal. Coba lagi ${menit} menit lagi.`,
    });
  }

  if (!sandiCocok(String(sandi), orang.garam, orang.kunci)) {
    orang.gagal = (orang.gagal || 0) + 1;
    if (orang.gagal >= MAKS_GAGAL) {
      orang.terkunciSampai = Date.now() + LAMA_KUNCI;
      orang.gagal = 0;
    }
    await simpanPengguna(daftar);
    return tolak();
  }

  orang.gagal = 0;
  orang.terkunciSampai = null;
  orang.terakhirMasuk = new Date().toISOString();
  await simpanPengguna(daftar);

  res.setHeader('Set-Cookie', buatKue(orang));
  return res.status(200).json({ pengguna: tanpaSandi(orang) });
}
