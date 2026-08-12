from pathlib import Path

def replace_once(s, old, new, label):
    if old not in s:
        raise SystemExit(f'missing marker: {label}')
    return s.replace(old, new, 1)

# game.js
p = Path('js/game.js')
s = p.read_text()
s = replace_once(s, '// DRAGON BOARD V0.5.8.1', '// DRAGON BOARD V0.5.9.0', 'game version')
s = replace_once(s, '    threat: 0,\n', '', 'state threat')
s = replace_once(s, '    sealQuests: [],\n    questProgress: {},\n', '', 'quest state')
s = replace_once(s, "  const threatValue = $('#threatValue');\n  const threatFill = $('#threatFill');\n", "  const sealValue = $('#sealValue');\n  const sealFill = $('#sealFill');\n", 'hud refs')
start = s.index('  // V0.5.4.0 — 매 판 봉인석 획득 조건 3개를 무작위로 고른다.')
end = s.index('\n  function showScreen(screen)', start)
new_block = '''  // V0.5.9.0 — NORMAL 모드는 4개 지역 보스가 각각 봉인석 1개를 지닌다.\n  // 랜덤 봉인 목표와 시간 압박 게이지는 사용하지 않는다.\n  function getAreaBossNode(areaId) {\n    return WORLD_NODES.find(node => node.areaId === areaId && node.type === '보스') || null;\n  }\n\n  function showBossSealModal() {\n    const rows = ['A','B','C','D'].map(areaId => {\n      const meta = window.WORLD_AREAS?.[areaId];\n      const boss = getAreaBossNode(areaId);\n      const defeated = Boolean(boss && state.defeatedBosses.has(boss.id));\n      return `<div class="seal-quest-row ${defeated ? 'complete' : ''}"><span class="seal-quest-icon">${defeated ? '🗿' : '👑'}</span><div><strong>${meta?.themeLabel || '미지의 지역'}</strong><small>${boss?.name || '지역 보스'} 토벌</small></div><b>${defeated ? '봉인석 획득' : '미토벌'}</b></div>`;\n    }).join('');\n    modal.classList.remove('hero-status-modal','party-manage-modal','item-transfer-modal','combat-item-modal');\n    modalCloseBtn.hidden = false;\n    modalContent.innerHTML = `<div class="event-sheet"><div class="status-kicker">REGION BOSS SEALS</div><div class="event-card-head"><span class="event-card-icon">🗿</span><div><h3>드래곤의 봉인석 ${state.seals}/4</h3><p>각 지역 보스를 처음 토벌할 때 봉인석 1개를 얻는다. 네 지역의 봉인석을 모두 모으면 드래곤의 성이 출현한다.</p></div></div><div class="seal-quest-list">${rows}</div></div>`;\n    modal.classList.remove('hidden');\n  }\n'''
s = s[:start] + new_block + s[end:]
s = replace_once(s, '    state.threat = 0;\n', '', 'start threat')
s = replace_once(s, '    setupSealQuests();\n', '', 'setup quests')
s = replace_once(s, "    log(`🗿 이번 게임 봉인 목표 · ${state.sealQuests.map(q => q.icon + q.name).join(' · ')}`);\n", "    log('🗿 NORMAL 목표 · 4개 지역 보스를 각각 토벌해 봉인석 4개를 모으면 드래곤의 성이 출현한다.');\n", 'start objective log')
s = replace_once(s, "    threatValue.textContent = `${state.threat} / 12`;\n    threatFill.style.width = `${Math.min(100, state.threat / 12 * 100)}%`;\n", "    sealValue.textContent = `${state.seals} / 4`;\n    sealFill.style.width = `${Math.min(100, state.seals / 4 * 100)}%`;\n", 'render hud')
s = replace_once(s, "      resourceSummary.textContent = `🗿 ${state.seals}/3 · 💰 ${state.gold} · 🎒 ${totalBag}${dragonArea ? ` · 🐉 ${getAreaDisplayName(dragonArea)}` : ''}`;\n      resourceSummary.title = '눌러서 이번 게임의 봉인 목표 보기';\n", "      resourceSummary.textContent = `🗿 ${state.seals}/4 · 💰 ${state.gold} · 🎒 ${totalBag}${dragonArea ? ` · 🐉 ${getAreaDisplayName(dragonArea)}` : ''}`;\n      resourceSummary.title = '눌러서 지역 보스 토벌 현황 보기';\n", 'resource summary')
s = replace_once(s, '    if (state.seals < 3 && state.threat < 12) return false;\n', '    if (state.seals < 4) return false;\n', 'castle condition')
s = replace_once(s, "    const reason = state.seals >= 3 ? '봉인석 3개가 모였다.' : 'DRAGON THREAT가 12에 도달했다.';\n", "    const reason = '네 지역의 봉인석 4개가 모두 모였다.';\n", 'castle reason')
old = '''  function renderCurrentObjective() {\n    if (!currentObjective) return;\n    const active = getActiveHero();\n    const incomplete = (state.sealQuests || []).find(q => !q.complete);\n    const progress = incomplete ? Math.min(incomplete.target, Number(state.questProgress?.[incomplete.type] || 0)) : 0;\n    const areaNodes = WORLD_NODES.filter(n => n.areaId === state.viewAreaId);\n    const discovered = areaNodes.filter(n => state.discoveredNodeIds?.has(n.id)).length;\n    if (state.seals >= 3 || state.dragonCastleSpawned) {\n      currentObjective.innerHTML = `<strong>🐉 현재 목표</strong><span>출현한 용의 성을 찾아가자.</span>`;\n    } else if (incomplete) {\n      currentObjective.innerHTML = `<strong>🗿 현재 목표</strong><span>${incomplete.icon} ${incomplete.name} ${progress}/${incomplete.target} · ${getAreaDisplayName(state.viewAreaId)} 탐험 ${discovered}/${areaNodes.length}</span>`;\n    } else {\n      currentObjective.innerHTML = `<strong>🧭 현재 목표</strong><span>미탐험 지역을 조사하자 · ${getAreaDisplayName(state.viewAreaId)} ${discovered}/${areaNodes.length}</span>`;\n    }\n  }\n'''
new = '''  function renderCurrentObjective() {\n    if (!currentObjective) return;\n    const areaNodes = WORLD_NODES.filter(n => n.areaId === state.viewAreaId);\n    const discovered = areaNodes.filter(n => state.discoveredNodeIds?.has(n.id)).length;\n    const boss = getAreaBossNode(state.viewAreaId);\n    const bossDefeated = Boolean(boss && state.defeatedBosses.has(boss.id));\n    if (state.dragonCastleSpawned) {\n      currentObjective.innerHTML = `<strong>🐉 현재 목표</strong><span>봉인석 4개 완성 · 출현한 드래곤의 성을 찾아가자.</span>`;\n    } else {\n      const bossText = bossDefeated\n        ? `🗿 ${getAreaDisplayName(state.viewAreaId)} 봉인석 획득 완료`\n        : `👑 ${boss?.name || '지역 보스'} 토벌 → 봉인석 획득`;\n      currentObjective.innerHTML = `<strong>🗿 현재 목표 ${state.seals}/4</strong><span>${bossText} · 탐험 ${discovered}/${areaNodes.length}</span>`;\n    }\n  }\n'''
s = replace_once(s, old, new, 'current objective')
s = replace_once(s, '    return Boolean(node?.locked && state.seals < 3 && state.threat < 9);\n', '    return Boolean(node?.locked && state.seals < 4);\n', 'locked rule')
s = replace_once(s, "    state.threat = Math.min(12, state.threat + 1);\n    combatLogEntry(`💀 <strong>${hero.name}</strong> 쓰러짐 → ${getAreaDisplayName(deathAreaId)} 마을 귀환 / THREAT +1`);\n    log(`💀 ${hero.icon} <strong>${hero.name}</strong> 쓰러짐 (${sourceName}) → ${getAreaDisplayName(deathAreaId)} 마을 귀환 / 🔥 THREAT +1`);\n    checkDragonCastleSpawn('threat');\n", "    combatLogEntry(`💀 <strong>${hero.name}</strong> 쓰러짐 → ${getAreaDisplayName(deathAreaId)} 마을 귀환`);\n    log(`💀 ${hero.icon} <strong>${hero.name}</strong> 쓰러짐 (${sourceName}) → ${getAreaDisplayName(deathAreaId)} 마을 귀환`);\n", 'combat death')
s = replace_once(s, "      addQuestProgress('combatWin', 1);\n", '', 'combat quest')
s = replace_once(s, "      if (c.isBoss && !state.defeatedBosses.has(c.node.id)) {\n        state.defeatedBosses.add(c.node.id);\n        addQuestProgress('boss', 1);\n      }\n", "      if (c.isBoss && !state.defeatedBosses.has(c.node.id)) {\n        state.defeatedBosses.add(c.node.id);\n        state.seals = Math.min(4, state.defeatedBosses.size);\n        const areaName = getAreaDisplayName(c.node.areaId || getNodeAreaId(c.node.id));\n        combatLogEntry(`🗿 ${areaName}의 봉인석 획득 · ${state.seals}/4`);\n        log(`🗿 <strong>${areaName} 지역 보스 토벌!</strong> 봉인석 ${state.seals}/4 획득.`);\n        resourceSummary?.classList.add('seal-earned');\n        setTimeout(() => resourceSummary?.classList.remove('seal-earned'), 900);\n        checkDragonCastleSpawn('boss-seal');\n      }\n", 'boss seal reward')
for old_line, label in [
    ("    addQuestProgress('portal', 1);\n", 'portal quest'),
    ("        addQuestProgress('event', 1);\n", 'event quest'),
    ("      addQuestProgress('dungeon',1);\n", 'dungeon quest'),
    ("        addQuestProgress('treasure', 1);\n", 'treasure quest'),
]:
    s = replace_once(s, old_line, '', label)
s = replace_once(s, "          state.threat = Math.min(12, state.threat + 1);\n          checkDragonCastleSpawn('threat');\n          log(`💀 ${hero.name} 쓰러짐 → ${getAreaDisplayName(deathAreaId)} 마을 귀환 / THREAT +1`);\n", "          log(`💀 ${hero.name} 쓰러짐 → ${getAreaDisplayName(deathAreaId)} 마을 귀환`);\n", 'event death')
s = replace_once(s, """      } else if (effect.type === 'threat') {\n        const delta = Number(effect.value || 0);\n        state.threat = Math.max(0, Math.min(12, state.threat + delta));\n        log(`🔥 사건으로 THREAT ${delta >= 0 ? '+' : ''}${delta} → ${state.threat}/12`);\n        checkDragonCastleSpawn('threat');\n""", '', 'event threat effect')
s = replace_once(s, "          gold: state.gold,\n          threat: state.threat\n", "          gold: state.gold\n", 'event before threat')
s = replace_once(s, "        if (state.threat !== before.threat) {\n          const diff = state.threat - before.threat;\n          resultLines.push(`🔥 THREAT ${diff >= 0 ? '+' : ''}${diff}`);\n        }\n", '', 'event result threat')
s = replace_once(s, "    // 이렇게 해야 마지막 영웅이 상점에 도착한 순간 THREAT 12가 되어도\n    // 용의 성 알림이 상점 모달을 덮어쓰지 않는다.\n", "    // 상점 종료와 다른 전역 알림이 모달에서 충돌하지 않도록 턴 종료를 닫기 시점에 처리한다.\n", 'shop comment')
old = '''      case '봉인':\n        if (state.seals < 3) {\n          state.seals += 1;\n          showModal('🗿 용의 봉인석', `고대 신전의 봉인을 해제했다. 현재 봉인석 ${state.seals}/3.`);\n          log(`🗿 <strong>봉인석 ${state.seals}/3</strong> 획득.`);\n          checkDragonCastleSpawn('seal');\n        } else {\n          showModal('🗿 고대 신전', '이미 필요한 봉인석을 모두 확보했다.');\n        }\n        return false;\n\n      case '위험':\n        if (Math.random() < 0.5) {\n          state.threat = Math.min(12, state.threat + 1);\n          showModal('🔥 위험 지역', '불길한 징조가 번진다. DRAGON THREAT +1');\n          log('🔥 위험 사건으로 <strong>THREAT +1</strong>.');\n          checkDragonCastleSpawn('threat');\n        } else {\n          showModal('🔥 위험 지역', '아무 일도 일어나지 않았다.');\n        }\n        return false;\n'''
new = '''      case '봉인':\n        showModal('🗿 고대 신전', '봉인석의 힘은 네 지역 보스에게 흩어져 있다. 이곳에서는 더 이상 봉인석을 얻지 않는다.');\n        return false;\n\n      case '위험':\n        if (Math.random() < 0.5) {\n          await applyEventEffects(hero, [{ type:'damage', value:3 }], { node, originNodeId });\n          showModal('🔥 위험 지역', '거친 지형을 돌파하다 HP 3 피해를 입었다.');\n        } else {\n          showModal('🔥 위험 지역', '위험한 지형을 무사히 통과했다.');\n        }\n        return false;\n'''
s = replace_once(s, old, new, 'seal danger cases')
s = replace_once(s, "  function endRound() {\n    state.threat = Math.min(12, state.threat + 1);\n    log(`라운드 종료 → 🔥 <strong>DRAGON THREAT ${state.threat}/12</strong>`);\n    checkDragonCastleSpawn('threat');\n\n    state.round += 1;\n", "  function endRound() {\n    state.round += 1;\n    log(`라운드 종료 → <strong>ROUND ${state.round}</strong>`);\n", 'round threat')
s = replace_once(s, "  resourceSummary?.addEventListener('click', showSealQuestModal);\n  resourceSummary?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showSealQuestModal(); } });\n", "  resourceSummary?.addEventListener('click', showBossSealModal);\n  resourceSummary?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showBossSealModal(); } });\n", 'summary handlers')
p.write_text(s)

# events.js
p = Path('js/events.js')
s = p.read_text()
repls = [
("fail:{ text:'시간만 허비하고 빈손으로 돌아섰다.', effects:[{type:'threat',value:1}] }", "fail:{ text:'시간만 허비하고 빈손으로 돌아섰다.', effects:[] }", 'lost merchant'),
("{ weight:35, text:'저주가 몸을 파고든다.', effects:[{type:'damage',value:4},{type:'threat',value:1}] }", "{ weight:35, text:'저주가 몸을 파고든다.', effects:[{type:'damage',value:5}] }", 'well'),
("{ label:'지나친다', desc:'왕국의 불안이 커진다.', effects:[{type:'threat',value:1}] }", "{ label:'지나친다', desc:'전투를 피하고 길을 떠난다.', effects:[] }", 'hamlet'),
("fail:{ text:'불길한 미래를 보고 말았다.', effects:[{type:'threat',value:1}] }", "fail:{ text:'불길한 미래가 정신을 흔든다.', effects:[{type:'damage',value:2}] }", 'fortune'),
("{ id:'bloodMoon', icon:'🌕', name:'핏빛 달', kind:'simple', text:'붉은 달이 떠오르며 마물들이 날뛴다.', effects:[{type:'threat',value:1},{type:'damage',value:2}] }", "{ id:'bloodMoon', icon:'🌕', name:'핏빛 달', kind:'simple', text:'붉은 달이 떠오르며 마물들이 날뛴다.', effects:[{type:'damage',value:4}] }", 'blood moon'),
("{weight:30,text:'길을 헤매는 동안 시간이 흘렀다.',effects:[{type:'threat',value:1}]}", "{weight:30,text:'길을 헤매다 소지품 일부를 잃었다.',effects:[{type:'gold',value:-2}]}", 'cat'),
("fail:{ text:'공포가 왕국에 번진다.', effects:[{type:'threat',value:2}] }", "fail:{ text:'드래곤의 공포가 정신을 짓누른다.', effects:[{type:'damage',value:6}] }", 'whisper'),
]
for old, new, label in repls:
    s = replace_once(s, old, new, label)
p.write_text(s)

# index.html
p = Path('index.html')
s = p.read_text()
s = replace_once(s, 'css/style.css?v=0581', 'css/style.css?v=0590', 'css cache')
s = replace_once(s, 'PROTOTYPE V0.5.8.1', 'PROTOTYPE V0.5.9.0', 'index version')
s = replace_once(s, '''        <div class="threat-wrap">\n          <div class="hud-label">DRAGON THREAT</div>\n          <div class="threat-row"><span>🔥</span><strong id="threatValue">0 / 12</strong></div>\n          <div class="threat-bar"><div id="threatFill"></div></div>\n        </div>''', '''        <div class="seal-wrap">\n          <div class="hud-label">REGION BOSS SEALS</div>\n          <div class="seal-row"><span>🗿</span><strong id="sealValue">0 / 4</strong></div>\n          <div class="seal-bar"><div id="sealFill"></div></div>\n        </div>''', 'hud html')
s = replace_once(s, '🗿 0/3 · 💰 0 · 🎒 0', '🗿 0/4 · 💰 0 · 🎒 0', 'summary html')
s = s.replace('?v=0581', '?v=0590')
p.write_text(s)

# css/style.css
p = Path('css/style.css')
s = p.read_text()
s = replace_once(s, '.threat-row { display: flex; gap: 8px; align-items: center; }\n.threat-bar { height: 12px; background: #16110d; border: 2px solid #4e3624; margin-top: 4px; }\n#threatFill { height: 100%; width: 0%; background: linear-gradient(90deg, #7f4931, #bb3a2b); transition: width .2s; }', '.seal-row { display: flex; gap: 8px; align-items: center; }\n.seal-bar { height: 12px; background: #16110d; border: 2px solid #4e3624; margin-top: 4px; }\n#sealFill { height: 100%; width: 0%; background: linear-gradient(90deg, #8a6a32, var(--gold)); transition: width .2s; }', 'seal css')
p.write_text(s)

# README.md
p = Path('README.md')
s = p.read_text()
s = replace_once(s, '# DRAGON BOARD — Web Prototype V0.5.8.1', '# DRAGON BOARD — Web Prototype V0.5.9.0', 'readme version')
block = '''\n\n## V0.5.9.0\n- NORMAL 모드에서 DRAGON THREAT 시스템 제거: 라운드/사망/사건으로 시간 압박 게이지가 오르지 않음\n- 4개 지역 보스가 각각 봉인석 1개를 보유하고, 첫 토벌 시 해당 지역 봉인석 획득\n- 봉인석 4/4가 되는 즉시 드래곤의 성이 월드에 출현\n- 기존 랜덤 봉인 목표(전투/보물/이벤트/지역 이동/던전)는 제거하고 해당 콘텐츠는 성장·파밍 경로로 유지\n- HUD와 자원 요약을 `REGION BOSS SEALS 0/4` 기준으로 변경하고 지역별 보스 토벌 현황 모달 추가\n- THREAT 효과를 쓰던 사건/위험 타일은 HP 피해·골드 손실 또는 무효 결과로 NORMAL 규칙에 맞게 재구성\n'''
s = replace_once(s, '\n\n## V0.5.8.1', block + '\n\n## V0.5.8.1', 'readme changelog insert')
s = s.replace('- 봉인석 3개 또는 THREAT 12에서 용의 성 랜덤 출현', '- 4개 지역 보스를 각각 토벌해 봉인석 4개를 모으면 용의 성 랜덤 출현')
s = s.replace('- 사건 유형: D20 능력치 판정, 선택, 회복/피해, 골드, THREAT 변화, 전리품, 사건 전투.', '- 사건 유형: D20 능력치 판정, 선택, 회복/피해, 골드 변화, 전리품, 사건 전투.')
p.write_text(s)
