"""Package generated furniture cells and master field recordings for offline play."""
import json, pathlib, subprocess, wave, sys
import numpy as np
from scipy.signal import butter, sosfiltfilt
from PIL import Image
import imageio_ffmpeg

ROOT=pathlib.Path(__file__).resolve().parent.parent
art=ROOT/'public/assets/art'
names=['bed','dining_table','chair','bookcase','fireplace','alchemy_table','anvil','forge','counter','rug','wardrobe','kitchen_shelf','round_table','writing_desk','bath','clock']
subprocess.run([sys.executable,str(ROOT/'tools/pack-furniture.py')],check=True)
subprocess.run([sys.executable,str(ROOT/'tools/pack-flora.py')],check=True)

ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();rate=22050;audio=ROOT/'public/assets/audio'
def decode(path,start=0,duration=52):
 cmd=[ffmpeg,'-v','error','-ss',str(start),'-i',str(path),'-t',str(duration),'-ac','2','-ar',str(rate),'-f','f32le','pipe:1']
 return np.frombuffer(subprocess.check_output(cmd),dtype='<f4').reshape(-1,2).copy()
def filtered(x,highpass,lowpass):
 return sosfiltfilt(butter(3,[highpass,lowpass],btype='bandpass',fs=rate,output='sos'),x,axis=0)
def write(path,x,loop=False,rms=.045):
 x=x-x.mean(axis=0)
 if loop:
  n=3*rate;a=np.linspace(0,1,n)[:,None]
  x=np.concatenate([x[n:-n],x[-n:]*(1-a)+x[:n]*a])
 else:
  n=min(int(.015*rate),len(x)//8);x[:n]*=np.linspace(0,1,n)[:,None];x[-n:]*=np.linspace(1,0,n)[:,None]
 scale=min(rms/max(np.sqrt(np.mean(x*x)),1e-7),.55/max(np.abs(x).max(),1e-7));x*=scale
 path.parent.mkdir(parents=True,exist_ok=True)
 with wave.open(str(path),'wb')as f:
  f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate);f.writeframes(np.round(x*32767).astype('<i2').tobytes())
 return {'file':str(path.relative_to(ROOT/'public')),'seconds':round(len(x)/rate,2),'peak':round(float(abs(x).max()),4),'rms':round(float(np.sqrt(np.mean(x*x))),4),'seamDelta':round(float(abs(x[-1]-x[0]).max()),5)}
loops=[]
for name,original,start,low,rms in [('forest','birds',20,6500,.045),('water','river',35,3300,.05),('wind','wind',15,1600,.035),('frost','wind',65,1300,.032),('ruins','wind',105,750,.028),('spire','wind',145,620,.032),('hearth','birds',85,750,.022)]:
 x=filtered(decode(ROOT/'.audio-sources'/(original+'.wav'),start),90,low)
 loops.append(write(audio/'ambience'/(name+'.wav'),x,True,rms))
fxSource=pathlib.Path('E:/Roguelike Opus 55/src/assets/audio/sfx')
effects=['swing','bow','dash','spin','chest_open','door','hit','ice_burst','thunder','player_hurt','boss_death','enemy_death']
for name in effects:
 x=filtered(decode(fxSource/(name+'.mp3'),duration=6),50,8000)
 write(audio/'foley'/(name+'.wav'),x,rms=.09 if name=='thunder' else .12)
manifest={'sampleRate':rate,'channels':2,'format':'PCM16 WAV','instrumentalMusic':False,'voices':(audio/'voice/voice-manifest.json').exists(),'ambience':[x['file'].split('/')[-1][:-4] for x in loops],'mastering':{'highpassHz':90,'overlapSeconds':3,'hardClipping':False},'recordingSource':{'title':'Park ambiences','author':'Thimras','license':'CC0','url':'https://opengameart.org/content/park-ambiences','files':['park_ambience_birds.wav','park_ambience_river.wav','park_ambience_wind.wav']},'measurements':loops,'foley':sorted(p.stem for p in (audio/'foley').glob('*.wav'))}
previous=json.loads((audio/'sound-manifest.json').read_text(encoding='utf-8')) if (audio/'sound-manifest.json').exists() else {}
if 'voicePerformances' in previous: manifest['voicePerformances']=previous['voicePerformances']
(audio/'sound-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
furniture=json.loads((ROOT/'docs/crisp-art.json').read_text(encoding='utf-8'))['assets'][0]
(ROOT/'docs/furniture-art.json').write_text(json.dumps({'source':'Built-in imagegen tool','sourceImage':furniture['source'],'referenceImage':furniture['reference'],'packedImage':'public/assets/pack/furniture.png','prompt':furniture['prompt'],'frames':names,'pixelDensity':2,'packaging':'Opaque component crop, nearest-neighbor sizing at twice the world resolution, binary alpha and half-scale runtime sprites; original generation retained.'},indent=2),encoding='utf-8')
print('Packed 16 reusable furniture sprites; mastered 7 nature loops and 12 source Foley effects.')
subprocess.run([sys.executable,str(ROOT/'tools/master-quiet-ambience.py')],check=True)
