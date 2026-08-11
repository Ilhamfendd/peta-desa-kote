#!/usr/bin/env python3
"""Terbitkan website desa dan peta terbaru ke internet.

    python terbitkan.py                            # pesan commit otomatis
    python terbitkan.py "perbarui data penduduk"

Merakit peta (build.py), membangun website profil (bangun-situs.py), lalu
mencatatnya sebagai commit dan push ke GitHub. Vercel tersambung ke repo itu,
jadi push sekaligus menerbitkan.

    https://peta-desa-kote.vercel.app        profil desa
    https://peta-desa-kote.vercel.app/peta   peta digital
"""
import pathlib, subprocess, sys
from datetime import date

AKAR = pathlib.Path(__file__).parent
PETA = AKAR / 'peta-desa-kote.html'
PUBLIC = AKAR / 'public'


def jalankan(*perintah):
    return subprocess.run(perintah, cwd=AKAR, capture_output=True, text=True)


def main():
    for skrip in ('build.py', 'bangun-situs.py'):
        r = subprocess.run([sys.executable, skrip], cwd=AKAR)
        if r.returncode:
            sys.exit(f'{skrip} gagal — perbaiki dulu sebelum menerbitkan')

    if not PETA.exists():
        sys.exit('peta-desa-kote.html belum ada — jalankan python build.py dulu')

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
