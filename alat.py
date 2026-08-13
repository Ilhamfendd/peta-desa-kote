"""Bantuan bersama untuk build.py dan bangun-situs.py."""
import json, os, urllib.error, urllib.request

SITUS = os.environ.get('SITUS_URL', 'https://peta-desa-kote.vercel.app').rstrip('/')

# Cache sederhana: kedua perakit dijalankan berurutan dalam satu proses build,
# tapi masing-masing proses Python sendiri — jadi ini hanya menahan panggilan
# ganda di dalam satu proses.
_singgahan = {}


def ambil_terbit():
    """Data yang sudah diterbitkan lewat halaman admin, atau None.

    Hanya dihubungi saat perakitan berjalan di Vercel. Di komputer sendiri
    perakit tetap memakai berkas di repo, supaya `python build.py` bisa
    dijalankan tanpa internet dan tidak diam-diam menarik data dari server.
    """
    if 'hasil' in _singgahan:
        return _singgahan['hasil']

    aktif = os.environ.get('VERCEL') or os.environ.get('AMBIL_TERBIT')
    if not aktif:
        _singgahan['hasil'] = None
        return None

    url = f'{SITUS}/api/terbit'
    try:
        permintaan = urllib.request.Request(url, headers={'User-Agent': 'perakit-desa-kote'})
        with urllib.request.urlopen(permintaan, timeout=15) as balasan:
            hasil = json.loads(balasan.read().decode('utf-8'))
        print(f'  data terbit diambil dari {url}')
    except urllib.error.HTTPError as e:
        # 404 = belum pernah diterbitkan lewat admin. Itu wajar, bukan kegagalan.
        print(f'  {url} -> {e.code}; memakai berkas bawaan di repo')
        hasil = None
    except Exception as e:
        # Jangan sampai perakitan gagal hanya karena jaringan. Lebih baik terbit
        # dengan data lama daripada situsnya tidak terbit sama sekali.
        print(f'  gagal menghubungi {url} ({e}); memakai berkas bawaan di repo')
        hasil = None

    _singgahan['hasil'] = hasil
    return hasil
