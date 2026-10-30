"""Build offline ElevenLabs voice assets; credentials stay in process memory only.

Use ELEVENLABS_API_KEY, hidden getpass input, or --key-stdin. Existing clips are
reused by their content hash, so a normal rerun never regenerates billed assets.
"""
import argparse, getpass, hashlib, json, os, pathlib, subprocess, sys, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument('--inventory', action='store_true')
parser.add_argument('--key-stdin', action='store_true')
parser.add_argument('--only', default='')
args = parser.parse_args()
key = os.environ.get('ELEVENLABS_API_KEY')
if not key:
    if args.key_stdin:
        print('Awaiting ElevenLabs credential on standard input (not saved).', flush=True)
        key = sys.stdin.readline().strip()
    else:
        key = getpass.getpass('ElevenLabs API key: ')
if not key:
    raise SystemExit('A credential is required for this asset generation command.')

def request(path, data=None):
    req = urllib.request.Request('https://api.elevenlabs.io' + path, data=None if data is None else json.dumps(data).encode(), headers={'xi-api-key':key, 'Content-Type':'application/json', 'Accept':'application/json' if data is None else 'audio/mpeg'})
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        try: detail = json.loads(error.read()).get('detail', {})
        except Exception: detail = {}
        # Report status, never response bodies, headers, request objects, or credentials.
        status = detail.get('status', 'request_failed') if isinstance(detail, dict) else 'request_failed'
        raise SystemExit(f'ElevenLabs HTTP {error.code}: {status}') from None

if args.inventory:
    voices = json.loads(request('/v2/voices?page_size=100')).get('voices', [])
    print(json.dumps({'voices':[{'id':v['voice_id'],'name':v['name'],'category':v.get('category'),'labels':v.get('labels',{})} for v in voices if v.get('category') in ('premade','professional')], 'models':[{'id':m['model_id'],'tts':m.get('can_do_text_to_speech')} for m in json.loads(request('/v1/models'))]}, indent=2))
    try:
        sub = json.loads(request('/v1/user/subscription'))
        print(json.dumps({'remaining_characters':max(0,sub.get('character_limit',0)-sub.get('character_count',0)), 'tier':sub.get('tier')}))
    except SystemExit:
        print('Subscription read unavailable; generation remains subject to API quota.')
    raise SystemExit(0)

story = json.loads((ROOT/'src/story.json').read_text(encoding='utf-8'))
def speech_lines(value):
    if isinstance(value, dict):
        if all(field in value for field in ('id','text','cast')):
            yield {field:value[field] for field in ('id','text','cast')}
        else:
            for child in value.values(): yield from speech_lines(child)
    elif isinstance(value, list):
        for child in value: yield from speech_lines(child)
script = {'model':story['model'],'cast':story['cast'],'clips':list(speech_lines(story))}
(ROOT/'docs/voice-script.json').write_text(json.dumps(script,indent=2,ensure_ascii=False),encoding='utf-8')
out = ROOT/'public/assets/audio/voice'
out.mkdir(parents=True, exist_ok=True)
manifest_path = out/'voice-manifest.json'
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'clips':{}}
manifest = {'provider':'ElevenLabs','model':script['model'],'music':False,'instrumentals':False,'clips':dict(previous.get('clips',{}))}
clips = [c for c in script['clips'] if not args.only or c['id'].startswith(args.only)]
print(f'Preparing {len(clips)} offline voice clips ({sum(len(c["text"]) for c in clips)} script characters).', flush=True)
import imageio_ffmpeg
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
for c in clips:
    casting = script['cast'][c['cast']]
    fingerprint = hashlib.sha256(json.dumps({'text':c['text'],'voice':casting['id'],'model':script['model'],'settings':casting['settings']},sort_keys=True).encode()).hexdigest()
    target = out/(c['id']+'.mp3')
    if previous.get('clips',{}).get(c['id'],{}).get('hash') == fingerprint and target.exists():
        print('Reusing '+c['id'], flush=True)
        continue
    raw = request('/v1/text-to-speech/'+casting['id']+'?output_format=mp3_44100_128', {'text':c['text'],'model_id':script['model'],'voice_settings':casting['settings'],'seed':4271})
    if len(raw)<1000: raise SystemExit('Empty speech response for '+c['id'])
    source = out/(c['id']+'.source.mp3')
    source.write_bytes(raw)
    result = subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(source),'-af','highpass=f=65,loudnorm=I=-18:TP=-2:LRA=7','-ar','44100','-ac','1','-b:a','128k',str(target)],capture_output=True)
    source.unlink()
    if result.returncode: raise SystemExit('Speech mastering failed for '+c['id'])
    manifest['clips'][c['id']] = {'text':c['text'],'cast':c['cast'],'voice':casting['name'],'voice_id':casting['id'],'file':c['id']+'.mp3','hash':fingerprint,'bytes':target.stat().st_size}
    manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding='utf-8')
    print('Generated '+c['id'], flush=True)
print('Voice assets ready. No credential persisted.', flush=True)
