import pathlib,json,zipfile,shutil
root=pathlib.Path(__file__).resolve().parent
pack=root/'store-v1'
# Delivery archive: finished assets plus small provenance documents, no scratch recordings.
with zipfile.ZipFile(pack/'Eldervale-Play-Store-Pack.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for p in sorted((pack/'exports').iterdir()):
  if p.is_file():z.write(p,'Eldervale-Play-Store/'+p.name)
 for p in sorted((pack/'source').iterdir()):
  if p.is_file():z.write(p,'Eldervale-Play-Store/source/'+p.name)
 for p in [pack/'creative-brief.md',pack/'review/delivery-validation.json',pack/'captures/hd/manifest.json']:
  if p.exists():z.write(p,'Eldervale-Play-Store/source/'+p.name)
# Editable project: dependencies reinstall from the pinned lockfile; include all authored media.
with zipfile.ZipFile(root/'Eldervale-Remotion-Source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 project=root/'remotion'
 for p in sorted(project.rglob('*')):
  if p.is_file()and not any(part in ('node_modules','.bundle','.git','out')for part in p.relative_to(project).parts):
   z.write(p,'Eldervale-Marketing/remotion/'+p.relative_to(project).as_posix())
 for p in sorted((pack/'source').iterdir()):
  if p.is_file():z.write(p,'Eldervale-Marketing/store-v1/source/'+p.name)
 z.write(pack/'creative-brief.md','Eldervale-Marketing/store-v1/creative-brief.md')
for p in [pack/'Eldervale-Play-Store-Pack.zip',root/'Eldervale-Remotion-Source.zip']:
 with zipfile.ZipFile(p)as z:assert z.testzip()is None
 print(p.name,round(p.stat().st_size/1024/1024,1),'MB')
