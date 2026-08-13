// Akun pengelola dan sesi masuk.
//
// Tidak memakai pustaka pihak ketiga: sandi diacak dengan scrypt bawaan Node,
// sesi dititipkan pada kue (cookie) yang ditandatangani HMAC. Satu ketergantungan
// lebih sedikit berarti satu hal lebih sedikit yang bisa basi setelah tim KKN
// menyerahkan proyek ini ke desa.

import crypto from 'node:crypto';
import { bacaJSON, tulisJSON } from './simpan.js';

const BERKAS_PENGGUNA = 'desa/pengguna.json';
const UMUR_SESI = 60 * 60 * 12;              // 12 jam, cukup untuk sekali kerja
const NAMA_KUE = 'sesi_desa';

function rahasia() {
  const r = process.env.SESI_RAHASIA;
  if (!r || r.length < 16) {
    throw new Error('SESI_RAHASIA belum diatur di Vercel (minimal 16 karakter)');
  }
  return r;
}

// ── Sandi ──────────────────────────────────────────────────────────────
export function acakSandi(sandi) {
  const garam = crypto.randomBytes(16).toString('hex');
  const kunci = crypto.scryptSync(sandi, garam, 64).toString('hex');
  return { garam, kunci };
}

export function sandiCocok(sandi, garam, kunci) {
  const coba = crypto.scryptSync(sandi, garam, 64);
  const asli = Buffer.from(kunci, 'hex');
  // Panjang harus sama sebelum timingSafeEqual, kalau tidak ia melempar galat.
  return asli.length === coba.length && crypto.timingSafeEqual(asli, coba);
}

// ── Kue sesi ───────────────────────────────────────────────────────────
const b64 = (s) => Buffer.from(s).toString('base64url');
const deB64 = (s) => Buffer.from(s, 'base64url').toString('utf8');

function tandatangan(isi) {
  return crypto.createHmac('sha256', rahasia()).update(isi).digest('base64url');
}

export function buatKue(pengguna) {
  const isi = b64(JSON.stringify({
    id: pengguna.id,
    pengguna: pengguna.pengguna,
    nama: pengguna.nama,
    peran: pengguna.peran,
    exp: Math.floor(Date.now() / 1000) + UMUR_SESI,
  }));
  const nilai = `${isi}.${tandatangan(isi)}`;
  return `${NAMA_KUE}=${nilai}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${UMUR_SESI}`;
}

export const kueKosong = () =>
  `${NAMA_KUE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export function bacaSesi(req) {
  const mentah = req.headers.cookie || '';
  const potong = mentah.split(';').map((s) => s.trim())
    .find((s) => s.startsWith(`${NAMA_KUE}=`));
  if (!potong) return null;

  const nilai = potong.slice(NAMA_KUE.length + 1);
  const pisah = nilai.lastIndexOf('.');
  if (pisah < 1) return null;

  const isi = nilai.slice(0, pisah);
  const tanda = nilai.slice(pisah + 1);

  // Bandingkan dengan waktu tetap supaya tanda tangan tidak bisa ditebak
  // sepotong demi sepotong.
  const benar = tandatangan(isi);
  if (tanda.length !== benar.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(tanda), Buffer.from(benar))) return null;

  try {
    const sesi = JSON.parse(deB64(isi));
    if (!sesi.exp || sesi.exp < Math.floor(Date.now() / 1000)) return null;
    return sesi;
  } catch {
    return null;
  }
}

// ── Penjaga ────────────────────────────────────────────────────────────
export function wajibMasuk(req, res) {
  const sesi = bacaSesi(req);
  if (!sesi) {
    res.status(401).json({ galat: 'Sesi berakhir. Silakan masuk lagi.' });
    return null;
  }
  return sesi;
}

export function wajibAdmin(req, res) {
  const sesi = wajibMasuk(req, res);
  if (!sesi) return null;
  if (sesi.peran !== 'admin') {
    res.status(403).json({ galat: 'Hanya admin yang boleh mengubah daftar pengguna.' });
    return null;
  }
  return sesi;
}

// ── Daftar pengguna ────────────────────────────────────────────────────
export async function daftarPengguna() {
  return (await bacaJSON(BERKAS_PENGGUNA)) || [];
}

export async function simpanPengguna(daftar) {
  await tulisJSON(BERKAS_PENGGUNA, daftar, { publik: false });
}

// Dipakai halaman admin: tidak boleh membocorkan garam maupun sandi teracak.
export const tanpaSandi = (p) => ({
  id: p.id, nama: p.nama, pengguna: p.pengguna, peran: p.peran, dibuat: p.dibuat,
});
