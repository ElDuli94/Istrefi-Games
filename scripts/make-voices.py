#!/usr/bin/env python3
"""
Lager lydfiler med naturlige AI-stemmer (Microsoft Azure) for alt appen leser opp.

  python3 scripts/make-voices.py            # begge språk
  python3 scripts/make-voices.py no         # bare norsk

Nøkkelen (Ocp-Apim-Subscription-Key) settes enten i miljøvariabelen AZURE_SPEECH_KEY,
eller legges på av nettverksproxyen. Den lagres ALDRI i appen – appen får bare ferdige mp3-filer.

Flere setninger sendes i samme forespørsel med lange pauser mellom, og deles så opp på
pausene. Da holder vi oss under gratisnivåets grense (20 forespørsler i minuttet).
"""
import hashlib, json, os, ssl, subprocess, sys, time, urllib.request, wave, io, struct, shutil, tempfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGION = os.environ.get('AZURE_SPEECH_REGION', 'westeurope')
URL = f'https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1'
VOICES = {'no': ('nb-NO', os.environ.get('VOICE_NO', 'nb-NO-PernilleNeural')),
          'sq': ('sq-AL', os.environ.get('VOICE_SQ', 'sq-AL-AnilaNeural'))}
BATCH = 22
PAUSE_MS = 1500
RATE = '-4%'

def ffmpeg_exe():
    if os.environ.get('FFMPEG'): return os.environ['FFMPEG']
    if shutil.which('ffmpeg'): return 'ffmpeg'
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

def load_phrases():
    tmp = tempfile.mkdtemp()
    subprocess.run(['npx', 'tsc', 'src/voice/phrases.ts', '--outDir', tmp, '--module', 'commonjs', '--target', 'es2020',
                    '--moduleResolution', 'node', '--skipLibCheck', '--jsx', 'react-jsx'], cwd=ROOT, capture_output=True)
    out = subprocess.run(['node', '-e', f"const p=require('{tmp}/voice/phrases.js');console.log(JSON.stringify({{no:p.phrasesFor('no'),sq:p.phrasesFor('sq')}}))"],
                         cwd=ROOT, capture_output=True, text=True, check=True)
    return json.loads(out.stdout)

def norm(s): return ' '.join(s.strip().split()).lower()
def file_id(text): return hashlib.sha1(norm(text).encode()).hexdigest()[:12]

def ssml(lang, clips):
    loc, voice = VOICES[lang]
    parts = []
    for c in clips:
        t = escape(c['text'])
        parts.append(f'<say-as interpret-as="characters">{t}</say-as>' if c.get('letter') else t)
    body = f'<break time="{PAUSE_MS}ms"/>'.join(parts)
    return (f"<speak version='1.0' xml:lang='{loc}'><voice name='{voice}'><prosody rate='{RATE}'>"
            f"<break time='300ms'/>{body}<break time='300ms'/></prosody></voice></speak>")

CTX = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt') if os.path.exists('/root/.ccr/ca-bundle.crt') else ssl.create_default_context()

def synth(lang, clips):
    headers = {'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm', 'User-Agent': 'istrefi-games-voices'}
    if os.environ.get('AZURE_SPEECH_KEY'): headers['Ocp-Apim-Subscription-Key'] = os.environ['AZURE_SPEECH_KEY']
    req = urllib.request.Request(URL, data=ssml(lang, clips).encode('utf-8'), headers=headers, method='POST')
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, context=CTX, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(10 * (attempt + 1)); continue
            raise SystemExit(f'Azure svarte {e.code}: {e.read()[:300]!r}')
    raise SystemExit('For mange forsøk (429)')

def split_wav(data, expected):
    w = wave.open(io.BytesIO(data))
    sr, raw = w.getframerate(), w.readframes(w.getnframes())
    samples = struct.unpack(f'<{len(raw)//2}h', raw)
    fl = sr // 100  # 10 ms
    rms = []
    for i in range(0, len(samples) - fl, fl):
        chunk = samples[i:i + fl]
        rms.append((sum(s * s for s in chunk) / fl) ** 0.5)
    silent = [v < 250 for v in rms]
    # Finn tale-biter adskilt av pauser på minst 900 ms
    segs, start, run = [], None, 0
    for i, s in enumerate(silent):
        if not s:
            if start is None: start = i
            run = 0
        else:
            run += 1
            if start is not None and run >= 90:
                segs.append((start, i - run + 1)); start = None
    if start is not None: segs.append((start, len(silent)))
    if len(segs) != expected: return None
    pad = 8  # 80 ms
    return [raw[max(0, a - pad) * fl * 2: min(len(silent), b + pad) * fl * 2] for a, b in segs], sr

def encode(pcm, sr, path):
    subprocess.run([ffmpeg_exe(), '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(sr), '-ac', '1', '-i', 'pipe:0',
                    '-codec:a', 'libmp3lame', '-b:a', '40k', path], input=pcm, check=True)

def main():
    langs = sys.argv[1:] or ['no', 'sq']
    phrases = load_phrases()
    manifest = {}
    for lang in ['no', 'sq']:
        idx_path = os.path.join(ROOT, 'public', 'voice', lang, 'index.json')
        manifest[lang] = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    for lang in langs:
        out_dir = os.path.join(ROOT, 'public', 'voice', lang)
        os.makedirs(out_dir, exist_ok=True)
        todo = [c for c in phrases[lang] if norm(c['text']) not in manifest[lang]]
        print(f'[{lang}] {len(todo)} nye klipp av {len(phrases[lang])}')
        i = 0
        while i < len(todo):
            batch = todo[i:i + BATCH]
            res = split_wav(synth(lang, batch), len(batch))
            time.sleep(3.2)
            if res is None:
                # Klarte ikke å dele opp – ta dem én og én
                res_list = []
                for c in batch:
                    one = split_wav(synth(lang, [c]), 1)
                    time.sleep(3.2)
                    if one: res_list.append((c, one[0][0], one[1]))
                for c, pcm, sr in res_list:
                    fid = file_id(c['text']); encode(pcm, sr, os.path.join(out_dir, f'{fid}.mp3')); manifest[lang][norm(c['text'])] = fid
            else:
                pcms, sr = res
                for c, pcm in zip(batch, pcms):
                    fid = file_id(c['text']); encode(pcm, sr, os.path.join(out_dir, f'{fid}.mp3')); manifest[lang][norm(c['text'])] = fid
            i += BATCH
            json.dump(manifest[lang], open(os.path.join(out_dir, 'index.json'), 'w'), ensure_ascii=False, indent=0)
            print(f'[{lang}] {min(i, len(todo))}/{len(todo)}')
    with open(os.path.join(ROOT, 'src', 'voice', 'manifest.ts'), 'w') as f:
        f.write('// Generert av scripts/make-voices.py – ikke rediger.\nimport type { Lang } from \'../i18n\';\n')
        f.write('export const VOICE_FILES: Partial<Record<Lang, Record<string, string>>> = ' + json.dumps(manifest, ensure_ascii=False) + ';\n')
    print('Ferdig! Manifest skrevet til src/voice/manifest.ts')

if __name__ == '__main__':
    main()
