import { describe,expect,it } from 'vitest';
import { CombatAmbience } from '../src/combatAmbience';
describe('environment breathing room in combat',()=>{
  it('smoothly quiets the environment without dropping straight to silence',()=>{
    const a=new CombatAmbience();a.combat=true;a.step(1/60);
    expect(a.gain).toBeGreaterThan(.9);expect(a.gain).toBeLessThan(1);
    for(let i=0;i<120;i++)a.step(1/60);expect(a.gain).toBe(.22);
  });
  it('restores the quiet exploration bed more slowly after danger',()=>{
    const a=new CombatAmbience();a.combat=true;a.step(3);a.combat=false;a.step(.18);
    expect(a.gain).toBeLessThan(.4);expect(a.gain).toBeGreaterThan(.22);
    a.step(8);expect(a.gain).toBe(1);
  });
  it('makes the same gain transition at different frame rates',()=>{
    const a=new CombatAmbience(),b=new CombatAmbience();a.combat=b.combat=true;
    for(let i=0;i<30;i++)a.step(1/60);for(let i=0;i<15;i++)b.step(1/30);
    expect(a.gain).toBeCloseTo(b.gain,8);
  });
});
