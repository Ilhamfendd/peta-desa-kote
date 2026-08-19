// Mengembalikan hasil cadangkan.mjs ke Vercel Blob.
//
//   node pulihkan.mjs lokal/cadangan-2026-08-13
//
// Dipakai saat memindahkan proyek ke akun Vercel milik desa: buat penyimpanan
// Blob baru di akun itu, tarik tokennya, lalu jalankan ini.
//
// Alamat foto ikut ditulis ulang. Penyimpanan yang baru memberi alamat yang
// berbeda, jadi kalau tidak diganti, seluruh foto akan tampil rusak.

import fs from 'node:fs/promises';
import path from 'node:path';
import { muatEnv, wajibToken } from './muat-env.mjs';

muatEnv();
wajibToken();

const { tulisJSON, tulisBerkas, BERKAS_DRAF, BERKAS_TERBIT } = await import('./api/_lib/simpan.js');

const asal = process.argv[2];
if (!asal) {
  console.error('Pemakaian: node pulihkan.mjs <folder-cadangan>');
  process.exit(1);
}

const ambil = async (nama) => {
  try { return JSON.parse(await fs.readFile(path.join(asal, nama), 'utf8')); }
  catch { return null; }
};

const TIPE = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
               '.webp': 'image/webp', '.gif': 'image/gif' };

// ── Foto dulu, supaya alamat barunya siap sebelum data ditulis ──
const petaLama = (await ambil('foto.json')) || {};
const gantiAlamat = {};
for (const [urlLama, relatif] of Object.entries(petaLama)) {
  const berkas = path.join(asal, relatif);
  try {
    const isi = await fs.readFile(berkas);
    const nama = path.basename(relatif);
    const urlBaru = await tulisBerkas(`desa/foto/${nama}`, isi, TIPE[path.extname(nama).toLowerCase()] || 'image/jpeg');
    gantiAlamat[urlLama] = urlBaru;
  } catch (e) {
    console.log(`  !  ${relatif} gagal: ${e.message}`);
  }
}
console.log(`  ok ${Object.keys(gantiAlamat).length} foto`);

// Menulis ulang alamat foto di seluruh isi data, sedalam apa pun letaknya.
function tulisUlang(nilai) {
  if (typeof nilai === 'string') return gantiAlamat[nilai] || nilai;
  if (Array.isArray(nilai)) return nilai.map(tulisUlang);
  if (nilai && typeof nilai === 'object') {
    return Object.fromEntries(Object.entries(nilai).map(([k, v]) => [k, tulisUlang(v)]));
  }
  return nilai;
}

// ── Data ──
for (const [nama, jalur] of [
  ['pengguna.json', 'desa/pengguna.json'],
  ['draf.json', BERKAS_DRAF],
  ['terbit.json', BERKAS_TERBIT],
]) {
  const isi = await ambil(nama);
  if (!isi) { console.log(`  -  ${nama} tidak ada di cadangan, dilewati`); continue; }
  await tulisJSON(jalur, tulisUlang(isi), { publik: false });
  console.log(`  ok ${nama}`);
}

console.log('\n  Selesai. Akun dan kata sandi lama tetap berlaku.');
console.log('  Jangan lupa pasang SESI_RAHASIA dan VERCEL_DEPLOY_HOOK di proyek yang baru,');
console.log('  lalu terbitkan sekali dari /admin agar situs dirakit ulang.');
