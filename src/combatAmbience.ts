/** Quiet the environment during nearby danger, then restore it without an audible volume step. */
export class CombatAmbience {
  gain=1;
  combat=false;
  step(seconds:number){
    const target=this.combat?.22:1,tau=this.combat?.18:.9;
    this.gain+=(target-this.gain)*(1-Math.exp(-Math.max(0,seconds)/tau));
    if(Math.abs(this.gain-target)<.001)this.gain=target;
    return this.gain;
  }
  get settled(){return this.gain===(this.combat?.22:1);}
}
