import { ITEMS } from '../content';
export interface Drop { item:string; chance:number; count?:number; }
export interface Loot { gold:number; items:{item:string;count:number}[]; }
/** Independent rolls per enemy. Gold and XP are always awarded separately. */
export const ENEMY_DROPS:Record<string,Drop[]>={
  slime:[{item:'gel',chance:1},{item:'potion',chance:.18},{item:'amber',chance:.12},{item:'root_ring',chance:.03}],
  imp:[{item:'amber',chance:.6},{item:'herb',chance:.25},{item:'ether',chance:.14},{item:'copper_blade',chance:.05}],
  wraith:[{item:'silk',chance:.65},{item:'crystal',chance:.32},{item:'ether',chance:.16},{item:'tide_staff',chance:.04}],
  skeleton:[{item:'bone',chance:.75},{item:'ore',chance:.35},{item:'potion',chance:.2},{item:'river_mail',chance:.04}],
  wolf:[{item:'frost_shard',chance:.65},{item:'ore',chance:.35},{item:'greater_potion',chance:.16},{item:'winter_blade',chance:.05}],
  sentinel:[{item:'void_ash',chance:.7},{item:'crystal',chance:.4},{item:'greater_ether',chance:.2},{item:'star_bow',chance:.05}],
  rootwarden:[{item:'feather',chance:1},{item:'crystal',chance:1,count:3},{item:'root_ring',chance:1},{item:'sun_sword',chance:.35}],
  archivist:[{item:'crystal',chance:1,count:4},{item:'silk',chance:1,count:3},{item:'archive_sigil',chance:1},{item:'tide_staff',chance:.35}],
  glasskeeper:[{item:'frost_shard',chance:1,count:4},{item:'glass_pendant',chance:1},{item:'winter_mail',chance:.4},{item:'feather',chance:.5}],
  hollowking:[{item:'feather',chance:1,count:2},{item:'dawn_armor',chance:1},{item:'last_blade',chance:.5},{item:'sky_bow',chance:.5},{item:'nova_staff',chance:.5}],
};
export function rollEnemyDrops(id:string,rng:()=>number=Math.random):Loot['items']{
  return (ENEMY_DROPS[id]??[]).filter(d=>rng()<d.chance).map(d=>({item:d.item,count:d.count??1}));
}
/** One equipment roll; weights sum to 100%. Supplies and gold are guaranteed. */
export function chestTable(level:number):Drop[]{
  if(level<4)return [{item:'road_coat',chance:.24},{item:'copper_blade',chance:.2},{item:'river_bow',chance:.2},{item:'amber_staff',chance:.2},{item:'root_ring',chance:.1},{item:'compass',chance:.06}];
  if(level<6)return [{item:'sun_sword',chance:.2},{item:'verdant_bow',chance:.2},{item:'echo_staff',chance:.2},{item:'river_mail',chance:.18},{item:'signet',chance:.14},{item:'archive_sigil',chance:.08}];
  return [{item:'winter_blade',chance:.2},{item:'star_bow',chance:.2},{item:'tide_staff',chance:.2},{item:'winter_mail',chance:.2},{item:'glass_pendant',chance:.1},{item:'last_blade',chance:.04},{item:'sky_bow',chance:.03},{item:'nova_staff',chance:.03}];
}
export function rollChest(level:number,rng:()=>number=Math.random):Loot{
  const roll=rng();let cumulative=0;const table=chestTable(level);
  const gear=table.find(d=>{cumulative+=d.chance;return roll<cumulative;})??table[table.length-1];
  return {gold:20+level*12,items:[{item:level>=6?'greater_potion':'potion',count:2},{item:level>=4?'crystal':'amber',count:2},{item:gear.item,count:1}]};
}
export const dropPercent=(chance:number)=>Math.round(chance*100)+'%';
export function itemSources(id:string):string[]{
  const sources=Object.entries(ENEMY_DROPS).flatMap(([enemy,drops])=>drops.filter(d=>d.item===id).map(d=>enemy.replaceAll('_',' ')+' '+dropPercent(d.chance)));
  for(const level of [1,4,6]){const d=chestTable(level).find(d=>d.item===id);if(d)sources.push((level===1?'Road':level===4?'Midland':'Northern')+' chest '+dropPercent(d.chance));}
  return sources.length?sources:['Quest rewards, shops or crafting'];
}
export function applyLoot(items:Record<string,number>,loot:Loot['items']){for(const d of loot)if(ITEMS[d.item])items[d.item]=Math.min(9999,(items[d.item]??0)+d.count);}
