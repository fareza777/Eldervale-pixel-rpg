import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
await mkdir('test-results',{recursive:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'&&u.hostname!=='localhost'||/\.(mp3|ogg|wav)(\?|$)/i.test(u.pathname))return route.abort();return route.continue();});
  const p=await context.newPage();
  await p.goto('http://127.0.0.1:4187/',{waitUntil:'networkidle'});await p.waitForTimeout(3500);
  console.log(JSON.stringify(await p.evaluate(()=>({keys:Object.keys(window).filter(k=>k.startsWith('__')),scenes:window.__game?.scene.getScenes(true).map(s=>s.scene.key)}))));
  await p.screenshot({path:'test-results/reference-title.png'});
  if(await p.evaluate(()=>!!window.__services?.save)){
    await p.evaluate(()=>{window.__services.save.data.settings.music=0;window.__services.save.data.settings.sfx=0;window.__game.scene.stop('Onboarding');window.__game.scene.stop('Intro');window.__game.scene.stop('Menu');window.__game.scene.stop('Splash');window.__game.scene.start('Hub');});
    await p.waitForTimeout(1600);await p.screenshot({path:'test-results/reference-hub.png'});
    console.log(JSON.stringify(await p.evaluate(()=>({scenes:window.__game.scene.getScenes(true).map(s=>s.scene.key),hub:Object.keys(window.__game.scene.getScene('Hub')??{}),run:Object.keys(window.__run??{})}))));
  }
  await context.close();
  const own=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
  const ep=await own.newPage();await ep.goto('http://127.0.0.1:5175/',{waitUntil:'networkidle'});await ep.locator('#splash').waitFor({state:'hidden'});
  for(const a of ['new','create','onboard-skip'])await ep.locator('[data-action="'+a+'"]').first().click();
  await ep.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);if(await ep.locator('[data-action="cinematic-skip"]').count())await ep.locator('[data-action="cinematic-skip"]').click();
  await ep.waitForTimeout(800);await ep.screenshot({path:'test-results/before-world.png'});
  console.log(JSON.stringify(await ep.evaluate(()=>({world:document.querySelector('#world').getBoundingClientRect().toJSON(),camera:{zoom:window.__eldervaleQA.ui.world.cameras.main.zoom,view:window.__eldervaleQA.ui.world.cameras.main.worldView},canvas:{width:document.querySelector('#world canvas').width,height:document.querySelector('#world canvas').height}}))));
  await own.close();
}finally{await browser.close();}
