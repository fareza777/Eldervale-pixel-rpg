import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 await page.goto('http://127.0.0.1:4180/exports/index.html');await page.locator('[data-tab="trailers"]').click();
 for(let i=0;i<2;i++){
  const video=page.locator('video').nth(i);
  await video.evaluate(async v=>{v.muted=true;await v.play();});
  await page.waitForTimeout(700);
  const result=await video.evaluate(v=>({src:v.getAttribute('src'),width:v.videoWidth,height:v.videoHeight,duration:v.duration,playing:v.currentTime>0&&!v.paused,error:v.error?.message??null}));
  if(!result.playing||result.error||Math.abs(result.duration-40)>.1)throw new Error(JSON.stringify(result));
  await video.evaluate(v=>{v.pause();v.currentTime=18.5;});results.push(result);
 }
 await page.waitForTimeout(700);await page.screenshot({path:'marketing/store-v1/review/video-gallery.png',fullPage:true});
 await writeFile('marketing/store-v1/review/playback-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
