/* ═══════════════════════════════════════════════════════════
   20 — Grafik: SVG tanpa pustaka luar
   Spesifikasi mark: batang ≤24px, ujung-data membulat 4px & siku
   di garis dasar; garis 2px; penanda ≥8px dengan cincin permukaan
   2px; grid rambut 1px solid; teks memakai token tinta, bukan
   warna seri.
   ═══════════════════════════════════════════════════════════ */

const VB_W = 320;            // lebar viewBox — tinggi dihitung per grafik
const TEBAL_BAR = 13;        // ≤ 24px
const R_UJUNG = 4;

/** Batang dengan ujung-data membulat; sisi garis dasar tetap siku. */
function jalurBar(x, y, w, h, arah) {
  const r = Math.min(R_UJUNG, Math.max(0, w), h / 2);
  if (w <= 0.6) return `M${x} ${y}h0.6v${h}h-0.6z`;
  return arah === 'kiri'
    ? `M${x} ${y}h${-(w - r)}a${r} ${r} 0 0 0 ${-r} ${r}v${h - 2 * r}a${r} ${r} 0 0 0 ${r} ${r}H${x}z`
    : `M${x} ${y}h${w - r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}H${x}z`;
}

function tip(label, nilai, satuan) {
  return esc(`${label}||${nilai == null ? '—' : NF.format(nilai)}${satuan ? ' ' + satuan : ''}`);
}

/** Skala sumbu "cantik": langkahnya rapat agar batang tidak terlihat kerdil
    saat nilai maksimum hanya sedikit di atas satu pangkat sepuluh. */
function batasRapi(maks) {
  if (!(maks > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(maks)));
  const n = maks / p;
  for (const s of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (n <= s) return s * p;
  return 10 * p;
}

function kosongGrafik(pesanTeks) {
  return `<div class="empty-state">
    ${ikon('M4.5 19.5V11M9.8 19.5V5.5M15.1 19.5v-6M20.4 19.5V8.5')}
    <b>Belum ada data</b><p>${esc(pesanTeks)}</p></div>`;
}

/* ── Batang horizontal, satu seri ─────────────────────────── */
/* Label di atas batang agar nama panjang tidak terpotong; setiap
   batang diberi label nilai, sehingga sumbu tidak diperlukan.    */
function grafikBatang(baris, opsi) {
  opsi = opsi || {};
  const data = baris.filter(b => b.v != null && isFinite(b.v));
  if (!data.length) return kosongGrafik(opsi.kosong || 'Isi angkanya lewat mode Kelola.');

  const maks = Math.max(...data.map(b => b.v), 1);
  const total = data.reduce((s, b) => s + b.v, 0);
  const warna = opsi.warna || 'var(--series-1)';
  const tinggiBaris = 32;
  const H = baris.length * tinggiBaris + 2;

  const isi = baris.map((b, i) => {
    const y = i * tinggiBaris;
    const ada = b.v != null && isFinite(b.v);
    const w = ada ? Math.max(0.6, (b.v / maks) * VB_W) : 0;
    const pct = (ada && total > 0) ? ` · ${angka1(b.v / total * 100)}%` : '';
    const nilaiTeks = ada ? NF.format(b.v) : '—';

    return `<g>
      <text class="ax-label" x="0" y="${y + 9}">${esc(b.l)}</text>
      <text class="val-label" x="${VB_W}" y="${y + 9}" text-anchor="end">${nilaiTeks}</text>
      <rect x="0" y="${y + 14}" width="${VB_W}" height="${TEBAL_BAR}" rx="2" fill="var(--grid)" opacity=".55"/>
      ${ada ? `<path d="${jalurBar(0, y + 14, w, TEBAL_BAR)}" fill="${warna}"/>` : ''}
      <rect x="0" y="${y}" width="${VB_W}" height="${tinggiBaris}" fill="transparent"
            data-tip="${tip(b.l, b.v, opsi.satuan)}${esc(pct)}"/>
    </g>`;
  }).join('');

  return wr(`<div class="chart"><svg viewBox="0 0 ${VB_W} ${H}" role="img"
      aria-label="${esc(opsi.judul || 'Grafik batang')}">${isi}</svg></div>`);
}

/* ── Piramida penduduk, dua seri ──────────────────────────── */
function grafikPiramida(baris, opsi) {
  opsi = opsi || {};
  const ada = baris.some(b => (b.lk != null && isFinite(b.lk)) || (b.pr != null && isFinite(b.pr)));
  if (!ada) return kosongGrafik('Isi jumlah laki-laki dan perempuan per kelompok umur.');

  const nilai = [];
  baris.forEach(b => { if (isFinite(b.lk)) nilai.push(b.lk); if (isFinite(b.pr)) nilai.push(b.pr); });
  const skalaMaks = batasRapi(Math.max(...nilai, 1));

  const tengah = 54;                       // kolom label umur
  const sayap = (VB_W - tengah) / 2;
  const xKiri = sayap, xKanan = sayap + tengah;
  const tinggiBaris = 22, padAtas = 4;
  const H = baris.length * tinggiBaris + padAtas + 30;

  // Label langsung hanya pada nilai terbesar tiap sisi — sisanya lewat sumbu & tooltip.
  const maxLk = Math.max(...baris.map(b => isFinite(b.lk) ? b.lk : -1));
  const maxPr = Math.max(...baris.map(b => isFinite(b.pr) ? b.pr : -1));

  const barisSvg = baris.map((b, i) => {
    const y = padAtas + i * tinggiBaris;
    const yb = y + (tinggiBaris - TEBAL_BAR) / 2;
    const wLk = isFinite(b.lk) ? Math.max(0.6, b.lk / skalaMaks * sayap) : 0;
    const wPr = isFinite(b.pr) ? Math.max(0.6, b.pr / skalaMaks * sayap) : 0;

    return `<g>
      ${isFinite(b.lk) ? `<path d="${jalurBar(xKiri, yb, wLk, TEBAL_BAR, 'kiri')}" fill="var(--series-1)"/>` : ''}
      ${isFinite(b.pr) ? `<path d="${jalurBar(xKanan, yb, wPr, TEBAL_BAR)}" fill="var(--series-2)"/>` : ''}
      <text class="ax-label" x="${xKiri + tengah / 2}" y="${y + tinggiBaris / 2 + 3.5}"
            text-anchor="middle" style="font-size:10.5px">${esc(b.l)}</text>
      ${b.lk === maxLk && isFinite(b.lk) ? `<text class="val-label" x="${xKiri - wLk - 4}" y="${y + tinggiBaris / 2 + 3.5}" text-anchor="end">${NF.format(b.lk)}</text>` : ''}
      ${b.pr === maxPr && isFinite(b.pr) ? `<text class="val-label" x="${xKanan + wPr + 4}" y="${y + tinggiBaris / 2 + 3.5}" text-anchor="start">${NF.format(b.pr)}</text>` : ''}
      <rect x="0" y="${y}" width="${xKiri + tengah / 2}" height="${tinggiBaris}" fill="transparent"
            data-tip="${tip('Laki-laki ' + b.l, b.lk, 'jiwa')}"/>
      <rect x="${xKiri + tengah / 2}" y="${y}" width="${VB_W - xKiri - tengah / 2}" height="${tinggiBaris}" fill="transparent"
            data-tip="${tip('Perempuan ' + b.l, b.pr, 'jiwa')}"/>
    </g>`;
  }).join('');

  const yDasar = padAtas + baris.length * tinggiBaris;
  const ticks = [0, .5, 1].map(f => {
    const v = skalaMaks * f;
    return `<text class="ax-tick" x="${xKiri - sayap * f}" y="${yDasar + 13}" text-anchor="middle">${ringkas(v)}</text>
            <text class="ax-tick" x="${xKanan + sayap * f}" y="${yDasar + 13}" text-anchor="middle">${ringkas(v)}</text>`;
  }).join('');

  return wr(`<div class="chart"><svg viewBox="0 0 ${VB_W} ${H}" role="img" aria-label="Piramida penduduk menurut umur">
      <line class="baseline" x1="0" y1="${yDasar + 1}" x2="${xKiri}" y2="${yDasar + 1}"/>
      <line class="baseline" x1="${xKanan}" y1="${yDasar + 1}" x2="${VB_W}" y2="${yDasar + 1}"/>
      ${barisSvg}${ticks}
    </svg></div>`)
    + `<div class="legend-row">
      <span><i style="background:var(--series-1)"></i>Laki-laki</span>
      <span><i style="background:var(--series-2)"></i>Perempuan</span>
    </div>`;
}

/* ── Garis (suhu) ─────────────────────────────────────────── */
function grafikGaris(titik, opsi) {
  opsi = opsi || {};
  const data = titik.filter(t => t.v != null && isFinite(t.v));
  if (data.length < 2) return '';

  const H = 96, padK = 4, padA = 14, padB = 20;
  const nilai = data.map(t => t.v);
  let lo = Math.min(...nilai), hi = Math.max(...nilai);
  if (hi - lo < 1) { hi += .5; lo -= .5; }
  const rentang = hi - lo;
  const X = i => padK + i * (VB_W - padK * 2) / (data.length - 1);
  const Y = v => padA + (1 - (v - lo) / rentang) * (H - padA - padB);

  const d = data.map((t, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(t.v).toFixed(1)}`).join('');
  const warna = opsi.warna || 'var(--series-1)';

  const iMax = nilai.indexOf(hi);
  const titikSvg = data.map((t, i) =>
    `<circle cx="${X(i).toFixed(1)}" cy="${Y(t.v).toFixed(1)}" r="${i === iMax ? 4.5 : 3}"
              fill="${warna}" stroke="var(--surface-1)" stroke-width="2"/>`).join('');

  // Hanya titik tertinggi yang diberi label — ruang di bawah kurva sudah
  // dipakai tanda sumbu, dan nilai selengkapnya ada di daftar harian.
  const xMax = Math.min(Math.max(X(iMax), 16), VB_W - 16);
  const label = `<text class="val-label" x="${xMax.toFixed(1)}" y="${(Y(hi) - 9).toFixed(1)}"
              text-anchor="middle">${angka1(hi)}${esc(opsi.satuan || '')}</text>`;

  const sumbuX = data.map((t, i) =>
    `<text class="ax-tick" x="${X(i).toFixed(1)}" y="${H - 4}" text-anchor="middle">${esc(t.l)}</text>
     <rect x="${(X(i) - 16).toFixed(1)}" y="0" width="32" height="${H - 14}" fill="transparent"
           data-tip="${tip(t.tip || t.l, t.v, opsi.satuan)}"/>`).join('');

  return wr(`<div class="chart"><svg viewBox="0 0 ${VB_W} ${H}" role="img" aria-label="${esc(opsi.judul || 'Grafik garis')}">
      <path d="${d}" fill="none" stroke="${warna}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${titikSvg}${label}${sumbuX}
    </svg></div>`);
}

/* ── Kolom (curah hujan) ──────────────────────────────────── */
function grafikKolom(titik, opsi) {
  opsi = opsi || {};
  const data = titik.filter(t => t.v != null && isFinite(t.v));
  if (!data.length) return '';

  const H = 78, padB = 18, padA = 12;
  const maks = batasRapi(Math.max(...data.map(t => t.v), 1));
  const slot = VB_W / data.length;
  const lebar = Math.min(24, slot - 8);          // ≤24px, sisanya jadi udara
  const warna = opsi.warna || 'var(--series-1)';
  const dasar = H - padB;

  const kol = data.map((t, i) => {
    const x = i * slot + (slot - lebar) / 2;
    const h = t.v > 0 ? Math.max(1.5, (t.v / maks) * (dasar - padA)) : 0;
    const y = dasar - h;
    const r = Math.min(R_UJUNG, lebar / 2, h);
    const jalur = h > 0
      ? `M${x} ${dasar}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}h${lebar - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}V${dasar}z`
      : '';
    return `<g>
      ${jalur ? `<path d="${jalur}" fill="${warna}"/>` : ''}
      <text class="ax-tick" x="${x + lebar / 2}" y="${H - 5}" text-anchor="middle">${esc(t.l)}</text>
      <rect x="${i * slot}" y="0" width="${slot}" height="${dasar}" fill="transparent"
            data-tip="${tip(t.tip || t.l, t.v, opsi.satuan)}"/>
    </g>`;
  }).join('');

  return wr(`<div class="chart"><svg viewBox="0 0 ${VB_W} ${H}" role="img" aria-label="${esc(opsi.judul || 'Grafik kolom')}">
      <text class="ax-tick" x="0" y="${padA - 3}">${ringkas(maks)}${esc(opsi.satuan || '')}</text>
      <line class="gridline" x1="0" y1="${padA}" x2="${VB_W}" y2="${padA}"/>
      <line class="baseline" x1="0" y1="${dasar}" x2="${VB_W}" y2="${dasar}"/>
      ${kol}
    </svg></div>`);
}

/* ── Tampilan tabel (jaminan akses tanpa warna) ───────────── */
function tabelStat(baris, kolom) {
  const th = kolom.map(k => `<th>${esc(k.l)}</th>`).join('');
  const tr = baris.map(b => `<tr>${kolom.map(k => `<td>${k.f ? k.f(b) : esc(b[k.k] == null ? '—' : NF.format(b[k.k]))}</td>`).join('')}</tr>`).join('');
  return `<table class="dt"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

/** Grafik + pengalih "Tabel", dibungkus satu kartu. */
function kartuGrafik(judul, isiGrafik, isiTabel, catatan) {
  const id = 'c' + Math.random().toString(36).slice(2, 8);
  return `<div class="card">
    <div class="chart-head">
      <h3>${esc(judul)}</h3>
      ${isiTabel ? `<button class="chart-note" data-toggle-tabel="${id}" style="background:none;border:0;cursor:pointer;text-decoration:underline">Tabel</button>` : ''}
    </div>
    ${catatan ? `<p class="chart-note" style="margin-bottom:8px">${esc(catatan)}</p>` : ''}
    <div data-gr="${id}">${isiGrafik}</div>
    ${isiTabel ? `<div data-tb="${id}" hidden>${isiTabel}</div>` : ''}
  </div>`;
}

/* ── Tooltip global (delegasi — tahan render ulang) ───────── */
let elTip = null;
function siapkanTooltip() {
  elTip = document.createElement('div');
  elTip.className = 'chart-tip';
  document.body.appendChild(elTip);

  document.addEventListener('mouseover', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) return;
    const [label, nilai] = t.getAttribute('data-tip').split('||');
    elTip.innerHTML = `${esc(label)} — <b>${esc(nilai)}</b>`;
    elTip.style.opacity = '1';
  });
  document.addEventListener('mousemove', e => {
    if (elTip.style.opacity !== '1') return;
    const r = elTip.getBoundingClientRect();
    let x = e.clientX + 12, y = e.clientY - r.height - 8;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 12;
    if (y < 8) y = e.clientY + 16;
    elTip.style.left = x + 'px';
    elTip.style.top = y + 'px';
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest && e.target.closest('[data-tip]')) elTip.style.opacity = '0';
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-toggle-tabel]');
    if (!b) return;
    const id = b.dataset.toggleTabel;
    const gr = $(`[data-gr="${id}"]`), tb = $(`[data-tb="${id}"]`);
    const keTabel = !tb.hidden ? false : true;
    tb.hidden = !keTabel; gr.hidden = keTabel;
    b.textContent = keTabel ? 'Grafik' : 'Tabel';
  });
}
