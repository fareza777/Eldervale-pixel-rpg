import type { Layout } from './layout';

/** A continuous road contour, sampled on a crisp pixel grid. */
export function roadField(l:Layout,worldX:number,worldY:number):number {
  const x=worldX+Math.sin(worldY*.039)*2.5+Math.sin(worldY*.11)*.8;
  const y=worldY+Math.sin(worldX*.035+1.4)*2.5+Math.sin(worldX*.095)*.8;
  const gx=x/16-.5,gy=y/16-.5,tx=Math.floor(gx),ty=Math.floor(gy),fx=gx-tx,fy=gy-ty;
  const at=(cx:number,cy:number)=>cx>=0&&cy>=0&&cx<l.cols&&cy<l.rows&&l.paths.has(cy*l.cols+cx)?1:0;
  return (at(tx,ty)*(1-fx)+at(tx+1,ty)*fx)*(1-fy)+(at(tx,ty+1)*(1-fx)+at(tx+1,ty+1)*fx)*fy;
}

export function roadEdgeCells(l:Layout):number[] {
  if(l.bounded)return [];
  const cells=[];
  for(let y=0;y<l.rows;y++)for(let x=0;x<l.cols;x++){
    const key=y*l.cols+x;if(l.water.has(key))continue;
    let road=0,water=false;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(x+dx<0||x+dx>=l.cols||y+dy<0||y+dy>=l.rows)continue;
      const k=(y+dy)*l.cols+x+dx;if(l.paths.has(k))road++;if(l.water.has(k))water=true;
    }
    if(road>0&&road<9&&!water)cells.push(key);
  }
  return cells;
}
