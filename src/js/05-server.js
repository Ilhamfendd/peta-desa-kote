/* ═══════════════════════════════════════════════════════════════════
   Sambungan ke server pengelolaan

   Peta ini tetap bisa dipakai sendirian tanpa server — itu sengaja, supaya
   berkasnya bisa dibuka luring dari flashdisk. Modul ini hanya menambah
   kemampuan: bila peta dibuka lewat web DAN pengelola sedang masuk, suntingan
   disimpan ke draf bersama di server, bukan ke penyimpanan browser.

   Aturannya satu: kalau server tidak ada, semuanya harus tetap berjalan.
   ═══════════════════════════════════════════════════════════════════ */

const SERVER = {
  aktif: false,      // sedang tersambung dan sudah masuk
  saya: null,        // pengelola yang sedang masuk
  jeda: null,        // penunda simpanan
  belumTersimpan: false,
};

const bisaHubungiServer = () =>
  location.protocol === 'http:' || location.protocol === 'https:';

async function sambungServer() {
  if (!bisaHubungiServer()) return false;
  try {
    const r = await fetch('/api/aku', { cache: 'no-store' });
    if (!r.ok) return false;
    const aku = await r.json();
    if (!aku.masuk) return false;
    SERVER.aktif = true;
    SERVER.saya = aku.pengguna;
    return true;
  } catch (e) {
    return false;   // luring atau server sedang bermasalah — bukan alasan gagal
  }
}

async function muatDrafServer() {
  try {
    const r = await fetch('/api/draf', { cache: 'no-store' });
    if (!r.ok) return null;
    const draf = await r.json();
    return draf && draf.data ? draf : null;
  } catch (e) {
    return null;
  }
}

function simpanKeServer(ringkasan) {
  if (!SERVER.aktif) return;
  SERVER.belumTersimpan = true;
  clearTimeout(SERVER.jeda);
  // Ditunda sebentar: menggeser titik batas memicu puluhan simpanan beruntun.
  SERVER.jeda = setTimeout(() => kirimDrafServer(ringkasan), 1200);
}

async function kirimDrafServer(ringkasan) {
  if (!SERVER.aktif || !SERVER.belumTersimpan) return;
  tandaServer('menyimpan');
  try {
    const r = await fetch('/api/draf', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: S.data, ringkasan: ringkasan || 'Menyunting data peta' }),
    });
    if (!r.ok) {
      const isi = await r.json().catch(() => ({}));
      throw new Error(isi.galat || `Gagal (${r.status})`);
    }
    SERVER.belumTersimpan = false;
    tandaServer('tersimpan');
  } catch (e) {
    tandaServer('gagal');
    pesan('Gagal menyimpan ke server: ' + e.message, true);
  }
}

// Unggah foto sebagai berkas sungguhan; balasannya alamat yang dipakai di data.
async function unggahFoto(dataUrl, nama) {
  const r = await fetch('/api/foto', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dataUrl, nama: nama || 'foto' }),
  });
  const isi = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(isi.galat || `Gagal mengunggah (${r.status})`);
  return isi.url;
}

const TANDA = {
  menyimpan: ['Menyimpan…', 'sedang'],
  tersimpan: ['Tersimpan di server', 'baik'],
  gagal: ['Gagal menyimpan', 'buruk'],
  siap: ['Tersambung', 'baik'],
};

function tandaServer(keadaan) {
  const el = $('#server-status');
  if (!el) return;
  const [teks, kelas] = TANDA[keadaan] || TANDA.siap;
  el.hidden = false;
  el.className = 'server-status ' + kelas;
  el.textContent = SERVER.saya && keadaan === 'siap'
    ? `${SERVER.saya.nama} · tersambung`
    : teks;
}

// Menutup tab saat simpanan terakhir belum terkirim akan menghilangkannya.
addEventListener('beforeunload', (e) => {
  if (SERVER.aktif && SERVER.belumTersimpan) { e.preventDefault(); e.returnValue = ''; }
});
