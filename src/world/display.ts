/** A world pixel is always two CSS pixels; high density screens get a sharper backing canvas. */
export function worldDisplay(width:number,height:number,dpr=1){
  const density=dpr>=1.5?2:1;
  return {width:Math.max(1,Math.round(width*density)),height:Math.max(1,Math.round(height*density)),density,zoom:2*density,cssZoom:1/density};
}
export function followBlend(seconds:number){return 1-Math.pow(.88,Math.max(0,seconds)*60);}

/** Swept collision catches arrows between frames, including slower Android frames. */
export function segmentDistanceSquared(ax:number,ay:number,bx:number,by:number,x:number,y:number){
  const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;
  return (x-ax-dx*t)**2+(y-ay-dy*t)**2;
}
