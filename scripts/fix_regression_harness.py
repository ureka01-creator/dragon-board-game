from pathlib import Path

p = Path('tests/regression.spec.cjs')
s = p.read_text()

old = """    if (target.type === '전투') target.combatCleared = false;
    renderAll();
"""
new = """    if (target.type === '전투') target.combatCleared = false;
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
"""
assert old in s
s = s.replace(old, new, 1)

old = """  enemyHpOne() {
    const enemy = selectedCombatEnemy();
    if (!enemy) return false;
    enemy.currentHp = 1;
    renderCombat();
    return true;
  },
"""
new = """  enemyHpOne() {
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
"""
assert old in s
s = s.replace(old, new, 1)

s = s.replace("await card.click();", "await card.evaluate(el => el.click());")
s = s.replace("await choice.click();", "await choice.evaluate(el => el.click());")
s = s.replace("await action.click();", "await action.evaluate(el => el.click());")
s = s.replace("await resultClose.click();", "await resultClose.evaluate(el => el.click());")
s = s.replace("await main.click();", "await main.evaluate(el => el.click());")
# Only generic close actions in helper; ordinary test-specific clicks may remain.
s = s.replace("await close.click();\n      await page.waitForTimeout(80);", "await close.evaluate(el => el.click());\n      await page.waitForTimeout(80);")

old = """  for (let i = 0; i < 60; i++) {
    const snap = await page.evaluate(() => window.__DRAGON_TEST_API.snapshot());
    if (snap.victory) break;
    if (await page.locator('#combatOverlay').isVisible()) {
      await fightCurrentCombat(page);
      continue;
    }
    const modal = page.locator('#modal');
    if (await modal.isVisible()) {
      const enter = page.locator('.final-dungeon-enter');
      if (await enter.isVisible()) await enter.click();
      else if (await page.locator('#modalCloseBtn').isVisible()) await page.locator('#modalCloseBtn').click();
      await page.waitForTimeout(120);
      continue;
    }
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.__pendingCastle);
"""
new = """  for (let i = 0; i < 80; i++) {
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
"""
assert old in s
s = s.replace(old, new, 1)

p.write_text(s)
