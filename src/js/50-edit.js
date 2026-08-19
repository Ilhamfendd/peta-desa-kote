/* ═══════════════════════════════════════════════════════════
   50 — Penyuntingan: gambar batas, tempat, ukur, formulir
   ═══════════════════════════════════════════════════════════ */

/* ── Modal ────────────────────────────────────────────────── */
function bukaModal(opsi) {
  tutupModal();
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(opsi.judul)}">
      <div class="modal-head">
        <h3>${esc(opsi.judul)}</h3>
        <button class="icon-btn" data-tutup aria-label="Tutup">${ikon('M6 6l12 12M18 6L6 18')}</button>
      </div>
      <div class="modal-body">${opsi.isi}</div>
      <div class="modal-foot">${(opsi.aksi || []).map((a, i) =>
        `<button class="btn ${a.cls || ''}" data-aksi="${i}">${esc(a.label)}</button>`).join('')}</div>
    </div>`;
  document.body.appendChild(bg);

  const tutup = () => tutupModal();
  bg.addEventListener('click', e => {
    if (e.target === bg || e.target.closest('[data-tutup]')) return tutup();
    const b = e.target.closest('[data-aksi]');
    if (!b) return;
    const a = opsi.aksi[+b.dataset.aksi];
    if (a.fn && a.fn(bg.querySelector('.modal-body')) === false) return;
    tutup();
  });
  document.addEventListener('keydown', escModal);

  const fokus = bg.querySelector('input,select,textarea,button');
  if (fokus) setTimeout(() => fokus.focus(), 40);
  return bg;
}
function escModal(e) { if (e.key === 'Escape') tutupModal(); }
function tutupModal() {
  const m = $('.modal-bg');
  if (m) m.remove();
  document.removeEventListener('keydown', escModal);
}

/* ── Mesin menggambar ─────────────────────────────────────── */
const Gambar = {
  aktif: null, pts: [], garis: null, isi: null, handles: [], cb: null, poligon: true, label: ''
};

function mulaiGambar(o) {
  batalGambar();
  Gambar.aktif = o.tipe;
  Gambar.poligon = o.poligon !== false;
  Gambar.cb = o.selesai;
  Gambar.label = o.label || 'Klik di peta untuk menambah titik';
  Gambar.pts = (o.awal || []).slice();
  S.mode = o.tipe;

  S.peta.doubleClickZoom.disable();
  S.peta.getContainer().style.cursor = 'crosshair';
  S.peta.on('click', klikGambar);
  S.peta.on('dblclick', selesaiGambar);
  document.addEventListener('keydown', tombolGambar);

  if (o.tipe === 'ukur') $('#btn-measure').setAttribute('aria-pressed', 'true');
  perbaruiGambar();
  aturLembar(false);
}

function klikGambar(e) {
  Gambar.pts.push([e.latlng.lat, e.latlng.lng]);
  perbaruiGambar();
}

function tombolGambar(e) {
  if (!Gambar.aktif) return;
  if (e.key === 'Escape') { e.preventDefault(); batalGambar(); }
  else if (e.key === 'Enter') { e.preventDefault(); selesaiGambar(); }
  else if ((e.key === 'Backspace' || e.key === 'z' && (e.ctrlKey || e.metaKey))
           && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
    e.preventDefault(); Gambar.pts.pop(); perbaruiGambar();
  }
}

function perbaruiGambar() {
  const g = S.lapis.sunting;
  g.clearLayers();
  Gambar.handles = [];

  const pts = Gambar.pts;
  const warna = cv(Gambar.aktif === 'ukur' ? '--series-2' : '--accent');

  if (pts.length > 1) {
    if (Gambar.poligon && pts.length > 2) {
      Gambar.isi = L.polygon(pts, { color: warna, weight: 2, fillColor: warna, fillOpacity: .12,
                                    interactive: false, pane: 'p-sunting' }).addTo(g);
    } else {
      Gambar.garis = L.polyline(pts, { color: warna, weight: 2, interactive: false, pane: 'p-sunting' }).addTo(g);
    }
    if (Gambar.aktif === 'ukur') labelRuas(pts, g);
  }

  pts.forEach((p, i) => {
    const mk = L.marker(p, {
      draggable: true, keyboard: false, pane: 'p-sunting',
      icon: L.divIcon({ className: '', iconSize: [12, 12], iconAnchor: [6, 6], html: '<div class="vertex-handle"></div>' })
    }).addTo(g);
    mk.on('drag', ev => { Gambar.pts[i] = [ev.latlng.lat, ev.latlng.lng]; perbaruiGaris(); });
    mk.on('dragend', perbaruiGambar);
    mk.on('click', ev => {
      L.DomEvent.stop(ev);
      if (Gambar.pts.length > 1) { Gambar.pts.splice(i, 1); perbaruiGambar(); }
    });
    Gambar.handles.push(mk);
  });

  hudGambar();
}

/** Panjang tiap ruas ditulis di titik tengahnya — kebiasaan alat ukur GIS. */
function labelRuas(pts, g) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const d = jarak(a, b);
    if (d < 12) continue;
    L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
      interactive: false, keyboard: false, pane: 'p-sunting',
      icon: L.divIcon({ className: '', iconSize: null, html: `<div class="ruas-label">${teksJarak(d)}</div>` })
    }).addTo(g);
  }
}

function perbaruiGaris() {
  if (Gambar.isi) Gambar.isi.setLatLngs(Gambar.pts);
  if (Gambar.garis) Gambar.garis.setLatLngs(Gambar.pts);
  hudGambar();
}

function hudGambar() {
  const hud = $('#draw-hud');
  if (!Gambar.aktif) { hud.hidden = true; return; }
  const pts = Gambar.pts;
  const cukup = Gambar.poligon ? pts.length >= 3 : pts.length >= 2;

  let ukuran = '';
  if (Gambar.poligon && pts.length >= 3) {
    ukuran = `<span class="hud-val">${teksLuas(luasPoligon(pts))}</span>
              <span class="hud-txt">keliling ${teksJarak(panjangJalur(pts.concat([pts[0]])))}</span>`;
  } else if (pts.length >= 2) {
    ukuran = `<span class="hud-val">${teksJarak(panjangJalur(pts))}</span>`;
  } else {
    ukuran = `<span class="hud-txt">${esc(Gambar.label)}</span>`;
  }

  hud.hidden = false;
  hud.innerHTML = `${ukuran}
    <span class="hud-txt" style="color:var(--muted)">${pts.length} titik</span>
    <span style="display:flex;gap:5px">
      ${pts.length ? `<button class="btn sm" data-gambar-undo>Mundur</button>` : ''}
      <button class="btn sm" data-gambar-batal>Batal</button>
      ${Gambar.aktif !== 'ukur' ? `<button class="btn sm primary" data-gambar-selesai ${cukup ? '' : 'disabled'}>Selesai</button>` : ''}
    </span>`;
}

function selesaiGambar() {
  if (!Gambar.aktif || Gambar.aktif === 'ukur') return;
  const cukup = Gambar.poligon ? Gambar.pts.length >= 3 : Gambar.pts.length >= 2;
  if (!cukup) return;
  const pts = Gambar.pts.slice(), cb = Gambar.cb;
  batalGambar();
  if (cb) cb(pts);
}

function batalGambar() {
  if (!Gambar.aktif) { $('#draw-hud').hidden = true; return; }
  S.peta.off('click', klikGambar);
  S.peta.off('dblclick', selesaiGambar);
  document.removeEventListener('keydown', tombolGambar);
  S.peta.doubleClickZoom.enable();
  S.peta.getContainer().style.cursor = '';
  S.lapis.sunting.clearLayers();
  $('#btn-measure').setAttribute('aria-pressed', 'false');
  $('#draw-hud').hidden = true;
  Gambar.aktif = null; Gambar.pts = []; Gambar.cb = null; Gambar.isi = null; Gambar.garis = null;
  S.mode = null;
}

/* ── Menempatkan tempat ───────────────────────────────────── */
function modeTambahTempat(draf) {
  batalGambar();
  S.mode = 'tempat';
  S.peta.getContainer().style.cursor = 'crosshair';
  $('#draw-hud').hidden = false;
  $('#draw-hud').innerHTML = `<span class="hud-txt">${draf && draf.nama
      ? `Klik letak untuk “${esc(draf.nama)}”` : 'Klik di peta untuk menaruh tempat baru'}</span>
    <button class="btn sm" data-gambar-batal>Batal</button>`;
  aturLembar(false);

  const sekali = e => {
    S.peta.off('click', sekali);
    S.peta.getContainer().style.cursor = '';
    $('#draw-hud').hidden = true;
    S.mode = null;
    formTempat(Object.assign({}, draf || {}, { lat: e.latlng.lat, lon: e.latlng.lng }));
  };
  S.peta.on('click', sekali);
  Gambar.batalTempat = () => { S.peta.off('click', sekali); S.peta.getContainer().style.cursor = ''; S.mode = null; };
}

/* ── Jam buka: disimpan sebagai kalimat, disunting sebagai pilihan ──
   Mengetik "Senin–Jumat 08.00–15.00" itu merepotkan dan mudah salah tulis,
   jadi harinya dipilih dan jamnya memakai pemilih waktu bawaan perangkat. */
const POLA_HARI = ['Senin–Jumat', 'Senin–Sabtu', 'Setiap hari'];

function uraiJam(s) {
  s = String(s || '').trim();
  const hari = POLA_HARI.find(p => s.includes(p)) || POLA_HARI[0];
  if (!s) return { hari, buka: '', tutup: '', penuh: false };
  if (/24\s*jam/i.test(s)) return { hari, buka: '', tutup: '', penuh: true };

  const m = s.match(/(\d{1,2})[.:](\d{2})\s*[–—-]\s*(\d{1,2})[.:](\d{2})/);
  if (!m) return { hari, buka: '', tutup: '', penuh: false };
  const p2 = n => String(n).padStart(2, '0');
  return { hari, buka: `${p2(m[1])}:${m[2]}`, tutup: `${p2(m[3])}:${m[4]}`, penuh: false };
}

function susunJam(j) {
  if (j.penuh) return `${j.hari} 24 jam`;
  if (!j.buka || !j.tutup) return '';
  return `${j.hari} ${j.buka.replace(':', '.')}–${j.tutup.replace(':', '.')}`;
}

function formTempat(awal) {
  const t = Object.assign({ id: null, nama: '', kategori: 'lainnya', deskripsi: '', alamat: '', kontak: '', jam: '', website: '', foto: '' }, awal || {});
  const baru = !t.id;

  const opsiKat = Object.entries(KATEGORI)
    .map(([k, d]) => `<option value="${k}" ${k === t.kategori ? 'selected' : ''}>${esc(d.label)}</option>`).join('');

  const j = uraiJam(t.jam);

  const isi = `
    <label class="f"><span>Nama tempat <b class="wajib" title="Wajib diisi">*</b></span>
      <input class="inp" name="nama" value="${esc(t.nama)}" placeholder="mis. Kantor Desa Kote"
             autocapitalize="words" autocomplete="off" enterkeyhint="next" required></label>

    <label class="f"><span>Kategori</span>
      <select class="inp" name="kategori">${opsiKat}</select></label>

    <label class="f"><span>Keterangan <em>opsional</em></span>
      <textarea class="inp" name="deskripsi" rows="2"
                placeholder="Penjelasan singkat yang membantu warga">${esc(t.deskripsi)}</textarea></label>

    <label class="f"><span>Alamat</span>
      <input class="inp" name="alamat" value="${esc(t.alamat)}" autocapitalize="words"
             placeholder="mis. Jl. Raya Kote RT 02"></label>

    <div class="f-row">
      <label class="f"><span>Telepon / WhatsApp</span>
        <input class="inp" type="tel" inputmode="tel" name="kontak" value="${esc(t.kontak)}"
               placeholder="0812…" autocomplete="off"></label>
      <label class="f"><span>Situs / medsos</span>
        <input class="inp" type="url" inputmode="url" name="website" value="${esc(t.website)}"
               placeholder="https://…" autocomplete="off" spellcheck="false"></label>
    </div>

    <div class="f">
      <span class="f-judul">Jam buka</span>
      <div class="jam-baris">
        <select class="inp" name="hari">
          ${POLA_HARI.map(p => `<option ${p === j.hari ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
        <label class="switch" style="padding:0">
          <input type="checkbox" name="jam24" ${j.penuh ? 'checked' : ''}>
          <span class="track"></span><span class="sw-label">24 jam</span>
        </label>
      </div>
      <div class="f-row" data-jam-waktu ${j.penuh ? 'hidden' : ''} style="margin-top:8px">
        <input class="inp" type="time" name="buka" value="${esc(j.buka)}" aria-label="Mulai buka">
        <input class="inp" type="time" name="tutup" value="${esc(j.tutup)}" aria-label="Tutup">
      </div>
      <p class="chart-note" style="margin-top:6px">Kosongkan bila jamnya tidak tentu.</p>
    </div>

    <div class="f">
      <span class="f-judul">Foto <em>opsional — dari kamera atau galeri</em></span>
      <div data-foto-kotak></div>
    </div>

    <div class="f">
      <span class="f-judul">Letak</span>
      <div class="f-row">
        <input class="inp f-num" inputmode="decimal" name="lat" value="${(+t.lat).toFixed(6)}"
               aria-label="Lintang" title="Lintang">
        <input class="inp f-num" inputmode="decimal" name="lon" value="${(+t.lon).toFixed(6)}"
               aria-label="Bujur" title="Bujur">
      </div>
      <div class="btn-row" style="margin-top:7px">
        <button type="button" class="btn sm" data-gps>
          ${ikon('M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM12 2.2v3M12 19v3M21.8 12h-3M5.2 12h-3')}
          Pakai lokasi saya</button>
        <button type="button" class="btn sm" data-pilih-peta>
          ${ikon('M12 20.6s6.8-6.1 6.8-10.6a6.8 6.8 0 1 0-13.6 0c0 4.5 6.8 10.6 6.8 10.6z')}
          Tunjuk di peta</button>
      </div>
    </div>`;

  let fotoData = daftarFoto(t).slice();   // dipegang di luar DOM agar tidak hilang saat digambar ulang

  const aksi = [];
  if (!baru) aksi.push({ label: 'Hapus', cls: 'danger', fn: () => {
    S.data.tempat = S.data.tempat.filter(x => x.id !== t.id);
    simpan(); gambarTempat(); buatPanelLapis(); gambarUlang();
    pesan('Tempat dihapus');
  }});
  aksi.push({ label: 'Batal', fn: () => {} });
  /** Baca seluruh isian jadi satu catatan; dipakai saat menyimpan maupun
      saat berpindah ke mode "tunjuk di peta" agar isian tidak hilang. */
  const kumpul = body => {
    const v = n => { const el = body.querySelector(`[name="${n}"]`); return el ? (el.value || '').trim() : ''; };
    const jam24 = body.querySelector('[name="jam24"]');
    return {
      id: t.id, nama: v('nama'), kategori: v('kategori'), deskripsi: v('deskripsi'),
      alamat: v('alamat'), kontak: v('kontak'), website: v('website'),
      jam: susunJam({ hari: v('hari'), penuh: jam24 && jam24.checked, buka: v('buka'), tutup: v('tutup') }),
      foto: fotoData,
      // angkaKoordinat, BUKAN parseFloat: papan ketik ponsel berbahasa Indonesia
      // memberi koma sebagai tombol desimal, dan parseFloat('-0,3638') = 0 —
      // angka sah, lolos isFinite, lalu tersimpan diam-diam di titik yang salah.
      lat: angkaKoordinat(v('lat')), lon: angkaKoordinat(v('lon'))
    };
  };

  aksi.push({ label: baru ? 'Tambahkan' : 'Simpan', cls: 'primary', fn: body => {
    const rec = kumpul(body);
    if (!rec.nama) { body.querySelector('[name="nama"]').focus(); pesan('Nama tempat wajib diisi', true); return false; }
    if (!isFinite(rec.lat) || !isFinite(rec.lon)) { pesan('Koordinat tidak sah', true); return false; }

    // Titik di luar jangkauan peta hampir pasti salah — GPS gagal mengunci, atau
    // koordinatnya salah ketik. Lebih baik ditahan sekarang daripada baru
    // ketahuan setelah puluhan tempat terlanjur masuk.
    if (!batasPeta().contains([rec.lat, rec.lon])) {
      const p = S.data.meta.pusat || APP.pusat;
      pesan(`Titik ini ${teksJarak(jarak(p, [rec.lat, rec.lon]))} dari pusat desa — `
            + 'periksa lagi koordinatnya, GPS mungkin belum mengunci', true);
      return false;
    }
    rec.id = t.id || idBaru();
    const i = S.data.tempat.findIndex(x => x.id === rec.id);
    if (i >= 0) S.data.tempat[i] = rec; else S.data.tempat.push(rec);

    S.kategoriAktif.add(rec.kategori);
    simpan(); gambarTempat(); buatPanelLapis(); gambarUlang();
    pesan(baru ? 'Tempat ditambahkan' : 'Tempat diperbarui');
    setTimeout(() => sorotTempat(rec.id), 120);
  }});

  const bg = bukaModal({ judul: baru ? 'Tempat baru' : 'Ubah tempat', isi, aksi });

  /* ── Bagian foto ── */
  const kotak = bg.querySelector('[data-foto-kotak]');

  const gambarKotak = () => {
    const daftar = fotoData.map((f, i) => `
      <div class="fo-item">
        <img src="${esc(safeUrl(f))}" alt="Foto ${i + 1}">
        <button type="button" class="fo-hapus" data-foto-hapus="${i}" aria-label="Hapus foto ${i + 1}">
          ${ikon('M6 6l12 12M18 6L6 18')}</button>
        ${i === 0 ? '<span class="fo-utama">Utama</span>' : ''}
      </div>`).join('');

    kotak.innerHTML = `
      ${fotoData.length ? `<div class="fo-grid">${daftar}</div>` : ''}
      <button type="button" class="btn ${fotoData.length ? 'sm' : 'wide'}" data-foto-tambah>
        ${ikon('M4.5 18.5h15a1.5 1.5 0 0 0 1.5-1.5V8.5A1.5 1.5 0 0 0 19.5 7h-3l-1.4-2H8.9L7.5 7h-3A1.5 1.5 0 0 0 3 8.5V17a1.5 1.5 0 0 0 1.5 1.5z')}
        ${fotoData.length ? 'Tambah foto lagi' : 'Ambil foto atau pilih dari galeri'}</button>
      ${fotoData.length > 1 ? '<p class="chart-note" style="margin-top:6px">Foto pertama dipakai sebagai foto utama.</p>' : ''}`;
  };
  gambarKotak();

  const pilih = document.createElement('input');
  pilih.type = 'file';
  pilih.accept = 'image/*';
  pilih.multiple = true;                 // beberapa foto sekaligus
  pilih.style.display = 'none';
  bg.appendChild(pilih);

  pilih.addEventListener('change', () => {
    const berkas = Array.from(pilih.files || []);
    pilih.value = '';
    if (!berkas.length) return;

    kotak.innerHTML = `<p class="chart-note">Mengolah ${berkas.length} foto…</p>`;
    // 1000 px / kualitas 0,7 — cukup tajam di layar, tetap ringan saat ditanam
    Promise.all(berkas.map(f => kecilkanGambar(f, 1000, 'image/jpeg', 0.7).catch(() => null)))
      .then(async hasil => {
        let sah = hasil.filter(Boolean);
        const besar = sah.reduce((s, d) => s + d.length * 0.75, 0);
        let gagal = hasil.length - sah.length;

        // Bila tersambung ke server, fotonya diunggah jadi berkas tersendiri dan
        // yang disimpan hanya alamatnya. Kalau ikut ditanam sebagai base64, satu
        // draf bisa membengkak berkali-kali lipat hanya karena foto.
        if (typeof SERVER !== 'undefined' && SERVER.aktif) {
          kotak.innerHTML = `<p class="chart-note">Mengunggah ${sah.length} foto…</p>`;
          const naik = await Promise.all(sah.map((d, i) =>
            unggahFoto(d, `tempat-${i + 1}`).catch(() => null)));
          gagal += naik.filter(u => !u).length;
          sah = naik.filter(Boolean);
        }

        fotoData = fotoData.concat(sah);
        gambarKotak();
        pesan(`${sah.length} foto ditambahkan (${teksUkuran(Math.round(besar))})`
              + (gagal ? ` · ${gagal} gagal` : ''), !!gagal);
      });
  });

  kotak.addEventListener('click', e => {
    const hapus = e.target.closest('[data-foto-hapus]');
    if (hapus) { e.preventDefault(); fotoData.splice(+hapus.dataset.fotoHapus, 1); gambarKotak(); }
    else if (e.target.closest('[data-foto-tambah]')) { e.preventDefault(); pilih.click(); }
  });

  /* ── Jam buka: sembunyikan pemilih waktu saat "24 jam" ── */
  const badan = bg.querySelector('.modal-body');
  badan.addEventListener('change', e => {
    if (e.target.name === 'jam24') badan.querySelector('[data-jam-waktu]').hidden = e.target.checked;
  });

  /* ── Letak: ambil dari GPS atau tunjuk langsung di peta ── */
  badan.addEventListener('click', e => {
    if (e.target.closest('[data-gps]')) {
      e.preventDefault();
      if (!navigator.geolocation) return pesan('Perangkat tidak mendukung lokasi', true);
      pesan('Mencari lokasi…');
      navigator.geolocation.getCurrentPosition(
        p => {
          badan.querySelector('[name="lat"]').value = p.coords.latitude.toFixed(6);
          badan.querySelector('[name="lon"]').value = p.coords.longitude.toFixed(6);
          // Ketelitian ratusan meter berarti browser memakai perkiraan jaringan,
          // bukan satelit — titiknya bisa meleset jauh tanpa terlihat salah.
          const buruk = p.coords.accuracy > 100;
          pesan(`Lokasi terpasang (ketelitian ± ${angka1(p.coords.accuracy)} m)`
                + (buruk ? ' — kurang teliti, tunggu di ruang terbuka lalu ulangi' : ''), buruk);
        },
        () => pesan('Lokasi tidak bisa diakses — izinkan lewat pengaturan browser', true),
        { enableHighAccuracy: true, timeout: 10000 });
    } else if (e.target.closest('[data-pilih-peta]')) {
      e.preventDefault();
      const draf = kumpul(badan);          // isian dibawa serta, tidak hilang
      tutupModal();
      modeTambahTempat(draf);
    }
  });
}

/* ── Batas & dusun ────────────────────────────────────────── */
function gambarBatasDesa() {
  const awal = S.data.batas.desa ? (cincinLuar(S.data.batas.desa) || []).slice(0, -1) : [];
  mulaiGambar({
    tipe: 'batas', poligon: true, awal,
    label: 'Klik mengikuti batas desa · Enter untuk selesai',
    selesai: pts => {
      S.data.batas.desa = poligonGeoJSON(pts, { nama: S.data.meta.nama });
      simpan(); gambarBatas(); buatPanelLapis(); gambarUlang();
      pesan(`Batas tersimpan — luas ${teksLuas(luasPoligon(pts)).replace(/<[^>]+>/g, '')}`);
    }
  });
}

function gambarDusunBaru() {
  mulaiGambar({
    tipe: 'dusun', poligon: true,
    label: 'Klik mengikuti batas dusun · Enter untuk selesai',
    selesai: pts => {
      bukaModal({
        judul: 'Nama dusun',
        isi: `<label class="f"><span>Nama dusun / RW</span>
                <input class="inp" name="nama" placeholder="mis. Dusun I" required></label>
              <p class="chart-note">Luas terukur ${teksLuas(luasPoligon(pts)).replace(/<[^>]+>/g, '')}.</p>`,
        aksi: [
          { label: 'Batal', fn: () => {} },
          { label: 'Simpan', cls: 'primary', fn: body => {
            const nm = (body.querySelector('[name="nama"]').value || '').trim();
            if (!nm) { pesan('Nama dusun wajib diisi', true); return false; }
            S.data.batas.dusun.push({ nama: nm, geo: poligonGeoJSON(pts, { nama: nm }) });
            simpan(); gambarBatas(); buatPanelLapis(); gambarUlang();
            pesan('Dusun ditambahkan');
          }}
        ]
      });
    }
  });
}

function gambarUlangDusun(i) {
  const d = S.data.batas.dusun[i];
  if (!d) return;
  const awal = d.geo ? (cincinLuar(d.geo) || []).slice(0, -1) : [];
  mulaiGambar({
    tipe: 'dusun', poligon: true, awal,
    label: `Gambar ulang batas ${d.nama || 'dusun'} · Enter untuk selesai`,
    selesai: pts => {
      d.geo = poligonGeoJSON(pts, { nama: d.nama });
      simpan(); gambarBatas(); buatPanelLapis(); gambarUlang();
      pesan(`Batas ${d.nama || 'dusun'} diperbarui`);
    }
  });
}

/* ── Impor geometri (GeoJSON / KML) ───────────────────────── */
function parseKML(teks) {
  const doc = new DOMParser().parseFromString(teks, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('KML tidak terbaca');
  const fitur = [];

  doc.querySelectorAll('Placemark').forEach(pm => {
    const nama = (pm.querySelector('name') || {}).textContent || '';
    const poly = pm.querySelector('Polygon outerBoundaryIs coordinates') || pm.querySelector('Polygon coordinates');
    const titik = pm.querySelector('Point coordinates');

    const urai = t => String(t).trim().split(/\s+/).map(s => {
      const [x, y] = s.split(',').map(Number);
      return [x, y];
    }).filter(p => isFinite(p[0]) && isFinite(p[1]));

    if (poly) {
      const ring = urai(poly.textContent);
      if (ring.length >= 3) fitur.push({ type: 'Feature', properties: { nama }, geometry: { type: 'Polygon', coordinates: [ring] } });
    } else if (titik) {
      const p = urai(titik.textContent)[0];
      if (p) fitur.push({ type: 'Feature', properties: { nama }, geometry: { type: 'Point', coordinates: p } });
    }
  });
  return { type: 'FeatureCollection', features: fitur };
}

function imporGeometri(file, tujuan) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const teks = String(fr.result);
      const fc = /^\s*</.test(teks) ? parseKML(teks) : JSON.parse(teks);
      const fitur = fc.type === 'FeatureCollection' ? fc.features : [fc];
      const poligon = fitur.filter(f => f.geometry && /Polygon$/.test(f.geometry.type));
      const titik = fitur.filter(f => f.geometry && f.geometry.type === 'Point');

      if (tujuan === 'batas') {
        if (!poligon.length) return pesan('Berkas tidak memuat poligon', true);
        S.data.batas.desa = poligon[0];
        simpan(); gambarBatas(); buatPanelLapis(); fokusAwal(); gambarUlang();
        pesan('Batas desa dimuat dari berkas');
      } else if (tujuan === 'dusun') {
        if (!poligon.length) return pesan('Berkas tidak memuat poligon', true);
        poligon.forEach((f, i) => S.data.batas.dusun.push({
          nama: (f.properties && (f.properties.nama || f.properties.name)) || `Dusun ${S.data.batas.dusun.length + 1}`,
          geo: f
        }));
        simpan(); gambarBatas(); buatPanelLapis(); gambarUlang();
        pesan(`${poligon.length} dusun dimuat`);
      } else if (tujuan === 'tempat') {
        if (!titik.length) return pesan('Berkas tidak memuat titik', true);
        titik.forEach(f => {
          const p = f.properties || {};
          S.data.tempat.push({
            id: idBaru(),
            nama: p.nama || p.name || 'Tanpa nama',
            kategori: KATEGORI[p.kategori] ? p.kategori : 'lainnya',
            deskripsi: p.deskripsi || p.description || '',
            alamat: p.alamat || '', kontak: p.kontak || '', jam: '', website: '', foto: '',
            lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0]
          });
        });
        simpan(); gambarTempat(); buatPanelLapis(); gambarUlang();
        pesan(`${titik.length} tempat dimuat`);
      }
    } catch (e) {
      pesan('Berkas gagal dibaca — pastikan GeoJSON atau KML yang sah', true);
    }
  };
  fr.readAsText(file);
}

/* ── Ubah nilai lewat jalur data ──────────────────────────── */
function setJalur(obj, jalur, nilai) {
  const bagian = jalur.split('.');
  let o = obj;
  for (let i = 0; i < bagian.length - 1; i++) o = o[bagian[i]];
  o[bagian[bagian.length - 1]] = nilai;
}

let jedaSimpan = null;
function simpanTertunda() {
  clearTimeout(jedaSimpan);
  jedaSimpan = setTimeout(() => simpan(true), 500);
}
