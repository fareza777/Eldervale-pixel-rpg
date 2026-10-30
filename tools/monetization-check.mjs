import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { gameMenu } from './game-controls.mjs';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const checks=[],errors=[],metrics=[];await mkdir('test-results',{recursive:true});
function pass(label,ok){assert(ok,label);checks.push(label);console.log('PASS '+label);}
try{
  for(const width of [360,390,412]){
    const page=await browser.newPage({viewport:{width,height:width===360?740:844},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://localhost:5175/',{waitUntil:'networkidle'});await page.locator('#splash').waitFor({state:'hidden'});
    await page.locator('.title-links [data-action="support"]').click();await page.waitForTimeout(300);
    const fit=await page.locator('.modal').evaluate(e=>({x:e.scrollWidth-e.clientWidth,y:e.scrollHeight-e.clientHeight}));
    pass(width+' support fits the portrait menu',fit.x<=1&&fit.y<100);
    pass(width+' browser does not fake a paid purchase',await page.locator('[data-action="remove-ads"]').isDisabled()&&await page.locator('[data-action="remove-ads"]').innerText()==='Remove Ads · US$4.99');
    // Layout-only reservations, including a tall adaptive banner and Android insets.
    // No SDK state, ad, paid purchase or reward is fabricated by this check.
    for(const banner of [50,90]){
      await page.evaluate(height=>{document.body.classList.add('native-android','ads-visible');const root=document.documentElement.style;root.setProperty('--ad-bottom',height+'px');root.setProperty('--safe-area-inset-top','24px');root.setProperty('--safe-area-inset-bottom','24px');},banner);
      const layout=await page.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();return{frame:rect('.app-frame'),modal:rect('.modal'),close:rect('.modal-close'),links:rect('.title-links'),footer:rect('.title-footer')};});
      metrics.push({width,banner,layout});
      pass(width+' reserves '+banner+'px banner above Android navigation',layout.frame.height<=page.viewportSize().height-banner+1&&layout.modal.bottom<=page.viewportSize().height-banner-24&&layout.close.top>=24&&layout.links.bottom<=layout.footer.top);
    }
    await page.evaluate(()=>{document.body.classList.remove('native-android','ads-visible');const root=document.documentElement.style;for(const p of ['--ad-bottom','--safe-area-inset-top','--safe-area-inset-bottom'])root.removeProperty(p);});
    await page.locator('.modal [data-action="close"]').click();await page.locator('[data-action="new"]').click();await page.locator('[data-action="create"]').click();await page.locator('[data-action="onboard-skip"]').click();await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
    await gameMenu(page,'pause');await page.locator('.pause-menu [data-action="support"]').click();await page.waitForTimeout(250);
    const suppliesFit=await page.locator('.modal').evaluate(e=>({x:e.scrollWidth-e.clientWidth,y:e.scrollHeight-e.clientHeight}));
    pass(width+' optional supplies and restore fit together',suppliesFit.x<=1&&suppliesFit.y<100&&await page.locator('[data-action="ad-supplies"]').isDisabled());
    await page.screenshot({path:'test-results/monetization-support-'+width+'.png'});await page.locator('.modal [data-action="close"]').click();
    if(width===390){
      await page.evaluate(()=>{const q=window.__eldervaleQA;q.store.s.choices['supplies:next']=String(Date.now()+2000);q.ui.action('support');});
      const countdown=await page.locator('[data-action="ad-supplies"]').innerText();await page.waitForTimeout(3200);
      pass('Supply countdown expires while Support stays open',countdown.includes('Ready in')&&(await page.locator('[data-action="ad-supplies"]').innerText())==='Watch an ad · Get supplies'&&await page.locator('[data-action="ad-supplies"]').isDisabled());
      await page.locator('.modal [data-action="close"]').click();
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.stopMovement();w.player.setPosition(430,420);});
      await page.keyboard.down('d');await page.waitForTimeout(1000);await page.keyboard.up('d');await page.waitForTimeout(180);
      const walk=await page.evaluate(()=>({x:window.__eldervaleQA.ui.world.player.x,run:window.__eldervaleQA.ui.world.running}));
      pass('Full keyboard input walks at a natural pace',walk.x>460&&walk.x<484&&!walk.run);
      await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;w.stopMovement();w.player.setPosition(430,420);w.mobile={x:1,y:0};});await page.waitForTimeout(1000);
      const run=await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return {x:w.player.x,run:w.running,anim:w.player.anims.currentAnim.key};});
      metrics.push({walk,run});pass('Full joystick reaches the reference run pace',run.x>504&&run.x<518&&run.run&&run.anim.includes('_run_'));
      await page.evaluate(()=>window.__eldervaleQA.ui.world.mobile={x:0,y:0});await page.waitForTimeout(350);
      pass('Release finishes braking without skating',await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return w.motion.x===0&&w.motion.y===0;}));
      pass('Quest compass remains without the dotted line beside the hero',await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world;return w.routeInk.commandBuffer.length===0&&w.guidance?.label.includes('Mara');}));
      await page.screenshot({path:'test-results/motion-clean-world.png'});
    }
    await page.close();
  }
  const sound=JSON.parse(await readFile('public/assets/audio/sound-manifest.json','utf8'));
  pass('Quiet ambience uses no bird recording layer',!sound.recordingSource.files.some(f=>f.includes('birds'))&&sound.measurements.length===7&&sound.measurements.every(m=>m.rms<=.0221&&m.peak<.23&&m.seamDelta<.0001));
  pass('Spoken performances and nature/Foley remain intact',sound.voicePerformances.clips===75&&sound.instrumentalMusic===false);
  pass('Movement and support have no runtime errors',errors.length===0);
}finally{await writeFile('test-results/monetization-report.json',JSON.stringify({checks,errors,metrics},null,2));await browser.close();}
