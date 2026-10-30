"""Lossless-resolution clips of genuine static menu captures."""
import pathlib,subprocess
import imageio_ffmpeg
root=pathlib.Path(__file__).resolve().parent
ff=imageio_ffmpeg.get_ffmpeg_exe()
for name,image in [('dialogue','06-dialogue'),('talents','03-talents'),('inventory','07-inventory')]:
 r=subprocess.run([ff,'-v','error','-y','-loop','1','-i',str(root/'store-v1/captures'/f'{image}.png'),'-t','5','-r','30','-c:v','libx264','-tune','stillimage','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',str(root/'remotion/public/clips'/f'{name}.mp4')],capture_output=True)
 if r.returncode:raise SystemExit(r.stderr.decode())
 print('Sharp menu clip: '+name)
