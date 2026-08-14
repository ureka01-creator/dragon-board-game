const { test, expect } = require('@playwright/test');

const EVENT_API_INJECTION = String.raw`
window.__EVENT_EXPANSION_TEST_API = {
  drawRegion(region, count = 36) {
    state.eventDeck = [];
    state.eventDiscard = [];
    state.eventDeckRegion = null;
    const result = [];
    for (let i = 0; i < count; i++) {
      const card = drawEventCard({ region });
      if (!card) break;
      result.push({ id:card.id, regions:Array.isArray(card.regions) ? [...card.regions] : [], rarity:card.rarity || 'common' });
    }
    return result;
  }
};
`;

async function installEventApi(page) {
  await page.route('**/js/game.js*', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const marker = body.lastIndexOf('})();');
    if (marker < 0) throw new Error('Unable to inject event expansion test API');
    body = body.slice(0, marker) + '\n' + EVENT_API_INJECTION + '\n' + body.slice(marker);
    await route.fulfill({ response, body, contentType:'application/javascript' });
  });
}

test('V0.6.4.2 expands the event library to 40 cards with regional and rare events', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.version-label')).toHaveText('PROTOTYPE V0.6.4.2');
  const summary = await page.evaluate(() => {
    const cards = window.EVENT_CARDS || [];
    const regionCounts = {};
    ['grave','forest','war','volcano'].forEach(region => {
      regionCounts[region] = cards.filter(card => Array.isArray(card.regions) && card.regions.includes(region)).length;
    });
    return {
      total: cards.length,
      ids: cards.map(card => card.id),
      rare: cards.filter(card => card.rarity === 'rare').length,
      regionCounts
    };
  });
  expect(summary.total).toBe(40);
  expect(new Set(summary.ids).size).toBe(40);
  expect(summary.rare).toBeGreaterThanOrEqual(4);
  Object.values(summary.regionCounts).forEach(count => expect(count).toBeGreaterThanOrEqual(4));
  expect(errors).toEqual([]);
});

test('each region generates 8 event tiles and 10 normal combat tiles', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const composition = await page.evaluate(() => ['A','B','C','D'].map(areaId => {
    const nodes = WORLD_NODES.filter(node => node.areaId === areaId);
    return {
      areaId,
      events:nodes.filter(node => node.type === '사건').length,
      combats:nodes.filter(node => node.type === '전투').length,
      dungeons:nodes.filter(node => node.type === '던전').length,
      bosses:nodes.filter(node => node.type === '보스').length
    };
  }));
  composition.forEach(area => {
    expect(area.events).toBe(8);
    expect(area.combats).toBe(10);
    expect(area.dungeons).toBe(1);
    expect(area.bosses).toBe(1);
  });
  expect(errors).toEqual([]);
});

test('regional event deck never serves another region specific card', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await installEventApi(page);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!window.__EVENT_EXPANSION_TEST_API)).toBe(true);
  const result = await page.evaluate(() => {
    const output = {};
    for (const region of ['grave','forest','war','volcano']) {
      output[region] = window.__EVENT_EXPANSION_TEST_API.drawRegion(region, 36);
    }
    return output;
  });
  for (const [region, cards] of Object.entries(result)) {
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some(card => card.regions.includes(region))).toBe(true);
    for (const card of cards) {
      if (!card.regions.length) continue;
      expect(card.regions).toContain(region);
    }
  }
  expect(errors).toEqual([]);
});
