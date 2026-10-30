import json,pathlib,subprocess,shutil,re
import imageio_ffmpeg
ROOT=pathlib.Path(__file__).resolve().parent
captures=ROOT/'store-v1/captures';pub=ROOT/'remotion/public'
ff=imageio_ffmpeg.get_ffmpeg_exe()
log=json.loads((captures/'capture-log.json').read_text())
manifest=[]
for clip in log['clips']:
 target=pub/'clips'/(clip['name']+'.mp4')
 result=subprocess.run([ff,'-v','error','-y','-ss',str(clip['from']+.25),'-i',str(captures/'gameplay-session.webm'),'-t',str(max(1,clip['duration']-.5)),'-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',str(target)],capture_output=True)
 if result.returncode:raise SystemExit(result.stderr.decode())
 manifest.append({**clip,'sourceOffsetSeconds':clip['from']+.25,'outputDurationSeconds':max(1,clip['duration']-.5),'file':target.name})
 print('Prepared '+clip['name'],flush=True)
for p in captures.glob('*.png'):shutil.copy2(p,pub/'captures'/p.name)
(ROOT/'store-v1/source/footage-manifest.json').write_text(json.dumps(manifest,indent=2))
for p in (pub/'audio').glob('*.mp3'):
 r=subprocess.run([ff,'-hide_banner','-i',str(p),'-f','null','-'],capture_output=True)
 m=re.search(r'Duration: ([\d:.]+)',r.stderr.decode())
 print(p.name,m.group(1) if m else 'unknown')
