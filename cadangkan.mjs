// Menyalin seluruh data desa dari Vercel Blob ke folder di komputer sendiri.
//
//   node cadangkan.mjs                 -> lokal/cadangan-YYYY-MM-DD/
//   node cadangkan.mjs folder-tujuan
//
// Gunanya dua: cadangan berkala, dan bekal pindah ke akun Vercel milik desa
// nanti (lihat pulihkan.mjs). Hasilnya ditaruh di lokal/ yang tidak ikut
// ke GitHub — di dalamnya ada berkas akun.

import fs from 'node:fs/promises';
import path from 'node:path';
import { muatEnv, wajibToken } from './muat-env.mjs';

muatEnv();
wajibToken();

const { bacaJSON, daftarBerkas, BERKAS_DRAF, BERKAS_TERBIT } = await import('./api/_lib/simpan.js');

const tujuan = process.argv[2]
  || path.join('lokal', `cadangan-${new Date().toISOString().slice(0, 10)}`);

await fs.mkdir(path.join(tujuan, 'foto'), { recursive: true });

// ── Berkas JSON ──
const berkas = [
  ['pengguna.json', 'desa/pengguna.json'],
  ['draf.json', BERKAS_DRAF],
  ['terbit.json', BERKAS_TERBIT],
];

let jumlah = 0;
for (const [nama, jalur] of berkas) {
  const isi = await bacaJSON(jalur);
  if (!isi) { console.log(`  -  ${nama} belum ada, dilewati`); continue; }
  await fs.writeFile(path.join(tujuan, nama), JSON.stringify(isi, null, 2), 'utf8');
  console.log(`  ok ${nama}`);
  jumlah++;
}

// ── Foto ──
const foto = await daftarBerkas('desa/foto/');
const petaFoto = {};
for (const f of foto) {
  const nama = path.basename(f.pathname);
  const r = await fetch(f.url);
  if (!r.ok) { console.log(`  !  gagal mengunduh ${nama} (${r.status})`); continue; }
  await fs.writeFile(path.join(tujuan, 'foto', nama), Buffer.from(await r.arrayBuffer()));
  petaFoto[f.url] = `foto/${nama}`;   // dipakai pulihkan.mjs untuk menulis ulang alamat
}
await fs.writeFile(path.join(tujuan, 'foto.json'), JSON.stringify(petaFoto, null, 2), 'utf8');

console.log(`\n  ${jumlah} berkas data + ${Object.keys(petaFoto).length} foto`);
console.log(`  tersimpan di ${tujuan}`);
console.log('\n  Berisi data akun. Jangan diunggah ke tempat terbuka.');
