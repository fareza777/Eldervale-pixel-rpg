import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const checks=[],errors=[],missing=[],towns=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
await mkdir('test-results',{recursive:true});
function pass(label,condition){assert(condition,label);checks.push(label);console.log('PASS '+label);}
async function sample(){return page.evaluate(()=>{
  const w=window.__eldervaleQA.ui.world;
  return w.residents.list.map(r=>({id:r.object.target,x:r.sprite.x,y:r.sprite.y,
    frame:r.sprite.frame.name,animated:r.sprite.anims.isPlaying,
    clear:w.walkable(r.sprite.x,r.sprite.y),radius:Math.hypot(r.sprite.x-r.anchor.x,r.sprite.y-r.anchor.y),
    synced:r.object.x===r.sprite.x&&r.object.y===r.sprite.y&&r.shadow.x===r.sprite.x&&r.shadow.y===r.sprite.y&&(!r.marker||r.marker.x===r.sprite.x&&r.marker.y===r.sprite.y-31)}));
});}
try{
  await page.goto('http://localhost:5175/',{waitUntil:'networkidle'});await page.locator('#splash').waitFor({state:'hidden'});
  await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.locator('[data-action="onboard-skip"]').click();
  await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
  const regions=await page.evaluate(async()=>{const {REGIONS}=await import('/src/content.ts');return REGIONS.filter(r=>r.type==='town').map(r=>r.id);});
  for(const id of regions){
    // Later towns use prepared region placement; their residents run the actual
    // scene updates and collisions without injected destinations or movement.
    await page.evaluate(id=>{const q=window.__eldervaleQA,w=q.ui.world;q.store.s.region=id;w.loadRegion();
      outer:for(let y=64;y<w.layout.height-64;y+=32)for(let x=64;x<w.layout.width-64;x+=32){if(w.walkable(x,y)&&w.residents.list.every(r=>Math.hypot(r.anchor.x-x,r.anchor.y-y)>115)&&w.layout.objects.filter(o=>o.kind==='exit').every(o=>Math.hypot(o.x-x,o.y-y)>60)){w.player.setPosition(x,y);break outer;}}
    },id);
    const initial=await sample(),history=[];
    for(let i=0;i<105;i++){await page.waitForTimeout(100);history.push(await sample());}
    const moved=initial.map(r=>({id:r.id,distance:Math.max(...history.map(s=>{const a=s.find(a=>a.id===r.id);return Math.hypot(a.x-r.x,a.y-r.y);})),frames:[...new Set(history.map(s=>s.find(a=>a.id===r.id).frame))]}));
    towns.push({id,residents:initial.length,moved,samples:history.length});
    pass(id+' residents stroll using native walk frames',initial.length>0&&moved.every(r=>r.distance>3&&r.frames.length>1)&&history.some(s=>s.some(r=>r.animated)));
    pass(id+' every sampled step avoids buildings and water',history.every(s=>s.every(r=>r.clear&&r.radius<=44.2)));
    pass(id+' feet, quest markers and interaction positions move together',history.every(s=>s.every(r=>r.synced)));
  }
  await page.evaluate(()=>{const q=window.__eldervaleQA;q.store.s.region='elderbrook';q.ui.world.loadRegion();const w=q.ui.world;w.player.setPosition(520,550);});
  await page.waitForFunction(()=>{const w=window.__eldervaleQA.ui.world,r=w.residents.list.find(r=>r.object.target==='mara');return Math.hypot(r.sprite.x-r.anchor.x,r.sprite.y-r.anchor.y)>8;});
  pass('Quest objective follows the strolling archivist',await page.evaluate(async()=>{const q=window.__eldervaleQA,{questGoal}=await import('/src/world/navigation.ts'),o=q.ui.world.layout.objects.find(o=>o.target==='mara'),g=questGoal(q.store.s,'m0',q.ui.world.layout);return g?.x===o.x&&g?.y===o.y;}));
  await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,r=w.residents.list.find(r=>r.object.target==='mara');w.player.setPosition(r.sprite.x,r.sprite.y+20);w.direction='up';});
  await page.waitForTimeout(300);const stopped=(await sample()).find(r=>r.id==='mara');await page.waitForTimeout(1100);const held=(await sample()).find(r=>r.id==='mara');
  pass('Nearby resident stops and faces the player',stopped.x===held.x&&stopped.y===held.y&&!held.animated&&held.frame.endsWith('/walk/down/1'));
  pass('Right-hand Talk remains easy to select',await page.locator('#interaction-name').innerText()==='Talk'&&await page.locator('#interaction-prompt').isVisible());
  pass('World sprites have no floating NPC names',await page.evaluate(async()=>{const w=window.__eldervaleQA.ui.world,{NPCS}=await import('/src/content.ts');return w.children.list.filter(c=>c.type==='Text').every(c=>!NPCS.some(n=>c.text===n.name));}));
  await page.screenshot({path:'test-results/residents-elderbrook.png'});
  await page.locator('#interaction-prompt').click();await page.locator('.dialogue-nameplate h2').waitFor();
  pass('Moving NPC retains the real dialogue and quest handler',await page.locator('.dialogue-nameplate h2').innerText()==='Mara'&&await page.evaluate(()=>window.__eldervaleQA.store.s.quests.m0.status)==='completed');
  const before=await sample();await page.waitForTimeout(600);pass('Conversation pauses all resident movement',JSON.stringify(before)===JSON.stringify(await sample()));
  await page.locator('.modal [data-action="close"]').click();await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.player.setPosition(520,550);});
  await page.waitForFunction(()=>{const w=window.__eldervaleQA.ui.world,r=w.residents.list.find(r=>r.object.target==='mara');return r.sprite.anims.isPlaying;});pass('Residents resume their routine after the player leaves',true);
  await page.evaluate(()=>{const q=window.__eldervaleQA;q.store.s.region='elder_store';q.ui.world.loadRegion();});
  const counter=await page.evaluate(()=>window.__eldervaleQA.ui.world.layout.objects.filter(o=>o.kind==='npc').map(o=>({x:o.x,y:o.y})));
  await page.waitForTimeout(500);
  pass('Interior service NPC stays at the shop counter',counter.length>0&&await page.evaluate(before=>{const w=window.__eldervaleQA.ui.world;return w.residents.list.length===0&&JSON.stringify(before)===JSON.stringify(w.layout.objects.filter(o=>o.kind==='npc').map(o=>({x:o.x,y:o.y})));},counter));
  pass('Resident runtime has no errors or missing assets',errors.length===0&&missing.length===0);
}finally{await writeFile('test-results/residents-report.json',JSON.stringify({checks,errors,missing,towns},null,2));await browser.close();}
