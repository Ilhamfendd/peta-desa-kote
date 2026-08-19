// Membaca .env.local sendiri — Node tidak melakukannya otomatis.
// Dipakai skrip yang dijalankan dari komputer sendiri (buat-admin, cadangkan,
// pulihkan). Di Vercel berkas ini tidak ada, dan env-nya memang sudah terpasang.
import fs from 'node:fs';

export function muatEnv(berkas = '.env.local') {
  try {
    for (const baris of fs.readFileSync(berkas, 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(baris);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* tidak ada .env.local — berarti env-nya sudah dipasang di luar */ }
}

export function wajibToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN belum ada. Jalankan dulu: vercel env pull .env.local');
    process.exit(1);
  }
}
