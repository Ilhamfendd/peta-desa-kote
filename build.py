#!/usr/bin/env python3
"""Rakit sumber di src/ menjadi satu berkas HTML mandiri.

    python build.py

Hasil: peta-desa-kote.html — tidak butuh server, CDN, atau pemasangan.
"""
import base64, json, pathlib, sys, re

AKAR = pathlib.Path(__file__).parent
SRC = AKAR / 'src'
KELUARAN = AKAR / 'peta-desa-kote.html'


def baca(p):
    return (SRC / p).read_text(encoding='utf-8')


def main():
    html = baca('index.html')

    js_files = sorted((SRC / 'js').glob('*.js'))
    if not js_files:
        sys.exit('Tidak ada berkas JS di src/js/')
    app_js = '\n\n'.join(f'/* ── {f.name} ── */\n' + f.read_text(encoding='utf-8') for f in js_files)

    basemap = json.loads(baca('basemap.json'))
    basemap_min = json.dumps(basemap, separators=(',', ':'), ensure_ascii=False)

    # Data desa: pakai data.json bila ada, kalau tidak biarkan kosong
    # (aplikasi membangun kerangka kosongnya sendiri).
    data_path = SRC / 'data.json'
    desa = data_path.read_text(encoding='utf-8').strip() if data_path.exists() else 'null'

    bagian = {
        '/*__LEAFLET_CSS__*/': baca('vendor/leaflet.css'),
        '/*__APP_CSS__*/': baca('style.css'),
        '/*__LEAFLET_JS__*/': baca('vendor/leaflet.js'),
        '/*__APP_JS__*/': app_js,
        '/*__BASEMAP__*/': basemap_min,
        '/*__DESA_DATA__*/': desa,
    }

    for tanda, isi in bagian.items():
        if tanda not in html:
            sys.exit(f'Penanda hilang di index.html: {tanda}')
        # Sebuah "</script" di dalam blok skrip akan menutupnya lebih awal.
        if tanda.endswith('JS__*/') or tanda.endswith('DATA__*/') or tanda.endswith('BASEMAP__*/'):
            if re.search(r'</script', isi, re.I):
                sys.exit(f'Isi {tanda} memuat "</script" — perlu di-escape')
        html = html.replace(tanda, isi, 1)

    # Lambang KKN — mask alfa, jadi warnanya ditentukan CSS dan ikut tema.
    logo = SRC / 'logo-kkn-emblem.png'
    if logo.exists():
        b64 = base64.b64encode(logo.read_bytes()).decode('ascii')
        html = html.replace('__LOGO_KKN__', 'data:image/png;base64,' + b64)
    else:
        html = html.replace('__LOGO_KKN__', '')

    KELUARAN.write_text(html, encoding='utf-8')

    kb = KELUARAN.stat().st_size / 1024
    print(f'  {KELUARAN.name}  {kb:,.0f} KB')
    print(f'  {len(js_files)} modul JS · {sum(len(v["features"]) for v in basemap.values()):,} objek peta dasar')


if __name__ == '__main__':
    main()
