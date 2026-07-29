#!/usr/bin/env python3
"""Buat berkas pratinjau berisi DATA KARANGAN.

    python buat-contoh.py

Hasil: contoh-peta-desa-kote.html — berkas terpisah, berlabel jelas di dalam
aplikasinya, dan memakai penyimpanan browser sendiri. `peta-desa-kote.html`
tidak tersentuh sama sekali.

Membatalkannya: hapus berkas contoh itu. Tidak ada yang perlu dipulihkan.
"""
import json, math, pathlib, re, sys

AKAR = pathlib.Path(__file__).parent
ASLI = AKAR / 'peta-desa-kote.html'
KELUARAN = AKAR / 'contoh-peta-desa-kote.html'

CY, CX = -0.3657998, 104.5098449          # pusat Desa Kote (simpul OSM)
R_BUMI = 6371008.8


def luas_ring(ring):
    """Luas poligon bola (m²) dari cincin [lng,lat]."""
    t = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        t += math.radians(x2 - x1) * (2 + math.sin(math.radians(y1)) + math.sin(math.radians(y2)))
    return abs(t * R_BUMI * R_BUMI / 2)


def batas_desa():
    """Poligon memanjang mengikuti pesisir: lebar ke timur-barat, dalam ke selatan."""
    titik = [
        (-0.0300, +0.0072), (-0.0180, +0.0119), (-0.0035, +0.0134), (+0.0110, +0.0121),
        (+0.0242, +0.0083), (+0.0318, +0.0016), (+0.0300, -0.0090), (+0.0186, -0.0169),
        (+0.0040, -0.0206), (-0.0116, -0.0197), (-0.0248, -0.0146), (-0.0316, -0.0052),
    ]
    ring = [[round(CX + dx, 6), round(CY + dy, 6)] for dx, dy in titik]
    ring.append(ring[0])
    return ring


def kotak(dx0, dy0, dx1, dy1):
    ring = [[round(CX + dx0, 6), round(CY + dy0, 6)], [round(CX + dx1, 6), round(CY + dy0, 6)],
            [round(CX + dx1, 6), round(CY + dy1, 6)], [round(CX + dx0, 6), round(CY + dy1, 6)]]
    ring.append(ring[0])
    return ring


def fitur(ring, nama=''):
    return {'type': 'Feature', 'properties': {'nama': nama},
            'geometry': {'type': 'Polygon', 'coordinates': [ring]}}


# ── Tempat: tersebar di sepanjang jalan pesisir ──────────────
TEMPAT = [
    ('Kantor Desa Kote',            'pemerintahan', -0.0028, +0.0031, 'Pusat pelayanan administrasi desa.',
     'Jl. Raya Kote RT 02', '0812-0000-0001', 'Senin–Jumat 08.00–15.00'),
    ('Balai Desa Kote',             'pemerintahan', -0.0011, +0.0026, 'Tempat musyawarah dan kegiatan warga.', '', '', ''),
    ('SD Negeri 010 Kote',          'pendidikan',   +0.0064, -0.0035, 'Sekolah dasar negeri.',
     'Jl. Raya Kote RT 04', '', 'Senin–Sabtu 07.00–12.30'),
    ('SMP Negeri 2 Singkep Pesisir', 'pendidikan',  +0.0132, -0.0048, '', '', '', 'Senin–Sabtu 07.00–13.30'),
    ('PAUD Tunas Bahari',           'pendidikan',   -0.0092, +0.0018, '', '', '', 'Senin–Jumat 08.00–10.30'),
    ('Puskesmas Pembantu Kote',     'kesehatan',    +0.0038, +0.0057, 'Layanan kesehatan dasar dan rujukan.',
     'Jl. Raya Kote RT 03', '0812-0000-0002', 'Senin–Sabtu 07.30–14.00'),
    ('Posyandu Melati',             'kesehatan',    -0.0142, +0.0044, 'Layanan ibu dan balita setiap bulan.', '', '', ''),
    ('Masjid Al-Ikhlas',            'ibadah',       +0.0092, -0.0012, 'Masjid jami Desa Kote.', '', '', 'Setiap hari 24 jam'),
    ('Musala Nurul Iman',           'ibadah',       -0.0175, +0.0029, '', '', '', 'Setiap hari 24 jam'),
    ('Pasar Kote',                  'ekonomi',      -0.0118, +0.0087, 'Pasar rakyat, paling ramai pagi hari.',
     '', '', 'Setiap hari 05.30–11.00'),
    ('BUMDes Kote Bahari',          'ekonomi',      -0.0049, +0.0040, 'Badan usaha milik desa bidang perikanan.',
     '', '0812-0000-0003', 'Senin–Jumat 08.00–16.00'),
    ('Dermaga Nelayan Kote',        'perikanan',    +0.0019, +0.0126, 'Tambatan perahu dan bongkar hasil tangkapan.', '', '', ''),
    ('Tempat Pelelangan Ikan',      'perikanan',    +0.0044, +0.0108, 'Lelang hasil laut setiap pagi.', '', '', 'Setiap hari 06.00–09.00'),
    ('Pantai Kote',                 'wisata',       -0.0201, +0.0152, 'Pantai berpasir di sisi barat desa.', '', '', ''),
    ('Menara Air Bersih',           'infrastruktur', -0.0064, -0.0084, 'Sumber air bersih warga dusun II.', '', '', ''),
    ('Lapangan Desa Kote',          'lainnya',      +0.0007, -0.0061, 'Lapangan serbaguna dan olahraga.', '', '', ''),
]


def bangun_data():
    ring = batas_desa()
    luas_km2 = round(luas_ring(ring) / 1e6, 1)

    return {
        'meta': {
            'demo': True,
            'nama': 'Desa Kote', 'kecamatan': 'Singkep Pesisir', 'kabupaten': 'Lingga',
            'provinsi': 'Kepulauan Riau', 'kode': '21.04.06.2004', 'kodepos': '29871',
            'pusat': [CY, CX], 'jangkauan': 8, 'logoDesa': '',
            'diperbarui': '2026-07-27T12:00:00.000Z', 'versiApl': '1.0.0',
        },
        'profil': {
            'kepala': 'Nama Kepala Desa (contoh)',
            'alamat': 'Jl. Raya Kote RT 02, Desa Kote',
            'telepon': '0776-000000', 'email': 'desakote@lingga.go.id', 'website': '',
            'visi': 'Terwujudnya Desa Kote yang maju, mandiri, dan sejahtera '
                    'dengan memanfaatkan potensi bahari secara berkelanjutan.',
            'misi': 'Meningkatkan mutu pelayanan publik desa.\n'
                    'Menguatkan ekonomi warga melalui perikanan dan UMKM.\n'
                    'Menjaga kelestarian pesisir dan laut.',
            'sejarah': 'Desa Kote merupakan salah satu permukiman pesisir tertua di Pulau Singkep. '
                       'Warganya sejak lama menggantungkan hidup pada hasil laut, dan permukimannya '
                       'berkembang mengikuti garis pantai serta jalur jalan yang menghubungkan '
                       'Dabo Singkep dengan pelabuhan Jagoh.',
            'potensi': 'Perikanan tangkap, budidaya kerapu, kelapa, dan wisata pantai.',
            'sumberStat': 'DATA CONTOH — angka karangan untuk pratinjau, bukan data resmi',
            'tim': 'KKN Kelompok 67', 'institusi': '', 'tahun': '2026', 'urlPublik': '',
        },
        'statistik': {
            'ringkas': {'penduduk': 1847, 'kk': 512, 'luas': luas_km2, 'dusun': 3, 'rt': 9, 'rw': 3},
            'gender': {'judul': 'Jenis kelamin', 'satuan': 'jiwa',
                       'baris': [{'l': 'Laki-laki', 'v': 943}, {'l': 'Perempuan', 'v': 904}]},
            'usia': {'judul': 'Kelompok umur', 'satuan': 'jiwa', 'baris': [
                {'l': '0–4', 'lk': 78, 'pr': 74}, {'l': '5–14', 'lk': 165, 'pr': 158},
                {'l': '15–24', 'lk': 172, 'pr': 163}, {'l': '25–44', 'lk': 268, 'pr': 261},
                {'l': '45–64', 'lk': 191, 'pr': 183}, {'l': '65+', 'lk': 69, 'pr': 65}]},
            'pendidikan': {'judul': 'Pendidikan terakhir', 'satuan': 'jiwa', 'baris': [
                {'l': 'Tidak/belum sekolah', 'v': 312}, {'l': 'SD / sederajat', 'v': 528},
                {'l': 'SMP / sederajat', 'v': 394}, {'l': 'SMA / sederajat', 'v': 452},
                {'l': 'Diploma', 'v': 68}, {'l': 'Sarjana ke atas', 'v': 93}]},
            'pekerjaan': {'judul': 'Mata pencaharian', 'satuan': 'jiwa', 'baris': [
                {'l': 'Nelayan', 'v': 386}, {'l': 'Petani / pekebun', 'v': 148},
                {'l': 'Wiraswasta', 'v': 212}, {'l': 'Karyawan swasta', 'v': 131},
                {'l': 'PNS / TNI / Polri', 'v': 47}, {'l': 'Lainnya', 'v': 100}]},
            'agama': {'judul': 'Agama', 'satuan': 'jiwa', 'baris': [
                {'l': 'Islam', 'v': 1698}, {'l': 'Kristen', 'v': 61}, {'l': 'Katolik', 'v': 24},
                {'l': 'Buddha', 'v': 58}, {'l': 'Hindu', 'v': 4}, {'l': 'Konghucu', 'v': 2}]},
        },
        'batas': {
            'desa': fitur(ring, 'Desa Kote'),
            'dusun': [
                {'nama': 'Dusun I', 'geo': fitur(kotak(-0.0316, -0.0150, -0.0110, +0.0125), 'Dusun I')},
                {'nama': 'Dusun II', 'geo': fitur(kotak(-0.0110, -0.0200, +0.0090, +0.0130), 'Dusun II')},
                {'nama': 'Dusun III', 'geo': fitur(kotak(+0.0090, -0.0170, +0.0316, +0.0110), 'Dusun III')},
            ],
        },
        'tempat': [
            {'id': f't{i+1}', 'nama': n, 'kategori': k, 'deskripsi': d, 'alamat': al,
             'kontak': ko, 'jam': jm, 'website': '', 'foto': '',
             'lat': round(CY + dy, 6), 'lon': round(CX + dx, 6)}
            for i, (n, k, dx, dy, d, al, ko, jm) in enumerate(TEMPAT)
        ],
    }


def main():
    if not ASLI.exists():
        sys.exit('peta-desa-kote.html belum dibangun — jalankan python build.py dulu')

    html = ASLI.read_text(encoding='utf-8')

    # Ganti seluruh blok datanya, apa pun isinya sekarang. Hasilnya ditulis ke
    # berkas lain, jadi berkas asli tetap utuh.
    pola = re.compile(r'(<script id="desa-data" type="application/json">).*?(</script>)', re.S)
    if not pola.search(html):
        sys.exit('Blok data tidak ditemukan di peta-desa-kote.html')

    data = bangun_data()
    isi = json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')
    html = pola.sub(lambda m: m.group(1) + isi + m.group(2), html, count=1)
    html = html.replace('<title>Peta Digital Desa Kote', '<title>[CONTOH] Peta Digital Desa Kote')

    KELUARAN.write_text(html, encoding='utf-8')

    st = data['statistik']
    print(f'  {KELUARAN.name}  {KELUARAN.stat().st_size / 1024:,.0f} KB')
    print(f'  {len(data["tempat"])} tempat - {len(data["batas"]["dusun"])} dusun - '
          f'luas {st["ringkas"]["luas"]} km2')
    print(f'  {ASLI.name} tidak disentuh')
    print('\n  Membatalkan: hapus contoh-peta-desa-kote.html')


if __name__ == '__main__':
    main()
