"""Crop the six generated botanical decals into a reusable transparent atlas."""
import pathlib, json
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent.parent
im=Image.open(ROOT/'public/assets/art/flora-crisp.png').convert('RGBA')
density=2
sheet=Image.new('RGBA',(192,128));frames={}
for i,size in enumerate([(19,23),(19,23),(21,25),(28,20),(24,20),(20,27)]):
    x,y=i%3,i//3
    cell=im.crop((round(x*im.width/3),round(y*im.height/2),round((x+1)*im.width/3),round((y+1)*im.height/2)))
    crop=cell.getchannel('A').point(lambda a:255 if a>96 else 0).getbbox()
    if not crop: raise ValueError('Missing botanical decal '+str(i))
    cell=cell.crop(crop);cell.thumbnail((size[0]*density,size[1]*density),Image.Resampling.NEAREST)
    cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=144 else 0))
    cell=cell.crop(cell.getbbox())
    px,py=x*64+(64-cell.width)//2,y*64+64-cell.height
    sheet.alpha_composite(cell,(px,py))
    frames[str(i)]={'frame':{'x':px,'y':py,'w':cell.width,'h':cell.height},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':cell.width,'h':cell.height},'sourceSize':{'w':cell.width,'h':cell.height}}
sheet.save(ROOT/'public/assets/pack/flora.png')
(ROOT/'public/assets/pack/flora.json').write_text(json.dumps({'frames':frames,'meta':{'image':'flora.png','pixelDensity':density,'size':{'w':192,'h':128}}}),encoding='utf-8')
print('Six transparent botanical decals packaged.')
