import { chromium } from 'playwright-core';
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
const checks=[],errors=[],measurements=[];
await mkdir('test-results',{recursive:true});
const check=(label,condition,data)=>{assert(condition,label+' '+JSON.stringify(data??''));checks.push(label);console.log('PASS '+label);};
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:5175/',{waitUntil:'networkidle'});await p.locator('#splash').waitFor({state:'hidden'});
  for(const action of ['new','create','onboard-skip'])await p.locator('[data-action="'+action+'"]').first().click();
  await p.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
  if(await p.locator('[data-action="cinematic-skip"]').count())await p.locator('[data-action="cinematic-skip"]').click();
  await p.evaluate(()=>{const qa=window.__eldervaleQA;qa.store.settings.sfx=0;qa.store.settings.ambient=0;qa.store.settings.voice=0;qa.store.settings.difficulty='story';});
  await p.waitForTimeout(3100);
  const display=await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world,c=document.querySelector('#world canvas'),cam=w.cameras.main;return{backing:[c.width,c.height],css:[c.getBoundingClientRect().width,c.getBoundingClientRect().height],zoom:cam.zoom,roundFollow:cam.roundPixels,header:document.querySelector('.game-header').clientHeight,footer:document.querySelector('.game-footer').clientHeight,heroScreenY:(w.player.y-cam.worldView.y)*cam.zoom/2};});
  measurements.push(display);
  check('High density phone has a full 780 × 1688 backing canvas',display.backing[0]===780&&display.backing[1]===1688,display);
  check('World fills the portrait screen without letterboxing',display.css[0]===390&&display.css[1]===844,display);
  check('Readable overlays reserve less than 130px vertically',display.header+display.footer<=130,display);
  check('Camera keeps the hero above the thumb controls',display.heroScreenY>220&&display.heroScreenY<430,display);
  check('Gameplay starts without a permanent navigation bar',await p.locator('#world-menus').isHidden());
  await p.locator('.game-menu-toggle').tap();
  check('One menu button exposes four comfortable shortcuts',await p.locator('#world-menus').isVisible()&&await p.locator('.game-nav button:visible').count()===4);
  await p.locator('.game-nav [data-action="inventory"]').tap();
  check('Selecting a shortcut closes the floating menu',await p.locator('#world-menus').isHidden()&&await p.locator('.modal-inventory').isVisible());
  await p.locator('.modal [data-action="close"]').tap();
  await p.locator('.game-menu-toggle').tap();await p.evaluate(()=>window.__eldervaleQA.ui.androidBack());
  check('Android Back closes quick menus before pausing',await p.locator('#world-menus').isHidden()&&await p.locator('.modal-pause').count()===0);
  await p.screenshot({path:'test-results/polish-elderbrook.png'});
  const atlas=await p.evaluate(()=>{const t=window.__eldervaleQA.ui.world.textures.get('landmarks'),image=t.getSourceImage(),frames={};for(const name of ['lantern_well','archive_gate','frost_obelisk','bronze_furnace']){const f=t.get(name);frames[name]={frame:{x:f.cutX,y:f.cutY,w:f.cutWidth,h:f.cutHeight},rotated:false,trimmed:false,spriteSourceSize:{x:0,y:0,w:f.cutWidth,h:f.cutHeight},sourceSize:{w:f.cutWidth,h:f.cutHeight}};}return{frames,meta:{image:'world-landmarks-v1.png',size:{w:image.width,h:image.height},scale:'1'}};});
  await writeFile('test-results/landmarks-atlas.json',JSON.stringify(atlas,null,2)+'\n');
  for(const [region,x,y]of [['tidecross',456,472],['frosthaven',456,520],['cinderwatch',456,472],['glade',780,850],['root_halls',288,1104],['archive_halls',864,800],['vault_halls',864,800]]){
    const result=await p.evaluate(({region,x,y})=>{const {store,ui}=window.__eldervaleQA;const w=ui.world;store.s.region=region;store.s.position={x,y};w.stopMovement();w.loadRegion();store.changed();return{features:w.layout.features.length,landmarks:w.layout.props.filter(p=>p.texture==='landmarks').map(p=>p.frame)};},{region,x,y});
    await p.waitForTimeout(450);await p.screenshot({path:'test-results/polish-'+region+'.png'});check(region+' has a composed environment',result.features>=4,result);
  }
  for(const discipline of ['warden','ranger','arcanist']){
    const start=await p.evaluate(discipline=>{
      const {store,ui}=window.__eldervaleQA,w=ui.world;store.s.discipline=discipline;store.s.region='wilds';store.s.position={x:584,y:1224};w.stopMovement();w.loadRegion();
      for(const e of w.actors){e.cooldown=Infinity;e.def={...e.def,speed:0};}
      const e=w.actors[0];e.hp=e.maxHp=999;e.sprite.setPosition(w.player.x+24,w.player.y);window.__polishEnemy=e;window.__polishHit=null;
      // Observe the actual hit frame; IPC or screenshots can outlast a 145ms effect.
      const capture=()=>{if(e.hp===999)return;window.__polishHit={damage:999-e.hp,frame:w.player.anims.currentFrame?.index,pending:!!w.pendingStrike,scale:[e.sprite.scaleX,e.sprite.scaleY],stagger:e.staggerUntil-w.time.now,slash:w.children.list.some(s=>s.texture?.key==='fx_slash_hd')};w.events.off('postupdate',capture);};
      w.events.on('postupdate',capture);w.nextAttack=0;w.attack(e);return{hp:e.hp,frame:w.player.anims.currentFrame.index};
    },discipline);
    check(discipline+' winds up before dealing damage',start.hp===999,start);
    try{await p.waitForFunction(()=>window.__polishEnemy.hp<999,{},{timeout:2000});}catch(error){console.log(JSON.stringify(await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world,e=window.__polishEnemy;return{position:[w.player.x,w.player.y],enemy:[e.sprite.x,e.sprite.y,e.hp],key:w.player.anims.currentAnim.key,frame:w.player.anims.currentFrame.index,pending:w.pendingStrike,now:w.time.now,until:w.actionUntil,shots:w.shots.map(s=>({x:s.sprite.x,y:s.sprite.y,life:s.life})),paused:window.__eldervaleQA.store.paused};})));throw error;}
    await p.waitForFunction(()=>window.__polishHit);
    const hit=await p.evaluate(()=>window.__polishHit);
    measurements.push({discipline,...hit});check(discipline+' attack connects once with visible impact',hit.damage>0&&hit.damage<100&&!hit.pending,hit);
    if(discipline==='warden')check('Sword impact has a matching animated slash',hit.slash,hit);
    await p.screenshot({path:'test-results/polish-'+discipline+'-hit.png'});
    await p.waitForTimeout(480);
    const recovered=await p.evaluate(()=>{const e=window.__polishEnemy;return{hp:e.hp,x:e.sprite.scaleX,y:e.sprite.scaleY};});
    check(discipline+' recoil recovers without duplicate damage',recovered.hp===999-hit.damage&&Math.abs(recovered.x-recovered.y)<.005,recovered);
  }
  await p.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.cancelAction();w.nextAttack=0;w.attack(window.__polishEnemy);w.dodge();});
  const hp=await p.evaluate(()=>window.__polishEnemy.hp);await p.waitForTimeout(450);
  check('Dodge cancels a queued strike safely',await p.evaluate(hp=>window.__polishEnemy.hp===hp&&window.__eldervaleQA.ui.world.pendingStrike===null,hp));
  await p.evaluate(()=>{const {store,ui}=window.__eldervaleQA,w=ui.world;store.s.discipline='warden';w.stopMovement();w.loadRegion();for(const e of w.actors){e.cooldown=Infinity;e.def={...e.def,speed:0};}const e=w.actors[0];e.hp=e.maxHp=999;e.sprite.setPosition(w.player.x+24,w.player.y);window.__polishEnemy=e;w.nextAttack=0;w.attack(e);const end=performance.now()+230;while(performance.now()<end){};});
  await p.waitForFunction(()=>window.__polishEnemy.hp<999,{},{timeout:2500});
  const afterStall=await p.evaluate(()=>window.__polishEnemy.hp);await p.waitForTimeout(500);
  check('A slow frame cannot skip or duplicate the strike',afterStall<999&&await p.evaluate(hp=>window.__polishEnemy.hp===hp,afterStall));
  await p.evaluate(()=>{const {store,ui}=window.__eldervaleQA;store.s.region='elderbrook';store.s.position={x:456,y:600};ui.world.stopMovement();ui.world.loadRegion();ui.world.mobile={x:0,y:-.6};});
  await p.waitForTimeout(200);
  const movement=await p.evaluate(()=>new Promise(resolve=>{const w=window.__eldervaleQA.ui.world,samples=[];let n=0;const sample=()=>{samples.push({y:w.player.y,scroll:w.cameras.main.scrollY});if(++n===25){w.events.off('postupdate',sample);w.stopMovement();resolve(samples);} };w.events.on('postupdate',sample);}));
  const increments=movement.slice(1).map((v,i)=>Math.abs(v.scroll-movement[i].scroll));measurements.push({cameraIncrements:increments});
  check('Camera moves at sub-world-pixel precision',increments.some(v=>v>.04&&v<.95),increments);
  check('Camera has no whole-pixel stall/jump cycle',increments.filter(v=>v<.001).length<3,increments);
  check('World and combat have no runtime errors',errors.length===0,errors);
  await context.close();
}finally{await writeFile('test-results/world-polish-report.json',JSON.stringify({checks,errors,measurements},null,2));await browser.close();}
