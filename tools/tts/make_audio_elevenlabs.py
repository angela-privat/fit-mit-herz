# Erzeugt alle Sprachaufnahmen der Trainerin mit ElevenLabs (Stimme „Jessica“, Modell Eleven v4).
#
# Voraussetzung: kostenloses ElevenLabs-Konto, API-Schlüssel (Rechte: Text zu Sprache, Stimmen lesen, Benutzer lesen)
# in der Datei %USERPROFILE%\fmh-tts\elevenlabs-key.txt  (liegt NICHT im Projekt und wird nie veröffentlicht).
# Start (im Ordner Fit-mit-Herz):  python tools\tts\make_audio_elevenlabs.py
# Unveränderte Sätze werden übersprungen (spart Zeichen im Gratis-Tarif: 10.000 Zeichen pro Monat).
# Hinweis Gratis-Tarif: nur private, nicht-kommerzielle Nutzung, Nennung von ElevenLabs erforderlich.
import hashlib, json, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "audio"
OUT.mkdir(exist_ok=True)
KEY = (Path.home() / "fmh-tts" / "elevenlabs-key.txt").read_text(encoding="utf-8-sig").strip()
TMP = Path.home() / "fmh-tts" / "tmp"
TMP.mkdir(exist_ok=True)
VOICE = "cgSgspJ2msm6clMCkdW9"  # Jessica – Playful, Bright, Warm
MODEL = "eleven_v4"
SETTINGS = {"stability": 0.35, "similarity_boost": 0.8, "style": 0.45, "use_speaker_boost": True}

# Regieanweisung je Art der Ansage
POWER = {"ready", "startPower", "sufPower", "halfPower", "tenPower", "side", "countdown", "sectionMain", "sectionCool", "done", "coachPower", "test"}
CALM = {"startCalm", "sufCalm", "halfCalm", "tenCalm", "coachCalm", "pause"}

def direction(cid):
    if cid.startswith("n_"):
        return "[cheerfully]"
    if cid.startswith("p_"):
        return "[warmly]"
    key = cid.split("_")[1]
    if key == "stop":
        return "[serious]"
    if key == "rest":
        return "[warmly]"
    if key in CALM:
        return "[calm]"
    if key in POWER:
        return "[excited]"
    return ""

def tts(text):
    body = json.dumps({"text": text, "model_id": MODEL, "language_code": "de", "voice_settings": SETTINGS}).encode("utf-8")
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
                                 data=body, headers={"xi-api-key": KEY, "Content-Type": "application/json"}, method="POST")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:200]
            if e.code in (429, 500, 502, 503) and attempt < 2:
                time.sleep(5 * (attempt + 1)); continue
            raise RuntimeError(f"{e.code} {msg}")

clips = json.loads(subprocess.run(["node", str(ROOT / "tools" / "tts" / "dump_clips.mjs")], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
manifest_path = OUT / "clips.json"
old = json.loads(manifest_path.read_text(encoding="utf-8")).get("hashes", {}) if manifest_path.exists() else {}
hashes, made, failed = dict(old), 0, []
for c in clips:
    text = f"{direction(c['id'])} {c['text']}".strip()
    h = hashlib.sha1(("el1|" + VOICE + "|" + text).encode("utf-8")).hexdigest()[:12]
    target = OUT / f"{c['id']}.ogg"
    if old.get(c["id"]) == h and target.exists():
        continue
    try:
        mp3 = TMP / f"{c['id']}.mp3"
        mp3.write_bytes(tts(text))
        af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,"
              "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-af", af, "-ac", "1",
                        "-c:a", "libopus", "-b:a", "40k", str(target)], check=True)
        mp3.unlink()
        hashes[c["id"]] = h
        made += 1
        print(f"[{made}] {c['id']}", flush=True)
    except Exception as e:  # bei Fehler bleibt die bisherige Aufnahme erhalten
        failed.append(c["id"])
        print("FEHLER", c["id"], e, flush=True)

ids = {c["id"] for c in clips}
manifest_path.write_text(json.dumps({"voice": "Jessica (ElevenLabs, Eleven v4)", "files": sorted(i for i in ids if (OUT / f"{i}.ogg").exists()),
                                     "hashes": hashes}, ensure_ascii=False, indent=0), encoding="utf-8")
size = sum(f.stat().st_size for f in OUT.glob("*.ogg"))
print(f"Fertig: {made} neu aufgenommen, {len(failed)} Fehler, zusammen {size/1024/1024:.1f} MB")
if failed:
    print("Fehlgeschlagen:", ", ".join(failed))
