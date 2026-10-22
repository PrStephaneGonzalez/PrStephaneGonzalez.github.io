"""Intègre des enregistrements WAV (zip exporté par l'enregistreur, ou dossier) : ph/E.wav ... -> sons/ph/E.mp3.
Chaîne : passe-haut, compression douce, mise au niveau (volume moyen -13 dB), limiteur (crêtes -1 dB), MP3.
Usage : python3 integrer.py export.zip|dossier /chemin/vers/sons"""
import sys, zipfile, subprocess, os, tempfile, wave
import numpy as np
SR = 44100; TARGET = -13.0; CEIL = 10 ** (-1 / 20)

def load(src):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-af',
        'highpass=f=80,acompressor=threshold=-30dB:ratio=3:attack=5:release=120:knee=6',
        '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def trim(x):
    """garde le morceau le plus fort (le son), sans les silences ni les bruits isolés avant ou après"""
    F = int(.01 * SR); n = len(x) // F
    r = np.sqrt((x[:n * F].reshape(n, F) ** 2).mean(1)); th = r.max() * .03
    segs, i = [], 0
    while i < n:
        if r[i] < th: i += 1; continue
        j = last = i
        while j < n and j - last < 25:
            if r[j] >= th: last = j
            j += 1
        segs.append((i, last)); i = last + 1
    a, b = max(segs, key=lambda g: (r[g[0]:g[1] + 1] ** 2).sum())
    y = x[max(0, (a - 5) * F):min(len(x), (b + 12) * F)].copy()
    f = int(.01 * SR); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    return y

def level(x):
    x = trim(x)
    for _ in range(4):  # mise au niveau puis limiteur, répétés : le limiteur fait perdre un peu de volume
        x = x * 10 ** ((TARGET - 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)) / 20)  # limiteur à anticipation (5 ms) puis relâchement doux (60 ms)
        a = np.abs(x); w = int(.005 * SR)
        pk = np.lib.stride_tricks.sliding_window_view(np.pad(a, (w, w)), 2 * w + 1).max(1)
        g = np.minimum(1, CEIL / np.maximum(pk, 1e-9))
        k = np.exp(-1 / (.06 * SR)); s = np.empty_like(g); cur = 1.0
        for i, v in enumerate(g):
            cur = v if v < cur else cur * k + v * (1 - k); s[i] = cur
        x = x * s
    pad = np.zeros(int(.06 * SR))
    return np.concatenate([pad, x, pad])

def write_mp3(x, dst):
    with tempfile.NamedTemporaryFile(suffix='.wav') as t:
        with wave.open(t.name, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', t.name, '-c:a', 'libmp3lame', '-b:a', '64k', dst], check=True)

def sources(arg, tmp):
    if os.path.isdir(arg):
        for c in ('ph', 'sy', 'w', 'mo'):
            for f in sorted(os.listdir(os.path.join(arg, c))) if os.path.isdir(os.path.join(arg, c)) else []:
                if f.endswith('.wav'): yield c, f, os.path.join(arg, c, f)
    else:
        z = zipfile.ZipFile(arg)
        for n in z.namelist():
            if not n.endswith('.wav') or n.count('/') != 1: continue
            c, f = n.split('/')
            if c in ('ph', 'sy', 'w', 'mo') and '..' not in f:
                p = os.path.join(tmp, c + '_' + f); open(p, 'wb').write(z.read(n)); yield c, f, p

if __name__ == '__main__':
    sons = sys.argv[2]; done = []
    with tempfile.TemporaryDirectory() as tmp:
        for c, f, src in sources(sys.argv[1], tmp):
            dst = f'{sons}/{c}/{f[:-4]}.mp3'
            if not os.path.exists(dst): print('inconnu, ignoré :', c, f); continue
            write_mp3(level(load(src)), dst); done.append(f'{c}/{f[:-4]}')
    lst = f'{sons}/voix-perso.txt'
    old = set(open(lst).read().split()) if os.path.exists(lst) else set()
    open(lst, 'w').write('\n'.join(sorted(old | set(done))) + '\n')
    print(len(done), 'sons intégrés ; total voix perso :', len(old | set(done)))
