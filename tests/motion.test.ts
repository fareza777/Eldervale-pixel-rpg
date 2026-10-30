import { describe, expect, it } from 'vitest';
import { HeroMotion, joystickInput } from '../src/world/heroMotion';

describe('responsive portrait movement',()=>{
  it('eases into walking without making gentle input sprint',()=>{
    const m=new HeroMotion();const first=m.step(1,0,48,.016,false);
    expect(first.x).toBeGreaterThan(0);expect(first.x).toBeLessThan(25);
    for(let i=0;i<60;i++)m.step(1,0,48,1/60,false);
    expect(m.x).toBeCloseTo(48,3);
  });
  it('preserves analog walking and matches the reference full run speed',()=>{
    const m=new HeroMotion();for(let i=0;i<60;i++)m.step(.5,0,48,1/60,true);
    expect(m.x).toBeCloseTo(24,3);expect(m.running).toBe(false);
    for(let i=0;i<60;i++)m.step(1,0,48,1/60,true);
    expect(m.x).toBeCloseTo(82,3);expect(m.running).toBe(true);
  });
  it('reaches about 70 percent run speed in 50ms like Dawnbound',()=>{
    const m=new HeroMotion();for(let i=0;i<3;i++)m.step(1,0,48,1/60,true);
    expect(m.x).toBeGreaterThan(82*.68);expect(m.x).toBeLessThan(82*.72);
  });
  it('responds to a reversal within 50ms without an abrupt velocity snap',()=>{
    const m=new HeroMotion();for(let i=0;i<60;i++)m.step(1,0,48,1/60,true);
    const first=m.step(-1,0,48,1/60,true).x;
    expect(first).toBeGreaterThan(0);expect(first).toBeLessThan(40);
    for(let i=0;i<2;i++)m.step(-1,0,48,1/60,true);
    expect(m.x).toBeLessThan(-25);
  });
  it('does not jump in speed across the former walk/run threshold',()=>{
    const a=new HeroMotion(),b=new HeroMotion();
    for(let i=0;i<60;i++){a.step(.919,0,48,1/60,true);b.step(.921,0,48,1/60,true);}
    expect(Math.abs(a.x-b.x)).toBeLessThan(1);
  });
  it('brakes promptly, normalizes diagonal input and clears velocity on pause',()=>{
    const m=new HeroMotion();for(let i=0;i<60;i++)m.step(1,1,48,1/60,false);
    expect(Math.hypot(m.x,m.y)).toBeCloseTo(48,3);
    for(let i=0;i<15;i++)m.step(0,0,48,1/60,false);
    expect(m.x).toBe(0);expect(m.y).toBe(0);
    m.step(1,0,48,.1,false);m.reset();expect(m.x).toBe(0);expect(m.y).toBe(0);
  });
  it('has the same acceleration over equal real time at 30 and 60 fps',()=>{
    const a=new HeroMotion(),b=new HeroMotion();for(let i=0;i<6;i++)a.step(1,0,48,1/30,false);for(let i=0;i<12;i++)b.step(1,0,48,1/60,false);
    expect(a.x).toBeCloseTo(b.x,5);
  });
});

describe('short mobile joystick throw',()=>{
  it('is still in the dead zone and grows continuously from its edge',()=>{
    expect(joystickInput(4,0,34)).toEqual({x:0,y:0});
    const near=joystickInput(4.1,0,34);expect(near.x).toBeGreaterThan(0);expect(near.x).toBeLessThan(.01);
    expect(joystickInput(13,0,34)).toEqual({x:.5,y:0});
  });
  it('reaches full input well before the visible rim and caps long drags',()=>{
    expect(joystickInput(22,0,34)).toEqual({x:1,y:0});
    expect(joystickInput(80,0,34)).toEqual({x:1,y:0});
  });
  it('preserves direction and equal diagonal speed at every portrait size',()=>{
    for(const radius of [28,32.4,34]){
      const diagonal=joystickInput(-radius,-radius,radius);
      expect(Math.hypot(diagonal.x,diagonal.y)).toBeCloseTo(1,8);
      expect(diagonal.x).toBeCloseTo(diagonal.y,8);
      expect(joystickInput(radius*13/34,0,radius).x).toBeCloseTo(.5,8);
    }
    expect(joystickInput(0,0,0)).toEqual({x:0,y:0});
  });
});
