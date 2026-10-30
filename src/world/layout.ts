import { NPCS, regionById } from '../content';
import { HOUSES } from '../expansion';
import { composeWorld, type GroundFeature } from './worldDesign';
import { populateEncounters } from './encounters';
export function houseFootprint(frame:string){
  const sizes:Record<string,{w:number;h:number}>={'p/house_05':{w:54,h:24},'p/house_21':{w:66,h:28},'p/house_17':{w:42,h:22}};
  return sizes[frame]??{w:48,h:22};
}
export function houseDoorOffset(frame:string):number {
  // The original house art is asymmetrical: entrances must follow its actual door.
  const offsets:Record<string,number>={'p/house_14':-2,'p/house_08':9,'p/house_10':9,'p/house_01':9,'p/house_11':9,'p/house_12':9,'p/house_25':3,'p/house_26':3};
  return offsets[frame]??0;
}
export const TILE=16;
export interface Prop { frame:string; x:number; y:number; scale?:number; width?:number; tint?:number; light?:boolean; solid?:{w:number;h:number}; texture?:string; ground?:boolean; }
export interface ObjectPoint { id:string; kind:'npc'|'exit'|'house'|'ward'|'lore'|'herb'|'ore'|'chest'|'memory'|'letter'|'bell'|'observatory'|'cat'|'camp'|'event'; target:string; name:string; x:number; y:number; frame?:string; texture?:string; story?:string; axis?:'up'|'down'|'left'|'right'; }
export interface Spawn { id:string; x:number; y:number; }
export interface Zone { name:string; x:number; y:number; radius:number; }
export interface Layout { cols:number; rows:number; width:number; height:number; bounded:boolean; paths:Set<number>; water:Set<number>; walls:Set<number>; props:Prop[]; objects:ObjectPoint[]; enemies:Spawn[]; spawn:{x:number;y:number}; zones:Zone[]; features:GroundFeature[]; boss?:Spawn&{trigger:{x:number;y:number};line:string}; }
export function seeded(seed:string):()=>number { let value=[...seed].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,17);return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;}; }

/** Authored roads and chambers form the playable space; decoration is seeded around it. */
export function makeLayout(id:string):Layout {
  const r=regionById(id),random=seeded(id),cols=r.cols!,rows=r.rows!;
  const l:Layout={cols,rows,width:cols*TILE,height:rows*TILE,bounded:r.type==='dungeon'||r.type==='interior',paths:new Set(),water:new Set(),walls:new Set(),props:[],objects:[],enemies:[],spawn:{x:cols*8+8,y:(rows-7)*16+8},zones:[],features:[]};
  const key=(x:number,y:number)=>y*cols+x;
  const road=(x0:number,y0:number,x1:number,y1:number)=>{for(let y=Math.floor(Math.min(y0,y1));y<=Math.ceil(Math.max(y0,y1));y++)for(let x=Math.floor(Math.min(x0,x1));x<=Math.ceil(Math.max(x0,x1));x++)if(x>=1&&x<cols-1&&y>=1&&y<rows-1)l.paths.add(key(x,y));};
  const trail=(points:number[][],width=3)=>{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],half=Math.floor(width/2);road(a[0]-half,a[1]-half,b[0]+half,b[1]+half);}};
  const prop=(frame:string,tx:number,ty:number,extra:Partial<Prop>={})=>l.props.push({frame,x:tx*16+8,y:ty*16+16,...(frame.includes('house')?{solid:houseFootprint(frame)}:{}),...extra});
  const object=(kind:ObjectPoint['kind'],target:string,name:string,tx:number,ty:number,index=0,frame?:string,extra:Partial<ObjectPoint>={})=>l.objects.push({id:id+':'+kind+':'+(kind==='npc'||kind==='house'?target:index),kind,target,name,x:tx*16+8,y:ty*16+8,frame,...extra});
  const zone=(name:string,x:number,y:number,radius=90)=>l.zones.push({name,x:x*16+8,y:y*16+8,radius});
  const enemies=(pool:string[],points:number[][])=>points.forEach(([x,y],i)=>l.enemies.push({id:pool[i%pool.length],x:x*16+8,y:y*16+8}));
  const furniture=(frame:number,x:number,y:number,w=28,h=14,extra:Partial<Prop>={})=>prop(String(frame),x,y,{texture:'furniture',solid:{w,h},...extra});

  if(r.type==='interior'){
    road(3,8,28,29);road(15,28,17,31);l.spawn={x:16*16+8,y:27*16+8};
    const kind=r.house??'home';
    furniture(9,16,24,0,0,{ground:true,scale:2.1});
    furniture(4,16,10,40,12,{light:true});
    if(kind==='archive'){
      for(const [x,y]of [[6,10],[11,10],[21,10],[26,10],[6,17],[26,17]])furniture(3,x,y,34,11);
      furniture(13,16,19,42,13);furniture(2,16,22,18,8);
      furniture(12,6,25,33,12,{light:true});furniture(15,26,24,18,9);
      furniture(9,6,24,0,0,{ground:true,scale:1.1});
      object('lore','shelf','Read the hidden record',13,20,0,'p/book_06',{story:'A familiar signature, carefully scraped away. Someone in Elderbrook knew which names the Council would take.'});
    }else if(kind==='alchemy'){
      furniture(11,6,10,34,11);furniture(3,26,10,34,11);
      furniture(5,8,14,44,14);furniture(5,24,14,44,14);
      furniture(1,17,23,43,13);furniture(2,17,26,18,8);furniture(15,26,22,18,9);
      object('npc','house_alchemist_'+id,'Apothecary',9,17);
      object('herb','herb','Moonbloom cabinet',25,26,0,'0',{texture:'flora'});
    }else if(kind==='smith'){
      furniture(7,6,12,38,15,{light:true});furniture(11,26,10,34,11);
      furniture(6,11,18,27,12);furniture(8,24,14,46,12);
      furniture(10,6,23,34,12);furniture(13,22,24,42,13);furniture(2,22,27,18,8);
      object('npc','house_smith_'+id,'Forgekeeper',22,17);
      object('ore','ore','Spare stariron',8,27,0,'p/rock_12');
    }else if(kind==='shop'){
      furniture(11,6,10,34,11);furniture(11,26,10,34,11);
      furniture(8,16,13,46,13);furniture(3,6,17,34,11);furniture(3,26,17,34,11);
      furniture(12,6,25,33,12,{light:true});furniture(8,26,24,46,12);furniture(15,10,10,18,9);
      object('npc','house_merchant_'+id,'Shopkeeper',16,16);
    }else{
      furniture(0,6,17,35,22);if(kind==='inn')furniture(0,26,17,35,22);
      furniture(3,6,10,34,11);furniture(10,26,10,34,12);
      furniture(1,16,16,43,13);furniture(2,12,19,18,8);furniture(2,20,19,18,8);
      furniture(11,26,24,34,11);furniture(14,26,28,43,15);
      if(kind==='home')furniture(13,26,18,42,13);
      object('camp','rest','Rest at the hearth',6,20);
      if(kind==='inn')object('npc','house_inn_'+id,'Hearthkeeper',23,20);
      else object('lore','home','Read the family keepsake',17,23,0,'p/book_06',{story:'Two cups. One promise: no dawn should make us strangers.'});
    }
    object('exit',r.parent!,regionById(r.parent!).name,16,31,0,undefined,{axis:'down'});
    object('chest','chest','Household cache',9,27,0,'chest/chest_01/0');
  }else if(r.type==='town'){
    trail([[28,4],[28,49]],4);road(8,22,53,26);road(10,11,50,13);road(9,37,53,40);road(21,18,36,32);
    l.spawn={x:28*16+8,y:29*16+8};
    for(const h of HOUSES.filter(h=>h.parent===id)){
      prop(h.frame,h.tx,h.ty,{solid:{w:48,h:19},tint:r.theme==='ice'?0xdde5ef:undefined});
      object('house',h.id,h.name,h.tx+houseDoorOffset(h.frame)/16,h.ty+.5,0,undefined,{axis:'up'});
      const join=h.ty<17?12:h.ty<31?24:39;trail([[h.tx,h.ty+2],[h.tx,join],[28,join]],3);
      prop('p/lamp_03',h.tx+3,h.ty+1,{light:true});
    }
    if(r.theme==='marsh'){
      for(let y=3;y<rows-3;y++)for(let x=23;x<=26;x++)l.water.add(key(x,y));
      for(let y=33;y<=35;y++)for(let x=6;x<cols-5;x++)l.water.add(key(x,y));
      road(21,11,29,14);road(21,22,29,26);road(21,37,29,41);road(27,31,31,37);road(43,31,47,37);
      for(const [x,y] of [[8,29],[9,29],[48,33],[50,33],[36,44]]){prop('p/barrel_01',x,y,{solid:{w:10,h:7}});prop('p/crate_01',x+1,y);}
      prop('p/torii_03',28,18);zone('Namekeepers’ Square',32,24);zone('South Quays',44,39);zone('Registry Canal',16,13);
    }else if(r.theme==='ice'){
      prop('p/torii_06',28,18);prop('fire/fire_camp_02/0',28,23,{light:true});
      for(const [x,y]of [[19,18],[37,18],[21,34],[35,34]])prop('p/rock_39',x,y,{solid:{w:18,h:8},tint:0xb2c8db});
      zone('Hearth Square',28,26);zone('Stariron Quarter',13,28);zone('Winter Gardens',43,43);
    }else if(r.theme==='gold'){
      prop('p/torii_04',28,18);for(const [x,y]of [[20,19],[36,19],[20,32],[36,32]])prop('fire/fire_camp_02/0',x,y,{light:true});
      for(const [x,y]of [[11,44],[15,44],[19,44],[42,44],[46,44]])prop('p/barrel_01',x,y,{solid:{w:11,h:7}});
      zone('Furnace Square',28,26);zone('Copperworks',13,26);zone('Caravan Yard',44,40);
    }else{
      prop('p/torii_01',28,18);prop('crystal/cristal_0/0',33,23,{light:true,solid:{w:14,h:6}});
      for(let x=8;x<=19;x+=3)for(const y of [45,49])prop('p/tree_13',x,y,{solid:{w:13,h:6}});
      for(let x=36;x<49;x+=2)for(const y of [45,47])prop('p/potted_plant_05',x,y);
      zone('Lantern Square',28,25);zone('The Old Orchard',14,44);zone('Records Lane',17,12);
      if(id==='elderbrook'){object('cat','cat','Miso',44,28);object('chest','chest','Traveler’s chest',18,28,0,'chest/chest_01/0');}
    }
    for(const n of NPCS.filter(n=>n.region===id))object('npc',n.id,n.name,n.x,n.y);
    for(const [x,y]of [[21,20],[36,20],[21,31],[36,31],[10,25],[51,25]])prop('p/lamp_03',x,y,{light:true});
    prop('fire/fire_camp_01/0',28,43,{light:true});object('camp','rest','Rest',28,44);
    const outdoor=r.exits.filter(target=>regionById(target).type!=='interior');
    outdoor.forEach((target,i)=>{const bottom=i===0&&id!=='elderbrook',ty=bottom?rows-3:3;road(26,bottom?48:1,30,bottom?rows-1:5);object('exit',target,regionById(target).name,28,ty,i,undefined,{axis:bottom?'down':'up'});});
  }else if(r.type==='dungeon'){
    if(r.boss){
      road(26,53,46,65);road(10,37,31,47);road(43,23,62,35);road(24,6,48,22);
      trail([[36,61],[36,42],[20,42],[20,29],[53,29],[53,19],[36,19]],5);
      for(const [x,y]of [[25,8],[47,8],[25,20],[47,20],[12,39],[29,39],[45,25],[60,25]])prop(r.theme==='ice'?'p/column_05':'p/column_01',x,y,{solid:{w:13,h:7},light:true});
      const lines:Record<string,string>={sanctuary:'The lanterns remember her. The roots will not let her go.',archive:'A thousand erased names rise from the water.',vault:'Lyra’s last evening shatters into starlight.',spire:'Every stolen memory answers. The false sun turns to face you.'};
      l.boss={id:r.boss,x:36*16+8,y:14*16+8,trigger:{x:36*16+8,y:22*16+8},line:lines[id]};
      road(34,64,38,rows-2);object('exit',r.exits[0],regionById(r.exits[0]).name,36,rows-3,0,undefined,{axis:'down'});
      if(id!=='spire')object('memory','memory','Memory page',47,16,0,'p/book_06');
      if(id==='archive')object('bell','bell','Rekindle the beacon',27,17,0,'p/lamp_14');
      if(id==='spire')object('npc','lyra','Lyra',36,7);
      object('chest','chest','Guardian’s cache',54,28,0,'chest/chest_01/0');
      enemies(r.theme==='forest'?['imp','slime']:r.theme==='ice'?['wolf','skeleton']:['wraith','sentinel'],[[31,56],[41,56],[18,40],[24,43],[50,28],[56,31]]);
      zone('The Silent Antechamber',36,58);zone('The Guardian’s Court',36,16,130);
    }else{
      road(26,84,46,97);road(8,61,29,77);road(43,41,64,58);road(8,12,31,31);road(30,3,42,10);
      trail([[36,93],[36,70],[18,70],[18,50],[54,50],[54,27],[21,27],[21,7],[36,7]],5);
      const wardNames=id==='root_halls'?['Nursery Lantern','Orchard Lantern','Memorial Lantern']:id==='archive_halls'?['Witness Record','Family Register','Council Testament']:id==='vault_halls'?['First Reflection','Homeward Reflection','Last Reflection']:id==='spire_approach'?['Oath of Shelter','Oath of Witness','Oath of Dawn']:['Western Ward','Eastern Ward','Northern Ward'];
      const stories=id==='root_halls'?['A nursery without a name. The lantern is still warm.','He planted a tree for each birthday. The orchard kept count.','I will remember for both of us.']:id==='archive_halls'?['They took our names before they took our lives.','These families were never missing. They were erased.','The sun’s hunger has no end. Lyra signed as witness.']:id==='vault_halls'?['A first evening at home. Two bowls beside the fire.','A cloak mended twice. Lyra meant to come back.','Keep the people, not the prison.']:['No child will pay for another morning.','No witness will be erased for telling the truth.','No light will ask us to forget the ones we love.'];
      [[17,68],[55,48],[20,21]].forEach(([x,y],i)=>{object('ward',id,wardNames[i],x,y,i,'crystal/cristal_0/0',{story:stories[i]});prop('p/column_02',x-3,y,{solid:{w:12,h:7}});prop('p/column_02',x+3,y,{solid:{w:12,h:7}});});
      zone(wardNames[0],18,69,105);zone(wardNames[1],54,49,105);zone(wardNames[2],20,23,110);
      object('exit',r.exits[0],regionById(r.exits[0]).name,36,rows-3,0,undefined,{axis:'down'});
      if(r.exits[1])object('exit',r.exits[1],regionById(r.exits[1]).name,36,3,1,undefined,{axis:'up'});
      else object('lore',id+'_relic','Recover the forgotten relic',36,7,0,'p/book_06',{story:'A promise rescued from the dark. The town will remember what you found.'});
      object('chest','chest','Western cache',12,74,0,'chest/chest_01/0');object('chest','chest','Sealed cache',61,55,1,'chest/chest_01/0');object('chest','chest','Memorial cache',27,15,2,'chest/chest_01/0');
      for(const [x,y]of [[28,86],[44,86],[10,63],[27,63],[45,43],[62,43],[10,14],[29,14]])prop(r.theme==='ice'?'p/column_05':'p/column_01',x,y,{light:true,solid:{w:12,h:7}});
      if(r.theme==='crypt')for(const [x,y]of [[10,63],[24,63],[45,43],[58,43],[10,14],[26,14]]){prop('p/book_04',x,y+1);prop('p/book_06',x+1,y+1);}
      if(r.theme==='forest')for(const [x,y]of [[10,15],[28,28],[9,75],[61,44]])prop('p/tree_13',x,y,{solid:{w:15,h:7}});
      enemies(r.theme==='forest'?['slime','imp']:r.theme==='ice'?['wolf','skeleton']:r.theme==='gold'?['sentinel','imp']:['wraith','skeleton'],[[32,86],[42,85],[19,75],[24,67],[16,62],[48,55],[59,46],[51,45],[28,27],[13,24],[24,17],[35,7]]);
    }
  }else{
    const variants:Record<string,number[][]>={wilds:[[36,82],[36,68],[22,68],[22,43],[47,43],[47,21],[36,21],[36,5]],oldroad:[[36,82],[36,69],[16,69],[16,49],[48,49],[48,25],[28,25],[28,5]],glade:[[36,82],[18,82],[18,59],[51,59],[51,35],[23,35],[23,16],[36,16],[36,5]],mire:[[36,82],[36,63],[50,63],[50,41],[25,41],[25,22],[36,22],[36,5]],causeway:[[36,82],[36,68],[17,68],[17,45],[53,45],[53,24],[36,24],[36,5]],pass:[[36,82],[36,65],[20,65],[20,46],[49,46],[49,26],[36,26],[36,5]],ridge:[[36,82],[16,82],[16,64],[53,64],[53,45],[18,45],[18,26],[48,26],[48,10],[36,10],[36,5]]};
    const route=variants[id]??(r.theme==='ice'?variants.ridge:r.theme==='marsh'?variants.causeway:variants.oldroad);trail(route,4);l.spawn={x:36*16+8,y:80*16+8};
    trail([[36,71],[59,71],[59,53],[47,53]],3);trail([[22,43],[10,43],[10,28],[28,28]],3);
    for(const [x,y]of [[36,76],[20,55],[48,39],[27,24],[37,12]])road(x-6,y-5,x+6,y+5);
    if(r.theme==='marsh')for(let y=3;y<rows-3;y++)for(let x=4;x<cols-4;x++)if((x>29&&x<34)||(y>30&&y<34)||(y>57&&y<60))l.water.add(key(x,y));
    if(id==='glade')for(let y=42;y<57;y++)for(let x=27;x<46;x++)if(Math.pow((x-36)/10,2)+Math.pow((y-49)/8,2)<1)l.water.add(key(x,y));
    const herbs=r.theme==='ice';
    [[34,76],[21,65],[20,53],[47,42],[51,34],[29,25],[32,15],[55,69]].forEach(([x,y],i)=>object(herbs?'ore':'herb',herbs?'ore':'herb',herbs?'Stariron':'Moonbloom',x,y,i,herbs?'p/rock_12':'0',herbs?{}:{texture:'flora'}));
    object('chest','chest','Roadside cache',57,70,0,'chest/chest_01/0');object('chest','chest','Hidden cache',12,29,1,'chest/chest_01/0');object('chest','chest','Traveler’s cache',40,12,2,'chest/chest_01/0');
    if(['wilds','mire','pass'].includes(id)){object('observatory','observatory','Old observatory',40,23,0,'crystal/cristal_0/0');object('event','traveler','Lost traveler',18,67);}
    if(id==='mire')for(let i=0;i<3;i++)object('letter','letter','Letter on the shore',i===1?51:25,18+i*23,i,'p/book_06');
    if(id==='oldroad'){prop('p/house_05',55,63);for(const [x,y]of [[17,70],[48,50],[28,26]]){prop('p/crate_01',x+3,y);prop('p/barrel_01',x+4,y);}object('lore','caravan','Read the caravan note',17,55,0,'p/book_06',{story:'The last caravan lantern points to Silverleaf Glade. Lyra went ahead so the children could stay.'});object('event','caravan','A broken wagon',40,73,1);zone('The Abandoned Caravan',17,66);zone('Lantern Road',47,49);}
    else if(id==='glade'){prop('p/torii_02',36,15);object('lore','lyra_ribbon','The silver ribbon',23,25,0,'p/book_06',{story:'Lyra’s ribbon catches on a root. Three family lanterns lie beyond the northern arch.'});object('event','scholar','An orchard keeper',52,59,1);zone('Mirror Lake',48,54);zone('The Ruined Orchard',21,24);}
    else if(id==='causeway'){for(const [x,y]of [[18,48],[50,26],[34,68]])prop('p/house_21',x+4,y+5);object('event','flood','A boat in the reeds',55,46,1);zone('Drowned Rooftops',18,48);zone('The Last Dry Bridge',52,26);}
    else if(id==='ridge'){for(const [x,y]of [[16,66],[53,46],[48,12]])prop('p/torii_06',x,y);prop('p/house_17',57,65);object('lore','exiles','Read the shelter wall',56,69,0,'p/book_06',{story:'We chose the cold because it leaves our names alone. Lyra followed the highest ridge.'});object('event','rescue','A snowbound pilgrim',19,45,1);zone('Pilgrim Shelters',54,65);zone('The Upper Switchbacks',18,29);}
    else{zone(r.name,36,74);zone(id==='wilds'?'Whisperroot Crossing':id==='mire'?'The Letterbanks':'The Old Crossing',25,42);if(!['wilds','mire','pass'].includes(id))object('event',r.theme==='ice'?'rescue':r.theme==='marsh'?'flood':'caravan','Roadside encounter',20,55,1);}
    const pool=r.theme==='forest'?['slime','slime','imp']:r.theme==='ice'?['wolf','wolf','skeleton']:r.theme==='gold'?['imp','slime','skeleton']:['wraith','wraith','skeleton'];
    enemies(pool,[[35,73],[21,65],[20,57],[25,53],[45,44],[49,40],[48,34],[27,27],[31,21],[38,15],[55,66],[57,55],[14,31],[21,38],[42,71]]);
    r.exits.forEach((target,i)=>{const tx=i===0?36:i===1?(id==='oldroad'?28:36):cols-3,ty=i===0?rows-3:i===1?3:43;trail(i>=2?[[47,43],[cols-2,43]]:[[route[i===0?0:route.length-1][0],route[i===0?0:route.length-1][1]],[tx,ty]],4);object('exit',target,regionById(target).name,tx,ty,i,undefined,{axis:i===0?'down':i===1?'up':'right'});});
  }
  composeWorld(l,r);
  for(const o of l.objects){const tx=Math.floor(o.x/16),ty=Math.floor(o.y/16);road(tx-1,ty-1,tx+1,ty+1);}
  for(const k of l.paths)l.water.delete(k);
  if(l.bounded){for(const k of l.paths){const x=k%cols,y=Math.floor(k/cols);for(const [dx,dy]of [[0,-1],[0,1],[-1,0],[1,0]]){const n=key(x+dx,y+dy);if(!l.paths.has(n))l.walls.add(n);}}}
  else{
    const trees=r.theme==='ice'?['p/tree_31','p/tree_32','p/rock_39']:r.theme==='marsh'?['p/tree_12','p/tree_13','p/rock_07']:['p/tree_02','p/tree_04','p/tree_13','p/tree_17'];
    for(let y=3;y<rows-2;y+=3)for(let x=2;x<cols-2;x+=3){if(x>5&&x<cols-5&&y>5&&y<rows-5&&random()>.3)continue;if(l.paths.has(key(x,y))||l.paths.has(key(x+1,y))||l.water.has(key(x,y))||l.objects.some(o=>Math.hypot(o.x-(x*16+8),o.y-(y*16+16))<48)||l.props.some(p=>p.solid&&Math.hypot(p.x-(x*16+8),p.y-(y*16+16))<38))continue;prop(trees[Math.floor(random()*trees.length)],x,y,{solid:{w:13,h:7},tint:r.theme==='ice'?0xe0e4f2:r.theme==='forest'&&random()>.7?0xe3bb88:0xdfe1ce});}
    for(let i=0;i<55;i++){const x=4+Math.floor(random()*(cols-8)),y=5+Math.floor(random()*(rows-10));if(!l.paths.has(key(x,y))&&!l.water.has(key(x,y)))prop(String(r.theme==='ice'?4:r.theme==='marsh'?(i%3===0?5:1):i%5),x,y,{texture:'flora',scale:r.type==='town'?.8:.72,ground:i%5>=3});}
  }
  l.props=l.props.filter(p=>!p.solid||p.texture==='furniture'&&r.type==='interior'||p.frame.includes('house')||!l.objects.some(o=>o.kind!=='house'&&Math.abs(o.x-p.x)<p.solid!.w/2+19&&Math.abs(o.y-p.y)<p.solid!.h+19));
  populateEncounters(l,random,isWalkable);
  return l;
}

export function isWalkable(l:Layout,x:number,y:number):boolean {
  const tx=Math.floor(x/16),ty=Math.floor(y/16),k=ty*l.cols+tx;
  if(x<24||x>l.width-24||y<32||y>l.height-24||l.water.has(k)||l.bounded&&!l.paths.has(k))return false;
  return !l.props.some(p=>p.solid&&!p.ground&&x>p.x-p.solid.w/2-5&&x<p.x+p.solid.w/2+5&&y>p.y-p.solid.h-4&&y<p.y+4);
}
