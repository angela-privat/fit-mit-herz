# Erzeugt alle Sprachaufnahmen der Trainerin (Stimme: Piper „Kerstin“, Lizenz CC0).
#
# Voraussetzung (einmalig, außerhalb von OneDrive):
#   python -m venv %USERPROFILE%\fmh-tts\venv
#   %USERPROFILE%\fmh-tts\venv\Scripts\python -m pip install piper-tts
#   cd %USERPROFILE%\fmh-tts\voices && ..\venv\Scripts\python -m piper.download_voices de_DE-kerstin-low
# Start (im Ordner Fit-mit-Herz):
#   %USERPROFILE%\fmh-tts\venv\Scripts\python tools\tts\make_audio.py
# Erzeugt audio\*.ogg und audio\clips.json. Unveränderte Sätze werden übersprungen.
import hashlib, json, subprocess, sys, wave
from pathlib import Path
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "audio"
OUT.mkdir(exist_ok=True)
MODEL = Path.home() / "fmh-tts" / "voices" / "de_DE-kerstin-low.onnx"
TMP = Path.home() / "fmh-tts" / "tmp"
TMP.mkdir(exist_ok=True)

clips = json.loads(subprocess.run(["node", str(ROOT / "tools" / "tts" / "dump_clips.mjs")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
old = {}
manifest_path = OUT / "clips.json"
if manifest_path.exists():
    old = json.loads(manifest_path.read_text(encoding="utf-8")).get("hashes", {})

voice = PiperVoice.load(str(MODEL))
cfg = SynthesisConfig(length_scale=1.02, noise_scale=0.6, noise_w_scale=0.8)
hashes, made = {}, 0
for c in clips:
    h = hashlib.sha1(("v1|" + c["text"]).encode("utf-8")).hexdigest()[:12]
    hashes[c["id"]] = h
    target = OUT / f"{c['id']}.ogg"
    if old.get(c["id"]) == h and target.exists():
        continue
    wav = TMP / f"{c['id']}.wav"
    with wave.open(str(wav), "wb") as w:
        voice.synthesize_wav(c["text"], w, syn_config=cfg)
    # Stille am Anfang/Ende kürzen, leicht lauter, als Opus (klein, gute Qualität)
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
          "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,"
          "loudnorm=I=-16:TP=-1.5:LRA=11")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", af, "-ar", "48000", "-ac", "1",
                    "-c:a", "libopus", "-b:a", "28k", str(target)], check=True)
    wav.unlink()
    made += 1
    print("aufgenommen:", c["id"], "–", c["text"][:60])

# verwaiste Dateien entfernen
ids = {c["id"] for c in clips}
for f in OUT.glob("*.ogg"):
    if f.stem not in ids:
        f.unlink()
manifest_path.write_text(json.dumps({"voice": "Kerstin (Piper, CC0)", "files": sorted(ids), "hashes": hashes}, ensure_ascii=False, indent=0), encoding="utf-8")
size = sum(f.stat().st_size for f in OUT.glob("*.ogg"))
print(f"Fertig: {len(ids)} Aufnahmen ({made} neu), zusammen {size/1024/1024:.1f} MB")
