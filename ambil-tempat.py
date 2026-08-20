#!/usr/bin/env python3
"""Ambil data tempat dari OpenStreetMap menjadi CSV siap impor.

    python ambil-tempat.py                      # radius 6 km dari pusat Desa Kote
    python ambil-tempat.py --radius 25          # perluas jangkauan
    python ambil-tempat.py --lat -0.49 --lon 104.58 --radius 8 --keluaran lokal/dabo.csv

Hasilnya berkas CSV dengan kolom yang sama persis seperti ekspor aplikasi,
jadi bisa langsung dimuat lewat **Kelola → Tempat → Muat dari CSV**.

Sumber: OpenStreetMap, lisensi ODbL — bebas dipakai dan disebarkan selama
sumbernya dicantumkan. Aplikasi sudah mencantumkannya di bilah bawah peta.
"""
import argparse, csv, json, pathlib, sys, time, urllib.error, urllib.request

CERMIN = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
]

# Pusat Desa Kote (simpul OSM place=village)
PUSAT = (-0.3657998, 104.5098449)

KOLOM = ['Nama', 'Kategori', 'Alamat', 'Kontak', 'Jam', 'Website',
         'Keterangan', 'Lintang', 'Bujur']

# Tag OSM → kategori aplikasi. Diperiksa berurutan, yang pertama cocok dipakai.
ATURAN = [
    ('pemerintahan',  [('amenity', {'townhall', 'public_building', 'courthouse'}),
                       ('office', {'government'}), ('building', {'civic', 'public'})]),
    ('pendidikan',    [('amenity', {'school', 'kindergarten', 'college', 'university',
                                    'library', 'language_school'})]),
    ('kesehatan',     [('amenity', {'hospital', 'clinic', 'doctors', 'pharmacy',
                                    'health_post', 'dentist'}),
                       ('healthcare', None)]),
    ('ibadah',        [('amenity', {'place_of_worship'}), ('building', {'mosque', 'church'})]),
    ('kuliner',       [('amenity', {'restaurant', 'cafe', 'fast_food', 'food_court',
                                    'ice_cream', 'bar'}),
                       ('shop', {'bakery', 'coffee'})]),
    ('penginapan',    [('tourism', {'hotel', 'guest_house', 'hostel', 'motel',
                                    'apartment', 'chalet'})]),
    ('wisata',        [('tourism', {'attraction', 'viewpoint', 'museum', 'picnic_site',
                                    'theme_park', 'artwork'}),
                       ('natural', {'beach'}), ('leisure', {'beach_resort', 'park'})]),
    ('perikanan',     [('amenity', {'fish_market'}), ('shop', {'seafood', 'fishing'}),
                       ('landuse', {'aquaculture'}), ('man_made', {'fish_pass'})]),
    ('pertanian',     [('landuse', {'farmland', 'orchard', 'plantation', 'farmyard',
                                    'greenhouse_horticulture'}),
                       ('place', {'farm'})]),
    ('olahraga',      [('leisure', {'pitch', 'sports_centre', 'stadium', 'track',
                                    'swimming_pool', 'fitness_centre', 'sports_hall'}),
                       ('sport', None)]),
    ('pemakaman',     [('amenity', {'grave_yard'}), ('landuse', {'cemetery'})]),
    ('keamanan',      [('amenity', {'police', 'fire_station', 'guard_post'}),
                       ('building', {'guardhouse'}), ('man_made', {'guard_tower'})]),
    ('kebencanaan',   [('emergency', {'assembly_point', 'siren', 'lifeguard',
                                      'evacuation_centre'}),
                       ('amenity', {'shelter'})]),
    ('transportasi',  [('amenity', {'ferry_terminal', 'bus_station', 'boat_rental',
                                    'taxi', 'fuel', 'parking'}),
                       ('highway', {'bus_stop'}), ('man_made', {'pier'}),
                       ('public_transport', None), ('harbour', None)]),
    ('air',           [('man_made', {'water_tower', 'water_well', 'reservoir_covered',
                                     'water_works', 'storage_tank'}),
                       ('amenity', {'drinking_water', 'water_point'}),
                       ('landuse', {'reservoir'})]),
    ('sosial',        [('amenity', {'community_centre', 'social_facility', 'grave_yard',
                                    'townhall_annex', 'theatre'}),
                       ('leisure', {'pitch', 'sports_centre', 'stadium', 'playground'}),
                       ('historic', None)]),
    ('infrastruktur', [('power', None), ('man_made', {'tower', 'mast', 'communications_tower',
                                                      'lighthouse', 'silo'}),
                       ('amenity', {'waste_disposal', 'recycling'})]),
    ('ekonomi',       [('shop', None), ('amenity', {'marketplace', 'bank', 'atm',
                                                    'post_office', 'money_transfer'}),
                       ('office', None), ('craft', None)]),
]


def kategori_dari(tag):
    for kat, syarat in ATURAN:
        for kunci, nilai in syarat:
            if kunci in tag and (nilai is None or tag[kunci] in nilai):
                return kat
    return 'lainnya'


KUNCI = ('amenity|shop|tourism|leisure|office|healthcare|historic|craft'
         '|man_made|power|public_transport')


def kueri(lat, lon, radius_km):
    """Satu pernyataan bbox jauh lebih ringan bagi Overpass daripada belasan
    kueri `around` terpisah — yang tadi membuat semua cermin timeout."""
    dlat = radius_km / 111.0
    dlon = radius_km / (111.0 * max(0.2, __import__('math').cos(__import__('math').radians(lat))))
    bbox = f'{lat - dlat:.5f},{lon - dlon:.5f},{lat + dlat:.5f},{lon + dlon:.5f}'
    return f"""[out:json][timeout:180];
(
  nwr[~"^({KUNCI})$"~"."]["name"]({bbox});
  nwr["landuse"~"^(farmland|orchard|plantation|farmyard|aquaculture|reservoir)$"]["name"]({bbox});
);
out center tags;"""


def ambil(q):
    galat = []
    for url in CERMIN:
        try:
            req = urllib.request.Request(
                url, data=q.encode('utf-8'),
                headers={'Content-Type': 'text/plain; charset=utf-8',
                         'User-Agent': 'peta-desa-kote/1.0 (KKN 67)'})
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            galat.append(f'{url.split("/")[2]}: {e}')
            time.sleep(2)
    sys.exit('Semua cermin Overpass gagal:\n  ' + '\n  '.join(galat))


def baris_dari(el):
    t = el.get('tags', {})
    nama = t.get('name') or t.get('official_name') or t.get('operator')
    if not nama:
        return None                      # tanpa nama tidak berguna di peta desa

    lat = el.get('lat') or (el.get('center') or {}).get('lat')
    lon = el.get('lon') or (el.get('center') or {}).get('lon')
    if lat is None or lon is None:
        return None

    alamat = ' '.join(filter(None, [
        t.get('addr:street'), t.get('addr:housenumber'),
        ('RT ' + t['addr:hamlet']) if t.get('addr:hamlet') else None,
        t.get('addr:village')])).strip()

    return {
        'Nama': nama,
        'Kategori': kategori_dari(t),
        'Alamat': alamat,
        'Kontak': t.get('phone') or t.get('contact:phone') or '',
        'Jam': t.get('opening_hours', ''),
        'Website': t.get('website') or t.get('contact:website') or '',
        'Keterangan': t.get('description', ''),
        'Lintang': f'{float(lat):.6f}',
        'Bujur': f'{float(lon):.6f}',
    }


def main():
    ap = argparse.ArgumentParser(description='Ambil tempat dari OpenStreetMap ke CSV')
    ap.add_argument('--lat', type=float, default=PUSAT[0])
    ap.add_argument('--lon', type=float, default=PUSAT[1])
    ap.add_argument('--radius', type=float, default=6, help='kilometer (bawaan 6)')
    ap.add_argument('--keluaran', default='lokal/tempat-osm.csv')
    a = ap.parse_args()

    print(f'  mengambil dari OpenStreetMap — radius {a.radius:g} km '
          f'dari {a.lat:.5f}, {a.lon:.5f}…')
    data = ambil(kueri(a.lat, a.lon, a.radius))

    baris, dilewati = [], 0
    for el in data.get('elements', []):
        b = baris_dari(el)
        if b:
            baris.append(b)
        else:
            dilewati += 1

    # Buang duplikat: nama sama di lokasi yang praktis berimpit
    unik, terlihat = [], set()
    for b in baris:
        kunci = (b['Nama'].lower(), round(float(b['Lintang']), 4), round(float(b['Bujur']), 4))
        if kunci in terlihat:
            continue
        terlihat.add(kunci)
        unik.append(b)

    unik.sort(key=lambda b: (b['Kategori'], b['Nama']))

    # BOM + titik koma: supaya Excel Indonesia membukanya dengan benar
    pathlib.Path(a.keluaran).parent.mkdir(parents=True, exist_ok=True)
    with open(a.keluaran, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=KOLOM, delimiter=';')
        w.writeheader()
        w.writerows(unik)

    print(f'  {a.keluaran} — {len(unik)} tempat bernama '
          f'({dilewati} objek dilewati karena tanpa nama atau tanpa koordinat)')
    if unik:
        print('\n  sebaran kategori:')
        hitung = {}
        for b in unik:
            hitung[b['Kategori']] = hitung.get(b['Kategori'], 0) + 1
        for k, n in sorted(hitung.items(), key=lambda x: -x[1]):
            print(f'    {k:15s} {n}')
    print('\n  Muat lewat: Kelola → Tempat → Muat dari CSV')
    print('  Sumber: OpenStreetMap (ODbL) — wajib dicantumkan bila disebarkan.')


if __name__ == '__main__':
    main()
