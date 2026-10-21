"""Génère les sons du jeu avec la voix française Piper « siwis » (CC BY 4.0), à partir de phonèmes contrôlés.
Sorties : out/ph/<id>.mp3 (sons isolés), out/sy/<clé>.mp3 (syllabes), out/w/<clé>.mp3 (mots), out/mo/<clé>.mp3 (petits mots)."""
import os, re, sys, json, subprocess, wave
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

D = os.path.dirname(os.path.abspath(__file__))
M = D + '/vits-piper-fr_FR-siwis-medium/'
v = PiperVoice.load(M + 'fr_FR-siwis-medium.onnx', espeak_data_dir=M + 'espeak-ng-data')
OUT = D + '/out'

def key(x):  # nom de fichier ASCII, identique côté JavaScript
    return x.replace('é', 'E').replace('è', 'H').replace('ê', 'X').replace('â', 'A').replace('ô', 'O').replace('î', 'I').replace('’', '').replace("'", '').replace(' ', '_')

def synth(ph, path, ls=1.0, pad=0.06):
    ids = v.phonemes_to_ids(ph)
    a = v.phoneme_ids_to_audio(ids, SynthesisConfig(length_scale=ls, noise_scale=0.5, noise_w_scale=0.6))
    a = np.asarray(a, dtype=np.float32)
    tmp = path + '.wav'
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050)
        w.writeframes((np.clip(a, -1, 1) * 32000).astype(np.int16).tobytes())
    flt = ('silenceremove=start_periods=1:start_threshold=-62dB:start_silence=0.08,areverse,'
           'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.08,areverse,'
           f'adelay={int(pad*1000)},apad=pad_dur={pad},loudnorm=I=-16:TP=-1.5:LRA=7')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', flt, '-ar', '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', path], check=True)
    os.remove(tmp)

S = 'ˈ'
C = {'l': 'l', 'm': 'm', 'r': 'ʁ', 's': 's', 'f': 'f', 'v': 'v', 'n': 'n', 'j': 'ʒ', 'p': 'p', 't': 't', 'd': 'd', 'b': 'b', 'c': 'k', 'g': 'ɡ', 'z': 'z', 'ch': 'ʃ', 'gn': 'ɲ'}
V = {'a': ['a'], 'i': ['i'], 'o': ['o'], 'u': ['y'], 'é': ['e'], 'è': ['ɛ'], 'e': ['ə'], 'ou': ['u'], 'on': ['ɔ', '̃'], 'an': ['ɑ', '̃'], 'in': ['ɛ', '̃'],
     'oi': ['w', 'a'], 'eu': ['ø'], 'au': ['o'], 'ai': ['ɛ']}
CONT = set('lmrsfvnjz') | {'ch', 'gn'}
# sons isolés : même noms de fichiers que les graphies du jeu
PH = {}
for g, p in V.items():
    PH[g] = ([S] + p, 1.7)
for g, c in C.items():
    PH[g] = ([c, 'ː', c, 'ː'], 1.6) if g in CONT else ([c, 'ə'], 1.1)

SKY_V = ['a', 'i', 'o', 'u', 'é', 'e']
CONS = ['l', 'm', 'r', 's', 'f', 'v', 'n', 'j', 'p', 't', 'd', 'b', 'c', 'g', 'z']
BAD = {'ci', 'ce', 'cé', 'cu', 'gi', 'ge', 'gé'}
CPLX = ['ou', 'ch', 'on', 'an', 'oi', 'in', 'au', 'eu', 'ai', 'gn']
SYL = {}
for c in CONS:
    for x in SKY_V:
        s = c + x
        if s not in BAD: SYL[s] = [C[c], S] + V[x]
for x in CPLX:
    if x == 'ch':
        for w in SKY_V: SYL['ch' + w] = ['ʃ', S] + V[w]
    elif x != 'gn':
        for c in CONS:
            if c in 'cg' and x in ('in', 'eu'): continue
            SYL[c + x] = [C[c], S] + V[x]

WORDS = ['lama', 'moto', 'vélo', 'mur', 'sofa', 'judo', 'radio', 'piano', 'lit', 'rat', 'riz', 'nid', 'dé', 'bébé', 'lune', 'tomate', 'salade', 'tulipe', 'pirate',
         'banane', 'ananas', 'robe', 'café', 'tortue', 'pomme', 'vache', 'chat', 'loup', 'poule', 'mouton', 'lapin', 'sapin', 'melon', 'cochon', 'canard', 'roi', 'feu',
         'auto', 'lait', 'savon', 'bouche', 'mouche', 'lion', 'pantalon', 'souris', 'hibou', 'loupe', 'poisson', 'ballon', 'montagne', 'chocolat', 'bonbon', 'fourmi', 'éléphant']
MOTS = ['le', 'la', 'un', 'une', 'et', 'les', 'il', 'elle', 'est', 'dans', 'sur', 'de', 'je', 'tu', 'des', 'avec', 'pas', 'mon']
MOT_PH = {'le': ['l', S, 'ə'], 'de': ['d', S, 'ə'], 'je': ['ʒ', S, 'ə'], 'est': [S, 'ɛ'], 'et': [S, 'e'], 'les': ['l', S, 'e'], 'des': ['d', S, 'e'], 'un': [S, 'œ', '̃'],
          'tu': ['t', S, 'y'], 'pas': ['p', S, 'a'], 'la': ['l', S, 'a'], 'sur': ['s', S, 'y', 'ʁ'], 'mon': ['m', S, 'ɔ', '̃'], 'dans': ['d', S, 'ɑ', '̃']}

def word_ph(w):
    p = v.phonemize(w)[0]
    return [x for x in p if x != '-']

if __name__ == '__main__':
    for d in ('ph', 'sy', 'w', 'mo'): os.makedirs(f'{OUT}/{d}', exist_ok=True)
    man = {'ph': [], 'sy': [], 'w': [], 'mo': []}
    for g, (p, ls) in PH.items(): synth(p, f'{OUT}/ph/{key(g)}.mp3', ls); man['ph'].append(g)
    for s, p in SYL.items(): synth(p, f'{OUT}/sy/{key(s)}.mp3', 1.25); man['sy'].append(s)
    for w in WORDS: synth(word_ph(w), f'{OUT}/w/{key(w)}.mp3', 1.1); man['w'].append(w)
    for w in MOTS: synth(MOT_PH.get(w) or word_ph(w), f'{OUT}/mo/{key(w)}.mp3', 1.2); man['mo'].append(w)
    json.dump(man, open(f'{OUT}/manifest.json', 'w'), ensure_ascii=False)
    print({k: len(x) for k, x in man.items()})
