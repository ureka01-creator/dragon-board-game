from pathlib import Path


game = Path('js/game.js')
s = game.read_text()
assert s.startswith('// DRAGON BOARD V0.6.3.7'), 'unexpected game version'
s = s.replace('// DRAGON BOARD V0.6.3.7', '// DRAGON BOARD V0.6.3.8', 1)

marker = "function isMovementDeadEnd(node) {\nreturn Boolean(node) && getMovementForwardNodeIds(node).length === 0;\n}\nasync function continueStraightMovementIfPossible()"
helper = """function isMovementDeadEnd(node) {
return Boolean(node) && getMovementForwardNodeIds(node).length === 0;
}
async function continueOrFinalizeStoppedMovement(hero) {
if (!hero || state.moveRemaining <= 0) return false;
const node = WORLD_NODES.find(n => n.id === hero.position);
if (!node) return false;
const forward = getMovementForwardNodeIds(node);
if (forward.length === 0) {
const lostSteps = state.moveRemaining;
state.moveRemaining = 0;
log(`🧱 <strong>${node.name || '막다른 길'}</strong>에 도착 · 남은 이동 ${lostSteps}칸 소멸.`);
await revealLandedNode(node.id);
await finalizePlannedMove(hero);
return true;
}
if (forward.length === 1) {
await moveActiveHero(forward[0]);
return true;
}
renderAll();
return false;
}
async function continueStraightMovementIfPossible()"""
assert marker in s, 'movement helper marker missing'
s = s.replace(marker, helper, 1)

move_at = s.index('async function moveActiveHero(nodeId)')
prefix, move = s[:move_at], s[move_at:]

portal_old = """if (state.moveRemaining > 0) {
renderAll();
await continueStraightMovementIfPossible();
return;
}
clearPlannedMoveState();"""
portal_new = """if (state.moveRemaining > 0) {
await continueOrFinalizeStoppedMovement(hero);
return;
}
clearPlannedMoveState();"""
assert portal_old in move, 'portal continuation block missing'
move = move.replace(portal_old, portal_new, 1)

village_old = """renderAll();
await continueStraightMovementIfPossible();
return;
}
const hitDeadEnd"""
village_new = """await continueOrFinalizeStoppedMovement(hero);
return;
}
const hitDeadEnd"""
assert village_old in move, 'village continuation block missing'
move = move.replace(village_old, village_new, 1)
game.write_text(prefix + move)

index = Path('index.html')
h = index.read_text()
assert 'PROTOTYPE V0.6.3.7' in h, 'unexpected index version'
h = h.replace('PROTOTYPE V0.6.3.7', 'PROTOTYPE V0.6.3.8')
h = h.replace('js/dev-bootstrap.js?v=0637', 'js/dev-bootstrap.js?v=0638')
h = h.replace('js/game.js?v=0637', 'js/game.js?v=0638')
index.write_text(h)

test = Path('tests/regression.spec.cjs')
t = test.read_text()
assert 'PROTOTYPE V0.6.3.7' in t, 'unexpected regression version'
t = t.replace('PROTOTYPE V0.6.3.7', 'PROTOTYPE V0.6.3.8')
test.write_text(t)

readme = Path('README.md')
r = readme.read_text()
r = r.replace('# DRAGON BOARD — Web Prototype V0.6.3.7', '# DRAGON BOARD — Web Prototype V0.6.3.8', 1)
r = r.replace('현재 배포 버전: **V0.6.3.7**', '현재 배포 버전: **V0.6.3.8**', 1)
section = """## V0.6.3.8

- 회복이 필요한 상태로 마을을 `지나간다` 선택한 뒤 전진 경로가 0개면 막다른 길로 정상 확정
- 지역 입구에서 `지나간다` 또는 지역 이동 후 전진 경로가 0개면 남은 MOVE 소멸 후 정상 턴 종료
- 특별 타일 분기 뒤에도 공통 `continueOrFinalizeStoppedMovement()`를 거쳐 외길 자동 진행 / 갈림길 대기 / 막다른 길 확정을 일관되게 처리
- Chromium 모바일 + WebKit iPhone 회귀 테스트를 GitHub Actions에 추가

"""
assert '## V0.6.3.7' in r, 'README V0.6.3.7 section missing'
r = r.replace('## V0.6.3.7', section + '## V0.6.3.7', 1)
r = r.replace('### V0.6.3.7 이동', '### V0.6.3.8 이동', 1)
readme.write_text(r)
