// Membuat akun admin pertama. Dijalankan sekali dari komputer sendiri.
//
//   node buat-admin.mjs "Nama Lengkap" namapengguna katasandi
//
// Perlu BLOB_READ_WRITE_TOKEN. Cara paling gampang: `vercel env pull .env.local`
// lalu jalankan skrip ini — berkas .env.local otomatis dibaca.
//
// Setelah ada satu admin, akun berikutnya dibuat lewat halaman /admin.

import crypto from 'node:crypto';
import { muatEnv } from './muat-env.mjs';

muatEnv();

const { daftarPengguna, simpanPengguna, acakSandi } = await import('./api/_lib/sesi.js');

const [nama, pengguna, sandi] = process.argv.slice(2);

if (!nama || !pengguna || !sandi) {
  console.error('Pemakaian: node buat-admin.mjs "Nama Lengkap" namapengguna katasandi');
  process.exit(1);
}
if (!/^[a-z0-9._-]{3,24}$/.test(pengguna)) {
  console.error('Nama pengguna 3–24 karakter: huruf kecil, angka, titik, garis bawah, strip.');
  process.exit(1);
}
if (sandi.length < 8) {
  console.error('Kata sandi minimal 8 karakter.');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN belum ada. Jalankan: vercel env pull .env.local');
  process.exit(1);
}

const daftar = await daftarPengguna();
if (daftar.some((p) => p.pengguna === pengguna.toLowerCase())) {
  console.error(`Nama pengguna "${pengguna}" sudah dipakai.`);
  process.exit(1);
}

const { garam, kunci } = acakSandi(sandi);
daftar.push({
  id: crypto.randomUUID(),
  nama, pengguna: pengguna.toLowerCase(), peran: 'admin',
  garam, kunci, dibuat: new Date().toISOString(), dibuatOleh: 'buat-admin.mjs',
});
await simpanPengguna(daftar);

console.log(`\n  Admin dibuat: ${nama} (${pengguna.toLowerCase()})`);
console.log(`  Total akun sekarang: ${daftar.length}`);
console.log('\n  Masuk lewat: https://peta-desa-kote.vercel.app/admin');
console.log('  Segera ganti kata sandinya dari halaman itu — sandi yang diketik di');
console.log('  baris perintah tercatat di riwayat terminal.\n');
