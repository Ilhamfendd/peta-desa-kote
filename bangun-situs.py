#!/usr/bin/env python3
"""Bangun website profil Desa Kote dari situs/konten.json.

    python bangun-situs.py

Keluaran ke public/ — halaman profil di alamat utama, peta digital di /peta.
Bagian yang masih kosong tidak ditampilkan di website, dan disebut di akhir
sebagai pengingat.
"""
import base64, html, json, math, pathlib, shutil, sys
from datetime import date
from alat import ambil_terbit

try:                                   # konsol Windows bawaan memakai cp1252
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

AKAR = pathlib.Path(__file__).parent
SITUS = AKAR / 'situs'
SRC = AKAR / 'src'
PUBLIC = AKAR / 'public'
PETA = AKAR / 'peta-desa-kote.html'

E = lambda s: html.escape(str(s if s is not None else ''), quote=True)
NF = lambda n: f'{n:,}'.replace(',', '.')
# Vercel memakai cleanUrls, jadi tautan ditulis tanpa akhiran .html
tautan = lambda berkas: '/' if berkas == 'index.html' else '/' + berkas[:-5]


def paragraf(teks, kelas=''):
    """Baris kosong memisahkan paragraf."""
    bagian = [p.strip() for p in str(teks or '').split('\n\n') if p.strip()]
    k = f' class="{kelas}"' if kelas else ''
    return ''.join(f'<p{k}>{E(p)}</p>' for p in bagian)


def dms(v, sumbu):
    arah = ('LS' if v < 0 else 'LU') if sumbu == 'lat' else ('BB' if v < 0 else 'BT')
    a = abs(v); d = int(a); m = int((a - d) * 60); s = (a - d - m / 60) * 3600
    return f"{d}°{m:02d}′{s:04.1f}″ {arah}"


# ── Hero: garis pantai asli Desa Kote sebagai linework peta laut ──
W, H = 1600, 700


def hero_svg(pusat):
    """Menggambar pesisir Desa Kote dari geometri OSM yang sudah tertanam."""
    bm = json.loads((SRC / 'basemap.json').read_text(encoding='utf-8'))
    lat0, lon0 = pusat

    span_lat = 0.10
    span_lon = span_lat * (W / H) / max(0.2, math.cos(math.radians(lat0)))
    utara, selatan = lat0 + span_lat / 2, lat0 - span_lat / 2
    barat, timur = lon0 - span_lon / 2, lon0 + span_lon / 2

    def proyeksi(lon, lat):
        return ((lon - barat) / (timur - barat) * W,
                (utara - lat) / (utara - selatan) * H)

    def jalur(koordinat, tutup=False):
        titik = [proyeksi(c[0], c[1]) for c in koordinat]
        if not any(-80 <= x <= W + 80 and -80 <= y <= H + 80 for x, y in titik):
            return None                      # seluruhnya di luar bingkai
        d = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in titik)
        return d + 'Z' if tutup else d

    def kumpul(kunci, tutup=False, kelas='', batas=None):
        keluar = []
        for f in bm.get(kunci, {}).get('features', []):
            g = f['geometry']
            cincin = [g['coordinates']] if g['type'] == 'LineString' else g['coordinates']
            for c in cincin:
                if isinstance(c[0][0], list):
                    c = c[0]
                d = jalur(c, tutup)
                if d:
                    keluar.append(f'<path class="{kelas}" d="{d}"/>')
                if batas and len(keluar) >= batas:
                    return keluar
        return keluar

    lapis = []
    lapis += kumpul('islands', tutup=True, kelas='pesisir-darat')
    lapis += kumpul('coast', kelas='pesisir-garis')
    lapis += kumpul('roads', kelas='pesisir-jalan', batas=150)

    # Kontur kedalaman semu — konvensi peta laut, ditarik dari titik desa
    kx, ky = proyeksi(lon0, lat0)
    kontur = ''.join(
        f'<circle class="pesisir-kontur" cx="{kx:.0f}" cy="{ky:.0f}" r="{r}"/>'
        for r in (150, 260, 380, 520))

    penanda = (f'<circle class="pesisir-dering" cx="{kx:.0f}" cy="{ky:.0f}" r="8"/>'
               f'<circle class="pesisir-titik" cx="{kx:.0f}" cy="{ky:.0f}" r="4.5"/>')

    return (f'<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" '
            f'aria-hidden="true" focusable="false">{kontur}{"".join(lapis)}{penanda}</svg>')


# ── Kerangka halaman ──
HALAMAN = [
    ('index.html',        'Beranda',      'Beranda'),
    ('profil.html',       'Profil Desa',  'Profil'),
    ('pemerintahan.html', 'Pemerintahan', 'Pemerintahan'),
    ('potensi.html',      'Potensi & UMKM', 'Potensi'),
    ('layanan.html',      'Layanan',      'Layanan'),
    ('berita.html',       'Berita & Kegiatan', 'Berita'),
    ('unduhan.html',      'Unduhan',      'Unduhan'),
]


def kerangka(k, berkas, judul, isi, gaya, logo, hero=''):
    s = k['situs']
    nav = ''
    for f, _, label in HALAMAN:
        kini = ' aria-current="page"' if f == berkas else ''
        nav += '<a href="%s"%s>%s</a>' % (tautan(f), kini, E(label))
    nav += '<a href="/peta" class="sorot">Peta Digital</a>'

    tahun = date.today().year
    judul_penuh = f'{judul} — {s["nama"]}' if berkas != 'index.html' \
        else f'{s["nama"]} — {s["kecamatan"]}, {s["kabupaten"]}'

    return f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(judul_penuh)}</title>
<meta name="description" content="{E(s['deskripsi'])}">
<meta property="og:title" content="{E(judul_penuh)}">
<meta property="og:description" content="{E(s['deskripsi'])}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&display=swap" rel="stylesheet">
<style>:root{{--logo:url("{logo}")}}
{gaya}</style>
</head>
<body>

<header class="kepala">
  <div class="wadah kepala-isi">
    <a class="merek" href="/">
      <span class="lambang" aria-hidden="true"></span>
      <span><b>{E(s['nama'])}</b><small>Kec. {E(s['kecamatan'])} · Kab. {E(s['kabupaten'])}</small></span>
    </a>
    <button class="tombol-nav" aria-label="Buka menu" aria-expanded="false" aria-controls="nav">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
    <nav class="nav" id="nav">{nav}</nav>
  </div>
</header>

{hero}
<main>{isi}</main>

<footer class="kaki">
  <div class="wadah">
    <div class="kaki-kisi">
      <div>
        <div class="kaki-merek"><span class="lambang" aria-hidden="true"></span><b>{E(s['nama'])}</b></div>
        <p>Kecamatan {E(s['kecamatan'])}<br>Kabupaten {E(s['kabupaten'])}<br>{E(s['provinsi'])}</p>
      </div>
      <div>
        <h4>Halaman</h4>
        <ul>{''.join('<li><a href="%s">%s</a></li>' % (tautan(f), E(l)) for f, _, l in HALAMAN)}
        <li><a href="/peta">Peta Digital</a></li></ul>
      </div>
      <div>
        <h4>Kontak</h4>
        <ul>
          {f'<li>{E(s["alamat"])}</li>' if s.get('alamat') else ''}
          {f'<li><a href="tel:{E(s["telepon"])}">{E(s["telepon"])}</a></li>' if s.get('telepon') else ''}
          {f'<li><a href="mailto:{E(s["email"])}">{E(s["email"])}</a></li>' if s.get('email') else ''}
          <li>Kode wilayah {E(s['kode'])}</li>
          {f'<li>Kode pos {E(s["kodepos"])}</li>' if s.get('kodepos') else ''}
        </ul>
      </div>
    </div>
    <div class="kaki-bawah">
      <span>Disusun oleh {E(s['tim'])}{' · ' + E(s['institusi']) if s.get('institusi') else ''} · {E(s['tahun'])}</span>
      <span>Peta dasar © OpenStreetMap · Statistik © BPS · {tahun}</span>
    </div>
  </div>
</footer>

<script>
(function () {{
  var t = document.querySelector('.tombol-nav'), n = document.getElementById('nav');
  function sempit() {{ return matchMedia('(max-width: 800px)').matches; }}
  function atur() {{ n.hidden = sempit(); t.setAttribute('aria-expanded', 'false'); }}
  atur(); addEventListener('resize', atur);
  t.addEventListener('click', function () {{
    var buka = n.hidden;
    n.hidden = !buka;
    t.setAttribute('aria-expanded', String(buka));
  }});
  // Panjang tiap jalur dipakai untuk animasi garis pantai
  document.querySelectorAll('.hero-peta path').forEach(function (p) {{
    try {{ p.style.setProperty('--panjang', p.getTotalLength()); }} catch (e) {{}}
  }});
}})();
</script>
</body>
</html>"""


# ── Halaman ──
def hal_beranda(k, kosong):
    s, a, b = k['situs'], k['angka'], k['beranda']
    lat, lon = s['pusat']

    hero = f"""<section class="hero">
  <div class="hero-peta">{hero_svg(s['pusat'])}</div>
  <div class="wadah hero-isi">
    <p class="eyebrow"><span class="tanda">◆</span> Kec. {E(s['kecamatan'])} · Kab. {E(s['kabupaten'])} · {E(s['provinsi'])}</p>
    <h1>{E(s['nama'])}<span class="laut">{E(s['tagline'])}</span></h1>
    <p class="hero-lokasi">{E(k['profil']['geografis'].split('.')[0])}.</p>
    <div class="hero-koordinat">
      <span>{E(dms(lat, 'lat'))}</span>
      <span>{E(dms(lon, 'lng'))}</span>
      <span>Luas <b>{a['luas']} km²</b></span>
      <span>Kode <b>{E(s['kode'])}</b></span>
    </div>
  </div>
</section>"""

    kotak = [('Penduduk', NF(a['penduduk']), 'jiwa'),
             ('Luas wilayah', str(a['luas']).replace('.', ','), 'km²'),
             ('Kepadatan', NF(a['kepadatan']), 'jiwa/km²'),
             ('RT / RW', f"{a['rt']} / {a['rw']}", '')]
    angka = ''.join(f'<div><dt>{E(j)}</dt><dd>{v} <em>{E(u)}</em></dd></div>' for j, v, u in kotak)

    isi = f"""<section class="bagian"><div class="wadah">
  <dl class="angka">{angka}</dl>
  <p class="catatan">Sumber: {E(a['sumber'])}. Angka kepadatan dihitung dari luas dan jumlah penduduk.</p>
</div></section>"""

    if b['sambutan'].get('teks'):
        sb = b['sambutan']
        isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Sambutan</p>
    <h2>{E(sb['judul'] or 'Sambutan Kepala Desa')}</h2>
  </div>
  <div class="prosa">{paragraf(sb['teks'])}
  {f'<p style="margin-top:1.5rem"><b>{E(sb["oleh"])}</b><br><span style="color:var(--tinta-3)">{E(sb["jabatan"])}</span></p>' if sb.get('oleh') else ''}
  </div>
</div></section>"""
    else:
        kosong.append('beranda → sambutan kepala desa')

    sektor = k['potensi']['sektor']
    if sektor:
        kartu = ''.join(f"""<article class="kartu">
      <h3{' class="laut"' if s_.get('sifat') == 'laut' else ''}>{E(s_['nama'])}</h3>
      <p>{E(s_['teks'].split(chr(10) + chr(10))[0])}</p>
      {f'<span class="sumber">{E(s_["sumber"])}</span>' if s_.get('sumber') else ''}
    </article>""" for s_ in sektor[:3])
        isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Potensi</p>
    <h2>Yang dihidupi <span class="laut">laut</span> dan darat</h2>
  </div>
  <div class="kisi kisi-3">{kartu}</div>
  <p style="margin-top:1.75rem"><a class="tombol garis" href="/potensi">Lihat seluruh potensi</a></p>
</div></section>"""

    isi += """<section class="bagian"><div class="wadah">
  <div class="ajak-peta">
    <h2>Peta digital <span class="laut">Desa Kote</span></h2>
    <p>Batas wilayah, sebaran fasilitas, cuaca, dan tinggi gelombang laut — dalam satu peta
       yang bisa dibuka dari mana saja, termasuk saat sinyal seadanya.</p>
    <a class="tombol" href="/peta">Buka peta digital
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
  </div>
</div></section>"""

    berita = k['berita']
    if berita:
        kartu = ''.join(f"""<article class="kartu">
        <p class="eyebrow">{E(x.get('tanggal', ''))}</p>
        <h3 style="margin-top:.5rem">{E(x['judul'])}</h3>
        <p>{E(x.get('ringkas', ''))}</p></article>""" for x in berita[:3])
        isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala"><p class="eyebrow">Kabar desa</p><h2>Kegiatan terbaru</h2></div>
  <div class="kisi kisi-3">{kartu}</div>
</div></section>"""

    return hero, isi


def hal_profil(k, kosong):
    p = k['profil']
    isi = ''

    if p.get('sejarah'):
        isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala"><p class="eyebrow">Sejarah</p><h2>Asal usul Desa Kote</h2></div>
  <div class="prosa">{paragraf(p['sejarah'])}</div>
</div></section>"""
    else:
        kosong.append('profil → sejarah desa')

    if p.get('visi') or p.get('misi'):
        m = ''.join(f'<li style="margin-bottom:.5rem">{E(x)}</li>' for x in p.get('misi', []))
        isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala"><p class="eyebrow">Arah</p><h2>Visi &amp; Misi</h2></div>
  <div class="prosa">
    {f'<p style="font-family:var(--serif);font-style:italic;font-size:1.35rem;line-height:1.5">{E(p["visi"])}</p>' if p.get('visi') else ''}
    {f'<h3>Misi</h3><ol style="padding-left:1.2rem;color:var(--tinta-2)">{m}</ol>' if m else ''}
  </div>
</div></section>"""
    else:
        kosong.append('profil → visi & misi')

    batas = p.get('batasWilayah', {})
    baris = ''.join(f'<div><dt>Sebelah {E(a)}</dt><dd>{E(v)}</dd></div>'
                    for a, v in batas.items() if v)
    jarak = ''.join(f'<div><dt>{E(j["ke"])}</dt><dd>{j["km"]} km</dd></div>' for j in p.get('jarak', []))

    isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Geografis</p><h2>Letak &amp; wilayah</h2>
    <p>{E(p['geografis'])}</p>
  </div>
  {f'<h3 style="font-size:1rem;margin-bottom:.5rem">Batas wilayah</h3><dl class="definisi">{baris}</dl>' if baris else ''}
  {f'<h3 style="font-size:1rem;margin:2rem 0 .5rem">Jarak</h3><dl class="definisi">{jarak}</dl>' if jarak else ''}
  <p style="margin-top:2rem"><a class="tombol garis" href="/peta">Lihat batas di peta digital</a></p>
</div></section>"""
    if not baris:
        kosong.append('profil → batas wilayah (utara/timur/selatan/barat)')

    # Angka yang sudah terverifikasi — tempatnya memang di halaman profil
    a = k['angka']
    # Satu angka di belakang koma, supaya sama persis dengan tampilan di peta digital
    rasio = (f"{a['lakiLaki'] / a['perempuan'] * 100:.1f}".replace('.', ',')
             if a.get('perempuan') else None)
    penduduk = [
        ('Jumlah penduduk', f"{NF(a['penduduk'])} jiwa"),
        ('Laki-laki', f"{NF(a['lakiLaki'])} jiwa"),
        ('Perempuan', f"{NF(a['perempuan'])} jiwa"),
        ('Rasio jenis kelamin', f'{rasio} laki-laki per 100 perempuan' if rasio else None),
        ('Luas wilayah', f"{str(a['luas']).replace('.', ',')} km²"),
        ('Kepadatan', f"{NF(a['kepadatan'])} jiwa/km²"),
        ('Jumlah RT', a['rt']),
        ('Jumlah RW', a['rw']),
        ('Kepala keluarga', a['kk']),
        ('Jumlah dusun', a['dusun']),
    ]
    baris_p = ''.join(f'<div><dt>{E(j)}</dt><dd>{E(v)}</dd></div>' for j, v in penduduk if v)

    isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Kependudukan</p><h2>Desa Kote dalam angka</h2>
  </div>
  <dl class="definisi">{baris_p}</dl>
  <p class="catatan">Sumber: {E(a['sumber'])}. Kepadatan dan rasio jenis kelamin
  dihitung dari angka di atas. Rincian menurut kelompok umur, pendidikan,
  mata pencaharian, dan agama bisa dilihat sebagai grafik di
  <a href="/peta" style="color:var(--hijau-2)">peta digital</a>.</p>
</div></section>"""

    fasilitas = p.get('fasilitas') or []
    if fasilitas:
        baris_f = ''.join(
            '<div><dt>%s</dt><dd>%s</dd></div>'
            % (E(f['nama']), 'Belum ada' if not f['jumlah'] else E(f['jumlah']))
            for f in fasilitas)
        isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Sarana</p><h2>Fasilitas desa</h2>
    <p>Jumlah sarana yang tercatat di Desa Kote. Titik lokasinya sedang dipetakan
       satu per satu dan akan muncul di peta digital.</p>
  </div>
  <dl class="definisi">{baris_f}</dl>
  <p class="catatan">Sumber: {E(a['sumber'])}.</p>
</div></section>"""

    return '', isi


def hal_pemerintahan(k, kosong):
    g = k['pemerintahan']
    isi = f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Pemerintahan</p><h2>Perangkat Desa Kote</h2>
    {f'<p>{E(g["pengantar"])}</p>' if g.get('pengantar') else ''}
  </div>"""

    if g['perangkat']:
        kartu = ''.join(f"""<article class="kartu orang">
      {f'<img src="{E(o["foto"])}" alt="">' if o.get('foto') else '<span class="tanpa-foto" aria-hidden="true"></span>'}
      <span><b>{E(o['nama'])}</b><small>{E(o['jabatan'])}</small></span>
    </article>""" for o in g['perangkat'])
        isi += f'<div class="kisi kisi-2">{kartu}</div>'
    else:
        kosong.append('pemerintahan → daftar perangkat desa')
        isi += ('<div class="kosong">Susunan perangkat desa sedang dikumpulkan '
                'bersama Kantor Desa Kote dan akan dimuat di halaman ini.</div>')

    if g['lembaga']:
        kartu = ''.join(f'<article class="kartu"><h3>{E(l["nama"])}</h3><p>{E(l.get("keterangan", ""))}</p></article>'
                        for l in g['lembaga'])
        isi += f"""<div style="margin-top:3rem">
      <div class="bagian-kepala"><p class="eyebrow">Kelembagaan</p><h2>Lembaga desa</h2></div>
      <div class="kisi kisi-2">{kartu}</div></div>"""
    else:
        kosong.append('pemerintahan → lembaga desa (BPD, LPM, PKK, Karang Taruna)')

    return '', isi + '</div></section>'


def hal_potensi(k, kosong):
    p = k['potensi']
    kartu = ''.join(f"""<article class="kartu">
      <h3{' class="laut"' if s.get('sifat') == 'laut' else ''}>{E(s['nama'])}</h3>
      {paragraf(s['teks'])}
      {f'<span class="sumber">{E(s["sumber"])}</span>' if s.get('sumber') else ''}
    </article>""" for s in p['sektor'])

    isi = f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Potensi</p><h2>Potensi Desa Kote</h2>
    {f'<p>{E(p["pengantar"])}</p>' if p.get('pengantar') else ''}
  </div>
  {f'<div class="kisi kisi-2">{kartu}</div>' if kartu else '<div class="kosong">Belum ada potensi yang didata.</div>'}
</div></section>"""

    if p['umkm']:
        u = ''.join(f"""<article class="kartu">
        <h3>{E(x['nama'])}</h3><p>{E(x.get('produk', ''))}</p>
        {f'<span class="sumber">{E(x["kontak"])}</span>' if x.get('kontak') else ''}</article>""" for x in p['umkm'])
        isi += f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala"><p class="eyebrow">UMKM</p><h2>Usaha warga</h2></div>
  <div class="kisi kisi-3">{u}</div></div></section>"""
    else:
        kosong.append('potensi → daftar UMKM warga')

    return '', isi


def hal_layanan(k, kosong):
    l = k['layanan']
    isi = f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Pelayanan</p><h2>Layanan administrasi</h2>
    {f'<p>{E(l["pengantar"])}</p>' if l.get('pengantar') else ''}
  </div>"""

    if l['jam']:
        j = ''.join(f'<div><dt>{E(x["hari"])}</dt><dd>{E(x["jam"])}</dd></div>' for x in l['jam'])
        isi += f'<h3 style="font-size:1rem;margin-bottom:.5rem">Jam pelayanan</h3><dl class="definisi">{j}</dl>'
    else:
        kosong.append('layanan → jam pelayanan kantor desa')

    if l['daftar']:
        kartu = ''
        for x in l['daftar']:
            syarat = ''.join(f'<li>{E(y)}</li>' for y in x.get('syarat', []))
            kartu += f"""<article class="kartu">
        <h3>{E(x['nama'])}</h3>
        {f'<p>{E(x["keterangan"])}</p>' if x.get('keterangan') else ''}
        {f'<p style="margin-top:.9rem"><b>Syarat</b></p><ul style="margin:.4rem 0 0;padding-left:1.1rem;color:var(--tinta-2);font-size:.95rem">{syarat}</ul>' if syarat else ''}
        <span class="sumber">{E(x.get('lama', ''))}{' · ' if x.get('lama') and x.get('biaya') else ''}{E(x.get('biaya', ''))}</span>
      </article>"""
        isi += f'<div class="kisi kisi-2" style="margin-top:2.5rem">{kartu}</div>'
    else:
        kosong.append('layanan → daftar jenis surat & syaratnya')
        isi += ('<div class="kosong" style="margin-top:2rem">Rincian syarat dan alur '
                'tiap surat sedang disusun. Sementara ini, urusan surat-menyurat '
                'dilayani langsung di Kantor Desa Kote.</div>')

    return '', isi + '</div></section>'


def hal_berita(k, kosong):
    b = k['berita']
    if not b:
        kosong.append('berita → belum ada kabar/kegiatan yang ditulis')
        isi = ('<div class="kosong">Kabar dan kegiatan Desa Kote akan dimuat di sini — '
               'musyawarah desa, posyandu, gotong royong, dan kegiatan warga lainnya.</div>')
    else:
        isi = '<div class="kisi kisi-2">' + ''.join(f"""<article class="kartu">
      <p class="eyebrow">{E(x.get('tanggal', ''))}</p>
      <h3 style="margin-top:.5rem">{E(x['judul'])}</h3>
      {paragraf(x.get('isi') or x.get('ringkas', ''))}
    </article>""" for x in b) + '</div>'

    return '', f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala"><p class="eyebrow">Kabar desa</p><h2>Berita &amp; kegiatan</h2></div>
  {isi}
</div></section>"""


def ekspor_qgis(folder):
    """Menyiapkan data desa dalam GeoJSON — siap dibuka QGIS.

    Ini bahan mentah untuk menyusun peta cetak, sekaligus berkas yang boleh
    diunduh pengunjung. Isinya data nyata saja; ikut bertambah sendiri setiap
    kali data desa diperbarui.
    """
    d = json.loads((SRC / 'data.json').read_text(encoding='utf-8'))
    bm = json.loads((SRC / 'basemap.json').read_text(encoding='utf-8'))
    dibuat = []

    def tulis(nama, fitur, catatan):
        if not fitur:
            return
        (folder / nama).write_text(json.dumps({
            'type': 'FeatureCollection',
            'name': nama[:-8],
            'crs': {'type': 'name', 'properties': {'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'}},
            'catatan': catatan,
            'features': fitur,
        }, ensure_ascii=False), encoding='utf-8')
        dibuat.append(nama)

    # Titik lokasi — foto sengaja tidak diikutkan supaya berkasnya ringan
    titik = [{
        'type': 'Feature',
        'properties': {k: v for k, v in t.items()
                       if k not in ('lat', 'lon', 'foto', 'id') and v},
        'geometry': {'type': 'Point', 'coordinates': [t['lon'], t['lat']]},
    } for t in d.get('tempat', []) if t.get('lat') is not None]
    tulis('desa-kote-tempat.geojson', titik,
          'Titik lokasi Desa Kote. Sumber: survei tim KKN Kelompok 67 & OpenStreetMap.')

    # Batas desa & dusun — hanya bila sudah ada
    batas = d.get('batas') or {}
    wilayah = []
    if batas.get('desa'):
        wilayah.append({'type': 'Feature', 'properties': {'nama': 'Desa Kote', 'jenis': 'desa'},
                        'geometry': batas['desa']})
    for du in batas.get('dusun') or []:
        wilayah.append({'type': 'Feature',
                        'properties': {'nama': du.get('nama', ''), 'jenis': 'dusun'},
                        'geometry': du.get('geometri') or du.get('geometry')})
    tulis('desa-kote-batas.geojson', wilayah,
          'Batas wilayah Desa Kote. Bukan penetapan resmi kecuali dinyatakan lain.')

    # Peta dasar OpenStreetMap — jalan, garis pantai, perairan, pulau
    dasar = []
    for lapisan in ('coast', 'roads', 'water', 'islands'):
        for f in bm.get(lapisan, {}).get('features', []):
            g = dict(f)
            g['properties'] = dict(f.get('properties') or {}, lapisan=lapisan)
            dasar.append(g)
    tulis('desa-kote-peta-dasar.geojson', dasar,
          'Peta dasar sekitar Desa Kote. Sumber: OpenStreetMap, lisensi ODbL.')

    usulan = bm.get('usulanBatas', {}).get('features', [])
    tulis('desa-kote-batas-usulan-gadm.geojson', usulan,
          'RANCANGAN, BUKAN BATAS RESMI. Sumber GADM 4.1 — luasnya 21,36 km², '
          'sedangkan luas menurut Pemerintah Desa Kote 20,79 km² (2.079 ha); '
          'selisihnya sekitar 3%. Cukup layak sebagai kerangka awal, tetap perlu '
          'diperiksa bersama perangkat desa.')

    return dibuat


JENIS = {'.pdf': 'PDF', '.png': 'PNG', '.jpg': 'JPG', '.jpeg': 'JPG', '.html': 'HTML',
         '.geojson': 'GEO', '.json': 'JSON', '.csv': 'CSV', '.zip': 'ZIP',
         '.kml': 'KML', '.xlsx': 'XLSX', '.docx': 'DOCX'}


CETAK = {'.pdf', '.png', '.jpg', '.jpeg'}
KETERANGAN_BAWAAN = {
    'desa-kote-tempat.geojson': 'Titik lokasi & fasilitas Desa Kote',
    'desa-kote-batas.geojson': 'Batas wilayah desa dan dusun',
    'desa-kote-peta-dasar.geojson': 'Peta dasar — jalan, garis pantai, perairan, pulau',
    'desa-kote-batas-usulan-gadm.geojson': 'Rancangan batas desa (GADM) — bukan batas resmi',
}


def hal_unduhan(k, kosong):
    u = k['unduhan']
    folder = PUBLIC / 'unduhan'
    folder.mkdir(parents=True, exist_ok=True)
    ekspor_qgis(folder)

    ket = dict(KETERANGAN_BAWAAN, **u.get('keterangan', {}))

    def daftar(berkas):
        baris = ''
        for p in berkas:
            kb = p.stat().st_size / 1024
            ukuran = f'{kb:.0f} KB' if kb < 1024 else f'{kb / 1024:.1f} MB'
            nama = ket.get(p.name) or p.stem.replace('-', ' ').replace('_', ' ')
            baris += f"""<a href="/unduhan/{E(p.name)}" download>
        <span class="jenis">{E(JENIS.get(p.suffix.lower(), p.suffix.lstrip('.').upper()[:4]))}</span>
        <span class="rincian"><b>{E(nama)}</b><small>{E(p.name)}</small></span>
        <span class="ukuran">{ukuran}</span></a>"""
        return f'<div class="berkas">{baris}</div>'

    semua = sorted(p for p in folder.iterdir() if p.is_file() and not p.name.startswith('.'))
    peta = [p for p in semua if p.suffix.lower() in CETAK]
    data = [p for p in semua if p.suffix.lower() not in CETAK]

    if peta:
        bagian_peta = daftar(peta)
    else:
        kosong.append('unduhan → peta cetak hasil QGIS (taruh PDF/PNG-nya di public/unduhan/)')
        bagian_peta = """<div class="kosong">
      <p>Peta cetak belum diunggah. Sementara itu, seluruh wilayah dan titik lokasi
         Desa Kote sudah bisa dilihat langsung di peta digital.</p>
      <p style="margin-top:1.2rem"><a class="tombol" href="/peta">Buka peta digital</a></p>
    </div>"""

    # Peta luring tidak disalin ke folder unduhan — berkasnya sudah tersaji di
    # /peta, jadi cukup ditautkan. Atribut download membuatnya tersimpan alih-alih
    # terbuka sebagai halaman.
    mb = PETA.stat().st_size / 1048576 if PETA.exists() else 0
    luring_html = f'''<h3 style="font-size:1rem;margin:2.5rem 0 .5rem">Peta untuk dipakai tanpa internet</h3>
  <p style="color:var(--tinta-2);font-size:.95rem;margin-bottom:.9rem;max-width:42rem">
    Satu berkas berisi peta beserta seluruh datanya. Simpan di laptop atau flashdisk,
    lalu buka dengan klik dua kali — berguna saat turun ke lapangan atau ketika
    sinyal tidak ada. Isinya sesuai data terakhir yang diterbitkan.</p>
  <div class="berkas"><a href="/peta/index.html" download="peta-desa-kote.html">
      <span class="jenis">HTML</span>
      <span class="rincian"><b>Peta digital Desa Kote</b><small>peta-desa-kote.html</small></span>
      <span class="ukuran">{mb:.1f} MB</span></a></div>''' if mb else ''

    return '', f"""<section class="bagian"><div class="wadah">
  <div class="bagian-kepala">
    <p class="eyebrow">Unduhan</p><h2>Peta cetak &amp; data</h2>
    <p>{E(u['pengantar'])}</p>
  </div>

  <h3 style="font-size:1rem;margin-bottom:.9rem">Peta cetak</h3>
  {bagian_peta}

  {luring_html}

  <h3 style="font-size:1rem;margin:2.5rem 0 .5rem">Data peta</h3>
  <p style="color:var(--tinta-2);font-size:.95rem;margin-bottom:.9rem;max-width:42rem">
    Berkas GeoJSON, bisa langsung dibuka di QGIS, ArcGIS, atau Google Earth.
    Isinya ikut diperbarui setiap kali data desa berubah.</p>
  {daftar(data) if data else '<div class="kosong">Data peta belum tersedia.</div>'}

  <p class="catatan">Peta dasar bersumber dari OpenStreetMap (lisensi ODbL); titik lokasi
  dan batas wilayah dikumpulkan tim KKN Kelompok 67 bersama Pemerintah Desa Kote.
  Bebas dipakai ulang selama sumbernya dicantumkan.</p>
</div></section>"""


PEMBANGUN = {
    'index.html': hal_beranda, 'profil.html': hal_profil,
    'pemerintahan.html': hal_pemerintahan, 'potensi.html': hal_potensi,
    'layanan.html': hal_layanan, 'berita.html': hal_berita,
    'unduhan.html': hal_unduhan,
}


def main():
    global PUBLIC

    # Mode pratinjau: python bangun-situs.py <konten.json> <folder-keluaran>
    # Dipakai untuk mencoba tata letak dengan isi contoh tanpa menyentuh public/.
    if len(sys.argv) > 1:
        sumber = pathlib.Path(sys.argv[1])
        PUBLIC = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else AKAR / 'lokal' / 'pratinjau'
        print(f'  PRATINJAU — {sumber}  ->  {PUBLIC}')
    else:
        sumber = SITUS / 'konten.json'

    # Isi yang sudah diterbitkan lewat halaman admin mengalahkan berkas di repo.
    # Mode pratinjau selalu memakai berkas yang ditunjuk, jangan ditarik dari server.
    terbit = None if len(sys.argv) > 1 else ambil_terbit()
    if terbit and terbit.get('konten'):
        k = terbit['konten']
    else:
        if not sumber.exists():
            sys.exit(f'{sumber} tidak ditemukan')
        k = json.loads(sumber.read_text(encoding='utf-8'))
    gaya = (SITUS / 'gaya.css').read_text(encoding='utf-8')

    logo_p = SRC / 'logo-kkn-emblem.png'
    logo = ('data:image/png;base64,' + base64.b64encode(logo_p.read_bytes()).decode()) if logo_p.exists() else ''

    PUBLIC.mkdir(parents=True, exist_ok=True)
    kosong = []

    for berkas, judul, _ in HALAMAN:
        hero, isi = PEMBANGUN[berkas](k, kosong)
        (PUBLIC / berkas).write_text(kerangka(k, berkas, judul, isi, gaya, logo, hero), encoding='utf-8')

    # Halaman pengelolaan. Memakai gaya yang sama dengan situs, tapi tidak
    # tercantum di navigasi mana pun dan diberi tanda noindex.
    admin_src = SITUS / 'admin.html'
    if admin_src.exists():
        (PUBLIC / 'admin').mkdir(parents=True, exist_ok=True)
        (PUBLIC / 'admin' / 'index.html').write_text(
            admin_src.read_text(encoding='utf-8')
                .replace('__GAYA__', gaya).replace('__LOGO__', logo),
            encoding='utf-8')

    # Peta digital pindah ke /peta — alamat utama kini dipakai halaman profil
    if PETA.exists():
        (PUBLIC / 'peta').mkdir(exist_ok=True)
        shutil.copy2(PETA, PUBLIC / 'peta' / 'index.html')
        lama = PUBLIC / 'peta-desa-kote.html'   # sisa susunan sebelumnya
        if lama.exists():
            lama.unlink()

    total = sum((PUBLIC / f).stat().st_size for f, _, _ in HALAMAN) / 1024
    print(f'  {len(HALAMAN)} halaman profil  {total:,.0f} KB')
    print(f'  peta digital  ->  {PUBLIC.name}/peta/index.html')

    if kosong:
        print(f'\n  Belum diisi ({len(kosong)}) — sunting situs/konten.json:')
        for x in kosong:
            print(f'    · {x}')
        print('\n  Rinciannya ada di DATA-YANG-DIBUTUHKAN.md')


if __name__ == '__main__':
    main()
