/* ═══════════════════════════════════════════════════════════
   25 — Kode QR (mode byte, koreksi galat M, versi 1–10)

   Ditulis sendiri karena berkas ini tidak boleh memanggil pustaka
   luar. Cakupannya sengaja dibatasi versi 1–10: cukup untuk 213
   karakter, jauh di atas panjang alamat web desa.
   ═══════════════════════════════════════════════════════════ */

/* [jml codeword EC per blok, [[jml blok, jml codeword data per blok], …]] */
const QR_M = {
  1:  [10, [[1, 16]]],
  2:  [16, [[1, 28]]],
  3:  [26, [[1, 44]]],
  4:  [18, [[2, 32]]],
  5:  [24, [[2, 43]]],
  6:  [16, [[4, 27]]],
  7:  [18, [[4, 31]]],
  8:  [22, [[2, 38], [2, 39]]],
  9:  [22, [[3, 36], [2, 37]]],
  10: [26, [[4, 43], [1, 44]]]
};

const QR_SELARAS = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
};

/* ── Aritmetika GF(256), polinom pembangkit 0x11d ─────────── */
const GF_EXP = new Uint8Array(512), GF_LOG = new Uint8Array(256);
(function () {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x; GF_LOG[x] = i;
    x <<= 1; if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

const gfKali = (a, b) => (a && b) ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0;

/** Polinom pembangkit Reed-Solomon, koefisien derajat menurun. */
function rsPembangkit(derajat) {
  let p = [1];                       // p[0] = suku tetap (derajat menaik)
  for (let i = 0; i < derajat; i++) {
    const q = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) {
      q[j] ^= gfKali(p[j], GF_EXP[i]);
      q[j + 1] ^= p[j];
    }
    p = q;
  }
  return p.reverse();                // jadikan derajat menurun, p[0] = 1
}

function rsSandi(data, panjangEC) {
  const g = rsPembangkit(panjangEC);
  const sisa = new Array(data.length + panjangEC).fill(0);
  for (let i = 0; i < data.length; i++) sisa[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const k = sisa[i];
    if (!k) continue;
    for (let j = 1; j <= panjangEC; j++) sisa[i + j] ^= gfKali(g[j], k);
  }
  return sisa.slice(data.length);
}

/* ── BCH untuk informasi format & versi ───────────────────── */
function bchFormat(d) {
  let v = d << 10;
  for (let i = 14; i >= 10; i--) if ((v >> i) & 1) v ^= 0x537 << (i - 10);
  return (((d << 10) | v) ^ 0x5412) & 0x7fff;
}

function bchVersi(v) {
  let r = v << 12;
  for (let i = 17; i >= 12; i--) if ((r >> i) & 1) r ^= 0x1f25 << (i - 12);
  return ((v << 12) | r) & 0x3ffff;
}

/* ── Penyandian data ──────────────────────────────────────── */
function qrBytes(teks) {
  return Array.from(new TextEncoder().encode(teks));
}

function qrKapasitas(versi) {
  return QR_M[versi][1].reduce((s, [n, d]) => s + n * d, 0);
}

function qrPilihVersi(jmlByte) {
  for (let v = 1; v <= 10; v++) {
    const bitHitung = v < 10 ? 8 : 16;
    const perlu = Math.ceil((4 + bitHitung + jmlByte * 8) / 8);
    if (perlu <= qrKapasitas(v)) return v;
  }
  return null;
}

function qrCodeword(teks, versi) {
  const data = qrBytes(teks);
  const kapasitas = qrKapasitas(versi);
  const bitHitung = versi < 10 ? 8 : 16;

  const bit = [];
  const tulis = (nilai, n) => { for (let i = n - 1; i >= 0; i--) bit.push((nilai >> i) & 1); };

  tulis(0b0100, 4);                    // penanda mode byte
  tulis(data.length, bitHitung);
  data.forEach(b => tulis(b, 8));

  const maksBit = kapasitas * 8;
  for (let i = 0; i < 4 && bit.length < maksBit; i++) bit.push(0);   // terminator
  while (bit.length % 8) bit.push(0);

  const cw = [];
  for (let i = 0; i < bit.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bit[i + j];
    cw.push(b);
  }
  const isian = [0xec, 0x11];
  for (let i = 0; cw.length < kapasitas; i++) cw.push(isian[i % 2]);

  // Pecah jadi blok, hitung EC, lalu selang-seling sesuai spesifikasi
  const [ecPerBlok, susunan] = QR_M[versi];
  const blokData = [], blokEC = [];
  let p = 0;
  susunan.forEach(([jml, panjang]) => {
    for (let i = 0; i < jml; i++) {
      const d = cw.slice(p, p + panjang); p += panjang;
      blokData.push(d);
      blokEC.push(rsSandi(d, ecPerBlok));
    }
  });

  const hasil = [];
  const maksData = Math.max(...blokData.map(b => b.length));
  for (let i = 0; i < maksData; i++) blokData.forEach(b => { if (i < b.length) hasil.push(b[i]); });
  for (let i = 0; i < ecPerBlok; i++) blokEC.forEach(b => hasil.push(b[i]));
  return hasil;
}

/* ── Penyusunan matriks ───────────────────────────────────── */
function qrMatriks(teks, topengPaksa) {
  const versi = qrPilihVersi(qrBytes(teks).length);
  if (!versi) return null;                      // terlalu panjang untuk versi 1–10

  const n = 17 + 4 * versi;
  const m = Array.from({ length: n }, () => new Array(n).fill(null));   // null = belum diisi
  const fungsi = Array.from({ length: n }, () => new Array(n).fill(false));

  const set = (r, c, v) => { m[r][c] = v ? 1 : 0; fungsi[r][c] = true; };

  // Pola pencari + pemisah
  [[0, 0], [0, n - 7], [n - 7, 0]].forEach(([br, bc]) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = br + r, cc = bc + c;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
      const luar = (r === 0 || r === 6) && c >= 0 && c <= 6;
      const tepi = (c === 0 || c === 6) && r >= 0 && r <= 6;
      const inti = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      set(rr, cc, luar || tepi || inti);
    }
  });

  // Pola waktu
  for (let i = 8; i < n - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }

  // Pola penyelaras
  const pusat = QR_SELARAS[versi];
  pusat.forEach(r => pusat.forEach(c => {
    if ((r <= 8 && c <= 8) || (r <= 8 && c >= n - 9) || (r >= n - 9 && c <= 8)) return;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  }));

  set(n - 8, 8, 1);                              // modul gelap tetap

  // Sisakan tempat informasi format
  for (let i = 0; i < 9; i++) {
    if (!fungsi[8][i]) set(8, i, 0);
    if (!fungsi[i][8]) set(i, 8, 0);
  }
  for (let i = 0; i < 8; i++) {
    if (!fungsi[8][n - 1 - i]) set(8, n - 1 - i, 0);
    if (!fungsi[n - 1 - i][8]) set(n - 1 - i, 8, 0);
  }

  // Informasi versi (versi 7 ke atas)
  if (versi >= 7) {
    const vi = bchVersi(versi);
    for (let i = 0; i < 18; i++) {
      const b = (vi >> i) & 1;
      set(Math.floor(i / 3), n - 11 + (i % 3), b);
      set(n - 11 + (i % 3), Math.floor(i / 3), b);
    }
  }

  // Penempatan data: zigzag dari kanan bawah, lompati kolom waktu
  const cw = qrCodeword(teks, versi);
  let bitIdx = 0;
  const bitBerikut = () => {
    const i = bitIdx++;
    return (i >> 3) < cw.length ? (cw[i >> 3] >> (7 - (i & 7))) & 1 : 0;
  };

  let naik = true;
  for (let kanan = n - 1; kanan > 0; kanan -= 2) {
    if (kanan === 6) kanan = 5;
    for (let langkah = 0; langkah < n; langkah++) {
      const r = naik ? n - 1 - langkah : langkah;
      for (let d = 0; d < 2; d++) {
        const c = kanan - d;
        if (fungsi[r][c]) continue;
        m[r][c] = bitBerikut();
      }
    }
    naik = !naik;
  }

  // Pilih topeng dengan denda terkecil
  let terbaik = null, dendaTerbaik = Infinity;
  for (let topeng = topengPaksa == null ? 0 : topengPaksa;
       topeng < (topengPaksa == null ? 8 : topengPaksa + 1); topeng++) {
    const uji = qrTerapkanTopeng(m, fungsi, n, topeng);
    qrTulisFormat(uji, fungsi, n, topeng);
    const d = qrDenda(uji, n);
    if (d < dendaTerbaik) { dendaTerbaik = d; terbaik = uji; }
  }
  return terbaik;
}

const QR_TOPENG = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
];

function qrTerapkanTopeng(m, fungsi, n, topeng) {
  const f = QR_TOPENG[topeng];
  return m.map((baris, r) => baris.map((v, c) => (!fungsi[r][c] && f(r, c)) ? v ^ 1 : v));
}

function qrTulisFormat(m, fungsi, n, topeng) {
  const bits = bchFormat((0b00 << 3) | topeng);      // 00 = tingkat koreksi M
  for (let i = 0; i < 15; i++) {
    const b = (bits >> (14 - i)) & 1;                // posisi ke-0 memuat bit tertinggi
    // Salinan pertama, mengelilingi pola pencari kiri atas
    if (i < 6) m[8][i] = b;
    else if (i === 6) m[8][7] = b;
    else if (i === 7) m[8][8] = b;
    else if (i === 8) m[7][8] = b;
    else m[14 - i][8] = b;
    // Salinan kedua — hanya 7 modul di kolom 8, sebab (n-8, 8) adalah
    // modul gelap tetap dan bukan bagian informasi format.
    if (i < 7) m[n - 1 - i][8] = b;
    else m[8][n - 15 + i] = b;
  }
}

function qrDenda(m, n) {
  let denda = 0;

  // Aturan 1 — deretan lima modul sewarna atau lebih
  for (let i = 0; i < n; i++) {
    for (const arah of [0, 1]) {
      let jml = 1, sebelum = -1;
      for (let j = 0; j < n; j++) {
        const v = arah ? m[j][i] : m[i][j];
        if (v === sebelum) { jml++; }
        else { if (jml >= 5) denda += 3 + (jml - 5); jml = 1; sebelum = v; }
      }
      if (jml >= 5) denda += 3 + (jml - 5);
    }
  }

  // Aturan 2 — blok 2×2 sewarna
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
    const v = m[r][c];
    if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) denda += 3;
  }

  // Aturan 3 — pola mirip pencari
  const p1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const p2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  for (let i = 0; i < n; i++) for (let j = 0; j <= n - 11; j++) {
    for (const arah of [0, 1]) {
      let c1 = true, c2 = true;
      for (let k = 0; k < 11; k++) {
        const v = arah ? m[j + k][i] : m[i][j + k];
        if (v !== p1[k]) c1 = false;
        if (v !== p2[k]) c2 = false;
      }
      if (c1) denda += 40;
      if (c2) denda += 40;
    }
  }

  // Aturan 4 — penyimpangan dari perbandingan gelap-terang 50%
  let gelap = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) gelap++;
  const persen = gelap * 100 / (n * n);
  denda += Math.floor(Math.abs(persen - 50) / 5) * 10;

  return denda;
}

/* ── Keluaran ─────────────────────────────────────────────── */
/** SVG — tajam di layar maupun cetak, tanpa gambar raster. */
function qrSVG(teks, opsi) {
  opsi = opsi || {};
  const m = qrMatriks(teks);
  if (!m) return '';
  const n = m.length, tepi = opsi.tepi == null ? 4 : opsi.tepi;
  const total = n + tepi * 2;

  let jalur = '';
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!m[r][c]) { c++; continue; }
      let lebar = 1;
      while (c + lebar < n && m[r][c + lebar]) lebar++;
      jalur += `M${c + tepi} ${r + tepi}h${lebar}v1h-${lebar}z`;
      c += lebar;
    }
  }

  return `<svg viewBox="0 0 ${total} ${total}" width="${opsi.ukuran || 180}" height="${opsi.ukuran || 180}"
      shape-rendering="crispEdges" role="img" aria-label="Kode QR ${esc(teks)}">
      <rect width="${total}" height="${total}" fill="${opsi.terang || '#ffffff'}"/>
      <path d="${jalur}" fill="${opsi.gelap || '#000000'}"/>
    </svg>`;
}

/** PNG untuk diunduh dan dicetak. */
function qrPNG(teks, piksel) {
  const m = qrMatriks(teks);
  if (!m) return null;
  const n = m.length, tepi = 4, skala = Math.max(1, Math.round((piksel || 640) / (n + tepi * 2)));
  const sisi = (n + tepi * 2) * skala;

  const c = document.createElement('canvas');
  c.width = c.height = sisi;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, sisi, sisi);
  g.fillStyle = '#000000';
  for (let r = 0; r < n; r++) for (let x = 0; x < n; x++) {
    if (m[r][x]) g.fillRect((x + tepi) * skala, (r + tepi) * skala, skala, skala);
  }
  return c.toDataURL('image/png');
}
