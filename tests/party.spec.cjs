const { test, expect } = require('@playwright/test');

async function startDevHeroes(page, count) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?dev=1');
  await expect(page.locator('.version-label')).toHaveText('PROTOTYPE V0.6.4.1');
  await expect.poll(() => page.evaluate(() => Boolean(window.DRAGON_BOARD_DEV_API))).toBe(true);
  await page.locator('#titleStartBtn').click();
  const cards = page.locator('.hero-card');
  for (let i = 0; i < count; i += 1) await cards.nth(i).click();
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  return errors;
}

async function coLocateForParty(page, partyCount) {
  return page.evaluate(({ partyCount }) => {
    const api = window.DRAGON_BOARD_DEV_API;
    const snap = api.snapshot();
    const heroes = snap.heroes.slice(0, partyCount);
    const nodeById = new Map(snap.nodes.map(node => [node.id, node]));
    const source = snap.nodes.find(node => {
      if (node.protected || node.locked) return false;
      const sameAreaLinks = node.links.filter(id => nodeById.get(id)?.areaId === node.areaId && !nodeById.get(id)?.locked);
      return sameAreaLinks.length >= 2;
    }) || snap.nodes.find(node => !node.protected && !node.locked);
    if (!source || heroes.length !== partyCount) throw new Error('party setup target missing');
    for (let i = heroes.length - 1; i >= 0; i -= 1) api.teleportNode(heroes[i].id, source.id);
    return { heroIds: heroes.map(hero => hero.id), sourceId: source.id, areaId: source.areaId };
  }, { partyCount });
}

async function formParty(page, partyCount) {
  const setup = await coLocateForParty(page, partyCount);
  await expect(page.locator('#partyManageBtn')).toBeVisible();
  await expect(page.locator('#partyManageBtn')).toBeEnabled();
  await page.locator('#partyManageBtn').click();
  await expect(page.locator('.party-manage-sheet')).toBeVisible();
  const selectable = page.locator('[data-party-hero]:not(:disabled)');
  const selectableCount = await selectable.count();
  for (let i = 0; i < selectableCount; i += 1) await selectable.nth(i).check();
  await page.locator('#partySaveBtn').click();
  await expect.poll(() => page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot().parties.length)).toBe(1);
  return setup;
}

async function safeAdjacentTarget(page, sourceId, type = '길') {
  return page.evaluate(({ sourceId, type }) => {
    const api = window.DRAGON_BOARD_DEV_API;
    const snap = api.snapshot();
    const source = snap.nodes.find(node => node.id === sourceId);
    if (!source) throw new Error('source node missing');
    const target = source.links.map(id => snap.nodes.find(node => node.id === id)).find(node => node && !node.locked && !node.protected && node.areaId === source.areaId);
    if (!target) throw new Error('safe adjacent target missing');
    const forced = api.setNodeType(target.id, type);
    if (!forced.ok) throw new Error(forced.message);
    return target.id;
  }, { sourceId, type });
}

async function beginMoveTo(page, heroId, targetId, steps = 1) {
  const result = await page.evaluate(({ heroId, steps }) => window.DRAGON_BOARD_DEV_API.setMove(heroId, steps), { heroId, steps });
  expect(result.ok).toBe(true);
  await page.waitForTimeout(80);
  const modalChoiceVisible = await page.locator('[data-portal-yes], [data-village-rest]').filter({ visible: true }).count().catch(() => 0);
  if (!modalChoiceVisible) {
    const target = page.locator(`[data-node-id="${targetId}"]`);
    if (await target.count()) await target.click();
  }
}

test('2 heroes can form and disband a party from the world UI', async ({ page }) => {
  const errors = await startDevHeroes(page, 2);
  await formParty(page, 2);
  const formed = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  expect(formed.parties).toHaveLength(1);
  expect(formed.parties[0].memberIds).toHaveLength(2);
  expect(formed.heroes.filter(hero => hero.partyId === formed.parties[0].id)).toHaveLength(2);
  await expect(page.locator('#partyStatusText')).toContainText('PARTY');

  await page.locator('#partyManageBtn').click();
  await page.locator('#partyDisbandBtn').click();
  const disbanded = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  expect(disbanded.parties).toHaveLength(0);
  expect(disbanded.heroes.every(hero => !hero.partyId)).toBe(true);
  expect(errors).toEqual([]);
});

test('party shares one MOVE and finishes the world turn together', async ({ page }) => {
  const errors = await startDevHeroes(page, 3);
  const setup = await formParty(page, 2);
  const targetId = await safeAdjacentTarget(page, setup.sourceId, '길');
  await beginMoveTo(page, setup.heroIds[0], targetId, 1);
  await expect.poll(() => page.evaluate(({ ids, targetId }) => {
    const s = window.DRAGON_BOARD_DEV_API.snapshot();
    const two = ids.map(id => s.heroes.find(hero => hero.id === id));
    return two.every(hero => hero?.position === targetId && hero?.acted) && s.activeHeroId === s.heroes[2].id;
  }, { ids: setup.heroIds, targetId })).toBe(true);
  expect(errors).toEqual([]);
});

test('2-person party enters normal combat together', async ({ page }) => {
  const errors = await startDevHeroes(page, 2);
  const setup = await formParty(page, 2);
  const targetId = await safeAdjacentTarget(page, setup.sourceId, '전투');
  await beginMoveTo(page, setup.heroIds[0], targetId, 1);
  await expect(page.locator('#combatOverlay')).not.toHaveClass(/hidden/);
  await expect(page.locator('.stage-hero-actor')).toHaveCount(2);
  const positions = await page.evaluate(ids => {
    const s = window.DRAGON_BOARD_DEV_API.snapshot();
    return ids.map(id => s.heroes.find(hero => hero.id === id)?.position);
  }, setup.heroIds);
  expect(new Set(positions).size).toBe(1);
  expect(errors).toEqual([]);
});

test('party crosses a region entrance together', async ({ page }) => {
  const errors = await startDevHeroes(page, 2);
  const snap = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  const entrance = snap.nodes.find(node => node.type === '입구' && !node.locked && node.links.length);
  if (!entrance) throw new Error('entrance missing');
  const source = entrance.links.map(id => snap.nodes.find(node => node.id === id)).find(node => node && node.areaId === entrance.areaId && !node.locked);
  if (!source) throw new Error('entrance source missing');
  const heroes = snap.heroes.slice(0, 2);
  await page.evaluate(({ heroes, sourceId }) => {
    const api = window.DRAGON_BOARD_DEV_API;
    for (let i = heroes.length - 1; i >= 0; i -= 1) api.teleportNode(heroes[i].id, sourceId);
  }, { heroes, sourceId: source.id });
  await page.locator('#partyManageBtn').click();
  const checks = page.locator('[data-party-hero]:not(:disabled)');
  for (let i = 0; i < await checks.count(); i += 1) await checks.nth(i).check();
  await page.locator('#partySaveBtn').click();

  const move = await page.evaluate(heroId => window.DRAGON_BOARD_DEV_API.setMove(heroId, 1), heroes[0].id);
  expect(move.ok).toBe(true);
  await page.waitForTimeout(80);
  if (!(await page.locator('[data-portal-yes]').isVisible().catch(() => false))) await page.locator(`[data-node-id="${entrance.id}"]`).click();
  await expect(page.locator('[data-portal-yes]')).toBeVisible();
  await page.locator('[data-portal-yes]').click();
  await expect.poll(() => page.evaluate(ids => {
    const s = window.DRAGON_BOARD_DEV_API.snapshot();
    const members = ids.map(id => s.heroes.find(hero => hero.id === id));
    return members.every(hero => hero && hero.position === members[0].position) && members[0].areaId !== undefined;
  }, heroes.map(hero => hero.id))).toBe(true);
  const after = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  const members = heroes.map(hero => after.heroes.find(item => item.id === hero.id));
  expect(members[0].position).toBe(members[1].position);
  expect(members[0].areaId).not.toBe(source.areaId);
  expect(errors).toEqual([]);
});

test('party village stop recovers every member and consumes remaining MOVE', async ({ page }) => {
  const errors = await startDevHeroes(page, 2);
  const snap = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  const village = snap.nodes.find(node => node.type === '마을' && node.links.length);
  if (!village) throw new Error('village missing');
  const source = village.links.map(id => snap.nodes.find(node => node.id === id)).find(node => node && node.areaId === village.areaId && !node.locked);
  if (!source) throw new Error('village source missing');
  const heroes = snap.heroes.slice(0, 2);
  await page.evaluate(({ heroes, sourceId }) => {
    const api = window.DRAGON_BOARD_DEV_API;
    for (let i = heroes.length - 1; i >= 0; i -= 1) api.teleportNode(heroes[i].id, sourceId);
    heroes.forEach(hero => api.setHp(hero.id, 1));
  }, { heroes, sourceId: source.id });
  await page.locator('#partyManageBtn').click();
  const checks = page.locator('[data-party-hero]:not(:disabled)');
  for (let i = 0; i < await checks.count(); i += 1) await checks.nth(i).check();
  await page.locator('#partySaveBtn').click();

  const move = await page.evaluate(heroId => window.DRAGON_BOARD_DEV_API.setMove(heroId, 2), heroes[0].id);
  expect(move.ok).toBe(true);
  await page.waitForTimeout(80);
  if (!(await page.locator('[data-village-rest]').isVisible().catch(() => false))) await page.locator(`[data-node-id="${village.id}"]`).click();
  await expect(page.locator('[data-village-rest]')).toBeVisible();
  await page.locator('[data-village-rest]').click();
  await expect.poll(() => page.evaluate(ids => {
    const s = window.DRAGON_BOARD_DEV_API.snapshot();
    return ids.every(id => {
      const hero = s.heroes.find(item => item.id === id);
      return hero && hero.hp === hero.maxHp;
    }) && s.moveRemaining === 0;
  }, heroes.map(hero => hero.id))).toBe(true);
  expect(errors).toEqual([]);
});

test('leader DOWN promotes a surviving member and 4-person party can enter combat together', async ({ page }) => {
  const errors = await startDevHeroes(page, 4);
  const setup = await formParty(page, 4);
  const before = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  expect(before.parties[0].memberIds).toHaveLength(4);
  const oldLeader = before.parties[0].leaderId;
  const ko = await page.evaluate(id => window.DRAGON_BOARD_DEV_API.knockOut(id), oldLeader);
  expect(ko.ok).toBe(true);
  const afterKo = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  expect(afterKo.heroes.find(hero => hero.id === oldLeader).partyId).toBeNull();
  expect(afterKo.parties[0].memberIds).toHaveLength(3);
  expect(afterKo.parties[0].leaderId).not.toBe(oldLeader);

  // Rebuild a fresh four-person party after healing the old leader.
  await page.evaluate(({ ids, sourceId }) => {
    const api = window.DRAGON_BOARD_DEV_API;
    ids.forEach(id => api.fullHeal(id));
    for (let i = ids.length - 1; i >= 0; i -= 1) api.teleportNode(ids[i], sourceId);
  }, { ids: setup.heroIds, sourceId: setup.sourceId });
  const current = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  if (current.parties.length) {
    // Keep the surviving party and add the revived hero through the actual manager.
    const leaderId = current.parties[0].leaderId;
    await page.evaluate(id => window.DRAGON_BOARD_DEV_API.teleportNode(id, window.DRAGON_BOARD_DEV_API.snapshot().heroes.find(h => h.id === id).position), leaderId);
  }
  await page.locator('#partyManageBtn').click();
  const choices = page.locator('[data-party-hero]:not(:disabled)');
  for (let i = 0; i < await choices.count(); i += 1) if (!(await choices.nth(i).isChecked())) await choices.nth(i).check();
  await page.locator('#partySaveBtn').click();
  const rebuilt = await page.evaluate(() => window.DRAGON_BOARD_DEV_API.snapshot());
  expect(rebuilt.parties[0].memberIds).toHaveLength(4);
  const leaderId = rebuilt.parties[0].leaderId;
  const leader = rebuilt.heroes.find(hero => hero.id === leaderId);
  const targetId = await safeAdjacentTarget(page, leader.position, '전투');
  await beginMoveTo(page, leaderId, targetId, 1);
  await expect(page.locator('#combatOverlay')).not.toHaveClass(/hidden/);
  await expect(page.locator('.stage-hero-actor')).toHaveCount(4);
  expect(errors).toEqual([]);
});
