import type Phaser from 'phaser';
import type { Layout } from './layout';
import { roadField, roadEdgeCells } from './roadEdges';
import { TILE_INDEX } from './tileIndex';
/** Material variation keeps paving, earth and boards cohesive without noisy repetition. */
export function createTerrain(scene:Phaser.Scene){
  const tex=scene.textures.createCanvas('terrain',16*40,16)!,ctx=tex.context;
  const colors=[
    ['#69745a','#7a8567','#535f4d'],['#73777b','#959792','#565c64'],
    ['#86775f','#94846a','#766a57'],['#b1bfce','#c4ced9','#9aaabc'],
    ['#71838f','#8798a2','#5a6d79'],['#745342','#89654e','#624737'],
    ['#364f63','#667e8e','#2d4458'],['#333745','#4d5161','#242936'],
    ['#554d5a','#746470','#423b49'],['#817563','#938772','#6e6455']
  ];
  colors.forEach(([base,light,dark],i)=>{
    for(let v=0;v<4;v++){
      const x=(i*4+v)*16;ctx.globalAlpha=1;ctx.fillStyle=base;ctx.fillRect(x,0,16,16);
      if(i===1){
        // Original Super Retro cobblestones keep streets from looking like repeating bricks.
        const f=scene.textures.getFrame('tiles',TILE_INDEX['main:'+(v%2?4035:4034)]);
        if(f){ctx.drawImage(f.source.image as HTMLImageElement,f.cutX,f.cutY,16,16,x,0,16,16);ctx.globalAlpha=.28;ctx.fillStyle='#8b9191';ctx.fillRect(x,0,16,16);}
      }else if([4,7,8,9].includes(i)){
        // Staggered stone joints, with subtle wear and a restrained bevel.
        ctx.fillStyle=dark;ctx.globalAlpha=.55;ctx.fillRect(x,15,16,1);ctx.fillRect(x,7,16,1);
        const split=v%2?5:11;ctx.fillRect(x+split,0,1,7);ctx.fillRect(x+(split+8)%16,8,1,7);
        ctx.fillStyle=light;ctx.globalAlpha=.28;ctx.fillRect(x+1,1,14,1);ctx.fillRect(x+1,9,14,1);
        for(let j=0;j<4;j++){ctx.globalAlpha=.12;ctx.fillStyle=j%2?light:dark;ctx.fillRect(x+(j*7+v*3)%14+1,(j*5+v*2)%13+2,2,1);}
      }else if(i===5){
        for(let y=0;y<16;y+=4){ctx.globalAlpha=.6;ctx.fillStyle=dark;ctx.fillRect(x,y,16,1);ctx.globalAlpha=.28;ctx.fillStyle=light;ctx.fillRect(x+1,y+1,13,1);}
        ctx.fillStyle=dark;ctx.globalAlpha=.5;ctx.fillRect(x+(v*5+3)%15,1,1,3);ctx.fillRect(x+(v*3+9)%15,9,1,3);
      }else if(i===6){
        ctx.globalAlpha=.3;ctx.fillStyle=light;ctx.fillRect(x+(v*3)%8,3,6,1);ctx.fillRect(x+8,11,5,1);
        ctx.globalAlpha=.25;ctx.fillStyle=dark;ctx.fillRect(x+3,7,8,1);
      }else{
        for(let j=0;j<6;j++){ctx.globalAlpha=.22;ctx.fillStyle=j%2?light:dark;ctx.fillRect(x+(j*7+v*3+i)%15,(j*5+v*7+i*3)%15,j%3===0?2:1,1);}
      }
      ctx.globalAlpha=1;tex.add(i+'_'+v,0,x,0,16,16);if(v===0)tex.add(String(i),0,x,0,16,16);
    }
  });tex.refresh();
}
export function terrainVariant(kind:number,x:number,y:number){
  return kind+'_'+((Math.imul(x,17)^Math.imul(y,31)^(x>>>1))&3);
}

/** Bake curved, slightly irregular earth/grass joins once when a region loads. */
export function createRoadVergeAtlas(scene:Phaser.Scene,l:Layout,base:number,floor:number){
  const key='terrain_verges';if(scene.textures.exists(key))scene.textures.remove(key);
  const cells=roadEdgeCells(l);if(!cells.length||base===floor)return null;
  const texture=scene.textures.createCanvas(key,512,Math.ceil(cells.length/32)*16)!;
  const material=scene.textures.get('terrain') as Phaser.Textures.CanvasTexture;
  const pixels=new Map<string,Uint8ClampedArray>(),frames=new Set<number>();
  const sample=(kind:number,x:number,y:number)=>{
    const name=terrainVariant(kind,x,y);let data=pixels.get(name);
    if(!data){const v=Number(name.split('_')[1]);data=material.context.getImageData((kind*4+v)*16,0,16,16).data;pixels.set(name,data);}return data;
  };
  cells.forEach((cell,index)=>{
    const x=cell%l.cols,y=Math.floor(cell/l.cols),grass=sample(base,x,y),road=sample(floor,x,y);
    const tile=texture.context.createImageData(16,16);
    for(let py=0;py<16;py++)for(let px=0;px<16;px++){
      const offset=(py*16+px)*4,field=roadField(l,x*16+px+.5,y*16+py+.5),source=field>=.5?road:grass;
      for(let c=0;c<3;c++)tile.data[offset+c]=Math.abs(field-.5)<.045?Math.round(grass[offset+c]*.52+road[offset+c]*.48):source[offset+c];
      tile.data[offset+3]=255;
    }
    const ax=index%32*16,ay=Math.floor(index/32)*16;texture.context.putImageData(tile,ax,ay);texture.add(String(cell),0,ax,ay,16,16);frames.add(cell);
  });texture.refresh();return {key,frames};
}
