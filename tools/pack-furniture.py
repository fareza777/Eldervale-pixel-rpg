"""Isolate atlas cells by opaque component; transparent speckles are not furniture."""
import pathlib, json
import numpy as np
from scipy.ndimage import label, find_objects
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parent.parent
source=Image.open(ROOT/'public/assets/art/interior-furniture-crisp.png').convert('RGBA')
density=2
sizes=[(40,54),(48,35),(20,31),(38,52),(44,43),(48,43),(30,35),(42,52),(50,33),(60,44),(38,51),(38,49),(38,39),(46,40),(48,30),(22,53)]
sheet=Image.new('RGBA',(512,512));frames={};measurements=[]
for i,size in enumerate(sizes):
    x,y=i%4,i//4
    cell=source.crop((round(x*source.width/4),round(y*source.height/4),round((x+1)*source.width/4),round((y+1)*source.height/4)))
    alpha=np.array(list(cell.getchannel('A').getdata()),dtype=np.uint8).reshape(cell.height,cell.width)
    labels,count=label(alpha>80)
    counts=np.bincount(labels.ravel());counts[0]=0
    bounds=find_objects(labels)[int(counts.argmax())-1]
    crop=(bounds[1].start,bounds[0].start,bounds[1].stop,bounds[0].stop)
    cell=cell.crop(crop);cell.thumbnail((size[0]*density,size[1]*density),Image.Resampling.NEAREST)
    # Crisp silhouettes: source authoring haze is never part of a runtime sprite.
    cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=144 else 0))
    cell=cell.crop(cell.getbbox())
    px,py=x*128+(128-cell.width)//2,y*128+128-cell.height
    sheet.alpha_composite(cell,(px,py))
    frames[str(i)]={'frame':{'x':px,'y':py,'w':cell.width,'h':cell.height},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':cell.width,'h':cell.height},'sourceSize':{'w':cell.width,'h':cell.height}}
    measurements.append({'id':str(i),'crop':crop,'width':cell.width,'height':cell.height,'pixelDensity':density,'worldWidth':cell.width/density,'worldHeight':cell.height/density,'foot':{'x':.5,'y':1}})
sheet.save(ROOT/'public/assets/pack/furniture.png')
(ROOT/'public/assets/pack/furniture.json').write_text(json.dumps({'frames':frames,'meta':{'image':'furniture.png','pixelDensity':density,'size':{'w':512,'h':512}}}),encoding='utf-8')
(ROOT/'docs/furniture-grounding.json').write_text(json.dumps(measurements,indent=2),encoding='utf-8')
print('Repacked 16 isolated furnishings with consistent proportions and contact feet.')
