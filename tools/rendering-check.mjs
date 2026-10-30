import { chromium } from 'playwright-core';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { gameMenu } from './game-controls.mjs';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const checks = [], errors = [];
page.on('pageerror', e => errors.push(e.message));
const check = (label, ok) => { assert(ok, label); checks.push(label); console.log('PASS ' + label); };
const frame = () => page.evaluate(() => window.__eldervaleQA.ui.world.game.loop.frame);
try {
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle' });
  await page.locator('#splash').waitFor({ state: 'hidden' });
  await page.locator('[data-action="new"]').click();
  await page.locator('[data-action="create"]').click();
  await page.locator('[data-action="onboard-skip"]').click();
  await page.waitForFunction(() => window.__eldervaleQA.ui.world?.ready);
  await gameMenu(page,'pause');
  const stopped = await frame(); await page.waitForTimeout(350);
  check('Menu suspends world rendering', await frame() === stopped);
  await page.locator('.pause-menu [data-action="resume"]').click();
  await page.waitForTimeout(250);
  check('Closing a menu resumes world rendering', await frame() > stopped);
  await gameMenu(page,'pause');
  await page.locator('.pause-menu [data-action="title"]').click();
  const titleFrame = await frame();
  await page.setViewportSize({ width: 390, height: 500 });
  await page.waitForTimeout(700);
  check('Title suspends the hidden world renderer', await frame() === titleFrame);
  check('Hidden world retains its phone-sized canvas through keyboard-sized reflow', await page.evaluate(() => { const c = document.querySelector('#world canvas'),r=c.getBoundingClientRect(); return c.width>=380&&c.height>=480&&r.width>=380&&r.height>=480; }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#title-screen [data-action="continue"]').click();
  await page.waitForTimeout(250);
  check('Continue resumes the existing world renderer', await frame() > titleFrame);
  check('Rendering lifecycle has no page errors', errors.length === 0);
} finally {
  await writeFile('test-results/rendering-report.json', JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
