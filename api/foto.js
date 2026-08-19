// GET    /api/foto?jalur=desa/foto/x.jpg   sajikan foto        (terbuka untuk umum)
// POST   /api/foto   { dataUrl, nama? }     simpan foto         (perlu masuk)
// DELETE /api/foto?jalur=...                hapus foto          (perlu masuk)
//
// Fotonya sendiri tersimpan sebagai berkas PRIVAT, sama seperti data lain, sebab
// mode akses itu milik penyimpanannya dan berkas akun ada di penyimpanan yang
// sama. Supaya foto tetap bisa dilihat pengunjung biasa, rute GET di bawah ini
// yang menyajikannya — dialah satu-satunya pintu keluar, dan ia hanya melayani
// berkas di bawah desa/foto/.

import crypto from 'node:crypto';
import { wajibMasuk } from './_lib/sesi.js';
import { tulisBerkas, bacaBerkas, hapusBerkas } from './_lib/simpan.js';

const BATAS = 4 * 1024 * 1024;    // 4 MB per foto, jauh di atas hasil pengecilan
const TIPE = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

// Hanya foto desa yang boleh keluar lewat rute ini — bukan draf, bukan berkas akun.
const jalurSah = (j) => /^desa\/foto\/[A-Za-z0-9._-]+$/.test(j) && !j.includes('..');

export default async function handler(req, res) {
  try {
    // ── Menyajikan foto: tanpa perlu masuk ──
    if (req.method === 'GET') {
      const jalur = String(req.query?.jalur || '');
      if (!jalurSah(jalur)) return res.status(400).json({ galat: 'Alamat foto tidak dikenali.' });

      const hasil = await bacaBerkas(jalur, { ifNoneMatch: req.headers['if-none-match'] });
      if (!hasil) return res.status(404).json({ galat: 'Foto tidak ditemukan.' });

      // Foto jarang berubah dan namanya memuat kode acak, jadi boleh disinggahi lama.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (hasil.blob?.etag) res.setHeader('ETag', hasil.blob.etag);

      if (hasil.statusCode === 304) return res.status(304).end();
      if (!hasil.stream) return res.status(502).json({ galat: 'Isi foto tidak terbaca.' });

      res.setHeader('Content-Type', hasil.blob?.contentType || 'image/jpeg');
      res.status(200);
      // Node menerima aliran web lewat Readable.fromWeb; disalin manual agar
      // tidak bergantung pada perilaku khusus runtime.
      const pembaca = hasil.stream.getReader();
      for (;;) {
        const { done, value } = await pembaca.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      return res.end();
    }

    const sesi = wajibMasuk(req, res);
    if (!sesi) return;

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
      return res.status(201).json({ url, jalur, ukuran: isi.length });
    }

    if (req.method === 'DELETE') {
      // Menerima jalur maupun alamat rute yang tersimpan di data.
      let jalur = String(req.query?.jalur || '');
      if (!jalur && req.query?.url) {
        const m = /[?&]jalur=([^&]+)/.exec(String(req.query.url));
        if (m) jalur = decodeURIComponent(m[1]);
      }
      if (!jalurSah(jalur)) return res.status(400).json({ galat: 'Alamat foto tidak dikenali.' });
      await hapusBerkas(jalur);
      return res.status(200).json({ dihapus: true });
    }

    return res.status(405).json({ galat: 'Metode tidak didukung' });
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }
}
