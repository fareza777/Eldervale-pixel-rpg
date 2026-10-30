import { chromium } from 'playwright-core';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { movementBox } from './game-controls.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
const checks=[],errors=[],measurements=[];
const check=(label,ok,detail)=>{assert(ok,label+': '+JSON.stringify(detail));checks.push(label);measurements.push({label,detail});console.log('PASS '+label);};
await mkdir('test-results',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5175/',{waitUntil:'networkidle'});await p.locator('#splash').waitFor({state:'hidden'});
 for(const action of ['new','create','onboard-skip'])await p.locator('[data-action="'+action+'"]').first().click();
 await p.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
 if(await p.locator('[data-action="cinematic-skip"]').count())await p.locator('[data-action="cinematic-skip"]').click();
 await p.waitForFunction(()=>{const w=window.__eldervaleQA.ui.world;return w.time.now>w.cinematicUntil;});
 await p.evaluate(()=>{const q=window.__eldervaleQA;q.store.settings.voice=0;q.store.settings.sfx=0;q.store.settings.ambience=.45;});
 const cdp=await context.newCDPSession(p);
 const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 for(const offset of [0,-150]){
  const b=await movementBox(p),thumb={id:1,x:b.x+54,y:b.y+54+offset};
  await touch('touchStart',[thumb]);
  const at=await p.locator('#joystick').boundingBox();
  check('Floating joystick starts at the chosen left-thumb position '+offset,Math.abs(at.x+at.width/2-thumb.x)<1&&Math.abs(at.y+at.height/2-thumb.y)<1,at);
  thumb.x+=80;await touch('touchMove',[thumb]);
  const trail=await p.evaluate(()=>{const r=document.querySelector('#joystick').getBoundingClientRect();return{center:r.x+r.width/2,input:window.__eldervaleQA.ui.world.mobile.x};});
  check('Floating origin follows a long drag '+offset,Math.abs(trail.center-(thumb.x-32.4))<1&&trail.input>.99,trail);
  thumb.x-=58;await touch('touchMove',[thumb]);
  await p.waitForFunction(()=>window.__eldervaleQA.ui.world.mobile.x<-.9,null,{timeout:1500});
  check('A short reversal responds without returning to the first touch '+offset,await p.evaluate(()=>window.__eldervaleQA.ui.world.mobile.x<-.9));
  await touch('touchCancel',[]);check('Released floating control disappears '+offset,await p.locator('#joystick').isHidden());
 }
 await p.evaluate(()=>window.__eldervaleQA.ui.action('settings'));
 await p.locator('[data-action="settings-page"][data-id="controls"]').click();
 await p.locator('[data-setting="joystickMode"][data-id="fixed"]').click();
 await p.locator('[data-setting="controlSize"][data-id="large"]').click();
 await p.locator('[data-action="close"]').click();
 const fixed=await p.locator('#joystick').boundingBox();
 check('Fixed preference shows a large anchored joystick',fixed.width===120&&await p.locator('#joystick').isVisible(),fixed);
 let thumb={id:1,x:fixed.x+60,y:fixed.y+60};await touch('touchStart',[thumb]);thumb.x+=80;await touch('touchMove',[thumb]);
 const moved=await p.locator('#joystick').boundingBox();check('Fixed joystick never trails its thumb',Math.abs(fixed.x-moved.x)<1&&Math.abs(fixed.y-moved.y)<1);
 await touch('touchCancel',[]);check('Fixed joystick remains visible after release',await p.locator('#joystick').isVisible());
 await p.evaluate(()=>window.__eldervaleQA.ui.action('settings'));
 await p.locator('[data-setting="joystickMode"][data-id="floating"]').click();
 await p.locator('[data-setting="controlSize"][data-id="standard"]').click();
 for(const tab of ['audio','controls','combat','comfort']){
  await p.locator('[data-action="settings-page"][data-id="'+tab+'"]').click();
  await p.waitForTimeout(300);
  const height=await p.locator('.modal').evaluate(el=>el.scrollHeight-el.clientHeight);
  check('Settings '+tab+' fits the portrait phone without a long scroll',height<30,height);
  await p.screenshot({path:'test-results/settings-'+tab+'-v1.6.0.png'});
 }
 await p.setViewportSize({width:360,height:740});
 for(const tab of ['audio','controls','combat','comfort']){
  await p.locator('[data-action="settings-page"][data-id="'+tab+'"]').click();
  const height=await p.locator('.modal').evaluate(el=>el.scrollHeight-el.clientHeight);
  check('Settings '+tab+' also fits a small 360px phone',height<30,height);
 }
 await p.setViewportSize({width:390,height:844});
 await p.locator('[data-action="settings-page"][data-id="combat"]').click();
 await p.locator('[data-setting="hitEffects"][data-id="subtle"]').click();
 await p.locator('[data-action="close"]').click();
 const setup=()=>p.evaluate(()=>{
  const q=window.__eldervaleQA,w=q.ui.world;w.stopMovement();q.store.s.region='elderbrook';q.store.s.position={x:456,y:600};w.loadRegion();w.cinematicUntil=0;w.invulnerable=Infinity;
  w.spawnEnemy('sentinel',480,600);const e=w.actors.at(-1);e.hp=e.maxHp=999;e.def={...e.def,speed:0};e.cooldown=Infinity;window.__styleEnemy=e;
  w.player.setPosition(456,600);w.direction='right';w.nextAttack=0;w.combo=0;w.lastStrike=w.time.now;
 });
 for(const style of ['classic','whirl']){
  await p.evaluate(()=>window.__eldervaleQA.ui.action('settings'));await p.locator('[data-action="settings-page"][data-id="combat"]').click();
  await p.locator('[data-setting="attackStyle"][data-id="'+style+'"]').click();await p.locator('[data-action="close"]').click();
  await setup();
  await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.combo=1;w.lastStrike=w.time.now;w.attack(window.__styleEnemy);window.__thirdAttackKey=w.player.anims.currentAnim.key;});
  const key=await p.evaluate(()=>window.__thirdAttackKey);
  check(style+' plays its chosen third-strike animation',style==='classic'?key.includes('_attack_'):/_spin(?:_|$)/.test(key),key);
  await p.waitForFunction(()=>window.__styleEnemy.hp<999);
  const hit=await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world,e=window.__styleEnemy;return{damage:999-e.hp,core:w.children.list.filter(o=>o.texture?.key==='fx_hit_core').length,shards:w.children.list.filter(o=>o.texture?.key==='fx_hit_shard').length,hp:e.hp};});
  check(style+' lands a directional hit with restrained particles',hit.damage>0&&hit.core>0&&hit.shards===2,hit);
  await p.screenshot({path:'test-results/hit-'+style+'-v1.6.0.png'});await p.waitForTimeout(500);
  check(style+' hit recovers without duplicate damage',await p.evaluate(hp=>window.__styleEnemy.hp===hp,hit.hp));
 }
 await p.evaluate(()=>window.__eldervaleQA.ui.action('settings'));await p.locator('[data-action="settings-reset"]').click();await p.locator('[data-action="close"]').click();
 for(const region of ['oldroad','causeway','ridge']){
  const data=await p.evaluate(region=>{
   const q=window.__eldervaleQA,w=q.ui.world;q.store.s.region=region;q.store.s.position={x:584,y:1304};w.stopMovement();w.loadRegion();w.cinematicUntil=0;w.invulnerable=Infinity;
   const h=w.layout.props.find(p=>p.frame.includes('house'));w.player.setPosition(h.x,h.y+15);w.mobile={x:0,y:-1};
   return{count:w.actors.length,house:{x:h.x,y:h.y},origin:w.actors.map(e=>({x:e.sprite.x,y:e.sprite.y}))};
  },region);
  check(region+' has populated enemy groups',data.count>=34,data.count);
  await p.waitForTimeout(1300);
  const feet=await p.evaluate(()=>({x:window.__eldervaleQA.ui.world.player.x,y:window.__eldervaleQA.ui.world.player.y}));
  check(region+' house blocks the player at its foundation',feet.y>=data.house.y+4,feet);
  await p.evaluate(()=>window.__eldervaleQA.ui.world.stopMovement());await p.screenshot({path:'test-results/solid-house-'+region+'.png'});
  if(region==='oldroad'){
   await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.player.setPosition(w.layout.spawn.x,w.layout.spawn.y);});
   await p.waitForTimeout(2800);
   const patrolling=await p.evaluate(origin=>window.__eldervaleQA.ui.world.actors.filter((e,i)=>e.hp>0&&Math.hypot(e.sprite.x-origin[i].x,e.sprite.y-origin[i].y)>2).length,data.origin);
   check('Unengaged road enemies patrol instead of standing still',patrolling>8,patrolling);
  }
 }
 await p.evaluate(()=>{const q=window.__eldervaleQA,w=q.ui.world;q.store.s.region='elderbrook';q.store.s.position={x:456,y:600};w.stopMovement();w.loadRegion();q.ui.audio.ambience('wind');q.ui.audio.unlock();q.ui.audio.setCombat(false);});
 await p.waitForTimeout(1700);
 const baseline=await p.evaluate(()=>window.__eldervaleQA.ui.audio.track.volume);
 await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.spawnEnemy('slime',w.player.x+30,w.player.y);w.actors.at(-1).cooldown=Infinity;});
 await p.waitForTimeout(1000);
 const quiet=await p.evaluate(()=>({gain:window.__eldervaleQA.ui.audio.environment.gain,volume:window.__eldervaleQA.ui.audio.track.volume,paused:window.__eldervaleQA.ui.audio.track.paused}));
 check('Real nearby enemies quiet the environment without muting all sound',quiet.gain<.24&&quiet.volume>0&&quiet.volume<baseline*.3&&!quiet.paused,{baseline,...quiet});
 await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;for(const e of w.actors)e.hp=0;w.lastCombatAt=-10000;});await p.waitForTimeout(3200);
 check('Environment gently returns when danger has passed',await p.evaluate(()=>window.__eldervaleQA.ui.audio.environment.gain>.95));
 const alpha=await p.evaluate(async()=>{
  const im=new Image();im.src='/assets/art/relics-transparent-v2.png';await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const a=ctx.getImageData(0,0,c.width,c.height).data;
  let empty=0;for(let i=3;i<a.length;i+=4)if(a[i]===0)empty++;
  return{corners:[ctx.getImageData(0,0,1,1).data[3],ctx.getImageData(c.width-1,0,1,1).data[3]],empty:empty/(c.width*c.height),source:document.querySelector('.attack-control .item-art').style.backgroundImage};
 });
 check('Battle art has transparent gutters and no baked square background',alpha.corners.every(x=>x===0)&&alpha.empty>.5&&alpha.source.includes('relics-transparent-v2'),alpha);
 check('Playstyle preferences and encounters have no runtime errors',errors.length===0,errors);
 await context.close();
}finally{await writeFile('test-results/playstyle-report.json',JSON.stringify({checks,errors,measurements},null,2));await browser.close();}
