const { test, expect } = require('@playwright/test');

async function openGame(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  return errors;
}

test('visual polish layer is loaded and region board gets atmospheric treatment', async ({ page }) => {
  const errors = await openGame(page);
  await expect(page.locator('body')).toHaveClass(/graphics-audio-v0662/);
  await expect(page.locator('#audioToggle')).toBeVisible();

  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').first().click();
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);

  const visual = await page.locator('#worldMap').evaluate(el => ({
    theme: el.dataset.theme || '',
    background: getComputedStyle(el).backgroundImage,
  }));
  expect(visual.theme).not.toBe('');
  expect(visual.background).not.toBe('none');
  expect(errors).toEqual([]);
});

test('iPhone audio unlocks on first real gesture and mute control persists', async ({ page }) => {
  const errors = await openGame(page);
  const initial = await page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.());
  expect(initial).toBeTruthy();
  expect(initial.unlocked).toBe(false);

  await page.locator('#titleStartBtn').click();
  await expect.poll(() => page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.().unlocked)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.().mode)).toBe('setup');

  const toggle = page.locator('#audioToggle');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('dragon-audio-muted'))).toBe('1');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('dragon-audio-muted'))).toBe('0');
  expect(errors).toEqual([]);
});

test('audio mode follows field and combat presentation without DOM observer loops', async ({ page }) => {
  const errors = await openGame(page);
  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').first().click();
  await page.locator('#startGameBtn').click();
  await expect.poll(() => page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.().mode)).toBe('field');

  await page.locator('#combatTitle').evaluate(el => { el.textContent = '🐉 고대 드래곤'; });
  await page.locator('#combatOverlay').evaluate(el => el.classList.remove('hidden'));
  await expect.poll(() => page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.().mode), { timeout: 2500 }).toBe('boss');

  await page.locator('#combatOverlay').evaluate(el => el.classList.add('hidden'));
  await expect.poll(() => page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.().mode), { timeout: 2500 }).toBe('field');
  expect(errors).toEqual([]);
});
