/* ═══════════════════════════════════════════════════════════
   00 — Inti: konstanta, model data, utilitas
   ═══════════════════════════════════════════════════════════ */
'use strict';

const APP = {
  versi: '1.0.0',
  simpanan: 'peta-desa-kote/v1',
  pusat: [-0.3657998, 104.5098449],   // node OSM "Desa Kote"
  zoom: 15,                           // ~5 km lebar layar: skala desa, bukan skala pulau
  jangkauan: 8,                       // km dari pusat — batas jelajah peta
  demo: false                         // dinyalakan oleh berkas contoh
};

/* ── Kategori tempat ───────────────────────────────────────
   Warna mengambil slot palet kategorikal secara tetap.
   Ikon: path 24×24, stroke.                                   */
/* Warna penanda dipisahkan dari palet grafik: peta boleh memakai lebih banyak
   rona karena bentuk ikonnya ikut membedakan, sementara palet grafik harus
   tetap utuh demi keterbacaan bagi penyandang buta warna. */
const KATEGORI = {
  pemerintahan:  { label: 'Pemerintahan',       warna: '--pin-pemerintahan',
                   ikon: 'M3.5 20.4h17M5.8 20.4V10.2M9.9 20.4V10.2M14.1 20.4V10.2M18.2 20.4V10.2M12 3.6l8.2 5.3H3.8z' },
  pendidikan:    { label: 'Pendidikan',         warna: '--pin-pendidikan',
                   ikon: 'M12 4.2 2.7 8.8 12 13.4l9.3-4.6zM6.7 10.9v4.9c0 1.4 2.4 2.5 5.3 2.5s5.3-1.1 5.3-2.5v-4.9M21.3 8.8v5.5' },
  kesehatan:     { label: 'Kesehatan',          warna: '--pin-kesehatan',
                   ikon: 'M10.2 3.7h3.6v6.5h6.5v3.6h-6.5v6.5h-3.6v-6.5H3.7v-3.6h6.5z' },
  ibadah:        { label: 'Rumah ibadah',       warna: '--pin-ibadah',
                   ikon: 'M12 3.3c-2.3 1.8-3.6 3.5-3.6 5.3h7.2c0-1.8-1.3-3.5-3.6-5.3zM6.8 8.6h10.4v11.8H6.8zM10.3 20.4v-3.3a1.7 1.7 0 0 1 3.4 0v3.3M4.3 11.3v9.1M19.7 11.3v9.1' },
  ekonomi:       { label: 'Ekonomi & UMKM',     warna: '--pin-ekonomi',
                   ikon: 'M4 9.5h16l-1 10.9H5zM4 9.5 5.6 4.3h12.8L20 9.5M9.4 13.7h5.2v6.7H9.4z' },
  kuliner:       { label: 'Kuliner & warung',   warna: '--pin-kuliner',
                   ikon: 'M7.2 3.6v6.8a2 2 0 0 0 4 0V3.6M9.2 10.4v10M15.6 3.6c-1.3 0-2.4 1.6-2.4 3.6s1.1 3.6 2.4 3.6S18 9.2 18 7.2s-1.1-3.6-2.4-3.6zM15.6 10.8v9.6' },
  perikanan:     { label: 'Perikanan',          warna: '--pin-perikanan',
                   ikon: 'M20.8 12c-2.5 3.3-5.6 5-8.6 5s-6.1-1.7-8.6-5c2.5-3.3 5.6-5 8.6-5s6.1 1.7 8.6 5zM3.6 12 1.4 8.9v6.2M16 10.7h.02' },
  pertanian:     { label: 'Pertanian & kebun',  warna: '--pin-pertanian',
                   ikon: 'M12 20.4V9.2M12 9.2C12 6.1 9.5 3.6 6.4 3.6c0 3.1 2.5 5.6 5.6 5.6zM12 11.8c0-2.5 2-4.5 4.5-4.5 0 2.5-2 4.5-4.5 4.5zM4.6 20.4h14.8' },
  wisata:        { label: 'Wisata',             warna: '--pin-wisata',
                   ikon: 'M12 20.4v-8.8M12 11.6c0-2.3 1.9-4.2 4.2-4.2M12 11.6c0-2.3-1.9-4.2-4.2-4.2M12 11.6c0-2.7 1.2-5 2.9-6M3.6 20.4h16.8' },
  penginapan:    { label: 'Penginapan',         warna: '--pin-penginapan',
                   ikon: 'M3.6 19.8V8.4M20.4 19.8v-6.6H3.6M7.4 13.2V9.8h6.9v3.4M3.6 16.4h16.8' },
  sosial:        { label: 'Sosial & budaya',    warna: '--pin-sosial',
                   ikon: 'M9 11.6a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.6 20a5.5 5.5 0 0 1 10.8 0M16.4 8.4a2.5 2.5 0 1 0 0-5M17 15.3c2 .5 3.4 2 3.4 4.7' },
  transportasi:  { label: 'Transportasi',       warna: '--pin-transportasi',
                   ikon: 'M3.8 16.8h16.4l-2.1 3.8H5.9zM6.6 16.8v-5.6h10.8v5.6M12 11.2V6.4M9.2 6.4h5.6' },
  air:           { label: 'Air bersih',         warna: '--pin-air',
                   ikon: 'M12 3.5s6.1 6.5 6.1 10.3a6.1 6.1 0 1 1-12.2 0C5.9 10 12 3.5 12 3.5z' },
  infrastruktur: { label: 'Infrastruktur',      warna: '--pin-infrastruktur',
                   ikon: 'M12 3.6v16.8M6.8 20.4 12 3.6l5.2 16.8M8.6 10h6.8M7.4 15h9.2' },
  lainnya:       { label: 'Lainnya',            warna: '--pin-lainnya',
                   ikon: 'M12 20.6s6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0c0 4.5 6.8 10.6 6.8 10.6zM12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' }
};

/* ── Kerangka data desa (kosong — diisi lewat mode Kelola) ── */
function dataKosong() {
  return {
    meta: {
      nama: 'Desa Kote',
      kecamatan: 'Singkep Pesisir',
      kabupaten: 'Lingga',
      provinsi: 'Kepulauan Riau',
      kode: '21.04.06.2004',
      kodepos: '',
      pusat: APP.pusat.slice(),
      jangkauan: APP.jangkauan,
      logoDesa: '',
      diperbarui: null,
      versiApl: APP.versi
    },
    profil: {
      kepala: '', alamat: '', telepon: '', email: '', website: '',
      sejarah: '', visi: '', misi: '', potensi: '', sumberStat: '',
      tim: 'KKN Kelompok 67', institusi: '', tahun: '', urlPublik: ''
    },
    statistik: {
      ringkas: { penduduk: null, kk: null, luas: null, dusun: null, rt: null, rw: null },
      gender:     { judul: 'Jenis kelamin',   satuan: 'jiwa', baris: [ { l: 'Laki-laki', v: null }, { l: 'Perempuan', v: null } ] },
      usia:       { judul: 'Kelompok umur',   satuan: 'jiwa', baris: [
                      { l: '0–4', lk: null, pr: null }, { l: '5–14', lk: null, pr: null },
                      { l: '15–24', lk: null, pr: null }, { l: '25–44', lk: null, pr: null },
                      { l: '45–64', lk: null, pr: null }, { l: '65+', lk: null, pr: null } ] },
      pendidikan: { judul: 'Pendidikan terakhir', satuan: 'jiwa', baris: [
                      { l: 'Tidak/belum sekolah', v: null }, { l: 'SD / sederajat', v: null },
                      { l: 'SMP / sederajat', v: null }, { l: 'SMA / sederajat', v: null },
                      { l: 'Diploma', v: null }, { l: 'Sarjana ke atas', v: null } ] },
      pekerjaan:  { judul: 'Mata pencaharian', satuan: 'jiwa', baris: [
                      { l: 'Nelayan', v: null }, { l: 'Petani / pekebun', v: null },
                      { l: 'Wiraswasta', v: null }, { l: 'Karyawan swasta', v: null },
                      { l: 'PNS / TNI / Polri', v: null }, { l: 'Lainnya', v: null } ] },
      agama:      { judul: 'Agama',            satuan: 'jiwa', baris: [
                      { l: 'Islam', v: null }, { l: 'Kristen', v: null }, { l: 'Katolik', v: null },
                      { l: 'Buddha', v: null }, { l: 'Hindu', v: null }, { l: 'Konghucu', v: null } ] }
    },
    batas: { desa: null, dusun: [] },
    tempat: []
  };
}

/* Kelompok statistik satu-seri yang dirender seragam */
const GRUP_STAT = ['pendidikan', 'pekerjaan', 'agama'];

/* ── Utilitas DOM ─────────────────────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** URL aman untuk href/src — menolak skema selain http(s), mailto, tel, data:image. */
function safeUrl(u) {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(s)) return s;
  // Jalur di situs ini sendiri, mis. /api/foto?jalur=… tempat foto disajikan.
  // "/x" diterima, "//host" TIDAK — itu alamat ke host lain, bukan jalur lokal.
  if (/^\/[^/]/.test(s)) return s;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return 'https://' + s;
  return '';
}

function ikon(path, cls = '') {
  return `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="${path}"/></svg>`;
}

/* ── Warna: variabel CSS → nilai nyata ─────────────────────
   Atribut presentasi SVG (fill=, stroke=) dan opsi Leaflet tidak
   bisa diandalkan menerima var(); nilainya diselesaikan di sini
   dan cache dikosongkan setiap ganti tema.                     */
let _warna = {};
function cv(nama) {
  if (nama in _warna) return _warna[nama];
  const v = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return (_warna[nama] = v || '#888888');
}
function resetWarna() { _warna = {}; }

/** Ganti setiap var(--x) di dalam teks dengan warna nyatanya. */
const wr = s => String(s).replace(/var\((--[\w-]+)\)/g, (_, n) => cv(n));

/** Selesaikan semua nilai teks dalam objek gaya Leaflet. */
function gy(o) {
  for (const k in o) if (typeof o[k] === 'string') o[k] = wr(o[k]);
  return o;
}

/* ── Format angka & tanggal (id-ID) ───────────────────────── */
const NF = new Intl.NumberFormat('id-ID');
const NF1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const NF2 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

const angka   = n => (n == null || n === '' || !isFinite(n)) ? null : NF.format(n);
const angka1  = n => (n == null || !isFinite(n)) ? '—' : NF1.format(n);
const angka2  = n => (n == null || !isFinite(n)) ? '—' : NF2.format(n);
const nOrNull = v => { const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : null; };

function ringkas(n) {
  if (n == null || !isFinite(n)) return '—';
  if (Math.abs(n) >= 1e9) return NF1.format(n / 1e9) + ' M';
  if (Math.abs(n) >= 1e6) return NF1.format(n / 1e6) + ' jt';
  if (Math.abs(n) >= 10000) return NF1.format(n / 1000) + ' rb';
  return NF.format(n);
}

function tanggal(iso, panjang) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('id-ID', panjang
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** Koordinat desimal → derajat-menit-detik dengan arah mata angin. */
function dms(v, sumbu) {
  const arah = sumbu === 'lat' ? (v < 0 ? 'LS' : 'LU') : (v < 0 ? 'BB' : 'BT');
  const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60);
  const s = ((a - d - m / 60) * 3600).toFixed(1);
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(4, '0')}" ${arah}`;
}

/* ── Geodesi ──────────────────────────────────────────────── */
const R_BUMI = 6371008.8;
const rad = d => d * Math.PI / 180;

/** Jarak haversine (meter) antara dua [lat,lng]. */
function jarak(a, b) {
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_BUMI * Math.asin(Math.sqrt(h));
}

function panjangJalur(pts) {
  let t = 0;
  for (let i = 1; i < pts.length; i++) t += jarak(pts[i - 1], pts[i]);
  return t;
}

/** Luas poligon bola (m²) dari cincin [lat,lng] — rumus ekses bola. */
function luasPoligon(ring) {
  if (!ring || ring.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < ring.length; i++) {
    const p1 = ring[i], p2 = ring[(i + 1) % ring.length];
    total += rad(p2[1] - p1[1]) * (2 + Math.sin(rad(p1[0])) + Math.sin(rad(p2[0])));
  }
  return Math.abs(total * R_BUMI * R_BUMI / 2);
}

function teksJarak(m) {
  return m < 1000 ? `${angka1(m)} m` : `${angka2(m / 1000)} km`;
}
function teksLuas(m2) {
  if (m2 < 10000) return `${angka1(m2)} m²`;
  if (m2 < 1e6)   return `${angka2(m2 / 10000)} ha`;
  return `${angka2(m2 / 1e6)} km² <span class="dim">(${angka1(m2 / 10000)} ha)</span>`;
}

/* ── GeoJSON ⇄ Leaflet ────────────────────────────────────── */
/** Cincin GeoJSON [lng,lat] → latlng Leaflet [lat,lng]. */
const keLatLng = ring => ring.map(p => [p[1], p[0]]);
const keGeo    = pts  => pts.map(p => [+p[1].toFixed(6), +p[0].toFixed(6)]);

function poligonGeoJSON(pts, props) {
  const ring = keGeo(pts);
  if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
    ring.push(ring[0].slice());
  }
  return { type: 'Feature', properties: props || {}, geometry: { type: 'Polygon', coordinates: [ring] } };
}

/** Cincin luar sebuah Feature/Polygon → latlng Leaflet. */
function cincinLuar(f) {
  const g = f && (f.geometry || f);
  if (!g) return null;
  if (g.type === 'Polygon') return keLatLng(g.coordinates[0]);
  if (g.type === 'MultiPolygon') return keLatLng(g.coordinates[0][0]);
  return null;
}

/* ── Penyimpanan ──────────────────────────────────────────── */
function bacaJSON(id) {
  const n = document.getElementById(id);
  if (!n) return null;
  const t = n.textContent.trim();
  if (!t || t.startsWith('/*')) return null;
  try { return JSON.parse(t); } catch (e) { console.warn('Data ' + id + ' rusak:', e); return null; }
}

function muatData() {
  const tertanam = bacaJSON('desa-data');

  // Berkas contoh memakai penyimpanan sendiri, supaya suntingan di sana
  // tidak pernah bocor ke berkas asli yang dipakai desa.
  if (tertanam && tertanam.meta && tertanam.meta.demo) {
    APP.demo = true;
    APP.simpanan += '/contoh';
  }

  let lokal = null;
  try {
    const raw = localStorage.getItem(APP.simpanan);
    if (raw) lokal = JSON.parse(raw);
  } catch (e) { /* localStorage diblokir atau isinya rusak — abaikan */ }

  // Versi terbit yang lebih baru mengalahkan salinan lokal yang basi.
  const waktu = d => (d && d.meta && d.meta.diperbarui) ? Date.parse(d.meta.diperbarui) || 0 : 0;
  let dipakai = lokal;
  if (!lokal || (tertanam && waktu(tertanam) > waktu(lokal))) dipakai = tertanam;

  const d = gabung(dataKosong(), dipakai || {});

  // Dulu satu tempat hanya menyimpan satu foto sebagai teks. Sekarang daftar,
  // jadi data lama dinaikkan bentuknya di sini.
  (d.tempat || []).forEach(t => {
    if (typeof t.foto === 'string') t.foto = t.foto ? [t.foto] : [];
    else if (!Array.isArray(t.foto)) t.foto = [];
  });
  return d;
}

/** Daftar foto sebuah tempat, apa pun bentuk simpanannya. */
function daftarFoto(t) {
  const f = t && t.foto;
  if (Array.isArray(f)) return f.map(safeUrl).filter(Boolean);
  const s = safeUrl(f);
  return s ? [s] : [];
}

/** Gabung dangkal-rekursif: menjaga kunci baru tetap ada saat data lama dimuat. */
function gabung(dasar, atas) {
  if (Array.isArray(atas)) return atas.slice();
  if (atas && typeof atas === 'object' && !Array.isArray(dasar) && dasar && typeof dasar === 'object') {
    const out = Object.assign({}, dasar);
    for (const k of Object.keys(atas)) out[k] = gabung(dasar[k], atas[k]);
    return out;
  }
  return atas === undefined ? dasar : atas;
}

/* ── Keadaan global ───────────────────────────────────────── */
const S = {
  data: null,
  basemap: null,
  peta: null,
  lapis: {},            // nama → L.LayerGroup
  aktif: {},            // nama → boolean
  kategoriAktif: new Set(Object.keys(KATEGORI)),
  markerTempat: new Map(),
  admin: false,
  labelTempat: null,    // null = ikut peta dasar, true/false = paksaan pengguna
  fokusDesa: true,      // redupkan area di luar batas desa
  mode: null,           // null | 'tempat' | 'batas' | 'dusun' | 'ukur'
  cuaca: null,
  tabAktif: 'beranda'
};

function simpan(diamDiam, ringkasan) {
  S.data.meta.diperbarui = new Date().toISOString();
  S.data.meta.versiApl = APP.versi;

  // Bila pengelola sedang masuk, server yang jadi pegangan: datanya tersimpan
  // untuk semua orang, bukan cuma di perangkat ini. Salinan lokal tetap ditulis
  // sebagai jaring pengaman kalau jaringan putus di tengah jalan.
  if (typeof SERVER !== 'undefined' && SERVER.aktif) {
    simpanKeServer(ringkasan);
    if (!diamDiam) pesan('Perubahan tersimpan');
  } else if (!diamDiam) {
    pesan('Perubahan tersimpan di perangkat ini');
  }

  try {
    localStorage.setItem(APP.simpanan, JSON.stringify(S.data));
  } catch (e) {
    // Penyimpanan browser penuh bukan masalah bila server yang memegang data.
    if (!(typeof SERVER !== 'undefined' && SERVER.aktif)) {
      pesan('Gagal menyimpan — penyimpanan browser penuh atau diblokir', true);
    }
  }
}

function pesan(teks, buruk) {
  const w = $('#toast-wrap');
  if (!w) return;
  const t = document.createElement('div');
  t.className = 'toast' + (buruk ? ' bad' : '');
  t.textContent = teks;
  w.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 220); }, buruk ? 4200 : 2400);
}

function idBaru() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Nama → potongan alamat yang enak dibaca, untuk tautan berbagi. */
function slug(s) {
  return String(s || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Perkecil gambar lewat canvas — foto ponsel mentah terlalu besar untuk
    ditanam ke dalam berkas HTML. Mengembalikan data URI. */
function kecilkanGambar(file, maks, jenis, kualitas) {
  return new Promise((selesai, gagal) => {
    if (!/^image\//.test(file.type)) return gagal(new Error('Berkas itu bukan gambar'));
    const fr = new FileReader();
    fr.onerror = () => gagal(new Error('Berkas gagal dibaca'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => gagal(new Error('Gambar tidak terbaca'));
      img.onload = () => {
        const s = Math.min(1, maks / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * s));
        const h = Math.max(1, Math.round(img.height * s));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        if (jenis === 'image/jpeg') { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); }
        g.drawImage(img, 0, 0, w, h);
        try { selesai(c.toDataURL(jenis, kualitas)); }
        catch (e) { gagal(new Error('Gambar gagal diolah')); }
      };
      img.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  });
}

function teksUkuran(b) {
  return b < 1024 ? b + ' B'
       : b < 1048576 ? (b / 1024).toFixed(0) + ' KB'
       : (b / 1048576).toFixed(1) + ' MB';
}

/** "Desa Kote" dan "Kote" (nama OSM) harus dianggap tempat yang sama. */
const namaPendek = n => String(n || '').replace(/^(desa|kelurahan|kel\.|ds\.)\s+/i, '').trim().toLowerCase();
const desaIni = n => namaPendek(n) === namaPendek(S.data.meta.nama);

function warnaKategori(k) {
  const c = KATEGORI[k] || KATEGORI.lainnya;
  return getComputedStyle(document.documentElement).getPropertyValue(c.warna).trim() || '#888';
}
