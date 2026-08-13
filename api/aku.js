// GET /api/aku — siapa yang sedang masuk. Dipakai halaman admin dan mode
// Kelola di peta untuk tahu apakah suntingan bisa disimpan ke server.
import { bacaSesi } from './_lib/sesi.js';

export default function handler(req, res) {
  const sesi = bacaSesi(req);
  res.setHeader('Cache-Control', 'no-store');
  if (!sesi) return res.status(200).json({ masuk: false });
  return res.status(200).json({
    masuk: true,
    pengguna: { id: sesi.id, nama: sesi.nama, pengguna: sesi.pengguna, peran: sesi.peran },
  });
}
