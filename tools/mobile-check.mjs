import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { gameMenu,movementBox } from './game-controls.mjs';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-unsafe-swiftshader'] });
const checks = [], errors = [], failures = [];
await mkdir('test-results', { recursive: true });
const check = (label, ok, detail) => { if (ok) { checks.push(label); console.log('PASS ' + label); } else { failures.push({ label, detail }); console.log('FAIL ' + label + ': ' + JSON.stringify(detail)); } };
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 360, height: 740 }, { width: 390, height: 844 }, { width: 412, height: 915 }]) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 650, hasTouch: true });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    const action = async (name, id) => page.locator('[data-action="' + name + '"]' + (id === undefined ? '' : '[data-id="' + id + '"]')).first().click();
    await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' }); await page.locator('#splash').waitFor({ state: 'hidden' });
    const frame = await page.locator('.app-frame').boundingBox();
    check(viewport.width + 'px preview is a portrait phone', frame.width <= 480 && frame.height > frame.width, frame);
    await action('new');
    await page.locator('#hero-name').fill('Arin');
    await page.evaluate(() => window.__eldervaleQA.ui.androidBack());
    check('Android Back ends editing and retains the creation form', await page.locator('[data-action="create"]').isVisible() && await page.locator('#hero-name').inputValue() === 'Arin');
    await action('create');
    await action('onboard-next');
    check('Onboarding teaches touch controls', /joystick/i.test(await page.locator('.onboarding-detail').innerText()), await page.locator('.onboarding-detail').innerText());
    await action('onboard-skip'); await page.waitForFunction(() => window.__eldervaleQA.ui.world?.ready);
    check('No keyboard prompts in gameplay', await page.locator('.game-screen kbd:visible').count() === 0, await page.locator('.game-screen kbd:visible').allTextContents());
    check('Floating movement area is available and its joystick stays hidden until touched',await page.locator('#movement-zone').isVisible()&&await page.locator('#joystick').isHidden());
    const controls = ['#joystick', '[data-action="attack"]', '[data-action="skill"]', '[data-action="dodge"]', '[data-action="potion"]'];
    const boxes = [];
    for (const selector of controls) {
      const box = selector==='#joystick'?await movementBox(page):await page.locator('.game-screen ' + selector).boundingBox(); boxes.push({ selector, ...box });
      check(selector + ' is a reachable touch target', box && box.width >= 44 && box.height >= 44 && box.x >= frame.x && box.x + box.width <= frame.x + frame.width + 1 && box.y + box.height <= frame.y + frame.height, box);
    }
    const overlaps = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) overlaps.push([a.selector, b.selector]);
    }
    check('Thumb controls do not overlap', overlaps.length === 0, overlaps);
    const position = await page.evaluate(() => window.__eldervaleQA.store.s.position.x);
    const joy = boxes[0];
    // Independent pointer IDs reproduce two thumbs without keyboard shortcuts.
    const cdp = await context.newCDPSession(page);
    const left = { id: 1, x: joy.x + joy.width / 2, y: joy.y + joy.height / 2 };
    const right = { id: 2, x: boxes[1].x + boxes[1].width / 2, y: boxes[1].y + boxes[1].height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left] });
    check('Joystick appears under the trusted left thumb',await page.locator('#joystick').isVisible());
    left.x = joy.x + joy.width * .85;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, right] });
    await page.waitForTimeout(850);
    const concurrent = await page.evaluate(() => ({ x: window.__eldervaleQA.store.s.position.x, attack: window.__eldervaleQA.ui.world.attackHeld, next: window.__eldervaleQA.ui.world.nextAttack }));
    check('Two thumbs move and repeat attacks together', concurrent.x > position + 8 && concurrent.attack && concurrent.next > 0, concurrent);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    check('Cancelled touches release both controls', await page.evaluate(() => { const w = window.__eldervaleQA.ui.world; return w.mobile.x === 0 && w.mobile.y === 0 && !w.attackHeld; }));
    check('Joystick disappears after the thumb releases',await page.locator('#joystick').isHidden());
    await page.screenshot({ path: 'test-results/android-preview-' + viewport.width + '.png' });
    for (const menu of ['inventory', 'quests', 'map', 'pause']) {
      await gameMenu(page,menu,true);
      check('Quick menu opens ' + menu, await page.locator('.modal-' + menu).isVisible());
      const overflow = await page.locator('.modal').evaluate(el => el.scrollHeight - el.clientHeight);
      check(menu + ' is compact at ' + viewport.width, overflow < 100, overflow);
      await action('close');
    }
    // A late chapter must open directly, including phones with four-row pages.
    const originalQuests = await page.evaluate(() => structuredClone(window.__eldervaleQA.store.s.quests));
    await page.evaluate(() => {
      const quests = window.__eldervaleQA.store.s.quests;
      for (let i = 0; i < 9; i++) quests['m' + i] = { status: 'completed', count: 1 };
      quests.m9 = { status: 'active', count: 0 };
    });
    await gameMenu(page,'quests',true);
    check('Journal opens the current late chapter on short phones', await page.locator('.quest-entry.selected[data-id="m9"]').isVisible());
    await action('close');
    await page.evaluate(quests => { window.__eldervaleQA.store.s.quests = quests; window.__eldervaleQA.store.save(); }, originalQuests);
    await page.evaluate(() => window.__eldervaleQA.ui.androidBack());
    check('Android Back pauses gameplay', await page.locator('.modal-pause').isVisible());
    await page.evaluate(() => window.__eldervaleQA.ui.androidBack());
    check('Android Back closes the panel', await page.locator('.modal').count() === 0);
    await page.evaluate(() => window.__eldervaleQA.ui.appBackground());
    check('Background saves and pauses', await page.evaluate(() => window.__eldervaleQA.store.paused && !!JSON.parse(localStorage.getItem('eldervale.save.v1'))));
    await context.close();
  }
  check('No browser runtime errors', errors.length === 0, errors);
  assert.deepEqual(failures, []);
  console.log(checks.length + ' mobile touch checks passed.');
} finally { await writeFile('test-results/mobile-report.json', JSON.stringify({ checks, failures, errors }, null, 2)); await browser.close(); }
