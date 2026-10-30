import { ENEMIES, NPCS, QUESTS, REGIONS, regionById } from '../content';
import type { GameState, QuestDef } from '../core/types';
import { WARD_GATES, wardIds } from '../expansion';
import { isWalkable, makeLayout, type Layout } from './layout';
export interface QuestGoal { region:string; x:number; y:number; label:string; quest:string; objectId?:string; }
function objectiveRegions(q:QuestDef):string[]{
  if(q.event==='talk'||q.event==='choice')return [NPCS.find(n=>n.id===(q.event==='choice'?'lyra':q.target))!.region];
  if(q.event==='visit')return [q.target];
  if(q.event==='kill'&&ENEMIES[q.target]?.boss)return [REGIONS.find(r=>r.boss===q.target)!.id];
  const locations:Record<string,string[]>={slime:['wilds'],wraith:['mire','archive'],wolf:['pass','ridge'],herb:['wilds'],ore:['pass'],memory:['sanctuary','archive','vault'],observatory:['wilds','mire','pass'],cat:['elderbrook'],letter:['mire'],bell:['archive']};
  return locations[q.target]??REGIONS.filter(r=>r.id===q.target||r.id+'_relic'===q.target).map(r=>r.id);
}
export function regionRoute(from:string,to:string):string[]{
  const queue=[[from]],seen=new Set([from]);
  while(queue.length){const route=queue.shift()!,last=route[route.length-1];if(last===to)return route;for(const next of regionById(last).exits)if(!seen.has(next)){seen.add(next);queue.push([...route,next]);}}
  return [];
}
export function questGoal(s:GameState,qid:string,layout:Layout):QuestGoal|null{
  const q=QUESTS.find(q=>q.id===qid);if(!q||s.quests[qid]?.status==='completed'||s.quests[qid]?.status==='ready')return null;
  let regions=objectiveRegions(q),giver:typeof NPCS[number]|undefined;
  if(!s.quests[qid]){if(q.kind==='main')return null;giver=NPCS.find(n=>n.name===q.giver);if(!giver)return null;regions=[giver.region];}
  else if(q.event==='interact'||q.event==='gather')regions=regions.filter(id=>makeLayout(id).objects.some(o=>o.target===q.target&&!s.collected.includes(o.id)));
  const target=regions.sort((a,b)=>regionRoute(s.region,a).length-regionRoute(s.region,b).length)[0];if(!target)return null;
  const route=regionRoute(s.region,target),next=route[1];
  if(next){
    const gate=regionById(next),hall=WARD_GATES[next];
    if(hall===s.region&&gate.requires?.some(id=>!s.collected.includes(id))&&!s.defeated.includes(gate.boss??'')){
      const ward=layout.objects.find(o=>o.kind==='ward'&&!s.collected.includes(o.id));if(ward)return {region:s.region,x:ward.x,y:ward.y,label:'Restore '+ward.name,quest:q.name,objectId:ward.id};
    }
    const exit=layout.objects.find(o=>(o.kind==='exit'||o.kind==='house')&&o.target===next);return exit?{region:next,x:exit.x,y:exit.y,label:(exit.kind==='house'?'Enter ':'To ')+regionById(next).name,quest:q.name,objectId:exit.id}:null;
  }
  if(giver||q.event==='talk'||q.event==='choice'){
    const npc=layout.objects.find(o=>o.kind==='npc'&&o.target===(giver?.id??(q.event==='choice'?'lyra':q.target)));if(npc)return {region:target,x:npc.x,y:npc.y,label:'Speak to '+NPCS.find(n=>n.id===npc.target)!.name,quest:q.name,objectId:npc.id};
  }
  if(q.event==='kill'&&ENEMIES[q.target]?.boss){const boss=layout.boss;if(boss)return {region:target,x:boss.trigger.x,y:boss.trigger.y,label:'Reach the guardian’s court',quest:q.name};}
  const o=layout.objects.find(o=>o.target===q.target&&!s.collected.includes(o.id));if(o)return {region:target,x:o.x,y:o.y,label:(o.kind==='ward'?'Restore ':o.kind==='herb'||o.kind==='ore'?'Gather ':'Find ')+o.name,quest:q.name,objectId:o.id};
  const enemy=layout.enemies.find(e=>e.id===q.target);return enemy?{region:target,x:enemy.x,y:enemy.y,label:'Find '+ENEMIES[enemy.id].name,quest:q.name}:null;
}
const grids=new WeakMap<Layout,Set<number>>();
export function walkableGrid(l:Layout):Set<number>{let grid=grids.get(l);if(grid)return grid;grid=new Set();for(let y=2;y<l.rows-1;y++)for(let x=1;x<l.cols-1;x++)if(isWalkable(l,x*16+8,y*16+8))grid.add(y*l.cols+x);grids.set(l,grid);return grid;}
/** The compass follows real corners instead of pointing through a wall or river. */
export function groundRoute(l:Layout,from:{x:number;y:number},to:{x:number;y:number}):{x:number;y:number}[]{
  const start=Math.floor(from.y/16)*l.cols+Math.floor(from.x/16),target=Math.floor(to.y/16)*l.cols+Math.floor(to.x/16),grid=walkableGrid(l);
  const previous=new Map<number,number>([[start,-1]]),queue=[start];let found=-1;
  for(let i=0;i<queue.length;i++){const k=queue[i],x=k%l.cols,y=Math.floor(k/l.cols);if(k===target||Math.hypot(x*16+8-to.x,y*16+8-to.y)<24){found=k;break;}for(const [dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=x+dx,ny=y+dy,n=ny*l.cols+nx;if(nx<1||nx>=l.cols-1||previous.has(n)||!grid.has(n))continue;previous.set(n,k);queue.push(n);}}
  if(found<0)return [];const path=[];for(let k=found;k!==-1;k=previous.get(k)!){path.push({x:(k%l.cols)*16+8,y:Math.floor(k/l.cols)*16+8});}return path.reverse();
}
export function currentTrackedQuest(s:GameState):string { const selected=s.choices.trackedQuest;if(selected&&s.quests[selected]?.status!=='completed')return selected;return QUESTS.find(q=>q.kind==='main'&&s.quests[q.id]?.status==='active')?.id??''; }
export function wardProgress(s:GameState,region:string){return wardIds(region).filter(id=>s.collected.includes(id)).length;}
