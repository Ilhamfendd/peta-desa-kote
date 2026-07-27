/* ═══════════════════════════════════════════════════════════
   40 — Cuaca: Open-Meteo (tanpa kunci API)
   ═══════════════════════════════════════════════════════════ */

const TEKS_CUACA = {
  0: 'Cerah', 1: 'Cerah berawan', 2: 'Berawan sebagian', 3: 'Berawan',
  45: 'Berkabut', 48: 'Kabut beku',
  51: 'Gerimis ringan', 53: 'Gerimis', 55: 'Gerimis lebat',
  56: 'Gerimis beku', 57: 'Gerimis beku lebat',
  61: 'Hujan ringan', 63: 'Hujan sedang', 65: 'Hujan lebat',
  66: 'Hujan beku', 67: 'Hujan beku lebat',
  71: 'Salju ringan', 73: 'Salju', 75: 'Salju lebat', 77: 'Butiran salju',
  80: 'Hujan lokal', 81: 'Hujan lokal sedang', 82: 'Hujan lokal lebat',
  85: 'Hujan salju lokal', 86: 'Hujan salju lebat',
  95: 'Badai petir', 96: 'Badai petir & es', 99: 'Badai petir & es lebat'
};

const P_MATAHARI = 'M12 16.4a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8zM12 2.4v2.3M12 19.3v2.3M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.4 12h2.3M19.3 12h2.3M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7';
const P_BULAN    = 'M20.5 14.4A8.6 8.6 0 0 1 9.6 3.5a8.8 8.8 0 1 0 10.9 10.9z';
const P_AWAN     = 'M7.4 19h9.4a3.9 3.9 0 0 0 .4-7.8 5.8 5.8 0 0 0-11.1-1.3A4 4 0 0 0 7.4 19z';
const P_SEBAGIAN = 'M16.6 9.4a5 5 0 1 0-8.2-4.6M6.8 19.4h8.6a3.6 3.6 0 0 0 .3-7.2 5.3 5.3 0 0 0-10.2-1.2 3.7 3.7 0 0 0 1.3 8.4z';
const P_HUJAN    = P_AWAN + 'M8.6 21.4l-.9 1.8M12.4 21.4l-.9 1.8M16.2 21.4l-.9 1.8';
const P_PETIR    = P_AWAN + 'M12.8 20.6l-2.4 3.2h3l-2 2.8';
const P_KABUT    = 'M4 9.5h16M6 13.5h12M4 17.5h11M8 5.5h9';

function ikonCuaca(k, siang) {
  let p;
  if (k === 0)            p = siang === 0 ? P_BULAN : P_MATAHARI;
  else if (k <= 2)        p = siang === 0 ? P_BULAN : P_SEBAGIAN;
  else if (k === 3)       p = P_AWAN;
  else if (k <= 48)       p = P_KABUT;
  else if (k <= 67)       p = P_HUJAN;
  else if (k <= 77)       p = P_AWAN;
  else if (k <= 86)       p = P_HUJAN;
  else                    p = P_PETIR;
  return ikon(p);
}

const ARAH_ANGIN = ['Utara', 'Timur laut', 'Timur', 'Tenggara', 'Selatan', 'Barat daya', 'Barat', 'Barat laut'];
const arahAngin = d => (d == null) ? '—' : ARAH_ANGIN[Math.round(((d % 360) / 45)) % 8];

/** Skala Beaufort ringkas — penting untuk nelayan. */
function beaufort(kmh) {
  if (kmh == null) return '—';
  const b = [[1, 'Tenang'], [5, 'Sepoi'], [11, 'Lemah'], [19, 'Sedang'],
             [28, 'Agak kuat'], [38, 'Kuat'], [49, 'Sangat kuat'], [61, 'Ribut']];
  for (const [v, t] of b) if (kmh < v) return t;
  return 'Badai';
}

/* ── Gelombang laut ───────────────────────────────────────────
   Batas tingginya mengikuti skala BMKG. Warna berasal dari palet
   status dan selalu ditemani ikon serta teks, tidak pernah warna
   saja — supaya tetap terbaca bagi yang sulit membedakan warna. */
const SKALA_GELOMBANG = [
  { maks: 0.5,      label: 'Tenang',         status: 'good',     saran: 'Aman untuk perahu nelayan.' },
  { maks: 1.25,     label: 'Rendah',         status: 'good',     saran: 'Umumnya aman untuk perahu nelayan.' },
  { maks: 2.5,      label: 'Sedang',         status: 'warning',  saran: 'Waspada untuk perahu kecil dan sampan.' },
  { maks: 4.0,      label: 'Tinggi',         status: 'serious',  saran: 'Berbahaya bagi perahu nelayan dan kapal kecil.' },
  { maks: 6.0,      label: 'Sangat tinggi',  status: 'critical', saran: 'Berbahaya bagi hampir semua kapal. Sebaiknya tidak melaut.' },
  { maks: Infinity, label: 'Ekstrem',        status: 'critical', saran: 'Sangat berbahaya. Jangan melaut.' }
];

const IKON_STATUS = {
  good:     'M5 12.5l4.5 4.5L19 7.5',
  warning:  'M12 8.4v5M12 16.6h.01M10.3 4.2L2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z',
  serious:  'M12 8.4v5M12 16.6h.01M10.3 4.2L2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z',
  critical: 'M12 7.6v5.6M12 16.8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z'
};

function statusGelombang(m) {
  if (m == null || !isFinite(m)) return null;
  const s = SKALA_GELOMBANG.find(x => m < x.maks) || SKALA_GELOMBANG[SKALA_GELOMBANG.length - 1];
  return Object.assign({ tinggi: m, perhatian: s.status !== 'good' }, s);
}

/** Spanduk peringatan; ikon + teks selalu ikut, bukan warna saja. */
function spandukGelombang(s, ringkas) {
  if (!s) return '';
  const w = `var(--${s.status})`;
  return `<div style="display:flex;gap:9px;align-items:flex-start;padding:10px 12px;border-radius:var(--radius);
       background:color-mix(in srgb, ${w} 13%, transparent); border-left:3px solid ${w};margin-bottom:12px">
      <span style="color:${w};flex:none;margin-top:1px">${ikon(IKON_STATUS[s.status])}</span>
      <span style="min-width:0">
        <b style="display:block;font-size:12.5px">Gelombang ${esc(s.label.toLowerCase())} · ${angka2(s.tinggi)} m</b>
        <span style="font-size:12px;color:var(--ink-2);line-height:1.45">${esc(s.saran)}</span>
      </span>
    </div>`;
}

/* ── Pengambilan data ─────────────────────────────────────── */
const CACHE_CUACA = APP.simpanan + '/cuaca';
const UMUR_CACHE = 20 * 60 * 1000;

async function ambilCuaca(paksa) {
  const [lat, lon] = S.data.meta.pusat || APP.pusat;

  if (!paksa) {
    try {
      const c = JSON.parse(sessionStorage.getItem(CACHE_CUACA) || 'null');
      if (c && Date.now() - c.t < UMUR_CACHE) { terapkanCuaca(c.d, c.m); return; }
    } catch (e) { /* cache rusak — ambil ulang */ }
  }

  const qs = new URLSearchParams({
    latitude: lat.toFixed(4), longitude: lon.toFixed(4), timezone: 'Asia/Jakarta', forecast_days: '7',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day,surface_pressure',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,uv_index_max'
  });
  const qsLaut = new URLSearchParams({
    latitude: lat.toFixed(4), longitude: lon.toFixed(4), timezone: 'Asia/Jakarta', forecast_days: '7',
    current: 'wave_height,wave_period,wave_direction', daily: 'wave_height_max'
  });

  try {
    const [r1, r2] = await Promise.allSettled([
      fetch('https://api.open-meteo.com/v1/forecast?' + qs).then(r => r.ok ? r.json() : Promise.reject(r.status)),
      fetch('https://marine-api.open-meteo.com/v1/marine?' + qsLaut).then(r => r.ok ? r.json() : Promise.reject(r.status))
    ]);
    if (r1.status !== 'fulfilled') throw r1.reason;

    const d = r1.value;
    const m = r2.status === 'fulfilled' ? r2.value : null;
    try { sessionStorage.setItem(CACHE_CUACA, JSON.stringify({ t: Date.now(), d, m })); } catch (e) {}
    terapkanCuaca(d, m);
  } catch (e) {
    S.cuaca = { gagal: true };
    gambarUlang('cuaca');
    gambarUlang('beranda');
  }
}

function terapkanCuaca(d, m) {
  const c = d.current || {};
  S.cuaca = {
    suhu: c.temperature_2m, terasa: c.apparent_temperature, lembap: c.relative_humidity_2m,
    hujan: c.precipitation, kode: c.weather_code, angin: c.wind_speed_10m, arah: c.wind_direction_10m,
    siang: c.is_day, tekanan: c.surface_pressure, waktu: c.time,
    harian: d.daily || null, laut: m || null,
    lautKini: m && m.current ? m.current : null,
    // Model gelombang global memakai petak laut terdekat, bukan titik desa —
    // jaraknya ditampilkan supaya pembaca tahu persis datanya dari mana.
    lautJarak: m ? jarak(S.data.meta.pusat || APP.pusat, [m.latitude, m.longitude]) : null
  };
  gambarUlang('cuaca');
  gambarUlang('beranda');
}

/* ── Panel ────────────────────────────────────────────────── */
function panelCuaca() {
  const c = S.cuaca;

  if (!c) {
    return `<div class="p-head"><h2>Cuaca</h2><p>Prakiraan untuk titik pusat Desa Kote</p></div>
      <div class="card"><div class="wx-now">
        <div class="wx-ico skel" style="border-radius:50%"></div>
        <div><div class="wx-temp skel">00°</div><div class="wx-desc skel">Memuat</div></div>
      </div></div>`;
  }

  if (c.gagal) {
    return `<div class="p-head"><h2>Cuaca</h2><p>Prakiraan untuk titik pusat Desa Kote</p></div>
      <div class="empty-state">
        ${ikon(P_AWAN)}<b>Data cuaca tidak bisa diambil</b>
        <p>Perlu koneksi internet. Bagian lain dari peta ini tetap berfungsi tanpa jaringan.</p>
      </div>
      <div class="btn-row" style="margin-top:12px"><button class="btn wide" data-muat-cuaca>Coba lagi</button></div>`;
  }

  const h = c.harian || {};
  const hari = (h.time || []).map((t, i) => ({
    t, i,
    kode: h.weather_code[i], maks: h.temperature_2m_max[i], min: h.temperature_2m_min[i],
    hujan: h.precipitation_sum[i], peluang: h.precipitation_probability_max ? h.precipitation_probability_max[i] : null,
    angin: h.wind_speed_10m_max ? h.wind_speed_10m_max[i] : null,
    gelombang: c.laut && c.laut.daily ? c.laut.daily.wave_height_max[i] : null
  }));

  const labelHari = t => { const d = new Date(t + 'T00:00'); return HARI[d.getDay()]; };

  const daftarHari = hari.map((d, i) => {
    const bagian = [];
    if (d.hujan > 0) bagian.push(angka1(d.hujan) + ' mm');
    if (d.peluang) bagian.push(d.peluang + '%');
    return `
    <div class="wx-day">
      <span class="d">${i === 0 ? 'Hari ini' : esc(labelHari(d.t))}</span>
      <span class="i" title="${esc(TEKS_CUACA[d.kode] || '')}">${ikonCuaca(d.kode, 1)}</span>
      <span class="r">${esc(bagian.join(' · '))}</span>
      <span class="t">${angka1(d.maks)}° <span style="color:var(--muted)">${angka1(d.min)}°</span></span>
    </div>`;
  }).join('');

  const grafikSuhu = grafikGaris(
    hari.map((d, i) => ({ l: i === 0 ? 'Kini' : labelHari(d.t), v: d.maks, tip: 'Suhu maks ' + tanggal(d.t) })),
    { satuan: '°C', judul: 'Suhu maksimum harian' });

  const grafikHujan = grafikKolom(
    hari.map((d, i) => ({ l: i === 0 ? 'Kini' : labelHari(d.t), v: d.hujan, tip: 'Curah hujan ' + tanggal(d.t) })),
    { satuan: ' mm', judul: 'Curah hujan harian', warna: 'var(--series-1)' });

  const lk = c.lautKini;
  const sKini = lk ? statusGelombang(lk.wave_height) : null;

  // Puncak gelombang sepekan — yang paling menentukan rencana melaut
  const puncak = hari.reduce((a, d) => (d.gelombang != null && (!a || d.gelombang > a.v))
    ? { v: d.gelombang, t: d.t } : a, null);
  const sPuncak = puncak ? statusGelombang(puncak.v) : null;

  const kartuLaut = lk ? `
    <div class="card">
      <h3>Kondisi laut</h3>
      ${sPuncak && sPuncak.perhatian && puncak.v > (lk.wave_height || 0) ? `
        <p class="chart-note" style="margin:-4px 0 11px">
          Puncak sepekan ${angka2(puncak.v)} m pada ${esc(tanggal(puncak.t))} — ${esc(sPuncak.label.toLowerCase())}.</p>` : ''}
      <div class="wx-grid" style="margin-top:0;padding-top:0;border-top:0">
        <div><span class="k">Tinggi gelombang</span><span class="v">${angka2(lk.wave_height)} m</span></div>
        <div><span class="k">Periode</span><span class="v">${angka1(lk.wave_period)} s</span></div>
        <div><span class="k">Arah gelombang</span><span class="v">${esc(arahAngin(lk.wave_direction))}</span></div>
        <div><span class="k">Angin</span><span class="v">${angka1(c.angin)} km/j</span></div>
      </div>
      ${hari.some(d => d.gelombang != null) ? `<div style="margin-top:12px">${grafikKolom(
        hari.map((d, i) => ({ l: i === 0 ? 'Kini' : labelHari(d.t), v: d.gelombang, tip: 'Gelombang maks ' + tanggal(d.t) })),
        { satuan: ' m', judul: 'Tinggi gelombang maksimum', warna: 'var(--series-3)' })}</div>` : ''}
      <p class="chart-note" style="margin-top:8px">
        Skala mengikuti BMKG. Angkanya dari model gelombang global pada petak laut terdekat${
          c.lautJarak ? ` (± ${teksJarak(c.lautJarak)} dari pusat desa)` : ''} — gambaran umum,
        <b>bukan pengganti peringatan dini BMKG</b>.</p>
    </div>` : '';

  const terbit = h.sunrise ? h.sunrise[0].slice(11, 16) : null;
  const terbenam = h.sunset ? h.sunset[0].slice(11, 16) : null;

  return `
    <div class="p-head"><h2>Cuaca</h2><p>Prakiraan untuk titik pusat ${esc(S.data.meta.nama)}</p></div>

    ${spandukGelombang(sKini)}

    <div class="card">
      <div class="wx-now">
        <div class="wx-ico">${ikonCuaca(c.kode, c.siang)}</div>
        <div>
          <div class="wx-temp">${angka1(c.suhu)}°</div>
          <div class="wx-desc">${esc(TEKS_CUACA[c.kode] || 'Tidak diketahui')} · terasa ${angka1(c.terasa)}°</div>
        </div>
      </div>
      <div class="wx-grid">
        <div><span class="k">Kelembapan</span><span class="v">${angka1(c.lembap)}%</span></div>
        <div><span class="k">Angin</span><span class="v">${angka1(c.angin)} km/j</span></div>
        <div><span class="k">Arah angin</span><span class="v">${esc(arahAngin(c.arah))}</span></div>
        <div><span class="k">Kekuatan</span><span class="v">${esc(beaufort(c.angin))}</span></div>
        <div><span class="k">Curah hujan</span><span class="v">${angka1(c.hujan)} mm</span></div>
        <div><span class="k">Tekanan</span><span class="v">${angka1(c.tekanan)} hPa</span></div>
        ${terbit ? `<div><span class="k">Matahari terbit</span><span class="v">${esc(terbit)}</span></div>` : ''}
        ${terbenam ? `<div><span class="k">Terbenam</span><span class="v">${esc(terbenam)}</span></div>` : ''}
      </div>
    </div>

    <div class="card"><h3>7 hari ke depan</h3><div class="wx-days">${daftarHari}</div></div>

    ${kartuGrafik('Suhu maksimum', grafikSuhu, tabelStat(
      hari.map(d => ({ l: tanggal(d.t), maks: d.maks, min: d.min })),
      [{ l: 'Tanggal', f: b => esc(b.l) }, { l: 'Maks °C', f: b => angka1(b.maks) }, { l: 'Min °C', f: b => angka1(b.min) }]))}

    ${kartuGrafik('Curah hujan', grafikHujan, tabelStat(
      hari.map(d => ({ l: tanggal(d.t), v: d.hujan })),
      [{ l: 'Tanggal', f: b => esc(b.l) }, { l: 'mm', f: b => angka1(b.v) }]))}

    ${kartuLaut}

    <div class="btn-row"><button class="btn wide" data-muat-cuaca>${ikon('M20 12a8 8 0 1 1-2.6-5.9M20 4v4.4h-4.4')}Perbarui</button></div>
    <p style="font-size:11px;color:var(--muted);margin-top:10px;line-height:1.55">
      Sumber: <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a> ·
      diperbarui ${esc(c.waktu ? c.waktu.slice(11, 16) + ' WIB' : '—')}.
      Untuk peringatan dini resmi, rujuk <a href="https://www.bmkg.go.id" target="_blank" rel="noopener">BMKG</a>.
    </p>`;
}
