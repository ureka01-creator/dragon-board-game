const { test, expect } = require('@playwright/test');

async function startKnight(page) {
  await page.addInitScript(() => {
    Math.random = () => 0.99;
  });
  await page.goto('/?dev=1');
  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').filter({ hasText: '기사' }).click();
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  const unlocked = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.unlockDragonCastle());
  expect(unlocked.ok).toBe(true);
  await page.evaluate(() => {
    window.__finalDungeonTask = window.DRAGON_BOARD_DEV_API.enterDragonCastle('knight');
  });
  await expect(page.locator('.final-dungeon-enter')).toBeVisible();
}

async function defeatCurrentEnemy(page) {
  const attack = page.locator('#combatAttackBtn');
  await expect(attack).toBeEnabled({ timeout: 8000 });
  const result = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.enemyHpOne());
  expect(result.ok).toBe(true);
  await attack.click();
  await expect(page.locator('#combatOverlay')).toBeHidden({ timeout: 10000 });
}

test('dragon castle entry presents a four-stage dungeon track before combat', async ({ page }) => {
  await startKnight(page);

  const track = page.locator('.final-dungeon-track');
  await expect(track).toBeVisible();
  await expect(track).toContainText('성문');
  await expect(track).toContainText('회랑');
  await expect(track).toContainText('제단');
  await expect(track).toContainText('왕좌');
  await expect(page.locator('.final-dungeon-enter')).toContainText('성문 수호자');

  await page.locator('.final-dungeon-leave').click();
  await page.evaluate(async () => { await window.__finalDungeonTask; });
});

test('corridor waits for the player D20 roll and altar gates the dragon throne', async ({ page }) => {
  await startKnight(page);
  await page.locator('.final-dungeon-enter').click();

  await expect(page.locator('#combatOverlay')).toBeVisible();
  await defeatCurrentEnemy(page);

  const rollButton = page.locator('.final-dungeon-roll-btn');
  await expect(rollButton).toBeVisible();
  await expect(page.locator('.final-dungeon-stage-title')).toContainText('봉인의 회랑');
  await expect(page.locator('.final-dungeon-stage-objective')).toContainText('목표 13');
  await rollButton.click();
  await expect(page.locator('.final-dungeon-roll-result')).toContainText(/SUCCESS|FAILED/);
  await page.locator('.final-dungeon-continue-btn').click();

  await expect(page.locator('.final-dungeon-altar')).toBeVisible();
  await expect(page.locator('.final-dungeon-seals')).toContainText('🗿');
  await page.locator('.final-dungeon-altar-continue').click();

  await expect(page.locator('.final-dungeon-throne-warning')).toBeVisible();
  await expect(page.locator('.final-dungeon-throne-warning')).toContainText('ANCIENT DRAGON');
  await expect(page.locator('.final-dungeon-throne-open')).toBeVisible();
  await page.locator('.final-dungeon-throne-open').click();

  await expect(page.locator('#combatOverlay')).toBeVisible();
  const combatText = await page.locator('#combatTitle').textContent();
  expect(combatText).toContain('고대 드래곤');
});
