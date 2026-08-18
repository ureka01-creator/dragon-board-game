const { test, expect } = require('@playwright/test');

const SHOP_API_INJECTION = String.raw`
window.__SHOP_TEST_API = {
  snapshot() {
    const hero = getActiveHero();
    return {
      gold: state.gold,
      bag: hero ? heroInventory(hero).length : 0,
      rolled: state.rolled,
      moveRemaining: state.moveRemaining,
      hero: hero ? { id:hero.id, position:hero.position, hp:hero.currentHp } : null,
    };
  },
  prepareShop() {
    const hero = getActiveHero();
    const target = WORLD_NODES.find(n => n.type === '상점' && (n.links || []).length > 0 && !nodeIsLocked(n));
    if (!hero || !target) throw new Error('No shop node available');
    const fromId = target.links.find(id => WORLD_NODES.some(n => n.id === id && !nodeIsLocked(n))) || target.links[0];
    hero.position = fromId;
    hero.down = false;
    hero.acted = false;
    hero.currentHp = hero.hp;
    if (hero.currentMana !== null) hero.currentMana = maxMana(hero);
    state.activeHeroId = hero.id;
    state.viewAreaId = target.areaId;
    state.rolled = 4;
    state.moveRemaining = 4;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = fromId;
    state.moveVisitedNodeIds = new Set(target.links || []);
    state.moveVisitedNodeIds.add(fromId);
    state.discoveredNodeIds.add(fromId);
    state.discoveredNodeIds.delete(target.id);
    state.gold = 100;
    renderAll();
    return { targetId:target.id, fromId };
  },
  enterShop(targetId) {
    return moveActiveHero(targetId);
  }
};
`;

async function installShopApi(page) {
  await page.route('**/js/game.js*', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const marker = body.lastIndexOf('})();');
    if (marker < 0) throw new Error('Unable to inject shop test API');
    body = body.slice(0, marker) + '\n' + SHOP_API_INJECTION + '\n' + body.slice(marker);
    await route.fulfill({ response, body, contentType:'application/javascript' });
  });
}

async function startShop(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await installShopApi(page);
  await page.goto('/');
  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').first().click();
  await page.locator('#startGameBtn').click();
  await expect.poll(() => page.evaluate(() => !!window.__SHOP_TEST_API)).toBe(true);
  const prep = await page.evaluate(() => window.__SHOP_TEST_API.prepareShop());
  await page.evaluate(id => { window.__pendingShopMove = window.__SHOP_TEST_API.enterShop(id); }, prep.targetId);
  await expect(page.locator('#modal')).toHaveClass(/shop-modal/);
  return errors;
}

test('shop product has a touch-friendly detail view without purchasing', async ({ page }) => {
  const errors = await startShop(page);
  const product = page.locator('.shop-product:not(.sold)').first();
  await expect(product).toBeVisible();
  const before = await page.evaluate(() => window.__SHOP_TEST_API.snapshot());
  await expect(product.locator('.shop-ux-info-btn')).toBeVisible();
  await product.locator('.shop-ux-info-btn').click();
  await expect(product.locator('.shop-ux-detail')).toBeVisible();
  const after = await page.evaluate(() => window.__SHOP_TEST_API.snapshot());
  expect(after.gold).toBe(before.gold);
  expect(after.bag).toBe(before.bag);
  expect(errors).toEqual([]);
});

test('shop buy and sell require confirmation and show completion feedback', async ({ page }) => {
  const errors = await startShop(page);
  const before = await page.evaluate(() => window.__SHOP_TEST_API.snapshot());

  let buy = page.locator('[data-shop-buy]:not([disabled])').first();
  const boughtName = await buy.locator('xpath=..').locator('.shop-item-copy strong').textContent();
  await buy.click();
  await expect(buy).toHaveAttribute('data-shop-ux-armed', '1');
  let snap = await page.evaluate(() => window.__SHOP_TEST_API.snapshot());
  expect(snap.gold).toBe(before.gold);
  expect(snap.bag).toBe(before.bag);

  await buy.click();
  await expect(page.locator('.shop-ux-toast')).toContainText('구매 완료');
  await expect(page.locator('.shop-ux-toast')).toContainText((boughtName || '').trim());
  snap = await page.evaluate(() => window.__SHOP_TEST_API.snapshot());
  expect(snap.gold).toBeLessThan(before.gold);
  expect(snap.bag).toBe(before.bag + 1);

  let sell = page.locator('[data-shop-sell]').first();
  await expect(sell).toBeVisible();
  await sell.click();
  await expect(sell).toHaveAttribute('data-shop-ux-armed', '1');
  const afterFirstSellTap = await page.evaluate(() => window.__SHOP_TEST_API.snapshot());
  expect(afterFirstSellTap.bag).toBe(before.bag + 1);

  await sell.click();
  await expect(page.locator('.shop-ux-toast')).toContainText('판매 완료');
  const sold = await page.evaluate(() => window.__SHOP_TEST_API.snapshot());
  expect(sold.bag).toBe(before.bag);
  expect(sold.gold).toBeGreaterThan(snap.gold);

  await page.locator('#modalCloseBtn').click();
  await page.evaluate(() => window.__pendingShopMove);
  await expect(page.locator('#modal')).toBeHidden();
  expect(errors).toEqual([]);
});
