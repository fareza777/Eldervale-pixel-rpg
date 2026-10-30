import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const checks=[],errors=[],missing=[],metrics=[];
await mkdir('test-results',{recursive:true});
function pass(label,condition=true){assert(condition,label);checks.push(label);console.log('PASS '+label);}
async function overlaps(page){
  return page.locator('.modal').evaluate(root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),texts=[];
    while(walker.nextNode()){const n=walker.currentNode,p=n.parentElement;if(!n.textContent.trim()||!p?.checkVisibility())continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects()){const clipped=getComputedStyle(p).overflow==='hidden'&&r.top>=p.getBoundingClientRect().bottom-1;if(!clipped&&r.width>2&&r.height>3)texts.push({text:n.textContent.trim().slice(0,50),node:p,x:r.x,y:r.y,w:r.width,h:r.height});}}
    const conflicts=[];
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(a.node===b.node||a.node.contains(b.node)||b.node.contains(a.node))continue;const w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(w>3&&h>3)conflicts.push([a.text,b.text]);}
    return [...new Set(conflicts.map(v=>v.join(' / ')))];
  });
}
try{
  for(const viewport of [{width:360,height:740},{width:390,height:844},{width:412,height:839}]){
    const context=await browser.newContext({viewport,hasTouch:true,isMobile:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
    const action=async(name,id,scope='.modal ')=>page.locator(scope+'[data-action="'+name+'"]'+(id?'[data-id="'+id+'"]':'')).first().click();
    const close=async()=>{if(await page.locator('.modal').count())await action('close');};
    await page.goto('http://localhost:5175/',{waitUntil:'networkidle'});await page.locator('#splash').waitFor({state:'hidden'});
    await action('new',null,'');await action('create');await action('onboard-skip');await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
    await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.target==='mara');w.player.setPosition(o.x,o.y+20);w.direction='down';});
    await page.waitForTimeout(250);pass(viewport.width+' NPC requires facing',!(await page.locator('#interaction-prompt').isVisible()));
    await page.evaluate(()=>{window.__eldervaleQA.ui.world.direction='up';});await page.locator('#interaction-prompt').waitFor({state:'visible'});
    pass(viewport.width+' contextual Talk icon',await page.locator('#interaction-name').innerText()==='Talk');
    const controls=await page.locator('.action-bar>button:visible').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
    pass(viewport.width+' contextual control stays separate',!controls.some((a,i)=>controls.some((b,j)=>j>i&&Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)&&Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y))));
    await page.locator('#interaction-prompt').click();while(await page.locator('[data-action="dialogue-next"]').count())await action('dialogue-next');await close();
    pass(viewport.width+' quest tracker removed',await page.locator('#quest-tracker').count()===0);
    for(const menu of ['inventory','quests','map','codex','character','settings','about']){
      await page.evaluate(menu=>window.__eldervaleQA.ui.action(menu),menu);
      const conflicts=await overlaps(page),overflow=await page.locator('.modal').evaluate(e=>({y:e.scrollHeight-e.clientHeight,x:e.scrollWidth-e.clientWidth}));
      metrics.push({width:viewport.width,menu,overflow,conflicts});pass(viewport.width+' '+menu+' text separated',conflicts.length===0);pass(viewport.width+' '+menu+' width fits',overflow.x<=1);pass(viewport.width+' '+menu+' fits without extensive scrolling',overflow.y<100);
      if(['quests','map','codex'].includes(menu))await page.screenshot({path:'test-results/exploration-'+menu+'-'+viewport.width+'.png'});
      if(menu==='quests'){
        await action('quest','m1');pass(viewport.width+' journal detail replaces list',!(await page.locator('.journal-list-view').isVisible()));
        pass(viewport.width+' quest detail text separated',(await overlaps(page)).length===0);await action('follow','m1');
      }else await close();
    }
    await page.evaluate(()=>window.__eldervaleQA.ui.action('drops','chest-6'));pass(viewport.width+' drop probabilities readable',(await overlaps(page)).length===0);await page.screenshot({path:'test-results/exploration-drops-'+viewport.width+'.png'});await close();
    if(viewport.width===390){
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.player.setPosition(430,420);w.mobile={x:.5,y:0};});await page.waitForTimeout(500);
      const walk=await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,r={x:w.player.x,anim:w.player.anims.currentAnim.key};w.mobile={x:0,y:0};return r;});
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.player.setPosition(430,420);w.mobile={x:1,y:0};});await page.waitForTimeout(500);
      const run=await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,r={x:w.player.x,anim:w.player.anims.currentAnim.key,running:w.running};w.mobile={x:0,y:0};return r;});
      pass('Outer joystick runs faster with native run frames',run.running&&run.x-430>(walk.x-430)*2&&run.anim.includes('_run_')&&walk.anim.includes('_walk_'));
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.kind==='chest');w.player.setPosition(o.x,o.y);});await page.locator('#interaction-prompt').waitFor({state:'visible'});await page.locator('#interaction-prompt').click();await page.locator('#loot-receipt').waitFor({state:'visible'});
      pass('Opening a chest leaves gameplay running',await page.locator('.modal').count()===0);await page.screenshot({path:'test-results/exploration-chest.png'});
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.target==='elder_records');w.player.setPosition(o.x,o.y);});
      await page.waitForTimeout(180);await page.locator('#interaction-prompt').click();await page.waitForFunction(()=>window.__eldervaleQA.store.s.region==='elder_records');
      await page.evaluate(()=>window.__eldervaleQA.ui.world.player.setPosition(264,328));await page.waitForTimeout(300);await page.screenshot({path:'test-results/exploration-house.png'});
      pass('Archive house contains generated reusable furnishings',await page.evaluate(()=>window.__eldervaleQA.ui.world.layout.props.filter(p=>p.texture==='furniture').length>=10));
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.kind==='exit');w.player.setPosition(o.x,o.y-20);w.mobile={x:0,y:1};});await page.waitForFunction(()=>window.__eldervaleQA.store.s.region==='elderbrook');await page.evaluate(()=>window.__eldervaleQA.ui.world.mobile={x:0,y:0});pass('Interior exit automatically restores the town door');
      await page.evaluate(()=>{const s=window.__eldervaleQA.store;for(const q of ['m1','m2','m3','m4','m5','m6','m7'])if(s.s.quests[q]?.status!=='completed'){const main=({m1:['visit','wilds'],m2:['kill','rootwarden'],m3:['talk','orrin'],m4:['kill','archivist'],m5:['talk','elara'],m6:['kill','glasskeeper'],m7:['visit','spire']})[q];s.emit(...main);}});
      for(const region of ['cinderwatch','moonmere','starfall','oldroad','causeway','ridge','quarry','moonwell','watchcrypt','root_halls']){
        await page.evaluate(region=>{const s=window.__eldervaleQA.store;s.travel(region);},region);await page.waitForFunction(region=>window.__eldervaleQA.ui.world.currentRegion===region,region);
        await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.player.setPosition(w.layout.spawn.x,w.layout.spawn.y);});await page.waitForTimeout(300);await page.screenshot({path:'test-results/exploration-world-'+region+'.png'});
        pass('Renders '+region,await page.evaluate(()=>window.__eldervaleQA.ui.world.player.active));
      }
      await page.evaluate(()=>{const s=window.__eldervaleQA.store;s.s.collected.push(...['root_halls:ward:0','root_halls:ward:1','root_halls:ward:2']);s.travel('sanctuary');});await page.waitForFunction(()=>window.__eldervaleQA.ui.world.currentRegion==='sanctuary');
      pass('Guardian is absent at the dungeon entrance',await page.evaluate(()=>!window.__eldervaleQA.ui.world.actors.some(e=>e.def.boss)));
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.player.setPosition(w.layout.boss.trigger.x,w.layout.boss.trigger.y);});await page.locator('#boss-reveal').waitFor({state:'visible'});await page.screenshot({path:'test-results/exploration-guardian-reveal.png'});pass('Guardian reveal waits for the arena threshold');
    }
    await context.close();
  }
  for(const discipline of ['ranger','arcanist','warden']){
    const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5175/',{waitUntil:'networkidle'});await page.locator('#splash').waitFor({state:'hidden'});
    await page.locator('[data-action="new"]').click();await page.locator('[data-action="select-class"][data-id="'+discipline+'"]').click();await page.locator('[data-action="create"]').click();await page.locator('[data-action="onboard-skip"]').click();await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
    await page.evaluate(()=>{const q=window.__eldervaleQA;q.store.emit('talk','mara');q.store.travel('wilds');});await page.waitForFunction(()=>window.__eldervaleQA.ui.world.currentRegion==='wilds');
    const before=await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,e=w.actors.find(e=>e.def.id==='slime');window.__eldervaleQA.target=e;w.player.setPosition(e.sprite.x,e.sprite.y+20);return e.hp;});
    await page.locator('[data-action="attack"]').click();await page.waitForTimeout(180);await page.screenshot({path:'test-results/exploration-attack-'+discipline+'.png'});await page.waitForTimeout(500);
    pass(discipline+' native attack causes real contact damage',await page.evaluate(()=>window.__eldervaleQA.target.hp)<before);
    await page.evaluate(()=>{const q=window.__eldervaleQA;q.skillFrames=[];q.ui.world.player.on('animationupdate',(anim,frame)=>{if(/spin|bow|throw/.test(anim.key))q.skillFrames.push({key:anim.key,frame:frame.index});});});
    await page.locator('[data-action="skill"]').click();await page.waitForTimeout(220);
    const skillPose=await page.evaluate(()=>window.__eldervaleQA.skillFrames);
    pass(discipline+' skill uses native pose',new Set(skillPose.map(f=>f.frame)).size>=2);
    await page.screenshot({path:'test-results/exploration-skill-'+discipline+'.png'});
    await page.waitForTimeout(650);await page.locator('[data-action="dodge"]').click();await page.waitForTimeout(60);pass(discipline+' dodge uses grounded run',await page.evaluate(()=>window.__eldervaleQA.ui.world.player.anims.currentAnim.key.includes('_run_')));await page.screenshot({path:'test-results/exploration-dodge-'+discipline+'.png'});await page.close();
  }
  pass('No exploration runtime errors',errors.length===0);pass('No missing expansion assets',missing.length===0);
}finally{await writeFile('test-results/exploration-report.json',JSON.stringify({checks,errors,missing,metrics},null,2));await browser.close();}
