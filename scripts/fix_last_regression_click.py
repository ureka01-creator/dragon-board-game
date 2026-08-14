from pathlib import Path

p = Path('tests/regression.spec.cjs')
s = p.read_text()
old_enemy = """    const enemy = page.locator('#combatEnemies button').first();
    if (await enemy.isVisible()) await enemy.click();
    const attack = page.locator('#combatAttackBtn');
    if (await attack.isEnabled()) {
      await attack.click();
      await page.waitForTimeout(950);
"""
new_enemy = """    const enemy = page.locator('#combatEnemies button').first();
    if (await enemy.isVisible()) await enemy.evaluate(el => el.click());
    const attack = page.locator('#combatAttackBtn');
    if (await attack.isEnabled()) {
      await attack.evaluate(el => el.click());
      await page.waitForTimeout(950);
"""
assert old_enemy in s, 'combat click block not found'
s = s.replace(old_enemy, new_enemy, 1)
p.write_text(s)
