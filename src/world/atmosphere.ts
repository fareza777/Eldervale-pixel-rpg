import type Phaser from 'phaser';
import type { Layout } from './layout';
import { seeded } from './layout';

/** One batched reflection layer; quiet movement without a screen full of particles. */
export class WaterReflections{
  private ink:Phaser.GameObjects.Graphics;
  private glints:{x:number;y:number;phase:number;width:number}[]=[];
  private next=0;
  constructor(private scene:Phaser.Scene,layout:Layout){
    this.ink=scene.add.graphics().setDepth(-989);const random=seeded('water:'+layout.width+':'+layout.water.size);
    for(const k of layout.water)if(random()<.08)this.glints.push({x:k%layout.cols*16+3+random()*8,y:Math.floor(k/layout.cols)*16+5+random()*7,phase:random()*Math.PI*2,width:3+random()*5});
  }
  update(now:number,reduced:boolean){
    if(now<this.next)return;this.next=now+100;this.ink.clear();if(reduced)return;
    const view=this.scene.cameras.main.worldView;
    for(const p of this.glints){if(!view.contains(p.x,p.y))continue;const wave=Math.sin(now*.0012+p.phase),alpha=.07+Math.max(0,wave)*.14;
      this.ink.fillStyle(0xb3cbd4,alpha).fillRect(Math.round(p.x+wave*1.5),p.y,p.width,1);
    }
  }
}
