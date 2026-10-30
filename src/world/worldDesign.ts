import type { RegionDef } from '../core/types';
import { seeded, type Layout, type Prop } from './layout';

export interface GroundFeature {kind:'garden'|'terrace'|'mosaic'|'bridge'|'rubble';x:number;y:number;w:number;h:number;style?:string;}

/** Composed spaces around existing routes, entrances and story actors. Coordinates are world tiles. */
export function composeWorld(l:Layout,r:RegionDef){
  const random=seeded(r.id+':composition'),key=(x:number,y:number)=>y*l.cols+x;
  const feature=(kind:GroundFeature['kind'],x:number,y:number,w:number,h:number,style?:string)=>l.features.push({kind,x:x*16,y:y*16,w:w*16,h:h*16,style});
  const prop=(frame:string,x:number,y:number,extra:Partial<Prop>={})=>l.props.push({frame,x:x*16+8,y:y*16+16,...extra});
  const landmark=(frame:string,x:number,y:number,width:number)=>prop(frame,x,y,{texture:'landmarks',width,solid:{w:width*.65,h:12},light:frame!=='archive_gate'});
  const bed=(x:number,y:number,w=3,h=3,snow=false)=>{
    feature('garden',x,y,w,h,snow?'snow':r.theme==='gold'?'dry':'moss');
    for(let ty=y;ty<y+h;ty++)for(let tx=x;tx<x+w;tx++)l.paths.delete(key(tx,ty));
    prop(snow?'p/tree_32':x%2?'p/tree_02':'p/tree_13',x+w/2-.5,y+h/2+.4,{solid:{w:13,h:6},tint:snow?0xe8eef4:0xdfdfcf});
    for(const [dx,dy]of [[.2,.6],[w-.8,h-.8]])prop(snow?'4':'0',x+dx,y+dy,{texture:'flora',scale:.7});
  };
  if(r.type==='town'){
    // The broad square is broken into human-sized passages, terraces and planted islands.
    feature('terrace',20,18,18,15,r.theme);
    if(r.id==='elderbrook'){
      landmark('lantern_well',28,25,51);feature('mosaic',26,28,5,4,'compass');
      bed(22,27,3,4);bed(33,28,3,3);bed(22,19,3,3);bed(34,18,3,3);
      for(const [x,y]of [[24,31],[32,31],[24,23],[32,23]])prop('p/potted_plant_05',x,y);
      // A small brook behind the records house gives the village an actual landscape.
      for(let y=5;y<=17;y++)for(let x=5;x<=8+(y>12?1:0);x++)l.water.add(key(x,y));
      feature('bridge',5,11,5,3,'timber');
    }else if(r.theme==='marsh'){
      landmark('archive_gate',33,20,65);feature('mosaic',29,26,6,4,'register');
      feature('bridge',21,11,9,4,'stone');feature('bridge',21,22,9,5,'stone');feature('bridge',21,37,9,5,'stone');
      bed(31,29,3,3);bed(18,19,3,3);
      for(const [x,y]of [[21,28],[27,29],[42,36],[48,36]]){prop('p/barrel_01',x,y);prop('p/lamp_03',x+.7,y-1,{light:true});}
    }else if(r.theme==='ice'){
      landmark('frost_obelisk',29,27,43);feature('mosaic',25,23,7,7,'star');
      bed(22,28,3,3,true);bed(34,28,3,3,true);bed(34,20,3,3,true);
      for(const [x,y]of [[24,32],[33,32],[23,23],[35,23]])prop('p/rock_39',x,y,{tint:0xe1e9ef});
      for(let x=8;x<22;x+=4)feature('garden',x,43,3,6,'snow');
    }else if(r.theme==='gold'){
      landmark('bronze_furnace',30,25,54);feature('mosaic',25,28,8,4,'forge');
      bed(22,27,3,4);bed(34,27,3,4);
      for(const [x,y]of [[24,21],[33,21],[23,33],[35,33]]){prop('p/crate_03',x,y);prop('p/barrel_02',x+1,y);}
      feature('terrace',8,40,14,10,'workyard');feature('terrace',40,41,13,8,'workyard');
    }else{
      landmark('lantern_well',31,26,46);feature('mosaic',25,26,5,5,'moon');
      bed(22,27,3,4);bed(34,29,3,3);bed(23,19,3,3);
      for(let y=15;y<22;y++)for(let x=7;x<14;x++)if((x-10)**2+(y-18)**2<11)l.water.add(key(x,y));
      for(const [x,y]of [[22,34],[36,34],[23,22]])prop('p/potted_plant_06',x,y);
    }
    // Shops and doorways have thresholds and little planted courts, not floating props.
    for(const o of l.objects.filter(o=>o.kind==='house')){
      feature('terrace',o.x/16-2,o.y/16-1,4,3,'doorstep');
      prop('p/potted_plant_04',o.x/16-2.3,o.y/16-.2);
      prop('p/pot_01',o.x/16+1.2,o.y/16);
    }
  }else if(r.type==='wild'){
    // Clusters follow the bends of the road, leaving encounters and side paths legible.
    for(const [x,y,w,h]of [[28,75,5,4],[14,57,4,5],[55,37,4,5],[21,19,5,4]]){
      feature('garden',x,y,w,h,r.theme==='ice'?'snow':r.theme==='gold'?'dry':'moss');
      for(let i=0;i<3;i++){const tx=x+random()*w,ty=y+random()*h;if(l.paths.has(key(Math.floor(tx),Math.floor(ty))))continue;prop(r.theme==='ice'?'p/tree_31':i%2?'p/tree_04':'p/tree_17',tx,ty,{solid:{w:13,h:6}});}
    }
    for(const [x,y]of [[37,77],[21,55],[49,38],[29,23]])feature('rubble',x,y,5,4,r.theme);
    if(r.id==='glade'){
      landmark('lantern_well',50,52,46);feature('terrace',46,52,8,6,'lakeside');
      for(const [x,y]of [[28,44],[27,53],[44,46],[43,54]])prop('p/rock_18',x,y);
    }else if(r.id==='oldroad'){
      feature('terrace',12,64,13,8,'caravan');prop('p/crate_03',13,65);prop('p/barrel_02',15,65);prop('p/pot_12',14,67);
    }else if(r.theme==='marsh'){
      feature('bridge',29,42,6,4,'timber');feature('bridge',29,67,6,4,'timber');
      for(const [x,y]of [[22,38],[35,30],[29,57],[52,61]])prop('5',x,y,{texture:'flora',scale:.9});
    }else if(r.theme==='ice'){
      landmark('frost_obelisk',54,66,40);feature('terrace',51,66,7,4,'ice');
    }else if(r.theme==='gold')landmark('bronze_furnace',54,67,46);
  }else if(r.type==='dungeon'){
    const chambers=r.boss?[[26,53,21,13],[10,37,22,11],[43,23,20,13],[24,6,25,17]]:[[26,84,21,14],[8,61,22,17],[43,41,22,18],[8,12,24,20],[30,3,13,8]];
    for(const [x,y,w,h]of chambers){
      feature('terrace',x+1,y+1,w-2,h-2,r.theme);feature('mosaic',x+w/2-2,y+h/2-2,4,4,r.theme==='ice'?'star':r.theme==='gold'?'forge':r.theme==='forest'?'roots':'register');
      for(const [tx,ty]of [[x+2,y+h-2],[x+w-3,y+h-3]])feature('rubble',tx,ty,2,2,r.theme);
    }
    if(r.theme==='forest'){
      for(const [x,y]of (r.boss?[[29,55],[46,27],[25,9]]:[[29,87],[12,64],[46,44],[10,14]]))prop('p/tree_13',x,y,{solid:{w:13,h:7}});
      if(!r.boss)landmark('lantern_well',26,17,44);
    }else if(r.theme==='crypt'){
      // Blue-black pools in the void below the walkways, never on the quest route.
      for(let y=11;y<l.rows-9;y++)for(let x=4;x<l.cols-4;x++)if(!l.paths.has(key(x,y))&&x%23>8&&x%23<17&&y%27>9&&y%27<18)l.water.add(key(x,y));
      if(!r.boss)landmark('archive_gate',16,14,59);
      for(const [x,y,w]of chambers){
        for(let tx=x+5;tx<x+w-3;tx+=5)prop('3',tx,y+1.3,{texture:'furniture',solid:{w:30,h:10}});
        prop('p/book_06',x+3,y+3);
      }
    }else if(r.theme==='ice'){
      for(const [x,y]of (r.boss?[[29,56],[45,26],[28,10]]:[[29,87],[11,64],[46,44],[11,15]]))landmark('frost_obelisk',x,y,32);
    }else if(r.theme==='gold'){
      for(const [x,y]of (r.boss?[[29,56],[46,27]]:[[29,87],[46,44]]))landmark('bronze_furnace',x,y,42);
    }
  }
}
