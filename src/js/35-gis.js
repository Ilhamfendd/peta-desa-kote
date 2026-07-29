/* ═══════════════════════════════════════════════════════════
   35 — Perkakas GIS: skala, arah mata angin, layar penuh,
        menu konteks, analisis radius, tabel atribut
   ═══════════════════════════════════════════════════════════ */

/* ── Skala grafis ─────────────────────────────────────────── */
/** Panjangnya dibulatkan ke 1/2/3/5 × 10ⁿ agar angkanya enak dibaca. */
function perbaruiSkala() {
  const el = $('#skala');
  if (!el || !S.peta) return;

  const lebarMaks = 96;
  const y = S.peta.getSize().y / 2;
  const meterMaks = S.peta.distance(
    S.peta.containerPointToLatLng([0, y]),
    S.peta.containerPointToLatLng([lebarMaks, y]));
  if (!isFinite(meterMaks) || meterMaks <= 0) return;

  const pangkat = Math.pow(10, Math.floor(Math.log10(meterMaks)));
  const sisa = meterMaks / pangkat;
  const bulat = (sisa >= 10 ? 10 : sisa >= 5 ? 5 : sisa >= 3 ? 3 : sisa >= 2 ? 2 : 1) * pangkat;

  const px = Math.round(lebarMaks * bulat / meterMaks);
  const teks = bulat >= 1000 ? `${angka1(bulat / 1000)} km` : `${angka1(bulat)} m`;

  el.innerHTML = `<span class="skala-bar" style="width:${px}px"></span><span class="skala-teks">${esc(teks)}</span>`;
}

/* ── Layar penuh ──────────────────────────────────────────── */
function alihLayarPenuh() {
  const el = $('#map-wrap');
  if (!document.fullscreenElement) {
    (el.requestFullscreen ? el.requestFullscreen() : Promise.reject())
      .catch(() => pesan('Layar penuh tidak didukung browser ini', true));
  } else {
    document.exitFullscreen();
  }
}

/* ── Menu konteks peta (klik kanan / tekan lama) ──────────── */
let menuKonteksLL = null;

function bukaMenuKonteks(e) {
  const el = $('#ctx-menu');
  menuKonteksLL = e.latlng;
  const { lat, lng } = e.latlng;

  el.innerHTML = `
    <div class="ctx-head">
      <b>${esc(dms(lat, 'lat'))}</b>
      <b>${esc(dms(lng, 'lng'))}</b>
      <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
    </div>
    <button class="ctx-item" data-ctx="salin">${ikon('M9 9h10v10H9zM5 15V5h10')}Salin koordinat</button>
    <button class="ctx-item" data-ctx="radius">${ikon('M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 12h6')}Radius dari sini</button>
    <button class="ctx-item" data-ctx="ukur">${ikon('M3.6 14.8L14.8 3.6l5.6 5.6L9.2 20.4z')}Ukur dari sini</button>
    <button class="ctx-item" data-ctx="pusat">${ikon('M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM12 2.2v3M12 19v3M21.8 12h-3M5.2 12h-3')}Pusatkan di sini</button>
    <button class="ctx-item admin-only" data-ctx="tempat">${ikon('M12 5v14M5 12h14')}Tambah tempat di sini</button>`;

  // Tampilkan dulu supaya tingginya terukur, baru diletakkan.
  el.hidden = false;
  const p = S.peta.latLngToContainerPoint(e.latlng);
  const uk = S.peta.getSize();
  el.style.left = Math.max(8, Math.min(p.x, uk.x - el.offsetWidth - 8)) + 'px';
  el.style.top = Math.max(8, Math.min(p.y, uk.y - el.offsetHeight - 8)) + 'px';
}

function tutupMenuKonteks() {
  const el = $('#ctx-menu');
  if (el) el.hidden = true;
}

function aksiMenuKonteks(aksi) {
  const ll = menuKonteksLL;
  tutupMenuKonteks();
  if (!ll) return;

  if (aksi === 'salin') {
    const teks = `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
    if (navigator.clipboard) navigator.clipboard.writeText(teks).then(() => pesan('Koordinat disalin: ' + teks));
    else pesan(teks);
  } else if (aksi === 'pusat') {
    S.peta.panTo(ll);
  } else if (aksi === 'ukur') {
    mulaiGambar({ tipe: 'ukur', poligon: true, awal: [[ll.lat, ll.lng]], label: 'Klik untuk mengukur' });
  } else if (aksi === 'radius') {
    dialogRadius(ll);
  } else if (aksi === 'tempat') {
    formTempat({ lat: ll.lat, lon: ll.lng });
  }
}

/* ── Analisis radius (buffer) ─────────────────────────────── */
const RADIUS_PILIHAN = [100, 250, 500, 1000, 2000];

function dialogRadius(ll) {
  bukaModal({
    judul: 'Radius dari titik ini',
    isi: `
      <p class="chart-note" style="margin-bottom:10px">
        Menghitung tempat yang berada dalam jarak tertentu — misalnya jangkauan layanan
        posyandu atau sekolah.</p>
      <label class="f"><span>Jarak</span>
        <select class="inp" name="r">
          ${RADIUS_PILIHAN.map(r => `<option value="${r}" ${r === 500 ? 'selected' : ''}>${r >= 1000 ? (r / 1000) + ' km' : r + ' meter'}</option>`).join('')}
          <option value="lain">Lainnya…</option>
        </select></label>
      <label class="f" data-r-lain hidden><span>Jarak khusus <em>meter</em></span>
        <input class="inp f-num" name="rlain" inputmode="numeric" value="750"></label>`,
    aksi: [
      { label: 'Batal', fn: () => {} },
      { label: 'Hitung', cls: 'primary', fn: body => {
        const pilih = body.querySelector('[name="r"]').value;
        const r = pilih === 'lain' ? nOrNull(body.querySelector('[name="rlain"]').value) : +pilih;
        if (!r || r <= 0) { pesan('Jarak tidak sah', true); return false; }
        gambarRadius(ll, r);
      }}
    ]
  });

  const bg = $('.modal-bg');
  bg.addEventListener('change', e => {
    if (e.target.name === 'r') bg.querySelector('[data-r-lain]').hidden = e.target.value !== 'lain';
  });
}

function gambarRadius(ll, r) {
  S.lapis.radius.clearLayers();

  L.circle(ll, gy({
    radius: r, pane: 'p-radius',
    color: 'var(--series-2)', weight: 2, dashArray: '5 4',
    fillColor: 'var(--series-2)', fillOpacity: .08
  })).addTo(S.lapis.radius);

  L.circleMarker(ll, gy({
    radius: 5, pane: 'p-radius',
    color: 'var(--surface-1)', weight: 2, fillColor: 'var(--series-2)', fillOpacity: 1
  })).addTo(S.lapis.radius);

  const pusat = [ll.lat, ll.lng];
  const di = S.data.tempat
    .map(t => ({ t, d: jarak(pusat, [t.lat, t.lon]) }))
    .filter(x => x.d <= r)
    .sort((a, b) => a.d - b.d);

  const luas = Math.PI * r * r;
  const perKategori = {};
  di.forEach(x => { perKategori[x.t.kategori] = (perKategori[x.t.kategori] || 0) + 1; });

  $('#radius-info').innerHTML = `
    <div class="rad-head">
      <b>Radius ${r >= 1000 ? angka1(r / 1000) + ' km' : angka1(r) + ' m'}</b>
      <button class="icon-btn tiny" data-tutup-radius aria-label="Hapus radius">${ikon('M6 6l12 12M18 6L6 18')}</button>
    </div>
    <div class="kv" style="font-size:12px">
      <div><span class="k">Luas</span><span class="v">${teksLuas(luas)}</span></div>
      <div><span class="k">Tempat</span><span class="v">${di.length} dari ${S.data.tempat.length}</span></div>
    </div>
    ${di.length ? `<div class="rad-list">${di.slice(0, 8).map(x => {
      const d = KATEGORI[x.t.kategori] || KATEGORI.lainnya;
      return `<button class="rad-item" data-detail-tempat="${esc(x.t.id)}">
        <i style="background:var(${d.warna})"></i>
        <span>${esc(x.t.nama)}</span><em>${teksJarak(x.d)}</em></button>`;
    }).join('')}${di.length > 8 ? `<p class="chart-note" style="margin-top:5px">…dan ${di.length - 8} lainnya</p>` : ''}</div>`
    : `<p class="chart-note" style="margin-top:6px">Tidak ada tempat terdata di dalam radius ini.</p>`}`;
  $('#radius-info').hidden = false;

  S.peta.fitBounds(L.latLng(ll).toBounds(r * 2.4), { padding: [30, 30] });
}

function hapusRadius() {
  S.lapis.radius.clearLayers();
  $('#radius-info').hidden = true;
}

/* ── Tabel atribut ────────────────────────────────────────── */
let urutTabel = { kolom: 'nama', naik: true };

const KOLOM_TABEL = [
  { k: 'nama',     l: 'Nama' },
  { k: 'kategori', l: 'Kategori', f: t => (KATEGORI[t.kategori] || KATEGORI.lainnya).label },
  { k: 'alamat',   l: 'Alamat' },
  { k: 'kontak',   l: 'Kontak' },
  { k: 'lat',      l: 'Lintang',  f: t => t.lat.toFixed(6), num: true },
  { k: 'lon',      l: 'Bujur',    f: t => t.lon.toFixed(6), num: true }
];

function barisTabel() {
  const b = S.data.tempat.slice();
  const kol = KOLOM_TABEL.find(c => c.k === urutTabel.kolom) || KOLOM_TABEL[0];
  b.sort((x, y) => {
    const a = kol.f ? kol.f(x) : x[kol.k], c = kol.f ? kol.f(y) : y[kol.k];
    const r = kol.num ? (parseFloat(a) - parseFloat(c))
                      : String(a || '').localeCompare(String(c || ''), 'id');
    return urutTabel.naik ? r : -r;
  });
  return b;
}

function isiTabelAtribut() {
  const baris = barisTabel();
  return `<table class="dt tabel-atribut">
    <thead><tr>${KOLOM_TABEL.map(c => `
      <th><button data-urut="${c.k}">${esc(c.l)}${urutTabel.kolom === c.k ? (urutTabel.naik ? ' ↑' : ' ↓') : ''}</button></th>`).join('')}
    </tr></thead>
    <tbody>${baris.map(t => `<tr data-ke-tempat="${esc(t.id)}" tabindex="0">
      ${KOLOM_TABEL.map(c => `<td>${esc(c.f ? c.f(t) : (t[c.k] || '—'))}</td>`).join('')}
    </tr>`).join('')}</tbody>
  </table>`;
}

function modalTabelAtribut() {
  if (!S.data.tempat.length) return pesan('Belum ada tempat untuk ditampilkan', true);

  const bg = bukaModal({
    judul: `Tabel atribut — ${S.data.tempat.length} tempat`,
    isi: `<div class="tabel-bungkus" data-tabel-isi>${isiTabelAtribut()}</div>`,
    aksi: [
      { label: 'Unduh CSV', fn: () => { eksporCSV(); return false; } },
      { label: 'Tutup', cls: 'primary', fn: () => {} }
    ]
  });
  bg.querySelector('.modal').classList.add('modal-lebar');

  bg.addEventListener('click', e => {
    const u = e.target.closest('[data-urut]');
    if (u) {
      const k = u.dataset.urut;
      urutTabel = { kolom: k, naik: urutTabel.kolom === k ? !urutTabel.naik : true };
      bg.querySelector('[data-tabel-isi]').innerHTML = isiTabelAtribut();
      return;
    }
    const r = e.target.closest('[data-ke-tempat]');
    if (r) { tutupModal(); sorotTempat(r.dataset.keTempat); }
  });
}

/** CSV dengan BOM supaya Excel membaca huruf beraksen dengan benar. */
function eksporCSV() {
  const sel = v => {
    const s = String(v == null ? '' : v);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const kepala = ['Nama', 'Kategori', 'Alamat', 'Kontak', 'Jam', 'Website', 'Keterangan', 'Lintang', 'Bujur'];
  const baris = barisTabel().map(t => [
    t.nama, (KATEGORI[t.kategori] || KATEGORI.lainnya).label, t.alamat, t.kontak,
    t.jam, t.website, t.deskripsi, t.lat.toFixed(6), t.lon.toFixed(6)
  ].map(sel).join(';'));

  unduh(namaBerkas('csv'), '﻿' + [kepala.join(';')].concat(baris).join('\r\n'), 'text/csv');
  pesan(`${baris.length} tempat diekspor ke CSV`);
}
