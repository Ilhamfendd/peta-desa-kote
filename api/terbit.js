// GET /api/terbit — versi yang sudah diterbitkan, terbuka untuk umum.
//
// Dipakai oleh build.py dan bangun-situs.py saat Vercel merakit ulang: perakit
// mengambil data terbaru dari sini, bukan dari berkas di repo. Tidak memuat draf,
// jadi suntingan yang belum diterbitkan tidak pernah bocor lewat alamat ini.

import { bacaJSON, BERKAS_TERBIT } from './_lib/simpan.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ galat: 'Metode tidak didukung' });

  try {
    const terbit = await bacaJSON(BERKAS_TERBIT, { publik: false });
    res.setHeader('Cache-Control', 'no-store');
    if (!terbit) {
      // Belum pernah diterbitkan — perakit akan memakai berkas bawaan di repo.
      return res.status(404).json({ galat: 'Belum ada data terbit.' });
    }
    return res.status(200).json(terbit);
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }
}
