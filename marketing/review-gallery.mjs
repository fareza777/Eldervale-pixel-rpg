import {chromium} from 'playwright-core';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:4180/exports/index.html',{waitUntil:'networkidle'});
 const images=await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,width:i.naturalWidth,height:i.naturalHeight})));
 if(images.some(i=>!i.loaded))throw new Error('Missing gallery image');
 await page.screenshot({path:'marketing/store-v1/review/gallery-overview.png',fullPage:true});
 await page.locator('#screens').screenshot({path:'marketing/store-v1/exports/screenshot-contact-sheet.png'});
 await page.locator('[data-tab="trailers"]').click();
 if(!await page.locator('#trailers').isVisible())throw new Error('Trailer tab failed');
 await page.locator('[data-tab="identity"]').click();
 if(!await page.locator('#identity').isVisible())throw new Error('Identity tab failed');
 await page.setViewportSize({width:390,height:844});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 if(overflow)throw new Error('Gallery overflows mobile viewport');
 await writeFile('marketing/store-v1/review/gallery-checks.json',JSON.stringify({images,tabs:'pass',mobileOverflow:overflow},null,2));
 console.log('Gallery: all images, tabs and mobile width verified.');
}finally{await browser.close();}
