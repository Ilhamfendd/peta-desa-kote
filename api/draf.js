// GET  /api/draf  — ambil salinan kerja
// PUT  /api/draf  — simpan salinan kerja  { data?, konten?, ringkasan? }
//
// Draf adalah yang sedang disunting bersama: tersimpan seketika, terlihat oleh
// semua pengelola, tapi BELUM tampil ke warga. Yang tampil ke warga baru berubah
// setelah tombol Terbitkan ditekan (lihat api/terbitkan.js).

import fs from 'node:fs/promises';
import path from 'node:path';
import { wajibMasuk } from './_lib/sesi.js';
import { bacaJSON, tulisJSON, BERKAS_DRAF } from './_lib/simpan.js';

const BATAS_RIWAYAT = 50;

// Saat pertama kali dipakai, draf belum ada. Isinya diambil dari berkas yang
// ikut terkirim bersama proyek, supaya pengelola tidak mulai dari layar kosong.
async function bawaan() {
  const ambil = async (relatif) => {
    try {
      return JSON.parse(await fs.readFile(path.join(process.cwd(), relatif), 'utf8'));
    } catch {
      return null;
    }
  };
  return {
    data: await ambil('src/data.json'),
    konten: await ambil('situs/konten.json'),
    meta: { diubah: null, oleh: null, belumPernahDisimpan: true },
    riwayat: [],
  };
}

export default async function handler(req, res) {
  const sesi = wajibMasuk(req, res);
  if (!sesi) return;

  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const draf = (await bacaJSON(BERKAS_DRAF)) || (await bawaan());
      return res.status(200).json(draf);
    }

    if (req.method === 'PUT') {
      const { data, konten, ringkasan } = req.body || {};
      if (data === undefined && konten === undefined) {
        return res.status(400).json({ galat: 'Tidak ada yang dikirim untuk disimpan.' });
      }

      const lama = (await bacaJSON(BERKAS_DRAF)) || (await bawaan());
      const baru = {
        data: data === undefined ? lama.data : data,
        konten: konten === undefined ? lama.konten : konten,
        meta: { diubah: new Date().toISOString(), oleh: sesi.nama },
        riwayat: [
          { waktu: new Date().toISOString(), oleh: sesi.nama, ringkasan: ringkasan || 'Menyunting data' },
          ...(lama.riwayat || []),
        ].slice(0, BATAS_RIWAYAT),
      };

      await tulisJSON(BERKAS_DRAF, baru, { publik: false });
      return res.status(200).json({ meta: baru.meta, riwayat: baru.riwayat });
    }

    return res.status(405).json({ galat: 'Metode tidak didukung' });
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }
}
