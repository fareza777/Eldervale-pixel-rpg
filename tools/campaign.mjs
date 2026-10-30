import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({viewport:{width:390,height:844}, permissions:['clipboard-read','clipboard-write']});
await context.addInitScript(()=>{localStorage.setItem('eldervale.settings',JSON.stringify({difficulty:'story',reducedMotion:true,screenShake:false,ambience:.25,sfx:.4,language:'en'}));Object.defineProperty(navigator,'share',{value:undefined,configurable:true});});
const page=await context.newPage(), checks=[], errors=[], missing=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url());});
await mkdir('test-results',{recursive:true});
const action=async (name,id,scope='.modal ')=>page.locator(scope+'[data-action="'+name+'"]'+(id!==undefined?'[data-id="'+id+'"]':'')).first().click();
const state=()=>page.evaluate(()=>JSON.parse(JSON.stringify(window.__eldervaleQA.store.s)));
const shot=async name=>{await page.waitForTimeout(300);await page.screenshot({path:'test-results/'+name+'.png'});};
function pass(label){checks.push(label);console.log('PASS '+label);}
async function close(){if(await page.locator('.modal').count())await action('close');}
async function approach(kind,target,id){
  // QA placement avoids nondeterministic path duration; interaction/combat use
  // the real scene and keyboard. No quest, XP, enemy HP or reward is injected.
  await page.evaluate(({kind,target,id})=>{
    const w=window.__eldervaleQA.ui.world;
    const object=w.layout.objects.find(o=>o.kind===kind&&(target===undefined||o.target===target)&&(id===undefined||o.id===id));
    if(!object)throw new Error('Missing '+kind+': '+target);
    w.stopMovement();w.player.setPosition(object.x,object.y);w.destination=null;
  },{kind,target,id});
  await page.waitForFunction(({kind,target,id})=>{const o=window.__eldervaleQA.ui.world.nearby;return o?.kind===kind&&(target===undefined||o.target===target)&&(id===undefined||o.id===id);},{kind,target,id});
}
async function interact(kind,target,id){await approach(kind,target,id);await page.locator('#interaction-prompt').click();}
async function talk(id,quests=[]){
  await interact('npc',id);
  await page.locator('.spoken-text').waitFor();
  while(await page.locator('[data-action="dialogue-next"]').count())await action('dialogue-next');
  for(const q of quests)if(await page.locator('[data-action="accept"][data-id="'+q+'"]').count())await action('accept',q);
}
async function travel(id){
  await close();
  await page.waitForFunction(()=>{const w=window.__eldervaleQA.ui.world;return w.time.now>w.travelAt;});
  await page.evaluate(id=>{
    const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.kind==='exit'&&o.target===id);
    if(!o)throw new Error('No connected exit to '+id);
    const dx=o.axis==='left'?-1:o.axis==='right'?1:0,dy=o.axis==='up'?-1:o.axis==='down'?1:0;
    w.stopMovement();w.player.setPosition(o.x-dx*22,o.y-dy*22);w.mobile={x:dx,y:dy};
  },id);
  await page.waitForFunction(id=>window.__eldervaleQA.store.s.region===id&&window.__eldervaleQA.ui.world.currentRegion===id,id);
  await page.evaluate(()=>{window.__eldervaleQA.ui.world.mobile={x:0,y:0};});pass('Walk through exit to '+id);
}
async function collect(kind,target,limit=999){
  await close();
  const ids=await page.evaluate(({kind,target})=>{const {ui,store}=window.__eldervaleQA;return ui.world.layout.objects.filter(o=>o.kind===kind&&(target===undefined||o.target===target)&&!store.s.collected.includes(o.id)).map(o=>o.id);},{kind,target});
  for(const id of ids.slice(0,limit)){await close();await interact(kind,target,id);}
}
async function fight(id,count=1){
  await page.evaluate(id=>{const w=window.__eldervaleQA.ui.world;w.stopMovement();if(w.layout.boss?.id===id&&!w.bossStarted)w.player.setPosition(w.layout.boss.trigger.x,w.layout.boss.trigger.y);},id);
  if(['rootwarden','archivist','glasskeeper','hollowking'].includes(id))await page.waitForFunction(id=>window.__eldervaleQA.ui.world.actors.some(e=>e.def.id===id),id);
  await page.waitForTimeout(550);
  const start=await page.evaluate(id=>{const a=window.__eldervaleQA.ui.world.actors.filter(e=>e.def.id===id);return {dead:a.filter(e=>e.hp<=0).length,alive:a.filter(e=>e.hp>0).length};},id);
  assert(start.alive>=count,'Enough '+id+' encounters must exist');
  while(await page.evaluate(id=>window.__eldervaleQA.ui.world.actors.filter(e=>e.def.id===id&&e.hp<=0).length,id)<start.dead+count){
    const found=await page.evaluate(id=>{const q=window.__eldervaleQA,w=q.ui.world,e=w.actors.find(e=>e.def.id===id&&e.hp>0);if(!e)return false;q.combatTarget=e;w.player.setPosition(e.sprite.x,e.sprite.y+12);w.destination=null;return true;},id);
    assert(found,'Expected living '+id);
    await page.keyboard.press('q');await page.keyboard.down('Space');
    try{
      await page.waitForFunction(()=>window.__eldervaleQA.combatTarget.hp<=0,null,{timeout:65000});
    }finally{await page.keyboard.up('Space');}
    assert((await state()).region!=='elderbrook'||id==='slime','Combat should not require a death reset');
  }
  pass('Actual combat defeats '+count+' '+id);
}
async function claim(id){
  await close();await page.keyboard.press('j');await action('quest-filter','side');
  for(let i=0;i<6&&!(await page.locator('[data-action="quest"][data-id="'+id+'"]').count());i++)await page.locator('[data-action="quest-page"][aria-label="Next page"]').click();
  await action('quest',id);await action('claim',id);await close();
  assert((await state()).quests[id].status==='completed');pass('Claim '+id);
}
async function train(){
  await close();await page.keyboard.press('c');
  await action('character-view','talents');
  while(!(await page.locator('[data-action="learn"][data-id="blade"]').isDisabled()))await action('learn','blade');
  while(!(await page.locator('[data-action="learn"][data-id="vitality"]').isDisabled()))await action('learn','vitality');
  await close();
}
async function equipItem(id){
  const previous=page.locator('[data-action="inventory-page"][aria-label="Previous page"]');
  while(await previous.count()&&!(await previous.isDisabled()))await previous.click();
  for(let i=0;i<6&&!(await page.locator('[data-action="item"][data-id="'+id+'"]').count());i++)await page.locator('[data-action="inventory-page"][aria-label="Next page"]').click();
  await action('item',id);await action('equip',id);await action('item-back');
}
try{
  await page.goto(process.env.BASE_URL||'http://localhost:5175/',{waitUntil:'networkidle'});
  await page.locator('#splash').waitFor({state:'hidden'});await action('new',undefined,'');await page.locator('#hero-name').fill('Campaign Wanderer');await action('create');await action('onboard-skip');
  await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
  await talk('mara',['memory']);await close();
  await talk('nessa',['herbalist']);await close();await talk('garrick',['slimes']);await close();await talk('tavi',['cat']);await close();
  await collect('cat','cat');await claim('cat');await train();
  await travel('wilds');await collect('herb','herb',3);await collect('observatory');await collect('chest');
  await fight('slime',6);await claim('slimes');await claim('herbalist');await train();
  await interact('event');await action('event-help',(await page.locator('[data-action="event-help"]').getAttribute('data-id')));await close();
  await travel('oldroad');await interact('event');await action(await page.locator('[data-action="event-help"]').isDisabled()?'event-leave':'event-help',await page.locator('[data-action="event-help"]').getAttribute('data-id'));await close();
  await travel('cindertrail');await travel('cinderwatch');await talk('doran',['forge_wards','quarry_relic']);await close();
  await travel('cindertrail');await travel('quarry');await collect('ward');await collect('lore','quarry_relic');await collect('chest');await claim('forge_wards');await claim('quarry_relic');await shot('expansion-quarry');await train();
  await travel('cindertrail');await travel('oldroad');await travel('glade');await travel('root_halls');await collect('ward');await collect('chest');await shot('expansion-root-halls');await travel('sanctuary');await fight('rootwarden');await collect('memory');await shot('14-rootwarden-cleared');
  assert((await state()).quests.m2.status==='completed');
  await travel('root_halls');await travel('glade');await travel('oldroad');await travel('wilds');await travel('tidecross');await talk('orrin',['letters']);await close();await talk('selene',['wraiths','bell']);await close();await talk('ivo',['stars']);await close();
  await shot('15-tidecross');await travel('mire');await collect('letter');await collect('observatory');await collect('chest');await fight('wraith',5);await claim('letters');await claim('wraiths');await train();
  await travel('causeway');await travel('moonroad');await travel('moonmere');await talk('aster',['well_wards','well_relic']);await close();
  await travel('moonroad');await travel('moonwell');await collect('ward');await collect('lore','moonwell_relic');await claim('well_wards');await claim('well_relic');await shot('expansion-moonwell');await train();
  await travel('moonroad');await travel('causeway');await travel('archive_halls');await collect('ward');await travel('archive');await fight('archivist');await collect('memory');await collect('bell');await claim('bell');await shot('16-drowned-archive');
  await travel('archive_halls');await travel('causeway');await travel('mire');await travel('frosthaven');await talk('elara',['wolves']);await close();await talk('brann',['ore']);await close();await shot('17-frosthaven');
  await travel('pass');await collect('ore','ore',4);await collect('observatory');await fight('wolf',5);await claim('ore');await claim('wolves');await claim('stars');await train();
  await travel('frosthaven');await talk('brann');await action('service','smith');await action('craft','sun_sword');await close();
  await page.keyboard.press('i');await action('inventory-filter','gear');await equipItem('sun_sword');await equipItem('sun_plate');await close();
  await talk('elara');await action('rest');await travel('pass');await travel('ridge');await travel('watchroad');await travel('starfall');await talk('rowan',['watch_wards','watch_relic']);await close();
  await travel('watchroad');await travel('watchcrypt');await collect('ward');await collect('lore','watchcrypt_relic');await claim('watch_wards');await claim('watch_relic');await shot('expansion-watchcrypt');await train();
  await travel('watchroad');await travel('ridge');await travel('vault_halls');await collect('ward');await travel('vault');await fight('glasskeeper');await collect('memory');await claim('memory');await shot('18-frostglass-vault');
  await travel('vault_halls');await travel('ridge');await travel('pass');await travel('spire_approach');await collect('ward');await travel('spire');assert((await state()).quests.m7.status==='completed');await fight('hollowking');assert((await state()).quests.m8.status==='completed');
  const beforeEnding=await state();assert(beforeEnding.quests.m9.status==='active');
  assert(Object.values(beforeEnding.quests).filter(q=>q.status==='completed').length===25);
  await talk('lyra');await action('ending','share');assert((await state()).ending==='share');await shot('19-shared-dawn');pass('All 26 quests complete and shared ending unlocked');
  for(const ending of ['remember','sacrifice']){
    await action('resume');await page.keyboard.press('Escape');
    await page.locator('#import-save').setInputFiles({name:'campaign.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(beforeEnding))});
    await page.waitForFunction(()=>window.__eldervaleQA.store.s.ending===null&&!document.querySelector('.modal'));
    await talk('lyra');await action('ending',ending);assert((await state()).ending===ending);pass('Save import restores choice and '+ending+' ending works');
  }
  await action('title');await action('about',undefined,'');assert((await page.locator('.about-facts').innerText()).includes('26'));await close();
  await action('rate',undefined,'');await page.locator('#review-note').fill('The world remembers.');await action('rating','5');assert(await page.locator('#review-note').inputValue()==='The world remembers.');await action('submit-rating');assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('eldervale.review')))).rating===5);
  await action('share',undefined,'');await page.waitForFunction(()=>document.querySelector('#toast').textContent==='Share text copied.');assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('ELDERVALE'));pass('About, preserved review draft, local rating and real clipboard share');
  await page.reload({waitUntil:'networkidle'});await page.locator('#splash').waitFor({state:'hidden'});await action('continue',undefined,'');await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
  assert((await state()).ending==='sacrifice');pass('Completed campaign persists after browser reload');
  assert.deepEqual(errors,[],'Runtime errors');assert.deepEqual([...new Set(missing)],[],'Missing assets');
  console.log('Campaign verification complete: '+checks.length+' checks.');
}catch(e){
  console.error('FAILED:',e.message);console.error(JSON.stringify(await state(),null,2));await shot('campaign-failure');throw e;
}finally{
  await writeFile('test-results/campaign-report.json',JSON.stringify({checks,errors,missing:[...new Set(missing)]},null,2));await browser.close();
}
