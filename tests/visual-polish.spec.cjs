const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

function previewPath(testInfo, name) {
  const dir = path.join('test-results', 'visual-polish');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${testInfo.project.name}-${name}.png`);
}

async function openGame(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  return errors;
}

test('V0.6.6.3 code-only visual theme loads on the title screen', async ({ page }, testInfo) => {
  const errors = await openGame(page);

  await expect(page.locator('body')).toHaveClass(/visual-polish-v0663/);
  await expect(page.locator('.version-label')).toHaveText('PROTOTYPE V0.6.6.3');
  await expect(page.locator('link[href*="visual-polish-0663.css"]')).toHaveCount(1);

  const titleVisual = await page.locator('#titleStartArea').evaluate(el => {
    const style = getComputedStyle(el);
    const dragon = document.querySelector('.dragon-shadow');
    const dragonStyle = getComputedStyle(dragon);
    const wingStyle = getComputedStyle(dragon, '::after');
    return {
      radius: parseFloat(style.borderRadius),
      background: style.backgroundImage,
      dragonFontSize: parseFloat(dragonStyle.fontSize),
      wingClip: wingStyle.clipPath,
    };
  });

  expect(titleVisual.radius).toBeGreaterThanOrEqual(10);
  expect(titleVisual.background).not.toBe('none');
  expect(titleVisual.dragonFontSize).toBe(0);
  expect(titleVisual.wingClip).not.toBe('none');
  await page.screenshot({ path: previewPath(testInfo, 'title'), fullPage: true });
  expect(errors).toEqual([]);
});

test('hero cards and board use the upgraded surfaces without changing game flow', async ({ page }, testInfo) => {
  const errors = await openGame(page);

  await page.locator('#titleStartBtn').click();
  const firstHero = page.locator('.hero-card').first();
  await expect(firstHero).toBeVisible();

  const cardBefore = await firstHero.evaluate(el => ({
    radius: parseFloat(getComputedStyle(el).borderRadius),
    portraitHeight: parseFloat(getComputedStyle(el.querySelector('.hero-portrait-wrap')).height),
  }));
  expect(cardBefore.radius).toBeGreaterThanOrEqual(8);
  expect(cardBefore.portraitHeight).toBeGreaterThan(120);
  await page.screenshot({ path: previewPath(testInfo, 'hero-select'), fullPage: true });

  await firstHero.click();
  await expect(firstHero).toHaveClass(/selected/);
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);

  const boardVisual = await page.locator('#worldMap').evaluate(el => {
    const style = getComputedStyle(el);
    const node = el.querySelector('.map-node');
    const nodeStyle = node ? getComputedStyle(node) : null;
    return {
      radius: parseFloat(style.borderRadius),
      background: style.backgroundImage,
      nodeRadius: nodeStyle ? parseFloat(nodeStyle.borderRadius) : 0,
    };
  });

  expect(boardVisual.radius).toBeGreaterThanOrEqual(8);
  expect(boardVisual.background).not.toBe('none');
  expect(boardVisual.nodeRadius).toBeGreaterThanOrEqual(4);
  await page.screenshot({ path: previewPath(testInfo, 'board'), fullPage: true });
  expect(errors).toEqual([]);
});

test('combat presentation keeps a staged background under the visual theme', async ({ page }, testInfo) => {
  const errors = await openGame(page);
  await page.locator('#combatOverlay').evaluate(el => el.classList.remove('hidden'));
  await expect(page.locator('#combatOverlay')).toBeVisible();

  const combatVisual = await page.locator('#combatStage').evaluate(el => {
    const style = getComputedStyle(el);
    return {
      minHeight: parseFloat(style.minHeight),
      radius: parseFloat(style.borderRadius),
      background: style.backgroundImage,
    };
  });

  expect(combatVisual.minHeight).toBeGreaterThanOrEqual(300);
  expect(combatVisual.radius).toBeGreaterThanOrEqual(7);
  expect(combatVisual.background).not.toBe('none');
  await page.screenshot({ path: previewPath(testInfo, 'combat'), fullPage: true });
  expect(errors).toEqual([]);
});
