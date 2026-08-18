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

test('iPhone movement dice still settles with the polish layer enabled', async ({ page }) => {
  const errors = await openGame(page);
  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').first().click();
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);

  const die = page.locator('#diceRoller');
  await page.locator('#rollBtn').click();
  await expect(die).toHaveAttribute('aria-hidden', 'false', { timeout: 2500 });
  await expect(die).toHaveAttribute('aria-hidden', 'true', { timeout: 7000 });
  expect(errors).toEqual([]);
});

test('authored external audio is vendored locally and iPhone mute state persists', async ({ page }) => {
  const errors = await openGame(page);
  const initial = await page.evaluate(() => window.DRAGON_AUDIO_API?.snapshot?.());
  expect(initial).toBeTruthy();
  expect(initial.assetKind).toBe('vendored-external');
  expect(initial.unlocked).toBe(false);
  expect(initial.assets.music.field).toBe('assets/audio/bgm/field.mp3');
  expect(initial.assets.music.boss).toBe('assets/audio/bgm/boss.mp3');
  expect(initial.assets.sfx.dice).toBe('assets/audio/sfx/dice.ogg');
  expect(initial.assets.sfx.attack).toBe('assets/audio/sfx/attack.ogg');

  for (const asset of [
    '/assets/audio/bgm/title.mp3',
    '/assets/audio/bgm/field.mp3',
    '/assets/audio/bgm/combat.ogg',
    '/assets/audio/bgm/boss.mp3',
    '/assets/audio/sfx/dice.ogg',
    '/assets/audio/sfx/attack.ogg',
  ]) {
    const response = await page.request.get(asset);
    expect(response.ok(), `${asset} should be served`).toBe(true);
    expect((await response.body()).length, `${asset} should not be empty`).toBeGreaterThan(4000);
  }

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
