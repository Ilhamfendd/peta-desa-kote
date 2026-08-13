// Pembungkus Vercel Blob.
//
// Semua berkas dipakai dengan `addRandomSuffix: false` supaya alamatnya tetap —
// draf yang sama bisa ditimpa berulang kali tanpa menumpuk berkas sampah.

import { put, head, del, list } from '@vercel/blob';

export const BERKAS_DRAF = 'desa/draf.json';
export const BERKAS_TERBIT = 'desa/terbit.json';

function token() {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN belum ada — pasang Vercel Blob dulu');
  return t;
}

export async function tulisJSON(jalur, isi, { publik = false } = {}) {
  try {
    const hasil = await put(jalur, JSON.stringify(isi), {
      access: publik ? 'public' : 'private',
      contentType: 'application/json; charset=utf-8',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      token: token(),
    });
    return hasil.url;
  } catch (e) {
    // Nama berkasnya tetap (addRandomSuffix: false), jadi alamatnya mudah ditebak.
    // Kalau penyimpanan privat tidak tersedia, berhenti di sini — menyimpannya
    // sebagai publik berarti membuka daftar akun beserta sandi teracaknya.
    if (!publik) {
      throw new Error(
        'Gagal menyimpan sebagai berkas privat. Pastikan Vercel Blob pada akun ini '
        + 'mendukung penyimpanan privat — data akun tidak akan disimpan sebagai publik. '
        + `Pesan asli: ${e.message}`);
    }
    throw e;
  }
}

export async function bacaJSON(jalur) {
  try {
    const berkas = await head(jalur, { token: token() });
    if (!berkas) return null;
    // downloadUrl selalu bisa diambil dengan token, baik berkas publik maupun tidak.
    const r = await fetch(berkas.downloadUrl ?? berkas.url, {
      headers: { authorization: `Bearer ${token()}` },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    // head() melempar BlobNotFoundError bila berkasnya memang belum ada —
    // itu keadaan wajar saat pertama kali dipakai, bukan kegagalan.
    if (e?.name === 'BlobNotFoundError' || /not\s*found/i.test(e?.message || '')) return null;
    throw e;
  }
}

export async function tulisBerkas(jalur, data, tipe) {
  const hasil = await put(jalur, data, {
    access: 'public',
    contentType: tipe,
    addRandomSuffix: false,
    allowOverwrite: true,
    token: token(),
  });
  return hasil.url;
}

export async function hapusBerkas(url) {
  await del(url, { token: token() });
}

export async function daftarBerkas(awalan) {
  const { blobs } = await list({ prefix: awalan, token: token() });
  return blobs;
}
