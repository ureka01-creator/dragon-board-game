const { test, expect } = require('@playwright/test');

const GAME_API_INJECTION = String.raw`
window.__DRAGON_TEST_API = {
  snapshot() {
    const hero = getActiveHero();
    return {
      round: state.round,
      activeHeroId: state.activeHeroId,
      moveRemaining: state.moveRemaining,
      moveStepsTaken: state.moveStepsTaken,
      rolled: state.rolled,
      combat: !!state.combat,
      victory: !!state.victory,
      gameOver: !!state.gameOver,
      hero: hero ? { id: hero.id, position: hero.position, hp: hero.currentHp, maxHp: hero.hp, acted: hero.acted, down: hero.down } : null,
      areaId: hero ? getNodeAreaId(hero.position) : null,
      gold: state.gold,
      bag: hero ? heroInventory(hero).length : 0,
      seals: state.seals,
      dragonCastleSpawned: state.dragonCastleSpawned,
      dragonCastleNodeId: state.dragonCastleNodeId
    };
  },
  nodes() {
    return WORLD_NODES.map(n => ({ id:n.id, type:n.type, areaId:n.areaId, links:[...(n.links||[])], portalEntryId:n.portalEntryId || null, name:n.name }));
  },
  prepareDeadEnd(type, remaining = 4) {
    const hero = getActiveHero();
    const target = WORLD_NODES.find(n => n.type === type && (n.links||[]).length > 0 && !nodeIsLocked(n));
    if (!hero || !target) throw new Error('No dead-end target for ' + type);
    const fromId = target.links.find(id => WORLD_NODES.some(n => n.id === id && !nodeIsLocked(n))) || target.links[0];
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
    state.moveVisitedNodeIds = new Set(target.links || []);
    state.moveVisitedNodeIds.add(fromId);
    state.discoveredNodeIds.add(fromId);
    state.discoveredNodeIds.delete(target.id);
    state.gold = Math.max(state.gold, 100);
    if (target.type === '전투') target.combatCleared = false;
    if (target.type === '사건') {
      const simple = (window.EVENT_CARDS || []).find(card =>
        card.kind === 'simple' && !(card.effects || []).some(effect => effect && (effect.type === 'combat' || effect.type === 'loot'))
      );
      if (simple) {
        state.eventDeck = [simple.id];
        state.eventDiscard = [];
      }
    }
    renderAll();
    return { targetId:target.id, fromId, type:target.type, remaining };
  },
  prepareVillageDeadEnd(remaining = 4) {
    const result = this.prepareDeadEnd('마을', remaining);
    const hero = getActiveHero();
    hero.currentHp = Math.max(1, hero.hp - 3);
    renderAll();
    return result;
  },
  preparePortalDeadEnd(remaining = 4) {
    const hero = getActiveHero();
    const target = WORLD_NODES.find(n => n.type === '입구' && n.portalEntryId && (n.links||[]).length > 0);
    if (!hero || !target) throw new Error('No portal entry target');
    const fromId = target.links[0];
    hero.position = fromId;
    hero.down = false;
    hero.acted = false;
    hero.currentHp = hero.hp;
    state.activeHeroId = hero.id;
    state.viewAreaId = target.areaId;
    state.rolled = remaining;
    state.moveRemaining = remaining;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = fromId;
    state.moveVisitedNodeIds = new Set(target.links || []);
    state.moveVisitedNodeIds.add(fromId);
    state.discoveredNodeIds.add(fromId);
    state.discoveredNodeIds.delete(target.id);
    renderAll();
    return { targetId:target.id, fromId, portalEntryId:target.portalEntryId, remaining };
  },
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
    const forwardNode = WORLD_NODES.find(x => x.id === forwardId);
    if (forwardNode) {
      forwardNode.type = '길';
      forwardNode.icon = '🛤';
      forwardNode.name = 'TEST 안전 경로';
      forwardNode.short = 'TEST';
      forwardNode.locked = false;
      forwardNode.portalEntryId = null;
    }
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
    const forwardNode = WORLD_NODES.find(x => x.id === forwardId);
    if (forwardNode) {
      forwardNode.type = '길';
      forwardNode.icon = '🛤';
      forwardNode.name = 'TEST 안전 경로';
      forwardNode.short = 'TEST';
      forwardNode.locked = false;
      forwardNode.portalEntryId = null;
    }
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
    const hero = getActiveHero();
    const node = WORLD_NODES.find(n => !nodeIsLocked(n) && (n.links||[]).filter(id => {
      const next = WORLD_NODES.find(x => x.id === id);
      return next && !nodeIsLocked(next);
    }).length >= 2);
    if (!hero || !node) throw new Error('No fork node');
    hero.position = node.id;
    hero.down = false;
    hero.acted = false;
    state.activeHeroId = hero.id;
    state.viewAreaId = node.areaId;
    state.rolled = 3;
    state.moveRemaining = 3;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = node.id;
    state.moveVisitedNodeIds = new Set([node.id]);
    renderAll();
    return { nodeId:node.id, reachable:[...getReachableNodeIds()] };
  },
  continueStraight() { return continueStraightMovementIfPossible(); },
  markFirstReachableVisited() {
    const before = [...getReachableNodeIds()];
    if (!before.length) throw new Error('No reachable node to mark visited');
    state.moveVisitedNodeIds.add(before[0]);
    renderAll();
    return { removed:before[0], after:[...getReachableNodeIds()] };
  },
  prepareForkForRoll() {
    const hero = getActiveHero();
    const node = WORLD_NODES.find(n => !nodeIsLocked(n) && (n.links||[]).filter(id => {
      const next = WORLD_NODES.find(x => x.id === id);
      return next && !nodeIsLocked(next);
    }).length >= 2);
    if (!hero || !node) throw new Error('No fork for dice test');
    hero.position = node.id;
    hero.down = false;
    hero.acted = false;
    state.activeHeroId = hero.id;
    state.viewAreaId = node.areaId;
    state.rolled = null;
    state.moveRemaining = 0;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = null;
    state.moveVisitedNodeIds = new Set();
    renderAll();
    return node.id;
  },
  async forceRoll(value) {
    const oldRandom = Math.random;
    const fixed = Math.max(1, Math.min(6, Number(value)||1));
    Math.random = () => (fixed - 0.5) / 6;
    try { await rollD6(); } finally { Math.random = oldRandom; }
    return this.snapshot();
  },
  prepareCombat() {
    const hero = getActiveHero();
    const node = WORLD_NODES.find(n => n.type === '전투' && !nodeIsLocked(n));
    if (!hero || !node) throw new Error('No combat node');
    hero.position = node.id;
    hero.down = false;
    hero.acted = false;
    hero.currentHp = hero.hp;
    state.activeHeroId = hero.id;
    state.viewAreaId = node.areaId;
    state.rolled = null;
    state.moveRemaining = 0;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = null;
    state.moveVisitedNodeIds = new Set();
    renderAll();
    return node.id;
  },
  beginCombat(nodeId) {
    const hero = getActiveHero();
    const node = WORLD_NODES.find(n => n.id === nodeId);
    return startCombat(hero, node, node.id);
  },
  healActive() {
    const hero = getActiveHero();
    if (!hero) return;
    hero.down = false;
    hero.currentHp = hero.hp;
    if (hero.currentMana !== null) hero.currentMana = maxMana(hero);
    if (state.combat) renderCombat();
  },
  enemyHpOne() {
    const enemy = selectedCombatEnemy();
    if (!enemy) return false;
    enemy.currentHp = 1;
    enemy.ac = -999;
    renderCombat();
    return true;
  },
  winCurrentCombat() {
    if (!state.combat) return false;
    state.combat.enemies.forEach(enemy => { enemy.currentHp = 0; });
    renderCombat();
    endCombat('victory');
    return true;
  },
  giveFirstConsumable() {
    const hero = getActiveHero();
    const item = (window.ITEM_CARDS || []).find(i => i.type === 'consumable' && i.effect !== 'autoRevive');
    if (!hero || !item) throw new Error('No consumable');
    heroInventory(hero).push(item.id);
    renderAll();
    return item.id;
  },
  forceDownAndReviveNextRound() {
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
    ['A','B','C','D'].forEach(areaId => {
      const boss = getAreaBossNode(areaId);
      if (boss) state.defeatedBosses.add(boss.id);
    });
    state.seals = 4;
    checkDragonCastleSpawn('regression-test');
    renderAll();
    return this.snapshot();
  },
  enterCastle() {
    const hero = getActiveHero();
    const node = WORLD_NODES.find(n => n.id === state.dragonCastleNodeId);
    if (!hero || !node) throw new Error('Dragon castle not available');
    hero.position = node.id;
    hero.down = false;
    hero.acted = false;
    hero.currentHp = hero.hp;
    if (hero.currentMana !== null) hero.currentMana = maxMana(hero);
    clearPlannedMoveState();
    state.activeHeroId = hero.id;
    state.viewAreaId = node.areaId;
    revealFromNode(node.id);
    renderAll();
    return resolveDragonCastle(hero, node, node.id, [hero]);
  }
};
`;

async function installTestApi(page) {
  await page.route('**/js/game.js*', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const marker = body.lastIndexOf('})();');
    if (marker < 0) throw new Error('Unable to inject game test API');
    body = body.slice(0, marker) + '\n' + GAME_API_INJECTION + '\n' + body.slice(marker);
    await route.fulfill({ response, body, contentType: 'application/javascript' });
  });
}

async function startSolo(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await installTestApi(page);
  await page.goto('/');
  await expect(page.locator('.version-label')).toHaveText('PROTOTYPE V0.6.4.2');
  await page.locator('#titleStartBtn').click();
  await page.locator('.hero-card').first().click();
  await page.locator('#startGameBtn').click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => !!window.__DRAGON_TEST_API)).toBe(true);
  return pageErrors;
}

async function resolveLoot(page) {
  const overlay = page.locator('#lootOverlay');
  if (!(await overlay.isVisible())) return;
  const card = page.locator('#lootCard');
  if (await card.isVisible()) {
    const cls = await card.getAttribute('class') || '';
    if (cls.includes('face-down')) {
      await card.evaluate(el => el.click());
      await page.waitForTimeout(120);
    }
  }
  for (let i = 0; i < 12 && await overlay.isVisible(); i++) {
    const choice = page.locator('#lootActions .loot-choice-card').first();
    if (await choice.isVisible()) {
      await choice.evaluate(el => el.click());
      await page.waitForTimeout(80);
      continue;
    }
    const action = page.locator('#lootActions button:not([disabled])').first();
    if (await action.isVisible()) {
      await action.evaluate(el => el.click());
      await page.waitForTimeout(100);
      continue;
    }
    break;
  }
  await expect(overlay).toBeHidden();
}

async function fightCurrentCombat(page) {
  const overlay = page.locator('#combatOverlay');
  for (let i = 0; i < 30; i++) {
    if (!(await overlay.isVisible())) break;
    if (await page.locator('#lootOverlay').isVisible()) {
      await resolveLoot(page);
      continue;
    }
    await page.evaluate(() => { window.__DRAGON_TEST_API.healActive(); window.__DRAGON_TEST_API.enemyHpOne(); });
    const enemy = page.locator('#combatEnemies button').first();
    if (await enemy.isVisible()) await enemy.evaluate(el => el.click());
    const attack = page.locator('#combatAttackBtn');
    if (await attack.isEnabled()) {
      await attack.evaluate(el => el.click());
      await page.waitForTimeout(950);
    } else {
      await page.waitForTimeout(250);
    }
    if (await page.locator('#lootOverlay').isVisible()) await resolveLoot(page);
  }
  await expect(overlay).toBeHidden();
}

async function resolveEventOrGenericFlow(page) {
  for (let i = 0; i < 30; i++) {
    if (await page.locator('#combatOverlay').isVisible()) {
      await fightCurrentCombat(page);
      continue;
    }
    if (await page.locator('#lootOverlay').isVisible()) {
      await resolveLoot(page);
      continue;
    }
    const modal = page.locator('#modal');
    if (!(await modal.isVisible())) break;
    const resultClose = page.locator('[data-event-result-close]').first();
    if (await resultClose.isVisible()) {
      await resultClose.evaluate(el => el.click());
      await page.waitForTimeout(80);
      continue;
    }
    const choice = page.locator('[data-event-choice]').first();
    if (await choice.isVisible()) {
      await choice.evaluate(el => el.click());
      await page.waitForTimeout(120);
      continue;
    }
    const main = page.locator('.event-main-btn').first();
    if (await main.isVisible() && await main.isEnabled()) {
      await main.evaluate(el => el.click());
      await page.waitForTimeout(850);
      continue;
    }
    const close = page.locator('#modalCloseBtn');
    if (await close.isVisible()) {
      await close.evaluate(el => el.click());
      await page.waitForTimeout(80);
      continue;
    }
    break;
  }
}

async function beginPreparedMove(page, targetId) {
  await page.evaluate(id => {
    window.__pendingMove = window.__DRAGON_TEST_API.beginMove(id);
  }, targetId);
}

async function awaitPreparedMove(page) {
  await page.evaluate(() => window.__pendingMove);
}

test('boot/version and movement dice animation sequence', async ({ page }) => {
  const errors = await startSolo(page);
  await page.evaluate(() => window.__DRAGON_TEST_API.prepareForkForRoll());
  await page.evaluate(() => {
    window.__diceClasses = [];
    const die = document.querySelector('#diceRoller');
    new MutationObserver(() => window.__diceClasses.push(die.className)).observe(die, { attributes:true, attributeFilter:['class'] });
  });
  await page.evaluate(() => window.__DRAGON_TEST_API.forceRoll(3));
  const classes = await page.evaluate(() => window.__diceClasses);
  expect(classes.some(v => v.includes('rolling'))).toBeTruthy();
  expect(classes.some(v => v.includes('landed'))).toBeTruthy();
  expect(classes.some(v => v.includes('dice-to-center'))).toBeTruthy();
  expect(classes.some(v => v.includes('dice-result-show'))).toBeTruthy();
  await expect(page.locator('#diceRoller')).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('#diceRoller').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
  expect(errors).toEqual([]);
});

test('fork stops auto movement and visited nodes cannot be revisited', async ({ page }) => {
  const errors = await startSolo(page);
  const fork = await page.evaluate(() => window.__DRAGON_TEST_API.prepareFork());
  expect(fork.reachable.length).toBeGreaterThanOrEqual(2);
  const before = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot().hero.position);
  const continued = await page.evaluate(() => window.__DRAGON_TEST_API.continueStraight());
  const after = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot().hero.position);
  expect(continued).toBe(false);
  expect(after).toBe(before);
  const revisit = await page.evaluate(() => window.__DRAGON_TEST_API.markFirstReachableVisited());
  expect(revisit.after).not.toContain(revisit.removed);
  expect(errors).toEqual([]);
});

for (const type of ['사건','전투','보물','상점']) {
  test(`dead-end ${type} tile resolves instead of freezing`, async ({ page }) => {
    const errors = await startSolo(page);
    const prep = await page.evaluate(t => window.__DRAGON_TEST_API.prepareDeadEnd(t, 4), type);
    await beginPreparedMove(page, prep.targetId);
    if (type === '전투') {
      await expect(page.locator('#combatOverlay')).toBeVisible();
      await fightCurrentCombat(page);
    } else if (type === '보물') {
      await expect(page.locator('#lootOverlay')).toBeVisible();
      await resolveLoot(page);
    } else if (type === '상점') {
      await expect(page.locator('#modal')).toBeVisible();
      await expect(page.locator('#modal')).toHaveClass(/shop-modal/);
      await page.locator('#modalCloseBtn').click();
    } else {
      await expect(page.locator('#modal')).toBeVisible();
      await resolveEventOrGenericFlow(page);
    }
    await awaitPreparedMove(page);
    const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
    expect(snap.moveRemaining).toBe(0);
    expect(snap.rolled).toBe(null);
    expect(errors).toEqual([]);
  });
}

test('village pass at a movement dead-end still finalizes the turn', async ({ page }) => {
  const errors = await startSolo(page);
  const prep = await page.evaluate(() => window.__DRAGON_TEST_API.prepareVillageDeadEnd(4));
  await beginPreparedMove(page, prep.targetId);
  await expect(page.locator('[data-village-pass]')).toBeVisible();
  await page.locator('[data-village-pass]').click();
  await awaitPreparedMove(page);
  const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(snap.moveRemaining).toBe(0);
  expect(snap.rolled).toBe(null);
  expect(errors).toEqual([]);
});

test('portal pass at a movement dead-end still finalizes the turn', async ({ page }) => {
  const errors = await startSolo(page);
  const prep = await page.evaluate(() => window.__DRAGON_TEST_API.preparePortalDeadEnd(4));
  await beginPreparedMove(page, prep.targetId);
  await expect(page.locator('[data-portal-no]')).toBeVisible();
  await page.locator('[data-portal-no]').click();
  await awaitPreparedMove(page);
  const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(snap.moveRemaining).toBe(0);
  expect(snap.rolled).toBe(null);
  expect(errors).toEqual([]);
});

test('combat item modal is above combat and normal combat returns to world', async ({ page }) => {
  const errors = await startSolo(page);
  await page.evaluate(() => window.__DRAGON_TEST_API.giveFirstConsumable());
  const nodeId = await page.evaluate(() => window.__DRAGON_TEST_API.prepareCombat());
  await page.evaluate(id => { window.__pendingCombat = window.__DRAGON_TEST_API.beginCombat(id); }, nodeId);
  await expect(page.locator('#combatOverlay')).toBeVisible();
  await page.locator('#combatItemBtn').click();
  await expect(page.locator('#modal')).toBeVisible();
  const layers = await page.evaluate(() => ({
    modal: Number(getComputedStyle(document.querySelector('#modal')).zIndex || 0),
    combat: Number(getComputedStyle(document.querySelector('#combatOverlay')).zIndex || 0)
  }));
  expect(layers.modal).toBeGreaterThan(layers.combat);
  await page.locator('#modalCloseBtn').click();
  await fightCurrentCombat(page);
  await page.evaluate(() => window.__pendingCombat);
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  expect((await page.evaluate(() => window.__DRAGON_TEST_API.snapshot())).combat).toBe(false);
  expect(errors).toEqual([]);
});

test('dragon castle full flow reaches victory and blocks further movement', async ({ page }) => {
  const errors = await startSolo(page);
  const unlocked = await page.evaluate(() => window.__DRAGON_TEST_API.unlockCastle());
  expect(unlocked.seals).toBe(4);
  expect(unlocked.dragonCastleSpawned).toBe(true);
  await page.evaluate(() => { window.__pendingCastle = window.__DRAGON_TEST_API.enterCastle(); });
  await expect(page.locator('.final-dungeon-enter')).toBeVisible();
  await page.locator('.final-dungeon-enter').click();

  for (let i = 0; i < 80; i++) {
    if (await page.locator('#combatOverlay').isVisible()) {
      await page.evaluate(() => window.__DRAGON_TEST_API.winCurrentCombat());
      await page.waitForTimeout(750);
      continue;
    }
    const modal = page.locator('#modal');
    if (await modal.isVisible()) {
      const enter = page.locator('.final-dungeon-enter');
      if (await enter.isVisible()) await enter.evaluate(el => el.click());
      else {
        const close = page.locator('#modalCloseBtn');
        if (await close.isVisible()) await close.evaluate(el => el.click());
      }
      await page.waitForTimeout(180);
      continue;
    }
    const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
    if (snap.victory && !snap.combat) break;
    await page.waitForTimeout(100);
  }
  await expect.poll(() => page.evaluate(() => window.__DRAGON_TEST_API.snapshot().victory)).toBe(true);
  await page.evaluate(async () => { await window.__pendingCastle; });
  const finalSnap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
  expect(finalSnap.victory).toBe(true);
  await expect(page.locator('#moveHint')).toContainText('VICTORY');
  await expect(page.locator('#rollBtn')).toBeDisabled();
  expect(errors).toEqual([]);
});

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
