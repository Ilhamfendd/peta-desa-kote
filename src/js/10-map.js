/* ═══════════════════════════════════════════════════════════
   10 — Peta: layer dasar, vektor lokal, penanda, batas
   ═══════════════════════════════════════════════════════════ */

/* `berlabel` menandai ubin yang sudah memuat nama tempat sendiri — penentu
   apakah lapisan nama milik kita perlu ditumpangkan. */
const PETA_DASAR = {
  osm: {
    label: 'Peta', sub: 'Jalan & tempat',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    berlabel: true,
    opsi: { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }
  },
  satelit: {
    label: 'Satelit', sub: 'Citra udara',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    berlabel: false, gelapUbin: true,
    opsi: { maxZoom: 19, attribution: 'Citra © Esri, Maxar, Earthstar Geographics' }
  },
  medan: {
    label: 'Medan', sub: 'Kontur & bukit',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    berlabel: true,
    opsi: { maxZoom: 17, subdomains: 'abc', attribution: '© <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA)' }
  },
  polos: {
    label: 'Polos', sub: 'Enak untuk data',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    urlGelap: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    berlabel: true,
    opsi: { maxZoom: 19, subdomains: 'abcd', attribution: '© OpenStreetMap, © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>' }
  },
  vektor: {
    label: 'Luring', sub: 'Tanpa internet',
    url: null,
    berlabel: false,
    opsi: { attribution: 'Geometri © OpenStreetMap (ODbL), disederhanakan' }
  }
};

/* Lapisan rujukan Esri: batas & nama tempat untuk ditumpangkan di atas citra. */
const UBIN_LABEL = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  opsi: { maxZoom: 19, pane: 'shadowPane' }
};

/* Ubin contoh (Desa Kote, z13) dipakai sebagai gambar mini pemilih mode. */
const UBIN_CONTOH = { z: 13, x: 6474, y: 4104 };

function urlUbinContoh(def) {
  if (!def.url) return null;
  const gelap = document.documentElement.dataset.theme === 'dark';
  return ((gelap && def.urlGelap) ? def.urlGelap : def.url)
    .replace('{z}', UBIN_CONTOH.z).replace('{x}', UBIN_CONTOH.x).replace('{y}', UBIN_CONTOH.y)
    .replace('{s}', 'a').replace('{r}', '');
}

/* Layer vektor yang tertanam di dalam berkas */
const LAPIS_VEKTOR = [
  { id: 'perairan',  label: 'Perairan & tutupan lahan', sumber: 'water',   awal: false },
  { id: 'pantai',    label: 'Garis pantai',             sumber: 'coast',   awal: false },
  { id: 'jalan',     label: 'Jaringan jalan',           sumber: 'roads',   awal: false },
  { id: 'pulau',     label: 'Pulau sekitar',            sumber: 'islands', awal: false },
  { id: 'tetangga',  label: 'Nama desa sekitar',        sumber: 'places',  awal: false }
];

/* Urutan tumpukan: makin besar makin di atas. Di bawah 500 = bidang gambar,
   di atas 600 = penanda dan label. */
const URUTAN_PANE = {
  perairan: 401, pantai: 402, jalan: 403, pulau: 404,
  wilayah: 405, batas: 406, radius: 407,
  tetangga: 601, tempat: 610, sunting: 620
};

let lapisDasarAktif = null;
let lapisLabelAktif = null;
let dasarTerpilih = 'osm';
let tileGagal = false;

/* ── Kelegapan per layer (seperti pengatur transparansi di GIS) ── */
S.kelegapan = {};

function setKelegapan(id, nilai) {
  S.kelegapan[id] = nilai;
  const p = S.peta && S.peta.getPane('p-' + id);
  if (p) p.style.opacity = nilai;
  try { localStorage.setItem(APP.simpanan + '/legap', JSON.stringify(S.kelegapan)); } catch (e) {}
}

function muatKelegapan() {
  let tersimpan = {};
  try { tersimpan = JSON.parse(localStorage.getItem(APP.simpanan + '/legap') || '{}') || {}; } catch (e) {}
  Object.keys(URUTAN_PANE).forEach(id => {
    setKelegapan(id, tersimpan[id] == null ? 1 : tersimpan[id]);
  });
}

function buatPeta() {
  const m = L.map('map', {
    center: APP.pusat,
    zoom: APP.zoom,
    zoomControl: false,
    attributionControl: false,
    minZoom: 10,
    maxZoom: 19,
    worldCopyJump: false,
    maxBoundsViscosity: 1
  });
  // Zoom memakai tombol sendiri agar seluruh alat peta berada dalam satu
  // tumpukan; kontrol bawaan Leaflet dulu menimpa dua tombol teratas.
  S.peta = m;

  // Tiap layer punya panelnya sendiri: itu yang memungkinkan kelegapan diatur
  // per layer, sekaligus mengunci urutan tumpukannya.
  Object.entries(URUTAN_PANE).forEach(([k, z]) => {
    const p = m.createPane('p-' + k);
    p.style.zIndex = z;
    S.lapis[k] = L.layerGroup().addTo(m);
  });
  muatKelegapan();

  try {
    const l = localStorage.getItem(APP.simpanan + '/label');
    if (l !== null) S.labelTempat = JSON.parse(l);
  } catch (e) { /* pilihan tersimpan rusak — pakai otomatis */ }

  let dasarAwal = 'osm';
  try { dasarAwal = localStorage.getItem(APP.simpanan + '/dasar') || 'osm'; } catch (e) {}
  if (!PETA_DASAR[dasarAwal]) dasarAwal = 'osm';

  gambarVektor();
  gantiDasar(dasarAwal);
  gambarBatas();
  gambarTempat();
  buatPanelLapis();
  gambarLegenda();

  m.on('mousemove', e => {
    $('#coords').textContent = `${dms(e.latlng.lat, 'lat')}  ${dms(e.latlng.lng, 'lng')}`;
  });
  m.on('mouseout', () => { $('#coords').textContent = '—'; });
  m.on('zoomend', aturSkalaJalan);
  m.on('move zoom moveend zoomend resize', perbaruiSkala);
  m.on('contextmenu', bukaMenuKonteks);   // Leaflet sendiri yang menahan menu bawaan browser
  m.on('movestart click', tutupMenuKonteks);
  perbaruiSkala();

  fokusAwal();
  terapkanBatasPeta();
  return m;
}

function fokusAwal() {
  const r = S.data.batas.desa && cincinLuar(S.data.batas.desa);
  if (r && r.length > 2) S.peta.fitBounds(L.latLngBounds(r), { padding: [40, 40] });
  else S.peta.setView(S.data.meta.pusat || APP.pusat, APP.zoom);
}

/** Wilayah jelajah peta: kotak di sekitar pusat desa, digabung dengan batas
    desa bila sudah digambar. Peta ini untuk Desa Kote — bukan peta dunia. */
function batasPeta() {
  const pusat = S.data.meta.pusat || APP.pusat;
  const km = S.data.meta.jangkauan || APP.jangkauan;
  const dLat = km / 111;
  const dLng = km / (111 * Math.max(0.2, Math.cos(rad(pusat[0]))));

  const kotak = L.latLngBounds(
    [pusat[0] - dLat, pusat[1] - dLng],
    [pusat[0] + dLat, pusat[1] + dLng]);

  const r = S.data.batas.desa && cincinLuar(S.data.batas.desa);
  if (r && r.length > 2) kotak.extend(L.latLngBounds(r).pad(0.35));
  return kotak;
}

/** Kunci jelajah dan tetapkan zoom terjauh agar wilayahnya pas satu layar. */
function terapkanBatasPeta() {
  if (!S.peta) return;
  const b = batasPeta();
  S.peta.setMaxBounds(b);
  S.peta.options.maxBoundsViscosity = 1;          // benar-benar berhenti di tepi

  const zMin = Math.max(3, Math.floor(S.peta.getBoundsZoom(b)));
  S.peta.setMinZoom(zMin);
  if (S.peta.getZoom() < zMin) S.peta.setZoom(zMin);
}

/* ── Layer dasar ──────────────────────────────────────────── */
function gantiDasar(kunci) {
  const def = PETA_DASAR[kunci] || PETA_DASAR.osm;
  dasarTerpilih = kunci;
  try { localStorage.setItem(APP.simpanan + '/dasar', kunci); } catch (e) {}

  if (lapisDasarAktif) { S.peta.removeLayer(lapisDasarAktif); lapisDasarAktif = null; }

  if (lapisLabelAktif) { S.peta.removeLayer(lapisLabelAktif); lapisLabelAktif = null; }

  if (def.url) {
    const gelap = document.documentElement.dataset.theme === 'dark';
    const url = (gelap && def.urlGelap) ? def.urlGelap : def.url;
    tileGagal = false;
    lapisDasarAktif = L.tileLayer(url, def.opsi);
    lapisDasarAktif.on('tileerror', () => {
      if (tileGagal) return;
      tileGagal = true;
      pesan('Peta dasar gagal dimuat — beralih ke mode Luring', true);
      gantiDasar('vektor');
      buatPemilihDasar();
    });
    lapisDasarAktif.addTo(S.peta);
    lapisDasarAktif.bringToBack();
  } else {
    // Tanpa ubin: hidupkan lapisan vektor agar peta tetap terbaca.
    ['perairan', 'pantai', 'jalan', 'pulau'].forEach(id => { if (!S.aktif[id]) alihLapis(id, true); });
  }

  terapkanLabel();

  $('#attrib').innerHTML = def.opsi.attribution || '';
  buatPemilihDasar();
}

/** Ubin berlabel sudah memuat nama tempat; nama milik kita hanya ditumpangkan
    bila peta dasarnya polos — kecuali pengguna memaksa lewat saklar. */
function labelEfektif() {
  const def = PETA_DASAR[dasarTerpilih] || PETA_DASAR.osm;
  return S.labelTempat === null ? !def.berlabel : S.labelTempat;
}

function terapkanLabel() {
  const def = PETA_DASAR[dasarTerpilih] || PETA_DASAR.osm;
  const nyala = labelEfektif();

  if (S.lapis.tetangga) alihLapis('tetangga', nyala);

  if (lapisLabelAktif) { S.peta.removeLayer(lapisLabelAktif); lapisLabelAktif = null; }
  // Rujukan Esri hanya berguna di atas citra — di ubin berlabel justru dobel.
  if (nyala && def.url && !def.berlabel) {
    lapisLabelAktif = L.tileLayer(UBIN_LABEL.url, UBIN_LABEL.opsi).addTo(S.peta);
  }
}

function alihLabel(nyala) {
  S.labelTempat = nyala;
  try { localStorage.setItem(APP.simpanan + '/label', JSON.stringify(nyala)); } catch (e) {}
  terapkanLabel();   // kotak centangnya sudah mencerminkan aksi pengguna
}

/* ── Vektor tertanam ──────────────────────────────────────── */
const GAYA = {
  perairan: f => {
    const air = f.properties.k === 'water' || f.properties.k === 'wetland';
    return gy(air
      ? { color: 'var(--coast)', weight: .8, fillColor: 'var(--map-water)', fillOpacity: .85 }
      : { color: 'transparent', weight: 0, fillColor: 'var(--series-6)', fillOpacity: .10 });
  },
  pantai: () => gy({ color: 'var(--coast)', weight: 1.4, opacity: .9, fill: false }),
  pulau:  f => gy(f.geometry.type === 'Polygon'
    ? { color: 'var(--coast)', weight: 1, fillColor: 'var(--map-land)', fillOpacity: .55 }
    : { color: 'var(--axis)', weight: 1.1, opacity: .55, fill: false, dashArray: '4 4' }),
  jalan:  f => {
    const k = f.properties.k;
    const w = { utama: 3, kolektor: 2.4, lokal: 1.8, lingkungan: 1.3, setapak: 1 }[k] || 1.3;
    const c = { utama: 'var(--road-1)', kolektor: 'var(--road-1)', lokal: 'var(--road-2)' }[k] || 'var(--road-3)';
    return gy({ color: c, weight: w, opacity: .9, lineCap: 'round', lineJoin: 'round',
                dashArray: k === 'setapak' ? '3 3' : null });
  }
};

function gambarVektor() {
  const bm = S.basemap;
  if (!bm) return;

  LAPIS_VEKTOR.forEach(def => {
    const fc = bm[def.sumber];
    if (!fc || !fc.features.length) return;
    S.lapis[def.id].clearLayers();

    if (def.id === 'tetangga') {
      fc.features.forEach(f => {
        const nm = f.properties.n;
        if (!nm || desaIni(nm)) return;
        const [lng, lat] = f.geometry.coordinates;
        L.marker([lat, lng], {
          interactive: false,
          keyboard: false,
          pane: 'p-tetangga',
          icon: L.divIcon({
            className: '', iconSize: null,
            html: `<div class="village-dot"><i></i>${esc(nm)}</div>`
          })
        }).addTo(S.lapis.tetangga);
      });
    } else {
      L.geoJSON(fc, {
        style: GAYA[def.id],
        interactive: false,
        pane: 'p-' + def.id,
        onEachFeature: (f, l) => { if (f.properties.n) l.bindTooltip(f.properties.n, { sticky: true }); }
      }).addTo(S.lapis[def.id]);
    }

    // Pilihan pengguna dipertahankan saat digambar ulang (mis. ganti tema).
    if (S.aktif[def.id] === undefined) S.aktif[def.id] = def.awal;
    if (S.aktif[def.id]) S.lapis[def.id].addTo(S.peta);
    else S.peta.removeLayer(S.lapis[def.id]);
  });
  aturSkalaJalan();
}

/** Jalan kecil hanya muncul saat diperbesar. */
function aturSkalaJalan() {
  const z = S.peta.getZoom();
  const g = S.lapis.jalan;
  if (!g) return;
  g.eachLayer(gj => gj.eachLayer && gj.eachLayer(l => {
    const k = l.feature && l.feature.properties.k;
    const batas = { setapak: 15, lingkungan: 14, lokal: 13 }[k] || 0;
    const tampak = z >= batas;
    if (l.setStyle) l.setStyle({ opacity: tampak ? .9 : 0 });
  }));
}

function alihLapis(id, nyala) {
  S.aktif[id] = nyala;
  const g = S.lapis[id];
  if (!g) return;
  if (nyala) g.addTo(S.peta); else S.peta.removeLayer(g);
}

/* ── Batas desa & dusun ───────────────────────────────────── */
function gambarBatas() {
  S.lapis.batas.clearLayers();
  S.lapis.wilayah.clearLayers();

  const b = S.data.batas.desa;
  if (b) {
    L.geoJSON(b, {
      style: gy({ color: 'var(--accent)', weight: 2.4, opacity: .95, fillColor: 'var(--accent)', fillOpacity: .07 }),
      interactive: false,
      pane: 'p-batas'
    }).addTo(S.lapis.batas);
  }

  (S.data.batas.dusun || []).forEach((d, i) => {
    if (!d.geo) return;
    const c = `var(--series-${(i % 8) + 1})`;
    L.geoJSON(d.geo, {
      style: gy({ color: c, weight: 1.6, opacity: .9, fillColor: c, fillOpacity: .14, dashArray: '5 3' }),
      pane: 'p-wilayah'
    })
      .bindTooltip(esc(d.nama || 'Dusun'), { sticky: true })
      .addTo(S.lapis.wilayah);
  });

  terapkanBatasPeta();     // batas desa yang baru digambar ikut memperluas jelajah
  gambarLegenda();
}

/* ── Penanda tempat ───────────────────────────────────────── */
function pinTempat(kat) {
  const def = KATEGORI[kat] || KATEGORI.lainnya;
  return L.divIcon({
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24],
    html: `<div class="poi-pin" style="background:var(${def.warna})">${ikon(def.ikon)}</div>`
  });
}

function gambarTempat() {
  S.lapis.tempat.clearLayers();
  S.markerTempat.clear();

  S.data.tempat.forEach(t => {
    if (!isFinite(t.lat) || !isFinite(t.lon)) return;
    if (!S.kategoriAktif.has(t.kategori)) return;

    const mk = L.marker([t.lat, t.lon], {
      icon: pinTempat(t.kategori),
      title: t.nama,
      riseOnHover: true,
      draggable: false,
      pane: 'p-tempat'
    });
    mk.bindPopup(() => popupTempat(t), { maxWidth: 260, autoPanPadding: [24, 24] });
    mk.addTo(S.lapis.tempat);
    S.markerTempat.set(t.id, mk);
  });
  gambarLegenda();
}

function popupTempat(t) {
  const def = KATEGORI[t.kategori] || KATEGORI.lainnya;
  const foto = safeUrl(t.foto);
  const web = safeUrl(t.website);
  const baris = [];
  if (t.alamat)  baris.push(['M12 20.6s6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0c0 4.5 6.8 10.6 6.8 10.6z', esc(t.alamat)]);
  if (t.kontak)  baris.push(['M4.5 6.2c0 7.5 5.8 13.3 13.3 13.3l1.7-3.4-4.2-2.1-2 2a13.6 13.6 0 0 1-5.3-5.3l2-2L8 4.5z', esc(t.kontak)]);
  if (t.jam)     baris.push(['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 7.4V12l3.1 1.8', esc(t.jam)]);
  if (web)       baris.push(['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM3.5 12h17M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17z',
                             `<a href="${esc(web)}" target="_blank" rel="noopener noreferrer">${esc(t.website)}</a>`]);

  return `<div class="pop">
    <div class="pop-cat"><i style="background:var(${def.warna})"></i>${esc(def.label)}</div>
    <h4>${esc(t.nama || 'Tanpa nama')}</h4>
    ${t.deskripsi ? `<div class="pop-desc">${esc(t.deskripsi)}</div>` : ''}
    ${foto ? `<img src="${esc(foto)}" alt="" loading="lazy">` : ''}
    ${baris.length ? `<div class="pop-meta">${baris.map(([p, v]) => `<div>${ikon(p)}<span>${v}</span></div>`).join('')}</div>` : ''}
    <div class="pop-act">
      <button class="btn sm" data-rute="${esc(t.id)}">${ikon('M12 20.6s6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0c0 4.5 6.8 10.6 6.8 10.6z')}Rute</button>
      <button class="btn sm" data-bagi="${esc(t.id)}">${ikon('M14.5 7.5l-5 3M9.5 13.5l5 3M6.8 14.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM17.2 8.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM17.2 20.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z')}Bagikan</button>
      <button class="btn sm admin-only" data-edit-tempat="${esc(t.id)}">Ubah</button>
    </div>
  </div>`;
}

function sorotTempat(id) {
  const t = S.data.tempat.find(x => x.id === id);
  const mk = S.markerTempat.get(id);
  if (!t) return;
  if (!mk) { S.kategoriAktif.add(t.kategori); gambarTempat(); return sorotTempat(id); }
  S.peta.setView([t.lat, t.lon], Math.max(S.peta.getZoom(), 16), { animate: true });
  mk.openPopup();
  const el = mk.getElement && mk.getElement();
  if (el) { const p = el.querySelector('.poi-pin'); if (p) { p.classList.add('on'); setTimeout(() => p.classList.remove('on'), 2200); } }
  if (window.innerWidth <= 720) document.body.classList.remove('sheet-open');
}

/* ── Pemilih mode peta (bergambar, seperti peta daring umumnya) ── */

/** Buka/tutup tanpa menggambar ulang isinya.
    Mengganti innerHTML di sini akan melepas simpul yang baru diklik dari DOM,
    sehingga penangan "klik di luar" di document salah menyimpulkan dan langsung
    menutup panelnya kembali. */
function bukaPemilih(buka) {
  const el = $('#base-switch');
  if (!el) return;
  el.dataset.open = String(buka);
  const panel = el.querySelector('.bs-panel');
  const tombol = el.querySelector('.bs-toggle');
  if (panel) panel.hidden = !buka;
  if (tombol) tombol.setAttribute('aria-expanded', String(buka));
}

function buatPemilihDasar() {
  const el = $('#base-switch');
  if (!el) return;
  const terbuka = el.dataset.open === 'true';
  const kini = PETA_DASAR[dasarTerpilih] || PETA_DASAR.osm;

  const gambar = def => {
    const u = urlUbinContoh(def);
    return u ? `<img src="${esc(u)}" alt="" loading="lazy" onerror="this.remove()">`
             : `<span class="bs-luring">${ikon('M4 18.5l5.5-7 4 5 3-3.6 3.5 5.6z')}</span>`;
  };

  const opsi = Object.entries(PETA_DASAR).map(([k, v]) => `
    <button class="bs-opt" data-dasar="${k}" aria-pressed="${k === dasarTerpilih}" title="${esc(v.sub)}">
      <span class="bs-thumb">${gambar(v)}</span>
      <span class="bs-lab">${esc(v.label)}</span>
    </button>`).join('');

  el.innerHTML = `
    <div class="bs-panel" ${terbuka ? '' : 'hidden'}>
      <div class="bs-row">${opsi}</div>
      <label class="switch bs-sw">
        <input type="checkbox" data-label-tempat ${labelEfektif() ? 'checked' : ''}>
        <span class="track"></span>
        <span class="sw-label">Nama tempat</span>
      </label>
    </div>
    <button class="bs-toggle" aria-expanded="${terbuka}" aria-label="Ganti mode peta" title="Ganti mode peta">
      <span class="bs-thumb">${gambar(kini)}
        <span class="bs-badge">${ikon('M12 3.5L3 8l9 4.5L21 8z M3 12.4l9 4.5 9-4.5')}</span>
      </span>
      <span class="bs-cap">${esc(kini.label)}
        <svg viewBox="0 0 24 24" aria-hidden="true" class="bs-caret"><path d="M7 14.5l5-5 5 5"/></svg>
      </span>
    </button>`;
}

/* ── Panel layer data ─────────────────────────────────────── */
function buatPanelLapis() {
  /* Penggeser kelegapan — sepadan dengan pengatur transparansi di GIS */
  const geser = id => {
    const v = S.kelegapan[id] == null ? 1 : S.kelegapan[id];
    return `<div class="legap">
      <input type="range" min="0.1" max="1" step="0.05" value="${v}" data-legap="${id}"
             aria-label="Kelegapan layer">
      <span>${Math.round(v * 100)}%</span>
    </div>`;
  };

  const vektor = LAPIS_VEKTOR.map(d => `
    <label class="switch">
      <input type="checkbox" data-lapis="${d.id}" ${S.aktif[d.id] ? 'checked' : ''}>
      <span class="track"></span>
      <span class="sw-label">${esc(d.label)}</span>
    </label>
    ${S.aktif[d.id] ? geser(d.id) : ''}`).join('');

  const punyaBatas = !!S.data.batas.desa;
  const punyaDusun = (S.data.batas.dusun || []).length > 0;

  $('#layer-panel').innerHTML = `
    <h3 style="font-size:10.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:2px 0 4px 2px">Layer data</h3>
    <label class="switch"><input type="checkbox" data-lapis="batas" ${punyaBatas ? 'checked' : ''} ${punyaBatas ? '' : 'disabled'}><span class="track"></span><span class="sw-label">Batas desa${punyaBatas ? '' : '<small>Belum digambar</small>'}</span></label>
    ${punyaBatas && S.aktif.batas !== false ? geser('batas') : ''}
    <label class="switch"><input type="checkbox" data-lapis="wilayah" ${punyaDusun ? 'checked' : ''} ${punyaDusun ? '' : 'disabled'}><span class="track"></span><span class="sw-label">Dusun / RW${punyaDusun ? '' : '<small>Belum digambar</small>'}</span></label>
    ${punyaDusun && S.aktif.wilayah !== false ? geser('wilayah') : ''}
    <label class="switch"><input type="checkbox" data-lapis="tempat" ${S.aktif.tempat === false ? '' : 'checked'}><span class="track"></span><span class="sw-label">Tempat & fasilitas<small>${S.data.tempat.length} titik</small></span></label>
    ${S.aktif.tempat !== false ? geser('tempat') : ''}
    <h3 style="font-size:10.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:12px 0 4px 2px">Vektor tertanam</h3>
    ${vektor}`;

  ['batas', 'wilayah', 'tempat'].forEach(k => { if (S.aktif[k] === undefined) S.aktif[k] = true; });
}

function gambarLegenda() {
  const dipakai = new Set(S.data.tempat.filter(t => S.kategoriAktif.has(t.kategori)).map(t => t.kategori));
  const baris = [];

  if (S.data.batas.desa && S.aktif.batas !== false) {
    baris.push(`<span><i style="background:var(--accent);opacity:.5;box-shadow:inset 0 0 0 1.4px var(--accent)"></i>Batas desa</span>`);
  }
  (S.data.batas.dusun || []).forEach((d, i) => {
    if (S.aktif.wilayah === false) return;
    baris.push(`<span><i style="background:var(--series-${(i % 8) + 1});opacity:.55"></i>${esc(d.nama || 'Dusun')}</span>`);
  });
  if (S.aktif.tempat !== false) {
    Array.from(dipakai).forEach(k => {
      const d = KATEGORI[k] || KATEGORI.lainnya;
      baris.push(`<span><i style="background:var(${d.warna})"></i>${esc(d.label)}</span>`);
    });
  }

  // Satu lajur bila sedikit, dua lajur bila banyak — diatur lewat CSS.
  $('#legend').innerHTML = baris.length
    ? `<div class="legend-row"${baris.length <= 4 ? ' style="grid-template-columns:1fr"' : ''}>${baris.join('')}</div>` : '';
}
