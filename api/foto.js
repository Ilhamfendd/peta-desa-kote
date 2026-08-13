// POST   /api/foto   { dataUrl, nama? }   simpan foto, balas alamatnya
// DELETE /api/foto?url=...                hapus foto
//
// Sebelumnya foto disimpan sebagai teks base64 di dalam data desa, sehingga
// penyimpanan browser yang cuma ~5 MB cepat penuh. Sekarang fotonya jadi berkas
// sungguhan di Blob, dan data desa hanya menyimpan alamatnya.

import crypto from 'node:crypto';
import { wajibMasuk } from './_lib/sesi.js';
import { tulisBerkas, hapusBerkas } from './_lib/simpan.js';

const BATAS = 4 * 1024 * 1024;    // 4 MB per foto, jauh di atas hasil pengecilan
const TIPE = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

export default async function handler(req, res) {
  const sesi = wajibMasuk(req, res);
  if (!sesi) return;

  try {
    if (req.method === 'POST') {
      const { dataUrl, nama } = req.body || {};
      const cocok = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUrl || ''));
      if (!cocok) return res.status(400).json({ galat: 'Foto harus dikirim sebagai data URL base64.' });

      const [, tipe, b64] = cocok;
      const akhiran = TIPE[tipe.toLowerCase()];
      if (!akhiran) {
        return res.status(415).json({ galat: 'Jenis gambar tidak didukung. Pakai JPG, PNG, WebP, atau GIF.' });
      }

      const isi = Buffer.from(b64, 'base64');
      if (!isi.length) return res.status(400).json({ galat: 'Berkas fotonya kosong.' });
      if (isi.length > BATAS) {
        return res.status(413).json({ galat: 'Foto terlalu besar (maksimal 4 MB setelah dikecilkan).' });
      }

      const aman = String(nama || 'foto').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'foto';
      const jalur = `desa/foto/${aman}-${crypto.randomBytes(4).toString('hex')}.${akhiran}`;

      const url = await tulisBerkas(jalur, isi, tipe);
      return res.status(201).json({ url, ukuran: isi.length });
    }

    if (req.method === 'DELETE') {
      const url = String(req.query?.url || '');
      if (!/^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/desa\/foto\//.test(url)) {
        return res.status(400).json({ galat: 'Alamat foto tidak dikenali.' });
      }
      await hapusBerkas(url);
      return res.status(200).json({ dihapus: true });
    }

    return res.status(405).json({ galat: 'Metode tidak didukung' });
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }
}
