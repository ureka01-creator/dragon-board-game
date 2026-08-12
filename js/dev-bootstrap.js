// DRAGON BOARD V0.6.3.0 — developer runtime bootstrap
// Loaded only with ?dev=1. Normal players still execute js/game.js directly.
(() => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'js/game.js?v=0620-dev', false);
  xhr.send(null);
  if (xhr.status < 200 || xhr.status >= 300) throw new Error(`DEV bootstrap: game.js load failed (${xhr.status})`);

  let source = xhr.responseText;
  const diceMarker = "  let diceAnimationFrame = null;";
  const rollMarker = "    const rawResult = Math.floor(Math.random() * 6) + 1;";
  const installMarker = "  // iPhone/Safari에서도 확실히 시작되도록 실제 button + 전체 타이틀 영역을 둘 다 연결한다.";

  if (!source.includes(diceMarker) || !source.includes(rollMarker) || !source.includes(installMarker)) {
    throw new Error('DEV bootstrap: game.js markers changed. Update dev-bootstrap.js.');
  }

  source = source.replace(diceMarker, `${diceMarker}\n  let devForcedD6 = null;`);
  source = source.replace(
    rollMarker,
    "    const rawResult = Number.isInteger(devForcedD6) ? devForcedD6 : (Math.floor(Math.random() * 6) + 1);\n" +
    "    if (Number.isInteger(devForcedD6)) log('🛠️ DEV · 이동 D6 강제 결과 <strong>' + rawResult + '</strong>');\n" +
    "    devForcedD6 = null;"
  );

  const apiInstall = String.raw`
  function devHero(heroId) {
    return state.heroes.find(h => h.id === heroId) || getActiveHero() || state.heroes[0] || null;
  }
  function devResult(ok, message) { return { ok: !!ok, message: message || '' }; }
  window.DRAGON_BOARD_DEV_API = {
    snapshot() {
      return {
        round: state.round,
        seals: state.seals,
        gold: state.gold,
        dragonCastleSpawned: state.dragonCastleSpawned,
        heroes: state.heroes.map(h => ({
          id:h.id, name:h.name, icon:h.icon, hp:h.currentHp, maxHp:h.hp,
          mana:h.currentMana, maxMana:h.currentMana === null ? null : maxMana(h),
          down:h.down, acted:h.acted, areaId:getNodeAreaId(h.position), bag:heroInventory(h).length
        })),
        areas: ['A','B','C','D'].map(id => {
          const boss = getAreaBossNode(id);
          return { id, name:getAreaDisplayName(id), bossDefeated:!!(boss && state.defeatedBosses.has(boss.id)) };
        }),
        items: (window.ITEM_CARDS || []).map(item => ({ id:item.id, name:item.name, icon:item.icon, type:item.type, rarity:item.rarity })),
        combat: state.combat ? { active:true, enemy:selectedCombatEnemy()?.name || '', enemyHp:selectedCombatEnemy()?.currentHp ?? null } : { active:false },
        forcedD6: devForcedD6,
      };
    },
    setHp(heroId, value) {
      const hero = devHero(heroId);
      if (!hero) return devResult(false, '영웅이 없어.');
      if (hero.down) return devResult(false, 'DOWN 상태야. 완전 회복을 먼저 눌러.');
      hero.currentHp = Math.max(1, Math.min(hero.hp, Number(value) || 1));
      renderAll(); if (state.combat) renderCombat();
      return devResult(true, hero.name + ' HP ' + hero.currentHp + '/' + hero.hp);
    },
    fullHeal(heroId) {
      const hero = devHero(heroId);
      if (!hero) return devResult(false, '영웅이 없어.');
      hero.down = false; hero.currentHp = hero.hp; hero.reviveRound = null; hero.reviveAreaId = null; hero.acted = false;
      if (hero.currentMana !== null) hero.currentMana = maxMana(hero);
      renderAll(); if (state.combat) renderCombat();
      return devResult(true, hero.name + ' 완전 회복');
    },
    knockOut(heroId) {
      const hero = devHero(heroId);
      if (!hero) return devResult(false, '영웅이 없어.');
      if (!hero.down) knockOutHero(hero, 'DEV TEST');
      renderAll(); if (state.combat) renderCombat();
      if (state.combat && !aliveCombatHeroes().length) setTimeout(() => endCombat('defeat'), 60);
      return devResult(true, hero.name + ' 즉사 처리');
    },
    giveItem(heroId, itemId) {
      const hero = devHero(heroId);
      const item = window.getItemCard?.(itemId);
      if (!hero || !item) return devResult(false, '영웅 또는 아이템을 못 찾았어.');
      if (!bagHasSpace(hero)) return devResult(false, hero.name + ' 가방이 가득 찼어. 가방 비우기를 먼저 사용해.');
      heroInventory(hero).push(item.id);
      if (item.type === 'equipment') state.acquiredEquipmentIds.add(item.id);
      log('🛠️ DEV · ' + hero.icon + ' <strong>' + hero.name + '</strong>에게 ' + (item.icon || '🎁') + ' <strong>' + item.name + '</strong> 지급');
      renderAll();
      return devResult(true, hero.name + ' ← ' + item.name);
    },
    clearBag(heroId) {
      const hero = devHero(heroId);
      if (!hero) return devResult(false, '영웅이 없어.');
      hero.inventory = []; renderAll();
      return devResult(true, hero.name + ' 가방 비움');
    },
    addGold(value) {
      state.gold = Math.max(0, state.gold + (Number(value) || 0)); renderAll();
      return devResult(true, '골드 ' + state.gold);
    },
    defeatBoss(areaId) {
      const boss = getAreaBossNode(String(areaId || 'A'));
      if (!boss) return devResult(false, '지역 보스를 못 찾았어.');
      state.defeatedBosses.add(boss.id);
      state.seals = Math.min(4, state.defeatedBosses.size);
      checkDragonCastleSpawn('dev-boss'); renderAll();
      return devResult(true, getAreaDisplayName(boss.areaId) + ' 보스 처치 처리 · 봉인석 ' + state.seals + '/4');
    },
    unlockDragonCastle() {
      ['A','B','C','D'].forEach(areaId => { const boss = getAreaBossNode(areaId); if (boss) state.defeatedBosses.add(boss.id); });
      state.seals = 4;
      checkDragonCastleSpawn('dev-unlock'); renderAll();
      return devResult(true, state.dragonCastleSpawned ? '드래곤 성 즉시 개방 완료' : '드래곤 성 개방 실패');
    },
    teleportVillage(heroId, areaId) {
      const hero = devHero(heroId);
      if (!hero) return devResult(false, '영웅이 없어.');
      const target = getAreaVillageNodeId(String(areaId || 'A'));
      hero.position = target; hero.down = false; hero.reviveRound = null; hero.reviveAreaId = null; hero.currentHp = Math.max(1, hero.currentHp);
      revealFromNode(target);
      if (hero.id === state.activeHeroId) { clearPlannedMoveState(); state.viewAreaId = getNodeAreaId(target); }
      renderAll();
      return devResult(true, hero.name + ' → ' + getAreaDisplayName(areaId) + ' 마을');
    },
    async enterDragonCastle(heroId) {
      const hero = devHero(heroId);
      if (!hero) return devResult(false, '영웅이 없어.');
      if (!state.dragonCastleSpawned || !state.dragonCastleNodeId) return devResult(false, '드래곤 성을 먼저 개방해.');
      const node = WORLD_NODES.find(n => n.id === state.dragonCastleNodeId);
      if (!node) return devResult(false, '드래곤 성 타일을 못 찾았어.');
      hero.position = node.id; hero.down = false; hero.reviveRound = null; hero.reviveAreaId = null; hero.currentHp = Math.max(1, hero.currentHp);
      clearPlannedMoveState(); state.activeHeroId = hero.id; state.viewAreaId = node.areaId; revealFromNode(node.id); renderAll();
      await resolveDragonCastle(hero, node, node.id, [hero]);
      return devResult(true, '드래곤 성 테스트 종료/진행');
    },
    forceD6(value) {
      devForcedD6 = Math.max(1, Math.min(6, Number(value) || 1));
      return devResult(true, '다음 이동 D6 = ' + devForcedD6);
    },
    enemyHpOne() {
      if (!state.combat) return devResult(false, '현재 전투 중이 아니야.');
      const enemy = selectedCombatEnemy();
      if (!enemy) return devResult(false, '적이 없어.');
      enemy.currentHp = 1; renderCombat();
      return devResult(true, enemy.name + ' HP 1');
    }
  };
`;

  source = source.replace(installMarker, apiInstall + '\n' + installMarker);
  (0, eval)(source + '\n//# sourceURL=dragon-board-game-dev-runtime.js');
})();