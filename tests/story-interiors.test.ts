import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { NPCS, REGIONS } from '../src/content';
import { makeLayout, houseDoorOffset } from '../src/world/layout';
import { dialogueLines, CHRONICLE } from '../src/narrative';
import { GameStore } from '../src/core/store';
import story from '../src/story.json';
import { HOUSES } from '../src/expansion';
import { assetScale } from '../src/world/assetDensity';
class Storage { data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);} }
describe('grounded interiors and voiced narrative',()=>{
  it('keeps standing furniture silhouettes separate in all thirty homes',()=>{
    const atlas=JSON.parse(readFileSync('public/assets/pack/furniture.json','utf8')),frames=atlas.frames;
    expect(atlas.meta.pixelDensity).toBe(1/assetScale('furniture'));
    for(const r of REGIONS.filter(r=>r.type==='interior')){
      const p=makeLayout(r.id).props.filter(p=>p.texture==='furniture'&&!p.ground).map(p=>{const f=frames[p.frame].frame,scale=(p.scale??1)*assetScale('furniture');return {id:p.frame,x:p.x-f.w*scale/2,y:p.y-f.h*scale,w:f.w*scale,h:f.h*scale};});
      for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
        const a=p[i],b=p[j],w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
        expect(w>1&&h>1,r.id+': '+a.id+' overlaps '+b.id).toBe(false);
      }
    }
  });
  it('places every house action on its physical doorway',()=>{
    for(const h of HOUSES){const l=makeLayout(h.parent),door=l.objects.find(o=>o.target===h.id)!;
      expect(door.x).toBe(h.tx*16+8+houseDoorOffset(h.frame));expect(door.y).toBe(h.ty*16+16);expect(door.axis).toBe('up');
    }
  });
  it('reveals the betrayal and forgotten promise only in the appropriate chapter',()=>{
    const s=new GameStore(new Storage());s.newGame('Arin','warden');
    const mara=NPCS.find(n=>n.id==='mara')!,elara=NPCS.find(n=>n.id==='elara')!;
    expect(dialogueLines(mara,s.s,1)[0].id).toBe('dialogue_mara_0');
    expect(dialogueLines(mara,s.s,5)[0].text).toContain('signature');
    expect(dialogueLines(elara,s.s,5)[0].text).toContain('willingly');
    expect(dialogueLines(elara,s.s,7)[0].text).toContain('promise');
    expect(CHRONICLE.filter(c=>c.unlockedAt<=1)).toHaveLength(1);
    expect(CHRONICLE.filter(c=>c.unlockedAt<=10)).toHaveLength(6);
  });
  it('ships the exact spoken script for every authored voice clip',()=>{
    const manifest=JSON.parse(readFileSync('public/assets/audio/voice/voice-manifest.json','utf8'));
    let count=0;
    function inspect(v:unknown){if(Array.isArray(v))v.forEach(inspect);else if(v&&typeof v==='object'){const line=v as Record<string,unknown>;if(typeof line.id==='string'&&typeof line.cast==='string'&&typeof line.text==='string'){const clip=manifest.clips[line.id];expect(clip,line.id).toBeTruthy();expect(clip.text).toBe(line.text);expect(existsSync('public/assets/audio/voice/'+clip.file),line.id).toBe(true);expect(clip.bytes).toBeGreaterThan(2000);count++;}else Object.values(line).forEach(inspect);}}
    inspect(story);expect(count).toBe(75);expect(manifest.music).toBe(false);expect(manifest.instrumentals).toBe(false);
  });
  it('migrates old audio settings with a separate default voice volume',()=>{
    const storage=new Storage();storage.setItem('eldervale.settings','{"sfx":0.4,"ambience":0.1}');
    const s=new GameStore(storage);expect(s.settings.voice).toBe(.85);s.updateSettings({voice:0});expect(new GameStore(storage).settings.voice).toBe(0);
  });
});
