"""Reusable nature textures and non-tonal Foley. No instruments, voices or melodies."""
from pathlib import Path
import json
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1] / "public/assets/audio"
RATE = 32000
rng = np.random.default_rng(55061)


def noise(n, low=30, high=10000, slope=0):
    # Aperiodic broadband energy shaped in the frequency domain, never pitched.
    x = rng.normal(0, 1, n)
    freqs = np.fft.rfftfreq(n, 1 / RATE)
    shape = (freqs / (freqs + low)) ** 2 / (1 + (freqs / high) ** 4)
    shape *= np.maximum(freqs, low) ** (-slope / 2)
    shaped = np.fft.irfft(np.fft.rfft(x) * shape, n=n)
    return shaped / max(np.std(shaped), 1e-9)


def motion(n, spacing, lower=.25, upper=1):
    knots = max(3, int(n / RATE / spacing) + 2)
    y = np.interp(np.arange(n), np.linspace(0, n - 1, knots), rng.uniform(lower, upper, knots))
    kernel = np.ones(321) / 321
    return np.convolve(y, kernel, "same")


def bursts(n, count, duration, low, high, strength):
    out = np.zeros(n)
    length = int(duration * RATE)
    for _ in range(count):
        start = int(rng.integers(0, max(1, n - length)))
        t = np.arange(length) / RATE
        env = (1 - np.exp(-t / .004)) * np.exp(-t / max(.008, duration / 5))
        out[start:start + length] += noise(length, low, high) * env * strength * rng.uniform(.4, 1)
    return out


def write(name, left, right, category, peak):
    x = np.stack([left, right], axis=1)
    x -= np.mean(x, axis=0)
    if category == "ambience":
        # Ease each tail into the first 80 ms for a click-free continuous loop.
        fade = int(.08 * RATE)
        a = np.linspace(0, 1, fade)[:, None]
        x[-fade:] = x[-fade:] * (1 - a) + x[:fade] * a
        x[-1] = x[0]
    else:
        fade = min(200, len(x) // 5)
        x[:fade] *= np.linspace(0, 1, fade)[:, None]
        x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    x *= peak / max(np.max(np.abs(x)), 1e-9)
    data = np.round(np.clip(x, -1, 1) * 32767).astype("<i2")
    folder = ROOT / category
    folder.mkdir(parents=True, exist_ok=True)
    with wave.open(str(folder / (name + ".wav")), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(data.tobytes())


n = RATE * 20
for name in ["wind", "forest", "water", "frost", "ruins", "spire"]:
    channels = []
    for channel in range(2):
        gust = noise(n, 30, 1300, .7) * motion(n, 2.4, .3, .85)
        if name == "wind":
            track = gust * .6 + noise(n, 500, 6000, .3) * motion(n, .8, .01, .06)
        elif name == "forest":
            leaves = noise(n, 1800, 10000) * motion(n, .3, .03, .18)
            track = gust * .35 + leaves + bursts(n, 24, .18, 2300, 10000, .13)
        elif name == "water":
            track = noise(n, 90, 6500, .4) * motion(n, 1.3, .3, .5)
            track += bursts(n, 80, .13, 400, 9000, .15) + gust * .14
        elif name == "frost":
            track = gust * .7 + noise(n, 1400, 10000, .2) * motion(n, 1, .01, .08)
            track += bursts(n, 12, .07, 2500, 14000, .08)
        elif name == "ruins":
            track = gust * .19 + bursts(n, 36, .24, 200, 7500, .11)
        else:
            track = noise(n, 18, 650, 1) * motion(n, 3, .3, .6) + gust * .28
            track += noise(n, 2500, 12000) * motion(n, .7, .005, .018)
        channels.append(track)
    # Correlated wind bed with distinct side detail keeps a stable stereo image.
    center = (channels[0] + channels[1]) * .25
    write(name, channels[0] * .75 + center, channels[1] * .75 + center, "ambience", .32)

durations = {
    "swing": .32, "bow": .22, "cast": .48, "ice_burst": .72, "dash": .35,
    "hit": .24, "enemy_death": .55, "boss_death": 1.8, "potion": .6,
    "campfire": 1.2, "coin": .18, "door": .4, "ui_page": .25, "chest_open": .65,
}
for name, duration in durations.items():
    size = int(duration * RATE)
    t = np.arange(size) / RATE
    if name in ["swing", "dash", "cast"]:
        env = np.sin(np.pi * t / duration) ** 2 * np.exp(-t / duration)
        sample = noise(size, 180 if name == "cast" else 550, 10000, .2) * env
    elif name == "bow":
        sample = noise(size, 600, 7000) * np.exp(-t / .035) + bursts(size, 2, .04, 1800, 9500, .3)
    elif name in ["ice_burst", "enemy_death", "boss_death"]:
        sample = noise(size, 30, 1600, .7) * np.exp(-t / (duration / 4))
        sample += bursts(size, 8 if name == "boss_death" else 4, .09, 2200, 12000, .45)
    elif name in ["potion", "campfire"]:
        sample = bursts(size, 18, .07, 120 if name == "potion" else 1500, 9500, .8)
        sample += noise(size, 200, 6000, .4) * .09
    elif name in ["door", "chest_open"]:
        sample = noise(size, 70, 1800, .6) * np.exp(-t / .12)
        sample += bursts(size, 4, .055, 200, 6000, .3)
    elif name == "ui_page":
        sample = noise(size, 1900, 12000) * np.sin(np.pi * t / duration) ** 2
    elif name == "coin":
        sample = bursts(size, 3, .025, 1600, 12000, 1)
    else:
        sample = noise(size, 25, 1500, .4) * np.exp(-t / .04)
        sample += noise(size, 2000, 9500) * np.exp(-t / .012) * .3
    right = np.roll(sample, 23) * .95
    write(name, sample, right, "foley", .65 if name != "campfire" else .4)

(ROOT / "sound-manifest.json").write_text(json.dumps({
    "sampleRate": RATE, "channels": 2, "format": "PCM16 WAV",
    "source": "Deterministic broadband noise, stochastic envelopes and physical Foley textures.",
    "instrumentalMusic": False, "voices": False,
    "ambience": ["wind", "forest", "water", "frost", "ruins", "spire"],
    "foley": list(durations),
}, indent=2), encoding="utf-8")
print("Created 6 seamless nature loops and 14 Foley effects.")
