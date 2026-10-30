"""Generate seven restrained English narration cues. Never writes credentials."""
import json, os, pathlib, urllib.request, urllib.error, subprocess
import imageio_ffmpeg
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'marketing/remotion/public/audio'
OUT.mkdir(parents=True,exist_ok=True)
key=os.environ.get('ELEVENLABS_API_KEY')
if not key: raise SystemExit('ELEVENLABS_API_KEY unavailable.')
cast=json.loads((ROOT/'src/story.json').read_text())['cast']['narrator']
lines=[
 ('01-hook','Tomorrow... will you remember her?'),
 ('02-sister','The world forgot your sister. You will not.'),
 ('03-world','Follow forgotten roads. Find the light they left behind.'),
 ('04-combat','Fight for every memory.'),
 ('05-build','Shape your strength. Uncover what the dawn erased.'),
 ('06-choice','And decide what the next dawn will cost.'),
 ('07-title','Eldervale. The Hollow Sun.')
]
manifest={'provider':'ElevenLabs','voice':cast['name'],'voice_id':cast['id'],'model':'eleven_multilingual_v2','language':'en','music':False,'clips':[]}
for name,text in lines:
 target=OUT/(name+'.mp3')
 if not target.exists():
  req=urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/'+cast['id']+'?output_format=mp3_44100_128',data=json.dumps({'text':text,'model_id':'eleven_multilingual_v2','voice_settings':{**cast['settings'],'speed':.98},'seed':4128}).encode(),headers={'xi-api-key':key,'Content-Type':'application/json','Accept':'audio/mpeg'})
  try:
   with urllib.request.urlopen(req,timeout=120) as response: raw=response.read()
  except urllib.error.HTTPError as e: raise SystemExit('ElevenLabs HTTP '+str(e.code)) from None
  source=OUT/(name+'.source.mp3');source.write_bytes(raw)
  result=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-i',str(source),'-af','highpass=f=65,loudnorm=I=-17:TP=-2:LRA=7','-ar','48000','-ac','1','-b:a','192k',str(target)],capture_output=True)
  if result.returncode:raise SystemExit('Audio mastering failed')
  source.unlink()
 manifest['clips'].append({'id':name,'text':text,'file':str(target.relative_to(ROOT)).replace('\\','/'),'bytes':target.stat().st_size})
 print('Ready '+name,flush=True)
(ROOT/'marketing/store-v1/source/voice-script.json').write_text(json.dumps(manifest,indent=2))
