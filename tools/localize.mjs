import { readFile, writeFile } from 'node:fs/promises';
const mapping = JSON.parse(await readFile('tools/translations-en.json','utf8'));
for(const file of ['src/ui.ts']) { let source = await readFile(file,'utf8'); for(const [before,after] of Object.entries(mapping).sort((a,b)=>b[0].length-a[0].length)) source=source.split(before).join(after); await writeFile(file,source); }
