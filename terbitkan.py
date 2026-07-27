#!/usr/bin/env python3
"""Terbitkan peta terbaru ke Vercel.

    python terbitkan.py

Menyalin peta-desa-kote.html ke folder situs/ lalu men-deploy ke produksi.
Alamatnya tetap: https://peta-desa-kote.vercel.app
"""
import pathlib, shutil, subprocess, sys

AKAR = pathlib.Path(__file__).parent
PETA = AKAR / 'peta-desa-kote.html'
SITUS = AKAR / 'situs'

if not PETA.exists():
    sys.exit('peta-desa-kote.html belum ada — jalankan python build.py dulu')

SITUS.mkdir(exist_ok=True)
for nama in ('index.html', 'peta-desa-kote.html'):
    shutil.copy2(PETA, SITUS / nama)
print(f'  disalin ke situs/  ({PETA.stat().st_size / 1024:,.0f} KB)')

print('  mengunggah ke Vercel…')
r = subprocess.run(['npx', '--yes', 'vercel@latest', 'deploy', '--prod', '--yes'],
                   cwd=SITUS, shell=True)
if r.returncode:
    sys.exit('deploy gagal')

print('\n  https://peta-desa-kote.vercel.app')
