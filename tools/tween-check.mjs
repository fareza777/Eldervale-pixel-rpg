import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
try{
 await page.goto('http://localhost:5175/',{waitUntil:'networkidle'});
 await page.locator('#splash').waitFor({state:'hidden'});await page.locator('[data-action="new"]').click();
 await page.locator('[data-action="create"]').click();await page.locator('[data-action="onboard-skip"]').click();
 await page.waitForFunction(()=>window.__eldervaleQA.ui.world?.ready);
 const counts=await page.evaluate(()=>{const w=window.__eldervaleQA.ui.world,initial=w.tweens.getTweens().length;for(let i=0;i<6;i++)w.loadRegion();return {initial,after:w.tweens.getTweens().length};});
 console.log(counts);assert(counts.after<=counts.initial+2,'Repeated region loads must not retain destroyed-target tweens');
}finally{await browser.close();}
