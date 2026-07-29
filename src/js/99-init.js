/* ═══════════════════════════════════════════════════════════
   99 — Penyambung: interaksi, pencarian, tema, pemuatan awal
   ═══════════════════════════════════════════════════════════ */

/* ── Tema ─────────────────────────────────────────────────── */
function terapkanTema(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(APP.simpanan + '/tema', t); } catch (e) {}
  resetWarna();

  if (S.peta) {
    ['perairan', 'pantai', 'jalan', 'pulau', 'tetangga'].forEach(id => S.lapis[id].clearLayers());
    gambarVektor();
    gambarBatas();
    gambarTempat();
    gantiDasar(dasarTerpilih);
  }
  gambarUlang();
}

function temaAwal() {
  let t = null;
  try { t = localStorage.getItem(APP.simpanan + '/tema'); } catch (e) {}
  if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
}

/* ── Mode kelola ──────────────────────────────────────────── */
function alihAdmin(paksa) {
  S.admin = paksa === undefined ? !S.admin : paksa;
  document.body.classList.toggle('admin', S.admin);
  $('#btn-admin').setAttribute('aria-pressed', String(S.admin));
  if (!S.admin) { batalGambar(); if (Gambar.batalTempat) Gambar.batalTempat(); }
  gambarUlang();
  pesan(S.admin ? 'Mode kelola aktif — perubahan tersimpan di perangkat ini' : 'Mode kelola dimatikan');
}

/* ── Pencarian ────────────────────────────────────────────── */
function cari(kata) {
  const k = kata.trim().toLowerCase();
  if (k.length < 1) return [];
  const hasil = [];

  S.data.tempat.forEach(t => {
    const skor = cocok(k, [t.nama, t.alamat, t.deskripsi, (KATEGORI[t.kategori] || {}).label]);
    if (skor) hasil.push({ skor, jenis: 'tempat', label: t.nama || 'Tanpa nama',
                           sub: (KATEGORI[t.kategori] || KATEGORI.lainnya).label, id: t.id, kategori: t.kategori });
  });

  (S.data.batas.dusun || []).forEach((d, i) => {
    const skor = cocok(k, [d.nama]);
    if (skor) hasil.push({ skor, jenis: 'dusun', label: d.nama, sub: 'Dusun / RW', idx: i });
  });

  if (S.basemap && S.basemap.places) {
    S.basemap.places.features.forEach(f => {
      const skor = cocok(k, [f.properties.n]);
      if (skor) hasil.push({ skor: skor - .2, jenis: 'osm', label: f.properties.n,
                             sub: f.properties.k === 'village' ? 'Desa sekitar' : 'Pulau',
                             ll: [f.geometry.coordinates[1], f.geometry.coordinates[0]] });
    });
  }

  return hasil.sort((a, b) => b.skor - a.skor).slice(0, 12);
}

function cocok(k, medan) {
  let best = 0;
  medan.forEach(m => {
    if (!m) return;
    const s = String(m).toLowerCase();
    if (s === k) best = Math.max(best, 3);
    else if (s.startsWith(k)) best = Math.max(best, 2.4);
    else if (s.includes(k)) best = Math.max(best, 1.6);
  });
  return best;
}

function gambarHasilCari(kata) {
  const box = $('#q-results');
  const hasil = cari(kata);
  $('#q-clear').hidden = !kata;

  if (!kata) { box.hidden = true; box.innerHTML = ''; return; }
  if (!hasil.length) {
    box.hidden = false;
    box.innerHTML = `<div class="qr-empty">Tidak ada yang cocok dengan “${esc(kata)}”</div>`;
    return;
  }

  box.hidden = false;
  box.innerHTML = hasil.map((h, i) => {
    const d = h.jenis === 'tempat' ? (KATEGORI[h.kategori] || KATEGORI.lainnya) : null;
    const bulat = d
      ? `<span class="li-ico" style="background:var(${d.warna});width:24px;height:24px">${ikon(d.ikon)}</span>`
      : `<span class="li-ico" style="background:var(--axis);width:24px;height:24px">${ikon('M12 20.6s6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0c0 4.5 6.8 10.6 6.8 10.6z')}</span>`;
    return `<button class="qr-item" data-hasil="${i}" role="option">${bulat}
      <span class="qr-txt"><b>${esc(h.label)}</b><small>${esc(h.sub)}</small></span></button>`;
  }).join('');

  box._hasil = hasil;
}

function bukaHasil(h) {
  $('#q').value = '';
  $('#q-results').hidden = true;
  $('#q-clear').hidden = true;
  if (h.jenis === 'tempat') return bukaDetailTempat(h.id);
  else if (h.jenis === 'dusun') zoomDusun(h.idx);
  else if (h.ll) S.peta.setView(h.ll, 14, { animate: true });
  aturLembar(false);
}

function zoomDusun(i) {
  const d = S.data.batas.dusun[i];
  const r = d && d.geo && cincinLuar(d.geo);
  if (r && r.length > 2) S.peta.fitBounds(L.latLngBounds(r), { padding: [40, 40] });
  aturLembar(false);
}

/* ── Interaksi global ─────────────────────────────────────── */
function pasangInteraksi() {

  /* Tab */
  $$('.tabs button').forEach(b => b.addEventListener('click', () => pilihTab(b.dataset.tab)));

  /* Topbar */
  $('#btn-theme').addEventListener('click', () =>
    terapkanTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('#btn-admin').addEventListener('click', () => alihAdmin());
  $('#btn-sidebar').addEventListener('click', () =>
    aturLembar(!document.body.classList.contains('sheet-open')));

  /* Alat peta */
  $('#btn-layers').addEventListener('click', () => {
    const p = $('#layer-panel');
    p.hidden = !p.hidden;
    $('#btn-layers').setAttribute('aria-pressed', String(!p.hidden));
  });
  $('#btn-zin').addEventListener('click', () => S.peta.zoomIn());
  $('#btn-zout').addEventListener('click', () => S.peta.zoomOut());
  $('#btn-reset').addEventListener('click', fokusAwal);
  $('#btn-print').addEventListener('click', () => window.print());
  $('#btn-measure').addEventListener('click', () => {
    if (Gambar.aktif === 'ukur') batalGambar();
    else mulaiGambar({ tipe: 'ukur', poligon: true, label: 'Klik untuk mengukur jarak & luas' });
  });
  $('#btn-locate').addEventListener('click', () => {
    if (!navigator.geolocation) return pesan('Perangkat tidak mendukung lokasi', true);
    pesan('Mencari lokasi…');
    navigator.geolocation.getCurrentPosition(
      p => {
        const ll = [p.coords.latitude, p.coords.longitude];
        S.peta.setView(ll, 16);
        L.circleMarker(ll, gy({ radius: 7, color: 'var(--surface-1)', weight: 3,
                                fillColor: 'var(--accent)', fillOpacity: 1 }))
          .bindTooltip('Lokasi Anda').addTo(S.lapis.sunting);
      },
      () => pesan('Lokasi tidak bisa diakses — izinkan lewat pengaturan browser', true),
      { enableHighAccuracy: true, timeout: 10000 });
  });

  /* Pencarian */
  const q = $('#q');
  q.addEventListener('input', () => gambarHasilCari(q.value));
  q.addEventListener('focus', () => { if (q.value) gambarHasilCari(q.value); });
  $('#q-clear').addEventListener('click', () => { q.value = ''; gambarHasilCari(''); q.focus(); });
  q.addEventListener('keydown', e => {
    if (e.key === 'Escape') { q.value = ''; gambarHasilCari(''); q.blur(); }
    if (e.key === 'Enter') {
      const box = $('#q-results');
      if (box._hasil && box._hasil.length) bukaHasil(box._hasil[0]);
    }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) $('#q-results').hidden = true;
    if (!e.target.closest('#layer-panel') && !e.target.closest('#btn-layers')) {
      $('#layer-panel').hidden = true;
      $('#btn-layers').setAttribute('aria-pressed', 'false');
    }
    if (!e.target.closest('#base-switch')) bukaPemilih(false);
  });

  /* Panel layer */
  $('#layer-panel').addEventListener('change', e => {
    if (e.target.matches('[data-fokus]')) return alihFokus(e.target.checked);
    const c = e.target.closest('[data-lapis]');
    if (!c) return;
    alihLapis(c.dataset.lapis, c.checked);
    gambarLegenda();
    buatPanelLapis();
    $('#layer-panel').hidden = false;
  });
  $('#layer-panel').addEventListener('input', e => {
    const r = e.target.closest('[data-legap]');
    if (!r) return;
    setKelegapan(r.dataset.legap, +r.value);
    const label = r.parentElement.querySelector('span');
    if (label) label.textContent = Math.round(r.value * 100) + '%';
  });

  /* Perkakas GIS */
  $('#btn-penuh').addEventListener('click', alihLayarPenuh);
  document.addEventListener('fullscreenchange', () => {
    $('#btn-penuh').setAttribute('aria-pressed', String(!!document.fullscreenElement));
    if (S.peta) setTimeout(() => { S.peta.invalidateSize(); perbaruiSkala(); }, 120);
  });
  $('#ctx-menu').addEventListener('click', e => {
    const b = e.target.closest('[data-ctx]');
    if (b) aksiMenuKonteks(b.dataset.ctx);
  });
  /* Pemilih mode peta */
  const bs = $('#base-switch');
  bs.addEventListener('click', e => {
    if (e.target.closest('.bs-toggle')) return bukaPemilih(bs.dataset.open !== 'true');
    const o = e.target.closest('[data-dasar]');
    if (o) {
      bukaPemilih(false);
      gantiDasar(o.dataset.dasar);
    }
  });
  bs.addEventListener('change', e => {
    if (e.target.matches('[data-label-tempat]')) alihLabel(e.target.checked);
  });

  /* Klik terdelegasi untuk seluruh aplikasi */
  document.addEventListener('click', aksiKlik);

  /* Isian terdelegasi */
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches('[data-set-batas]')) {
      const km = Math.min(60, Math.max(1, nOrNull(t.value) || APP.jangkauan));
      setJalur(S.data, t.dataset.setBatas, km);
      terapkanBatasPeta();
      simpanTertunda();
    } else if (t.matches('[data-set]')) {
      setJalur(S.data, t.dataset.set, nOrNull(t.value));
      simpanTertunda();
    } else if (t.matches('[data-set-teks]')) {
      setJalur(S.data, t.dataset.setTeks, t.value);
      simpanTertunda();
      if (t.dataset.setTeks === 'meta.nama') $('#brand-name').textContent = t.value || 'Desa';
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-impor]') && t.files[0]) { imporGeometri(t.files[0], t.dataset.impor); t.value = ''; }
    if (t.matches('[data-impor-json]') && t.files[0]) { imporJSON(t.files[0]); t.value = ''; }
    if (t.matches('[data-logo-desa]') && t.files[0]) { muatLogoDesa(t.files[0]); t.value = ''; }
  });

  /* Aksesibilitas papan tik untuk baris daftar */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const li = e.target.closest && e.target.closest('.list-item[role="button"]');
    if (li) { e.preventDefault(); li.click(); }
  });

  /* Tutup lembar bawah saat peta digeser di ponsel */
  window.addEventListener('resize', () => { if (S.peta) S.peta.invalidateSize(); });
}

function aksiKlik(e) {
  const T = s => e.target.closest(s);
  let n;

  if ((n = T('[data-tab-ke]')))        return pilihTab(n.dataset.tabKe);
  if (T('[data-buka-kelola]'))         { alihAdmin(true); return pilihTab('kelola'); }
  if (T('[data-alih-admin]'))          return alihAdmin(true);

  if ((n = T('[data-hasil]'))) {
    const h = $('#q-results')._hasil[+n.dataset.hasil];
    return bukaHasil(h);
  }

  if ((n = T('[data-kategori]'))) {
    const k = n.dataset.kategori;
    if (S.kategoriAktif.has(k)) S.kategoriAktif.delete(k); else S.kategoriAktif.add(k);
    gambarTempat(); gambarUlang('tempat');
    return;
  }

  /* Tombol di dalam baris daftar harus diperiksa LEBIH DULU daripada barisnya.
     closest() menelusuri ke atas, jadi klik tombol hapus juga cocok dengan
     baris pembungkusnya — kalau barisnya diperiksa duluan, tombolnya mati. */
  if ((n = T('[data-edit-tempat]'))) {
    e.stopPropagation();
    const t = S.data.tempat.find(x => x.id === n.dataset.editTempat);
    if (t) formTempat(t);
    return;
  }
  if ((n = T('[data-hapus-tempat]'))) {
    e.stopPropagation();
    const t = S.data.tempat.find(x => x.id === n.dataset.hapusTempat);
    if (!t) return;
    return konfirmasi(`Hapus “${t.nama}”?`, 'Tempat ini akan dihapus dari peta.', () => {
      S.data.tempat = S.data.tempat.filter(x => x.id !== t.id);
      simpan(); gambarTempat(); buatPanelLapis(); gambarUlang();
    });
  }
  if ((n = T('[data-hapus-dusun]'))) {
    e.stopPropagation();
    const i = +n.dataset.hapusDusun;
    const d = S.data.batas.dusun[i];
    if (!d) return;
    return konfirmasi(`Hapus “${d.nama || 'dusun ini'}”?`, 'Geometri dusun ini akan dihapus dari peta.', () => {
      S.data.batas.dusun.splice(i, 1);
      simpan(); gambarBatas(); buatPanelLapis(); gambarUlang();
      pesan('Dusun dihapus');
    });
  }
  if ((n = T('[data-ubah-dusun]'))) {
    e.stopPropagation();
    return gambarUlangDusun(+n.dataset.ubahDusun);
  }

  /* Rincian tempat & foto */
  if (T('[data-detail-tutup]'))         return tutupDetail();
  if ((n = T('[data-foto-pilih]')))     return pilihFoto(+n.dataset.fotoPilih);
  if ((n = T('[data-foto-besar]'))) {
    const t = S.data.tempat.find(x => x.id === S.detailAktif);
    return bukaLightbox(daftarFoto(t), +n.dataset.fotoBesar);
  }
  if (T('[data-lb-tutup]'))             return tutupLightbox();
  if ((n = T('[data-lb-geser]')))       return geserLightbox(+n.dataset.lbGeser);
  if (e.target.id === 'lightbox')       return tutupLightbox();

  if ((n = T('[data-detail-tempat]'))) return bukaDetailTempat(n.dataset.detailTempat);
  if ((n = T('[data-ke-tempat]')))     { tutupDetail(); aturLembar(false); return sorotTempat(n.dataset.keTempat); }
  if ((n = T('[data-ke-dusun]')))      return zoomDusun(+n.dataset.keDusun);
  if (T('[data-tambah-tempat]'))       return modeTambahTempat();
  if ((n = T('[data-ke-koord]'))) {
    const [la, lo] = n.dataset.keKoord.split(',').map(Number);
    S.peta.setView([la, lo], 14, { animate: true });
    aturLembar(false);
    return;
  }

  if (T('[data-muat-usulan]'))         return muatUsulanBatas();
  if (T('[data-gambar-batas]'))        return gambarBatasDesa();
  if (T('[data-gambar-dusun]'))        return gambarDusunBaru();
  if (T('[data-zoom-batas]'))          return fokusAwal();
  if (T('[data-hapus-batas]')) {
    return konfirmasi('Hapus batas desa?', 'Poligon batas akan dihapus dari peta.', () => {
      S.data.batas.desa = null;
      simpan(); gambarBatas(); buatPanelLapis(); gambarUlang();
    });
  }

  if (T('[data-gambar-undo]'))         { Gambar.pts.pop(); return perbaruiGambar(); }
  if (T('[data-gambar-batal]'))        { if (Gambar.batalTempat) Gambar.batalTempat(); $('#draw-hud').hidden = true; return batalGambar(); }
  if (T('[data-gambar-selesai]'))      return selesaiGambar();

  if (T('[data-muat-cuaca]'))          { S.cuaca = null; gambarUlang('cuaca'); return ambilCuaca(true); }

  if (T('[data-kosongkan-contoh]')) {
    return konfirmasi('Kosongkan data contoh?',
      'Seluruh angka dan tempat karangan di berkas ini dihapus, sehingga tampilannya sama dengan berkas asli. Berkas asli sendiri tidak tersentuh.', () => {
        try { localStorage.removeItem(APP.simpanan); } catch (err) {}
        S.data = gabung(dataKosong(), { meta: { demo: true } });
        simpan(true);
        gambarBatas(); gambarTempat(); buatPanelLapis(); fokusAwal(); gambarUlang();
        pesan('Data contoh dikosongkan');
      });
  }
  if (T('[data-tutup-radius]'))         return hapusRadius();
  if (T('[data-tabel-atribut]'))        return modalTabelAtribut();

  if ((n = T('[data-bagi]'))) {
    const t = S.data.tempat.find(x => x.id === n.dataset.bagi);
    if (t) modalBagikan(t);
    return;
  }
  if (T('[data-bagi-peta]'))            return modalBagikan(null);

  if ((n = T('[data-rute]'))) {
    const t = S.data.tempat.find(x => x.id === n.dataset.rute);
    if (t) window.open(`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lon}`, '_blank', 'noopener');
    return;
  }

  if ((n = T('[data-tambah-baris]'))) {
    const k = n.dataset.tambahBaris;
    S.data.statistik[k].baris.push(k === 'usia' ? { l: '', lk: null, pr: null } : { l: '', v: null });
    simpan(true); gambarUlang();
    return;
  }
  if ((n = T('[data-hapus-baris]'))) {
    const [k, i] = n.dataset.hapusBaris.split('.');
    S.data.statistik[k].baris.splice(+i, 1);
    simpan(true); gambarUlang();
    return;
  }

  if (T('[data-hapus-logo]')) {
    S.data.meta.logoDesa = '';
    simpan(); gambarUlang();
    return;
  }

  if (T('[data-ekspor-html]'))         return eksporHTML();
  if (T('[data-ekspor-json]'))         return eksporJSON();
  if (T('[data-ekspor-geojson]'))      return eksporGeoJSON();
  if (T('[data-ekspor-csv]'))          return eksporCSV();
  if (T('[data-salin-embed]')) {
    const ta = $('#kode-embed');
    ta.select();
    navigator.clipboard ? navigator.clipboard.writeText(ta.value).then(() => pesan('Kode sematan disalin'))
                        : (document.execCommand('copy'), pesan('Kode sematan disalin'));
    return;
  }
  if (T('[data-reset]')) {
    return konfirmasi('Kosongkan semua data?', 'Seluruh statistik, tempat, dan batas akan dihapus dari perangkat ini. Cadangkan dulu bila perlu.', () => {
      try { localStorage.removeItem(APP.simpanan); } catch (err) {}
      S.data = dataKosong();
      simpan(true);
      gambarBatas(); gambarTempat(); buatPanelLapis(); fokusAwal(); gambarUlang();
      pesan('Data dikosongkan');
    });
  }
}

function konfirmasi(judul, teks, fn) {
  bukaModal({
    judul,
    isi: `<p style="font-size:13px;line-height:1.6;color:var(--ink-2)">${esc(teks)}</p>`,
    aksi: [{ label: 'Batal', fn: () => {} }, { label: 'Ya, lanjutkan', cls: 'danger', fn }]
  });
}

/* ── Pemuatan awal ────────────────────────────────────────── */
function mulai() {
  temaAwal();
  S.data = muatData();
  S.basemap = bacaJSON('basemap-data') || {};

  $('#brand-name').textContent = S.data.meta.nama;
  $('#brand-sub').textContent = `${S.data.meta.kecamatan} · ${S.data.meta.kabupaten} · ${S.data.meta.provinsi}`;
  document.title = `Peta Digital ${S.data.meta.nama} — ${S.data.meta.kecamatan}, ${S.data.meta.kabupaten}`;

  siapkanTooltip();
  buatPeta();
  pasangInteraksi();
  pilihTab('beranda', false);   // di ponsel, peta dulu yang terlihat

  if (S.data.meta.demo) $('#demo-bar').hidden = false;

  if (new URLSearchParams(location.search).get('kelola') === '1') alihAdmin(true);

  bukaDariHash();
  addEventListener('hashchange', bukaDariHash);

  ambilCuaca(false);
  setInterval(() => ambilCuaca(true), 30 * 60 * 1000);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai);
else mulai();
