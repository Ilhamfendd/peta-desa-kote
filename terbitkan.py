#!/usr/bin/env python3
"""Terbitkan peta terbaru ke internet.

    python terbitkan.py                            # pesan commit otomatis
    python terbitkan.py "perbarui data penduduk"

Menyalin peta ke folder public/, mencatatnya sebagai commit, lalu push ke
GitHub. Vercel tersambung ke repo itu, jadi push sekaligus menerbitkan.

    https://peta-desa-kote.vercel.app
"""
import pathlib, shutil, subprocess, sys
from datetime import date

AKAR = pathlib.Path(__file__).parent
PETA = AKAR / 'peta-desa-kote.html'
PUBLIC = AKAR / 'public'


def jalankan(*perintah):
    return subprocess.run(perintah, cwd=AKAR, capture_output=True, text=True)


def main():
    if not PETA.exists():
        sys.exit('peta-desa-kote.html belum ada — jalankan python build.py dulu')

    PUBLIC.mkdir(exist_ok=True)
    for nama in ('index.html', 'peta-desa-kote.html'):
        shutil.copy2(PETA, PUBLIC / nama)
    print(f'  disalin ke public/  ({PETA.stat().st_size / 1024:,.0f} KB)')

    if not jalankan('git', 'status', '--porcelain').stdout.strip():
        print('  tidak ada perubahan — tidak ada yang perlu diterbitkan')
        return

    pesan = sys.argv[1] if len(sys.argv) > 1 else f'Perbarui peta {date.today():%d-%m-%Y}'
    jalankan('git', 'add', '-A')
    jalankan('git', 'commit', '-m', pesan)
    print(f'  commit: {pesan}')

    print('  mengirim ke GitHub…')
    r = jalankan('git', 'push')
    if r.returncode:
        print(r.stderr.strip()[:400])
        sys.exit('push gagal')

    print('\n  Terkirim. Vercel menerbitkannya dalam ~1 menit:')
    print('  https://peta-desa-kote.vercel.app')


if __name__ == '__main__':
    main()
