"""Master calm field recordings; keep Foley and spoken performances untouched."""
from pathlib import Path
import json, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfiltfilt
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
RATE=22050
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
TRACKS=[('forest','wind',20,1200,.017),('water','river',70,2400,.022),
        ('wind','wind',55,1500,.016),('frost','wind',95,1050,.013),
        ('ruins','wind',135,850,.010),('spire','wind',170,650,.009),
        ('hearth','wind',35,500,.007)]
measurements=[]
for name,source,start,lowpass,rms in TRACKS:
    raw=subprocess.check_output([FFMPEG,'-v','error','-ss',str(start),'-i',str(ROOT/'.audio-sources'/(source+'.wav')),
        '-t','52','-ac','2','-ar',str(RATE),'-f','f32le','pipe:1'])
    x=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(np.float64)
    x=sosfiltfilt(butter(4,[65,lowpass],btype='bandpass',fs=RATE,output='sos'),x,axis=0)
    x-=x.mean(axis=0)
    # Six-second field-recording crossfade: no repeated chirp chorus or hiss layer.
    n=6*RATE;a=np.linspace(0,1,n)[:,None]
    x=np.concatenate([x[n:-n],x[-n:]*(1-a)+x[:n]*a])
    x*=min(rms/max(float(np.sqrt(np.mean(x*x))),1e-8),.22/max(float(abs(x).max()),1e-8))
    # Close the last 5 ms onto the start to remove any loop discontinuity.
    tail=int(RATE*.005);x[-tail:]+=np.linspace(0,1,tail)[:,None]*(x[0]-x[-1])
    data=np.round(x*32767).astype('<i2')
    file=ROOT/'public/assets/audio/ambience'/(name+'.wav')
    with wave.open(str(file),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(data.tobytes())
    measurements.append({'file':'assets/audio/ambience/'+name+'.wav','source':source+'.wav','startSeconds':start,
        'seconds':round(len(x)/RATE,2),'highpassHz':65,'lowpassHz':lowpass,
        'peak':round(float(abs(x).max()),5),'rms':round(float(np.sqrt(np.mean(x*x))),5),
        'seamDelta':round(float(abs(x[-1]-x[0]).max()),6)})
manifestFile=ROOT/'public/assets/audio/sound-manifest.json'
manifest=json.loads(manifestFile.read_text(encoding='utf-8'))
manifest.update({'ambience':[x[0] for x in TRACKS],'mastering':{'highpassHz':65,'overlapSeconds':6,'hardClipping':False,
    'profile':'Quiet wind, sheltered air and water; no bird-recording layer'},'measurements':measurements})
manifest['recordingSource']['files']=['park_ambience_river.wav','park_ambience_wind.wav']
manifestFile.write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(ROOT/'docs/quiet-ambience.json').write_text(json.dumps({'music':False,'instruments':False,
    'birdRecordingUsed':False,'recordingSource':manifest['recordingSource'],'measurements':measurements},indent=2),encoding='utf-8')
assert all(x['peak']<.23 and x['rms']<=.0221 and x['seamDelta']<.0001 for x in measurements)
print('Mastered 7 quiet nature loops; no bird recording, clipping or loop clicks. Voices and Foley preserved.')
