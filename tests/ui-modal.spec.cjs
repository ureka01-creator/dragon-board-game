const { test, expect } = require('@playwright/test');

async function startDevGame(page) {
  await page.goto('/?dev=1');
  await expect(page.locator('.version-label')).toHaveText('PROTOTYPE V0.6.4.4');
  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').first().click();
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => !!window.DRAGON_BOARD_DEV_API)).toBe(true);
}

test('divine blessing locks page scroll and restores it after confirm', async ({ page }) => {
  await startDevGame(page);

  await page.evaluate(() => {
    const entry = document.createElement('div');
    entry.textContent = '💀 기사 쓰러짐 → 망자의 땅 마을 귀환';
    document.querySelector('#gameLog').appendChild(entry);
  });

  const overlay = page.locator('.blessing-overlay');
  await expect(overlay).toBeVisible();

  const locked = await page.evaluate(() => ({
    bodyPosition: document.body.style.position,
    bodyOverflow: document.body.style.overflow,
    rootOverflow: document.documentElement.style.overflow,
    rootOverscroll: document.documentElement.style.overscrollBehavior,
  }));
  expect(locked.bodyPosition).toBe('fixed');
  expect(locked.bodyOverflow).toBe('hidden');
  expect(locked.rootOverflow).toBe('hidden');
  expect(locked.rootOverscroll).toBe('none');

  await page.locator('.blessing-ok').click();
  await expect(overlay).toBeHidden();

  const restored = await page.evaluate(() => ({
    bodyPosition: document.body.style.position,
    bodyOverflow: document.body.style.overflow,
    rootOverflow: document.documentElement.style.overflow,
  }));
  expect(restored.bodyPosition).not.toBe('fixed');
  expect(restored.bodyOverflow).not.toBe('hidden');
  expect(restored.rootOverflow).not.toBe('hidden');
});

test('hero bag item opens detail with a normal tap in DEV/iPhone flow', async ({ page }) => {
  await startDevGame(page);

  const itemId = await page.evaluate(() => {
    const snapshot = window.DRAGON_BOARD_DEV_API.snapshot();
    const heroId = snapshot.activeHeroId;
    const item = snapshot.items.find(entry => entry.type === 'equipment') || snapshot.items.find(entry => entry.type === 'consumable');
    if (!item) throw new Error('No test item available');
    const result = window.DRAGON_BOARD_DEV_API.giveItem(heroId, item.id);
    if (!result?.ok) throw new Error(result?.message || 'giveItem failed');
    return item.id;
  });
  expect(itemId).toBeTruthy();

  await page.locator('.party-status-btn').first().click();
  await expect(page.locator('#modal')).toHaveClass(/hero-status-modal/);
  await expect(page.locator('#modal')).not.toHaveClass(/hidden/);

  const row = page.locator('[data-status-bag-index="0"]').first();
  await expect(row).toBeVisible();
  await row.click();

  await expect(page.locator('.status-item-detail-sheet')).toBeVisible();
  await expect(page.locator('#modal')).toHaveClass(/status-item-detail-modal/);
});
