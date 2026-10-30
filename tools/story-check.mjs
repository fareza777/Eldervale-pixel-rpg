import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const checks=[],errors=[],missing=[],layout=[];
await mkdir('test-results',{recursive:true});
function pass(label,condition=true){assert(condition,label);checks.push(label);console.log('PASS '+label);}
async function fit(page,label){
  await page.waitForTimeout(300);
  const metric=await page.locator('.modal').evaluate(root=>{
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),texts=[];
    while(walker.nextNode()){const n=walker.currentNode,p=n.parentElement;if(!n.textContent.trim()||!p?.checkVisibility())continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects())if(r.width>2&&r.height>3)texts.push({text:n.textContent.trim().slice(0,45),node:p,x:r.x,y:r.y,w:r.width,h:r.height});}
    const conflicts=[];
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(a.node===b.node||a.node.contains(b.node)||b.node.contains(a.node))continue;const w=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),h=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);if(w>3&&h>3)conflicts.push(a.text+' / '+b.text);}
    return {x:root.scrollWidth-root.clientWidth,y:root.scrollHeight-root.clientHeight,conflicts};
  });
  layout.push({label,...metric});if(metric.x>1||metric.y>40)await page.screenshot({path:'test-results/story-layout-failure.png'});pass(label+' text is separate',metric.conflicts.length===0);pass(label+' fits portrait',metric.x<=1&&metric.y<=40);
}
try{
  for(const viewport of [{width:360,height:740},{width:390,height:844},{width:412,height:839}]){
    const context=await browser.newContext({viewport,hasTouch:true,isMobile:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
    await page.goto('http://localhost:5175/',{waitUntil:'networkidle'});await page.locator('#splash').waitFor({state:'hidden'});
    const action=async(name,id)=>page.locator('.modal [data-action="'+name+'"]'+(id?'[data-id="'+id+'"]':'')).first().click();
    await page.locator('[data-action="new"]').click();await action('create');await action('onboard-next');await action('onboard-next');await action('onboard-next');
    await page.locator('.modal-cinematic').waitFor();pass(viewport.width+' new journey opens the cinematic');
    await fit(page,viewport.width+' prologue');
    const speech=await page.evaluate(async()=>{const a=window.__eldervaleQA.ui.audio.speech;if(!a)return null;await new Promise((resolve,reject)=>{if(a.readyState>=1)resolve();else{a.addEventListener('loadedmetadata',resolve,{once:true});a.addEventListener('error',reject,{once:true});}});return {url:a.src,duration:a.duration,volume:a.volume};});
    pass(viewport.width+' local cinematic voice decodes',speech?.url.includes('/assets/audio/voice/intro_0.mp3')&&speech.duration>3&&speech.volume>.5);
    await page.screenshot({path:'test-results/story-prologue-'+viewport.width+'.png'});
    await action('cinematic-skip');await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
    pass(viewport.width+' cinematic skip enters playable game',await page.locator('#game-screen').isVisible());
    await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.target==='mara');w.player.setPosition(o.x,o.y+20);w.direction='up';});
    await page.locator('#interaction-prompt').waitFor({state:'visible'});await page.locator('#interaction-prompt').click();
    await fit(page,viewport.width+' Mara dialogue');pass(viewport.width+' dialogue has masked portrait and voice replay',await page.locator('.dialogue-portrait .veiled-portrait').count()===1&&await page.locator('[data-action="voice-replay"]').count()===1);
    await action('dialogue-next');await fit(page,viewport.width+' dialogue choices');await page.screenshot({path:'test-results/story-dialogue-'+viewport.width+'.png'});await action('close');
    await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.target==='elder_records');w.player.setPosition(o.x,o.y+20);w.direction='up';});await page.waitForFunction(()=>document.querySelector('#interaction-name').textContent==='Enter');
    pass(viewport.width+' physical door exposes right Enter',await page.locator('#interaction-name').innerText()==='Enter');
    pass(viewport.width+' entrances have no portal circles',await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return w.layout.objects.filter(o=>['house','exit'].includes(o.kind)).every(o=>w.objectSprites.get(o.id)?.length===0);}));
    await page.locator('#interaction-prompt').click();await page.waitForFunction(()=>window.__eldervaleQA.store.s.region==='elder_records'&&window.__eldervaleQA.ui.world.currentRegion==='elder_records');
    pass(viewport.width+' crisp furniture keeps world dimensions and an integer camera scale',await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,f=w.children.list.filter(c=>c.texture?.key==='furniture'&&c.depth>-980);return w.cameras.main.zoom===(devicePixelRatio>=1.5?4:2)&&f.length>0&&f.every(c=>c.scaleX===.5);}));
    await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.player.setPosition(264,345);});await page.waitForTimeout(450);await page.screenshot({path:'test-results/story-interior-'+viewport.width+'.png'});
    if(viewport.width===390){
      for(const region of ['elder_inn','elder_home','elder_store','elder_apothecary','frost_smith']){
        await page.evaluate(id=>{const q=window.__eldervaleQA; q.store.s.region=id;q.store.s.position={x:264,y:345};q.ui.world.loadRegion();},region);await page.waitForTimeout(400);await page.screenshot({path:'test-results/story-'+region+'.png'});
      }
    }
    await page.evaluate(()=>window.__eldervaleQA.ui.action('settings'));await fit(page,viewport.width+' voice settings');
    await page.locator('[data-setting="voice"]').fill('0');pass(viewport.width+' voice can be muted independently',await page.evaluate(()=>window.__eldervaleQA.store.settings.voice===0&&window.__eldervaleQA.store.settings.sfx>0));await action('close');
    await page.evaluate(()=>{const q=window.__eldervaleQA;for(const id of ['m0','m1','m2','m3','m4','m5','m6','m7','m8']){const p=q.store.s.quests[id];if(!p||p.status!=='completed'){q.store.s.quests[id]={status:'ready',count:1};q.store.claimQuest(id);}}q.ui.talk('lyra');});
    while(await page.locator('[data-action="dialogue-next"]').count())await action('dialogue-next');
    await fit(page,viewport.width+' finale decisions');pass(viewport.width+' three ending options fit a dedicated panel',await page.locator('.ending-choice').count()===3);await page.screenshot({path:'test-results/story-decisions-'+viewport.width+'.png'});await action('close');
    await page.evaluate(()=>window.__eldervaleQA.ui.action('chronicle'));await fit(page,viewport.width+' chronicle');await action('close');
    await context.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5175/');await page.locator('#splash').waitFor({state:'hidden'});await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.locator('[data-action="onboard-skip"]').click();await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
  await page.evaluate(()=>{const q=window.__eldervaleQA;q.store.emit('talk','mara');q.store.travel('wilds');});await page.waitForFunction(()=>window.__eldervaleQA.ui.world.currentRegion==='wilds');
  await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;for(const e of w.actors){e.hp=0;e.sprite.setVisible(false);e.shadow.setVisible(false);}w.spawnEnemy('sentinel',580,1190);const e=w.actors.at(-1);e.cooldown=w.time.now+10000;w.player.setPosition(580,1215);window.__eldervaleQA.target=e;});
  const before=await page.evaluate(()=>window.__eldervaleQA.target.hp);
  await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.attack();w.dodge();});await page.waitForTimeout(260);
  pass('Dodge cancels a strike before contact without ghost damage',await page.evaluate(()=>window.__eldervaleQA.target.hp)===before);
  await page.waitForTimeout(200);await page.evaluate(()=>{const q=window.__eldervaleQA;q.ui.world.player.setPosition(q.target.sprite.x,q.target.sprite.y+26);q.ui.world.nextAttack=0;q.ui.world.attack();});
  await page.waitForTimeout(270);await page.evaluate(()=>window.__eldervaleQA.ui.world.attack());await page.waitForTimeout(340);
  pass('A late attack tap is buffered into the next strike',await page.evaluate(()=>window.__eldervaleQA.target.hp)<before-20);
  pass('Enemy shadow follows recoil on the same frame',await page.evaluate(()=>{const e=window.__eldervaleQA.target;return e.shadow.x===e.sprite.x&&e.shadow.y===e.sprite.y;}));
  await page.locator('[data-action="skill"]').click();await page.waitForTimeout(250);await page.screenshot({path:'test-results/story-combat.png'});
  pass('Signature skill uses a local understated voice',await page.evaluate(()=>window.__eldervaleQA.ui.audio.speech?.src.includes('/voice/skill_warden_')));
  pass('No story runtime errors',errors.length===0);pass('No missing story assets',missing.length===0);
}finally{await writeFile('test-results/story-report.json',JSON.stringify({checks,errors,missing,layout},null,2));await browser.close();}
