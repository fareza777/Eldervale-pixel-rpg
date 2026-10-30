import { describe,expect,it } from 'vitest';
import { FloatingJoystick } from '../src/world/floatingJoystick';
import { REGIONS } from '../src/content';
import { isWalkable,makeLayout } from '../src/world/layout';

describe('floating thumb control',()=>{
  it('appears exactly at each touch without moving the hero',()=>{
    const j=new FloatingJoystick();
    for(const [x,y]of [[12,420],[164,300],[75,690]]){
      j.press(x,y);expect([j.x,j.y]).toEqual([x,y]);expect(j.input).toEqual({x:0,y:0});j.reset();
    }
  });
  it('follows a long drag so reversing does not need a trip back to the original touch',()=>{
    const j=new FloatingJoystick();j.press(40,500).move(170,500);
    expect(j.x).toBeCloseTo(137.6);expect(j.input.x).toBe(1);
    j.move(115,500);expect(j.input.x).toBe(-1);expect(j.x).toBeCloseTo(137.6);
  });
  it('retains analog diagonal control and resets cancelled or released touches',()=>{
    const j=new FloatingJoystick();j.press(70,510).move(79,519);
    expect(j.input.x).toBeCloseTo(j.input.y);expect(Math.hypot(j.input.x,j.input.y)).toBeLessThan(.6);
    j.reset();j.move(150,650);expect(j.active).toBe(false);expect(j.input).toEqual({x:0,y:0});
  });
  it('keeps the fixed joystick origin anchored on long drags',()=>{
    const j=new FloatingJoystick();j.floating=false;j.press(72,640).move(160,680);
    expect([j.x,j.y]).toEqual([72,640]);expect(Math.hypot(j.dx,j.dy)).toBeCloseTo(32.4);
    j.move(50,640);expect(j.input.x).toBe(-1);j.reset();expect(j.input.x).toBe(0);
  });
});

describe('guarded roads and solid buildings',()=>{
  it('blocks every outdoor house foundation, including abandoned monster-area houses',()=>{
    for(const r of REGIONS){const l=makeLayout(r.id);for(const p of l.props.filter(p=>p.frame.includes('house'))){
      expect(p.solid,r.id+' '+p.frame).toBeTruthy();expect(isWalkable(l,p.x,p.y-8),r.id+' foundation').toBe(false);
    }}
  });
  it('keeps towns and interiors safe and puts encounters on walkable ground away from arrivals',()=>{
    for(const r of REGIONS){const l=makeLayout(r.id);
      if(r.type==='town'||r.type==='interior'){expect(l.enemies,r.id).toHaveLength(0);continue;}
      expect(l.enemies.length,r.id).toBeGreaterThanOrEqual(r.boss?16:34);
      for(const e of l.enemies){
        expect(isWalkable(l,e.x,e.y),r.id+' '+e.id).toBe(true);
        expect(Math.hypot(e.x-l.spawn.x,e.y-l.spawn.y),r.id+' arrival').toBeGreaterThan(172);
        for(const o of l.objects.filter(o=>o.kind==='exit'))expect(Math.hypot(e.x-o.x,e.y-o.y),r.id+' exit').toBeGreaterThan(88);
      }
    }
  });
  it('keeps guardian courts clear until the staged reveal and is deterministic for saved journeys',()=>{
    for(const r of REGIONS.filter(r=>r.boss)){
      const l=makeLayout(r.id);expect(l.boss).toBeTruthy();
      expect(l.enemies.every(e=>e.y>l.boss!.trigger.y+48),r.id).toBe(true);
      expect(makeLayout(r.id).enemies).toEqual(l.enemies);
    }
  });
});
