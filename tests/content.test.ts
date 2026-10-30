import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { CLASSES, ENEMIES, ITEMS, NPCS, QUESTS, REGIONS, SKILLS } from '../src/content';
import { makeLayout, isWalkable } from '../src/world/layout';
import { GameStore } from '../src/core/store';
const atlas = (name: string) => JSON.parse(readFileSync('public/assets/pack/' + name + '.json', 'utf8')).frames;
describe('authored world and reusable assets', () => {
  it('uses existing sprite, portrait and item assets', () => {
    const heroes = atlas('heroes'), actors = atlas('actors'), monsters = atlas('monsters');
    for (const c of Object.values(CLASSES)) expect(heroes[c.sprite + '/walk/down/0'], c.sprite).toBeTruthy();
    for (const n of NPCS) { expect(actors[n.sprite + '/walk/down/1'], n.id).toBeTruthy(); expect(Number(n.portrait)).toBeGreaterThanOrEqual(0); expect(Number(n.portrait)).toBeLessThan(6); }
    expect(existsSync('public/assets/art/veiled-portraits.png')).toBe(true);
    for (const e of Object.values(ENEMIES).filter(e => !e.boss)) expect(monsters[e.sprite + '/down/0'], e.id).toBeTruthy();
    for (const item of [...Object.values(ITEMS), ...Object.values(ENEMIES), ...SKILLS]) if (!item.icon.startsWith('sheet:')) expect(existsSync('public/assets/legacy/icons/' + item.icon + '.png'), item.icon).toBe(true);
  });
  it('connects all regions from the starting town', () => {
    const reached = new Set<string>(), stack = ['elderbrook'];
    while (stack.length) { const id = stack.pop()!; if (reached.has(id)) continue; reached.add(id); stack.push(...REGIONS.find(r => r.id === id)!.exits); }
    expect(reached.size).toBe(REGIONS.length);
    expect(REGIONS.filter(r=>r.type==='town')).toHaveLength(6);
    expect(REGIONS.filter(r=>r.type==='interior')).toHaveLength(30);
    for (const r of REGIONS) for (const next of r.exits) expect(REGIONS.find(n=>n.id===next)?.exits,r.id+' → '+next).toContain(r.id);
    for (const r of REGIONS) expect(existsSync('public/assets/audio/ambience/' + r.ambience + '.wav')).toBe(true);
  });
  it('keeps every required object and boss reachable around decorative collision', () => {
    for (const r of REGIONS) {
      const l = makeLayout(r.id), stack = [[Math.floor(l.spawn.x/16),Math.floor(l.spawn.y/16)]],reached=new Set<number>();
      expect(isWalkable(l,l.spawn.x,l.spawn.y),r.id+' spawn').toBe(true);
      while(stack.length){const [x,y]=stack.pop()!,key=y*l.cols+x;if(reached.has(key)||!isWalkable(l,x*16+8,y*16+8))continue;reached.add(key);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])stack.push([x+dx,y+dy]);}
      const goals=[...l.objects,...(l.boss?[{...l.boss.trigger,name:'Guardian court'}]:[])];
      for(const o of goals){const radius='kind' in o&&o.kind==='exit'?15:34;const candidates=[...reached].filter(k=>Math.hypot((k%l.cols)*16+8-o.x,Math.floor(k/l.cols)*16+8-o.y)<radius);expect(candidates.length,r.id+': '+o.name).toBeGreaterThan(0);}
    }
  }, 20000);
  it('provides enough unique world objects to complete every collecting side quest', () => {
    const objects = REGIONS.flatMap(r => makeLayout(r.id).objects);
    for (const q of QUESTS.filter(q => q.event === 'interact' || q.event === 'gather')) expect(objects.filter(o => o.target === q.target).length, q.id).toBeGreaterThanOrEqual(q.count);
    expect(new Set(objects.map(o => o.id)).size).toBe(objects.length);
  });
  it('keeps automatic exit thresholds and their approach lanes clear', () => {
    for (const r of REGIONS) {
      const l=makeLayout(r.id);
      for (const o of l.objects.filter(o=>o.kind==='exit')) {
        const dx=o.axis==='left'?-1:o.axis==='right'?1:0,dy=o.axis==='up'?-1:o.axis==='down'?1:0;
        for (let distance=0;distance<=28;distance+=4)
          expect(isWalkable(l,o.x-dx*distance,o.y-dy*distance),r.id+' → '+o.target+' approach '+distance).toBe(true);
      }
    }
  });
  it('loads every authored prop, furniture cell and chest animation frame',()=>{
    const atlases:Record<string,ReturnType<typeof atlas>>={props:atlas('props'),furniture:atlas('furniture'),flora:atlas('flora'),landmarks:JSON.parse(readFileSync('public/assets/art/world-landmarks-v1.json','utf8')).frames};
    for(const r of REGIONS){const l=makeLayout(r.id);for(const p of l.props)expect(atlases[p.texture??'props'][p.frame],r.id+': '+p.frame).toBeTruthy();for(const o of l.objects)if(o.frame)expect(atlases[o.texture??'props'][o.frame],r.id+': '+o.frame).toBeTruthy();}
  });
});
