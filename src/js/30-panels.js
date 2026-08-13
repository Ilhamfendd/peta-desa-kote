/* ═══════════════════════════════════════════════════════════
   30 — Panel: Beranda, Statistik, Tempat, Wilayah
   ═══════════════════════════════════════════════════════════ */

/* ── Nilai turunan ────────────────────────────────────────── */
const jml = arr => {
  const v = arr.filter(x => x != null && isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};

function totalPenduduk() {
  const st = S.data.statistik;
  if (st.ringkas.penduduk != null) return st.ringkas.penduduk;
  const g = jml(st.gender.baris.map(b => b.v));
  if (g != null) return g;
  return jml(st.usia.baris.flatMap(b => [b.lk, b.pr]));
}

function luasKm2() {
  const l = S.data.statistik.ringkas.luas;
  if (l != null) return l;
  const r = S.data.batas.desa && cincinLuar(S.data.batas.desa);
  return (r && r.length > 2) ? luasPoligon(r) / 1e6 : null;
}

function luasDariPeta() {
  const r = S.data.batas.desa && cincinLuar(S.data.batas.desa);
  return (r && r.length > 2) ? luasPoligon(r) / 1e6 : null;
}

function kepadatan() {
  const p = totalPenduduk(), l = luasKm2();
  return (p != null && l != null && l > 0) ? p / l : null;
}

function rasioKelamin() {
  const [lk, pr] = S.data.statistik.gender.baris.map(b => b.v);
  return (lk != null && pr != null && pr > 0) ? lk / pr * 100 : null;
}

function adaDataStat() {
  const st = S.data.statistik;
  return totalPenduduk() != null
    || Object.values(st.ringkas).some(v => v != null)
    || GRUP_STAT.some(k => st[k].baris.some(b => b.v != null));
}

/** Satu blok angka: satu nilai utama, sisanya baris ringkas.
    Menggantikan kartu-kartu kotak yang dulu menghabiskan tinggi layar
    hanya untuk memuat satu angka. */
function blokStat(o) {
  const kosong = o.nilai == null;
  const baris = (o.rinci || []).map(r => `
    <div${r.petunjuk ? ` title="${esc(r.petunjuk)}"` : ''}>
      <dt>${esc(r.l)}</dt>
      <dd${r.v == null ? ' class="dim"' : ''}>${r.v == null ? 'Belum diisi' : r.v}${
        r.satuan ? ` <em>${esc(r.satuan)}</em>` : ''}</dd>
    </div>`).join('');

  return `<div class="card stat-blok">
    <div class="sb-utama">
      <span class="sb-label">${esc(o.label)}</span>
      <span class="sb-nilai${kosong ? ' dim' : ''}">${kosong ? 'Belum diisi' : o.nilai}${
        !kosong && o.satuan ? ` <em>${esc(o.satuan)}</em>` : ''}</span>
    </div>
    ${baris ? `<dl class="sb-rinci">${baris}</dl>` : ''}
  </div>`;
}

/* ── Beranda ──────────────────────────────────────────────── */
function panelBeranda() {
  const m = S.data.meta, p = S.data.profil;
  const pdd = totalPenduduk(), l = luasKm2();
  const belumAda = !adaDataStat() && !S.data.tempat.length && !S.data.batas.desa;

  const onboarding = belumAda ? `
    <div class="card" style="border-color:var(--accent);background:var(--accent-wash)">
      <h3 style="color:var(--accent)">Peta ini masih kosong</h3>
      <p style="font-size:13px;line-height:1.6;color:var(--ink-2)">
        Kerangkanya sudah siap — geometri jalan dan garis pantai diambil dari OpenStreetMap.
        Yang belum ada adalah data milik desa: batas wilayah, statistik penduduk, dan daftar tempat.
        Tidak ada satu pun angka yang dikarang di sini.
      </p>
      <div class="btn-row" style="margin-top:11px">
        <button class="btn primary" data-buka-kelola>Mulai isi data</button>
      </div>
    </div>` : '';

  const sLaut = (S.cuaca && S.cuaca.lautKini) ? statusGelombang(S.cuaca.lautKini.wave_height) : null;
  const wx = (S.cuaca && !S.cuaca.gagal) ? `
    ${sLaut && sLaut.perhatian ? spandukGelombang(sLaut) : ''}
    <button class="card" data-tab-ke="cuaca" style="width:100%;text-align:left;cursor:pointer;display:block">
      <h3>Cuaca sekarang</h3>
      <div class="wx-now wx-ringkas">
        <div class="wx-ico">${ikonCuaca(S.cuaca.kode, S.cuaca.siang)}</div>
        <div class="wx-temp">${angka1(S.cuaca.suhu)}°</div>
        <div class="wx-desc">${esc(TEKS_CUACA[S.cuaca.kode] || 'Tidak diketahui')}</div>
      </div>
      ${sLaut && !sLaut.perhatian ? `<p class="chart-note" style="margin-top:8px">
        Gelombang ${esc(sLaut.label.toLowerCase())} ${angka2(sLaut.tinggi)} m — ${esc(sLaut.saran.toLowerCase())}</p>` : ''}
    </button>` : '';

  const logoDesa = safeUrl(m.logoDesa);

  return `
    <div class="cover">
      <div class="cover-logos">
        <span class="logo-kkn" aria-hidden="true"></span>
        ${logoDesa ? `<img src="${esc(logoDesa)}" alt="Logo ${esc(m.nama)}">` : ''}
      </div>
      <div class="cover-txt">
        <h2>Peta Digital ${esc(m.nama)}</h2>
        <p>Kec. ${esc(m.kecamatan)} · Kab. ${esc(m.kabupaten)} · ${esc(m.provinsi)}</p>
        ${p.tim ? `<span class="cover-tag">${esc(p.tim)}</span>` : ''}
      </div>
    </div>

    ${onboarding}

    ${blokStat({
      label: 'Jumlah penduduk',
      nilai: pdd == null ? null : NF.format(pdd),
      satuan: 'jiwa',
      rinci: [
        { l: 'Luas wilayah', v: l == null ? null : angka2(l), satuan: 'km²',
          petunjuk: (luasDariPeta() != null && S.data.statistik.ringkas.luas == null) ? 'Dihitung dari batas di peta' : '' },
        { l: 'Kepala keluarga', v: S.data.statistik.ringkas.kk == null ? null : NF.format(S.data.statistik.ringkas.kk), satuan: 'KK' },
        { l: 'Dusun', v: S.data.statistik.ringkas.dusun == null ? null : NF.format(S.data.statistik.ringkas.dusun) },
        { l: 'Tempat terdata', v: NF.format(S.data.tempat.length), satuan: 'titik' }
      ]
    })}

    ${wx}

    ${p.visi ? `<div class="card"><h3>Visi</h3><div class="prose">${esc(p.visi)}</div></div>` : ''}
    ${p.sejarah ? `<div class="card"><h3>Sejarah singkat</h3><div class="prose">${esc(p.sejarah)}</div></div>` : ''}

    <div class="card">
      <h3>Identitas & kontak</h3>
      <div class="kv">
        <div><span class="k">Kode wilayah</span><span class="v" style="font-variant-numeric:tabular-nums">${esc(m.kode || '—')}</span></div>
        <div><span class="k">Kepala desa</span><span class="v${p.kepala ? '' : ' dim'}">${esc(p.kepala || 'Belum diisi')}</span></div>
        <div><span class="k">Kantor desa</span><span class="v${p.alamat ? '' : ' dim'}">${esc(p.alamat || 'Belum diisi')}</span></div>
        <div><span class="k">Telepon</span><span class="v${p.telepon ? '' : ' dim'}">${esc(p.telepon || 'Belum diisi')}</span></div>
        <div><span class="k">Surel</span><span class="v${p.email ? '' : ' dim'}">${esc(p.email || 'Belum diisi')}</span></div>
      </div>
    </div>

    ${p.tim ? `<div class="kredit">
      <span class="logo-kkn" aria-hidden="true"></span>
      <div><b>${esc(p.tim)}</b>Penyusun peta digital ${esc(m.nama)}${p.institusi ? ' · ' + esc(p.institusi) : ''}${p.tahun ? ' · ' + esc(p.tahun) : ''}</div>
    </div>` : ''}

    <p style="font-size:11px;color:var(--muted);line-height:1.55;margin-top:12px">
      Diperbarui ${esc(tanggal(m.diperbarui, true))}.
      Geometri dasar © OpenStreetMap (ODbL). Cuaca dari Open-Meteo.
    </p>`;
}

/* ── Statistik ────────────────────────────────────────────── */
function panelStatistik() {
  const st = S.data.statistik;
  const pdd = totalPenduduk(), kp = kepadatan(), rk = rasioKelamin();

  if (!adaDataStat()) {
    return `<div class="p-head"><h2>Statistik</h2><p>Data kependudukan Desa Kote</p></div>
      <div class="empty-state">
        ${ikon('M4.5 19.5V11M9.8 19.5V5.5M15.1 19.5v-6M20.4 19.5V8.5')}
        <b>Belum ada data statistik</b>
        <p>Angka penduduk tingkat desa tidak tersedia di sumber publik, jadi tidak ada yang bisa diisi otomatis.
           Masukkan dari Profil Desa, data Podes, atau laporan desa Anda.</p>
      </div>
      <div class="btn-row" style="margin-top:12px"><button class="btn primary wide" data-buka-kelola>Isi data statistik</button></div>`;
  }

  const kartuGender = kartuGrafik('Jenis kelamin',
    grafikBatang(st.gender.baris, { satuan: 'jiwa', judul: 'Penduduk menurut jenis kelamin' }),
    tabelStat(st.gender.baris, [{ l: 'Kelompok', f: b => esc(b.l) }, { l: 'Jiwa', k: 'v' }]));

  const kartuUsia = kartuGrafik('Kelompok umur',
    grafikPiramida(st.usia.baris),
    tabelStat(st.usia.baris, [
      { l: 'Umur', f: b => esc(b.l) },
      { l: 'Laki-laki', k: 'lk' },
      { l: 'Perempuan', k: 'pr' }
    ]));

  const lain = GRUP_STAT.map(k => {
    const g = st[k];
    return kartuGrafik(g.judul,
      grafikBatang(g.baris, { satuan: g.satuan, judul: g.judul }),
      tabelStat(g.baris, [{ l: g.judul, f: b => esc(b.l) }, { l: 'Jiwa', k: 'v' }]));
  }).join('');

  return `
    <div class="p-head"><h2>Statistik</h2><p>Data kependudukan Desa Kote</p></div>

    ${blokStat({
      label: 'Jumlah penduduk',
      nilai: pdd == null ? null : NF.format(pdd),
      satuan: 'jiwa',
      rinci: [
        { l: 'Kepala keluarga', v: st.ringkas.kk == null ? null : NF.format(st.ringkas.kk), satuan: 'KK' },
        { l: 'Kepadatan', v: kp == null ? null : angka1(kp), satuan: 'jiwa/km²' },
        { l: 'Rasio jenis kelamin', v: rk == null ? null : angka1(rk), satuan: 'L/100 P',
          petunjuk: 'Jumlah laki-laki per 100 perempuan' },
        { l: 'RT / RW', v: (st.ringkas.rt == null && st.ringkas.rw == null) ? null
            : `${st.ringkas.rt == null ? '—' : NF.format(st.ringkas.rt)} / ${st.ringkas.rw == null ? '—' : NF.format(st.ringkas.rw)}` }
      ]
    })}

    ${kartuGender}${kartuUsia}${lain}

    <div class="note">
      ${ikon('M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 11v5.2M12 7.9h.01')}
      <span>Semua angka di halaman ini berasal dari data yang Anda masukkan sendiri.
      Cantumkan sumber dan tahunnya di tab Kelola agar pembaca tahu kapan data ini berlaku.</span>
    </div>
    ${S.data.profil.sumberStat ? `<p class="chart-note">Sumber: ${esc(S.data.profil.sumberStat)}</p>` : ''}`;
}

/* ── Tempat ───────────────────────────────────────────────── */
function panelTempat() {
  const semua = S.data.tempat;
  const hitung = {};
  semua.forEach(t => { hitung[t.kategori] = (hitung[t.kategori] || 0) + 1; });

  const chips = Object.entries(KATEGORI).map(([k, d]) => {
    const n = hitung[k] || 0;
    if (!n) return '';
    return `<button class="chip" data-kategori="${k}" aria-pressed="${S.kategoriAktif.has(k)}">
      <i style="background:var(${d.warna})"></i>${esc(d.label)} ${n}</button>`;
  }).join('');

  const tampil = semua.filter(t => S.kategoriAktif.has(t.kategori))
    .slice().sort((a, b) => (a.kategori === b.kategori)
      ? String(a.nama).localeCompare(String(b.nama), 'id')
      : Object.keys(KATEGORI).indexOf(a.kategori) - Object.keys(KATEGORI).indexOf(b.kategori));

  const daftar = tampil.map(t => {
    const d = KATEGORI[t.kategori] || KATEGORI.lainnya;
    return `<div class="list-item" data-detail-tempat="${esc(t.id)}" role="button" tabindex="0">
      <span class="li-ico" style="background:var(${d.warna})">${ikon(d.ikon)}</span>
      <span class="li-txt"><b>${esc(t.nama || 'Tanpa nama')}</b><small>${esc(d.label)}${t.alamat ? ' · ' + esc(t.alamat) : ''}</small></span>
      <span class="li-act admin-only">
        <button class="icon-btn tiny" data-edit-tempat="${esc(t.id)}" aria-label="Ubah ${esc(t.nama)}">${ikon('M4.5 19.5h4L19 9a2.5 2.5 0 0 0-3.5-3.5L5 16z')}</button>
        <button class="icon-btn tiny" data-hapus-tempat="${esc(t.id)}" aria-label="Hapus ${esc(t.nama)}">${ikon('M5 7h14M10 7V5h4v2M6.5 7l.8 12.5h9.4L17.5 7')}</button>
      </span>
    </div>`;
  }).join('');

  const kosong = `<div class="empty-state">
      ${ikon('M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z')}
      <b>Belum ada tempat</b>
      <p>Peta ini belum punya titik fasilitas. OpenStreetMap pun hampir tidak memetakan Desa Kote,
         jadi semuanya perlu ditambahkan manual.</p>
    </div>`;

  return `
    <div class="p-head"><h2>Tempat & fasilitas</h2><p>${semua.length} titik terdata</p></div>
    <div class="btn-row admin-only" style="margin-bottom:8px">
      <button class="btn primary wide" data-tambah-tempat>
        ${ikon('M12 5v14M5 12h14')}Tambah tempat di peta</button>
    </div>
    ${semua.length ? `<div class="btn-row" style="margin-bottom:12px">
      <button class="btn sm" data-tabel-atribut>${ikon('M3.6 9.4h16.8M3.6 14.6h16.8M9.4 4.2v15.6M4.4 4.2h15.2a.8.8 0 0 1 .8.8v14a.8.8 0 0 1-.8.8H4.4a.8.8 0 0 1-.8-.8V5a.8.8 0 0 1 .8-.8z')}Tabel atribut</button>
      <button class="btn sm" data-ekspor-csv>${ikon('M12 3.6v11.5M7.6 10.8l4.4 4.3 4.4-4.3M4.5 19.5h15')}CSV</button>
    </div>` : ''}
    ${semua.length ? `<div class="chips">${chips}</div><div class="list">${daftar}</div>` : kosong}`;
}

/* ── Wilayah ──────────────────────────────────────────────── */

/** Batas usulan yang ditanam dari GADM — rancangan awal, bukan penetapan resmi. */
function adaUsulanBatas() {
  const u = S.basemap && S.basemap.usulanBatas;
  return !!(u && u.features && u.features.length);
}

function muatUsulanBatas() {
  if (!adaUsulanBatas()) return;
  const f = S.basemap.usulanBatas.features[0];
  const r = cincinLuar(f);

  const luasUsulan = luasPoligon(r) / 1e6;
  const luasResmi = S.data.statistik.ringkas.luas;
  // Seberapa jauh melesetnya menentukan nada peringatannya — jangan dipatok,
  // sebab luas resmi desa bisa berubah bila datanya diperbarui.
  const selisihUsulan = (luasResmi && luasResmi > 0) ? Math.abs(luasUsulan / luasResmi - 1) : null;
  const beda = selisihUsulan == null ? ''
    : ` Luas poligon ini ${angka1(luasUsulan)} km², sedangkan luas resmi desa ${angka1(luasResmi)} km²` +
      (selisihUsulan <= 0.1
        ? ` — selisihnya hanya ${angka1(selisihUsulan * 100)}%, jadi cukup layak sebagai rancangan awal.`
        : ` — meleset ${angka1(selisihUsulan * 100)}%, jadi perlu banyak diperbaiki.`);

  konfirmasi('Muat batas usulan?',
    `Poligon dari basis data GADM dengan ${r.length} titik akan dipasang sebagai batas desa.${beda} ` +
    'Ini rancangan awal yang kasar — periksa dan geser titiknya bersama perangkat desa sebelum diterbitkan.', () => {
      S.data.batas.desa = JSON.parse(JSON.stringify(f));
      S.data.batas.desa.properties = { nama: S.data.meta.nama, sumber: 'GADM 4.1 — perlu diperiksa' };
      simpan(); gambarBatas(); buatPanelLapis(); fokusAwal(); gambarUlang();
      pesan('Batas usulan dimuat — silakan geser titiknya agar tepat');
    });
}
function panelWilayah() {
  const b = S.data.batas.desa;
  const r = b && cincinLuar(b);
  const pusat = S.data.meta.pusat || APP.pusat;

  // Luas dari poligon vs luas resmi: bila jauh berbeda, katakan terus terang.
  const luasGambar = r && r.length > 2 ? luasPoligon(r) / 1e6 : null;
  const luasResmi = S.data.statistik.ringkas.luas;
  const selisih = (luasGambar && luasResmi > 0) ? Math.abs(luasGambar / luasResmi - 1) : 0;

  const info = r && r.length > 2 ? `
    <div class="kv">
      <div><span class="k">Luas digambar</span><span class="v">${teksLuas(luasPoligon(r))}</span></div>
      ${luasResmi ? `<div><span class="k">Luas resmi</span><span class="v">${angka2(luasResmi)} km²</span></div>` : ''}
      <div><span class="k">Keliling</span><span class="v">${teksJarak(panjangJalur(r.concat([r[0]])))}</span></div>
      <div><span class="k">Titik batas</span><span class="v">${NF.format(r.length)} titik</span></div>
    </div>
    ${selisih > 0.15 ? `<div class="note warn" style="margin:10px 0 0">
      ${ikon('M12 8.4v5M12 16.6h.01M10.3 4.2L2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z')}
      <span>Poligon yang digambar ${angka1(selisih * 100)}% ${luasGambar > luasResmi ? 'lebih besar' : 'lebih kecil'}
      dari luas resmi. Geser titiknya agar mendekati ${angka2(luasResmi)} km².</span></div>` : ''}
    <div class="btn-row" style="margin-top:11px">
      <button class="btn sm" data-zoom-batas>Lihat di peta</button>
      <button class="btn sm admin-only" data-gambar-batas>Gambar ulang</button>
      <button class="btn sm danger admin-only" data-hapus-batas>Hapus</button>
    </div>` : `
    <div class="empty-state">
      ${ikon('M9 4.5L3.8 6.8v12.7L9 17.2l6 2.3 5.2-2.3V4.5L15 6.8z')}
      <b>Batas desa belum digambar</b>
      <p>OpenStreetMap belum memuat poligon batas Desa Kote — hanya satu titik pusat.</p>
    </div>
    ${adaUsulanBatas() ? `
      <div class="note admin-only" style="margin-top:11px">
        ${ikon('M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 11v5.2M12 7.9h.01')}
        <span>Tersedia <b>batas usulan</b> dari basis data GADM — hanya 18 titik, jadi kasar
        dan belum tentu sesuai penetapan resmi. Cocok sebagai rancangan awal untuk lalu
        digeser bersama perangkat desa.</span>
      </div>` : ''}
    <div class="btn-row admin-only" style="margin-top:11px">
      <button class="btn primary wide" data-gambar-batas>${ikon('M4.5 19.5h4L19 9a2.5 2.5 0 0 0-3.5-3.5L5 16z')}Gambar batas di peta</button>
      ${adaUsulanBatas() ? `<button class="btn wide" data-muat-usulan>
        ${ikon('M12 3.6v11.5M7.6 10.8l4.4 4.3 4.4-4.3M4.5 19.5h15')}Muat batas usulan</button>` : ''}
    </div>`;

  const dusun = (S.data.batas.dusun || []).map((d, i) => {
    const dr = d.geo && cincinLuar(d.geo);
    return `<div class="list-item" data-ke-dusun="${i}" role="button" tabindex="0">
      <span class="li-ico" style="background:var(--series-${(i % 8) + 1})">${ikon('M9 4.5L3.8 6.8v12.7L9 17.2l6 2.3 5.2-2.3V4.5L15 6.8z')}</span>
      <span class="li-txt"><b>${esc(d.nama || 'Dusun ' + (i + 1))}</b>
        <small>${dr ? teksLuas(luasPoligon(dr)).replace(/<[^>]+>/g, '') : 'tanpa geometri'}</small></span>
      <span class="li-act admin-only">
        <button class="icon-btn tiny" data-ubah-dusun="${i}" aria-label="Gambar ulang ${esc(d.nama || 'dusun')}"
                title="Gambar ulang batas">${ikon('M4.5 19.5h4L19 9a2.5 2.5 0 0 0-3.5-3.5L5 16z')}</button>
        <button class="icon-btn tiny" data-hapus-dusun="${i}" aria-label="Hapus ${esc(d.nama || 'dusun')}"
                title="Hapus dusun">${ikon('M5 7h14M10 7V5h4v2M6.5 7l.8 12.5h9.4L17.5 7')}</button>
      </span>
    </div>`;
  }).join('');

  // Desa terdekat dihitung dari geometri OSM yang tertanam.
  const tetangga = (S.basemap && S.basemap.places ? S.basemap.places.features : [])
    .filter(f => f.properties.k === 'village' && !desaIni(f.properties.n))
    .map(f => ({ n: f.properties.n, d: jarak(pusat, [f.geometry.coordinates[1], f.geometry.coordinates[0]]),
                 ll: [f.geometry.coordinates[1], f.geometry.coordinates[0]] }))
    .filter(t => t.d > 300)          // titik yang praktis berimpit = desa ini juga
    .sort((a, b) => a.d - b.d).slice(0, 6);

  return `
    <div class="p-head"><h2>Wilayah</h2><p>Batas, letak, dan pembagian administratif</p></div>

    <div class="card"><h3>Batas desa</h3>${info}</div>

    <div class="card">
      <h3>Dusun / RW</h3>
      ${dusun ? `<div class="list">${dusun}</div>` : `<p class="chart-note">Belum ada dusun yang digambar.</p>`}
      <div class="btn-row admin-only" style="margin-top:10px">
        <button class="btn sm" data-gambar-dusun>${ikon('M12 5v14M5 12h14')}Tambah dusun</button>
      </div>
    </div>

    <div class="card">
      <h3>Letak</h3>
      <div class="kv">
        <div><span class="k">Lintang</span><span class="v" style="font-variant-numeric:tabular-nums">${esc(dms(pusat[0], 'lat'))}</span></div>
        <div><span class="k">Bujur</span><span class="v" style="font-variant-numeric:tabular-nums">${esc(dms(pusat[1], 'lng'))}</span></div>
        <div><span class="k">Desimal</span><span class="v" style="font-variant-numeric:tabular-nums">${pusat[0].toFixed(5)}, ${pusat[1].toFixed(5)}</span></div>
        <div><span class="k">Pulau</span><span class="v">Singkep</span></div>
      </div>
    </div>

    <div class="card">
      <h3>Desa sekitar</h3>
      <div class="list">${tetangga.map(t => `
        <div class="list-item" data-ke-koord="${t.ll[0]},${t.ll[1]}" role="button" tabindex="0">
          <span class="li-txt"><b>${esc(t.n)}</b><small>${teksJarak(t.d)} dari pusat desa</small></span>
        </div>`).join('')}</div>
      <p class="chart-note" style="margin-top:8px">Jarak garis lurus dari titik pusat desa, bukan jarak tempuh.</p>
    </div>`;
}

/* ── Rincian satu tempat ──────────────────────────────────────
   Menggantikan popup kecil di peta: foto besar, galeri, dan
   keterangan lengkap — supaya potensi desa layak dipamerkan. */
function bukaDetailTempat(id) {
  const t = S.data.tempat.find(x => x.id === id);
  if (!t) return;
  S.detailAktif = id;

  const d = KATEGORI[t.kategori] || KATEGORI.lainnya;
  const foto = daftarFoto(t);
  const web = safeUrl(t.website);
  const tel = String(t.kontak || '').replace(/[^\d+]/g, '');

  const galeri = foto.length ? `
    <div class="dt-galeri">
      <button class="dt-utama" data-foto-besar="0" aria-label="Perbesar foto">
        <img src="${esc(foto[0])}" alt="Foto ${esc(t.nama)}" loading="lazy">
        ${foto.length > 1 ? `<span class="dt-jml">${ikon('M4.5 16.5V5.8h10.7')}${foto.length} foto</span>` : ''}
      </button>
      ${foto.length > 1 ? `<div class="dt-mini">${foto.map((f, i) => `
        <button class="dt-mini-btn${i === 0 ? ' aktif' : ''}" data-foto-pilih="${i}" aria-label="Foto ${i + 1}">
          <img src="${esc(f)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    </div>` : '';

  const baris = [];
  if (t.alamat) baris.push(['M12 20.6s6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0c0 4.5 6.8 10.6 6.8 10.6z', 'Alamat', esc(t.alamat)]);
  if (t.kontak) baris.push(['M4.5 6.2c0 7.5 5.8 13.3 13.3 13.3l1.7-3.4-4.2-2.1-2 2a13.6 13.6 0 0 1-5.3-5.3l2-2L8 4.5z', 'Kontak',
    tel ? `<a href="tel:${esc(tel)}">${esc(t.kontak)}</a>` : esc(t.kontak)]);
  if (t.jam) baris.push(['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 7.4V12l3.1 1.8', 'Jam buka', esc(t.jam)]);
  if (web) baris.push(['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM3.5 12h17M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17z', 'Situs',
    `<a href="${esc(web)}" target="_blank" rel="noopener noreferrer">${esc(t.website)}</a>`]);
  baris.push(['M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM12 2.2v3M12 19v3M21.8 12h-3M5.2 12h-3', 'Koordinat',
    `${t.lat.toFixed(6)}, ${t.lon.toFixed(6)}`]);

  $('#detail').innerHTML = `
    <div class="dt-head">
      <button class="icon-btn" data-detail-tutup aria-label="Kembali">
        ${ikon('M15 5l-7 7 7 7')}</button>
      <span class="dt-kat"><i style="background:var(${d.warna})"></i>${esc(d.label)}</span>
    </div>
    <div class="dt-isi">
      ${galeri}
      <h2>${esc(t.nama || 'Tanpa nama')}</h2>
      ${t.deskripsi ? `<p class="dt-desk">${esc(t.deskripsi)}</p>` : ''}
      <dl class="dt-info">${baris.map(([p, k, v]) => `
        <div>${ikon(p)}<dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <div class="btn-row">
        <button class="btn" data-ke-tempat="${esc(t.id)}">${ikon('M12 20.6s6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0c0 4.5 6.8 10.6 6.8 10.6z')}Lihat di peta</button>
        <button class="btn" data-rute="${esc(t.id)}">${ikon('M4 17.5L20 4l-6.5 16-2-6z')}Rute</button>
        <button class="btn" data-bagi="${esc(t.id)}">${ikon('M14.5 7.5l-5 3M9.5 13.5l5 3M6.8 14.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM17.2 8.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8zM17.2 20.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z')}Bagikan</button>
        <button class="btn admin-only" data-edit-tempat="${esc(t.id)}">${ikon('M4.5 19.5h4L19 9a2.5 2.5 0 0 0-3.5-3.5L5 16z')}Ubah</button>
      </div>
    </div>`;
  $('#detail').hidden = false;
  $('#detail').scrollTop = 0;
  aturLembar(true);

  // Geser peta ke tempatnya tanpa mengubah zoom, agar tetap dalam konteks
  if (S.peta) S.peta.panTo([t.lat, t.lon], { animate: true });
  const mk = S.markerTempat.get(id);
  const el = mk && mk.getElement && mk.getElement();
  if (el) {
    const p = el.querySelector('.poi-pin');
    if (p) { p.classList.add('on'); setTimeout(() => p.classList.remove('on'), 2200); }
  }
}

function tutupDetail() {
  $('#detail').hidden = true;
  S.detailAktif = null;
}

/** Ganti foto utama tanpa menggambar ulang seluruh panel. */
function pilihFoto(i) {
  const t = S.data.tempat.find(x => x.id === S.detailAktif);
  const foto = daftarFoto(t);
  if (!foto[i]) return;
  const utama = $('#detail .dt-utama');
  utama.querySelector('img').src = foto[i];
  utama.dataset.fotoBesar = i;
  $$('#detail .dt-mini-btn').forEach((b, j) => b.classList.toggle('aktif', j === i));
}

/* ── Foto layar penuh ─────────────────────────────────────── */
let lbFoto = [], lbIdx = 0;

function bukaLightbox(daftar, i) {
  lbFoto = daftar; lbIdx = i;
  gambarLightbox();
  $('#lightbox').hidden = false;
  document.addEventListener('keydown', tombolLightbox);
}

function gambarLightbox() {
  $('#lightbox').innerHTML = `
    <button class="lb-tutup icon-btn" data-lb-tutup aria-label="Tutup">${ikon('M6 6l12 12M18 6L6 18')}</button>
    ${lbFoto.length > 1 ? `<button class="lb-nav lb-prev" data-lb-geser="-1" aria-label="Foto sebelumnya">${ikon('M15 5l-7 7 7 7')}</button>
    <button class="lb-nav lb-next" data-lb-geser="1" aria-label="Foto berikutnya">${ikon('M9 5l7 7-7 7')}</button>` : ''}
    <img src="${esc(lbFoto[lbIdx])}" alt="">
    ${lbFoto.length > 1 ? `<span class="lb-hitung">${lbIdx + 1} / ${lbFoto.length}</span>` : ''}`;
}

function geserLightbox(arah) {
  lbIdx = (lbIdx + arah + lbFoto.length) % lbFoto.length;
  gambarLightbox();
}

function tutupLightbox() {
  $('#lightbox').hidden = true;
  document.removeEventListener('keydown', tombolLightbox);
}

function tombolLightbox(e) {
  if (e.key === 'Escape') tutupLightbox();
  else if (e.key === 'ArrowLeft') geserLightbox(-1);
  else if (e.key === 'ArrowRight') geserLightbox(1);
}

/* ── Router panel ─────────────────────────────────────────── */
const PENGGAMBAR = {
  beranda: panelBeranda,
  statistik: panelStatistik,
  tempat: panelTempat,
  cuaca: panelCuaca,
  wilayah: panelWilayah,
  kelola: panelKelola
};

function gambarPanel(nama) {
  const sec = $(`.panel[data-panel="${nama}"]`);
  if (!sec) return;
  sec.innerHTML = PENGGAMBAR[nama]();
}

function gambarUlang(nama) {
  if (nama) { if (nama === S.tabAktif) gambarPanel(nama); return; }
  gambarPanel(S.tabAktif);
}

/** `bukaLembar: false` dipakai saat pemuatan awal — di ponsel, peta yang
    harus terlihat lebih dulu, bukan panelnya. */
function pilihTab(nama, bukaLembar) {
  S.tabAktif = nama;
  $$('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === nama)));
  $$('.panel').forEach(p => { p.hidden = p.dataset.panel !== nama; });
  gambarPanel(nama);
  const wrap = $('.panels'); if (wrap) wrap.scrollTop = 0;
  if (bukaLembar !== false) aturLembar(true);
}
