import { describe, expect, it } from 'vitest';
import { ENEMIES, ITEMS, MAIN_QUESTS, REGIONS, regionById } from '../src/content';
import { GameStore, validateSave } from '../src/core/store';
import { chestTable, rollChest, rollEnemyDrops, ENEMY_DROPS } from '../src/core/loot';
import { HOUSES, WARD_GATES, wardIds } from '../src/expansion';
import { groundRoute, questGoal, regionRoute } from '../src/world/navigation';
import { isWalkable, makeLayout } from '../src/world/layout';
class Storage { data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);} }
function game(){const store=new GameStore(new Storage());store.newGame('Arin','warden');return store;}
function chapter(store:GameStore,index:number){for(const q of MAIN_QUESTS.slice(0,index))store.emit(q.event,q.target);}
describe('long-form exploration and loot',()=>{
  it('leads through six areas before the first guardian and requires three wards',()=>{
    expect(regionRoute('elderbrook','sanctuary')).toEqual(['elderbrook','wilds','oldroad','glade','root_halls','sanctuary']);
    const s=game();chapter(s,2);s.travel('root_halls');expect(s.travel('sanctuary')).toBe(false);
    for(const id of wardIds('root_halls'))s.s.collected.push(id);
    expect(s.travel('sanctuary')).toBe(true);
    for(const [boss,hall]of Object.entries(WARD_GATES))expect(regionById(boss).requires).toEqual(wardIds(hall));
  });
  it('keeps a player at the same door when returning from an interior, including after reload',()=>{
    const s=game();s.s.position={x:250,y:330};expect(s.travel('elder_records')).toBe(true);s.save();
    const save=validateSave(structuredClone(s.s))!;expect(save.region).toBe('elder_records');
    s.state=save;expect(s.travel('elderbrook')).toBe(true);expect(s.s.position).toEqual({x:250,y:330});
    for(const h of HOUSES)expect(regionById(h.id).stage).toBe(regionById(h.parent).stage);
  });
  it('credits a ward expedition completed before its side quest is accepted',()=>{
    const s=game();for(let i=0;i<3;i++)s.emit('interact','quarry');s.acceptQuest('forge_wards');
    expect(s.s.quests.forge_wards).toEqual({status:'ready',count:3});expect(s.claimQuest('forge_wards')).toBe(true);expect(s.s.items.copper_blade).toBe(1);
  });
  it('ignores malformed interior return metadata in an otherwise valid imported save',()=>{
    const s=game();s.travel('elder_records');s.s.choices['return:elder_records']='{"x":"broken","y":null}';
    expect(validateSave(s.s)).not.toBeNull();expect(s.travel('elderbrook')).toBe(true);
    expect(Number.isFinite(s.s.position.x)&&Number.isFinite(s.s.position.y)).toBe(true);
  });
  it('routes a quest through uncollected wards and navigable corners without crossing walls',()=>{
    const s=game();chapter(s,2);s.travel('root_halls');const layout=makeLayout('root_halls');
    const first=questGoal(s.s,'m2',layout)!;expect(first.objectId).toBe('root_halls:ward:0');
    const route=groundRoute(layout,layout.spawn,first);expect(route.length).toBeGreaterThan(20);
    for(const p of route)expect(isWalkable(layout,p.x,p.y)).toBe(true);
    s.s.collected.push(first.objectId!);expect(questGoal(s.s,'m2',layout)?.objectId).toBe('root_halls:ward:1');
    s.s.collected.push(...wardIds('root_halls'));expect(questGoal(s.s,'m2',layout)?.region).toBe('sanctuary');
  });
  it('rolls independent enemy drops and exactly one weighted chest item',()=>{
    for(const [id,table]of Object.entries(ENEMY_DROPS)){expect(ENEMIES[id]).toBeTruthy();for(const d of table){expect(ITEMS[d.item]).toBeTruthy();expect(d.chance).toBeGreaterThan(0);expect(d.chance).toBeLessThanOrEqual(1);}expect(rollEnemyDrops(id,()=>0)).toHaveLength(table.length);expect(rollEnemyDrops(id,()=>.999999).length).toBe(table.filter(d=>d.chance===1).length);}
    for(const level of [1,3,4,5,6,8]){const table=chestTable(level);expect(table.reduce((n,d)=>n+d.chance,0)).toBeCloseTo(1);for(const roll of [0,.19,.48,.91,.999999]){const loot=rollChest(level,()=>roll);expect(loot.gold).toBe(20+12*level);expect(loot.items).toHaveLength(3);expect(loot.items[2].count).toBe(1);expect(table.some(d=>d.item===loot.items[2].item)).toBe(true);}}
  });
  it('places optional quests in distinct branches with recoverable relics',()=>{
    for(const [town,road,dungeon]of [['cinderwatch','cindertrail','quarry'],['moonmere','moonroad','moonwell'],['starfall','watchroad','watchcrypt']]){expect(regionRoute(town,dungeon)).toEqual([town,road,dungeon]);const l=makeLayout(dungeon);expect(l.objects.filter(o=>o.kind==='ward')).toHaveLength(3);expect(l.objects.some(o=>o.target===dungeon+'_relic')).toBe(true);expect(l.enemies.length).toBeGreaterThanOrEqual(12);}
    expect(REGIONS.filter(r=>r.type!=='interior')).toHaveLength(27);
  });
});
