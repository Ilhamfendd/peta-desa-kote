// POST /api/terbitkan — jadikan draf sebagai versi yang dilihat warga.
//
// Dua langkah: salin draf ke berkas terbit, lalu picu Vercel merakit ulang.
// Perakitan itu yang membuat halaman statis dan berkas peta mandiri ikut
// diperbarui — jadi perubahannya muncul sekitar satu menit kemudian.

import { wajibMasuk } from './_lib/sesi.js';
import { bacaJSON, tulisJSON, BERKAS_DRAF, BERKAS_TERBIT } from './_lib/simpan.js';

export default async function handler(req, res) {
  const sesi = wajibMasuk(req, res);
  if (!sesi) return;
  if (req.method !== 'POST') return res.status(405).json({ galat: 'Metode tidak didukung' });

  try {
    const draf = await bacaJSON(BERKAS_DRAF);
    if (!draf) {
      return res.status(400).json({ galat: 'Belum ada draf yang bisa diterbitkan.' });
    }

    const terbit = {
      data: draf.data,
      konten: draf.konten,
      meta: {
        diterbitkan: new Date().toISOString(),
        oleh: sesi.nama,
        diubahTerakhir: draf.meta?.diubah || null,
      },
    };
    // Tetap privat. Perakit (build.py / bangun-situs.py) mengambilnya lewat
    // /api/terbit, jadi tidak perlu ada berkas terbuka di alamat yang mudah
    // ditebak — sekaligus menutup kemungkinan data desa terindeks mesin pencari
    // dalam bentuk mentah.
    await tulisJSON(BERKAS_TERBIT, terbit, { publik: false });

    const kait = process.env.VERCEL_DEPLOY_HOOK;
    if (!kait) {
      return res.status(200).json({
        diterbitkan: true, dirakit: false,
        pesan: 'Data tersimpan sebagai versi terbit, tetapi VERCEL_DEPLOY_HOOK belum diatur '
             + 'sehingga situs belum dirakit ulang. Perubahan baru tampak setelah penerbitan berikutnya.',
      });
    }

    const r = await fetch(kait, { method: 'POST' });
    if (!r.ok) {
      return res.status(502).json({
        galat: `Data sudah tersimpan, tetapi permintaan rakit ulang ditolak (${r.status}). `
             + 'Periksa VERCEL_DEPLOY_HOOK.',
      });
    }

    return res.status(200).json({
      diterbitkan: true, dirakit: true, meta: terbit.meta,
      pesan: 'Diterbitkan. Situs sedang dirakit ulang — perubahan tampak sekitar satu menit lagi.',
    });
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }
}
