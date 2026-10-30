import { joystickInput } from './heroMotion';

/** A short analog throw whose origin follows long thumb drags. Coordinates are CSS pixels. */
export class FloatingJoystick {
  active=false;
  x=0; y=0; dx=0; dy=0;
  input={x:0,y:0};
  floating=true;
  constructor(public radius=32.4) {}
  press(x:number,y:number){this.active=true;this.x=x;this.y=y;this.dx=0;this.dy=0;this.input={x:0,y:0};return this;}
  move(x:number,y:number){
    if(!this.active)return this;
    let dx=x-this.x,dy=y-this.y;
    const length=Math.hypot(dx,dy);
    if(length>this.radius){
      const overflow=1-this.radius/length;
      if(this.floating){this.x+=dx*overflow;this.y+=dy*overflow;dx=x-this.x;dy=y-this.y;}
      else{dx*=this.radius/length;dy*=this.radius/length;}
    }
    this.dx=dx;this.dy=dy;this.input=joystickInput(dx,dy,this.radius);return this;
  }
  reset(){this.active=false;this.dx=0;this.dy=0;this.input={x:0,y:0};}
}
