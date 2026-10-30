import type { Layout } from './layout';

/** Populate the authored roads in spaced groups, with safe arrivals and quest interactions. */
export function populateEncounters(l:Layout,random:()=>number,walkable:(l:Layout,x:number,y:number)=>boolean){
  if(!l.enemies.length)return;
  const pool=l.enemies.map(e=>e.id),target=l.boss?18:l.bounded?44:42;
  const safe=(x:number,y:number)=>walkable(l,x,y)&&Math.hypot(x-l.spawn.x,y-l.spawn.y)>172
    &&l.objects.every(o=>Math.hypot(x-o.x,y-o.y)>(o.kind==='exit'?188:o.kind==='npc'||o.kind==='event'?80:36))
    &&(!l.boss||y>l.boss.trigger.y+48);
  l.enemies=l.enemies.filter(e=>safe(e.x,e.y));
  const candidates=[...l.paths].map(k=>({x:(k%l.cols)*16+8,y:Math.floor(k/l.cols)*16+8,order:random()}))
    .filter(p=>safe(p.x,p.y)).sort((a,b)=>a.order-b.order);
  // Fill unguarded stretches first; companions make each encounter a small tactical group.
  for(const p of candidates){
    if(l.enemies.length>=target)break;
    if(l.enemies.some(e=>Math.hypot(e.x-p.x,e.y-p.y)<104))continue;
    const count=2+(random()>.65?1:0),angle=random()*Math.PI*2;
    for(let i=0;i<count&&l.enemies.length<target;i++){
      const a=angle+i*2.4,x=p.x+Math.cos(a)*(i?26:0),y=p.y+Math.sin(a)*(i?26:0);
      if(safe(x,y)&&!l.enemies.some(e=>Math.hypot(e.x-x,e.y-y)<18))l.enemies.push({id:pool[Math.floor(random()*pool.length)],x,y});
    }
  }
}
