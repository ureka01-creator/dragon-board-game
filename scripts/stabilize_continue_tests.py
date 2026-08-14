from pathlib import Path

p = Path('tests/regression.spec.cjs')
s = p.read_text()

needle = """    const fromId = links[0];
    const forwardId = links.find(id => id !== fromId && WORLD_NODES.find(x => x.id === id)?.type !== '입구') || links[1];
    hero.position = fromId;
"""
replacement = """    const fromId = links[0];
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
"""
count = s.count(needle)
assert count == 2, f'expected two continuation fixtures, got {count}'
s = s.replace(needle, replacement)
p.write_text(s.rstrip() + '\n')
