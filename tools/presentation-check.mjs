import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const checks = [], failures = [], errors = [], measurements = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('test-results', { recursive: true });
const check = (label, condition, detail) => {
  if (condition) { checks.push(label); console.log('PASS ' + label); }
  else { failures.push({ label, detail }); console.error('FAIL ' + label + ': ' + JSON.stringify(detail)); }
};
const action = async (name, id) => page.locator('[data-action="' + name + '"]' + (id === undefined ? '' : '[data-id="' + id + '"]')).first().click();
const font = selector => page.locator(selector).first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
async function panelFit(label) {
  const bounds = await page.locator('.modal').evaluate(el => ({ overflow: el.scrollHeight - el.clientHeight, horizontal: el.scrollWidth - el.clientWidth }));
  measurements.push({ label, ...bounds });
  check(label + ' fits without extensive scrolling', bounds.overflow < 100 && bounds.horizontal <= 1, bounds);
}
async function textSize(selector, min) {
  const size = await font(selector);
  check(selector + ' is at least ' + min + ' px', size >= min, size);
}
try {
  await page.goto(process.env.BASE_URL || 'http://localhost:5175/', { waitUntil: 'networkidle' });
  await page.locator('#splash').waitFor({ state: 'hidden' });
  await textSize('.title-story', 16);
  await textSize('.menu-primary', 16);
  await action('new');
  await panelFit('Desktop creation');
  await action('create'); await action('onboard-skip');
  await page.waitForFunction(() => window.__eldervaleQA.ui.world?.ready);
  await textSize('.vital-row > span:last-child', 12);
  await textSize('#guide-label', 14);
  await textSize('.action-bar > button > span:last-of-type', 12);
  const feet = await page.evaluate(() => {
    const { ui, store } = window.__eldervaleQA, world = ui.world;
    store.paused = true; world.player.anims.stop();
    const images = new Map();
    function footGap(sprite) {
      const frame = sprite.frame, texture = sprite.texture;
      if (!images.has(texture.key)) {
        const original = texture.getSourceImage(), canvas = document.createElement('canvas');
        canvas.width = original.width; canvas.height = original.height;
        const paint = canvas.getContext('2d'); paint.drawImage(original, 0, 0);
        images.set(texture.key, paint);
      }
      const pixels = images.get(texture.key).getImageData(frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight).data;
      let bottom = -1;
      for (let y = 0; y < frame.cutHeight; y++) for (let x = 0; x < frame.cutWidth; x++) {
        if (pixels[(y * frame.cutWidth + x) * 4 + 3] >= 128) bottom = Math.max(bottom, y);
      }
      return (frame.y + bottom + 1 - sprite.displayOriginY) * sprite.scaleY;
    }
    const result = [], original = world.player.frame.name;
    for (const hero of ['hero1', 'hero3', 'hero5']) for (const dir of ['down', 'up', 'left', 'right']) for (let i = 0; i < 4; i++) {
      const name = hero + '/walk/' + dir + '/' + i;
      if (!world.textures.get('heroes').has(name)) continue;
      world.player.setFrame(name); result.push({ frame: name, gap: footGap(world.player) });
    }
    world.player.setFrame(original);
    for (const sprite of world.children.list.filter(child => child.type === 'Sprite' && child.texture.key === 'actors')) result.push({ frame: sprite.frame.name, gap: footGap(sprite) });
    store.paused = false;
    return result;
  });
  measurements.push({ label: 'Visible feet relative to ground point', feet });
  check('Every class, direction and town NPC has feet on the ground', feet.every(item => Math.abs(item.gap) <= 1.1), feet.filter(item => Math.abs(item.gap) > 1.1));
  await page.screenshot({ path: 'test-results/presentation-desktop-world.png' });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 360, height: 740 }]) {
    await page.setViewportSize(viewport);
    for (const menu of ['inventory', 'character', 'quests', 'map', 'codex', 'settings']) {
      await page.evaluate(menu => window.__eldervaleQA.ui.action(menu), menu);
      if (menu === 'character' && viewport.width <= 650) await action('character-view', 'overview');
      await page.waitForTimeout(150);
      await panelFit(viewport.width + 'x' + viewport.height + ' ' + menu);
      if (menu === 'inventory') await textSize('.item-card > span:last-of-type', 12);
      if (menu === 'quests') await textSize('.quest-detail > p', 14);
      if (menu === 'codex') await textSize('.codex-entry > p', 13);
      if (viewport.width === 390) await page.screenshot({ path: 'test-results/presentation-mobile-' + menu + '.png' });
      if (menu === 'character' && viewport.width <= 650) {
        await action('character-view', 'talents'); await panelFit(viewport.width + 'x' + viewport.height + ' talents');
        if (viewport.width === 390) await page.screenshot({ path: 'test-results/presentation-mobile-talents.png' });
      }
      await action('close');
    }
    check(viewport.width + 'px page has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), viewport);
  }
  check('No browser runtime errors', errors.length === 0, errors);
  assert.deepEqual(failures, [], 'Presentation regression checks');
  console.log(checks.length + ' presentation checks passed.');
} finally {
  await writeFile('test-results/presentation-report.json', JSON.stringify({ checks, failures, errors, measurements }, null, 2));
  await browser.close();
}
