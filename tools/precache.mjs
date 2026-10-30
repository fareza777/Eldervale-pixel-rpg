import { readdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
// Authoring masters stay in the workspace; phones use their packed atlases/scenes.
const masters=['story-cinematics.png','interior-furniture-source.png','interior-furniture-crisp.png','flora-source.png','flora-crisp.png'];
for(const name of masters) await unlink(path.resolve('dist/assets/art',name)).catch(error=>{if(error.code!=='ENOENT')throw error;});
async function walk(dir) { const files = []; for (const entry of await readdir(dir, { withFileTypes: true })) { const name = path.join(dir, entry.name); if (entry.isDirectory()) files.push(...await walk(name)); else files.push(name); } return files; }
const files = (await walk('dist')).filter(file => !/precache\.json|sw\.js|source\.css/.test(file)).map(file => '/' + path.relative('dist', file).split(path.sep).join('/'));
await writeFile('dist/precache.json', JSON.stringify(files));
console.log('Offline manifest: ' + files.length + ' local files.');
