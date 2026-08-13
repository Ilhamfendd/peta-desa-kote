// Pengelolaan akun.
//
//   GET    /api/pengguna              daftar akun (tanpa sandi)
//   POST   /api/pengguna              tambah akun            (admin)
//   PATCH  /api/pengguna              ganti sandi            (admin, atau sandi sendiri)
//   DELETE /api/pengguna?id=...       hapus akun             (admin)

import crypto from 'node:crypto';
import {
  wajibMasuk, wajibAdmin, daftarPengguna, simpanPengguna,
  acakSandi, sandiCocok, tanpaSandi,
} from './_lib/sesi.js';

const SANDI_MINIMAL = 8;
const bersih = (s) => String(s || '').trim();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const sesi = wajibMasuk(req, res);
      if (!sesi) return;
      const daftar = await daftarPengguna();
      return res.status(200).json({ pengguna: daftar.map(tanpaSandi) });
    }

    if (req.method === 'POST') {
      const sesi = wajibAdmin(req, res);
      if (!sesi) return;

      const nama = bersih(req.body?.nama);
      const akun = bersih(req.body?.pengguna).toLowerCase();
      const sandi = String(req.body?.sandi || '');
      const peran = req.body?.peran === 'admin' ? 'admin' : 'pengelola';

      if (!nama || !akun) return res.status(400).json({ galat: 'Nama lengkap dan nama pengguna harus diisi.' });
      if (!/^[a-z0-9._-]{3,24}$/.test(akun)) {
        return res.status(400).json({ galat: 'Nama pengguna 3–24 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip.' });
      }
      if (sandi.length < SANDI_MINIMAL) {
        return res.status(400).json({ galat: `Kata sandi minimal ${SANDI_MINIMAL} karakter.` });
      }

      const daftar = await daftarPengguna();
      if (daftar.some((p) => p.pengguna === akun)) {
        return res.status(409).json({ galat: 'Nama pengguna itu sudah dipakai.' });
      }

      const { garam, kunci } = acakSandi(sandi);
      const baru = {
        id: crypto.randomUUID(), nama, pengguna: akun, peran, garam, kunci,
        dibuat: new Date().toISOString(), dibuatOleh: sesi.nama,
      };
      daftar.push(baru);
      await simpanPengguna(daftar);
      return res.status(201).json({ pengguna: tanpaSandi(baru) });
    }

    if (req.method === 'PATCH') {
      const sesi = wajibMasuk(req, res);
      if (!sesi) return;

      const id = bersih(req.body?.id) || sesi.id;
      const sandiBaru = String(req.body?.sandiBaru || '');
      const sandiLama = String(req.body?.sandiLama || '');
      const sendiri = id === sesi.id;

      if (!sendiri && sesi.peran !== 'admin') {
        return res.status(403).json({ galat: 'Hanya admin yang boleh mengganti sandi orang lain.' });
      }
      if (sandiBaru.length < SANDI_MINIMAL) {
        return res.status(400).json({ galat: `Kata sandi minimal ${SANDI_MINIMAL} karakter.` });
      }

      const daftar = await daftarPengguna();
      const orang = daftar.find((p) => p.id === id);
      if (!orang) return res.status(404).json({ galat: 'Akun tidak ditemukan.' });

      // Mengganti sandi sendiri tetap harus menyebut sandi lama, supaya perangkat
      // yang ditinggalkan terbuka tidak bisa dipakai mengunci pemiliknya.
      if (sendiri && !sandiCocok(sandiLama, orang.garam, orang.kunci)) {
        return res.status(401).json({ galat: 'Kata sandi lama salah.' });
      }

      Object.assign(orang, acakSandi(sandiBaru), { gagal: 0, terkunciSampai: null });
      await simpanPengguna(daftar);
      return res.status(200).json({ diganti: true });
    }

    if (req.method === 'DELETE') {
      const sesi = wajibAdmin(req, res);
      if (!sesi) return;

      const id = bersih(req.query?.id);
      const daftar = await daftarPengguna();
      const orang = daftar.find((p) => p.id === id);
      if (!orang) return res.status(404).json({ galat: 'Akun tidak ditemukan.' });
      if (orang.id === sesi.id) {
        return res.status(400).json({ galat: 'Tidak bisa menghapus akun sendiri.' });
      }
      if (orang.peran === 'admin' && daftar.filter((p) => p.peran === 'admin').length <= 1) {
        return res.status(400).json({ galat: 'Ini admin terakhir — sisakan minimal satu admin.' });
      }

      await simpanPengguna(daftar.filter((p) => p.id !== id));
      return res.status(200).json({ dihapus: true });
    }

    return res.status(405).json({ galat: 'Metode tidak didukung' });
  } catch (e) {
    return res.status(500).json({ galat: e.message });
  }
}
