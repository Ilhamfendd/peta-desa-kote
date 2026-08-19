// Pembungkus Vercel Blob.
//
// Semua berkas ditulis dengan `addRandomSuffix: false` supaya alamatnya tetap —
// draf yang sama bisa ditimpa berulang kali tanpa menumpuk berkas sampah.
//
// Karena alamatnya jadi mudah ditebak, akses tiap berkas ditentukan tegas:
//
//   desa/pengguna.json  berisi sandi teracak
//   desa/draf.json      suntingan yang belum diterbitkan
//   desa/terbit.json    dibaca perakit lewat /api/terbit
//   desa/foto/*         disajikan lewat /api/foto
//
// SELURUH penyimpanan harus dibuat dengan `--access private`. Mode akses itu
// milik penyimpanannya, bukan per berkas — penyimpanan publik menolak
// `cache=0` dengan pesan "only available for private stores", dan menyimpan
// berkas akun di sana berarti alamatnya bisa ditebak siapa pun.
// Foto memang perlu dilihat umum, tapi itu diurus rute /api/foto, bukan dengan
// membuka seluruh penyimpanan.
//
// Butuh @vercel/blob v2 ke atas: penyimpanan privat dan get() belum ada di v0.x.

import { put, get, del, list } from '@vercel/blob';

export const BERKAS_DRAF = 'desa/draf.json';
export const BERKAS_TERBIT = 'desa/terbit.json';

function token() {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN belum ada — pasang Vercel Blob dulu');
  return t;
}

const akses = (publik) => (publik ? 'public' : 'private');

export async function tulisJSON(jalur, isi, { publik = false } = {}) {
  try {
    const hasil = await put(jalur, JSON.stringify(isi), {
      access: akses(publik),
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      token: token(),
    });
    return hasil.url;
  } catch (e) {
    // Berhenti di sini daripada menyimpannya sebagai publik: nama berkasnya tetap,
    // jadi alamat publiknya bisa ditebak siapa pun.
    if (!publik) {
      throw new Error(
        'Gagal menyimpan sebagai berkas privat. Pastikan Vercel Blob pada akun ini '
        + 'mendukung penyimpanan privat — data akun tidak akan disimpan sebagai publik. '
        + `Pesan asli: ${e.message}`);
    }
    throw e;
  }
}

export async function bacaJSON(jalur, { publik = false } = {}) {
  try {
    const hasil = await get(jalur, {
      access: akses(publik),
      token: token(),
      useCache: false,     // draf berubah terus; jangan sampai terbaca yang basi
    });
    if (!hasil || hasil.statusCode !== 200) return null;
    return JSON.parse(await new Response(hasil.stream).text());
  } catch (e) {
    // Berkas memang belum pernah dibuat — keadaan wajar saat pertama dipakai.
    if (e?.name === 'BlobNotFoundError' || /not\s*found/i.test(e?.message || '')) return null;
    throw e;
  }
}

export async function tulisBerkas(jalur, data, tipe) {
  await put(jalur, data, {
    access: 'private',
    contentType: tipe,
    addRandomSuffix: false,
    allowOverwrite: true,
    token: token(),
  });
  // Yang dikembalikan alamat rute sendiri, bukan alamat Blob: alamat Blob privat
  // butuh token, sedangkan foto ini dipasang di halaman yang dibuka siapa saja.
  return `/api/foto?jalur=${encodeURIComponent(jalur)}`;
}

/** Isi berkas sebagai aliran — dipakai /api/foto untuk menyajikan gambar. */
export async function bacaBerkas(jalur, { ifNoneMatch } = {}) {
  return get(jalur, { access: 'private', token: token(), ifNoneMatch });
}

export async function hapusBerkas(jalurAtauUrl) {
  await del(jalurAtauUrl, { token: token() });
}

export async function daftarBerkas(awalan) {
  const { blobs } = await list({ prefix: awalan, token: token() });
  return blobs;
}
