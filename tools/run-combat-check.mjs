import { chromium } from 'playwright-core';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { movementBox } from './game-controls.mjs';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const checks=[],errors=[],measurements=[];
const check=(label,ok,detail)=>{assert(ok,label+': '+JSON.stringify(detail));checks.push(label);measurements.push({label,detail});console.log('PASS '+label);};
await mkdir('test-results',{recursive:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5175/',{waitUntil:'networkidle'});await p.locator('#splash').waitFor({state:'hidden'});
  for(const a of ['new','create','onboard-skip'])await p.locator('[data-action="'+a+'"]').first().click();
  await p.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
  if(await p.locator('[data-action="cinematic-skip"]').count())await p.locator('[data-action="cinematic-skip"]').click();
  await p.evaluate(()=>{const q=window.__eldervaleQA;q.store.settings.sfx=0;q.store.settings.ambience=0;q.store.settings.voice=0;});
  await p.waitForFunction(()=>window.__eldervaleQA.ui.world.time.now>window.__eldervaleQA.ui.world.cinematicUntil);
  const origin=await p.evaluate(()=>{
    const w=window.__eldervaleQA.ui.world;w.stopMovement();
    for(let y=380;y<750;y+=16)for(let x=220;x<650;x+=16){
      if(Array.from({length:41},(_,i)=>x-80+i*4).every(px=>w.walkable(px,y))){w.player.setPosition(x,y);return{x,y};}
    }
    throw new Error('No clear real-world run corridor');
  });
  const cdp=await context.newCDPSession(p),joy=await movementBox(p);
  const center={x:joy.x+joy.width/2,y:joy.y+joy.height/2},thumb={id:1,...center};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[thumb]});
  thumb.x=center.x+3;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[thumb]});
  check('Small trusted thumb movements stay in the dead zone',await p.evaluate(()=>window.__eldervaleQA.ui.world.mobile.x===0));
  thumb.x=center.x+13;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[thumb]});await p.waitForTimeout(200);
  const walk=await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return{input:w.mobile.x,speed:w.motion.x,run:w.running,key:w.player.anims.currentAnim.key};});
  check('A gentle thumb drag walks at an analog pace',walk.input>.48&&walk.input<.55&&walk.speed>20&&walk.speed<28&&!walk.run&&walk.key.includes('_walk_'),walk);
  thumb.x=center.x+22;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[thumb]});await p.waitForTimeout(250);
  const run=await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return{input:w.mobile.x,speed:w.motion.x,run:w.running,key:w.player.anims.currentAnim.key,rate:w.player.anims.timeScale,x:w.player.x};});
  check('A short 22px thumb throw reaches full reference run speed',run.input===1&&run.speed>81&&run.speed<=82.01&&run.run&&run.key.includes('_run_'),run);
  check('Native run clip has its full footfall cadence',run.rate>.98&&run.rate<=1,run);
  const beforeTurn=await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return{key:w.player.anims.currentAnim.key,frame:w.player.anims.currentFrame.index};});
  thumb.x=center.x-22;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[thumb]});
  await p.waitForFunction(()=>window.__eldervaleQA.ui.world.player.anims.currentAnim.key.endsWith('_left'));
  const turned=await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return{key:w.player.anims.currentAnim.key,frame:w.player.anims.currentFrame.index,speed:w.motion.x};});
  check('Turning immediately faces the thumb direction',turned.key.endsWith('_left'),{beforeTurn,turned});
  await p.waitForTimeout(150);
  check('A quick reversal is already running left',await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return w.motion.x<-78&&w.running;}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.waitForTimeout(200);
  const stopped=await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return{input:w.mobile,speed:Math.hypot(w.motion.x,w.motion.y),key:w.player.anims.currentAnim.key};});
  check('Touch cancellation promptly stops without skating',stopped.speed===0&&stopped.input.x===0&&stopped.key.includes('_idle_'),stopped);
  await p.screenshot({path:'test-results/run-clean-world.png'});
  for(const id of ['slime','imp','rootwarden','archivist']){
    await p.evaluate(({id,origin})=>{
      const q=window.__eldervaleQA,w=q.ui.world;w.stopMovement();q.store.s.region='elderbrook';q.store.s.position=origin;w.loadRegion();q.store.s.hp=125;w.invulnerable=0;w.cinematicUntil=0;
      w.spawnEnemy(id,origin.x+24,origin.y);const enemy=w.actors.at(-1);enemy.cooldown=0;
      const audit={id,redFrames:0,windupFrames:0,firstHp:q.store.s.hp,waitMs:0};window.__attackAudit=audit;
      const observe=()=>{
        if(enemy.target){audit.windupFrames++;audit.waitMs=Math.max(audit.waitMs,enemy.attackAt-w.time.now);}
        if(w.children.list.some(o=>o.type==='Arc'&&(o.fillColor===0xd55a51||o.strokeColor===0xe98e76)))audit.redFrames++;
      };
      w.events.on('postupdate',observe);window.__stopAttackAudit=()=>w.events.off('postupdate',observe);
    },{id,origin});
    await p.waitForFunction(()=>window.__attackAudit.windupFrames>0);
    await p.screenshot({path:'test-results/enemy-windup-'+id+'.png'});
    await p.waitForFunction(()=>window.__eldervaleQA.store.s.hp<window.__attackAudit.firstHp,null,{timeout:5000});
    const audit=await p.evaluate(()=>{window.__stopAttackAudit();return{...window.__attackAudit,hp:window.__eldervaleQA.store.s.hp};});
    check(id+' attacks without any red ground circle',audit.windupFrames>0&&audit.redFrames===0,audit);
    check(id+' keeps its windup and lands real damage',audit.waitMs>(id==='slime'||id==='imp'?550:750)&&audit.hp<125,audit);
  }
  check('Run, turning and all enemy attack types have no runtime errors',errors.length===0,errors);
  await context.close();
}finally{await writeFile('test-results/run-combat-report.json',JSON.stringify({checks,errors,measurements},null,2));await browser.close();}
