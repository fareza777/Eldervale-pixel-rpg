"""Quiet masters of generated nature beds, with clean loop seams and no added noise/music."""
from pathlib import Path
import json,shutil,subprocess,wave
import numpy as np
from scipy.signal import butter,sosfiltfilt
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1];RATE=22050
TRACKS=[('forest','still-air-v2',1100,.0055),('wind','still-air-v2',1000,.005),
 ('water','still-water-v2',1700,.008),('frost','still-air-v2',800,.004),
 ('ruins','stone-air-v2',750,.0035),('spire','stone-air-v2',650,.003),('hearth','stone-air-v2',550,.0028)]
backup=ROOT/'.audio-sources/ambience-v1.5.1';backup.mkdir(exist_ok=True)
measurements=[]
for name,source,lowpass,rms in TRACKS:
 out=ROOT/'public/assets/audio/ambience'/(name+'.wav')
 if not (backup/out.name).exists():shutil.copy2(out,backup/out.name)
 raw=subprocess.check_output([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(ROOT/'.audio-sources'/(source+'.mp3')),'-ac','2','-ar',str(RATE),'-f','f32le','pipe:1'])
 x=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(np.float64)
 x=sosfiltfilt(butter(4,[85,lowpass],btype='bandpass',fs=RATE,output='sos'),x,axis=0);x-=x.mean(axis=0)
 # Long, complementary crossfade plus a closed waveform seam prevent loop clicks.
 n=3*RATE;a=np.linspace(0,1,n)[:,None];x=np.concatenate([x[n:-n],x[-n:]*(1-a)+x[:n]*a])
 x*=min(rms/max(float(np.sqrt(np.mean(x*x))),1e-8),.055/max(float(abs(x).max()),1e-8))
 tail=int(RATE*.008);x[-tail:]+=np.linspace(0,1,tail)[:,None]*(x[0]-x[-1])
 data=np.round(x*32767).astype('<i2')
 with wave.open(str(out),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(data.tobytes())
 measurements.append({'file':'assets/audio/ambience/'+name+'.wav','source':source+'.mp3','seconds':round(len(x)/RATE,2),
  'highpassHz':85,'lowpassHz':lowpass,'peak':round(float(abs(x).max()),6),'rms':round(float(np.sqrt(np.mean(x*x))),6),'seamDelta':round(float(abs(x[-1]-x[0]).max()),6)})
manifestFile=ROOT/'public/assets/audio/sound-manifest.json';manifest=json.loads(manifestFile.read_text(encoding='utf-8'))
manifest['previousRecordingSource']=manifest.get('previousRecordingSource',manifest['recordingSource'])
manifest.update({'ambience':[t[0] for t in TRACKS],'mastering':{'highpassHz':85,'overlapSeconds':3,'hardClipping':False,
 'profile':'Nearly still sheltered air, quiet stone spaces and distant water; no birds, crackle or added noise.',
 'combatGain':.22,'combatAttackSeconds':.18,'combatRecoverySeconds':.9},'measurements':measurements,
 'recordingSource':{'title':'Still spaces — generated nature effects','author':'ElevenLabs Sound Effects v2','license':'Generated with the user’s ElevenLabs account; account terms apply.',
 'url':'https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert','files':[s+'.mp3' for s in dict.fromkeys(t[1] for t in TRACKS)]}})
manifestFile.write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(ROOT/'docs/quiet-ambience.json').write_text(json.dumps({'music':False,'instruments':False,'birdRecordingUsed':False,'recordingSource':manifest['recordingSource'],'mastering':manifest['mastering'],'measurements':measurements},indent=2),encoding='utf-8')
assert all(m['peak']<.056 and m['rms']<=.0081 and m['seamDelta']<.0001 for m in measurements)
print('Seven near-silent nature masters exported. Maximum RMS .008, no clipping, closed loop seams. Original loops preserved.')
