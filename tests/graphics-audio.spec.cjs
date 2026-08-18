const { test, expect } = require('@playwright/test');

async function installMediaShim(page) {
  await page.addInitScript(() => {
    const originalPaused = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'paused');
    try {
      Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
        configurable: true,
        get() { return this.__dragonPlaying ? false : (originalPaused?.get ? originalPaused.get.call(this) : true); },
      });
    } catch (_) {}
    HTMLMediaElement.prototype.play = function() {
      this.__dragonPlaying = true;
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function() {
      this.__dragonPlaying = false;
    };
  });
}

async function openGame(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await installMediaShim(page);
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

test('iPhone unlocks authored external audio on first gesture and mute persists', async ({ page }) => {
  const errors = await openGame(page);
  const initial = await page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.());
  expect(initial).toBeTruthy();
  expect(initial.assetKind).toBe('external');
  expect(initial.unlocked).toBe(false);
  expect(initial.assets.music.field).toMatch(/^https:\/\/cdn\.jsdelivr\.net\/gh\/.+@\w+\/.+\.(mp3|ogg)$/);
  expect(initial.assets.music.boss).toMatch(/boss\.ogg$/);
  expect(initial.assets.sfx.dice).toMatch(/dice-throw-1\.ogg$/);
  expect(initial.assets.sfx.attack).toMatch(/sfx-attack\.ogg$/);

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

  const sfxPlayed = await page.evaluate(() => window.DRAGON_AUDIO_API.playSfx('dice'));
  expect(sfxPlayed).toBe(true);
  expect(await page.evaluate(() => window.DRAGON_AUDIO_API.snapshot().lastSfx)).toBe('dice');
  expect(errors).toEqual([]);
});

test('audio mode follows field and combat presentation without broad DOM observers', async ({ page }) => {
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
