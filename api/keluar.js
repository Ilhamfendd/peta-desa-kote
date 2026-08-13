// POST /api/keluar
import { kueKosong } from './_lib/sesi.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ galat: 'Metode tidak didukung' });
  res.setHeader('Set-Cookie', kueKosong());
  return res.status(200).json({ keluar: true });
}
