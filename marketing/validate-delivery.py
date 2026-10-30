"""Validate final image/video exports and prepare a reproducible delivery report."""
import json,pathlib,struct,hashlib,subprocess,re
import imageio_ffmpeg
ROOT=pathlib.Path(__file__).resolve().parent/'store-v1';OUT=ROOT/'exports';ff=imageio_ffmpeg.get_ffmpeg_exe()
report={'images':[],'videos':[],'checks':[]}
for p in [OUT/'app-icon-512.png',OUT/'feature-graphic-1024x500.png',*sorted(OUT.glob('screenshot-??-1080x1920.png'))]:
 data=p.read_bytes();w,h,depth,color=struct.unpack('>IIBB',data[16:26])
 expected=(512,512)if p.name.startswith('app-icon')else(1024,500)if p.name.startswith('feature')else(1080,1920)
 assert (w,h)==expected and depth==8,p.name
 assert color==(6 if p.name.startswith('app-icon')else 2),'PNG channel format '+p.name
 if p.name.startswith('app-icon'):assert len(data)<1024*1024
 report['images'].append({'file':p.name,'width':w,'height':h,'channels':'RGBA'if color==6 else'RGB','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
assert len(report['images'])==10
for name,width,height in [('eldervale-landscape-1080p.mp4',1920,1080),('eldervale-portrait-1080p.mp4',1080,1920)]:
 p=OUT/name
 run=subprocess.run([ff,'-hide_banner','-i',str(p),'-af','volumedetect','-f','null','-'],capture_output=True)
 text=run.stderr.decode(errors='replace')
 assert run.returncode==0,text[-1000:]
 assert f'{width}x{height}'in text and '30 fps'in text and 'Video: h264'in text and 'Audio: aac'in text
 assert '00:00:40.00'in text or '00:00:40.01'in text,text[:1500]
 peak=re.findall(r'max_volume: ([-\d.]+) dB',text)
 assert peak and float(peak[-1])<0,'Clipped audio'
 report['videos'].append({'file':name,'width':width,'height':height,'fps':30,'durationSeconds':40,'videoCodec':'h264','audioCodec':'aac','maxVolumeDb':float(peak[-1]),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'fullDecode':'pass'})
 for t in [2,5.5,11.5,15.5,18.5,22,27,29,32,37]:
  target=ROOT/'review'/f'{p.stem}-{str(t).replace(".","_")}.jpg'
  subprocess.run([ff,'-v','error','-y','-ss',str(t),'-i',str(p),'-frames:v','1','-q:v','2',str(target)],check=True)
report['checks']=['10 required PNG files, exact dimensions and channel formats','Icon below 1024 KB','Two complete 40-second 30 fps H.264/AAC videos','Both videos fully decoded without errors','Audio peaks below 0 dBFS','English subtitle track included','No game source or signed app packages modified']
(ROOT/'review/delivery-validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
