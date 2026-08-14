from pathlib import Path

p = Path('tests/regression.spec.cjs')
s = p.read_text()

old = """      hero: hero ? { id: hero.id, position: hero.position, hp: hero.currentHp, maxHp: hero.hp, acted: hero.acted, down: hero.down } : null,
      seals: state.seals,
"""
new = """      hero: hero ? { id: hero.id, position: hero.position, hp: hero.currentHp, maxHp: hero.hp, acted: hero.acted, down: hero.down } : null,
      areaId: hero ? getNodeAreaId(hero.position) : null,
      gold: state.gold,
      bag: hero ? heroInventory(hero).length : 0,
      seals: state.seals,
"""
assert old in s, 'snapshot marker missing'
s = s.replace(old, new, 1)

old = """  },
  beginMove(nodeId) { return moveActiveHero(nodeId); },
  prepareFork() {
"""
new = """  },
  preparePortalContinue(remaining = 2) {
    const hero = getActiveHero();
    const target = WORLD_NODES.find(n => {
      if (n.type !== '입구' || !n.portalEntryId) return false;
      const sourceLinks = (n.links || []).filter(id => {
        const next = WORLD_NODES.find(x => x.id === id);
        return next && !nodeIsLocked(next);
      });
      const destination = WORLD_NODES.find(x => x.id === n.portalEntryId);
      const destinationForward = (destination?.links || []).filter(id => {
        const next = WORLD_NODES.find(x => x.id === id);
        return next && !nodeIsLocked(next);
      });
      return sourceLinks.length >= 2 && destinationForward.length >= 2;
    });
    if (!hero || !target) throw new Error('No portal continuation target');
    const links = (target.links || []).filter(id => {
      const next = WORLD_NODES.find(x => x.id === id);
      return next && !nodeIsLocked(next);
    });
    const fromId = links[0];
    const forwardId = links.find(id => id !== fromId && WORLD_NODES.find(x => x.id === id)?.type !== '입구') || links[1];
    hero.position = fromId;
    hero.down = false;
    hero.acted = false;
    hero.currentHp = hero.hp;
    if (hero.currentMana !== null) hero.currentMana = maxMana(hero);
    state.activeHeroId = hero.id;
    state.viewAreaId = target.areaId;
    state.rolled = remaining;
    state.moveRemaining = remaining;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = fromId;
    state.moveVisitedNodeIds = new Set([fromId, ...links.filter(id => id !== fromId && id !== forwardId)]);
    state.discoveredNodeIds.add(fromId);
    state.discoveredNodeIds.add(target.id);
    renderAll();
    return {
      targetId:target.id,
      fromId,
      forwardId,
      portalEntryId:target.portalEntryId,
      sourceAreaId:target.areaId,
      destinationAreaId:getNodeAreaId(target.portalEntryId),
      remaining
    };
  },
  prepareVillageContinue(remaining = 2) {
    const hero = getActiveHero();
    const target = WORLD_NODES.find(n => {
      if (n.type !== '마을') return false;
      return (n.links || []).filter(id => {
        const next = WORLD_NODES.find(x => x.id === id);
        return next && !nodeIsLocked(next);
      }).length >= 2;
    });
    if (!hero || !target) throw new Error('No village continuation target');
    const links = (target.links || []).filter(id => {
      const next = WORLD_NODES.find(x => x.id === id);
      return next && !nodeIsLocked(next);
    });
    const fromId = links[0];
    const forwardId = links.find(id => id !== fromId && WORLD_NODES.find(x => x.id === id)?.type !== '입구') || links[1];
    hero.position = fromId;
    hero.down = false;
    hero.acted = false;
    hero.currentHp = Math.max(1, hero.hp - 3);
    if (hero.currentMana !== null) hero.currentMana = Math.max(0, maxMana(hero) - 1);
    state.activeHeroId = hero.id;
    state.viewAreaId = target.areaId;
    state.rolled = remaining;
    state.moveRemaining = remaining;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = fromId;
    state.moveVisitedNodeIds = new Set([fromId, ...links.filter(id => id !== fromId && id !== forwardId)]);
    state.discoveredNodeIds.add(fromId);
    state.discoveredNodeIds.add(target.id);
    renderAll();
    return { targetId:target.id, fromId, forwardId, remaining, round:state.round };
  },
  beginMove(nodeId) { return moveActiveHero(nodeId); },
  prepareFork() {
"""
assert old in s, 'movement API insertion marker missing'
s = s.replace(old, new, 1)

old = """  unlockCastle() {
"""
new = """  forceDownAndReviveNextRound() {
    const hero = getActiveHero();
    if (!hero) throw new Error('No active hero');
    const areaId = getNodeAreaId(hero.position);
    const villageId = getAreaVillageNodeId(areaId);
    hero.currentHp = 0;
    hero.down = true;
    hero.reviveRound = state.round + 1;
    hero.reviveAreaId = areaId;
    const beforeRound = state.round;
    endRound();
    renderAll();
    return { beforeRound, villageId, after:this.snapshot() };
  },
  currentCombatMonsterId() {
    return state.combat?.enemies?.[0]?.id || null;
  },
  loseCurrentCombat() {
    if (!state.combat) return false;
    state.combat.participantIds.forEach(id => {
      const hero = state.heroes.find(h => h.id === id);
      if (!hero) return;
      hero.currentHp = 0;
      hero.down = true;
      hero.reviveRound = state.round + 1;
      hero.reviveAreaId = getNodeAreaId(hero.position);
    });
    endCombat('defeat');
    return true;
  },
  castleProgress() {
    const node = WORLD_NODES.find(n => n.id === state.dragonCastleNodeId);
    if (!node) return null;
    const fd = ensureFinalDungeonState(node);
    return { index:fd.index, cleared:!!fd.cleared };
  },
  unlockCastle() {
"""
assert old in s, 'castle API insertion marker missing'
s = s.replace(old, new, 1)

append = r'''

test('portal enter keeps remaining MOVE active in the destination region', async ({ page }) => {
  const errors = await startSolo(page);
  const prep = await page.evaluate(() => window.__DRAGON_TEST_API.preparePortalContinue(2));
  await beginPreparedMove(page, prep.targetId);
  await expect(page.locator('[data-portal-yes]')).toBeVisible();
  await page.locator('[data-portal-yes]').evaluate(el => el.click());
  await awaitPreparedMove(page);
  const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(snap.areaId).toBe(prep.destinationAreaId);
  expect(snap.hero.position).toBe(prep.portalEntryId);
  expect(snap.moveRemaining).toBe(1);
  expect(snap.rolled).toBe(2);
  expect(errors).toEqual([]);
});

test('portal pass continues along the current region with remaining MOVE', async ({ page }) => {
  const errors = await startSolo(page);
  const prep = await page.evaluate(() => window.__DRAGON_TEST_API.preparePortalContinue(2));
  await beginPreparedMove(page, prep.targetId);
  await expect(page.locator('[data-portal-no]')).toBeVisible();
  await page.locator('[data-portal-no]').evaluate(el => el.click());
  await page.waitForTimeout(450);
  await resolveEventOrGenericFlow(page);
  await awaitPreparedMove(page);
  const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(snap.hero.position).not.toBe(prep.targetId);
  expect(snap.areaId).toBe(prep.sourceAreaId);
  expect(snap.moveRemaining).toBe(0);
  expect(snap.rolled).toBe(null);
  expect(errors).toEqual([]);
});

test('village rest consumes remaining MOVE and fully recovers the hero', async ({ page }) => {
  const errors = await startSolo(page);
  const prep = await page.evaluate(() => window.__DRAGON_TEST_API.prepareVillageContinue(4));
  await beginPreparedMove(page, prep.targetId);
  await expect(page.locator('[data-village-rest]')).toBeVisible();
  await page.locator('[data-village-rest]').evaluate(el => el.click());
  await awaitPreparedMove(page);
  const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(snap.hero.hp).toBe(snap.hero.maxHp);
  expect(snap.moveRemaining).toBe(0);
  expect(snap.rolled).toBe(null);
  expect(snap.round).toBeGreaterThan(prep.round);
  expect(errors).toEqual([]);
});

test('village pass keeps moving instead of consuming the turn', async ({ page }) => {
  const errors = await startSolo(page);
  const prep = await page.evaluate(() => window.__DRAGON_TEST_API.prepareVillageContinue(2));
  await beginPreparedMove(page, prep.targetId);
  await expect(page.locator('[data-village-pass]')).toBeVisible();
  await page.locator('[data-village-pass]').evaluate(el => el.click());
  await page.waitForTimeout(450);
  await resolveEventOrGenericFlow(page);
  await awaitPreparedMove(page);
  const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(snap.hero.position).not.toBe(prep.targetId);
  expect(snap.moveRemaining).toBe(0);
  expect(snap.rolled).toBe(null);
  expect(errors).toEqual([]);
});

test('shop supports an actual buy and sell before exiting the turn', async ({ page }) => {
  const errors = await startSolo(page);
  const prep = await page.evaluate(() => window.__DRAGON_TEST_API.prepareDeadEnd('상점', 4));
  const before = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  await beginPreparedMove(page, prep.targetId);
  await expect(page.locator('#modal')).toHaveClass(/shop-modal/);
  const buy = page.locator('[data-shop-buy]:not([disabled])').first();
  await expect(buy).toBeVisible();
  await buy.evaluate(el => el.click());
  const bought = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(bought.bag).toBe(before.bag + 1);
  expect(bought.gold).toBeLessThan(before.gold);
  const sell = page.locator('[data-shop-sell]').first();
  await expect(sell).toBeVisible();
  await sell.evaluate(el => el.click());
  const sold = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(sold.bag).toBe(before.bag);
  expect(sold.gold).toBeGreaterThan(bought.gold);
  await page.locator('#modalCloseBtn').evaluate(el => el.click());
  await awaitPreparedMove(page);
  const finalSnap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(finalSnap.rolled).toBe(null);
  expect(errors).toEqual([]);
});

test('downed hero revives at the regional village on the next round', async ({ page }) => {
  const errors = await startSolo(page);
  const result = await page.evaluate(() => window.__DRAGON_TEST_API.forceDownAndReviveNextRound());
  expect(result.after.round).toBe(result.beforeRound + 1);
  expect(result.after.hero.down).toBe(false);
  expect(result.after.hero.hp).toBe(result.after.hero.maxHp);
  expect(result.after.hero.position).toBe(result.villageId);
  expect(errors).toEqual([]);
});

test('dragon castle can be declined and re-entered repeatedly without freezing', async ({ page }) => {
  const errors = await startSolo(page);
  await page.evaluate(() => window.__DRAGON_TEST_API.unlockCastle());
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => { window.__pendingCastleLeave = window.__DRAGON_TEST_API.enterCastle(); });
    await expect(page.locator('.final-dungeon-leave')).toBeVisible();
    await page.locator('.final-dungeon-leave').evaluate(el => el.click());
    await page.evaluate(async () => { await window.__pendingCastleLeave; });
    await expect(page.locator('#modal')).toBeHidden();
    const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
    expect(snap.victory).toBe(false);
    expect(snap.combat).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('dragon castle keeps cleared stages after a final-boss defeat', async ({ page }) => {
  const errors = await startSolo(page);
  await page.evaluate(() => window.__DRAGON_TEST_API.unlockCastle());
  await page.evaluate(() => { window.__pendingCastleDefeat = window.__DRAGON_TEST_API.enterCastle(); });
  await expect(page.locator('.final-dungeon-enter')).toBeVisible();
  await page.locator('.final-dungeon-enter').evaluate(el => el.click());

  for (let i = 0; i < 60; i++) {
    if (await page.locator('#combatOverlay').isVisible()) {
      const monster = await page.evaluate(() => window.__DRAGON_TEST_API.currentCombatMonsterId());
      if (monster === 'dragon') break;
      await page.evaluate(() => window.__DRAGON_TEST_API.winCurrentCombat());
      await page.waitForTimeout(750);
      continue;
    }
    if (await page.locator('#modal').isVisible()) {
      const close = page.locator('#modalCloseBtn');
      if (await close.isVisible()) await close.evaluate(el => el.click());
      await page.waitForTimeout(180);
      continue;
    }
    await page.waitForTimeout(100);
  }

  await expect(page.locator('#combatOverlay')).toBeVisible();
  expect(await page.evaluate(() => window.__DRAGON_TEST_API.currentCombatMonsterId())).toBe('dragon');
  expect((await page.evaluate(() => window.__DRAGON_TEST_API.castleProgress())).index).toBe(3);
  await page.evaluate(() => window.__DRAGON_TEST_API.loseCurrentCombat());
  await expect(page.locator('#combatOverlay')).toBeHidden();
  await page.evaluate(async () => { await window.__pendingCastleDefeat; });
  expect((await page.evaluate(() => window.__DRAGON_TEST_API.castleProgress())).index).toBe(3);

  await page.evaluate(() => { window.__pendingCastleRetry = window.__DRAGON_TEST_API.enterCastle(); });
  await expect(page.locator('.final-dungeon-enter')).toBeVisible();
  await expect(page.locator('.final-dungeon-sheet')).toContainText('이전에 3단계를 돌파했다');
  await page.locator('.final-dungeon-leave').evaluate(el => el.click());
  await page.evaluate(async () => { await window.__pendingCastleRetry; });
  expect(errors).toEqual([]);
});
'''

# Append once, after the existing suite.
assert "portal enter keeps remaining MOVE active in the destination region" not in s
s = s.rstrip() + append + "\n"
p.write_text(s)
