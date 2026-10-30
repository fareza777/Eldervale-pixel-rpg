/** Dawnbound runs at 82 world pixels/s; preserve our gentler 48px/s walk. */
export const RUN_SPEED_RATIO=82/48;

/** Short thumb throw, with the reference's 4px dead zone and 22px full input. */
export function joystickInput(dx:number,dy:number,radius:number){
  const length=Math.hypot(dx,dy),dead=radius*4/34,full=radius*22/34;
  if(length<=dead||radius<=0)return{x:0,y:0};
  const magnitude=Math.min(1,(length-dead)/(full-dead));
  return{x:dx/length*magnitude,y:dy/length*magnitude};
}

/** Velocity in world pixels/second, independent of screen scale and frame rate. */
export class HeroMotion {
  x=0; y=0; running=false;
  reset(){this.x=0;this.y=0;this.running=false;}
  step(x:number,y:number,speed:number,dt:number,run:boolean){
    const length=Math.hypot(x,y),magnitude=Math.min(1,length);if(length>1){x/=length;y/=length;}
    // Blend the outer part of the analog throw into run; no threshold speed jump.
    const t=run?Math.max(0,(magnitude-.6)/.4):0,blend=t*t*(3-2*t);
    const targetSpeed=speed*(1+(RUN_SPEED_RATIO-1)*blend),tx=x*targetSpeed,ty=y*targetSpeed;
    // Reference response: 70% in 50ms, quicker braking, quick smooth reversals.
    const response=1-Math.exp(-(length<.01?30:24)*Math.max(0,dt));
    this.x+=(tx-this.x)*response;this.y+=(ty-this.y)*response;
    if(Math.hypot(this.x,this.y)<.5&&length<.01){this.x=0;this.y=0;}
    this.running=run&&Math.hypot(this.x,this.y)>speed*(this.running?.9:1.05);
    return this;
  }
}
