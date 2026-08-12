from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}')
    p.write_text(text.replace(old, new, 1))

# ── game.js ─────────────────────────────────────────────────────
p = Path('js/game.js')
t = p.read_text()
t = t.replace('// DRAGON BOARD V0.5.9.2', '// DRAGON BOARD V0.6.2.0', 1)
t = t.replace('    gameOver: false,\n    defeatedBosses:', '    gameOver: false,\n    victory: false,\n    defeatedBosses:', 1)
t = t.replace('    state.gameOver = false;\n    state.defeatedBosses = new Set();', '    state.gameOver = false;\n    state.victory = false;\n    state.defeatedBosses = new Set();', 1)
t = t.replace('    state.gameOver = false;\n    modal.classList.add(\'hidden\');', '    state.gameOver = false;\n    state.victory = false;\n    modal.classList.add(\'hidden\');', 1)
p.write_text(t)

replace_once('js/game.js', '''  function renderCurrentObjective() {
    if (!currentObjective) return;
    const areaNodes = WORLD_NODES.filter(n => n.areaId === state.viewAreaId);''', '''  function renderCurrentObjective() {
    if (!currentObjective) return;
    if (state.victory) {
      currentObjective.innerHTML = `<strong>🏆 드래곤 토벌 완료</strong><span class="objective-explore">· 왕국을 구했다</span>`;
      return;
    }
    const areaNodes = WORLD_NODES.filter(n => n.areaId === state.viewAreaId);''')

replace_once('js/game.js', '''    const canAct = active && !active.acted && !active.down && !state.gameOver && !state.combat && unit.every(h => !h.acted && !h.down);''', '''    const canAct = active && !active.acted && !active.down && !state.gameOver && !state.victory && !state.combat && unit.every(h => !h.acted && !h.down);''')

replace_once('js/game.js', '''    const turnLabel = active ? `${active.icon} ${active.name} 턴` : '턴 없음';
    if (state.gameOver) {
      moveHint.textContent = '☠ GAME OVER';''', '''    const turnLabel = active ? `${active.icon} ${active.name} 턴` : '턴 없음';
    if (state.victory) {
      moveHint.textContent = '🏆 VICTORY';
    } else if (state.gameOver) {
      moveHint.textContent = '☠ GAME OVER';''')

# Final dragon should not be counted as a fifth regional seal boss.
p = Path('js/game.js')
t = p.read_text()
old = "      if (c.isBoss && !state.defeatedBosses.has(c.node.id)) {"
if old in t:
    t = t.replace(old, "      if (c.isBoss && c.node?.monsterId !== 'dragon' && !state.defeatedBosses.has(c.node.id)) {", 1)
else:
    # tolerate spacing variation but fail loudly if the semantic anchor is gone
    raise SystemExit('js/game.js: regional boss reward anchor not found')
p.write_text(t)

final_helpers = r'''
  // ── V0.6.2.0 FINAL DRAGON CASTLE ─────────────────────────────
  // 파티 시스템 완성 전에도 SOLO 한 판을 엔딩까지 완주할 수 있도록
  // 드래곤 성은 현재 영웅 기준 4단계 고정 최종 던전으로 진행한다.
  function ensureFinalDungeonState(node) {
    if (!node.finalDungeonState) node.finalDungeonState = { index:0, cleared:false };
    node.finalDungeonState.index = Math.max(0, Math.min(4, Number(node.finalDungeonState.index || 0)));
    return node.finalDungeonState;
  }

  function finalDungeonStageName(index) {
    return ['성문 수호자','봉인의 회랑','용의 제단','용의 왕좌'][index] || '정복 완료';
  }

  function finalDungeonProgressHTML(stateInfo) {
    return [0,1,2,3].map(index => {
      const cls = index < stateInfo.index ? 'done' : index === stateInfo.index ? 'current' : '';
      return `<span class="${cls}">${index < stateInfo.index ? '✓' : index + 1}</span>`;
    }).join('');
  }

  function askFinalDungeonEntry(hero,node,stateInfo) {
    return new Promise(resolve => {
      modalCloseAction = null;
      modal.classList.remove('hero-status-modal','party-manage-modal','item-transfer-modal','combat-item-modal','shop-modal');
      modalCloseBtn.hidden = true;
      const current = Math.min(4,stateInfo.index + 1);
      const resumed = stateInfo.index > 0;
      modalContent.innerHTML = `
        <div class="event-sheet dungeon-sheet final-dungeon-sheet">
          <div class="status-kicker">FINAL DUNGEON · ${current}/4</div>
          <div class="event-card-head"><span class="event-card-icon">🐉</span><div><h3>드래곤의 성</h3><p>${resumed ? `이전에 ${stateInfo.index}단계를 돌파했다. ${finalDungeonStageName(stateInfo.index)}부터 이어간다.` : '네 개의 봉인석이 성문을 열었다. 성의 최심부에는 고대 드래곤이 기다리고 있다.'}</p></div></div>
          <div class="dungeon-progress">${finalDungeonProgressHTML(stateInfo)}</div>
          <div class="event-choice-grid">
            <button type="button" class="event-choice-btn final-dungeon-enter"><strong>⚔️ 성으로 진입</strong><small>${finalDungeonStageName(stateInfo.index)}부터 진행</small></button>
            <button type="button" class="event-choice-btn final-dungeon-leave"><strong>↩️ 준비를 더 한다</strong><small>현재 칸에 머물고 이번 턴 종료</small></button>
          </div>
        </div>`;
      modal.classList.remove('hidden');
      modalContent.querySelector('.final-dungeon-enter')?.addEventListener('click',()=>{ closeModalPanel(); resolve(true); },{once:true});
      modalContent.querySelector('.final-dungeon-leave')?.addEventListener('click',()=>{ closeModalPanel(); resolve(false); },{once:true});
    });
  }

  function showFinalDungeonMessage(title,body) {
    return new Promise(resolve => {
      showModal(title,body);
      modalCloseAction = () => resolve();
    });
  }

  async function resolveDragonCastle(hero,node,originNodeId,unitMembers = getWorldUnitMembers(hero)) {
    if (node.dragonDefeated || state.victory) {
      showModal('🏆 정복한 드래곤의 성', '고대 드래곤은 이미 쓰러졌다. 왕국에 다시 평화가 찾아왔다.');
      return false;
    }

    const fd = ensureFinalDungeonState(node);
    const enter = await askFinalDungeonEntry(hero,node,fd);
    if (!enter) return false;

    log(`🐉 ${hero.icon} <strong>${hero.name}</strong> · 드래곤의 성 진입 (${fd.index}/4 단계 완료).`);

    // 1. 성문 수호자 — 전리품 없는 정예전
    if (fd.index === 0 && !hero.down) {
      const guardianId = node.region === 'volcano' ? 'wyvern' : 'darkKnight';
      const monster = MONSTERS[guardianId];
      const combatNode = {
        ...node,
        id:`${node.id}-final-gate`,
        type:'던전',
        icon:monster?.icon || '⚔️',
        name:'드래곤의 성 · 성문 수호자',
        monsterId:guardianId,
      };
      const result = await startCombat(hero,combatNode,node.id,{ dungeonMode:true, suppressLoot:true });
      if (result !== 'victory') {
        log('↩️ 드래곤의 성 성문에서 후퇴했다. 다음 진입은 성문 수호자부터 다시 도전한다.');
        return false;
      }
      fd.index = 1;
      await showFinalDungeonMessage('⚔️ 성문 돌파', `${hero.name}은(는) 성문 수호자를 쓰러뜨렸다. 안쪽에서 봉인석과 같은 문양이 희미하게 빛난다.`);
    }

    // 2. 봉인의 회랑 — D20 + 민첩/행운 중 높은 값, 실패해도 진행은 유지
    if (fd.index === 1 && !hero.down) {
      const die = rollDice(1,20).total;
      const bonus = Math.max(Number(hero.dex || 0), Number(hero.luck || 0));
      const total = die + bonus;
      if (total >= 13) {
        log(`🗿 봉인의 회랑 판정 성공 · D20 ${die} + ${bonus} = ${total}`);
        await showFinalDungeonMessage('🗿 봉인의 회랑', `D20 ${die} + 보정 ${bonus} = ${total}. 봉인석의 힘이 함정을 잠재웠다.`);
      } else {
        const damage = Math.min(5, Math.max(0, hero.currentHp - 1));
        hero.currentHp = Math.max(1, hero.currentHp - damage);
        log(`🔥 봉인의 회랑 판정 실패 · D20 ${die} + ${bonus} = ${total} · HP -${damage}`);
        await showFinalDungeonMessage('🔥 봉인의 회랑', `D20 ${die} + 보정 ${bonus} = ${total}. 용염 함정이 폭발해 HP ${damage} 피해를 입었다. 간신히 회랑은 돌파했다.`);
      }
      fd.index = 2;
      renderAll();
    }

    // 3. 용의 제단 — 최종전 직전 1회 회복
    if (fd.index === 2 && !hero.down) {
      const beforeHp = hero.currentHp;
      hero.currentHp = Math.min(hero.hp, hero.currentHp + 8);
      const healed = hero.currentHp - beforeHp;
      if (hero.currentMana !== null) hero.currentMana = maxMana(hero);
      fd.index = 3;
      log(`✨ 용의 제단 · ${hero.name} HP +${healed}${hero.currentMana !== null ? ' · MANA 전부 회복' : ''}`);
      renderAll();
      await showFinalDungeonMessage('✨ 용의 제단', `네 개의 봉인석이 마지막 힘을 내어 ${hero.name}을 회복시켰다. HP +${healed}${hero.currentMana !== null ? ' · MANA 전부 회복' : ''}. 이제 왕좌만 남았다.`);
    }

    // 4. 고대 드래곤 — 보스전. 보스전 규칙이므로 연막탄 도주 불가.
    if (fd.index === 3 && !hero.down) {
      const dragonNode = {
        ...node,
        id:`${node.id}-ancient-dragon`,
        type:'보스',
        region:'dragon',
        icon:'🐉',
        name:'고대 드래곤',
        monsterId:'dragon',
      };
      log('🐉 <strong>용의 왕좌</strong> · 고대 드래곤과의 최종전 시작!');
      const result = await startCombat(hero,dragonNode,node.id,{ dungeonMode:true, suppressLoot:true });
      if (result !== 'victory') {
        log('↩️ 고대 드래곤에게 패배했다. 성의 앞선 구간은 정복 상태로 유지된다.');
        return false;
      }

      fd.index = 4;
      fd.cleared = true;
      node.dragonDefeated = true;
      state.victory = true;
      state.moveRemaining = 0;
      state.rolled = null;
      clearDiceDisplay();
      log('🏆 <strong>고대 드래곤 토벌!</strong> 네 개의 봉인이 완성되고 왕국에 평화가 돌아왔다.');
      renderAll();
      await showFinalDungeonMessage('🏆 VICTORY', `${hero.icon} ${hero.name}이(가) 고대 드래곤을 쓰러뜨렸다! 네 지역의 봉인석이 완성되며 왕국을 뒤덮던 어둠이 사라진다.`);
      return true;
    }

    return false;
  }

'''

replace_once('js/game.js', '''  async function resolveNode(hero, node, originNodeId, unitMembers = getWorldUnitMembers(hero)) {''', final_helpers + '''  async function resolveNode(hero, node, originNodeId, unitMembers = getWorldUnitMembers(hero)) {''')

replace_once('js/game.js', '''      case '드래곤성':
      case '잠김':
        showModal('🐉 드래곤의 성', '드래곤의 성에 도착했다. 최종 던전/드래곤전은 다음 프로토 단계에서 연결한다.');
        return false;''', '''      case '드래곤성':
        return await resolveDragonCastle(hero,node,originNodeId,unitMembers);

      case '잠김':
        showModal('🔒 잠긴 지역', '아직 열리지 않은 지역이다.');
        return false;''')

# ── monsters.js ─────────────────────────────────────────────────
p = Path('js/monsters.js')
t = p.read_text()
anchor = "  demonKnight: { id:'demonKnight', name:'악마 기사', icon:'😈', tier:'boss', hp:46, ac:15, attack:5, damage:{count:1,sides:8,bonus:3}, ai:'lowHp', trait:'지옥의 갑주: 한 번의 공격으로 받는 피해는 최대 10. HP 15 이하 영웅 공격 시 명중 +2.' },\n"
if anchor not in t:
    raise SystemExit('monsters.js: boss anchor not found')
dragon = "  dragon: { id:'dragon', name:'고대 드래곤', icon:'🐉', tier:'boss', hp:90, ac:16, attack:6, damage:{count:2,sides:8,bonus:3}, damageType:'fire', ai:'highHp', trait:'고대의 용염: 강력한 화염 공격. 용비늘 갑옷의 화염 피해 감소가 적용된다.' },\n"
t = t.replace(anchor, anchor + dragon, 1)
p.write_text(t)

# ── index / README ──────────────────────────────────────────────
p = Path('index.html')
t = p.read_text()
t = t.replace('PROTOTYPE V0.6.1.7','PROTOTYPE V0.6.2.0')
t = t.replace('?v=0615','?v=0620')
t = t.replace('?v=0616','?v=0620')
t = t.replace('?v=0617','?v=0620')
p.write_text(t)

p = Path('README.md')
t = p.read_text()
lines = t.splitlines()
if lines and lines[0].startswith('# DRAGON BOARD'):
    lines[0] = '# DRAGON BOARD — Web Prototype V0.6.2.0'
    t = '\n'.join(lines) + '\n'
entry = '''\n## V0.6.2.0\n- 봉인석 4개 이후 출현한 드래곤의 성에 실제 최종 던전 진행 연결\n- 최종 던전 4단계: 성문 수호자 → 봉인의 회랑 → 용의 제단 → 고대 드래곤\n- 완료한 최종 던전 단계는 실패 후에도 유지해 재도전 피로 감소\n- 고대 드래곤 보스 추가: SOLO에서도 기존 인원수 보정으로 난이도 스케일링\n- 드래곤 보스전은 연막탄 도주 불가 규칙 적용\n- 드래곤 토벌 시 VICTORY 상태/목표 표시 및 추가 행동 차단\n'''
if '## V0.6.2.0' not in t:
    first_nl = t.find('\n')
    t = t[:first_nl+1] + entry + t[first_nl+1:]
p.write_text(t)
