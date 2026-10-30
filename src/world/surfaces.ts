import type Phaser from 'phaser';
import type { Layout } from './layout';
import type { RegionDef } from '../core/types';
import { seeded } from './layout';

/** Static details are batched once per region; the playing field stays uncluttered. */
export function drawSurfaceDetails(scene:Phaser.Scene,l:Layout,r:RegionDef){
  const ink=scene.add.graphics().setDepth(-992),tile=16,random=seeded(r.id+':surface');
  if(r.type==='interior'){
    // A visible north wall, skirting, window recesses and the open southern door.
    ink.fillStyle(0x373441).fillRect(3*tile,5*tile,26*tile,3*tile);
    ink.fillStyle(0x4c4141).fillRect(3*tile,7*tile+7,26*tile,9);
    ink.fillStyle(0xae9269,.6).fillRect(3*tile,8*tile-2,26*tile,2);
    ink.lineStyle(1,0x65514a,.55);
    for(let x=4;x<28;x+=3)ink.lineBetween(x*tile,5*tile+4,x*tile,8*tile-3);
    for(const x of [9,22]){
      ink.fillStyle(0x171c29).fillRoundedRect(x*tile-12,5*tile+10,24,28,3);
      ink.fillStyle(0x7e8d9b,.48).fillRect(x*tile-8,5*tile+14,16,19);
      ink.fillStyle(0x55473e).fillRect(x*tile-1,5*tile+13,2,23).fillRect(x*tile-10,5*tile+23,20,2);
      ink.fillStyle(0xad8b62,.75).fillRect(x*tile-13,5*tile+37,26,2);
    }
    ink.fillStyle(0x1a1923,.5).fillRect(3*tile,8*tile,3,22*tile).fillRect(29*tile-3,8*tile,3,22*tile);
    ink.fillStyle(0x291e22).fillRect(15*tile,30*tile,3*tile,2*tile);
    ink.fillStyle(0xc4a272,.48).fillRect(15*tile,30*tile,3*tile,2);
    ink.lineStyle(1,0x8d6952,.65).lineBetween(15*tile,31*tile,18*tile,31*tile);
    return;
  }
  for(const f of l.features){
    const {x,y,w,h}=f;
    if(f.kind==='garden'){
      const snow=f.style==='snow',dry=f.style==='dry';
      ink.fillStyle(0x171b25,.22).fillRoundedRect(x-2,y+2,w+4,h+4,10);
      ink.fillStyle(snow?0xabbccc:dry?0x7d7258:0x687653).fillRoundedRect(x,y,w,h,9);
      ink.lineStyle(2,snow?0x8c9fb0:0x9b967b,.65).strokeRoundedRect(x,y,w,h,9);
      // Leaf and moss clusters stay inside a bed, never a green rectangle under flowers.
      for(let i=0;i<w*h/110;i++){
        const px=Math.round(x+5+random()*(w-10)),py=Math.round(y+5+random()*(h-10));
        ink.fillStyle(snow?0xd0dce6:dry?0xb5a077:0x8b9871,.5).fillRect(px,py,3,1);
        if(!snow&&i%3===0)ink.fillStyle(0xd2c4a2,.7).fillRect(px+1,py-2,1,2);
      }
    }else if(f.kind==='terrace'){
      const small=f.style==='doorstep',snow=f.style==='ice',gold=f.style==='gold'||f.style==='workyard';
      ink.fillStyle(0x101420,.15).fillRect(x-2,y+3,w+4,h+3);
      ink.lineStyle(small?1:2,snow?0xb5c8d7:gold?0xb19a6d:0xb5afa0,.55).strokeRect(x,y,w,h);
      ink.lineStyle(1,snow?0x718798:0x514f50,.5).strokeRect(x+3,y+3,w-6,h-6);
      if(!small){for(let px=x+9;px<x+w-7;px+=12){ink.fillStyle(gold?0xc1aa73:0xbcb6a3,.4).fillRect(px,y,4,2).fillRect(px,y+h-2,4,2);}}
    }else if(f.kind==='mosaic'){
      const cx=x+w/2,cy=y+h/2,blue=f.style==='star'||f.style==='register';
      ink.fillStyle(blue?0x435268:0x655e50,.28).fillRect(x,y,w,h);
      ink.lineStyle(1,blue?0xa4bdcb:0xccb888,.42).strokeRect(x+2,y+2,w-4,h-4);
      if(f.style==='roots'){
        ink.lineStyle(2,0xb6a87b,.46).lineBetween(cx,cy+h*.28,cx,cy-h*.22);
        for(const dir of [-1,1]){
          ink.lineBetween(cx,cy,cx+dir*w*.21,cy-h*.2).lineBetween(cx+dir*w*.21,cy-h*.2,cx+dir*w*.32,cy-h*.16);
          ink.lineBetween(cx,cy+h*.12,cx+dir*w*.25,cy+h*.29).lineBetween(cx+dir*w*.25,cy+h*.29,cx+dir*w*.33,cy+h*.29);
          ink.lineBetween(cx,cy-h*.12,cx+dir*w*.1,cy-h*.29);
        }
      }else if(f.style==='register'){
        ink.lineStyle(1,0xb3c1c8,.42).strokeRect(x+w*.22,y+h*.2,w*.56,h*.6).lineBetween(cx,y+h*.2,cx,y+h*.8);
        for(let j=0;j<4;j++)for(const offset of [-1,1])ink.lineBetween(cx+offset*w*.08,y+h*(.3+j*.12),cx+offset*w*.22,y+h*(.3+j*.12));
      }else{
        ink.lineStyle(1,blue?0x8198ad:0xa08c64,.46).strokeCircle(cx,cy,Math.min(w,h)*.38);
        const n=f.style==='star'?16:8,points=[];
        for(let i=0;i<n;i++){const a=i*Math.PI*2/n-Math.PI/2,rad=Math.min(w,h)*(i%2?.12:.31);points.push({x:cx+Math.cos(a)*rad,y:cy+Math.sin(a)*rad});}
        ink.fillStyle(blue?0xb0c5cf:0xd2bd8b,.32).fillPoints(points,true);
        if(f.style==='forge'){ink.lineStyle(1,0xd6a06e,.42).strokeCircle(cx,cy,Math.min(w,h)*.18);}
      }
      // Missing tesserae and hairline cracks make the inlay part of the stone floor.
      ink.lineStyle(1,0x343b45,.38).lineBetween(x+w*.66,y+3,x+w*.59,y+h*.2).lineBetween(x+w*.59,y+h*.2,x+w*.72,y+h*.28);
      for(let px=x+7;px<x+w-4;px+=9)ink.fillStyle(0xc5b98d,.22).fillRect(px,y+5,2,2).fillRect(px,y+h-6,2,2);
    }else if(f.kind==='bridge'){
      // Only draw deck where the established road crosses water, keeping collision honest.
      for(let ty=Math.floor(y/16);ty<Math.ceil((y+h)/16);ty++)for(let tx=Math.floor(x/16);tx<Math.ceil((x+w)/16);tx++){
        if(!l.paths.has(ty*l.cols+tx))continue;
        const timber=f.style==='timber';ink.fillStyle(timber?0x8a7560:0x8a9092,.7).fillRect(tx*16,ty*16,16,16);
        ink.lineStyle(1,timber?0x403d3d:0x525e6c,.65);for(let j=0;j<16;j+=4)ink.lineBetween(tx*16,ty*16+j,tx*16+16,ty*16+j);
      }
      ink.fillStyle(0x272d37,.4).fillRect(x,y+h-2,w,3);
    }else if(f.kind==='rubble'){
      for(let i=0;i<8;i++){
        const px=Math.round(x+random()*w),py=Math.round(y+random()*h);
        if(l.water.has(Math.floor(py/16)*l.cols+Math.floor(px/16)))continue;
        ink.fillStyle(0x222933,.2).fillRect(px+1,py+1,4,3);ink.fillStyle(r.theme==='ice'?0xc4d0db:0xaaa492,.45).fillRect(px,py,3,2);
      }
    }
  }
  // Raised wall faces, caps and contact shadows give dungeon chambers volume.
  if(r.type==='dungeon'){
    for(const k of l.walls){
      const x=k%l.cols,y=Math.floor(k/l.cols),below=k+l.cols;
      if(l.paths.has(below)){
        ink.fillStyle(r.theme==='ice'?0x6c879f:r.theme==='gold'?0x655644:0x444b5a).fillRect(x*16,y*16,16,16);
        ink.fillStyle(r.theme==='ice'?0xa8c3d7:0x959082,.7).fillRect(x*16,y*16,16,2);
        ink.fillStyle(0x202632,.6).fillRect(x*16,y*16+14,16,2);
        ink.lineStyle(1,0x222733,.6).lineBetween(x*16+8,y*16+2,x*16+8,y*16+8).lineBetween(x*16,y*16+8,x*16+16,y*16+8);
        ink.fillStyle(0x090e17,.25).fillRect(x*16,(y+1)*16,16,5);
      }else if(l.paths.has(k+1)||l.paths.has(k-1)){
        ink.fillStyle(0x171d2a,.7).fillRect(x*16,y*16,16,16);
        ink.fillStyle(r.theme==='ice'?0x8ba9bc:0x837a69,.7).fillRect(x*16+(l.paths.has(k+1)?14:0),y*16,2,16);
      }
    }
  }
  // Every water bank gets an irregular rim and depth, including lawns beside streams.
  for(const k of l.water){
    const x=k%l.cols*16,y=Math.floor(k/l.cols)*16;
    for(const [offset,side]of [[-l.cols,0],[1,1],[l.cols,2],[-1,3]]){
      if(l.water.has(k+offset))continue;
      const inset=k%3;
      ink.fillStyle(0x111c29,.36);
      if(side===0)ink.fillRect(x,y,16,4);else if(side===1)ink.fillRect(x+12,y,4,16);else if(side===2)ink.fillRect(x,y+12,16,4);else ink.fillRect(x,y,4,16);
      ink.fillStyle(r.theme==='ice'?0xc1d1dd:0x9daba9,.5);
      if(side===0)ink.fillRect(x+inset,y,12,1);else if(side===1)ink.fillRect(x+15,y+inset,1,12);else if(side===2)ink.fillRect(x+inset,y+15,12,1);else ink.fillRect(x,y+inset,1,12);
    }
  }
  // Road verges and shorelines use soft, irregular edges instead of flat squares.
  for(const k of l.paths){
    const x=k%l.cols,y=Math.floor(k/l.cols);
    for(const [dx,dy]of [[0,-1],[0,1],[-1,0],[1,0]]){
      const n=(y+dy)*l.cols+x+dx;if(l.paths.has(n)||l.bounded)continue;
      const water=l.water.has(n);if(!water)continue;
      const color=0x9eacb5;
      ink.fillStyle(color,water?.48:.36);
      if(dx)ink.fillRect(x*tile+(dx>0?14:0),y*tile+(k%3),2,12);
      else ink.fillRect(x*tile+(k%3),y*tile+(dy>0?14:0),12,2);
      ink.fillStyle(color,.14);
      if(dx)ink.fillRect(x*tile+(dx>0?12:2),y*tile+2,2,12);
      else ink.fillRect(x*tile+2,y*tile+(dy>0?12:2),12,2);
    }
  }
  // Ground trees with quiet root beds, leaf clusters and short grass at the trunk.
  for(const p of l.props.filter(p=>p.frame.startsWith('p/tree_'))){
    const x=Math.round(p.x),y=Math.round(p.y),snow=r.theme==='ice';
    ink.fillStyle(snow?0x708392:0x303b32,.28).fillEllipse(x,y+1,31,9);
    ink.fillStyle(snow?0x94a3ab:0x625440,.38).fillEllipse(x+1,y+2,22,5);
    ink.fillStyle(snow?0x637889:0x4f4837,.7);
    for(const [dx,dy,w]of [[-10,1,5],[5,2,7],[-6,4,3],[10,0,4]])ink.fillRect(x+dx,y+dy,w,1);
    ink.fillStyle(snow?0x8d9d9f:0x667257,.7);
    for(const dx of [-15,-11,12,16]){const h=2+(Math.abs(x+dx)%3);ink.fillRect(x+dx,y-h,1,h);ink.fillRect(x+dx-1,y-1,3,1);}
    ink.fillStyle(snow?0xafb7b1:0x9b865a,.38);
    for(const [dx,dy]of [[-12,3],[-5,5],[10,4],[16,1]])ink.fillRect(x+dx,y+dy,2,1);
  }
  if(r.type==='town'){
    // Homes keep ordinary visible doorsteps and the landmark square has its own inlay.
    for(const o of l.objects.filter(o=>o.kind==='house')){
      ink.fillStyle(0xa59a87,.65).fillRect(o.x-10,o.y+2,20,7);
      ink.fillStyle(0x504c4b,.55).fillRect(o.x-11,o.y+8,22,2);
    }
  }
}
