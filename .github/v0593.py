from pathlib import Path
import re

# js/game.js
game_path = Path('js/game.js')
game = game_path.read_text()
game = game.replace('// DRAGON BOARD V0.5.9.2', '// DRAGON BOARD V0.5.9.3', 1)

# Long-press helper is no longer needed: item rows now open details on a normal tap.
game, removed = re.subn(
    r"\n  function bindStatusItemLongPress\(element, callback\) \{.*?\n  \}\n\n  function openStatusItemDetail",
    "\n  function openStatusItemDetail",
    game,
    count=1,
    flags=re.S,
)
assert removed == 1, f'long-press helper removal count={removed}'

game = game.replace(' · 길게 눌러 상세 정보', ' · 눌러 상세 정보')
game = game.replace('장착 아이템을 길게 누르면 정보와 교체 가능한 장비를 볼 수 있어.', '장착 아이템을 누르면 정보와 교체 가능한 장비를 볼 수 있어.')
game = game.replace('아이템을 <strong>길게 누르면 상세 정보</strong>를 볼 수 있어.', '아이템을 <strong>누르면 상세 정보</strong>를 볼 수 있어.')

old_equipped = """    modalContent.querySelectorAll('[data-status-equipped-slot]').forEach(row => {\n      const slot = row.dataset.statusEquippedSlot;\n      const itemId = hero.equipment?.[slot];\n      if (itemId) bindStatusItemLongPress(row, () => openStatusItemDetail(hero, itemId, { source:'equipment', slot }));\n    });"""
new_equipped = """    modalContent.querySelectorAll('[data-status-equipped-slot]').forEach(row => {\n      const slot = row.dataset.statusEquippedSlot;\n      const itemId = hero.equipment?.[slot];\n      if (!itemId) return;\n      row.addEventListener('click', (event) => {\n        if (event.target.closest('button')) return;\n        openStatusItemDetail(hero, itemId, { source:'equipment', slot });\n      });\n    });"""
assert old_equipped in game, 'equipped binding block not found'
game = game.replace(old_equipped, new_equipped, 1)

old_bag = """    modalContent.querySelectorAll('[data-status-bag-index]').forEach(row => {\n      const index = Number(row.dataset.statusBagIndex);\n      const itemId = heroInventory(hero)[index];\n      if (itemId) bindStatusItemLongPress(row, () => openStatusItemDetail(hero, itemId, { source:'inventory', index }));\n    });"""
new_bag = """    modalContent.querySelectorAll('[data-status-bag-index]').forEach(row => {\n      const index = Number(row.dataset.statusBagIndex);\n      const itemId = heroInventory(hero)[index];\n      if (!itemId) return;\n      row.addEventListener('click', (event) => {\n        if (event.target.closest('button')) return;\n        openStatusItemDetail(hero, itemId, { source:'inventory', index });\n      });\n    });"""
assert old_bag in game, 'bag binding block not found'
game = game.replace(old_bag, new_bag, 1)

game_path.write_text(game)

# index.html cache/version
index_path = Path('index.html')
index = index_path.read_text()
index = index.replace('PROTOTYPE V0.5.9.2', 'PROTOTYPE V0.5.9.3', 1)
index = index.replace('?v=0592', '?v=0593')
index_path.write_text(index)

# README
readme_path = Path('README.md')
readme = readme_path.read_text()
readme = readme.replace('# DRAGON BOARD — Web Prototype V0.5.9.2', '# DRAGON BOARD — Web Prototype V0.5.9.3', 1)
marker = '\n\n## V0.5.9.2\n'
entry = '''\n\n## V0.5.9.3\n- 상태창의 장착 장비와 가방 아이템 상세 확인을 길게 누르기에서 일반 탭으로 변경\n- 가방 행의 `장착/교체/사용` 버튼은 기존 동작을 유지하고, 행의 나머지 영역을 탭할 때만 상세창 표시\n- 아이템 상세창의 장비 비교·교체 장착·필드 소비 아이템 사용 기능은 그대로 유지\n'''
assert marker in readme, 'README insertion marker not found'
readme = readme.replace(marker, entry + marker, 1)
readme_path.write_text(readme)
