import Phaser from 'phaser';
import { CLASSES, ENEMIES, ITEMS, NPCS, QUESTS, regionById } from '../content';
import { GameStore, statsFor } from '../core/store';
import { applyLoot, rollChest, rollEnemyDrops, type Loot } from '../core/loot';
import type { EnemyDef } from '../core/types';
import type { AudioManager } from '../audio';
import { dirFromVector, registerAnimations, type Dir } from './animations';
import { registerGroundPivots } from './grounding';
import { isWalkable, makeLayout, seeded, type Layout, type ObjectPoint } from './layout';
import { currentTrackedQuest, groundRoute, questGoal } from './navigation';
import { createFxTextures } from './fxTextures';
import { createTerrain, terrainVariant, createRoadVergeAtlas } from './terrain';
import { drawSurfaceDetails } from './surfaces';
import { GUARDIAN_VOICES } from '../narrative';
import { assetScale } from './assetDensity';
import { TownResidents } from './residents';
import { HeroMotion, RUN_SPEED_RATIO } from './heroMotion';
import { followBlend, segmentDistanceSquared, worldDisplay } from './display';
import { WaterReflections } from './atmosphere';
import { tactile } from '../platform';

interface EnemyActor { def:EnemyDef; sprite:Phaser.GameObjects.Sprite; shadow:Phaser.GameObjects.Ellipse; bar:Phaser.GameObjects.Rectangle; hp:number; maxHp:number; attackAt:number; cooldown:number; target:{x:number;y:number}|null; phase:boolean; staggerUntil:number; knockback:{x:number;y:number;left:number}|null; charge:{x:number;y:number;left:number}|null; damageLabel?:Phaser.GameObjects.Text; damageAt?:number; damageTotal?:number; recoil?:Phaser.Tweens.Tween; baseScale?:number; flashUntil?:number; tell?:Phaser.GameObjects.Image; home:{x:number;y:number}; patrol:{x:number;y:number}|null; patrolAt:number; patrolStep:number; }
interface Projectile { sprite:Phaser.GameObjects.Image; vx:number; vy:number; hostile:boolean; damage:number; life:number; }
export interface WorldHud { nearby:ObjectPoint|null; x:number; y:number; boss:{name:string;hp:number;max:number}|null; skill:number; dodge:number; running:boolean; guidance:{label:string;angle:number;distance:number;quest:string}|null; loot:Loot|null; reveal:{title:string;line:string}|null; zone:string; }

export class WorldScene extends Phaser.Scene {
  player!:Phaser.GameObjects.Sprite;
  layout!:Layout;
  nearby:ObjectPoint|null=null;
  ready=false;
  mobile={x:0,y:0};
  attackHeld=false;
  running=false;
  private currentRegion='';
  private lastCombatAt=-10000;
  private actors:EnemyActor[]=[];
  private shots:Projectile[]=[];
  private objectSprites=new Map<string,Phaser.GameObjects.GameObject[]>();
  private residents!:TownResidents;
  private motion=new HeroMotion();
  private keys!:Record<string,Phaser.Input.Keyboard.Key>;
  private direction:Dir='down';
  private destination:{x:number;y:number}|null=null;
  private nextAttack=0;
  private nextSkill=0;
  private nextDodge=0;
  private actionUntil=0;
  private invulnerable=0;
  private dashUntil=0;
  private dashVector={x:0,y:1};
  private trailAt=0;
  private hudAt=0;
  private routeAt=0;
  private travelAt=0;
  private combo=0;
  private lastStrike=0;
  private actionToken=0;
  private regionToken=0;
  private queuedAttackUntil=0;
  private lunge:{x:number;y:number;left:number}|null=null;
  private hitSoundAt=0;
  private pendingStrike:{token:number;epoch:number;animation:string;frame:number;apply:()=>void}|null=null;
  private impactPauseUntil=0;
  private lastImpactPause=0;
  private cameraLead={x:0,y:-24};
  private waterReflections!:WaterReflections;
  private playerShadow!:Phaser.GameObjects.Ellipse;
  private halo!:Phaser.GameObjects.Image;
  private guidance:WorldHud['guidance']=null;
  private receipt:Loot|null=null;
  private receiptUntil=0;
  private reveal:WorldHud['reveal']=null;
  private cinematicUntil=0;
  private bossStarted=false;
  constructor(private store:GameStore,private audio:AudioManager,private dialogue:(target:string)=>void,private hud:(data:WorldHud)=>void){super('World');}
  preload(){
    for(const a of ['heroes','actors','monsters','battlers','props','furniture','flora'])this.load.atlas(a,'/assets/pack/'+a+'.png','/assets/pack/'+a+'.json');
    this.load.spritesheet('tiles','/assets/pack/tiles.png',{frameWidth:16,frameHeight:16});
    this.load.atlas('landmarks','/assets/art/world-landmarks-v1.png','/assets/art/world-landmarks-v1.json');
    this.load.on('loaderror',(file:Phaser.Loader.File)=>this.store.notice('Could not load asset: '+file.key));
  }
  create(){
    registerGroundPivots(this);registerAnimations(this);createFxTextures(this);createTerrain(this);
    this.textures.get('landmarks').setFilter(Phaser.Textures.FilterMode.LINEAR);
    const canvas=this.textures.createCanvas('glow',128,128)!;
    const ctx=canvas.context,g=ctx.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(255,207,125,.45)');g.addColorStop(.4,'rgba(255,207,125,.12)');g.addColorStop(1,'rgba(255,207,125,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);canvas.refresh();
    this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,Q,E,SHIFT,R') as Record<string,Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-E',()=>this.interact());this.input.keyboard!.on('keydown-Q',()=>this.skill());this.input.keyboard!.on('keydown-SHIFT',()=>this.dodge());this.input.keyboard!.on('keydown-R',()=>{if(!this.isPaused()&&this.store.use('potion'))this.audio.sfx('potion');});
    this.scale.on('resize',()=>this.resizeCamera());
    this.loadRegion();this.ready=true;
  }
  private isPaused(){return this.store.paused||document.hidden||!this.player||!this.store.state;}
  private resizeCamera(){
    if(!this.player)return;
    const density=worldDisplay(1,1,window.devicePixelRatio).density;
    this.cameras.main.setZoom(2*density).setBounds(0,-24,this.layout.width,this.layout.height+120).startFollow(this.player,false,.12,.12).setFollowOffset(this.cameraLead.x,this.cameraLead.y);
  }
  loadRegion(){
    this.audio.setCombat(false);this.lastCombatAt=-10000;
    this.motion.reset();
    this.actionToken++;this.regionToken++;this.queuedAttackUntil=0;this.lunge=null;this.pendingStrike=null;this.impactPauseUntil=0;this.cameraLead={x:0,y:-24};
    this.tweens.killAll();this.time.removeAllEvents();this.children.removeAll(true);this.actors=[];this.shots=[];this.objectSprites.clear();this.destination=null;this.nearby=null;
    this.residents=new TownResidents(this,(x,y)=>this.walkable(x,y));
    this.actionUntil=0;this.dashUntil=0;this.bossStarted=false;this.cinematicUntil=0;this.reveal=null;this.receipt=null;this.routeAt=0;this.travelAt=this.time.now+300;
    const r=regionById(this.store.s.region);this.currentRegion=r.id;this.layout=makeLayout(r.id);
    const l=this.layout,random=seeded(r.id+':ground'),rt=this.add.renderTexture(0,0,l.width,l.height).setOrigin(0).setDepth(-1000);
    const backdrop=this.make.graphics({},false);backdrop.fillStyle(l.bounded?0x11131d:0x45474e).fillRect(0,0,l.width,l.height);rt.draw(backdrop);backdrop.destroy();
    const base=r.theme==='ice'?3:r.theme==='gold'?2:r.theme==='marsh'?4:0;
    const floor=r.type==='interior'?5:r.type==='dungeon'?(r.theme==='ice'?4:r.theme==='gold'?9:r.theme==='forest'?1:8):r.type==='town'?1:2;
    // Enclosed spaces are lit only by their lanterns, so the floor itself is drawn in half-light.
    const shade=r.type==='dungeon'?0xa9b0c6:r.type==='interior'?0xb8b6c2:0xffffff;
    const verges=createRoadVergeAtlas(this,l,base,floor);
    rt.beginDraw();
    for(let y=0;y<l.rows;y++)for(let x=0;x<l.cols;x++){
      const k=y*l.cols+x,path=l.paths.has(k),water=l.water.has(k),wall=l.walls.has(k);
      if(l.bounded&&!path&&!wall&&!water)continue;
      if(verges?.frames.has(k))rt.batchDrawFrame(verges.key,String(k),x*16,y*16,1,shade);
      else rt.batchDrawFrame('terrain',terrainVariant(wall?7:water?6:path?floor:base,x,y),x*16,y*16,1,shade);
    }rt.endDraw();
    drawSurfaceDetails(this,l,r);
    this.waterReflections=new WaterReflections(this,l);
    if(l.boss){const ritual=this.add.graphics().setDepth(-990);ritual.lineStyle(2,0xb9a675,.4).strokeCircle(l.boss.x,l.boss.y+8,64);ritual.lineStyle(1,0xb9a675,.2).strokeCircle(l.boss.x,l.boss.y+8,52);for(let i=0;i<8;i++){const a=i*Math.PI/4;ritual.lineBetween(l.boss.x+Math.cos(a)*53,l.boss.y+8+Math.sin(a)*53,l.boss.x+Math.cos(a)*62,l.boss.y+8+Math.sin(a)*62);}}
    for(const p of l.props){
      const texture=p.texture??'props';if(!this.textures.get(texture).has(p.frame))continue;
      const sprite=this.add.sprite(p.x,p.y,texture,p.frame).setOrigin(.5,p.ground?.5:1).setDepth(p.ground?-980:p.y).setScale((p.scale??1)*assetScale(texture));
      if(p.width)sprite.setDisplaySize(p.width,p.width*sprite.frame.height/sprite.frame.width);
      if(!p.ground&&!p.frame.includes('house'))this.add.ellipse(p.x,p.y-.6,texture==='furniture'?sprite.displayWidth*.72:p.solid?.w??10,texture==='furniture'?3:2.5,0x10111a,.3).setDepth(p.y-.3);
      if(p.tint)sprite.setTint(p.tint);else if(shade!==0xffffff)sprite.setTint(shade);const anim=p.frame.substring(0,p.frame.lastIndexOf('/')).replaceAll('/','_');if(this.anims.exists(anim))sprite.play(anim);
      if(p.light){const lit=r.type==='dungeon'?.75:r.type==='interior'?.65:.55;const light=this.add.image(p.x,p.y-14,'glow').setBlendMode('ADD').setScale(r.type==='interior'?.7:.8).setAlpha(lit).setDepth(950);if(!this.store.settings.reducedMotion)this.tweens.add({targets:light,alpha:lit*.7,duration:1800+random()*1300,yoyo:true,repeat:-1});}
    }
    if(!this.store.settings.reducedMotion){
      const snow=r.theme==='ice',spore=r.theme==='marsh'&&r.type!=='interior',leaf=r.theme==='forest'&&r.type!=='dungeon';
      const flake=snow?'fx_spark':spore?'proj_spore':leaf?'fx_leaf':'fx_spark';
      const motes=snow?0xdbe6ff:spore?0xb2c39c:leaf?0xc9b47b:r.theme==='gold'?0xe2bd7d:0xb9bfd0;
      this.add.particles(0,0,flake,{emitZone:{type:'random',source:new Phaser.Geom.Rectangle(0,0,l.width,l.height) as unknown as Phaser.Types.GameObjects.Particles.RandomZoneSource},lifespan:{min:5200,max:11000},speedX:{min:-7,max:7},speedY:{min:3,max:snow?16:10},scale:{start:snow?.38:.3,end:snow?.24:.16},alpha:{start:.32,end:0},frequency:snow?260:520,quantity:1,tint:motes,blendMode:'ADD'}).setDepth(960);
    }
    for(const o of l.objects)this.drawObject(o);for(const e of l.enemies)this.spawnEnemy(e.id,e.x,e.y);
    let position=this.store.s.position;
    if(!this.walkable(position.x,position.y)){position=l.spawn;this.store.s.position={...position};}
    this.playerShadow=this.add.ellipse(position.x,position.y,15,4,0x070b15,.5);
    this.player=this.add.sprite(position.x,position.y,'heroes',CLASSES[this.store.s.discipline].sprite+'/walk/'+this.direction+'/0');
    this.player.on(Phaser.Animations.Events.ANIMATION_UPDATE,(animation:Phaser.Animations.Animation,frame:Phaser.Animations.AnimationFrame)=>{
      const p=this.pendingStrike;if(p?.animation===animation.key&&frame.index>=p.frame)this.resolveStrike();
    });
    this.player.on(Phaser.Animations.Events.ANIMATION_COMPLETE,(animation:Phaser.Animations.Animation)=>{
      if(this.pendingStrike?.animation===animation.key)this.resolveStrike();
    });
    this.halo=this.add.image(this.player.x,this.player.y-10,'glow').setBlendMode('ADD').setScale(.35).setDepth(980).setAlpha(.25);
    this.resizeCamera();this.cameras.main.fadeIn(this.store.settings.reducedMotion?0:220,10,14,24);
    this.audio.ambience(r.ambience);this.store.notice(r.name);
  }
  private drawObject(o:ObjectPoint){
    const objects:Phaser.GameObjects.GameObject[]=[],collected=this.store.s.collected.includes(o.id);
    if(collected&&!['npc','exit','house','camp','ward','chest'].includes(o.kind))return;
    if(['npc','cat','event'].includes(o.kind))objects.push(this.add.ellipse(o.x,o.y,o.kind==='cat'?9:14,4,0x0c101a,.36).setDepth(o.y-1));
    if(o.kind==='npc'){
      const n=NPCS.find(n=>n.id===o.target);if(!n)return;
      const sprite=this.add.sprite(o.x,o.y,'actors',n.sprite+'/walk/down/1').setDepth(o.y);
      objects.push(sprite);let marker:Phaser.GameObjects.Text|undefined;
      if(n.quest?.some(id=>!this.store.s.quests[id]||this.store.s.quests[id].status==='ready')||n.id==='lyra'){marker=this.add.text(o.x,o.y-31,'◇',{fontSize:'11px',color:'#e5c272',stroke:'#15202a',strokeThickness:2}).setOrigin(.5).setDepth(o.y+1);objects.push(marker);}
      if(regionById(this.currentRegion).type==='town')this.residents.add(o,n.sprite,sprite,objects[0] as Phaser.GameObjects.Ellipse,marker);
    }else if(o.kind==='exit'||o.kind==='house'){
      // Doors and the physical ends of roads are the interaction surfaces.
    }else if(o.kind==='cat')objects.push(this.add.sprite(o.x,o.y,'actors','cat1/walk/down/1').setDepth(o.y),this.add.rectangle(o.x,o.y-5,7,2,0xb96458).setDepth(o.y+.1));
    else if(o.kind==='event')objects.push(this.add.sprite(o.x,o.y,'actors','npc17/walk/down/1').setDepth(o.y),this.add.text(o.x,o.y-31,'?',{color:'#e6bd6e',fontSize:'11px',stroke:'#15202a',strokeThickness:2}).setOrigin(.5).setDepth(o.y+1));
    else if(o.frame&&this.textures.get(o.texture??'props').has(o.frame)){
      const texture=o.texture??'props';
      const sprite=this.add.sprite(o.x,o.y,texture,o.frame).setOrigin(.5,1).setDepth(o.y).setScale(assetScale(texture));
      if(o.kind==='chest'&&collected){const anim='chest_chest_01';if(this.anims.exists(anim))sprite.setFrame(this.anims.get(anim).frames.at(-1)!.textureFrame);}
      if(o.kind==='ward')sprite.setTint(collected?0xf4d68d:0xadb9d1);
      objects.push(sprite);if(!collected)objects.push(this.add.circle(o.x,o.y-17,1.5,0xe4c87b,.8).setDepth(o.y+1));
    }this.objectSprites.set(o.id,objects);
  }
  dismissObject(id:string){for(const s of this.objectSprites.get(id)??[])s.destroy();this.objectSprites.delete(id);this.nearby=null;}
  private spawnEnemy(id:string,x:number,y:number){
    const original=ENEMIES[id];if(!original||original.boss&&this.store.s.defeated.includes(id))return;
    const level=Math.max(0,regionById(this.currentRegion).level-1);
    const def={...original,hp:Math.round(original.hp*(1+level*(original.boss?.16:.14))),atk:Math.round(original.atk*(1+level*(original.boss?.10:.08)))};
    const bossFrames:Record<string,string>={rootwarden:'b/MinotaurA',archivist:'b/BlackMagusB',glasskeeper:'b/GeniusA',hollowking:'b/BlackMagusA'};
    const sprite=this.add.sprite(x,y,def.boss?'battlers':'monsters',def.boss?bossFrames[id]:def.sprite+'/down/0').setDepth(y);if(def.boss)sprite.setScale(.8);
    const shadow=this.add.ellipse(x,y,def.boss?40:14,def.boss?7:4,0x0c121a,.4).setDepth(y-1);
    const bar=this.add.rectangle(x,y-(def.boss?66:26),def.boss?45:19,2,def.boss?0xdcb76c:0xbaa16d).setDepth(900).setVisible(false);
    this.actors.push({def,sprite,shadow,bar,hp:def.hp,maxHp:def.hp,attackAt:0,cooldown:this.time.now+900,target:null,phase:false,staggerUntil:0,knockback:null,charge:null,home:{x,y},patrol:null,patrolAt:this.time.now+700+(x*7+y*3)%1700,patrolStep:0});
  }
  private walkable(x:number,y:number){return isWalkable(this.layout,x,y);}
  private travel(o:ObjectPoint){
    if(this.time.now<this.travelAt)return;this.travelAt=this.time.now+1500;
    const next=makeLayout(o.target),back=next.objects.find(p=>p.kind==='exit'&&p.target===this.currentRegion);
    let position=next.spawn;if(back){const direction=back.axis==='down'?{x:0,y:-1}:back.axis==='up'?{x:0,y:1}:back.axis==='right'?{x:-1,y:0}:{x:1,y:0};position={x:back.x+direction.x*48,y:back.y+direction.y*48};}
    if(this.store.travel(o.target,position)){this.audio.sfx('door');this.destination=null;}
  }
  interact(){
    if(this.isPaused()||this.time.now<this.cinematicUntil||!this.nearby)return;
    const o=this.nearby;this.destination=null;
    if(o.kind==='npc'){if(o.target==='lyra'&&this.store.mainIndex<9){this.store.notice('Release the Hollow King to reach Lyra.');return;}this.direction=dirFromVector(o.x-this.player.x,o.y-this.player.y);this.store.emit('talk',o.target);this.dialogue(o.target);this.audio.sfx('ui_page');return;}
    if(o.kind==='house'){this.travel(o);return;}
    if(o.kind==='camp'){this.store.rest();this.audio.sfx('campfire');return;}
    if(o.kind==='event'){this.dialogue('event:'+o.id);return;}
    if(this.store.s.collected.includes(o.id))return;this.store.s.collected.push(o.id);
    if(o.kind==='herb'||o.kind==='ore'){this.store.addItem(o.target);this.store.emit('gather',o.target);this.receipt={gold:0,items:[{item:o.target,count:1}]};this.receiptUntil=this.time.now+2400;}
    else if(o.kind==='chest'){
      const loot=rollChest(regionById(this.currentRegion).level);this.store.s.gold+=loot.gold;applyLoot(this.store.s.items,loot.items);this.receipt=loot;this.receiptUntil=this.time.now+3200;
      const chest=this.objectSprites.get(o.id)?.find(s=>s instanceof Phaser.GameObjects.Sprite) as Phaser.GameObjects.Sprite|undefined;chest?.play('chest_chest_01');
      this.audio.sfx('chest_open');this.nearby=null;this.store.save();this.store.changed();return;
    }else if(o.kind==='ward'){
      this.store.emit('interact',o.target);this.store.addXp(35);this.store.notice(o.story??'Ward restored.');
      this.effect('fx_ring_hd',o.x,o.y,0xe8cb83,.6,450);this.dismissObject(o.id);this.drawObject(o);this.audio.sfx('ice_burst');this.store.save();this.store.changed();return;
    }else{
      this.store.emit('interact',o.target);this.store.addXp(o.kind==='observatory'?35:25);
      this.store.notice(o.story??(o.kind==='cat'?'Miso returns home.':o.kind==='memory'?'A lost page returns.':o.kind==='bell'?'The beacon remembers.':o.kind==='observatory'?'A star appears beyond the veil.':'A letter rescued from the water.'));
    }
    this.dismissObject(o.id);this.audio.sfx('coin');this.store.save();this.store.changed();
    if(o.kind==='memory')this.dialogue('memory:'+this.currentRegion);
  }
  private pose(kind:string,lock:number){
    const sprite=CLASSES[this.store.s.discipline].sprite,key=sprite+'_'+kind+(kind==='spin'?'':'_'+this.direction);
    if(this.anims.exists(key)){this.player.play(key);this.player.anims.timeScale=this.anims.get(key).duration/lock;}
    this.actionUntil=this.time.now+lock;return key;
  }
  private nearestEnemy(range=240){return this.actors.filter(e=>e.hp>0&&Math.hypot(e.sprite.x-this.player.x,e.sprite.y-this.player.y)<range).sort((a,b)=>Math.hypot(a.sprite.x-this.player.x,a.sprite.y-this.player.y)-Math.hypot(b.sprite.x-this.player.x,b.sprite.y-this.player.y))[0];}
  private clearTell(e:EnemyActor){e.tell?.destroy();e.tell=undefined;}
  private showTell(e:EnemyActor,radius:number,duration:number){
    this.clearTell(e);
    const ring=this.add.image(e.sprite.x,e.sprite.y-1,'fx_ring_hd').setTint(0xd87952).setBlendMode('ADD').setAlpha(.45).setScale(radius/64*.45).setDepth(e.sprite.y-1);
    this.tweens.add({targets:ring,scaleX:radius/64,scaleY:radius/64,alpha:.85,duration,ease:'Sine.In'});
    e.tell=ring;
  }
  private actionPlaying(){return this.player.anims.isPlaying&&/_(attack|bow|throw|spin)(_|$)/.test(this.player.anims.currentAnim?.key??'');}
  private resolveStrike(){
    const p=this.pendingStrike;if(!p)return;this.pendingStrike=null;
    if(p.token===this.actionToken&&p.epoch===this.regionToken&&!this.isPaused()&&this.currentRegion===this.store.s.region)p.apply();
  }
  cancelAction(){this.actionToken++;this.queuedAttackUntil=0;this.lunge=null;this.actionUntil=0;this.pendingStrike=null;this.impactPauseUntil=0;this.player?.anims.resume();}
  attack(target?:EnemyActor,buffer=true){
    const now=this.time.now;if(this.isPaused()||now<this.dashUntil||now<this.cinematicUntil)return;
    if(now<this.nextAttack||this.actionPlaying()){if(buffer&&this.nextAttack-now<170)this.queuedAttackUntil=now+200;return;}
    this.queuedAttackUntil=0;const token=++this.actionToken,epoch=this.regionToken;
    const discipline=this.store.s.discipline,stats=statsFor(this.store.s),closest=target??(this.store.settings.aimAssist?this.nearestEnemy(discipline==='warden'?70:240):undefined);
    if(closest)this.direction=dirFromVector(closest.sprite.x-this.player.x,closest.sprite.y-this.player.y,this.direction);
    this.combo=now-this.lastStrike<1100?(this.combo+1)%3:0;this.lastStrike=now;
    const heavy=discipline==='warden'&&this.combo===2,spin=heavy&&this.store.settings.attackStyle==='whirl';this.nextAttack=now+(discipline==='arcanist'?420:discipline==='ranger'?400:heavy?400:350);
    const animation=this.pose(discipline==='ranger'?'bow':discipline==='arcanist'?'throw':spin?'spin':'attack',discipline==='ranger'?360:300);
    if(discipline==='warden'&&closest&&Math.hypot(closest.sprite.x-this.player.x,closest.sprite.y-this.player.y)>25){const v=this.dirVector();this.lunge={x:v.x*(heavy?100:70),y:v.y*(heavy?100:70),left:.085};}
    this.audio.sfx(discipline==='ranger'?'bow':discipline==='arcanist'?'cast':spin?'spin':'swing');
    this.pendingStrike={token,epoch,animation,frame:discipline==='ranger'?4:spin?2:3,apply:()=>{
      if(discipline!=='warden'){
        const aim=closest?.hp&&closest.sprite.active?{x:closest.sprite.x-this.player.x,y:closest.sprite.y-this.player.y}:this.dirVector();
        this.projectile(this.player.x,this.player.y-8,Math.atan2(aim.y,aim.x),discipline==='ranger'?310:245,false,stats.atk,discipline==='ranger'?0xe1cc92:0xaccde9);
      }else{
        const facing=this.dirVector(),angle=Math.atan2(facing.y,facing.x);
        this.slash(this.player.x,this.player.y-7,angle,heavy?43:33,heavy?0xf4d6a3:0xf6e5bc,spin);
        for(const e of this.actors){const dx=e.sprite.x-this.player.x,dy=e.sprite.y-this.player.y,d=Math.hypot(dx,dy);if(e.hp>0&&d<(e.def.boss?62:heavy?50:44)&&(spin||d<15||(dx*facing.x+dy*facing.y)/d>-.15))this.hitEnemy(e,Math.round(stats.atk*(heavy?1.18:1)),heavy);}
      }
    }};
  }
  private slash(x:number,y:number,angle:number,radius:number,tint:number,spin=false){
    for(const offset of spin?[0,Math.PI]:[0]){
      const arc=this.add.image(x,y,'fx_slash_hd').setTint(tint).setDepth(y+45).setScale(radius/46).setRotation(angle+offset-.38).setAlpha(.9);
      this.tweens.add({targets:arc,rotation:angle+offset+(spin?Math.PI*1.5:.42),duration:spin?240:115,ease:'Cubic.Out'});
      this.tweens.add({targets:arc,alpha:0,delay:spin?110:55,duration:150,onComplete:()=>arc.destroy()});
    }
  }
  private impact(x:number,y:number,heavy:boolean,angle:number){
    const tint=this.store.s.discipline==='arcanist'?0xbddfff:this.store.s.discipline==='ranger'?0xf5ebcd:heavy?0xffd797:0xffedcf;
    this.effect('fx_hit_core',x,y,tint,heavy?.55:.4,110);
    const cut=this.add.image(x,y,'fx_hit_blade').setRotation(angle-.65).setTint(tint).setBlendMode('ADD').setScale(heavy?.56:.4).setDepth(994);
    this.tweens.add({targets:cut,scaleX:heavy?.85:.66,scaleY:.18,alpha:0,duration:145,ease:'Cubic.Out',onComplete:()=>cut.destroy()});
    const restrained=this.store.settings.reducedMotion||this.store.settings.hitEffects==='subtle';
    if(heavy&&!restrained)this.effect('fx_star_hd',x,y,tint,.24,150).setRotation(angle+.2);
    const n=restrained?2:heavy?7:5;
    for(let i=0;i<n;i++){
      const a=angle+(i-(n-1)/2)*.65,length=(heavy?23:15)+(i%3)*4;
      const spark=this.add.image(x,y,'fx_hit_shard').setTint(i%2?tint:0xffffff).setRotation(a).setBlendMode('ADD').setScale(.25+(i%3)*.06,.25).setDepth(995);
      this.tweens.add({targets:spark,x:x+Math.cos(a)*length,y:y+Math.sin(a)*length,alpha:0,scaleX:.06,scaleY:.07,duration:160+i*13,ease:'Cubic.Out',onComplete:()=>spark.destroy()});
    }
  }
  private effect(key:string,x:number,y:number,tint:number,scale:number,duration:number){
    const fx=this.add.image(x,y,key).setTint(tint).setBlendMode('ADD').setScale(scale).setDepth(990);
    this.tweens.add({targets:fx,scaleX:scale*1.6,scaleY:scale*1.6,alpha:0,duration,onComplete:()=>fx.destroy()});return fx;
  }
  skill(){
    const now=this.time.now;if(this.isPaused()||now<this.nextSkill||now<this.dashUntil||now<this.cinematicUntil)return;
    if(this.store.s.mana<20){this.store.notice('Low mana. Use Aether Dew.');return;}
    this.store.s.mana-=20;this.nextSkill=now+6000;this.nextAttack=now+620;const discipline=this.store.s.discipline,stats=statsFor(this.store.s),target=this.store.settings.aimAssist?this.nearestEnemy():undefined;
    if(target)this.direction=dirFromVector(target.sprite.x-this.player.x,target.sprite.y-this.player.y);
    const token=++this.actionToken,epoch=this.regionToken;this.queuedAttackUntil=0;this.pendingStrike=null;
    this.pose(discipline==='warden'?'spin':discipline==='ranger'?'bow':'throw',discipline==='warden'?400:440);this.audio.skillVoice(discipline);
    const x=this.player.x,y=this.player.y;this.effect('fx_star_hd',x,y-8,discipline==='arcanist'?0xadc9ef:0xf0d49b,.5,240).setAlpha(.55);
    this.time.delayedCall(150,()=>{
      if(token!==this.actionToken||epoch!==this.regionToken||this.isPaused())return;
      if(discipline==='ranger'){const aim=target?{x:target.sprite.x-x,y:target.sprite.y-y}:this.dirVector(),angle=Math.atan2(aim.y,aim.x);for(let i=-3;i<=3;i++)this.time.delayedCall((i+3)*28,()=>{if(epoch===this.regionToken&&!this.isPaused())this.projectile(x,y-9,angle+i*.13,340,false,Math.round(stats.atk*.8*stats.power),0xe5c382);});this.audio.sfx('bow');}
      else{
        const radius=discipline==='arcanist'?140:105,tint=discipline==='arcanist'?0xb5cbea:0xf2ce88;
        if(discipline==='warden')this.slash(x,y-8,0,62,tint,true);
        const ring=this.add.image(x,y-8,'fx_ring_hd').setTint(tint).setBlendMode('ADD').setDepth(970).setScale(.22).setAlpha(.65);
        this.tweens.add({targets:ring,scale:radius/52,alpha:0,duration:400,ease:'Cubic.Out',onComplete:()=>ring.destroy()});
        for(let i=0;i<8;i++){const a=i*Math.PI/4;const spark=this.effect('fx_star_hd',x+Math.cos(a)*16,y-8+Math.sin(a)*12,tint,.24,430);this.tweens.add({targets:spark,x:x+Math.cos(a)*radius,y:y-8+Math.sin(a)*radius,duration:420});}
        for(const e of this.actors)if(e.hp>0&&Math.hypot(e.sprite.x-x,e.sprite.y-y)<radius)this.time.delayedCall(Math.hypot(e.sprite.x-x,e.sprite.y-y)/radius*240,()=>{if(epoch===this.regionToken&&!this.isPaused()&&e.hp>0&&Math.hypot(e.sprite.x-x,e.sprite.y-y)<radius*1.08){this.hitEnemy(e,Math.round(stats.atk*2.4*stats.power),true);e.cooldown=now+1500;}});
        this.audio.sfx(discipline==='warden'?'spin':'ice_burst');
      }
    });this.invulnerable=now+500;this.store.changed();
  }
  private dirVector(){return this.direction==='up'?{x:0,y:-1}:this.direction==='down'?{x:0,y:1}:this.direction==='left'?{x:-1,y:0}:{x:1,y:0};}
  dodge(){
    const now=this.time.now;if(this.isPaused()||now<this.nextDodge||now<this.cinematicUntil)return;
    this.cancelAction();
    const length=Math.hypot(this.mobile.x,this.mobile.y);this.dashVector=length>.2?{x:this.mobile.x/length,y:this.mobile.y/length}:this.dirVector();
    this.direction=dirFromVector(this.dashVector.x,this.dashVector.y);this.dashUntil=now+210;this.nextDodge=now+1450;this.invulnerable=now+360;this.actionUntil=0;this.destination=null;
    this.player.play(CLASSES[this.store.s.discipline].sprite+'_run_'+this.direction,true);this.player.anims.timeScale=1.35;this.audio.sfx('dash');
    const streak=this.add.image(this.player.x,this.player.y-8,'fx_streak').setOrigin(1,.5).setTint(0xe0cfaa).setRotation(Math.atan2(this.dashVector.y,this.dashVector.x)).setScale(.38,.42).setAlpha(.48).setDepth(this.player.y-.1);
    this.tweens.add({targets:streak,alpha:0,duration:230,onComplete:()=>streak.destroy()});
  }
  private projectile(x:number,y:number,angle:number,speed:number,hostile:boolean,damage:number,color:number){
    const sprite=this.add.image(x,y,!hostile&&this.store.s.discipline==='ranger'?'proj_arrow':hostile?'proj_orb':'proj_star').setTint(color).setRotation(angle).setDepth(980);this.shots.push({sprite,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,hostile,damage,life:2.8});
  }
  private float(x:number,y:number,text:string,color='#efd49a'){
    const label=this.add.text(x,y-24,text,{fontFamily:'Manrope, sans-serif',fontSize:'10px',fontStyle:'bold',color,stroke:'#14202a',strokeThickness:2}).setOrigin(.5).setDepth(1100);
    this.tweens.add({targets:label,y:y-45,alpha:0,duration:680,ease:'Cubic.Out',onComplete:()=>label.destroy()});return label;
  }
  private hitEnemy(e:EnemyActor,amount:number,heavy=false){
    if(e.hp<=0)return;const now=this.time.now;e.hp=Math.max(0,e.hp-amount);e.bar.setVisible(true);
    this.lastCombatAt=now;
    const dx=e.sprite.x-this.player.x,dy=e.sprite.y-this.player.y,d=Math.max(1,Math.hypot(dx,dy)),force=e.def.boss?24:heavy?130:75;
    e.staggerUntil=now+(e.def.boss?55:heavy?230:120);e.knockback={x:dx/d*force,y:dy/d*force,left:.12};
    if(heavy&&!e.def.boss){e.target=null;e.cooldown=now+550;e.charge=null;this.clearTell(e);}
    if(e.damageLabel?.active&&now-(e.damageAt??0)<180){e.damageTotal=(e.damageTotal??0)+amount;e.damageLabel.setText(String(e.damageTotal));}
    else{e.damageTotal=amount;e.damageLabel=this.float(e.sprite.x,e.sprite.y,String(amount));}e.damageAt=now;
    e.sprite.setTintFill(heavy?0xffe1a6:0xf7edd9);e.flashUntil=now+65;this.impact(e.sprite.x,e.sprite.y-9,heavy,Math.atan2(dy,dx));
    e.baseScale??=e.sprite.scaleX;e.recoil?.stop();
    e.sprite.setScale(e.baseScale*(heavy?1.14:1.09),e.baseScale*(heavy?.89:.94));
    e.recoil=this.tweens.add({targets:e.sprite,scaleX:e.baseScale,scaleY:e.baseScale,duration:145,ease:'Cubic.Out'});
    if(heavy&&!this.store.settings.reducedMotion&&now-this.lastImpactPause>180){this.lastImpactPause=now;this.impactPauseUntil=now+28;this.player.anims.pause();this.actionUntil+=28;this.nextAttack+=28;}
    if(now>this.hitSoundAt){this.audio.sfx('hit');tactile(this.store.settings.haptics);this.hitSoundAt=now+120;}
    if(heavy&&this.store.settings.screenShake&&!this.store.settings.reducedMotion)this.cameras.main.shake(70,.0013);
    if(e.hp>0)return;
    e.bar.destroy();e.shadow.destroy();e.sprite.anims.stop();this.clearTell(e);
    this.effect('fx_smoke',e.sprite.x,e.sprite.y-7,0xc5bca9,e.def.boss?2.6:1.1,310).setAlpha(.45);
    this.tweens.add({targets:e.sprite,alpha:0,scaleX:e.baseScale*.9,scaleY:e.baseScale*.9,duration:240,ease:'Cubic.In',onComplete:()=>e.sprite.destroy()});
    this.store.s.gold+=e.def.gold;this.store.addXp(e.def.xp);const drops=rollEnemyDrops(e.def.id);applyLoot(this.store.s.items,drops);
    if(drops.some(d=>['rare','legendary'].includes(ITEMS[d.item].rarity))){this.receipt={gold:e.def.gold,items:drops};this.receiptUntil=this.time.now+2600;}
    const coin=this.add.image(e.sprite.x,e.sprite.y-8,'pk_coin').setDepth(1000);this.tweens.add({targets:coin,x:this.player.x,y:this.player.y-8,alpha:0,duration:420,onComplete:()=>coin.destroy()});
    if(e.def.boss){this.store.s.defeated.push(e.def.id);this.audio.sfx('boss_death');this.store.notice(e.def.name+' released.');}else this.audio.sfx('enemy_death');
    this.store.emit('kill',e.def.id);this.store.save();this.routeAt=0;
  }
  private hurt(amount:number){
    if(this.time.now<this.invulnerable||this.currentRegion!==this.store.s.region)return;
    const multiplier=this.store.settings.difficulty==='story'?.45:this.store.settings.difficulty==='heroic'?1.35:1;
    // Armour may soften a blow, never erase it: at least a quarter of the strike always lands.
    const raw=Math.max(amount*.25,amount-statsFor(this.store.s).def*.55);
    const damage=Math.max(2,Math.round(raw*multiplier));this.store.s.hp=Math.max(0,this.store.s.hp-damage);this.float(this.player.x,this.player.y,'-'+damage,'#eb9990');this.invulnerable=this.time.now+800;
    this.player.setTintFill(0xed9a83);this.time.delayedCall(150,()=>this.player?.clearTint());if(this.store.settings.screenShake&&!this.store.settings.reducedMotion)this.cameras.main.shake(100,.003);this.audio.sfx('player_hurt');
    if(this.store.s.hp===0){this.store.die();this.invulnerable=this.time.now+1500;}this.store.changed();
  }
  private updateGuidance(now:number){
    if(now<this.routeAt)return;this.routeAt=now+650;
    const id=currentTrackedQuest(this.store.s),goal=questGoal(this.store.s,id,this.layout);this.guidance=null;if(!goal)return;
    const q=QUESTS.find(q=>q.id===id);
    if(q?.event==='kill'&&!ENEMIES[q.target]?.boss&&goal.region===this.currentRegion){const living=this.actors.find(e=>e.hp>0&&e.def.id===q.target);if(living){goal.x=living.sprite.x;goal.y=living.sprite.y;}}
    const path=groundRoute(this.layout,this.player,goal),next=path[Math.min(path.length-1,4)]??goal;
    this.guidance={label:goal.label,angle:Math.atan2(next.y-this.player.y,next.x-this.player.x)*180/Math.PI,distance:Math.max(1,Math.ceil((path.length||Math.hypot(goal.x-this.player.x,goal.y-this.player.y)/16)*2)),quest:goal.quest};
    // The compact compass guides the route without a dotted line across actors.
  }
  private encounter(now:number){
    const boss=this.layout.boss;if(!boss||this.bossStarted||this.store.s.defeated.includes(boss.id)||Math.hypot(this.player.x-boss.trigger.x,this.player.y-boss.trigger.y)>65)return;
    this.bossStarted=true;const duration=this.store.settings.reducedMotion?500:2100;this.cinematicUntil=now+duration;this.invulnerable=now+duration+500;this.attackHeld=false;
    this.reveal={title:ENEMIES[boss.id].name,line:boss.line};this.audio.sfx('thunder');const voice=GUARDIAN_VOICES[boss.id as keyof typeof GUARDIAN_VOICES]?.[0];if(voice)this.audio.voice(voice.id,'reveal');if(!this.store.settings.reducedMotion)this.cameras.main.flash(280,120,98,60);
    this.time.delayedCall(duration*.5,()=>{this.spawnEnemy(boss.id,boss.x,boss.y);const guardian=this.actors.find(e=>e.def.id===boss.id);if(guardian){guardian.sprite.setAlpha(0);this.tweens.add({targets:guardian.sprite,alpha:1,duration:400});}});
    this.time.delayedCall(duration+900,()=>{this.reveal=null;});
  }
  update(_time:number,delta:number){
    if(!this.ready||!this.store.state)return;if(this.currentRegion!==this.store.s.region)this.loadRegion();
    if(this.isPaused()){this.destination=null;this.stopMovement();return;}
    const dt=Math.min(delta/1000,.05),now=this.time.now,stats=statsFor(this.store.s);
    this.waterReflections.update(now,this.store.settings.reducedMotion);
    if(now<this.impactPauseUntil)return;
    if(this.player.anims.isPaused)this.player.anims.resume();
    const pending=this.pendingStrike;
    if(pending){
      if(pending.token!==this.actionToken||pending.epoch!==this.regionToken)this.pendingStrike=null;
      else if(this.player.anims.currentAnim?.key===pending.animation&&((this.player.anims.currentFrame?.index??0)>=pending.frame||!this.player.anims.isPlaying))this.resolveStrike();
    }
    let dx=(this.keys.D.isDown||this.keys.RIGHT.isDown?1:0)-(this.keys.A.isDown||this.keys.LEFT.isDown?1:0)+this.mobile.x,dy=(this.keys.S.isDown||this.keys.DOWN.isDown?1:0)-(this.keys.W.isDown||this.keys.UP.isDown?1:0)+this.mobile.y;
    if(now<this.cinematicUntil){dx=0;dy=0;}
    const length=Math.hypot(dx,dy);if(length>1){dx/=length;dy/=length;}
    const look=1-Math.exp(-dt*3),camera=this.cameras.main;
    this.cameraLead.x+=(-dx*14-this.cameraLead.x)*look;this.cameraLead.y+=(-24-dy*10-this.cameraLead.y)*look;
    camera.setLerp(followBlend(dt),followBlend(dt)).setFollowOffset(this.cameraLead.x,this.cameraLead.y);
    const actionLocked=now<this.actionUntil||this.actionPlaying();
    const run=this.store.settings.autoRun&&Math.hypot(this.mobile.x,this.mobile.y)>.6&&now>=this.dashUntil&&!actionLocked;
    const velocity=this.motion.step(dx,dy,stats.speed*(actionLocked?.42:1),dt,run);
    this.running=velocity.running;let vx=velocity.x,vy=velocity.y;
    if(now<this.dashUntil){vx=this.dashVector.x*stats.speed*3.9;vy=this.dashVector.y*stats.speed*3.9;this.motion.reset();
      if(now>this.trailAt&&!this.store.settings.reducedMotion){this.trailAt=now+35;const ghost=this.add.image(this.player.x,this.player.y,'heroes',this.player.frame.name).setOrigin(this.player.originX,this.player.originY).setScale(this.player.scaleX).setTint(0xd8c6a1).setAlpha(.28).setDepth(this.player.y-.5);this.tweens.add({targets:ghost,alpha:0,duration:170,onComplete:()=>ghost.destroy()});this.effect('fx_smoke',this.player.x,this.player.y,0xbdb3a0,.4,170).setDepth(this.player.y-1);}
    }
    if(Math.hypot(vx,vy)>1){const px=this.player.x+vx*dt,py=this.player.y+vy*dt;if(this.walkable(px,this.player.y))this.player.x=px;else this.motion.x=0;if(this.walkable(this.player.x,py))this.player.y=py;else this.motion.y=0;
      if(!actionLocked){
        if(now>=this.dashUntil&&Math.hypot(dx,dy)>.01)this.direction=dirFromVector(dx,dy,this.direction);
        this.player.anims.timeScale=now<this.dashUntil?1.35:Phaser.Math.Clamp(Math.hypot(vx,vy)/(stats.speed*(this.running?RUN_SPEED_RATIO:1)),.55,1);
        const key=CLASSES[this.store.s.discipline].sprite+'_'+(this.running||now<this.dashUntil?'run':'walk')+'_'+this.direction;
        const previous=this.player.anims.currentAnim;
        // Keep footfall phase when turning or changing gait, rather than restarting every step.
        const phase=previous&&/_(walk|run)_/.test(previous.key)?((this.player.anims.currentFrame?.index??1)-1)/previous.frames.length:0;
        const startFrame=Math.floor(phase*this.anims.get(key).frames.length);
        this.player.play({key,startFrame},true);
      }
    }else if(!actionLocked){this.player.anims.timeScale=1;this.player.play(CLASSES[this.store.s.discipline].sprite+'_breath_idle_'+this.direction,true);}
    if(this.lunge&&now>=this.dashUntil){const step=Math.min(dt,this.lunge.left),px=this.player.x+this.lunge.x*step,py=this.player.y+this.lunge.y*step;if(this.walkable(px,this.player.y))this.player.x=px;if(this.walkable(this.player.x,py))this.player.y=py;this.lunge.left-=dt;if(this.lunge.left<=0)this.lunge=null;}
    this.player.setDepth(this.player.y+1);this.playerShadow.setPosition(this.player.x,this.player.y).setDepth(this.player.y);this.halo.setPosition(this.player.x,this.player.y-13);
    this.store.s.position={x:this.player.x,y:this.player.y};this.store.s.playtime+=dt;this.store.s.mana=Math.min(stats.maxMana,this.store.s.mana+dt*1.6);
    this.residents.update(now,dt,this.player);
    this.encounter(now);if(this.keys.SPACE.isDown||this.attackHeld||this.queuedAttackUntil>=now)this.attack(undefined,false);
    if(now>=this.cinematicUntil)for(const e of this.actors){
      if(e.hp<=0)continue;
      if(e.flashUntil&&now>=e.flashUntil){e.sprite.clearTint();e.flashUntil=0;}
      const ex=this.player.x-e.sprite.x,ey=this.player.y-e.sprite.y,distance=Math.hypot(ex,ey),radius=e.def.boss?42:22;
      e.bar.setPosition(e.sprite.x,e.sprite.y-(e.def.boss?68:26)).setScale(e.hp/e.maxHp,1);e.shadow.setPosition(e.sprite.x,e.sprite.y).setDepth(e.sprite.y-1);e.sprite.setDepth(e.sprite.y);
      e.tell?.setPosition(e.sprite.x,e.sprite.y-1).setDepth(e.sprite.y-1);
      if(e.def.boss&&!e.phase&&e.hp<e.maxHp*.5){e.phase=true;this.store.notice('The guardian’s resolve breaks.');}
      if(e.knockback){const step=Math.min(dt,e.knockback.left),px=e.sprite.x+e.knockback.x*step,py=e.sprite.y+e.knockback.y*step;if(this.walkable(px,e.sprite.y))e.sprite.x=px;if(this.walkable(e.sprite.x,py))e.sprite.y=py;const decay=Math.exp(-step*14);e.knockback.x*=decay;e.knockback.y*=decay;e.knockback.left-=dt;if(e.knockback.left<=0)e.knockback=null;}
      if(e.charge){const ratio=Math.min(1,dt/e.charge.left),px=Phaser.Math.Linear(e.sprite.x,e.charge.x,ratio),py=Phaser.Math.Linear(e.sprite.y,e.charge.y,ratio);if(this.walkable(px,e.sprite.y))e.sprite.x=px;if(this.walkable(e.sprite.x,py))e.sprite.y=py;e.charge.left-=dt;if(Math.hypot(this.player.x-e.sprite.x,this.player.y-e.sprite.y)<radius+8)this.hurt(e.def.atk);if(e.charge.left<=0)e.charge=null;continue;}
      if(now<e.staggerUntil)continue;
      if(e.target){
        if(now<e.attackAt)continue;const target=e.target;e.target=null;this.clearTell(e);
        if(e.def.behavior==='ranged'){const angle=Math.atan2(target.y-e.sprite.y,target.x-e.sprite.x),count=e.def.boss?(e.phase?8:5):1;for(let i=0;i<count;i++)this.projectile(e.sprite.x,e.sprite.y-6,e.def.boss&&e.phase?i*Math.PI*2/count:angle+(i-(count-1)/2)*.24,e.def.boss?115:95,true,e.def.atk,e.def.boss?0xe5b877:0xbab2dd);}
        else{if(e.def.behavior==='charge'&&this.walkable(target.x,target.y))e.charge={x:target.x,y:target.y,left:.18};else if(Math.hypot(this.player.x-target.x,this.player.y-target.y)<radius+8)this.hurt(e.def.atk);}
        e.cooldown=now+(e.phase?1100:e.def.boss?1750:1900);
      }else if(distance<(e.def.boss?210:145)){
        const range=e.def.behavior==='ranged'?120:e.def.behavior==='charge'?85:29;
        if(distance>range){const step=e.def.speed*dt/Math.max(1,distance),px=e.sprite.x+ex*step,py=e.sprite.y+ey*step;if(this.walkable(px,e.sprite.y))e.sprite.x=px;if(this.walkable(e.sprite.x,py))e.sprite.y=py;const anim=e.def.sprite+'_'+dirFromVector(ex,ey);if(!e.def.boss&&this.anims.exists(anim))e.sprite.play(anim,true);}
        else if(now>e.cooldown){const windup=e.def.boss?850:650;e.target={x:this.player.x,y:this.player.y};e.attackAt=now+windup;e.sprite.anims.stop();this.showTell(e,e.def.boss?46:e.def.behavior==='charge'?34:28,windup);}
      }else if(!e.def.boss){
        if(now>e.patrolAt){
          const a=e.home.x*.07+e.home.y*.03+(++e.patrolStep)*2.4;
          const x=e.home.x+Math.cos(a)*20,y=e.home.y+Math.sin(a)*20;
          e.patrol=this.walkable(x,y)?{x,y}:e.home;e.patrolAt=now+2600;
        }
        if(e.patrol){
          const px=e.patrol.x-e.sprite.x,py=e.patrol.y-e.sprite.y,d=Math.hypot(px,py),step=e.def.speed*.38*dt/Math.max(1,d);
          if(d<2){e.patrol=null;e.sprite.anims.stop();}
          else{
            const x=e.sprite.x+px*step,y=e.sprite.y+py*step;
            if(this.walkable(x,e.sprite.y))e.sprite.x=x;if(this.walkable(e.sprite.x,y))e.sprite.y=y;
            const anim=e.def.sprite+'_'+dirFromVector(px,py);if(this.anims.exists(anim))e.sprite.play(anim,true);
          }
        }
      }
    }
    for(const e of this.actors)if(e.hp>0){e.sprite.setDepth(e.sprite.y);e.shadow.setPosition(e.sprite.x,e.sprite.y).setDepth(e.sprite.y-1);e.bar.setPosition(e.sprite.x,e.sprite.y-(e.def.boss?68:26));}
    for(const shot of this.shots){const x0=shot.sprite.x,y0=shot.sprite.y;shot.sprite.x+=shot.vx*dt;shot.sprite.y+=shot.vy*dt;shot.life-=dt;
      if(!this.walkable(shot.sprite.x,shot.sprite.y+8))shot.life=0;
      if(shot.hostile){if(segmentDistanceSquared(x0,y0,shot.sprite.x,shot.sprite.y,this.player.x,this.player.y-5)<100){this.hurt(shot.damage);shot.life=0;}}
      else for(const e of this.actors)if(e.hp>0&&segmentDistanceSquared(x0,y0,shot.sprite.x,shot.sprite.y,e.sprite.x,e.sprite.y-6)<(e.def.boss?24:13)**2){this.hitEnemy(e,shot.damage);shot.life=0;break;}
      if(shot.life<=0)shot.sprite.destroy();
    }this.shots=this.shots.filter(s=>s.life>0);
    const facing=this.dirVector();
    this.nearby=this.layout.objects.filter(o=>o.kind!=='exit'&&(['npc','house','camp'].includes(o.kind)||!this.store.s.collected.includes(o.id))).map(o=>({o,d:Math.hypot(o.x-this.player.x,o.y-this.player.y)})).filter(v=>v.d<34&&(!['npc','house'].includes(v.o.kind)||v.d<8||((v.o.x-this.player.x)*facing.x+(v.o.y-this.player.y)*facing.y)/v.d>.1)).sort((a,b)=>a.d-b.d)[0]?.o??null;
    if(now>this.travelAt&&(dx||dy)){const exit=this.layout.objects.find(o=>o.kind==='exit'&&Math.hypot(o.x-this.player.x,o.y-this.player.y)<15);if(exit){this.travel(exit);if(this.currentRegion!==this.store.s.region)return;}}
    this.updateGuidance(now);
    if(now>this.hudAt){this.hudAt=now+120;
      this.audio.setCombat(now-this.lastCombatAt<2400||this.actors.some(e=>e.hp>0&&Math.hypot(e.sprite.x-this.player.x,e.sprite.y-this.player.y)<(e.def.boss?210:145)));
      const boss=this.actors.find(e=>e.def.boss&&e.hp>0&&Math.hypot(e.sprite.x-this.player.x,e.sprite.y-this.player.y)<240),zone=this.layout.zones.find(z=>Math.hypot(z.x-this.player.x,z.y-this.player.y)<z.radius);
      this.hud({nearby:this.nearby,x:this.player.x,y:this.player.y,boss:boss?{name:boss.def.name,hp:boss.hp,max:boss.maxHp}:null,skill:Math.max(0,(this.nextSkill-now)/1000),dodge:Math.max(0,(this.nextDodge-now)/1000),running:this.running,guidance:this.guidance,loot:now<this.receiptUntil?this.receipt:null,reveal:this.reveal,zone:zone?.name??regionById(this.currentRegion).name});}
  }
  stopMovement(){this.motion.reset();this.mobile={x:0,y:0};this.attackHeld=false;this.running=false;}
}

export function createWorld(parent:string,store:GameStore,audio:AudioManager,dialogue:(id:string)=>void,hud:(data:WorldHud)=>void){
  const scene=new WorldScene(store,audio,dialogue,hud);
  const host=document.getElementById(parent)!,display=worldDisplay(host.clientWidth,host.clientHeight,window.devicePixelRatio);
  // Preserve elapsed time under load; Phaser's averaged delta can replace slow
  // frames with 16ms and stretch attack clips and movement. Movement caps stalls.
  const game=new Phaser.Game({type:import.meta.env.MODE==='qa'?Phaser.CANVAS:Phaser.AUTO,parent,backgroundColor:'#131923',pixelArt:true,roundPixels:true,scale:{mode:Phaser.Scale.NONE,width:display.width,height:display.height,zoom:display.cssZoom},scene:[scene],audio:{noAudio:true},render:{antialias:false,powerPreference:'high-performance'},fps:{target:60,smoothStep:false}});
  // Keep the backing canvas stable while menus or Android's keyboard resize the phone.
  const observer=new ResizeObserver(()=>{
    const next=worldDisplay(host.clientWidth,host.clientHeight,window.devicePixelRatio);
    if(next.width===game.scale.width&&next.height===game.scale.height)return;
    game.scale.setZoom(next.cssZoom);game.scale.resize(next.width,next.height);
  });observer.observe(host);game.events.once('destroy',()=>observer.disconnect());
  return {game,scene};
}
