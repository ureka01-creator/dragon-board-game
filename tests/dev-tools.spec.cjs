const { test, expect } = require('@playwright/test');

async function startDevSolo(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?dev=1');
  await expect(page.locator('.version-label')).toHaveText('PROTOTYPE V0.6.4.0');
  await expect.poll(() => page.evaluate(() => !!window.DRAGON_BOARD_DEV_API)).toBe(true);
  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').first().click();
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  return errors;
}

test('DEV world tools can teleport, force a safe tile type, and set MOVE', async ({ page }) => {
  const errors = await startDevSolo(page);
  const result = await page.evaluate(async () => {
    const api = window.DRAGON_BOARD_DEV_API;
    const before = api.snapshot();
    const hero = before.heroes[0];
    const target = before.nodes.find(node => !node.protected && !node.locked && node.links.length >= 2);
    if (!hero || !target) throw new Error('DEV test target missing');

    const forced = api.setNodeType(target.id, '사건');
    const teleported = api.teleportNode(hero.id, target.id);
    const moved = api.setMove(hero.id, 3);
    await new Promise(resolve => setTimeout(resolve, 120));
    const after = api.snapshot();
    const afterNode = after.nodes.find(node => node.id === target.id);
    const afterHero = after.heroes.find(item => item.id === hero.id);
    return { forced, teleported, moved, after, afterNode, afterHero };
  });

  expect(result.forced.ok).toBe(true);
  expect(result.teleported.ok).toBe(true);
  expect(result.moved.ok).toBe(true);
  expect(result.afterNode.type).toBe('사건');
  expect(result.afterHero.position).toBe(result.afterNode.id);
  expect(result.after.activeHeroId).toBe(result.afterHero.id);
  expect(result.after.rolled).toBe(3);
  expect(result.after.moveRemaining).toBe(3);
  expect(errors).toEqual([]);
});

test('DEV panel exposes new controls and protects structural tiles from type forcing', async ({ page }) => {
  const errors = await startDevSolo(page);
  await page.locator('.dev-toggle-btn').click();
  await expect(page.locator('[data-dev-node]')).toBeVisible();
  await expect(page.locator('[data-act="nodeTeleport"]')).toBeVisible();
  await expect(page.locator('[data-act="move"]')).toBeVisible();
  await expect(page.locator('[data-act="nodeType"]')).toBeVisible();
  expect(await page.locator('[data-dev-node] option').count()).toBeGreaterThan(0);

  const protectedResult = await page.evaluate(() => {
    const api = window.DRAGON_BOARD_DEV_API;
    const snap = api.snapshot();
    const protectedNode = snap.nodes.find(node => node.protected);
    if (!protectedNode) throw new Error('Protected node missing');
    return api.setNodeType(protectedNode.id, '사건');
  });
  expect(protectedResult.ok).toBe(false);
  expect(errors).toEqual([]);
});
