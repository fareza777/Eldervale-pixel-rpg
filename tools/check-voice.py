"""Decode every shipped voice clip and measure its duration and sample headroom."""
from pathlib import Path
import array
import json
import math
import subprocess
import imageio_ffmpeg

root = Path(__file__).resolve().parents[1]
voice_dir = root / 'public/assets/audio/voice'
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
clips = []
for file in sorted(voice_dir.glob('*.mp3')):
    result = subprocess.run([
        ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', str(file),
        '-ac', '1', '-ar', '22050', '-f', 'f32le', 'pipe:1'
    ], capture_output=True, check=True)
    samples = array.array('f')
    samples.frombytes(result.stdout)
    assert samples and all(math.isfinite(x) for x in samples), file.name
    duration = len(samples) / 22050
    peak = max(abs(x) for x in samples)
    assert .3 <= duration <= 40, (file.name, duration)
    assert .01 <= peak < .98, (file.name, peak)
    if file.stem.startswith('skill_'):
        assert duration < 4, (file.name, duration)
    clips.append({'id': file.stem, 'seconds': round(duration, 3),
                  'peakDbFS': round(20 * math.log10(peak), 2)})
assert len(clips) == 75, len(clips)
report = {'decoded': len(clips), 'totalSeconds': round(sum(c['seconds'] for c in clips), 2),
          'maxPeakDbFS': max(c['peakDbFS'] for c in clips), 'clips': clips}
(root / 'test-results').mkdir(exist_ok=True)
(root / 'test-results/voice-report.json').write_text(json.dumps(report, indent=2) + '\n')
print(f"PASS {len(clips)} offline voice clips decode; maximum peak {report['maxPeakDbFS']} dBFS")
print(f"PASS all skill calls are shorter than four seconds; total narration {report['totalSeconds']} seconds")
