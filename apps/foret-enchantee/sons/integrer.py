"""Intègre un zip exporté par l'enregistreur : ph/E.wav ... -> sons/ph/E.mp3 (remplace la voix de synthèse).
Usage : python3 integrer.py export.zip /chemin/vers/sons"""
import sys, zipfile, subprocess, os, tempfile
z, sons = zipfile.ZipFile(sys.argv[1]), sys.argv[2]
done = []
with tempfile.TemporaryDirectory() as t:
    for n in z.namelist():
        if not n.endswith('.wav') or n.count('/') != 1: continue
        cat, f = n.split('/')
        if cat not in ('ph', 'sy', 'w', 'mo') or '..' in f: continue
        src = os.path.join(t, cat + '_' + f); open(src, 'wb').write(z.read(n))
        dst = f'{sons}/{cat}/{f[:-4]}.mp3'
        if not os.path.exists(dst): print('inconnu, ignoré :', n); continue
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', 'highpass=f=70,adelay=60,apad=pad_dur=0.06,loudnorm=I=-16:TP=-1.5:LRA=7',
                        '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '64k', dst], check=True)
        done.append(f'{cat}/{f[:-4]}')
lst = f'{sons}/voix-perso.txt'
old = set(open(lst).read().split()) if os.path.exists(lst) else set()
open(lst, 'w').write('\n'.join(sorted(old | set(done))) + '\n')
print(len(done), 'sons remplacés ; total voix perso :', len(old | set(done)))
