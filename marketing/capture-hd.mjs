import {chromium} from 'playwright-core';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const root='E:/Dawnbound RPG GPT 61',out=root+'/marketing/store-v1/captures/hd';
const ff='C:/Users/FAJAR/AppData/Roaming/Python/Python313/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:432,height:768},deviceScaleFactor:2,hasTouch:true,isMobile:true});
const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await p.goto('http://127.0.0.1:5175/',{waitUntil:'networkidle'});await p.locator('#splash').waitFor({state:'hidden'});
 for(const action of ['new','create','onboard-skip'])await p.locator(`[data-action="${action}"]`).first().click();
 await p.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
 if(await p.locator('[data-action="cinematic-skip"]').count())await p.locator('[data-action="cinematic-skip"]').click();
 await p.evaluate(()=>window.__eldervaleQA.store.updateSettings({sfx:0,ambience:0,voice:0,screenShake:true,difficulty:'normal'}));
 await p.waitForTimeout(3200);
 const scenes=[['town','elderbrook',456,450,'warden'],['frost','frosthaven',456,480,'warden'],['river','tidecross',456,440,'warden'],['combat','wilds',584,1170,'warden'],['magic','wilds',584,1170,'arcanist'],['dungeon','archive_halls',864,760,'warden'],['interior','elder_inn',264,424,'warden']];
 for(const [name,region,x,y,discipline]of scenes){
  await mkdir(out+'/'+name,{recursive:true});
  await p.evaluate(async({region,x,y,discipline})=>{const {store,ui}=window.__eldervaleQA,w=ui.world;const{statsFor}=await import('/src/core/store.ts');w.game.loop.start(w.game.step.bind(w.game));store.s.region=region;store.s.position={x,y};store.s.discipline=discipline;store.s.level=4;store.s.hp=statsFor(store.s).maxHp;store.s.mana=statsFor(store.s).maxMana;w.stopMovement();w.loadRegion();store.changed();},{region,x,y,discipline});
  await p.waitForTimeout(3200);
  await p.evaluate(name=>{const w=window.__eldervaleQA.ui.world;w.game.loop.stop();window.__captureTime=w.game.loop.now;if(name==='combat'||name==='magic')w.actors.slice(0,4).forEach((e,i)=>e.sprite.setPosition(w.player.x+24+i*18,w.player.y-10-i*14));},name);
  for(let frame=0;frame<120;frame++){
   await p.evaluate(({name,frame})=>{const w=window.__eldervaleQA.ui.world;
    w.mobile={x:0,y:0};
    if(name==='town')w.mobile=frame<60?{x:.6,y:0}:{x:0,y:-.55};
    if(name==='frost'||name==='river')w.mobile=frame<80?{x:.62,y:0}:{x:0,y:0};
    if(name==='dungeon')w.mobile=frame<85?{x:0,y:-.55}:{x:0,y:0};
    if(name==='interior')w.mobile=frame<65?{x:0,y:-.5}:{x:0,y:0};
    if(name==='combat'||name==='magic'){
     if(frame%16===0)w.attack();
     if(frame===55)w.skill();
     if(frame>=80&&frame<92){w.mobile={x:-.65,y:0};if(frame===80)w.dodge();}
    }
    window.__captureTime+=1000/30;w.game.step(window.__captureTime,1000/30);
   },{name,frame});
   await p.screenshot({path:`${out}/${name}/${String(frame).padStart(4,'0')}.jpg`,type:'jpeg',quality:94});
   if(frame===0&&name==='town'){await p.screenshot({path:root+'/marketing/store-v1/captures/01-world.png'});await copyFile(root+'/marketing/store-v1/captures/01-world.png',root+'/marketing/remotion/public/captures/01-world.png');}
   if(frame===4&&name==='combat'){await p.screenshot({path:root+'/marketing/store-v1/captures/02-combat.png'});await copyFile(root+'/marketing/store-v1/captures/02-combat.png',root+'/marketing/remotion/public/captures/02-combat.png');}
  }
  const r=spawnSync(ff,['-v','error','-y','-framerate','30','-i',`${out}/${name}/%04d.jpg`,'-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',root+`/marketing/remotion/public/clips/${name}.mp4`],{encoding:'utf8'});if(r.status)throw new Error(r.stderr);
  console.log('HD footage ready: '+name);
 }
 await writeFile(out+'/manifest.json',JSON.stringify({resolution:[864,1536],fps:30,framesPerClip:120,method:'Actual Phaser simulation advanced in fixed 33.333 ms steps, with a full-page screenshot after every rendered frame. Inputs call the existing movement, attack, dodge and skill methods. No UI or hit effects are fabricated.',scenes:scenes.map(([clip,region])=>({clip,region})),errors},null,2));
}finally{await browser.close();}
if(errors.length)throw new Error(errors.join('\n'));
