import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),checks=[],errors=[];
try{
 for(const discipline of ['ranger','arcanist']){
  const page=await browser.newPage({viewport:{width:1280,height:800}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5175/',{waitUntil:'networkidle'});await page.locator('#splash').waitFor({state:'hidden'});await page.locator('[data-action="new"]').click();
  await page.locator('[data-action="select-class"][data-id="'+discipline+'"]').click();await page.locator('[data-action="create"]').click();await page.locator('[data-action="onboard-skip"]').click();
  await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
  await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.target==='mara');w.player.setPosition(o.x,o.y);w.destination=null;});
  await page.waitForFunction(()=>window.__eldervaleQA.ui.world.nearby?.target==='mara');await page.keyboard.press('e');await page.locator('.spoken-text').waitFor();await page.keyboard.press('Escape');
  await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.kind==='exit');w.player.setPosition(o.x,o.y);w.destination=null;});
  await page.waitForFunction(()=>window.__eldervaleQA.ui.world.nearby?.kind==='exit');await page.keyboard.press('e');await page.waitForFunction(()=>window.__eldervaleQA.ui.world.currentRegion==='wilds');
  const first=await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,e=w.actors.find(e=>e.def.id==='slime'&&e.hp>0);window.__eldervaleQA.target=e;w.player.setPosition(e.sprite.x,e.sprite.y+85);return window.__eldervaleQA.store.s.kills;});
  await page.keyboard.down('Space');try{await page.waitForFunction(()=>window.__eldervaleQA.target.hp<=0,null,{timeout:15000});}finally{await page.keyboard.up('Space');}
  assert(await page.evaluate(()=>window.__eldervaleQA.store.s.kills)>first);
  const mana=await page.evaluate(()=>window.__eldervaleQA.store.s.mana);await page.keyboard.press('q');await page.waitForTimeout(100);
  assert(await page.evaluate(()=>window.__eldervaleQA.store.s.mana)<mana-18);
  await page.waitForFunction(()=>document.querySelector('#skill-cooldown').textContent.includes('s'));
  checks.push(discipline+' ranged attacks, signature skill and mana/cooldown');console.log('PASS '+checks.at(-1));
  await page.screenshot({path:'test-results/'+discipline+'-combat.png'});await page.close();
 }
 assert.deepEqual(errors,[]);
}finally{await writeFile('test-results/disciplines-report.json',JSON.stringify({checks,errors},null,2));await browser.close();}
