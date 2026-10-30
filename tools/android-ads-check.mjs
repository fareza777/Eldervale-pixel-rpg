import {chromium} from 'playwright-core';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

// Real Google demo ads on the disposable emulator. No ad, reward or receipt is mocked.
const serial=process.env.ELDERVALE_QA_DEVICE||'emulator-5584',app='com.eldervale.hollowsun';
// A separate ADB server isolates QA from unrelated default-server resets.
const adbPort=process.env.ELDERVALE_QA_ADB_PORT||'5037',cdpPort=process.env.ELDERVALE_QA_CDP_PORT||'9225';
const deviceArgs=['-P',adbPort,'-s',serial];
assert(['emulator-5584','127.0.0.1:5585'].includes(serial),'Ad QA only operates the dedicated Eldervale emulator');
const execute=promisify(execFile),adbPath=path.join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
const adb=async(...args)=>(await execute(adbPath,[...deviceArgs,...args],{timeout:60000,maxBuffer:8*1024*1024})).stdout.trim();
const checks=[],errors=[],measurements=[];let browser,page,completed=false,failure;
await mkdir('test-results',{recursive:true});
const check=(label,ok,detail)=>{assert(ok,label+': '+JSON.stringify(detail));checks.push(label);measurements.push({label,detail});console.log('PASS '+label);};
const native=(plugin,method)=>page.evaluate(({plugin,method})=>window.Capacitor.nativePromise(plugin,method,{}),{plugin,method});
const adState=()=>native('EldervaleAds','getState');
const action=async(name,scope='')=>{
  if(scope.includes('game-nav')&&await page.locator('#world-menus').isHidden())await page.locator('.game-menu-toggle').evaluate(el=>el.click());
  const button=page.locator(scope+'[data-action="'+name+'"]:visible').first();await button.waitFor({state:'visible'});
  const deadline=Date.now()+60000;while(await button.isDisabled()){if(Date.now()>deadline)throw new Error(name+' stayed disabled');await page.waitForTimeout(250);}
  await button.evaluate(el=>el.click());
};
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('eldervale.save.v1')));
async function waitState(predicate,label,timeout=120000){
  const end=Date.now()+timeout;let state;
  do{state=await adState();if(predicate(state))return state;await page.waitForTimeout(1000);}while(Date.now()<end);
  throw new Error(label+': '+JSON.stringify(state));
}
async function capture(name){const {stdout}=await execute(adbPath,[...deviceArgs,'exec-out','screencap','-p'],{encoding:'buffer',timeout:30000,maxBuffer:12*1024*1024});await writeFile('test-results/android-ads-'+name+'.png',stdout);}
async function closeNativeAd(label){
  // Locate the actual Android accessibility Close control after its countdown.
  for(let i=0;i<6;i++){
    if(!(await adState()).fullScreen)return;
    await adb('shell','uiautomator','dump','/sdcard/eldervale-ad.xml').catch(e=>{if(!String(e.stdout).includes('dumped to:'))throw e;});
    const xml=await adb('shell','cat','/sdcard/eldervale-ad.xml');
    await writeFile('test-results/android-ads-'+label+'.xml',xml);
    const nodes=[...xml.matchAll(/<node\b[^>]+>/g)].map(m=>m[0]);
    const close=nodes.find(n=>/(?:content-desc|text)="(?:Close|Close ad|Dismiss|Skip video|Skip ad|x)"/i.test(n)&&/enabled="true"/.test(n))
      ??nodes.find(n=>/text="Got it"/.test(n)&&/enabled="true"/.test(n));
    if(close){
      const b=close.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
      if(b&&+b[3]>+b[1]&&+b[4]>+b[2]){await adb('shell','input','tap',String(Math.round((+b[1]+ +b[3])/2)),String(Math.round((+b[2]+ +b[4])/2)));await page.waitForTimeout(1200);if(!(await adState()).fullScreen)return;}
    }
    // Google's demo WebView sometimes exposes no accessible descendants.
    // Android Back is a real dismissal request handled by Google's AdActivity.
    if(i===1){await adb('shell','input','keyevent','4');await page.waitForTimeout(1500);if(!(await adState()).fullScreen)return;}
    await page.waitForTimeout(4000);
  }
  await capture(label+'-close-missing');throw new Error('No accessible close control found for '+label);
}
try{
  check('Dedicated Android device is booted',await adb('shell','getprop','sys.boot_completed')==='1');
  await adb('shell','svc','wifi','enable');await adb('shell','svc','data','enable');
  await adb('shell','am','force-stop',app);await adb('shell','am','start','-n',app+'/.MainActivity');
  for(let i=0;i<60;i++){const pid=await adb('shell','pidof',app).catch(()=>'');if(pid&&(await adb('shell','cat','/proc/net/unix')).includes('webview_devtools_remote_'+pid)){await adb('forward','tcp:'+cdpPort,'localabstract:webview_devtools_remote_'+pid);break;}await new Promise(r=>setTimeout(r,500));}
  browser=await chromium.connectOverCDP('http://127.0.0.1:'+cdpPort,{timeout:60000,noDefaults:true});
  page=browser.contexts()[0].pages().filter(p=>p.url().includes('localhost')).at(-1);assert(page);
  page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
  await page.locator('#splash').waitFor({state:'hidden'});
  check('Real AdMob and Play Billing plugins are registered',await page.evaluate(()=>['EldervaleAds','PlayBilling'].every(p=>window.Capacitor.isPluginAvailable(p))));
  const title=await waitState(s=>s.initialized&&s.bannerVisible&&s.interstitialReady&&s.rewardedReady,'Google test formats must load');
  check('Native SDK loads all three official test formats',title.testMode&&title.bannerLoaded&&title.interstitialReady&&title.rewardedReady,title);
  await capture('banner-title');
  const fit=await page.evaluate(()=>{const r=document.querySelector('.app-frame').getBoundingClientRect();return{bottom:r.bottom,height:innerHeight,reserved:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ad-bottom'))};});
  check('Title reserves native banner space',fit.reserved>=50&&fit.bottom<=fit.height-fit.reserved+2,fit);
  await action('support','.title-links ');await page.locator('.modal-support').waitFor();
  check('Support marks the build as Test Ads',(await page.locator('.modal-support').innerText()).includes('TEST ADS'));
  const billing=await native('PlayBilling','getState');
  check('Unconfigured test install keeps real purchases disabled',!billing.adFree&&!billing.purchaseAvailable&&await page.locator('[data-action="remove-ads"]').isDisabled(),billing);
  check('Remove Ads displays the intended US$4.99 price',(await page.locator('[data-action="remove-ads"]').innerText()).includes('US$4.99'));
  await action('restore-purchases');await page.waitForTimeout(1200);
  check('Restore cannot fabricate an entitlement',!(await native('PlayBilling','getState')).adFree);
  const rejected=await native('PlayBilling','purchase').then(()=>false,()=>true);
  check('Native checkout rejects missing Play configuration before payment',rejected);
  await action('ad-test-interstitial');await waitState(s=>s.fullScreen,'Interstitial must actually open',30000);await capture('interstitial');
  const activity=await adb('shell','dumpsys','activity','activities');
  check('Test interstitial opens the Google native ad activity',/com.google.android.gms.ads.AdActivity/.test(activity));
  await closeNativeAd('interstitial');await waitState(s=>!s.fullScreen,'Interstitial must dismiss',15000);
  check('Dismissed interstitial returns to Support',await page.locator('.modal-support').isVisible());
  await action('close','.modal ');await action('continue');
  await page.waitForFunction(()=>document.querySelector('#minimap').getContext('2d').getImageData(0,0,1,1).data[3]>0,null,{timeout:90000,polling:250});
  await waitState(s=>!s.bannerVisible,'Gameplay banner must hide',15000);
  check('Gameplay has no native banner overlay',!(await adState()).bannerVisible&&await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ad-bottom'))===0));
  await action('pause','.game-nav ');await action('support','.pause-menu ');
  await waitState(s=>s.rewardedReady&&s.bannerVisible,'Rewarded and menu banner must be ready',45000);
  const supportFit=await page.locator('.modal').evaluate(el=>({horizontal:el.scrollWidth-el.clientWidth,overflow:el.scrollHeight-el.clientHeight}));
  check('Native Support and supply action fit above the banner',supportFit.horizontal<=1&&supportFit.overflow<100,supportFit);await capture('support');
  const before=await saved();
  await action('ad-supplies');await waitState(s=>s.fullScreen,'Rewarded must actually open',30000);await capture('rewarded');
  await page.waitForTimeout(35000);await closeNativeAd('rewarded');
  await page.waitForFunction(()=>document.querySelector('[data-action="ad-supplies"]')?.textContent.includes('Ready in'),null,{timeout:15000});
  const after=await saved();
  check('Completed real rewarded ad grants exactly two potions and 30 gold',after.gold===before.gold+30&&(after.items.potion??0)===(before.items.potion??0)+2,{gold:[before.gold,after.gold],potions:[before.items.potion,after.items.potion]});
  check('Reward callback stores a unique claim and starts its cooldown',after.choices['supplies:last']?.length>=8&&Number(after.choices['supplies:next'])>Date.now()&&await page.locator('[data-action="ad-supplies"]').isDisabled());
  await page.waitForTimeout(1500);const once=await saved();
  check('Ad dismissal and repeat state updates do not duplicate supplies',once.gold===after.gold&&once.items.potion===after.items.potion);
  const countdown=await page.locator('[data-action="ad-supplies"]').innerText();await page.waitForTimeout(2500);
  check('Native supply countdown advances without reopening the panel',countdown!==(await page.locator('[data-action="ad-supplies"]').innerText())&&await page.locator('[data-action="ad-supplies"]').isDisabled());
  check('Rewarded dismisses back to a paused Support panel',await page.locator('.modal-support').isVisible()&&!(await adState()).fullScreen);
  check('Native monetization produces no JavaScript errors',errors.length===0,errors);
  completed=true;console.log(checks.length+' real native ad checks passed.');
}catch(error){failure={name:error.name,message:error.message};if(page)await capture('failure').catch(()=>{});throw error;}
finally{await writeFile('test-results/android-ads-report.json',JSON.stringify({device:serial,completed,failure,checks,errors,measurements},null,2));if(browser)await browser.close();}
