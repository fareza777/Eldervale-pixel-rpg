import type Phaser from 'phaser';
import { dirFromVector, type Dir } from './animations';
import { seeded, type ObjectPoint } from './layout';

interface Resident {
  object:ObjectPoint; sprite:Phaser.GameObjects.Sprite; shadow:Phaser.GameObjects.Ellipse;
  marker?:Phaser.GameObjects.Text; skin:string; anchor:{x:number;y:number};
  goal:{x:number;y:number}|null; waitUntil:number; direction:Dir; random:()=>number; speed:number;
}

/** Small, collision-aware walks; residents stop before the player has to chase Talk. */
export class TownResidents {
  readonly list:Resident[]=[];
  constructor(private scene:Phaser.Scene,private walkable:(x:number,y:number)=>boolean){}
  add(object:ObjectPoint,skin:string,sprite:Phaser.GameObjects.Sprite,shadow:Phaser.GameObjects.Ellipse,marker?:Phaser.GameObjects.Text){
    const random=seeded('resident:'+object.id);
    this.list.push({object,skin,sprite,shadow,marker,anchor:{x:object.x,y:object.y},goal:null,
      waitUntil:this.scene.time.now+1200+random()*3200,direction:'down',random,speed:17+random()*4});
  }
  private idle(r:Resident,direction=r.direction){
    r.direction=direction;r.sprite.anims.stop();r.sprite.setFrame(r.skin+'/walk/'+direction+'/1');
  }
  private chooseGoal(r:Resident){
    for(let attempt=0;attempt<10;attempt++){
      const angle=r.random()*Math.PI*2,radius=20+r.random()*24;
      const goal={x:Math.round(r.anchor.x+Math.cos(angle)*radius),y:Math.round(r.anchor.y+Math.sin(angle)*radius)};
      if(this.list.some(other=>other!==r&&Math.hypot(other.sprite.x-goal.x,other.sprite.y-goal.y)<20))continue;
      const dx=goal.x-r.sprite.x,dy=goal.y-r.sprite.y,d=Math.hypot(dx,dy);let clear=d>8;
      for(let step=0;step<=d&&clear;step+=4)clear=this.walkable(r.sprite.x+dx*step/d,r.sprite.y+dy*step/d);
      if(clear&&this.walkable(goal.x,goal.y)){r.goal=goal;return;}
    }
    r.waitUntil=this.scene.time.now+2500;
  }
  update(now:number,dt:number,player:{x:number;y:number}){
    for(const r of this.list){
      const dx=player.x-r.sprite.x,dy=player.y-r.sprite.y;
      if(Math.hypot(dx,dy)<62){
        r.goal=null;r.waitUntil=now+1800;this.idle(r,dirFromVector(dx,dy,r.direction));
      }else if(!r.goal&&now>=r.waitUntil)this.chooseGoal(r);
      if(r.goal){
        const dx=r.goal.x-r.sprite.x,dy=r.goal.y-r.sprite.y,d=Math.hypot(dx,dy),step=Math.min(d,r.speed*dt);
        const x=r.sprite.x+dx/Math.max(1,d)*step,y=r.sprite.y+dy/Math.max(1,d)*step;
        if(d<1||!this.walkable(x,y)||this.list.some(other=>other!==r&&Math.hypot(other.sprite.x-x,other.sprite.y-y)<15)){
          r.goal=null;r.waitUntil=now+2500+r.random()*3500;this.idle(r);
        }else{
          r.direction=dirFromVector(dx,dy,r.direction);r.sprite.setPosition(x,y).play(r.skin+'_walk_'+r.direction,true);
        }
      }
      r.object.x=r.sprite.x;r.object.y=r.sprite.y;
      r.sprite.setDepth(r.sprite.y);r.shadow.setPosition(r.sprite.x,r.sprite.y).setDepth(r.sprite.y-1);
      r.marker?.setPosition(r.sprite.x,r.sprite.y-31).setDepth(r.sprite.y+1);
    }
  }
}
