import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { openGameMenus } from './game-controls.mjs';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage(), errors = [], missing = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.status() >= 400) missing.push(response.status() + ' ' + response.url()); });
await mkdir('test-results', { recursive: true });
async function shot(name) { await page.waitForTimeout(450); await page.screenshot({ path: 'test-results/' + name + '.png' }); }
async function action(name, id, scope = '') { if(scope.includes('game-nav'))await openGameMenus(page);await page.locator(scope + '[data-action="' + name + '"]' + (id ? '[data-id="' + id + '"]' : '')).first().click(); }
async function verify(label, test) { await test(); checks.push(label); console.log('PASS ' + label); }
async function move(key, ms) { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); }
try {
  await page.goto(process.env.BASE_URL || 'http://localhost:5175/', { waitUntil: 'networkidle' });
  await page.locator('#splash').waitFor({ state: 'hidden' });
  await verify('Title and generated artwork', async () => { assert(await page.locator('h1').innerText() === 'ELDERVALE'); await shot('01-title'); });
  await action('new');
  await page.locator('#hero-name').fill('Arin QA');
  await shot('02-creation');
  await action('create');
  await verify('Three-page onboarding', async () => { for (let i = 0; i < 3; i++) await action('onboard-next'); });
  await page.locator('.modal-cinematic').waitFor();
  await action('cinematic-skip');
  await page.waitForFunction(() => document.querySelector('#minimap').getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0);
  await shot('03-elderbrook');
  await verify('Inventory, equipment, and item detail', async () => { await action('inventory', undefined, '.game-nav '); await page.locator('.item-card').first().click(); assert(await page.locator('.item-detail h3').innerText()); await shot('04-inventory'); await action('close', undefined, '.modal '); });
  await verify('Talents spend a point', async () => { await action('character', undefined, '.game-header '); await action('character-view', 'talents'); await action('learn', 'blade'); assert(await page.evaluate(() => window.__eldervaleQA.store.s.points === 0)); await shot('05-talents'); await action('close', undefined, '.modal '); });
  await verify('Paged journal exposes all twenty-six quests', async () => { await page.keyboard.press('j'); assert(await page.locator('.quest-entry').count() === 5); await action('quest-page', '1'); assert(await page.locator('.quest-entry').count() === 5); await action('quest-filter', 'side'); assert(await page.locator('.quest-entry').count() === 5); await action('quest-page', '1'); assert(await page.locator('.quest-entry').count() === 5); await shot('06-journal'); await action('close', undefined, '.modal '); });
  await verify('World map paginates every connected location', async () => { await page.keyboard.press('m'); assert(await page.locator('.atlas-region').count() === 4); await page.locator('[data-action="map-page"][aria-label="Next page"]').click();await page.locator('[data-action="map-page"][aria-label="Next page"]').click();await action('region', 'spire'); assert((await page.locator('.atlas-detail > p').innerText()).includes('Follow the main quest')); await shot('07-worldmap'); await action('close', undefined, '.modal '); });
  await verify('Settings, difficulty and focus trap', async () => { await page.keyboard.press('Escape'); await action('settings', undefined, '.pause-menu '); await action('settings-page', 'combat'); await action('difficulty', 'story'); await shot('08-settings'); await page.keyboard.press('Escape'); });
  // Walk through the actual authored town and speak to the archivist.
  const before = await page.evaluate(() => window.__eldervaleQA.store.s.position.x);
  await move('a', 400);
  assert(await page.evaluate(() => window.__eldervaleQA.store.s.position.x) < before - 8, 'Real keyboard movement must change position');
  await page.evaluate(() => { const w = window.__eldervaleQA.ui.world; w.player.setPosition(400, 370); });
  await page.keyboard.down('w');
  await page.waitForFunction(() => window.__eldervaleQA.ui.world.player.y <= 205);
  await page.keyboard.up('w');
  await page.keyboard.down('a');
  await page.waitForFunction(() => window.__eldervaleQA.ui.world.player.x <= 286);
  await page.keyboard.up('a');
  // The archivist can now stroll around the square; approach her current spot.
  await page.evaluate(() => { const w=window.__eldervaleQA.ui.world,o=w.layout.objects.find(o=>o.kind==='npc'&&o.target==='mara');w.stopMovement();w.player.setPosition(o.x,o.y+20);w.direction='up'; });
  await page.locator('#interaction-prompt').waitFor({state:'visible'});
  await page.waitForTimeout(250);
  await shot('09-town-walk');
  const near = await page.locator('#interaction-name').innerText();
  await verify('Real movement and NPC interaction', async () => { assert(near==='Talk', 'Expected contextual Talk, got: ' + near); await page.locator('#interaction-prompt').click(); await page.locator('.spoken-text').waitFor(); await shot('10-dialogue'); assert((await page.locator('.dialogue-nameplate h2').innerText()) === 'Mara'); await action('dialogue-next'); await action('accept', 'memory'); await action('close', undefined, '.modal '); });
  await verify('Campaign progress and quest persist on reload', async () => { await action('pause', undefined, '.game-nav '); await action('save', undefined, '.pause-menu '); await page.reload({ waitUntil: 'networkidle' }); await page.locator('#splash').waitFor({ state: 'hidden' }); const save = await page.evaluate(() => JSON.parse(localStorage.getItem('eldervale.save.v1'))); assert(save.quests.m0.status === 'completed'); assert(save.quests.memory.status === 'active'); assert(save.name === 'Arin QA'); await action('continue'); });
  await page.waitForFunction(() => document.querySelector('#minimap').getContext('2d').getImageData(0, 0, 1, 1).data[3] > 0);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await shot('11-mobile-pause');
  await action('resume', undefined, '.pause-menu ');
  await shot('12-mobile-world');
  await verify('Floating touch controls and mobile layout', async () => { assert(await page.locator('#movement-zone').isVisible());assert(await page.locator('#joystick').isHidden());assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); });
  await verify('Compact mobile menus fit the viewport', async () => {
    for(const menu of ['inventory','character','quests','map','codex','settings']){
      await page.evaluate(menu=>window.__eldervaleQA.ui.action(menu),menu);
      await page.waitForTimeout(300);
      const overflow=await page.locator('.modal').evaluate(el=>el.scrollHeight-el.clientHeight);
      assert(overflow<100,menu+' has excessive vertical scroll: '+overflow);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await shot('mobile-'+menu);await action('close',undefined,'.modal ');
    }
    await page.evaluate(()=>window.__eldervaleQA.ui.action('character'));
    await action('character-view','talents','.modal ');await page.waitForTimeout(300);
    const overflow=await page.locator('.modal').evaluate(el=>el.scrollHeight-el.clientHeight);assert(overflow<100,'Mobile talents have excessive scroll: '+overflow);
    await shot('mobile-talents');await action('close',undefined,'.modal ');
  });
  await page.keyboard.press('Escape'); await action('title', undefined, '.pause-menu ');
  await shot('13-mobile-title');
  assert.deepEqual(errors, [], 'Runtime errors');
  assert.deepEqual([...new Set(missing)], [], 'Missing assets');
  console.log('All ' + checks.length + ' browser checks passed.');
} finally {
  await writeFile('test-results/browser-report.json', JSON.stringify({ checks, errors, missing: [...new Set(missing)] }, null, 2));
  await browser.close();
}
