import { describe,expect,it } from 'vitest';
import { GameStore } from '../src/core/store';
class Storage{
  data=new Map<string,string>();getItem(k:string){return this.data.get(k)??null;}
  setItem(k:string,v:string){this.data.set(k,v);}removeItem(k:string){this.data.delete(k);}
}
describe('saved control and animation preferences',()=>{
  it('adds floating controls and classic strikes to older saves without changing their audio choices',()=>{
    const storage=new Storage();storage.setItem('eldervale.settings',JSON.stringify({ambience:.2,sfx:.7,voice:.8,difficulty:'heroic'}));
    const s=new GameStore(storage);expect(s.settings.joystickMode).toBe('floating');expect(s.settings.attackStyle).toBe('classic');
    expect(s.settings.ambience).toBe(.2);expect(s.settings.difficulty).toBe('heroic');
  });
  it('restores fixed controls, animation and accessibility choices on the next launch',()=>{
    const storage=new Storage(),s=new GameStore(storage);
    s.updateSettings({joystickMode:'fixed',controlSize:'large',controlOpacity:.7,attackStyle:'whirl',aimAssist:false,autoRun:false,hitEffects:'subtle'});
    const next=new GameStore(storage);expect(next.settings).toEqual(s.settings);
  });
  it('rejects invalid modes and clamps imported visibility to a readable range',()=>{
    const storage=new Storage();storage.setItem('eldervale.settings',JSON.stringify({joystickMode:'hovercraft',controlSize:'enormous',attackStyle:'unknown',controlOpacity:-5,autoRun:'yes'}));
    const s=new GameStore(storage);expect(s.settings.joystickMode).toBe('floating');expect(s.settings.controlSize).toBe('standard');
    expect(s.settings.attackStyle).toBe('classic');expect(s.settings.controlOpacity).toBe(.65);expect(s.settings.autoRun).toBe(true);
  });
});
