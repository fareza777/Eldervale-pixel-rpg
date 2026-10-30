"""Generate three reusable nature-only sound beds; credentials stay on stdin/in memory."""
import argparse,json,os,sys,urllib.request,urllib.error
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PROMPTS={
 'still-air-v2':'Near-silent sheltered stone courtyard at dusk. Very distant gentle breeze moving through open space. Calm, spacious, smooth natural air, clean soft background without events. No birds, insects, animals, voices, leaves, rustling, crackling, static, wind distortion, mechanical hum, drones, tones, melody, music or instruments. Quiet fantasy game atmosphere, seamless loop.',
 'stone-air-v2':'Near-silent empty ancient stone passage. Subtle distant natural air through a far doorway. Calm, warm, spacious, nearly still. Clean smooth atmosphere without events. No resonant tones, drones, music, instruments, voices, creatures, dripping, fire, crackling, rattling, static or harsh wind. Restrained fantasy game atmosphere, seamless loop.',
 'still-water-v2':'Quiet distant water gently flowing beside a sheltered lake. Very soft smooth water wash from far away. Peaceful, spacious, nearly silent, natural water only. Clean background without sharp details. No splashes, close bubbling, rain, birds, insects, voices, crackling, rustling, static, roaring, drones, tones, music or instruments. Quiet fantasy exploration, seamless loop.'
}
parser=argparse.ArgumentParser();parser.add_argument('--key-stdin',action='store_true');args=parser.parse_args()
key=os.environ.get('ELEVENLABS_API_KEY')
if not key and args.key_stdin:
 print('Awaiting asset-generation credential on stdin (never saved).',flush=True);key=sys.stdin.readline().strip()
if not key:raise SystemExit('Credential unavailable.')
destination=ROOT/'.audio-sources';destination.mkdir(exist_ok=True)
records=[]
for name,prompt in PROMPTS.items():
 path=destination/(name+'.mp3')
 if not path.exists():
  data={'text':prompt,'duration_seconds':20,'loop':True,'prompt_influence':.65,'model_id':'eleven_text_to_sound_v2'}
  request=urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128',data=json.dumps(data).encode(),headers={'xi-api-key':key,'Content-Type':'application/json','Accept':'audio/mpeg'})
  try:
   with urllib.request.urlopen(request,timeout=120) as response:
    audio=response.read();cost=response.headers.get('character-cost')
   if len(audio)<10000:raise SystemExit('Generated asset is unexpectedly empty.')
   path.write_bytes(audio);print('Generated '+name+'; character-cost='+str(cost),flush=True)
  except urllib.error.HTTPError as error:
   try:detail=json.loads(error.read()).get('detail',{})
   except Exception:detail={}
   status=detail.get('status','request_failed') if isinstance(detail,dict) else 'request_failed'
   status=''.join(c for c in str(status) if c.isalnum() or c=='_')[:70]
   raise SystemExit('ElevenLabs HTTP '+str(error.code)+': '+status+'; no credentials or response bodies logged.') from None
 records.append({'name':name,'prompt':prompt,'source':'.audio-sources/'+path.name,'secondsRequested':20,'loop':True})
del key
(ROOT/'docs/ambient-generation-v2.json').write_text(json.dumps({'provider':'ElevenLabs','model':'eleven_text_to_sound_v2','reference':'https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert','music':False,'instruments':False,'birds':False,'assets':records},indent=2),encoding='utf-8')
print('Generated nature-only beds ready for quiet mastering.',flush=True)
