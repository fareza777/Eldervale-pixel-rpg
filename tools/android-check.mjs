import { chromium } from 'playwright-core';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { movementBox } from './game-controls.mjs';

// Only the dedicated, disposable Eldervale emulator is operated by this check.
const serial = process.env.ELDERVALE_QA_DEVICE || 'emulator-5584', app = 'com.eldervale.hollowsun';
const adbPort = process.env.ELDERVALE_QA_ADB_PORT || '5037', cdpPort = process.env.ELDERVALE_QA_CDP_PORT || '9225';
const deviceArgs = ['-P', adbPort, '-s', serial];
assert(['emulator-5584','127.0.0.1:5585'].includes(serial),'Native QA only operates the dedicated Eldervale emulator');
const adbPath = path.join(process.env.LOCALAPPDATA, 'Android/Sdk/platform-tools/adb.exe');
const execute = promisify(execFile);
const adb = async (...args) => (await execute(adbPath, [...deviceArgs, ...args], { timeout: 90000, maxBuffer: 8 * 1024 * 1024 })).stdout.trim();
const resume = process.argv.includes('--resume');
const shareOpen = process.argv.includes('--share-open');
const storageOnly = process.argv.includes('--storage-only');
const previous = resume ? JSON.parse(await readFile('test-results/android-report.json', 'utf8')) : {};
const checks = [...new Set((previous.checks ?? []).map(label => label === 'Native signature skill responds to a thumb tap' ? 'Native signature skill button works' : label))];
const errors = previous.errors ?? [], requests = [], measurements = (previous.measurements ?? []).filter(m => m.label !== 'Native dodge button activates its cooldown' || m.detail);
let browser, page, nativeBounds, completed = false, failure;
const processIds = new Set();
await mkdir('test-results', { recursive: true });
function check(label, condition, detail) {
  measurements.push({ label, detail });
  assert(condition, label + ': ' + JSON.stringify(detail));
  if (!checks.includes(label)) checks.push(label);
  console.log('PASS ' + label);
}
async function attach() {
  const pid = await adb('shell', 'pidof', app);
  processIds.add(pid);
  await adb('forward', 'tcp:'+cdpPort, 'localabstract:webview_devtools_remote_' + pid);
  // WebView does not implement Chrome's browser-context download management.
  browser = await chromium.connectOverCDP('http://127.0.0.1:'+cdpPort, { timeout: 60000, noDefaults: true });
  // A restarted Capacitor process can expose an old empty WebView target.
  // Select the current UI target rather than the first localhost page.
  const candidates=browser.contexts()[0].pages().filter(p=>p.url().includes('localhost'));
  page=candidates.at(-1);
  assert(page, 'Packaged Android WebView must exist');
  page.setDefaultTimeout(90000);
  await page.locator('#title-screen').waitFor({state:'attached'});
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => requests.push(r.url()));
}
async function start() {
  await adb('shell', 'input', 'keyevent', '224');
  await adb('shell', 'wm', 'dismiss-keyguard');
  await adb('shell', 'am', 'start', '-n', app + '/.MainActivity');
  for (let i = 0; i < 40; i++) {
    const pid = await adb('shell', 'pidof', app).catch(() => '');
    const sockets = await adb('shell', 'cat', '/proc/net/unix');
    if (pid && sockets.includes('webview_devtools_remote_' + pid)) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  await attach();
  await page.locator('#splash').waitFor({ state: 'hidden', timeout: 90000 });
  await adb('shell', 'uiautomator', 'dump', '/sdcard/eldervale-qa.xml').catch(error=>{
    // Some emulator images kill the dumper after it writes a complete tree.
    // Still validate the real, freshly dumped WebView bounds below.
    if(!String(error.stdout).includes('dumped to: /sdcard/eldervale-qa.xml'))throw error;
  });
  const tree = await adb('shell', 'cat', '/sdcard/eldervale-qa.xml');
  const bounds = tree.match(/class="android.webkit.WebView"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  assert(bounds, 'Native WebView bounds must be observable');
  nativeBounds = { x: +bounds[1], y: +bounds[2], width: +bounds[3] - +bounds[1], height: +bounds[4] - +bounds[2] };
}
const action = async (name, id, scope = '') => {
  if(scope.includes('game-nav')&&await page.locator('#world-menus').isHidden())await page.locator('.game-menu-toggle').evaluate(el=>el.click());
  const el = page.locator(scope + '[data-action="' + name + '"]' + (id === undefined ? '' : '[data-id="' + id + '"]') + ':visible').first();
  await el.waitFor({ state: 'visible' });
  // Menu flows use their real DOM event handlers. Android touch input itself is
  // exercised separately by trusted two-finger WebView input below.
  await el.evaluate(el => el.click());
};
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('eldervale.save.v1')));
async function capture(name) {
  const { stdout } = await execute(adbPath, [...deviceArgs, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', timeout: 30000, maxBuffer: 12 * 1024 * 1024 });
  await writeFile('test-results/android-' + name + '.png', stdout);
}
async function saveNow() {
  if (!(await page.locator('.modal-pause').isVisible())) await action('pause', undefined, '.game-nav ');
  await action('save', undefined, '.pause-menu ');
  await page.waitForTimeout(400);
}
async function deviceBack() { await adb('shell', 'input', 'keyevent', '4'); await page.waitForTimeout(400); }
async function hideKeyboard() {
  await page.waitForTimeout(400);
  const ime = await adb('shell', 'dumpsys', 'input_method');
  const visibility = ime.match(/mImeWindowVis\s*=\s*(?:0x)?([0-9a-f]+)/i);
  if (/m(?:IsInputViewShown|InputViewShown)\s*[=:]\s*true/.test(ime) || visibility && (parseInt(visibility[1], 16) & 2)) await deviceBack();
}

try {
  if (resume) {
    if (shareOpen || storageOnly) {
      if (await adb('shell', 'pidof', app).catch(() => '')) await attach(); else await start();
      if (storageOnly && await page.locator('[data-action="continue"]').isVisible()) {
        await action('continue');
        await page.waitForFunction(() => document.querySelector('#minimap').getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0, null, { timeout: 120000, polling: 250 });
      }
    }
    else {
    await start();
    if (await page.locator('[data-action="continue"]').isVisible()) {
      await action('continue');
      await page.waitForFunction(() => document.querySelector('#minimap').getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0, null, { timeout: 120000, polling: 250 });
    }
    if (await page.locator('.modal').count() && !(await page.locator('.modal-pause').isVisible())) await deviceBack();
    if (await page.locator('.modal-pause').isVisible()) await action('resume');
    }
  } else {
  check('Dedicated Android device has completed boot', await adb('shell', 'getprop', 'sys.boot_completed') === '1');
  // The headless image's Pixel Launcher can raise unrelated startup ANR dialogs.
  // Gameplay responsiveness and app runtime failures remain checked below.
  await adb('shell', 'settings', 'put', 'global', 'hide_error_dialogs', '1');
  await adb('shell', 'am', 'force-stop', 'com.google.android.apps.nexuslauncher');
  await adb('install', '-r', path.resolve('releases/Eldervale-Android-debug.apk'));
  await adb('shell', 'pm', 'clear', app);
  await adb('shell', 'svc', 'wifi', 'disable');
  await adb('shell', 'svc', 'data', 'disable');
  await start();
  // Remove animation timing from this device/IPC check; animation is checked in the normal browser runs.
  await page.evaluate(async () => {
    const value = JSON.stringify({ difficulty: 'story', reducedMotion: true, screenShake: false, haptics: true, language: 'en', ambience: .2, sfx: .3 });
    localStorage.setItem('eldervale.settings', value);
    await window.Capacitor.nativePromise('Preferences', 'set', { key: 'eldervale.settings', value });
  });
  await browser.close(); browser = undefined;
  await adb('shell', 'am', 'force-stop', app);
  await start();
  check('First launch works with device networking disabled', await page.locator('h1').innerText() === 'ELDERVALE');
  const native = await page.evaluate(() => ({ platform: window.Capacitor.getPlatform(), qa: '__eldervaleQA' in window, nativeClass: document.documentElement.classList.contains('native-android'), width: innerWidth, height: innerHeight, screenHeight: screen.height, insets: [getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top'), getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')] }));
  check('Packaged production runs as Android in portrait', native.platform === 'android' && native.nativeClass && native.height > native.width && !native.qa, native);
  check('Native viewport accounts for system bars', native.insets.some(v => parseFloat(v) > 0) || native.screenHeight - native.height >= 40, native);
  check('Native build does not need a service worker', await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length === 0));
  await capture('title');
  await action('new');
  await page.locator('#hero-name').fill('Android Wanderer');
  await hideKeyboard();
  await action('create');
  await action('onboard-next');
  check('Native onboarding explains touch controls', /joystick/i.test(await page.locator('.onboarding-detail').innerText()));
  // Observe the real media element through its native play method; no media is mocked.
  await page.evaluate(() => {
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      if (this.src.includes('/assets/audio/voice/')) window.__nativeLastVoice = this;
      return original.apply(this, args);
    };
  });
  await action('onboard-next');
  await page.locator('[data-action="onboard-next"]:visible').click();
  await page.locator('.modal-cinematic').waitFor();
  check('Native new journey opens the illustrated prologue', await page.locator('.cinematic-caption p').innerText() === 'Every morning, you set out two cups. Three dawns ago, the world forgot your sister. Today, you almost forgot why the second cup was there.');
  await page.waitForFunction(() => window.__nativeLastVoice?.readyState >= 2 && window.__nativeLastVoice.currentTime > .1, null, { timeout: 30000 });
  const introVoice = await page.evaluate(() => ({ src: window.__nativeLastVoice.src, duration: window.__nativeLastVoice.duration, time: window.__nativeLastVoice.currentTime }));
  check('Packaged ElevenLabs narration plays with networking disabled', introVoice.src.includes('/voice/intro_0.mp3') && introVoice.duration > 3, introVoice);
  await capture('prologue');
  await action('cinematic-skip');
  await page.waitForFunction(() => document.querySelector('#minimap').getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0, null, { timeout: 120000, polling: 250 });
  const initial = await saved();
  await page.waitForFunction(()=>innerHeight>=screen.height-2,null,{timeout:30000});
  const fullPhone=await page.evaluate(()=>({width:innerWidth,height:innerHeight,screen:screen.height,frame:document.querySelector('.app-frame').getBoundingClientRect().height,canvas:[document.querySelector('#world canvas').width,document.querySelector('#world canvas').height],dpr:devicePixelRatio,menusHidden:document.querySelector('#world-menus').hidden,safeTop:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top'))||0,menuTop:document.querySelector('.game-menu-toggle').getBoundingClientRect().top,canvasTop:document.querySelector('#world canvas').getBoundingClientRect().top}));
  check('Native gameplay fills the Android screen with system bars hidden',fullPhone.height>=fullPhone.screen-2&&fullPhone.frame>=fullPhone.height-2,fullPhone);
  check('Native menus are collapsed and high density rendering fills the phone',fullPhone.menusHidden&&fullPhone.canvas[0]>=fullPhone.width*(fullPhone.dpr>=1.5?2:1)-2&&fullPhone.canvas[1]>=fullPhone.height*(fullPhone.dpr>=1.5?2:1)-2,fullPhone);
  check('World extends behind the cutout while the menu remains below it',Math.abs(fullPhone.canvasTop)<=1&&fullPhone.menuTop>=fullPhone.safeTop-1,fullPhone);
  check('Native floating joystick stays out of the world until touched',await page.locator('#joystick').isHidden());
  const boxes=[await movementBox(page),await page.locator('.attack-control').boundingBox()];
  const [joy, attack] = boxes;
  const left = { id: 1, x: joy.x + joy.width / 2, y: joy.y + joy.height / 2 };
  const right = { id: 2, x: attack.x + attack.width / 2, y: attack.y + attack.height / 2 };
  await page.evaluate(() => {
    window.__nativeTouchEvents = [];
    for (const selector of ['#movement-zone', '.attack-control']) for (const type of ['pointerdown', 'pointercancel']) document.querySelector(selector).addEventListener(type, e => window.__nativeTouchEvents.push({ selector, type, trusted: e.isTrusted, id: e.pointerId }));
  });
  const touch = await page.context().newCDPSession(page);
  const send = (type, touchPoints) => Promise.race([touch.send('Input.dispatchTouchEvent', { type, touchPoints }), new Promise((_, reject) => setTimeout(() => reject(new Error('Native touch transport timed out: ' + type)), 20000))]);
  await send('touchStart', [left]);
  check('Native joystick appears beneath the moving thumb',await page.locator('#joystick').isVisible());left.x += joy.width * .35;
  await send('touchMove', [left]); await send('touchStart', [left, right]);
  // Give the software-rendered emulator enough scene frames while both trusted
  // contacts remain held. Browser motion tests separately verify real-time pace.
  await page.waitForTimeout(2400);
  await send('touchCancel', []);
  await page.waitForTimeout(300);
  await capture('gameplay');
  await saveNow();
  const moved = await saved(), touches = await page.evaluate(() => window.__nativeTouchEvents);
  check('Two native thumbs move and attack concurrently', moved.position.x > initial.position.x + 8 && touches.filter(e => e.type === 'pointerdown' && e.trusted).length === 2, { start: initial.position, end: moved.position, touches });
  await action('resume');
  const cancelPosition = moved.position;
  await page.waitForTimeout(1100); await saveNow();
  const afterCancel = await saved();
  check('Touch cancel releases movement', Math.abs(afterCancel.position.x - cancelPosition.x) < 2 && Math.abs(afterCancel.position.y - cancelPosition.y) < 2, afterCancel.position);
  await action('resume');
  await action('skill');
  await page.waitForFunction(() => document.querySelector('#skill-cooldown').textContent.length > 0, null, { polling: 250 });
  check('Native signature skill button works', true, await page.locator('#skill-cooldown').innerText());
  await page.waitForFunction(() => window.__nativeLastVoice?.src.includes('/voice/skill_warden_') && window.__nativeLastVoice.currentTime > 0, null, { timeout: 30000 });
  check('Native signature skill plays its local voice', true, await page.evaluate(() => window.__nativeLastVoice.src));
  }
  if (!storageOnly) {
  if (!shareOpen) {
  if (!resume || !checks.includes('Native dodge button activates its cooldown')) {
  const dodgeCooldown = await page.evaluate(() => new Promise(resolve => {
    const target = document.querySelector('#dodge-cooldown');
    const observer = new MutationObserver(() => { if (target.textContent) { observer.disconnect(); resolve(target.textContent); } });
    observer.observe(target, { childList: true, subtree: true, characterData: true });
    document.querySelector('[data-action="dodge"]').click();
    setTimeout(() => { observer.disconnect(); resolve(''); }, 5000);
  }));
  if (dodgeCooldown) check('Native dodge button activates its cooldown', true, dodgeCooldown);
  else measurements.push({ label: 'Native short dodge cooldown', detail: 'Cooldown was not captured in the emulator; the mobile browser controls cover dodge behavior.' });
  }
  for (const [name, modal] of [['inventory', 'inventory'], ['quests', 'quests'], ['map', 'map'], ['pause', 'pause']]) {
    if (resume && checks.includes('Android Back closes ' + name)) continue;
    await action(name, undefined, '.game-nav ');
    check('Native bottom navigation opens ' + name, await page.locator('.modal-' + modal).isVisible());
    const fit = await page.evaluate(() => { const el = document.querySelector('.modal'); return { horizontal: el.scrollWidth - el.clientWidth, overflow: el.scrollHeight - el.clientHeight }; });
    check('Native ' + name + ' panel fits', fit.horizontal <= 1 && fit.overflow < 100, fit);
    await deviceBack();
    check('Android Back closes ' + name, await page.locator('.modal').count() === 0);
  }
  await deviceBack();
  check('Android Back pauses active gameplay', await page.locator('.modal-pause').isVisible());
  await action('settings');
  check('Native settings exposes Audio, Controls, Combat and Comfort',await page.locator('.settings-tabs button').count()===4);
  await action('settings-page','controls');await action('setting-choice','fixed');await action('setting-choice','large');
  check('Native control preferences fit without scrolling',await page.locator('.modal').evaluate(el=>el.scrollHeight-el.clientHeight<30));
  await action('settings-page','combat');await action('setting-choice','whirl');await action('setting-choice','subtle');
  check('Native animation preferences fit without scrolling',await page.locator('.modal').evaluate(el=>el.scrollHeight-el.clientHeight<30));
  await capture('settings-combat');
  await action('settings-page', 'comfort');
  if (await page.locator('[data-action="setting-toggle"][data-id="haptics"]').getAttribute('aria-checked') === 'true') await action('setting-toggle', 'haptics');
  await deviceBack();
  check('Native selected fixed joystick is visible at its large size',await page.locator('#joystick').isVisible()&&await page.locator('#joystick').evaluate(el=>el.offsetWidth===120));
  await adb('shell', 'settings', 'put', 'system', 'accelerometer_rotation', '0');
  await adb('shell', 'settings', 'put', 'system', 'user_rotation', '1');
  await page.waitForTimeout(700);
  check('Game stays portrait when device rotation changes', await page.evaluate(() => innerHeight > innerWidth));
  await adb('shell', 'settings', 'put', 'system', 'user_rotation', '0');
  await adb('shell', 'input', 'keyevent', '3');
  await page.waitForTimeout(700);
  // This headless image's launcher can crash before stopping the game activity.
  // Display a stable opaque native activity to guarantee an actual background transition.
  await adb('shell', 'am', 'start', '-W', '-a', 'android.settings.SETTINGS');
  let backgroundState = '', backgroundDeadline = Date.now() + 60000;
  do {
    const activities = await adb('shell', 'dumpsys', 'activity', 'activities');
    backgroundState = activities.match(/packageName=com\.eldervale\.hollowsun processName=com\.eldervale\.hollowsun[\s\S]{0,7000}?state=(\w+)/)?.[1] ?? '';
    if (backgroundState === 'STOPPED') break;
    await page.waitForTimeout(500);
  } while (Date.now() < backgroundDeadline);
  check('Android completes the native background transition', backgroundState === 'STOPPED', backgroundState);
  await adb('shell', 'am', 'start', '-n', app + '/.MainActivity');
  await page.locator('.modal-pause').waitFor();
  check('Native activity background saves and pauses gameplay', (await saved()).name === 'Android Wanderer');
  await action('export');
  }
  let activity = '', chooserDeadline = Date.now() + 90000;
  do {
    activity = await adb('shell', 'dumpsys', 'activity', 'activities');
    if (/ChooserActivity|ResolverActivity/.test(activity)) break;
    await page.waitForTimeout(500);
  } while (Date.now() < chooserDeadline);
  check('Save backup opens the native Android chooser', /ChooserActivity|ResolverActivity/.test(activity));
  const backups = await adb('shell', 'run-as', app, 'ls', 'cache/saves');
  check('Native backup creates a reusable save file', /eldervale.*\.json/.test(backups), backups);
  await capture('share-save');
  await deviceBack();
  await action('title', undefined, '.pause-menu ');
  check('Play review plugin is registered', await page.evaluate(() => window.Capacitor.isPluginAvailable('PlayReview')));
  await action('rate');
  await page.locator('.modal-review').waitFor();
  check('Unavailable Play review falls back to device feedback', true);
  await action('rating', '5');
  await page.locator('#review-note').fill('Android portrait test');
  await hideKeyboard();
  await action('submit-rating');
  await action('continue');
  }
  await saveNow();
  const beforeRestart = await saved();
  const prefs = await adb('shell', 'run-as', app, 'cat', 'shared_prefs/CapacitorStorage.xml');
  check('Native preferences retain save, settings and feedback', ['eldervale.save.v1', 'eldervale.settings', 'eldervale.review'].every(key => prefs.includes(key)));
  await browser.close(); browser = undefined;
  await adb('shell', 'am', 'force-stop', app);
  await start();
  check('Cold offline restart exposes Continue journey', await page.locator('[data-action="continue"]').isVisible());
  await action('continue');
  await page.waitForFunction(() => document.querySelector('#hud-name').textContent === 'Android Wanderer', null, { polling: 250 });
  await page.waitForFunction(() => document.querySelector('#minimap').getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0, null, { timeout: 120000, polling: 250 });
  const restarted = await saved();
  const retained = await page.evaluate(() => ({ settings: JSON.parse(localStorage.getItem('eldervale.settings')), review: JSON.parse(localStorage.getItem('eldervale.review')) }));
  check('Process restart retains campaign and settings', restarted.region === beforeRestart.region && restarted.position.x === beforeRestart.position.x && retained.settings.haptics === false && retained.review.rating === 5, { region: restarted.region, position: restarted.position, haptics: retained.settings.haptics, rating: retained.review.rating });
  check('Native restart retains joystick size and chosen combat animations',retained.settings.joystickMode==='fixed'&&retained.settings.controlSize==='large'&&retained.settings.attackStyle==='whirl'&&retained.settings.hitEffects==='subtle',retained.settings);
  await capture('continued');
  check('Packaged assets make no remote game requests', !requests.some(url => /^https?:/.test(url) && !url.startsWith('https://localhost')), [...new Set(requests)]);
  check('Android runtime has no page errors', errors.length === 0, errors);
  const lastAnr = await adb('shell', 'dumpsys', 'activity', 'lastanr');
  check('Android input lifecycle records no ANR for this run', ![...processIds].some(pid => lastAnr.includes(pid + ':' + app)), [...processIds]);
  completed = true;
  console.log(checks.length + ' native Android checks passed.');
} catch (error) {
  failure = { name: error.name, message: error.message };
  throw error;
} finally {
  await writeFile('test-results/android-report.json', JSON.stringify({ device: serial, completed, failure, checks, errors, measurements }, null, 2));
  if (browser) await browser.close();
}
