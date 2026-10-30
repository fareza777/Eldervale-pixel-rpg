import { describe,expect,it } from 'vitest';
import { followBlend,segmentDistanceSquared,worldDisplay } from '../src/world/display';

describe('portrait render precision and frame rate independence',()=>{
  it('keeps the same playable world on standard and high density Android screens',()=>{
    const low=worldDisplay(390,844,1),high=worldDisplay(390,844,3.5);
    expect(high.width/high.zoom).toBe(low.width/low.zoom);expect(high.height/high.zoom).toBe(low.height/low.zoom);
    expect(high.width*high.cssZoom).toBe(390);expect(high.height*high.cssZoom).toBe(844);
    expect(high.density).toBe(2);
  });
  it('follows by the same amount over a second at 30, 60 and 120 fps',()=>{
    const run=(fps:number)=>{let x=0;for(let i=0;i<fps;i++)x+=(100-x)*followBlend(1/fps);return x;};
    expect(run(30)).toBeCloseTo(run(60),8);expect(run(120)).toBeCloseTo(run(60),8);
    expect(followBlend(0)).toBe(0);
  });
  it('detects a target passed by a fast arrow between rendered frames',()=>{
    expect(segmentDistanceSquared(0,0,32,0,16,3)).toBe(9);
    expect(segmentDistanceSquared(0,0,32,0,16,20)).toBe(400);
  });
  it('clamps a projectile segment at both endpoints and handles no movement',()=>{
    expect(segmentDistanceSquared(10,0,20,0,0,0)).toBe(100);
    expect(segmentDistanceSquared(10,0,20,0,30,0)).toBe(100);
    expect(segmentDistanceSquared(10,10,10,10,13,14)).toBe(25);
  });
});
