/* ═══════════════════════════════════════════════════════════
   60 — Kelola: formulir data, impor/ekspor, pemasangan
   ═══════════════════════════════════════════════════════════ */

function unduh(nama, isi, tipe) {
  const b = new Blob([isi], { type: (tipe || 'text/plain') + ';charset=utf-8' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

const namaBerkas = ext => `peta-${S.data.meta.nama.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.${ext}`;

/* ── Ekspor ───────────────────────────────────────────────── */
function eksporJSON() {
  unduh(namaBerkas('json'), JSON.stringify(S.data, null, 2), 'application/json');
  pesan('Data JSON diunduh');
}

function eksporGeoJSON() {
  const f = [];
  if (S.data.batas.desa) {
    f.push(Object.assign({}, S.data.batas.desa, {
      properties: Object.assign({}, S.data.batas.desa.properties, { jenis: 'batas_desa', nama: S.data.meta.nama })
    }));
  }
  (S.data.batas.dusun || []).forEach(d => {
    if (d.geo) f.push(Object.assign({}, d.geo, { properties: { jenis: 'dusun', nama: d.nama } }));
  });
  S.data.tempat.forEach(t => f.push({
    type: 'Feature',
    properties: { jenis: 'tempat', nama: t.nama, kategori: t.kategori, deskripsi: t.deskripsi,
                  alamat: t.alamat, kontak: t.kontak, jam: t.jam, website: t.website },
    geometry: { type: 'Point', coordinates: [+t.lon.toFixed(6), +t.lat.toFixed(6)] }
  }));

  if (!f.length) return pesan('Belum ada geometri untuk diekspor', true);
  unduh(namaBerkas('geojson'), JSON.stringify({ type: 'FeatureCollection', features: f }, null, 2), 'application/geo+json');
  pesan(`${f.length} objek diekspor ke GeoJSON`);
}

/** Menyalin halaman ini menjadi berkas HTML baru berisi data terkini. */
function bangunHTMLMandiri() {
  const doc = document.documentElement.cloneNode(true);

  // "<" di-escape agar teks pengguna tidak bisa menutup blok <script> lebih awal.
  doc.querySelector('#desa-data').textContent = JSON.stringify(S.data).replace(/</g, '\\u003c');

  const peta = doc.querySelector('#map');
  peta.innerHTML = ''; peta.className = ''; peta.removeAttribute('style');

  doc.querySelectorAll('.panel').forEach(p => { p.innerHTML = ''; });
  ['#layer-panel', '#legend', '#toast-wrap', '#q-results', '#draw-hud'].forEach(s => {
    const n = doc.querySelector(s); if (n) n.innerHTML = '';
  });
  const hud = doc.querySelector('#draw-hud'); if (hud) hud.hidden = true;
  const qr = doc.querySelector('#q-results'); if (qr) qr.hidden = true;
  const q = doc.querySelector('#q'); if (q) q.removeAttribute('value');
  const tip = doc.querySelector('.chart-tip'); if (tip) tip.remove();
  const mb = doc.querySelector('.modal-bg'); if (mb) mb.remove();

  // Tautan pulang ke situs desa dilepas: berkas hasil ekspor sering dibuka
  // langsung dari komputer, dan "/" di sana menunjuk ke akar penyimpanan.
  // mulai() memasangnya kembali sendiri bila berkasnya disajikan lewat web.
  const merek = doc.querySelector('#brand');
  if (merek) { merek.removeAttribute('href'); merek.removeAttribute('title'); }

  doc.querySelector('body').className = '';
  doc.querySelectorAll('.panel').forEach((p, i) => { p.hidden = i !== 0; });
  doc.querySelectorAll('.tabs button').forEach((b, i) => b.setAttribute('aria-selected', String(i === 0)));

  return '<!DOCTYPE html>\n' + doc.outerHTML;
}

function eksporHTML() {
  unduh('peta-desa-kote.html', bangunHTMLMandiri(), 'text/html');
  pesan('Berkas HTML mandiri diunduh — siap diunggah ke website desa');
}

/* ── Impor ────────────────────────────────────────────────── */
function imporJSON(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const masuk = JSON.parse(String(fr.result));
      if (!masuk || !masuk.meta) throw new Error('bukan data peta desa');
      S.data = gabung(dataKosong(), masuk);
      simpan(true);
      S.kategoriAktif = new Set(Object.keys(KATEGORI));
      gambarBatas(); gambarTempat(); buatPanelLapis(); fokusAwal(); gambarUlang();
      pesan('Data berhasil dimuat');
    } catch (e) {
      pesan('Berkas bukan data peta yang sah', true);
    }
  };
  fr.readAsText(file);
}

/* ── Impor CSV ────────────────────────────────────────────────
   Menerima berkas hasil ekspor aplikasi ini maupun keluaran
   `ambil-tempat.py`. Pemisah, kutip, dan BOM ditangani sendiri —
   tidak memakai pustaka luar. */

function tebakPemisah(teks) {
  const baris = (teks.split(/\r?\n/)[0] || '');
  const hitung = s => (baris.match(new RegExp('\\' + s, 'g')) || []).length;
  const tab = (baris.match(/\t/g) || []).length;
  if (tab > hitung(';') && tab > hitung(',')) return '\t';
  return hitung(';') >= hitung(',') ? ';' : ',';
}

/** Pengurai CSV yang menghormati tanda kutip, kutip ganda, dan baris
    baru di dalam sel. */
function uraiCSV(teks) {
  teks = String(teks).replace(/^﻿/, '');
  const pemisah = tebakPemisah(teks);
  const baris = [];
  let sel = '', deret = [], dalamKutip = false;

  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (dalamKutip) {
      if (c === '"') {
        if (teks[i + 1] === '"') { sel += '"'; i++; }
        else dalamKutip = false;
      } else sel += c;
    } else if (c === '"') {
      dalamKutip = true;
    } else if (c === pemisah) {
      deret.push(sel); sel = '';
    } else if (c === '\n') {
      deret.push(sel); baris.push(deret); deret = []; sel = '';
    } else if (c !== '\r') {
      sel += c;
    }
  }
  if (sel !== '' || deret.length) { deret.push(sel); baris.push(deret); }
  return baris.filter(r => r.some(v => String(v).trim() !== ''));
}

/* Nama kolom yang dikenali → medan internal */
const KOLOM_CSV = {
  nama: 'nama', name: 'nama', 'nama tempat': 'nama',
  kategori: 'kategori', category: 'kategori', jenis: 'kategori',
  alamat: 'alamat', address: 'alamat',
  kontak: 'kontak', telepon: 'kontak', phone: 'kontak', 'no hp': 'kontak', hp: 'kontak',
  jam: 'jam', 'jam buka': 'jam', 'opening hours': 'jam',
  website: 'website', situs: 'website', web: 'website',
  keterangan: 'deskripsi', deskripsi: 'deskripsi', description: 'deskripsi', catatan: 'deskripsi',
  lintang: 'lat', latitude: 'lat', lat: 'lat', y: 'lat',
  bujur: 'lon', longitude: 'lon', lon: 'lon', lng: 'lon', long: 'lon', x: 'lon'
};

/** Terima id kategori ("ekonomi") maupun labelnya ("Ekonomi & UMKM"). */
function cocokkanKategori(nilai) {
  const v = String(nilai || '').trim().toLowerCase();
  if (!v) return 'lainnya';
  if (KATEGORI[v]) return v;
  const lewatLabel = Object.keys(KATEGORI).find(k => KATEGORI[k].label.toLowerCase() === v);
  if (lewatLabel) return lewatLabel;
  const sebagian = Object.keys(KATEGORI).find(k =>
    KATEGORI[k].label.toLowerCase().split(/[&/]/)[0].trim() === v);
  return sebagian || 'lainnya';
}

/** Angka bisa memakai titik atau koma desimal. */
function angkaKoordinat(v) {
  const s = String(v || '').trim().replace(/\s/g, '');
  if (!s) return NaN;
  // "104,506733" -> desimal koma; "1.234,5" tidak dipakai untuk koordinat
  const n = parseFloat(s.indexOf(',') >= 0 && s.indexOf('.') < 0 ? s.replace(',', '.') : s);
  return n;
}

function bacaTempatCSV(teks) {
  const baris = uraiCSV(teks);
  if (baris.length < 2) return { galat: 'Berkas tidak memuat baris data.' };

  const kepala = baris[0].map(h => KOLOM_CSV[String(h).trim().toLowerCase().replace(/\s+/g, ' ')] || null);
  if (kepala.indexOf('nama') < 0 || kepala.indexOf('lat') < 0 || kepala.indexOf('lon') < 0) {
    return { galat: 'Kolom wajib tidak ditemukan. Berkas harus memuat Nama, Lintang, dan Bujur.' };
  }

  const sah = [], bermasalah = [];
  baris.slice(1).forEach((r, i) => {
    const o = {};
    kepala.forEach((medan, k) => { if (medan) o[medan] = String(r[k] == null ? '' : r[k]).trim(); });

    const lat = angkaKoordinat(o.lat), lon = angkaKoordinat(o.lon);
    const alasan = !o.nama ? 'nama kosong'
                 : (!isFinite(lat) || !isFinite(lon)) ? 'koordinat tidak terbaca'
                 : (Math.abs(lat) > 90 || Math.abs(lon) > 180) ? 'koordinat di luar jangkauan'
                 : null;
    if (alasan) { bermasalah.push({ baris: i + 2, nama: o.nama || '(tanpa nama)', alasan }); return; }

    sah.push({
      id: idBaru(), nama: o.nama, kategori: cocokkanKategori(o.kategori),
      deskripsi: o.deskripsi || '', alamat: o.alamat || '', kontak: o.kontak || '',
      jam: o.jam || '', website: o.website || '', foto: [],
      lat: +lat.toFixed(6), lon: +lon.toFixed(6)
    });
  });

  return { sah, bermasalah };
}

function imporCSV(file) {
  const fr = new FileReader();
  fr.onerror = () => pesan('Berkas gagal dibaca', true);
  fr.onload = () => {
    const hasil = bacaTempatCSV(String(fr.result));
    if (hasil.galat) return pesan(hasil.galat, true);
    if (!hasil.sah.length) return pesan('Tidak ada baris yang bisa dipakai', true);
    dialogImporCSV(hasil);
  };
  fr.readAsText(file, 'utf-8');
}

function dialogImporCSV(hasil) {
  const { sah, bermasalah } = hasil;

  // Anggap sama bila namanya sama dan jaraknya di bawah 40 m
  const kembar = sah.filter(b => S.data.tempat.some(t =>
    t.nama.trim().toLowerCase() === b.nama.trim().toLowerCase()
    && jarak([t.lat, t.lon], [b.lat, b.lon]) < 40));

  const hitung = {};
  sah.forEach(b => { hitung[b.kategori] = (hitung[b.kategori] || 0) + 1; });
  const rincian = Object.entries(hitung).sort((a, b) => b[1] - a[1]).map(([k, n]) => {
    const d = KATEGORI[k] || KATEGORI.lainnya;
    return `<span><i style="background:var(${d.warna})"></i>${esc(d.label)} ${n}</span>`;
  }).join('');

  const luarJangkauan = sah.filter(b => !batasPeta().contains([b.lat, b.lon])).length;

  bukaModal({
    judul: 'Muat tempat dari CSV',
    isi: `
      <div class="kv" style="font-size:13px">
        <div><span class="k">Siap dimuat</span><span class="v"><b>${sah.length}</b> tempat</span></div>
        ${kembar.length ? `<div><span class="k">Sudah ada</span><span class="v">${kembar.length} bernama sama di lokasi yang sama</span></div>` : ''}
        ${bermasalah.length ? `<div><span class="k">Dilewati</span><span class="v">${bermasalah.length} baris bermasalah</span></div>` : ''}
        ${luarJangkauan ? `<div><span class="k">Di luar peta</span><span class="v">${luarJangkauan} titik</span></div>` : ''}
      </div>
      <div class="legend-row" style="margin-top:11px">${rincian}</div>

      ${bermasalah.length ? `<details class="acc" style="margin-top:12px"><summary>Lihat baris bermasalah</summary>
        <div class="acc-body"><table class="dt"><thead><tr><th>Baris</th><th>Nama</th><th>Sebab</th></tr></thead>
        <tbody>${bermasalah.slice(0, 12).map(b =>
          `<tr><td>${b.baris}</td><td>${esc(b.nama)}</td><td style="text-align:left">${esc(b.alasan)}</td></tr>`).join('')}
        </tbody></table>${bermasalah.length > 12 ? `<p class="chart-note">…dan ${bermasalah.length - 12} lagi</p>` : ''}</div>
      </details>` : ''}

      ${luarJangkauan ? `<div class="note warn" style="margin-top:12px">
        ${ikon('M12 8.4v5M12 16.6h.01M10.3 4.2L2.6 17.5a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z')}
        <span>${luarJangkauan} titik berada di luar jangkauan peta desa. Tetap dimuat, tetapi
        naikkan <b>Jangkauan peta</b> bila ingin melihatnya.</span></div>` : ''}

      <label class="switch" style="margin-top:12px">
        <input type="checkbox" name="lewati" ${kembar.length ? 'checked' : ''} ${kembar.length ? '' : 'disabled'}>
        <span class="track"></span>
        <span class="sw-label">Lewati yang sudah ada<small>Cegah tempat kembar</small></span>
      </label>
      <label class="switch">
        <input type="checkbox" name="ganti">
        <span class="track"></span>
        <span class="sw-label">Ganti seluruh daftar<small>Hapus ${S.data.tempat.length} tempat yang ada sekarang</small></span>
      </label>`,
    aksi: [
      { label: 'Batal', fn: () => {} },
      { label: 'Muat', cls: 'primary', fn: body => {
        const lewati = body.querySelector('[name="lewati"]').checked;
        const ganti = body.querySelector('[name="ganti"]').checked;

        let masuk = sah;
        if (ganti) S.data.tempat = [];
        else if (lewati) {
          const adaKembar = b => S.data.tempat.some(t =>
            t.nama.trim().toLowerCase() === b.nama.trim().toLowerCase()
            && jarak([t.lat, t.lon], [b.lat, b.lon]) < 40);
          masuk = sah.filter(b => !adaKembar(b));
        }

        S.data.tempat = S.data.tempat.concat(masuk);
        S.kategoriAktif = new Set(Object.keys(KATEGORI));
        simpan(); gambarTempat(); buatPanelLapis(); gambarUlang();
        pesan(`${masuk.length} tempat dimuat dari CSV`);
      }}
    ]
  });
}

/* ── Logo desa ────────────────────────────────────────────── */
function muatLogoDesa(file) {
  kecilkanGambar(file, 256, 'image/png')
    .then(d => {
      S.data.meta.logoDesa = d;
      simpan(); gambarUlang();
      pesan('Logo desa dipasang');
    })
    .catch(e => pesan(e.message, true));
}

/* ── Berbagi & kode QR ────────────────────────────────────── */

/** Alamat dasar peta: alamat terbit bila sudah diisi, kalau tidak alamat berkas ini. */
function alamatDasar() {
  return safeUrl(S.data.profil.urlPublik) || location.href.replace(/[#?].*$/, '');
}

function tautanTempat(t) {
  return alamatDasar() + '#t=' + (slug(t.nama) || t.id);
}

/** Buka tempat yang ditunjuk alamat, mis. …/peta.html#t=kantor-desa-kote */
function bukaDariHash() {
  const h = decodeURIComponent(String(location.hash || '').replace(/^#/, ''));
  const m = h.match(/^t=(.+)$/i);
  if (!m) return;
  const kunci = m[1].toLowerCase();
  const t = S.data.tempat.find(x => x.id === m[1])
         || S.data.tempat.find(x => slug(x.nama) === kunci);
  if (t) setTimeout(() => sorotTempat(t.id), 400);
}

function modalBagikan(t) {
  const tautan = t ? tautanTempat(t) : alamatDasar();
  const judul = t ? t.nama : `Peta Digital ${S.data.meta.nama}`;
  const svg = qrSVG(tautan, { ukuran: 190 });
  const lokal = /^file:/i.test(tautan);

  bukaModal({
    judul: 'Bagikan',
    isi: `
      <p style="font-size:13px;font-weight:550;margin-bottom:9px">${esc(judul)}</p>
      ${svg ? `<div style="display:grid;place-items:center;padding:10px;background:#fff;border-radius:var(--radius);border:1px solid var(--border)">${svg}</div>`
            : `<p class="chart-note">Alamatnya terlalu panjang untuk dijadikan kode QR.</p>`}
      <label class="f" style="margin-top:11px"><span>Tautan</span>
        <input class="inp" id="tautan-bagi" readonly value="${esc(tautan)}"
               style="font-size:12px" onclick="this.select()"></label>
      ${lokal ? `<div class="note warn">
          ${ikon('M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 11v5.2M12 7.9h.01')}
          <span>Ini alamat berkas di komputer Anda, jadi belum bisa dibuka orang lain.
          Isi <b>alamat peta di website desa</b> pada tab Kelola supaya tautan dan kode QR-nya bisa dipakai umum.</span>
        </div>` : ''}`,
    aksi: [
      { label: 'Unduh QR', fn: () => {
        const png = qrPNG(tautan, 900);
        if (!png) return pesan('Kode QR gagal dibuat', true);
        const a = document.createElement('a');
        a.href = png; a.download = `qr-${slug(judul) || 'peta'}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        pesan('Kode QR diunduh');
        return false;                       // biarkan jendela tetap terbuka
      }},
      { label: 'Salin tautan', cls: 'primary', fn: body => {
        const inp = body.querySelector('#tautan-bagi');
        inp.select();
        if (navigator.share) {
          navigator.share({ title: judul, url: tautan }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(tautan).then(() => pesan('Tautan disalin'), () => pesan('Gagal menyalin', true));
        } else {
          document.execCommand('copy'); pesan('Tautan disalin');
        }
      }}
    ]
  });
}

/* ── Editor baris statistik ───────────────────────────────── */
function editorBaris(kunci) {
  const g = S.data.statistik[kunci];
  const ganda = kunci === 'usia';

  const baris = g.baris.map((b, i) => ganda ? `
    <div style="display:grid;grid-template-columns:1fr 62px 62px 26px;gap:6px;align-items:center;margin-bottom:6px">
      <input class="inp" style="min-height:30px;padding:4px 7px;font-size:12.5px" value="${esc(b.l)}"
             data-set-teks="statistik.${kunci}.baris.${i}.l" aria-label="Kelompok umur">
      <input class="inp f-num" style="min-height:30px;padding:4px 6px;font-size:12.5px" inputmode="numeric"
             value="${b.lk == null ? '' : b.lk}" placeholder="L" data-set="statistik.${kunci}.baris.${i}.lk" aria-label="Laki-laki">
      <input class="inp f-num" style="min-height:30px;padding:4px 6px;font-size:12.5px" inputmode="numeric"
             value="${b.pr == null ? '' : b.pr}" placeholder="P" data-set="statistik.${kunci}.baris.${i}.pr" aria-label="Perempuan">
      <button class="icon-btn tiny" data-hapus-baris="${kunci}.${i}" aria-label="Hapus baris">${ikon('M6 6l12 12M18 6L6 18')}</button>
    </div>` : `
    <div style="display:grid;grid-template-columns:1fr 78px 26px;gap:6px;align-items:center;margin-bottom:6px">
      <input class="inp" style="min-height:30px;padding:4px 7px;font-size:12.5px" value="${esc(b.l)}"
             data-set-teks="statistik.${kunci}.baris.${i}.l" aria-label="Nama kategori">
      <input class="inp f-num" style="min-height:30px;padding:4px 6px;font-size:12.5px" inputmode="numeric"
             value="${b.v == null ? '' : b.v}" placeholder="jiwa" data-set="statistik.${kunci}.baris.${i}.v" aria-label="Jumlah">
      <button class="icon-btn tiny" data-hapus-baris="${kunci}.${i}" aria-label="Hapus baris">${ikon('M6 6l12 12M18 6L6 18')}</button>
    </div>`).join('');

  const kepala = ganda
    ? `<div style="display:grid;grid-template-columns:1fr 62px 62px 26px;gap:6px;margin-bottom:5px;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">
         <span>Kelompok</span><span>Laki</span><span>Prmpn</span><span></span></div>`
    : `<div style="display:grid;grid-template-columns:1fr 78px 26px;gap:6px;margin-bottom:5px;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">
         <span>Kategori</span><span>Jumlah</span><span></span></div>`;

  return `${kepala}${baris}
    <button class="btn sm" data-tambah-baris="${kunci}" style="margin-top:2px">${ikon('M12 5v14M5 12h14')}Tambah baris</button>`;
}

/* ── Panel Kelola ─────────────────────────────────────────── */
function panelKelola() {
  const m = S.data.meta, p = S.data.profil, r = S.data.statistik.ringkas;

  if (!S.admin) {
    return `<div class="p-head"><h2>Kelola data</h2><p>Ubah isi peta ini</p></div>
      <div class="empty-state">
        ${ikon('M4.5 10.5h15v10h-15zM8 10.5V7.5a4 4 0 0 1 8 0v3')}
        <b>Mode kelola belum aktif</b>
        <p>Nyalakan lewat tombol gembok di kanan atas untuk mengubah data.</p>
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn primary wide" data-alih-admin>Aktifkan mode kelola</button>
      </div>`;
  }

  const luasPeta = luasDariPeta();

  return `
    <div class="p-head"><h2>Kelola data</h2><p>Perubahan tersimpan di browser ini</p></div>

    <div class="note">
      ${ikon('M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 11v5.2M12 7.9h.01')}
      <span>Suntingan di sini hanya tersimpan di perangkat Anda. Agar tampil di website desa,
      unduh <b>HTML mandiri</b> di bagian bawah lalu unggah berkasnya.</span>
    </div>

    <details class="acc" open>
      <summary>Identitas desa</summary>
      <div class="acc-body">
        <label class="f"><span>Nama desa</span><input class="inp" value="${esc(m.nama)}" data-set-teks="meta.nama"></label>
        <div class="f-row">
          <label class="f"><span>Kecamatan</span><input class="inp" value="${esc(m.kecamatan)}" data-set-teks="meta.kecamatan"></label>
          <label class="f"><span>Kabupaten</span><input class="inp" value="${esc(m.kabupaten)}" data-set-teks="meta.kabupaten"></label>
        </div>
        <div class="f-row">
          <label class="f"><span>Provinsi</span><input class="inp" value="${esc(m.provinsi)}" data-set-teks="meta.provinsi"></label>
          <label class="f"><span>Kode pos</span><input class="inp" value="${esc(m.kodepos)}" data-set-teks="meta.kodepos"></label>
        </div>
        <label class="f"><span>Kode wilayah <em>Kemendagri</em></span>
          <input class="inp f-num" value="${esc(m.kode)}" data-set-teks="meta.kode"></label>

        <label class="f"><span>Jangkauan peta <em>km dari pusat desa</em></span>
          <input class="inp f-num" inputmode="decimal" value="${m.jangkauan == null ? APP.jangkauan : m.jangkauan}"
                 data-set-batas="meta.jangkauan" min="1" max="60"></label>
        <p class="chart-note" style="margin:-6px 0 12px">
          Peta dikunci di dalam wilayah ini supaya pengunjung tidak menjelajah keluar Desa Kote.
          Perbesar angkanya bila perlu menampilkan area yang lebih luas.</p>

        <span style="display:block;font-size:11.5px;font-weight:550;color:var(--ink-2);margin-bottom:4px">
          Logo desa <em style="font-style:normal;color:var(--muted);font-weight:400">opsional — tampil di samping lambang KKN</em></span>
        ${m.logoDesa ? `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <img src="${esc(safeUrl(m.logoDesa))}" alt="" style="width:46px;height:46px;object-fit:contain;background:var(--surface-2);border-radius:8px;padding:3px">
            <button class="btn sm danger" data-hapus-logo>Hapus logo</button>
          </div>` : ''}
        <input type="file" class="inp" accept="image/*" data-logo-desa style="margin-bottom:10px">

        <label class="f"><span>Nama tim penyusun</span>
          <input class="inp" value="${esc(p.tim || '')}" data-set-teks="profil.tim" placeholder="mis. KKN Kelompok 67"></label>
        <div class="f-row">
          <label class="f"><span>Institusi</span>
            <input class="inp" value="${esc(p.institusi || '')}" data-set-teks="profil.institusi" placeholder="mis. Universitas …"></label>
          <label class="f"><span>Tahun</span>
            <input class="inp" value="${esc(p.tahun || '')}" data-set-teks="profil.tahun" placeholder="2026"></label>
        </div>
      </div>
    </details>

    <details class="acc">
      <summary>Profil & kontak</summary>
      <div class="acc-body">
        <label class="f"><span>Kepala desa</span><input class="inp" value="${esc(p.kepala)}" data-set-teks="profil.kepala"></label>
        <label class="f"><span>Alamat kantor</span><input class="inp" value="${esc(p.alamat)}" data-set-teks="profil.alamat"></label>
        <div class="f-row">
          <label class="f"><span>Telepon</span><input class="inp" value="${esc(p.telepon)}" data-set-teks="profil.telepon"></label>
          <label class="f"><span>Surel</span><input class="inp" value="${esc(p.email)}" data-set-teks="profil.email"></label>
        </div>
        <label class="f"><span>Website desa</span><input class="inp" value="${esc(p.website)}" data-set-teks="profil.website"></label>
        <label class="f"><span>Visi</span><textarea class="inp" data-set-teks="profil.visi">${esc(p.visi)}</textarea></label>
        <label class="f"><span>Misi</span><textarea class="inp" data-set-teks="profil.misi">${esc(p.misi)}</textarea></label>
        <label class="f"><span>Sejarah singkat</span><textarea class="inp" data-set-teks="profil.sejarah">${esc(p.sejarah)}</textarea></label>
        <label class="f"><span>Potensi desa</span><textarea class="inp" data-set-teks="profil.potensi">${esc(p.potensi)}</textarea></label>
      </div>
    </details>

    <details class="acc">
      <summary>Statistik pokok</summary>
      <div class="acc-body">
        <div class="f-row">
          <label class="f"><span>Jumlah penduduk <em>jiwa</em></span>
            <input class="inp f-num" inputmode="numeric" value="${r.penduduk == null ? '' : r.penduduk}" data-set="statistik.ringkas.penduduk"></label>
          <label class="f"><span>Kepala keluarga</span>
            <input class="inp f-num" inputmode="numeric" value="${r.kk == null ? '' : r.kk}" data-set="statistik.ringkas.kk"></label>
        </div>
        <label class="f"><span>Luas wilayah <em>km²${luasPeta != null ? ` — dari batas peta: ${angka2(luasPeta)}` : ''}</em></span>
          <input class="inp f-num" inputmode="decimal" value="${r.luas == null ? '' : r.luas}" data-set="statistik.ringkas.luas"
                 placeholder="${luasPeta != null ? angka2(luasPeta) + ' (terhitung)' : 'mis. 24,5'}"></label>
        <div class="f-row">
          <label class="f"><span>Jumlah dusun</span>
            <input class="inp f-num" inputmode="numeric" value="${r.dusun == null ? '' : r.dusun}" data-set="statistik.ringkas.dusun"></label>
          <label class="f"><span>Jumlah RT</span>
            <input class="inp f-num" inputmode="numeric" value="${r.rt == null ? '' : r.rt}" data-set="statistik.ringkas.rt"></label>
        </div>
        <label class="f"><span>Jumlah RW</span>
          <input class="inp f-num" inputmode="numeric" value="${r.rw == null ? '' : r.rw}" data-set="statistik.ringkas.rw"></label>
        <label class="f"><span>Sumber & tahun data <em>ditampilkan di tab Statistik</em></span>
          <input class="inp" value="${esc(p.sumberStat || '')}" data-set-teks="profil.sumberStat"
                 placeholder="mis. Profil Desa Kote 2025"></label>
      </div>
    </details>

    <details class="acc">
      <summary>Jenis kelamin</summary><div class="acc-body">${editorBaris('gender')}</div>
    </details>
    <details class="acc">
      <summary>Kelompok umur</summary><div class="acc-body">${editorBaris('usia')}</div>
    </details>
    <details class="acc">
      <summary>Pendidikan</summary><div class="acc-body">${editorBaris('pendidikan')}</div>
    </details>
    <details class="acc">
      <summary>Mata pencaharian</summary><div class="acc-body">${editorBaris('pekerjaan')}</div>
    </details>
    <details class="acc">
      <summary>Agama</summary><div class="acc-body">${editorBaris('agama')}</div>
    </details>

    <details class="acc">
      <summary>Batas & wilayah</summary>
      <div class="acc-body">
        <div class="btn-row" style="margin-bottom:10px">
          <button class="btn" data-gambar-batas>${ikon('M4.5 19.5h4L19 9a2.5 2.5 0 0 0-3.5-3.5L5 16z')}Gambar batas desa</button>
          <button class="btn" data-gambar-dusun>${ikon('M12 5v14M5 12h14')}Tambah dusun</button>
        </div>
        <label class="f"><span>Muat batas dari berkas <em>GeoJSON atau KML</em></span>
          <input type="file" class="inp" accept=".geojson,.json,.kml,.xml" data-impor="batas"></label>
        <label class="f"><span>Muat dusun dari berkas</span>
          <input type="file" class="inp" accept=".geojson,.json,.kml,.xml" data-impor="dusun"></label>
        <label class="f"><span>Muat titik tempat dari berkas</span>
          <input type="file" class="inp" accept=".geojson,.json,.kml,.xml" data-impor="tempat"></label>
        <p class="chart-note">KML dari Google Earth bisa langsung dipakai. Poligon pertama menjadi batas desa.</p>
      </div>
    </details>

    <details class="acc">
      <summary>Tempat & fasilitas</summary>
      <div class="acc-body">
        <p class="chart-note" style="margin-bottom:10px">${S.data.tempat.length} tempat terdata.</p>
        <button class="btn primary wide" data-tambah-tempat style="margin-bottom:12px">${ikon('M12 5v14M5 12h14')}Tambah tempat di peta</button>

        <label class="f"><span>Muat dari CSV <em>banyak tempat sekaligus</em></span>
          <input type="file" class="inp" accept=".csv,text/csv,text/plain" data-impor-csv></label>
        <p class="chart-note">
          Kolom yang dikenali: <code>Nama · Kategori · Alamat · Kontak · Jam · Website ·
          Keterangan · Lintang · Bujur</code>. Hanya Nama, Lintang, dan Bujur yang wajib.
          Pemisah titik koma maupun koma sama-sama diterima.</p>
        <p class="chart-note" style="margin-top:6px">
          Berkas hasil <b>Ekspor CSV</b> bisa langsung dimuat kembali. Untuk mengambil
          data dari OpenStreetMap, jalankan <code>python ambil-tempat.py</code>.</p>
      </div>
    </details>

    <details class="acc" open>
      <summary>Simpan & terbitkan</summary>
      <div class="acc-body">
        <button class="btn primary wide" data-ekspor-html style="margin-bottom:8px">
          ${ikon('M12 3.6v11.5M7.6 10.8l4.4 4.3 4.4-4.3M4.5 19.5h15')}Unduh HTML mandiri</button>
        <p class="chart-note" style="margin-bottom:12px">
          Satu berkas berisi peta + data terbaru. Unggah ke website desa, lalu buka lewat tautannya.</p>
        <div class="btn-row">
          <button class="btn" data-ekspor-json>Cadangkan JSON</button>
          <button class="btn" data-ekspor-geojson>Ekspor GeoJSON</button>
        </div>
        <label class="f" style="margin-top:12px"><span>Pulihkan dari cadangan JSON</span>
          <input type="file" class="inp" accept=".json" data-impor-json></label>
        <p class="chart-note" style="margin-bottom:8px">Ukuran data saat ini
          <b>${esc(teksUkuran(ukuranData()))}</b>${S.data.tempat.filter(t => t.foto).length
            ? ` · ${S.data.tempat.filter(t => t.foto).length} foto tersimpan` : ''}.
          Penyimpanan browser umumnya terbatas sekitar 5 MB.</p>
        <button class="btn danger wide" data-reset>Kosongkan semua data</button>
      </div>
    </details>

    <details class="acc">
      <summary>Alamat terbit & kode QR</summary>
      <div class="acc-body">
        <label class="f"><span>Alamat peta di website desa
          <em>dipakai untuk tautan berbagi dan kode QR</em></span>
          <input class="inp" value="${esc(p.urlPublik || '')}" data-set-teks="profil.urlPublik"
                 placeholder="https://desakote.lingga.go.id/peta-desa-kote.html"></label>
        ${p.urlPublik ? `
          <div style="display:flex;gap:13px;align-items:center;margin-top:4px">
            <div style="background:#fff;padding:7px;border-radius:var(--radius);border:1px solid var(--border);flex:none">
              ${qrSVG(safeUrl(p.urlPublik) || p.urlPublik, { ukuran: 116 }) || ''}
            </div>
            <div style="min-width:0">
              <p class="chart-note" style="margin-bottom:8px">Cetak di banner, papan pengumuman, atau lampiran laporan.
                Warga tinggal memindai dengan kamera HP.</p>
              <button class="btn sm" data-bagi-peta>Perbesar & unduh</button>
            </div>
          </div>`
        : `<p class="chart-note">Isi alamatnya dulu, kode QR akan muncul di sini.</p>`}
      </div>
    </details>

    <details class="acc">
      <summary>Pasang di website desa</summary>
      <div class="acc-body">
        <p class="chart-note" style="margin-bottom:9px">Unggah <code>peta-desa-kote.html</code> ke hosting desa, lalu sisipkan:</p>
        <textarea class="inp" readonly rows="4" id="kode-embed" style="font-family:ui-monospace,monospace;font-size:11.5px">&lt;iframe src="/peta-desa-kote.html" title="Peta Digital Desa Kote" style="width:100%;height:640px;border:0;border-radius:12px" loading="lazy" allow="geolocation"&gt;&lt;/iframe&gt;</textarea>
        <button class="btn wide" data-salin-embed style="margin-top:7px">Salin kode sematan</button>
        <p class="chart-note" style="margin-top:10px">
          Cocok untuk WordPress, OpenSID, maupun HTML biasa. Bisa juga diunggah ke GitHub Pages tanpa biaya.</p>
      </div>
    </details>`;
}
