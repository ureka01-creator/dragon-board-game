(() => {
  const $ = (sel) => document.querySelector(sel);
  const state = {
    selectedHeroIds: [],
    heroes: [],
    round: 1,
    threat: 0,
    seals: 0,
    activeHeroId: null,
    focusHeroId: null,
    rolled: null,
    isRolling: false,
    isMoving: false,
    gameOver: false,
    defeatedBosses: new Set(),
    gold: 0,
    parties: {},
    nextPartySerial: 1,
    combat: null,
    viewAreaId: 'A',
    dragonCastleNodeId: null,
    dragonCastleSpawned: false,
    dragonSpawnNoticePending: null,
    eventDeck: [],
    eventDiscard: [],
  };

  const titleScreen = $('#titleScreen');
  const setupScreen = $('#setupScreen');
  const gameScreen = $('#gameScreen');
  const titleStartArea = $('#titleStartArea');
  const titleStartBtn = $('#titleStartBtn');
  const backToTitleBtn = $('#backToTitleBtn');
  const heroGrid = $('#heroGrid');
  const heroCount = $('#heroCount');
  const startGameBtn = $('#startGameBtn');
  const partyList = $('#partyList');
  const turnOrderHint = $('#turnOrderHint');
  const activeHeroLabel = $('#activeHeroLabel');
  const resourceSummary = $('#resourceSummary');
  const worldMap = $('#worldMap');
  const regionNavigator = $('#regionNavigator');
  const regionTitle = $('#regionTitle');
  const currentTurnBanner = $('#currentTurnBanner');
  const currentTurnName = $('#currentTurnName');
  const worldActionBar = $('#worldActionBar');
  const partyManageBtn = $('#partyManageBtn');
  const itemTransferBtn = $('#itemTransferBtn');
  const partyStatusText = $('#partyStatusText');
  const rollBtn = $('#rollBtn');
  const diceValue = $('#diceValue');
  const diceBox = $('#diceBox');
  const diceRoller = $('#diceRoller');
  const moveHint = $('#moveHint');
  const threatValue = $('#threatValue');
  const threatFill = $('#threatFill');
  const roundValue = $('#roundValue');
  const gameLog = $('#gameLog');
  const combatOverlay = $('#combatOverlay');
  const combatStage = $('#combatStage');
  const combatFxLayer = $('#combatFxLayer');
  const combatTitle = $('#combatTitle');
  const combatRoundLabel = $('#combatRoundLabel');
  const combatHeroTurn = $('#combatHeroTurn');
  const combatHeroes = $('#combatHeroes');
  const combatEnemies = $('#combatEnemies');
  const combatMessage = $('#combatMessage');
  const combatLog = $('#combatLog');
  const combatLogToggle = $('#combatLogToggle');
  const combatLogSummary = $('#combatLogSummary');
  const combatAttackBtn = $('#combatAttackBtn');
  const combatSkillBtn = $('#combatSkillBtn');
  const combatDefendBtn = $('#combatDefendBtn');
  const combatItemBtn = $('#combatItemBtn');
  const combatD20 = $('#combatD20');
  const combatD20Value = $('#combatD20Value');
  const combatDiceLabel = $('#combatDiceLabel');

  const lootOverlay = $('#lootOverlay');
  const lootGuide = $('#lootGuide');
  const lootCard = $('#lootCard');
  const lootCardIcon = $('#lootCardIcon');
  const lootCardName = $('#lootCardName');
  const lootCardDesc = $('#lootCardDesc');
  const lootActions = $('#lootActions');

  const modal = $('#modal');
  const modalContent = $('#modalContent');
  const modalCloseBtn = $('#modalCloseBtn');

  const BAG_LIMIT = 3;

  function showScreen(screen) {
    [titleScreen, setupScreen, gameScreen].forEach(el => el.classList.remove('active'));
    screen.classList.add('active');
    window.scrollTo(0, 0);
  }

  function goToHeroSelect() {
    showScreen(setupScreen);
    renderSetup();
  }

  function log(message) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = message;
    gameLog.prepend(entry);
  }

  function renderSetup() {
    heroGrid.innerHTML = '';
    HEROES.forEach(hero => {
      const selected = state.selectedHeroIds.includes(hero.id);
      const previewHero = { ...hero, equipment: { armor: null, weapon: null, accessory: null } };
      const el = document.createElement('article');
      el.className = `hero-card ${selected ? 'selected' : ''}`;
      el.innerHTML = `
        <div class="hero-portrait-wrap">${heroSpriteHTML(previewHero, 'large')}</div>
        <div class="hero-name">${hero.icon} ${hero.name}</div>
        <div class="hero-role">${hero.role}</div>
        <div class="equip-status">👕 기본 상태 · 장비 없음</div>
        <div class="stat-line"><span>❤️ HP</span><strong>${hero.hp}</strong></div>
        <div class="stat-line"><span>⚔ 힘</span><strong>${signed(hero.str)}</strong></div>
        <div class="stat-line"><span>🏹 민첩</span><strong>${signed(hero.dex)}</strong></div>
        <div class="stat-line"><span>✨ 마력</span><strong>${signed(hero.magic)}</strong></div>
        <div class="stat-line"><span>🍀 행운</span><strong>${signed(hero.luck)}</strong></div>
        <div class="stat-line"><span>🛡 AC</span><strong>${hero.ac}</strong></div>
        <div class="skill-line">${hero.passive}</div>
      `;
      el.addEventListener('click', () => toggleHero(hero.id));
      heroGrid.appendChild(el);
    });
    heroCount.textContent = `${state.selectedHeroIds.length} / 4`;
    startGameBtn.disabled = state.selectedHeroIds.length === 0;
  }

  function toggleHero(id) {
    if (state.selectedHeroIds.includes(id)) {
      state.selectedHeroIds = state.selectedHeroIds.filter(v => v !== id);
    } else if (state.selectedHeroIds.length < 4) {
      state.selectedHeroIds.push(id);
    }
    renderSetup();
  }

  function getAreaCenterNodeId(areaId) {
    const id = `${String(areaId || 'A').toLowerCase()}-center`;
    return WORLD_NODES.some(n => n.id === id) ? id : (window.WORLD_START_NODE_ID || 'a-center');
  }

  function getRandomStartNodeId() {
    const areaIds = Object.keys(window.WORLD_AREAS || {});
    const pool = areaIds.length ? areaIds : ['A','B','C','D'];
    const areaId = pool[Math.floor(Math.random() * pool.length)];
    return getAreaCenterNodeId(areaId);
  }

  function startGame() {
    window.resetWorldMap?.();
    state.viewAreaId = 'A';
    state.dragonCastleNodeId = null;
    state.dragonCastleSpawned = false;
    state.dragonSpawnNoticePending = null;
    // V0.4.9: 월드 턴 순서는 직업 고정 순서(기사→궁수→마법사→도적)를 따른다.
    // 각 영웅의 시작 위치는 새 게임마다 A~D 지역의 중앙 마을 중 하나로 독립 랜덤 배정한다.
    // 따라서 같은 마을에서 시작할 수도, 서로 다른 지역에서 시작할 수도 있다.
    const selectedSet = new Set(state.selectedHeroIds);
    state.heroes = HEROES.filter(src => selectedSet.has(src.id)).map(src => {
      const randomStartNodeId = getRandomStartNodeId();
      return {
        ...src,
        currentHp: src.hp,
        currentMana: src.mana ?? null,
        position: randomStartNodeId,
        acted: false,
        down: false,
        reviveRound: null,
        reviveAreaId: null,
        attackPenalty: 0,
        acPenalty: 0,
        equipment: { armor: null, weapon: null, accessory: null },
        inventory: [],
        partyId: null,
      };
    });
    state.round = 1;
    state.threat = 0;
    state.seals = 0;
    state.activeHeroId = state.heroes[0].id;
    state.viewAreaId = getNodeAreaId(state.heroes[0].position);
    state.focusHeroId = null;
    state.rolled = null;
    state.isRolling = false;
    state.isMoving = false;
    state.gameOver = false;
    state.defeatedBosses = new Set();
    state.gold = 0;
    state.parties = {};
    state.nextPartySerial = 1;
    state.combat = null;
    state.eventDeck = [];
    state.eventDiscard = [];
    gameLog.innerHTML = '';

    showScreen(gameScreen);
    log(`<strong>모험 시작!</strong> ${state.heroes.map(h => h.icon + h.name).join(', ')} 출발.`);
    log('👕 모든 영웅은 기본 장비가 없는 상태다. 이후 얻은 장비가 캐릭터 외형에 표시된다.');
    log('🗺️ 4개 지역의 타일 내용과 테마가 이번 게임용으로 새롭게 생성되었다.');
    log(`🎲 시작 위치 랜덤 · ${state.heroes.map(h => `${h.icon}${h.name}:${getNodeAreaId(h.position)}지역 마을`).join(' · ')}`);
    log('🔒 파티 편성 기능은 현재 잠김 · 모든 영웅은 SOLO로 행동한다.');
    log(`🔁 월드 턴은 <strong>${state.heroes.map(h => h.name).join(' → ')}</strong> 고정 순서로 진행된다.`);
    renderAll();
  }

  function renderAll() {
    renderHUD();
    renderParty();
    renderMap();
    renderControls();
  }

  function heroInventory(hero) {
    if (!hero) return [];
    if (!Array.isArray(hero.inventory)) hero.inventory = [];
    return hero.inventory;
  }


  function equippedItem(hero, slot) {
    return window.getItemCard?.(hero?.equipment?.[slot]) || null;
  }

  function hasEquipped(hero, itemId) {
    return Boolean(hero && Object.values(hero.equipment || {}).includes(itemId));
  }

  function equipmentEffect(hero, key) {
    if (!hero?.equipment) return 0;
    return ['weapon','armor','accessory'].reduce((sum, slot) => {
      const item = equippedItem(hero, slot);
      return sum + Number(item?.effects?.[key] || 0);
    }, 0);
  }

  function maxMana(hero) {
    if (!hero || hero.currentMana === null || hero.currentMana === undefined) return 0;
    return 3 + equipmentEffect(hero, 'maxMana');
  }

  function canHeroEquip(hero, item) {
    if (!hero || !item || item.type !== 'equipment') return false;
    return !Array.isArray(item.equip) || item.equip.includes(hero.id);
  }

  function bagHasSpace(hero) {
    return heroInventory(hero).length < BAG_LIMIT;
  }

  function enemyHasTag(enemy, tag) {
    const id = enemy?.id;
    if (tag === 'undead') return ['skeleton','ghost','necromancer'].includes(id);
    if (tag === 'demon') return ['demonKnight','fireImp'].includes(id);
    if (tag === 'dragon') return ['wyvern','dragon'].includes(id);
    return false;
  }

  function getPartyById(partyId) {
    if (!window.PARTY_SYSTEM_ENABLED) return null;
    return partyId ? state.parties?.[partyId] || null : null;
  }

  function getHeroParty(hero) {
    if (!window.PARTY_SYSTEM_ENABLED) return null;
    return hero ? getPartyById(hero.partyId) : null;
  }

  function getPartyMembers(party, { aliveOnly = false } = {}) {
    if (!party) return [];
    return party.memberIds
      .map(id => state.heroes.find(h => h.id === id))
      .filter(Boolean)
      .filter(h => !aliveOnly || (!h.down && h.currentHp > 0));
  }

  function partyDisplayName(party) {
    if (!party) return 'SOLO';
    return `PARTY ${party.label || party.id.replace('party-', '')}`;
  }

  function getWorldUnitMembers(hero = getActiveHero()) {
    if (!hero) return [];
    if (!window.PARTY_SYSTEM_ENABLED) return [hero];
    const party = getHeroParty(hero);
    if (!party) return [hero];
    return getPartyMembers(party).filter(h => !h.down);
  }

  function getWorldUnitLeader(hero = getActiveHero()) {
    if (!hero) return null;
    if (!window.PARTY_SYSTEM_ENABLED) return hero;
    const party = getHeroParty(hero);
    if (!party) return hero;
    const leader = state.heroes.find(h => h.id === party.leaderId && !h.down);
    if (leader) return leader;
    const fallback = getPartyMembers(party, { aliveOnly:true })[0] || null;
    if (fallback) party.leaderId = fallback.id;
    return fallback;
  }

  function sameWorldUnit(a, b) {
    if (!a || !b) return false;
    if (a.id === b.id) return true;
    if (!window.PARTY_SYSTEM_ENABLED) return false;
    return Boolean(a.partyId && a.partyId === b.partyId);
  }

  function canUseWorldPrepActions() {
    const active = getActiveHero();
    if (!active || active.down || active.acted || state.gameOver || state.combat) return false;
    if (state.rolled !== null || state.isRolling || state.isMoving) return false;
    return getWorldUnitMembers(active).every(h => !h.acted && !h.down);
  }

  function cleanupParty(partyId) {
    const party = getPartyById(partyId);
    if (!party) return;
    party.memberIds = party.memberIds.filter(id => {
      const hero = state.heroes.find(h => h.id === id);
      return hero && hero.partyId === party.id && !hero.down;
    });
    if (party.memberIds.length < 2) {
      party.memberIds.forEach(id => {
        const hero = state.heroes.find(h => h.id === id);
        if (hero) hero.partyId = null;
      });
      delete state.parties[party.id];
      return;
    }
    if (!party.memberIds.includes(party.leaderId)) party.leaderId = party.memberIds[0];
  }

  function removeHeroFromParty(hero) {
    if (!window.PARTY_SYSTEM_ENABLED) { if (hero) hero.partyId = null; return; }
    if (!hero?.partyId) return;
    const partyId = hero.partyId;
    const party = getPartyById(partyId);
    hero.partyId = null;
    if (!party) return;
    party.memberIds = party.memberIds.filter(id => id !== hero.id);
    cleanupParty(partyId);
  }

  function getNextReadyHero() {
    for (const hero of state.heroes) {
      if (hero.down || hero.acted) continue;
      const party = getHeroParty(hero);
      if (!party) return hero;
      const leader = getWorldUnitLeader(hero);
      if (leader && !leader.acted && !leader.down) return leader;
      const readyMember = getPartyMembers(party).find(h => !h.acted && !h.down);
      if (readyMember) {
        party.leaderId = readyMember.id;
        return readyMember;
      }
    }
    return null;
  }

  function renderHUD() {
    roundValue.textContent = state.round;
    threatValue.textContent = `${state.threat} / 12`;
    threatFill.style.width = `${Math.min(100, state.threat / 12 * 100)}%`;

    let active = getActiveHero();
    const leader = getWorldUnitLeader(active);
    if (leader && active?.id !== leader.id && state.rolled === null && !state.combat) {
      state.activeHeroId = leader.id;
      active = leader;
    }
    const party = getHeroParty(active);
    const unit = getWorldUnitMembers(active);

    if (currentTurnBanner && currentTurnName) {
      currentTurnBanner.classList.toggle('game-over', state.gameOver);
      currentTurnBanner.dataset.hero = active?.id || '';
      currentTurnName.textContent = state.gameOver
        ? '☠ GAME OVER'
        : state.combat
          ? '⚔ 전투 진행 중'
          : active
            ? party
              ? `🤝 ${active.name} 파티 턴 (${unit.length}명)`
              : `${active.icon} ${active.name} 턴`
            : '-';
      const guide = currentTurnBanner.querySelector('.turn-guide');
      if (guide) {
        guide.textContent = state.gameOver
          ? '왕국의 운명이 끝났다'
          : state.combat
            ? '전투를 먼저 해결해'
            : state.isMoving
              ? party ? '파티 이동 중…' : '이동 중…'
              : state.isRolling
                ? '주사위 굴리는 중…'
                : state.rolled === null
                  ? party ? '파티는 주사위 1개로 함께 이동해' : '주사위를 굴려 행동해'
                  : `최대 ${state.rolled}칸 이동할 곳을 선택해`;
      }
    }
  }

  function renderParty() {
    partyList.innerHTML = '';
    const active = getActiveHero();
    state.heroes.forEach(hero => {
      const el = document.createElement('div');
      const party = getHeroParty(hero);
      const isLeader = Boolean(party && party.leaderId === hero.id);
      const isActive = hero.id === state.activeHeroId;
      const isUnitActive = active && sameWorldUnit(active, hero);
      el.className = `party-member ${isActive ? 'active' : ''} ${isUnitActive ? 'unit-active' : ''} ${hero.acted ? 'done' : ''} ${hero.down ? 'down' : ''}`;
      const status = hero.down
        ? 'DOWN'
        : hero.acted
          ? 'DONE'
          : party
            ? isLeader ? 'PARTY LEADER' : 'PARTY'
            : 'READY';
      const bagCount = heroInventory(hero).length;
      el.innerHTML = `
        ${heroSpriteHTML(hero, 'medium')}
        <div class="party-info">
          <div class="name-row">
            <strong>${hero.icon} ${hero.name}</strong>
            <span class="party-state">${status}</span>
            <button type="button" class="party-status-btn" aria-label="${hero.name} 상태 보기">상태</button>
          </div>
          <div>❤️ ${hero.currentHp}/${hero.hp} · 🛡 ${Math.max(1, hero.ac + equipmentStat(hero, 'ac') - (hero.acPenalty || 0))}${hero.currentMana !== null ? ` · 🔵 ${hero.currentMana}/${maxMana(hero)}` : ''} · 🎒 ${bagCount}</div>
          <div class="hp-bar"><div class="hp-fill" style="width:${hero.currentHp/hero.hp*100}%"></div></div>
          ${party ? `<div class="party-link-note">🤝 ${partyDisplayName(party)}${isLeader ? ' · 리더' : ''}</div>` : ''}
          ${hero.down ? `<div class="down-note">다음 라운드 ${hero.reviveAreaId || getNodeAreaId(hero.position)} 지역 마을에서 부활</div>` : ''}
        </div>
      `;
      el.querySelector('.party-status-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openHeroStatus(hero);
      });
      // V0.4.8: 영웅 카드를 눌러도 턴은 바뀌지 않는다.
      // 해당 영웅이 있는 지역으로 카메라만 이동하고 토큰을 잠깐 강조한다.
      el.addEventListener('click', () => {
        if (state.isRolling || state.isMoving || state.combat) return;
        const heroNode = WORLD_NODES.find(n => n.id === hero.position);
        if (heroNode?.areaId) state.viewAreaId = heroNode.areaId;
        state.focusHeroId = hero.id;
        renderMap();
        renderRegionNavigator();
        window.clearTimeout(state.focusHeroTimer);
        state.focusHeroTimer = window.setTimeout(() => {
          if (state.focusHeroId === hero.id) {
            state.focusHeroId = null;
            renderMap();
          }
        }, 1450);
      });
      partyList.appendChild(el);
    });
    if (turnOrderHint) {
      const order = state.heroes.map(h => `${h.icon} ${h.name}`).join(' → ');
      turnOrderHint.innerHTML = `<strong>고정 턴 순서</strong> · ${order}<br><span>영웅 카드를 누르면 위치만 확인하고 턴은 바뀌지 않아.</span>`;
    }
    const normalizedActive = getActiveHero();
    const party = getHeroParty(normalizedActive);
    activeHeroLabel.textContent = normalizedActive
      ? party ? `🤝 ${partyDisplayName(party)}` : `${normalizedActive.icon} ${normalizedActive.name}`
      : '';
    const totalBag = state.heroes.reduce((sum, h) => sum + heroInventory(h).length, 0);
    const dragonArea = state.dragonCastleNodeId ? getNodeAreaId(state.dragonCastleNodeId) : null;
    if (resourceSummary) resourceSummary.textContent = `🗿 ${state.seals}/3 · 💰 ${state.gold} · 🎒 ${totalBag}${dragonArea ? ` · 🐉 ${dragonArea}` : ''}`;
  }

  function getNodeAreaId(nodeId) {
    return WORLD_NODES.find(n => n.id === nodeId)?.areaId || 'A';
  }

  function flushDragonCastleNotice() {
    if (!state.dragonSpawnNoticePending || state.combat) return;
    const message = state.dragonSpawnNoticePending;
    state.dragonSpawnNoticePending = null;
    showModal('🐉 용의 성 출현', message);
  }

  function checkDragonCastleSpawn(trigger = '') {
    if (state.dragonCastleSpawned) return false;
    if (state.seals < 3 && state.threat < 12) return false;

    const occupied = new Set(state.heroes.filter(h => !h.down).map(h => h.position));
    let candidates = WORLD_NODES.filter(n =>
      !occupied.has(n.id) &&
      !['마을','입구','보스','드래곤성'].includes(n.type)
    );
    if (!candidates.length) candidates = WORLD_NODES.filter(n => !['마을','입구','보스','드래곤성'].includes(n.type));
    const node = candidates[Math.floor(Math.random() * candidates.length)];
    if (!node) return false;

    node.originalTile = { name:node.name, short:node.short, icon:node.icon, type:node.type, region:node.region };
    node.name = '드래곤의 성';
    node.short = '용의 성';
    node.icon = '🐉';
    node.type = '드래곤성';
    node.region = 'dragon';
    delete node.encounterPool;
    delete node.bossMonsterId;

    state.dragonCastleNodeId = node.id;
    state.dragonCastleSpawned = true;
    const areaMeta = window.WORLD_AREAS?.[node.areaId];
    const reason = state.seals >= 3 ? '봉인석 3개가 모였다.' : 'DRAGON THREAT가 12에 도달했다.';
    const message = `${reason} ${node.areaId} 지역 · ${areaMeta?.themeLabel || ''}에 드래곤의 성이 나타났다!`;
    state.dragonSpawnNoticePending = message;
    log(`🐉 <strong>용의 성 출현!</strong> ${node.areaId} 지역 · ${node.name}`);
    if (state.combat) combatLogEntry?.(`🐉 ${reason} 용의 성이 ${node.areaId} 지역에 출현!`);
    flushDragonCastleNotice();
    renderRegionNavigator();
    return true;
  }

  function renderRegionNavigator() {
    if (!regionNavigator) return;
    regionNavigator.innerHTML = '';
    const active = getActiveHero();
    const activeArea = active ? getNodeAreaId(active.position) : 'A';
    ['A','B','C','D'].forEach(areaId => {
      const meta = window.WORLD_AREAS?.[areaId] || { id:areaId, name:`${areaId} 지역`, themeLabel:'미지의 땅', icon:'🗺️' };
      const heroesInArea = state.heroes.filter(h => getNodeAreaId(h.position) === areaId && !h.down);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `region-nav-btn ${state.viewAreaId === areaId ? 'active' : ''} ${activeArea === areaId ? 'hero-area' : ''}`;
      const dragonHere = state.dragonCastleNodeId && getNodeAreaId(state.dragonCastleNodeId) === areaId;
      btn.innerHTML = `<span class="region-code">${areaId}</span><span class="region-icon">${dragonHere ? '🐉' : meta.icon}</span><small>${heroesInArea.map(h=>h.icon).join('') || meta.themeLabel}</small>`;
      btn.addEventListener('click', () => {
        if (state.isRolling || state.isMoving || state.combat || state.rolled !== null) return;
        state.viewAreaId = areaId;
        renderMap();
        renderRegionNavigator();
      });
      regionNavigator.appendChild(btn);
    });
    const meta = window.WORLD_AREAS?.[state.viewAreaId];
    if (regionTitle) regionTitle.textContent = `${state.viewAreaId} 지역 · ${meta?.themeLabel || '미지의 땅'}`;
  }

  function renderMap() {
    worldMap.innerHTML = '';
    const activeHero = getActiveHero();
    const activeArea = activeHero ? getNodeAreaId(activeHero.position) : state.viewAreaId;
    if (state.rolled !== null && activeArea !== state.viewAreaId) state.viewAreaId = activeArea;
    renderRegionNavigator();
    const areaMeta = window.WORLD_AREAS?.[state.viewAreaId];
    worldMap.dataset.areaId = state.viewAreaId;
    worldMap.dataset.theme = areaMeta?.themeKey || '';

    const watermark = document.createElement('div');
    watermark.className = 'area-watermark';
    watermark.innerHTML = `<span>${state.viewAreaId} 지역</span><small>${areaMeta?.icon || '🗺️'} ${areaMeta?.themeLabel || ''}</small>`;
    worldMap.appendChild(watermark);

    const reachable = getReachableNodeIds();
    WORLD_NODES.filter(node => node.areaId === state.viewAreaId).forEach(node => {
      const el = document.createElement('div');
      const heroesHere = state.heroes.filter(h => h.position === node.id);
      const activeUnit = getWorldUnitMembers(activeHero);
      const isCurrent = activeUnit.some(h => h.position === node.id);
      const isDragon = node.type === '드래곤성';
      el.className = `map-node region-${node.region || 'road'} ${reachable.has(node.id) ? 'reachable' : ''} ${isCurrent ? 'current' : ''} ${isDragon ? 'dragon-spawned' : ''}`;
      el.dataset.nodeId = node.id;
      el.style.gridColumn = node.x;
      el.style.gridRow = node.y;
      el.innerHTML = `
        <div class="node-icon">${node.icon}</div>
        <div class="node-name">${node.short || node.name}</div>
        <div class="node-type">${node.type}</div>
        ${heroesHere.length ? `<div class="map-token-grid count-${heroesHere.length}">${heroesHere.map(h => `<div class="map-hero-token token-${h.id} ${activeUnit.some(a => a.id === h.id) ? 'active' : ''} ${state.focusHeroId === h.id ? 'focused' : ''}" data-hero-id="${h.id}" aria-label="${h.name}">${h.icon}</div>`).join('')}</div>` : ''}
      `;
      if (reachable.has(node.id)) el.addEventListener('click', () => moveActiveHero(node.id));
      worldMap.appendChild(el);
    });
  }

  function renderControls() {
    const active = getActiveHero();
    const party = getHeroParty(active);
    const unit = getWorldUnitMembers(active);
    const canAct = active && !active.acted && !active.down && !state.gameOver && !state.combat && unit.every(h => !h.acted && !h.down);
    rollBtn.disabled = !canAct || state.rolled !== null || state.isRolling || state.isMoving;
    diceValue.textContent = state.isRolling ? '…' : (state.rolled === null ? '-' : `${DICE_FACES[state.rolled - 1]} ${state.rolled}`);
    if (state.isMoving) {
      moveHint.textContent = party ? '파티 이동 중…' : '영웅 이동 중…';
    } else if (state.isRolling) {
      moveHint.textContent = '주사위 굴리는 중…';
    } else {
      moveHint.textContent = state.rolled === null
        ? party ? `${partyDisplayName(party)} · 주사위 1개로 함께 이동` : '주사위를 굴려 이동'
        : `1~${state.rolled}칸 이동 가능`;
    }

    const prep = canUseWorldPrepActions();
    if (partyManageBtn) {
      partyManageBtn.hidden = !window.PARTY_SYSTEM_ENABLED;
      partyManageBtn.disabled = true;
    }
    const transferSources = unit.filter(h => heroInventory(h).length || Object.values(h.equipment || {}).some(Boolean));
    const nearbyCount = active ? state.heroes.filter(h => !h.down && h.position === active.position).length : 0;
    if (itemTransferBtn) itemTransferBtn.disabled = !prep || !transferSources.length || nearbyCount < 2;
    if (partyStatusText) partyStatusText.textContent = 'SOLO MODE · 파티 기능 잠김';
    worldActionBar?.classList.toggle('disabled', !prep);
  }

  function closeModalPanel() {
    modal.classList.add('hidden');
    modal.classList.remove('hero-status-modal', 'party-manage-modal', 'item-transfer-modal');
    modalCloseBtn.textContent = '확인';
    modalCloseBtn.hidden = false;
  }

  function openPartyManager() {
    if (!window.PARTY_SYSTEM_ENABLED) { showModal('🤝 파티 편성', '현재 프로토타입에서는 파티 기능을 잠가두었어.'); return; }
    if (!canUseWorldPrepActions()) return;
    const active = getActiveHero();
    if (!active) return;
    const currentParty = getHeroParty(active);
    const currentPartyId = currentParty?.id || null;
    const candidates = state.heroes.filter(h =>
      !h.down && !h.acted && h.position === active.position && (!h.partyId || h.partyId === currentPartyId)
    );

    if (!currentParty && candidates.length < 2) {
      showModal('🤝 파티 편성', '같은 칸에 아직 행동하지 않은 다른 영웅이 있어야 파티를 만들 수 있어.');
      return;
    }

    const selected = new Set(currentParty ? currentParty.memberIds : [active.id]);
    selected.add(active.id);
    const renderManager = () => {
      modal.classList.remove('hero-status-modal', 'item-transfer-modal');
      modal.classList.add('party-manage-modal');
      modalCloseBtn.textContent = '닫기';
      const pos = WORLD_NODES.find(n => n.id === active.position);
      modalContent.innerHTML = `
        <div class="party-manage-sheet">
          <div class="status-kicker">PARTY FORMATION</div>
          <h3>🤝 파티 편성</h3>
          <p class="party-rule-copy">같은 칸의 READY 영웅끼리 파티를 만든다. 파티는 D6 하나로 함께 이동하고, 전투에는 파티원 전원이 참가해. 파티 이동/행동을 하면 파티원 모두의 월드 턴이 끝난다.</p>
          <div class="party-location">📍 ${pos?.name || active.position}</div>
          <div class="party-picker-list">
            ${candidates.map(h => {
              const checked = selected.has(h.id);
              const locked = h.id === active.id;
              return `<label class="party-picker-row ${checked ? 'selected' : ''}">
                <input type="checkbox" data-party-hero="${h.id}" ${checked ? 'checked' : ''} ${locked ? 'disabled' : ''}>
                <span>${h.icon} <strong>${h.name}</strong></span>
                <small>${locked ? '현재 리더' : 'READY'}</small>
              </label>`;
            }).join('')}
          </div>
          <div class="party-manage-actions">
            <button type="button" class="pixel-btn primary" id="partySaveBtn">${currentParty ? '파티 변경' : '파티 만들기'}</button>
            ${currentParty ? '<button type="button" class="pixel-btn danger" id="partyDisbandBtn">파티 해산</button>' : ''}
          </div>
        </div>
      `;

      modalContent.querySelectorAll('[data-party-hero]').forEach(input => {
        input.addEventListener('change', () => {
          if (input.checked) selected.add(input.dataset.partyHero);
          else selected.delete(input.dataset.partyHero);
          input.closest('.party-picker-row')?.classList.toggle('selected', input.checked);
        });
      });

      modalContent.querySelector('#partySaveBtn')?.addEventListener('click', () => {
        const memberIds = [...selected].filter(id => candidates.some(h => h.id === id));
        if (memberIds.length < 2) {
          showModal('🤝 파티 편성', '파티는 최소 2명의 영웅이 필요해.');
          return;
        }
        let party = currentParty;
        if (!party) {
          const serial = state.nextPartySerial++;
          const id = `party-${serial}`;
          party = { id, label:String.fromCharCode(64 + Math.min(serial, 26)), leaderId:active.id, memberIds:[] };
          state.parties[id] = party;
        }
        const previousIds = [...party.memberIds];
        previousIds.forEach(id => {
          if (!memberIds.includes(id)) {
            const h = state.heroes.find(hero => hero.id === id);
            if (h) h.partyId = null;
          }
        });
        party.memberIds = memberIds;
        party.leaderId = active.id;
        memberIds.forEach(id => {
          const h = state.heroes.find(hero => hero.id === id);
          if (h) h.partyId = party.id;
        });
        state.activeHeroId = active.id;
        log(`🤝 <strong>${partyDisplayName(party)}</strong> 편성 · ${getPartyMembers(party).map(h => h.icon + h.name).join(' + ')}`);
        closeModalPanel();
        renderAll();
      });

      modalContent.querySelector('#partyDisbandBtn')?.addEventListener('click', () => {
        if (!currentParty) return;
        const names = getPartyMembers(currentParty).map(h => h.name).join(', ');
        getPartyMembers(currentParty).forEach(h => { h.partyId = null; });
        delete state.parties[currentParty.id];
        state.activeHeroId = active.id;
        log(`↔️ <strong>${partyDisplayName(currentParty)}</strong> 해산 · ${names}`);
        closeModalPanel();
        renderAll();
      });
    };
    renderManager();
    modal.classList.remove('hidden');
  }

  function ownedItemEntries(hero) {
    const entries = heroInventory(hero).map((id, index) => ({ id, source:'inventory', index, slot:null }));
    Object.entries(hero.equipment || {}).forEach(([slot, id]) => {
      if (id) entries.push({ id, source:'equipment', index:null, slot });
    });
    return entries;
  }

  function removeOwnedItem(hero, entry) {
    if (entry.source === 'equipment') {
      if (hero.equipment?.[entry.slot] === entry.id) hero.equipment[entry.slot] = null;
      if (hero.currentMana !== null) hero.currentMana = Math.min(hero.currentMana, maxMana(hero));
      return true;
    }
    const inv = heroInventory(hero);
    const idx = Number.isInteger(entry.index) && inv[entry.index] === entry.id ? entry.index : inv.indexOf(entry.id);
    if (idx < 0) return false;
    inv.splice(idx, 1);
    return true;
  }

  function equipInventoryItem(hero, itemId, inventoryIndex = null) {
    const item = getItemCard?.(itemId);
    if (!hero || !item || item.type !== 'equipment') return false;
    if (!canHeroEquip(hero, item)) {
      log(`🚫 ${hero.icon} <strong>${hero.name}</strong>은(는) ${item.name}을 장착할 수 없다.`);
      return false;
    }
    const inv = heroInventory(hero);
    const idx = Number.isInteger(inventoryIndex) && inv[inventoryIndex] === itemId ? inventoryIndex : inv.indexOf(itemId);
    if (idx < 0) return false;
    inv.splice(idx, 1); // 새 장비가 빠지므로 기존 장비가 들어갈 한 칸이 생긴다.
    const oldId = hero.equipment?.[item.slot];
    if (!hero.equipment) hero.equipment = { armor:null, weapon:null, accessory:null };
    if (oldId) inv.push(oldId);
    hero.equipment[item.slot] = item.id;
    if (hero.currentMana !== null) hero.currentMana = Math.min(hero.currentMana, maxMana(hero));
    log(`✨ ${hero.icon} <strong>${hero.name}</strong> · ${item.name} 장착${oldId ? ' / 기존 장비는 가방으로' : ''}.`);
    return true;
  }

  function openItemTransfer() {
    if (!canUseWorldPrepActions()) return;
    const active = getActiveHero();
    if (!active) return;
    const unit = getWorldUnitMembers(active);
    const sources = unit.filter(h => ownedItemEntries(h).length > 0);
    if (!sources.length) {
      showModal('🎒 아이템 전달', '현재 행동하는 영웅/파티가 가진 아이템이 없어.');
      return;
    }
    const sameTileHeroes = state.heroes.filter(h => !h.down && h.position === active.position);
    if (sameTileHeroes.length < 2) {
      showModal('🎒 아이템 전달', '아이템을 주려면 다른 영웅과 같은 칸에 있어야 해.');
      return;
    }
    let sourceHero = sources[0];
    let chosenEntry = null;

    const renderTransfer = () => {
      modal.classList.remove('hero-status-modal', 'party-manage-modal');
      modal.classList.add('item-transfer-modal');
      modalCloseBtn.textContent = '취소';
      const sourceEntries = ownedItemEntries(sourceHero);
      if (chosenEntry && !sourceEntries.some(e => e.id === chosenEntry.id && e.source === chosenEntry.source && e.slot === chosenEntry.slot)) chosenEntry = null;
      const recipients = sameTileHeroes.filter(h => h.id !== sourceHero.id);
      modalContent.innerHTML = `
        <div class="item-transfer-sheet">
          <div class="status-kicker">TRADE ACTION</div>
          <h3>🎒 아이템 전달</h3>
          <p class="party-rule-copy">같은 칸의 영웅에게 아이템 1개를 전달할 수 있어. 전달하면 <strong>${getHeroParty(active) ? '파티의' : sourceHero.name + '의'} 이번 월드 턴이 즉시 끝나.</strong></p>
          ${sources.length > 1 ? `<div class="transfer-source-tabs">${sources.map(h => `<button type="button" class="text-btn ${h.id === sourceHero.id ? 'active' : ''}" data-transfer-source="${h.id}">${h.icon} ${h.name}</button>`).join('')}</div>` : `<div class="transfer-source-single">보내는 영웅 · ${sourceHero.icon} <strong>${sourceHero.name}</strong></div>`}
          <div class="transfer-item-list">
            ${sourceEntries.map((entry, idx) => {
              const item = getItemCard(entry.id);
              if (!item) return '';
              const selected = chosenEntry && chosenEntry.id === entry.id && chosenEntry.source === entry.source && chosenEntry.slot === entry.slot && (entry.source === 'equipment' || chosenEntry.index === entry.index);
              return `<button type="button" class="transfer-item-row ${selected ? 'selected' : ''}" data-transfer-entry="${idx}">
                <span>${item.icon || '🎁'}</span><strong>${item.name}</strong><small>${entry.source === 'equipment' ? '장착 중 · 전달 시 해제' : item.type === 'equipment' ? itemSlotLabel(item.slot) : '가방'}</small>
              </button>`;
            }).join('')}
          </div>
          <div class="transfer-recipient-title">받을 영웅</div>
          <div class="transfer-recipient-grid">
            ${recipients.map(h => `<button type="button" class="pixel-btn" data-transfer-recipient="${h.id}" ${chosenEntry ? '' : 'disabled'}>${h.icon} ${h.name}</button>`).join('')}
          </div>
        </div>
      `;
      modalContent.querySelectorAll('[data-transfer-source]').forEach(btn => {
        btn.addEventListener('click', () => {
          sourceHero = sources.find(h => h.id === btn.dataset.transferSource) || sourceHero;
          chosenEntry = null;
          renderTransfer();
        });
      });
      modalContent.querySelectorAll('[data-transfer-entry]').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = Number(btn.dataset.transferEntry);
          chosenEntry = ownedItemEntries(sourceHero)[index] || null;
          renderTransfer();
        });
      });
      modalContent.querySelectorAll('[data-transfer-recipient]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!chosenEntry) return;
          const recipient = state.heroes.find(h => h.id === btn.dataset.transferRecipient);
          const item = getItemCard(chosenEntry.id);
          if (!recipient || !item || recipient.position !== sourceHero.position || recipient.id === sourceHero.id) return;
          if (!bagHasSpace(recipient)) {
            showModal('🎒 가방이 가득 참', `${recipient.name}의 가방은 ${BAG_LIMIT}칸 모두 사용 중이야.`);
            return;
          }
          if (!removeOwnedItem(sourceHero, chosenEntry)) return;
          heroInventory(recipient).push(item.id);
          log(`🎒 ${sourceHero.icon} <strong>${sourceHero.name}</strong> → ${recipient.icon} <strong>${recipient.name}</strong> · ${item.name} 전달.`);
          closeModalPanel();
          renderAll();
          finishWorldUnitTurn(active, 'item-transfer');
        }, { once:true });
      });
    };
    renderTransfer();
    modal.classList.remove('hidden');
  }

  const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  let diceAnimationFrame = null;

  function setRollingDieFace(value) {
    if (!diceRoller) return;
    const face = Math.max(1, Math.min(6, Number(value) || 1));
    diceRoller.dataset.face = String(face);
  }

  function clearDiceDisplay() {
    if (diceAnimationFrame) {
      cancelAnimationFrame(diceAnimationFrame);
      diceAnimationFrame = null;
    }
    if (!diceRoller) return;
    diceRoller.classList.remove('rolling', 'landed');
    diceRoller.style.display = 'none';
    diceRoller.style.transform = '';
    diceRoller.style.filter = '';
    diceRoller.style.opacity = '';
    diceRoller.setAttribute('aria-hidden', 'true');
    worldMap?.classList.remove('board-impact');
  }

  function playDiceRollAnimation(finalValue) {
    return new Promise(resolve => {
      if (!diceRoller || !worldMap) {
        resolve();
        return;
      }

      const boardPanel = worldMap.closest('.board-panel');
      if (!boardPanel) {
        resolve();
        return;
      }

      clearDiceDisplay();

      const panelRect = boardPanel.getBoundingClientRect();
      const mapRect = worldMap.getBoundingClientRect();
      const dieSize = Math.max(42, Math.min(58, mapRect.width * 0.09));
      const fromLeft = Math.random() < 0.5;
      const dir = fromLeft ? 1 : -1;

      const mapLeft = mapRect.left - panelRect.left;
      const mapTop = mapRect.top - panelRect.top;
      const mapW = mapRect.width;
      const mapH = mapRect.height;

      // 손에서 높게 던진 뒤 보드 중앙 쪽으로 들어오는 시작/정점/착지 위치.
      const startX = fromLeft
        ? mapLeft - dieSize * 0.18
        : mapLeft + mapW - dieSize * 0.82;
      const startY = mapTop - dieSize * (1.0 + Math.random() * 0.35);
      const apexX = startX + dir * mapW * (0.18 + Math.random() * 0.08);
      const apexY = mapTop - dieSize * (2.7 + Math.random() * 0.55);
      const groundY = mapTop + mapH * (0.54 + Math.random() * 0.17) - dieSize / 2;
      const impactX = mapLeft + mapW * (fromLeft ? 0.34 : 0.58) - dieSize / 2;
      const endX = impactX + dir * mapW * (0.16 + Math.random() * 0.08);

      diceRoller.style.setProperty('--die-size', `${dieSize}px`);
      diceRoller.style.display = 'grid';
      diceRoller.style.opacity = '1';
      diceRoller.classList.add('rolling');
      diceRoller.setAttribute('aria-hidden', 'false');

      // 모션 감소 설정에서는 연출을 짧게 하고 바로 결과를 남긴다.
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        setRollingDieFace(finalValue);
        diceRoller.style.transform = `translate3d(${endX}px, ${groundY}px, 0) rotate(0deg) scale(1)`;
        diceRoller.classList.remove('rolling');
        diceRoller.classList.add('landed');
        diceRoller.setAttribute('aria-label', `주사위 결과 ${finalValue}`);
        setTimeout(resolve, 120);
        return;
      }

      const totalMs = 1500;
      const impactAt = 0.54;
      const bounce1End = 0.73;
      const bounce2End = 0.86;
      let startTime = null;
      let impactDone = false;
      let lastFaceAt = -1000;

      // 부드러운 감속/보간 함수.
      const clamp01 = v => Math.max(0, Math.min(1, v));
      const smooth = v => {
        const x = clamp01(v);
        return x * x * (3 - 2 * x);
      };
      const easeOut = v => 1 - Math.pow(1 - clamp01(v), 3);
      const lerp = (a, b, v) => a + (b - a) * v;
      const quadBezier = (a, b, c, v) => {
        const u = 1 - v;
        return u * u * a + 2 * u * v * b + v * v * c;
      };

      function draw(now) {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const t = clamp01(elapsed / totalMs);

        let x;
        let y;
        let scale;

        if (t < impactAt) {
          // 공중 궤적: CSS 구간 이동이 아니라 매 프레임 베지어 곡선을 계산해 부드럽게 낙하한다.
          const u = t / impactAt;
          x = quadBezier(startX, apexX, impactX, u);
          y = quadBezier(startY, apexY, groundY, u);
          scale = lerp(0.72, 1.08, smooth(u));
        } else if (t < bounce1End) {
          // 첫 번째 바운스: 높고 길게.
          const u = (t - impactAt) / (bounce1End - impactAt);
          const travel = smooth(u);
          x = lerp(impactX, impactX + dir * mapW * 0.095, travel);
          y = groundY - Math.sin(Math.PI * u) * dieSize * 0.82;
          scale = 1 - Math.sin(Math.PI * u) * 0.035;
        } else if (t < bounce2End) {
          // 두 번째 바운스: 낮고 짧게.
          const u = (t - bounce1End) / (bounce2End - bounce1End);
          const fromX = impactX + dir * mapW * 0.095;
          const travel = smooth(u);
          x = lerp(fromX, impactX + dir * mapW * 0.135, travel);
          y = groundY - Math.sin(Math.PI * u) * dieSize * 0.31;
          scale = 1 - Math.sin(Math.PI * u) * 0.018;
        } else {
          // 마지막은 미끄러지는 게 아니라 짧게 또르륵 굴러가며 마찰로 감속한다.
          const u = (t - bounce2End) / (1 - bounce2End);
          const fromX = impactX + dir * mapW * 0.135;
          x = lerp(fromX, endX, easeOut(u));
          const microBounce = Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u) * dieSize * 0.055;
          y = groundY - microBounce;
          scale = 1;
        }

        // 회전량도 마지막으로 갈수록 자연스럽게 줄어든다.
        const rotationProgress = 1 - Math.pow(1 - t, 1.65);
        const totalRotation = dir * (1510 + Math.random() * 0); // 프레임마다 난수 방지용 상수식
        const angle = -dir * 24 + totalRotation * rotationProgress;
        const squash = (t > impactAt - 0.012 && t < impactAt + 0.025) ? 0.94 : 1;
        diceRoller.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}deg) scale(${scale}, ${scale * squash})`;

        // 날아가는 동안 면을 바꾸되, 막판에는 최종 면을 먼저 보여줘 눈으로 결과를 따라갈 수 있게 한다.
        if (elapsed - lastFaceAt > (t < 0.72 ? 78 : 118)) {
          lastFaceAt = elapsed;
          if (t < 0.88) {
            setRollingDieFace(Math.floor(Math.random() * 6) + 1);
          } else {
            setRollingDieFace(finalValue);
          }
        }

        if (!impactDone && t >= impactAt) {
          impactDone = true;
          worldMap.classList.remove('board-impact');
          void worldMap.offsetWidth;
          worldMap.classList.add('board-impact');
          setTimeout(() => worldMap.classList.remove('board-impact'), 190);
        }

        if (t < 1) {
          diceAnimationFrame = requestAnimationFrame(draw);
          return;
        }

        diceAnimationFrame = null;
        setRollingDieFace(finalValue);
        diceRoller.style.transform = `translate3d(${endX}px, ${groundY}px, 0) rotate(${Math.round(angle / 90) * 90}deg) scale(1)`;
        diceRoller.classList.remove('rolling');
        diceRoller.classList.add('landed');
        diceRoller.setAttribute('aria-label', `주사위 결과 ${finalValue}`);

        // 결과 주사위는 사라지지 않는다. 플레이어가 이동을 확정할 때까지 보드 위에 남아 있다.
        setTimeout(resolve, 180);
      }

      setRollingDieFace(Math.floor(Math.random() * 6) + 1);
      diceAnimationFrame = requestAnimationFrame(draw);
    });
  }

  async function rollD6() {
    if (state.rolled !== null || state.isRolling || state.isMoving || state.gameOver || state.combat) return;
    const hero = getWorldUnitLeader(getActiveHero());
    if (!hero || hero.down || hero.acted) return;
    const unit = getWorldUnitMembers(hero);
    if (unit.some(h => h.acted || h.down)) return;
    const rawResult = Math.floor(Math.random() * 6) + 1;
    const result = rawResult === 1 && equipmentEffect(hero, 'minimumMove') >= 2 ? 2 : rawResult;
    state.activeHeroId = hero.id;
    state.viewAreaId = getNodeAreaId(hero.position);
    renderMap();
    state.isRolling = true;
    renderControls();

    await playDiceRollAnimation(rawResult);
    if (result !== rawResult) {
      setRollingDieFace(result);
      log(`👢 <strong>여행자의 장화</strong> 발동 · 이동 주사위 1을 2로 취급.`);
    }

    state.rolled = result;
    state.isRolling = false;
    const party = getHeroParty(hero);
    log(`${party ? '🤝 <strong>' + partyDisplayName(party) + '</strong>' : hero.icon + ' <strong>' + hero.name + '</strong>'} 이동 주사위 → 🎲 <strong>${state.rolled}</strong>`);
    renderAll();
  }

  function getActiveHero() {
    return state.heroes.find(h => h.id === state.activeHeroId);
  }

  function getReachableNodeIds() {
    const result = new Set();
    const hero = getWorldUnitLeader(getActiveHero());
    const unit = getWorldUnitMembers(hero);
    if (state.combat || !hero || hero.down || state.rolled === null || hero.acted || unit.some(h => h.acted || h.down)) return result;

    const maxDepth = state.rolled;
    const queue = [{ id: hero.position, depth: 0 }];
    const visited = new Map([[hero.position, 0]]);

    while (queue.length) {
      const { id, depth } = queue.shift();
      if (depth > 0) result.add(id);
      if (depth >= maxDepth) continue;
      const node = WORLD_NODES.find(n => n.id === id);
      for (const next of node.links) {
        const nextNode = WORLD_NODES.find(n => n.id === next);
        const locked = nextNode.locked && state.seals < 3 && state.threat < 9;
        if (locked) continue;
        const nd = depth + 1;
        if (!visited.has(next) || visited.get(next) > nd) {
          visited.set(next, nd);
          queue.push({ id: next, depth: nd });
        }
      }
    }
    return result;
  }

  function nodeIsLocked(node) {
    return Boolean(node?.locked && state.seals < 3 && state.threat < 9);
  }

  function getShortestPath(startId, targetId, maxDepth = Infinity) {
    if (startId === targetId) return [startId];
    const queue = [{ id: startId, path: [startId] }];
    const visited = new Set([startId]);

    while (queue.length) {
      const current = queue.shift();
      const depth = current.path.length - 1;
      if (depth >= maxDepth) continue;
      const node = WORLD_NODES.find(n => n.id === current.id);
      if (!node) continue;

      for (const nextId of node.links) {
        if (visited.has(nextId)) continue;
        const nextNode = WORLD_NODES.find(n => n.id === nextId);
        if (!nextNode || nodeIsLocked(nextNode)) continue;
        const path = [...current.path, nextId];
        if (nextId === targetId) return path;
        visited.add(nextId);
        queue.push({ id: nextId, path });
      }
    }
    return null;
  }

  function getNodeLandingPoint(nodeId) {
    const nodeEl = worldMap.querySelector(`[data-node-id="${nodeId}"]`);
    if (!nodeEl) return null;
    const mapRect = worldMap.getBoundingClientRect();
    const rect = nodeEl.getBoundingClientRect();
    return {
      x: rect.left - mapRect.left + rect.width * 0.5,
      y: rect.top - mapRect.top + rect.height * 0.76,
      cell: Math.min(rect.width, rect.height),
    };
  }

  function animateHeroHop(hero, path, unitIndex = 0, unitCount = 1) {
    return new Promise(resolve => {
      if (!worldMap || !path || path.length < 2) {
        resolve();
        return;
      }

      const points = path.map(getNodeLandingPoint);
      if (points.some(p => !p)) {
        resolve();
        return;
      }

      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        resolve();
        return;
      }

      const cellSize = points[0]?.cell || 36;
      const offsetUnit = Math.max(2, Math.min(5, cellSize * 0.09));
      const offsets = unitCount <= 1
        ? [[0,0]]
        : unitCount === 2
          ? [[-offsetUnit,0],[offsetUnit,0]]
          : unitCount === 3
            ? [[0,-offsetUnit],[-offsetUnit,offsetUnit],[offsetUnit,offsetUnit]]
            : [[-offsetUnit,-offsetUnit],[offsetUnit,-offsetUnit],[-offsetUnit,offsetUnit],[offsetUnit,offsetUnit]];
      const unitOffset = offsets[Math.min(unitIndex, offsets.length - 1)] || [0,0];

      const sourceToken = worldMap.querySelector(`.map-hero-token[data-hero-id="${hero.id}"]`);
      sourceToken?.classList.add('movement-source-hidden');

      const shadow = document.createElement('div');
      shadow.className = 'hero-hop-shadow';
      worldMap.appendChild(shadow);

      const mover = document.createElement('div');
      mover.className = 'hero-hop-mover';
      mover.innerHTML = `<div class="map-hero-token moving token-${hero.id}" data-hero-id="${hero.id}" aria-hidden="true">${hero.icon}</div>`;
      const token = mover.querySelector('.map-hero-token');
      worldMap.appendChild(mover);
      worldMap.classList.add('movement-lock');

      const hopMs = 215;
      const pauseMs = 34;
      let segment = 0;

      const clamp01 = v => Math.max(0, Math.min(1, v));
      const smooth = v => {
        const x = clamp01(v);
        return x * x * (3 - 2 * x);
      };
      const lerp = (a, b, v) => a + (b - a) * v;

      function place(point, lift = 0, scaleX = 1, scaleY = 1, shadowScale = 1, shadowOpacity = .34) {
        const px = point.x + unitOffset[0];
        const py = point.y + unitOffset[1];
        mover.style.transform = `translate3d(${px}px, ${py - lift}px, 0)`;
        if (token) token.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
        shadow.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${shadowScale})`;
        shadow.style.opacity = String(shadowOpacity);
      }

      place(points[0]);

      function runSegment() {
        if (segment >= points.length - 1) {
          const lastNode = worldMap.querySelector(`[data-node-id="${path[path.length - 1]}"]`);
          lastNode?.classList.remove('hero-step-land');
          void lastNode?.offsetWidth;
          lastNode?.classList.add('hero-step-land');
          setTimeout(() => lastNode?.classList.remove('hero-step-land'), 220);

          setTimeout(() => {
            mover.remove();
            shadow.remove();
            sourceToken?.classList.remove('movement-source-hidden');
            worldMap.classList.remove('movement-lock');
            resolve();
          }, 95);
          return;
        }

        const from = points[segment];
        const to = points[segment + 1];
        const hopHeight = Math.max(12, Math.min(25, ((from.cell + to.cell) * 0.5) * 0.42));
        let started = null;

        function frame(now) {
          if (started === null) started = now;
          const t = clamp01((now - started) / hopMs);
          const travel = smooth(t);
          const ground = {
            x: lerp(from.x, to.x, travel),
            y: lerp(from.y, to.y, travel),
          };
          const arc = Math.sin(Math.PI * t);
          const lift = arc * hopHeight;

          // 이륙할 때 살짝 늘어나고, 착지 직전에 아주 조금 눌린다.
          const stretch = Math.sin(Math.PI * clamp01(t * 1.6)) * 0.045;
          const landingSquash = t > .84 ? Math.sin((t - .84) / .16 * Math.PI) * 0.075 : 0;
          const sx = 1 + landingSquash * .7 - stretch * .35;
          const sy = 1 + stretch - landingSquash;
          const shadowScale = 1 - arc * .38;
          const shadowOpacity = .36 - arc * .18;
          place(ground, lift, sx, sy, shadowScale, shadowOpacity);

          if (t < 1) {
            requestAnimationFrame(frame);
            return;
          }

          place(to, 0, 1.045, .94, 1.05, .38);
          const landedNode = worldMap.querySelector(`[data-node-id="${path[segment + 1]}"]`);
          landedNode?.classList.remove('hero-step-land');
          void landedNode?.offsetWidth;
          landedNode?.classList.add('hero-step-land');
          setTimeout(() => landedNode?.classList.remove('hero-step-land'), 180);

          segment += 1;
          setTimeout(() => {
            place(points[segment], 0, 1, 1, 1, .34);
            runSegment();
          }, pauseMs);
        }

        requestAnimationFrame(frame);
      }

      // 첫 점프 전에 보드게임 말을 집어 올리는 듯 아주 짧게 준비 동작.
      if (token) {
        token.style.transition = 'transform 70ms ease-out';
        token.style.transform = 'translate(-50%, -50%) scale(1.08, .90)';
      }
      setTimeout(() => {
        if (token) token.style.transition = 'none';
        runSegment();
      }, 72);
    });
  }


  // ─────────────────────────────────────────────
  // D20 COMBAT PROTOTYPE V0.4
  // ─────────────────────────────────────────────
  function rollDice(count, sides) {
    let total = 0;
    const rolls = [];
    for (let i = 0; i < count; i += 1) {
      const value = Math.floor(Math.random() * sides) + 1;
      rolls.push(value);
      total += value;
    }
    return { total, rolls };
  }

  function cloneEnemy(monsterId, scale = 1, suffix = '') {
    const src = MONSTERS[monsterId];
    const maxHp = Math.max(1, Math.round(src.hp * scale));
    return {
      ...src,
      uid: `${monsterId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${suffix}`,
      maxHp,
      currentHp: maxHp,
      firstDamageTaken: false,
      nextAttackPenalty: 0,
      chargeUsed: false,
      summoned: false,
    };
  }

  function encounterScale(tier, count) {
    if (count <= 1) return tier === 'boss' ? 0.65 : 0.75;
    if (count === 2) return 1;
    if (count === 3) return 1.25;
    if (tier === 'boss') return 1.35;
    if (tier === 'elite') return 1.25;
    return 1;
  }

  function chooseEncounter(node, participantCount) {
    if (node?.monsterId && MONSTERS[node.monsterId]) {
      return [cloneEnemy(node.monsterId, encounterScale(MONSTERS[node.monsterId].tier || 'normal', participantCount))];
    }
    if (node.type === '보스') {
      const monsterId = node.bossMonsterId || BOSS_ENCOUNTERS[node.id] || 'demonKnight';
      const src = MONSTERS[monsterId];
      return [cloneEnemy(monsterId, encounterScale(src.tier, participantCount))];
    }

    const pool = node.encounterPool || NODE_ENCOUNTERS[node.id] || (
      node.region === 'grave' ? ['skeleton','ghost','slime'] :
      node.region === 'war' ? ['goblin','orc','ogre','darkKnight'] :
      node.region === 'forest' ? ['wolf','spider','goblin'] :
      node.region === 'mine' ? ['orc','ogre','minotaur'] :
      node.region === 'volcano' ? ['fireImp','minotaur','wyvern'] :
      ['goblin']
    );

    const firstId = pool[Math.floor(Math.random() * pool.length)];
    const first = MONSTERS[firstId];
    const scale = encounterScale(first.tier, participantCount);
    const enemies = [cloneEnemy(firstId, scale, '-a')];

    // 4명이 한곳에 모인 일반 전투는 HP 뻥튀기 대신 적 2체로 압박한다.
    if (participantCount >= 4 && first.tier === 'normal') {
      const secondId = pool[Math.floor(Math.random() * pool.length)];
      enemies.push(cloneEnemy(secondId, 1, '-b'));
    }
    return enemies;
  }

  function getCombatHero() {
    if (!state.combat) return null;
    return state.heroes.find(h => h.id === state.combat.currentHeroId) || null;
  }

  function combatHeroState(heroId) {
    return state.combat?.heroStates?.[heroId] || null;
  }

  function aliveCombatHeroes() {
    if (!state.combat) return [];
    return state.combat.participantIds
      .map(id => state.heroes.find(h => h.id === id))
      .filter(h => h && !h.down && h.currentHp > 0);
  }

  function aliveCombatEnemies() {
    return state.combat ? state.combat.enemies.filter(e => e.currentHp > 0) : [];
  }

  function selectedCombatEnemy() {
    if (!state.combat) return null;
    const alive = aliveCombatEnemies();
    let enemy = alive.find(e => e.uid === state.combat.selectedEnemyId);
    if (!enemy) {
      enemy = alive[0] || null;
      state.combat.selectedEnemyId = enemy?.uid || null;
    }
    return enemy;
  }

  function combatLogEntry(message) {
    if (!combatLog) return;
    const entry = document.createElement('div');
    entry.className = 'combat-log-entry';
    entry.innerHTML = message;
    combatLog.prepend(entry);

    if (combatLogSummary) {
      const lines = [...combatLog.querySelectorAll('.combat-log-entry')].slice(0, 3);
      combatLogSummary.innerHTML = lines.map((line, index) => {
        const text = line.textContent.replace(/\s+/g, ' ').trim();
        return `<div class="combat-log-summary-line" data-rank="${index}">${text}</div>`;
      }).join('');
    }
  }

  function setCombatMessage(message, tone = '') {
    if (!combatMessage) return;
    combatMessage.textContent = message;
    combatMessage.dataset.tone = tone;
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function heroActorElement(heroId) {
    return combatHeroes?.querySelector(`[data-hero-id="${heroId}"]`) || null;
  }

  function enemyActorElement(enemyUid) {
    return combatEnemies?.querySelector(`[data-enemy-id="${enemyUid}"]`) || null;
  }

  function fxAtElement(el, text, tone = '') {
    if (!combatFxLayer || !combatStage || !el) return;
    const stageRect = combatStage.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const fx = document.createElement('div');
    fx.className = `combat-float-text ${tone}`.trim();
    fx.textContent = text;
    fx.style.left = `${rect.left - stageRect.left + rect.width / 2}px`;
    fx.style.top = `${rect.top - stageRect.top + rect.height * .34}px`;
    combatFxLayer.appendChild(fx);
    setTimeout(() => fx.remove(), 760);
  }

  async function animateActorWindup(el) {
    if (!el) return;
    el.classList.add('windup');
    await sleep(165);
    el.classList.remove('windup');
  }

  async function animateProjectile(fromEl, toEl, symbol) {
    if (!combatFxLayer || !combatStage || !fromEl || !toEl) return;
    const stageRect = combatStage.getBoundingClientRect();
    const from = fromEl.getBoundingClientRect();
    const to = toEl.getBoundingClientRect();
    const projectile = document.createElement('div');
    projectile.className = 'combat-projectile';
    projectile.textContent = symbol;
    projectile.style.left = `${from.left - stageRect.left + from.width * .72}px`;
    projectile.style.top = `${from.top - stageRect.top + from.height * .43}px`;
    combatFxLayer.appendChild(projectile);
    void projectile.offsetWidth;
    projectile.style.left = `${to.left - stageRect.left + to.width * .35}px`;
    projectile.style.top = `${to.top - stageRect.top + to.height * .42}px`;
    await sleep(300);
    projectile.remove();
  }

  async function animateHeroResult(hero, enemy, result, mode = 'basic') {
    const heroEl = heroActorElement(hero.id);
    const enemyEl = enemyActorElement(enemy.uid);
    if (!heroEl || !enemyEl) return;

    const ranged = hero.id === 'archer' || hero.id === 'mage' || mode === 'ranged';
    const cast = hero.id === 'mage' || mode === 'magic';
    heroEl.classList.add(cast ? 'cast' : ranged ? 'strike-ranged' : 'strike-melee');

    if (ranged) {
      await sleep(90);
      await animateProjectile(heroEl, enemyEl, cast ? '✦' : '➶');
    } else {
      await sleep(210);
    }

    if (result?.hit) {
      enemyEl.classList.add('hit');
      fxAtElement(enemyEl, result.crit ? `CRIT -${result.damage}` : `-${result.damage}`, 'damage');
    } else {
      fxAtElement(enemyEl, 'MISS', 'miss');
    }
    await sleep(ranged ? 170 : 220);
    heroEl.classList.remove('cast', 'strike-ranged', 'strike-melee');
    enemyEl.classList.remove('hit');
  }

  async function animateMagicBurst(hero, enemy, damage) {
    const heroEl = heroActorElement(hero.id);
    const enemyEl = enemyActorElement(enemy.uid);
    if (!heroEl || !enemyEl) return;
    heroEl.classList.add('cast');
    await sleep(120);
    await animateProjectile(heroEl, enemyEl, '✦');
    enemyEl.classList.add('hit');
    fxAtElement(enemyEl, `-${damage}`, 'damage');
    await sleep(240);
    heroEl.classList.remove('cast');
    enemyEl.classList.remove('hit');
  }

  async function animateDefend(hero) {
    const heroEl = heroActorElement(hero.id);
    if (!heroEl) return;
    heroEl.classList.add('guard');
    fxAtElement(heroEl, 'GUARD', 'good');
    await sleep(500);
    heroEl.classList.remove('guard');
  }

  async function animateMonsterResult(enemy, hero, hit, damage = 0) {
    const enemyEl = enemyActorElement(enemy.uid);
    const heroEl = heroActorElement(hero.id);
    if (!enemyEl || !heroEl) return;
    enemyEl.classList.add('strike');
    await sleep(230);
    if (hit) {
      heroEl.classList.add('hit');
      fxAtElement(heroEl, `-${damage}`, 'damage');
    } else {
      fxAtElement(heroEl, 'MISS', 'miss');
    }
    await sleep(230);
    enemyEl.classList.remove('strike');
    heroEl.classList.remove('hit');
  }

  function skillName(hero) {
    if (!hero) return '스킬';
    if (hero.id === 'knight') return '방패 강타';
    if (hero.id === 'archer') return '관통 사격';
    if (hero.id === 'mage') return '마력 폭발';
    if (hero.id === 'rogue') return '급소 공격';
    return '스킬';
  }

  function equipmentStat(hero, key) {
    if (!hero?.equipment || !window.getItemCard) return 0;
    return ['weapon','armor','accessory'].reduce((sum, slot) => {
      const item = getItemCard(hero.equipment[slot]);
      return sum + Number(item?.stats?.[key] || 0);
    }, 0);
  }

  function heroMainStat(hero) {
    if (hero.id === 'knight') return hero.str;
    if (hero.id === 'mage') return hero.magic;
    return hero.dex;
  }

  function heroBasicDamage(hero) {
    const gearDamage = equipmentStat(hero, 'damage');
    const meleeExtra = equipmentEffect(hero, 'meleeDamage');
    const fireWeapon = equipmentEffect(hero, 'fireWeapon') > 0;
    if (hero.id === 'knight') return { count:1, sides:8, bonus:hero.str + gearDamage + meleeExtra, type:fireWeapon ? 'fire' : 'physical', melee:true };
    if (hero.id === 'archer') return { count:1, sides:8, bonus:hero.dex + gearDamage, type:'physical', melee:false };
    if (hero.id === 'mage') return { count:1, sides:equipmentEffect(hero, 'mageBoltDie') || 6, bonus:hero.magic + gearDamage, type:'magic', melee:false };
    return { count:1, sides:6, bonus:hero.dex + gearDamage + meleeExtra, type:fireWeapon ? 'fire' : 'physical', melee:true };
  }

  function effectiveHeroAc(hero) {
    const hs = combatHeroState(hero.id);
    const defend = hs?.defending ? 3 : 0;
    return Math.max(1, hero.ac + equipmentStat(hero, 'ac') - (hero.acPenalty || 0) + defend);
  }

  function canUseCombatSkill(hero) {
    const hs = combatHeroState(hero?.id);
    if (!hero || !hs || hs.acted || state.combat?.busy) return false;
    if (hero.id === 'rogue') {
      return !hs.skillUsedRound && aliveCombatHeroes().filter(h => h.id !== hero.id).length > 0;
    }
    if (hs.skillUsedBattle) return false;
    if (hero.id === 'mage' && (hero.currentMana ?? 0) < 2) return false;
    return true;
  }

  function renderCombat() {
    const c = state.combat;
    if (!c) return;

    combatTitle.textContent = `${c.node.icon} ${c.node.name}`;
    combatRoundLabel.textContent = `COMBAT ROUND ${c.round}`;
    if (combatStage) combatStage.dataset.region = c.node.region || 'road';

    const currentHero = getCombatHero();
    combatHeroTurn.textContent = currentHero ? `${currentHero.icon} ${currentHero.name} 턴` : '👹 MONSTER TURN';

    combatHeroes.innerHTML = '';
    combatHeroes.dataset.count = String(c.participantIds.length);
    c.participantIds.forEach(id => {
      const hero = state.heroes.find(h => h.id === id);
      if (!hero) return;
      const hs = combatHeroState(id);
      // 현재 공격 차례 표시는 주사위/공격 연출 중에도 유지한다.
      const active = id === c.currentHeroId && !hero.down;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `stage-hero-actor ${active ? 'active' : ''} ${hs?.acted ? 'done' : ''} ${hero.down ? 'down' : ''}`;
      el.disabled = Boolean(c.busy || hs?.acted || hero.down);
      el.dataset.heroId = id;
      el.innerHTML = `
        <div class="stage-actor-sprite">${heroSpriteHTML(hero, 'medium')}</div>
        <div class="actor-name-row"><strong>${hero.name}</strong><span class="state">${hero.down ? 'DOWN' : hs?.acted ? 'DONE' : active ? 'TURN' : 'READY'}</span></div>
        <div class="actor-hp-text">❤️ ${hero.currentHp}/${hero.hp} · 🛡 ${effectiveHeroAc(hero)}</div>
        <div class="actor-hp-bar"><i style="width:${Math.max(0, hero.currentHp / hero.hp * 100)}%"></i></div>
        <div class="actor-status">
          ${hs?.defending ? '<span>🛡 +3</span>' : ''}
          ${hero.attackPenalty ? `<span>☠ 명중 -${hero.attackPenalty}</span>` : ''}
          ${hero.currentMana !== null ? `<span>🔵 ${hero.currentMana}/${maxMana(hero)}</span>` : ''}
        </div>`;
      el.addEventListener('click', () => {
        if (!c.busy && !hs?.acted && !hero.down) {
          c.currentHeroId = hero.id;
          setCombatMessage(`${hero.name} 행동을 선택해`, '');
          renderCombat();
        }
      });
      combatHeroes.appendChild(el);
    });

    combatEnemies.innerHTML = '';
    const visibleEnemies = aliveCombatEnemies();
    combatEnemies.dataset.count = String(visibleEnemies.length);
    visibleEnemies.forEach(enemy => {
      const selected = enemy.uid === c.selectedEnemyId;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `stage-enemy-actor tier-${enemy.tier} ${selected ? 'selected' : ''}`;
      el.dataset.enemyId = enemy.uid;
      el.title = enemy.trait || '';
      el.innerHTML = `
        <div class="stage-enemy-visual">${enemy.icon}</div>
        <div class="actor-name-row"><strong>${enemy.name}</strong><span class="state">${enemy.tier === 'boss' ? 'BOSS' : enemy.tier === 'elite' ? 'ELITE' : ''}</span></div>
        <div class="actor-hp-text">❤️ ${enemy.currentHp}/${enemy.maxHp} · 🛡 ${enemy.ac}</div>
        <div class="actor-hp-bar"><i style="width:${Math.max(0, enemy.currentHp / enemy.maxHp * 100)}%"></i></div>`;
      el.addEventListener('click', () => {
        if (!c.busy) {
          c.selectedEnemyId = enemy.uid;
          setCombatMessage(`${enemy.name}을(를) 대상으로 선택`, '');
          renderCombat();
        }
      });
      combatEnemies.appendChild(el);
    });

    const target = selectedCombatEnemy();
    combatAttackBtn.disabled = Boolean(c.busy || !currentHero || combatHeroState(currentHero.id)?.acted || !target);
    combatDefendBtn.disabled = Boolean(c.busy || !currentHero || combatHeroState(currentHero.id)?.acted);
    combatSkillBtn.disabled = !canUseCombatSkill(currentHero) || !target;
    combatSkillBtn.textContent = currentHero ? `✨ ${skillName(currentHero)}` : '✨ 스킬';
    const currentState = currentHero ? combatHeroState(currentHero.id) : null;
    const hasCombatConsumable = currentHero ? heroInventory(currentHero).some(id => {
      const item = getItemCard?.(id);
      return item?.type === 'consumable' && item.effect !== 'autoRevive';
    }) : false;
    if (combatItemBtn) combatItemBtn.disabled = Boolean(c.busy || !currentHero || currentState?.acted || currentState?.itemUsed || !hasCombatConsumable);
  }

  function animateCombatD20(finalValue, label) {
    return new Promise(resolve => {
      if (!combatD20 || !combatD20Value) {
        resolve(finalValue);
        return;
      }
      combatDiceLabel.textContent = label || 'D20';
      combatD20.classList.remove('rolling', 'hit', 'miss');
      void combatD20.offsetWidth;
      combatD20.classList.add('rolling');

      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const duration = reduced ? 120 : 660;
      const start = performance.now();
      let lastSwap = 0;

      function frame(now) {
        const elapsed = now - start;
        if (elapsed - lastSwap > 58 && elapsed < duration * .82) {
          lastSwap = elapsed;
          combatD20Value.textContent = String(Math.floor(Math.random() * 20) + 1);
        }
        if (elapsed < duration) {
          requestAnimationFrame(frame);
          return;
        }
        combatD20Value.textContent = String(finalValue);
        combatD20.classList.remove('rolling');
        combatD20.classList.add(finalValue === 1 ? 'miss' : 'hit');
        setTimeout(() => combatD20.classList.remove('hit', 'miss'), 360);
        resolve(finalValue);
      }
      requestAnimationFrame(frame);
    });
  }

  function applyDamageToEnemy(enemy, rawDamage, damageType = 'physical', attackerHero = null) {
    let damage = Math.max(0, rawDamage);

    if (!enemy.firstDamageTaken && enemy.id === 'skeleton') {
      damage = Math.max(0, damage - 2);
      enemy.firstDamageTaken = true;
      combatLogEntry('💀 뼈 갑옷이 첫 피해를 2 막았다.');
    } else if (!enemy.firstDamageTaken && enemy.id === 'ghost' && damageType === 'physical') {
      damage = Math.max(0, damage - 3);
      enemy.firstDamageTaken = true;
      combatLogEntry('👻 비물질 몸체가 첫 물리 피해를 3 흘려냈다.');
    } else if (enemy.id !== 'ghost') {
      enemy.firstDamageTaken = true;
    }

    if (enemy.id === 'demonKnight') damage = Math.min(10, damage);

    if (enemy.id === 'trollKing' && damageType === 'fire' && state.combat) {
      enemy.fireBlockedRound = state.combat.round;
      combatLogEntry('🔥 화염 피해! 트롤 왕의 이번 라운드 재생이 봉쇄된다.');
    }

    enemy.currentHp = Math.max(0, enemy.currentHp - damage);
    if (enemy.currentHp === 0) {
      combatLogEntry(`☠️ <strong>${enemy.name}</strong> 처치!`);
      setCombatMessage(`${enemy.name} 처치!`, 'good');
      if (attackerHero && equipmentEffect(attackerHero, 'killHeal') > 0 && !attackerHero.down) {
        const heal = equipmentEffect(attackerHero, 'killHeal');
        const before = attackerHero.currentHp;
        attackerHero.currentHp = Math.min(attackerHero.hp, attackerHero.currentHp + heal);
        const gained = attackerHero.currentHp - before;
        if (gained > 0) combatLogEntry(`🩸 피의 펜던트 · ${attackerHero.name} HP +${gained}`);
      }
    }

    // 네크로맨서는 체력 절반을 처음 넘길 때 해골을 추가 소환한다.
    const c = state.combat;
    if (enemy.id === 'necromancer' && enemy.currentHp > 0 && enemy.currentHp <= enemy.maxHp / 2 && !c.necroHalfSummoned) {
      c.necroHalfSummoned = true;
      const skeleton = cloneEnemy('skeleton', encounterScale('normal', c.participantIds.length), '-summon2');
      skeleton.summoned = true;
      c.enemies.push(skeleton);
      combatLogEntry('☠️ 네크로맨서가 해골 병사를 추가 소환했다!');
    }
    return damage;
  }

  function damageHero(hero, amount, sourceName = '몬스터', damageType = 'physical') {
    let damage = Math.max(0, amount);
    const hs = combatHeroState(hero.id);
    if (damageType === 'fire' && equipmentEffect(hero, 'fireReduction') > 0) {
      const reduced = Math.min(damage, equipmentEffect(hero, 'fireReduction'));
      damage -= reduced;
      if (reduced > 0) combatLogEntry(`🐲 용비늘 갑옷 · 화염 피해 ${reduced} 감소.`);
    }
    if (damage > 0 && hs && !hs.guardianCharmUsed && equipmentEffect(hero, 'firstDamageReduction') > 0) {
      const reduced = Math.min(damage, equipmentEffect(hero, 'firstDamageReduction'));
      damage -= reduced;
      hs.guardianCharmUsed = true;
      combatLogEntry(`🧿 수호의 부적 · 첫 피해 ${reduced} 감소.`);
    }
    const nextHp = hero.currentHp - damage;
    if (nextHp <= 0) {
      const inv = heroInventory(hero);
      const featherIndex = inv.indexOf('phoenix_feather');
      if (featherIndex >= 0) {
        inv.splice(featherIndex, 1);
        hero.currentHp = Math.min(hero.hp, 6);
        combatLogEntry(`🪶 불사조의 깃털 발동! ${hero.name}이 HP ${hero.currentHp}로 즉시 부활.`);
        log(`🪶 ${hero.icon} <strong>${hero.name}</strong> · 불사조의 깃털로 전투 중 부활.`);
        fxAtElement(heroActorElement(hero.id), `HP ${hero.currentHp}`, 'good');
        return damage;
      }
    }
    hero.currentHp = Math.max(0, nextHp);
    if (hero.currentHp <= 0) knockOutHero(hero, sourceName);
    return damage;
  }

  function knockOutHero(hero, sourceName) {
    if (hero.down) return;
    // V0.4.9: 쓰러진 순간의 지역을 기억한다. 다음 라운드에는 그 지역 중앙 마을에서 부활한다.
    const deathAreaId = getNodeAreaId(hero.position);
    hero.down = true;
    hero.currentHp = 0;
    removeHeroFromParty(hero);
    hero.reviveAreaId = deathAreaId;
    hero.position = getAreaCenterNodeId(deathAreaId);
    hero.acted = true;
    hero.reviveRound = state.round + 1;
    state.threat = Math.min(12, state.threat + 1);
    combatLogEntry(`💀 <strong>${hero.name}</strong> 쓰러짐 → ${deathAreaId} 지역 마을 귀환 / THREAT +1`);
    log(`💀 ${hero.icon} <strong>${hero.name}</strong> 쓰러짐 (${sourceName}) → ${deathAreaId} 지역 마을 귀환 / 🔥 THREAT +1`);
    checkDragonCastleSpawn('threat');
  }

  function resolveHeroHit(hero, enemy, roll, attackBonus, damageSpec, options = {}) {
    const hs = combatHeroState(hero.id);
    const firstAttack = (hs?.attackAttempts || 0) === 0;
    const firstAttackBonus = firstAttack ? equipmentEffect(hero, 'firstAttackBonus') : 0;
    const focusBonus = Number(hero.nextAttackBonus || 0);
    const naturalCrit = hero.id === 'archer' ? roll >= 19 : roll === 20;
    const autoMiss = roll === 1;
    const autoHit = roll === 20;
    let hitPenalty = hero.attackPenalty || 0;

    if (enemy.id === 'wyvern' && state.combat.round % 2 === 0 && (hero.id === 'knight' || hero.id === 'rogue')) hitPenalty += 3;

    const dynamicHitBonus = (options.hitBonus || 0) + firstAttackBonus + focusBonus;
    const total = roll + attackBonus - hitPenalty + dynamicHitBonus;
    const hit = !autoMiss && (autoHit || total >= enemy.ac);
    hero.attackPenalty = 0;
    hero.nextAttackBonus = 0;
    if (hs) hs.attackAttempts = (hs.attackAttempts || 0) + 1;

    if (!hit) {
      combatLogEntry(`❌ ${hero.name} 공격 실패 · D20 ${roll} + 보정 ${attackBonus + dynamicHitBonus - hitPenalty} = ${total} / AC ${enemy.ac}`);
      if (roll === 1 && enemy.id === 'darkKnight') {
        const counter = rollDice(1, 6).total;
        damageHero(hero, counter, '흑기사 반격');
        combatLogEntry(`⚔️ 흑기사 반격! ${hero.name}에게 ${counter} 피해.`);
      }
      return { hit:false, damage:0, crit:false };
    }

    const diceCount = damageSpec.count * (naturalCrit && !options.noCrit ? 2 : 1);
    const rolledDamage = rollDice(diceCount, damageSpec.sides);
    let bonusDamage = options.flatBonus || 0;
    const weapon = equippedItem(hero, 'weapon');
    if (enemyHasTag(enemy, 'undead')) bonusDamage += Number(weapon?.effects?.undeadDamage || 0);
    if (enemyHasTag(enemy, 'demon')) bonusDamage += Number(weapon?.effects?.demonDamage || 0);
    if (weapon?.effects?.eliteBossDamage) bonusDamage += enemy.tier === 'normal' ? Number(weapon.effects.normalDamage || 0) : Number(weapon.effects.eliteBossDamage || 0);

    if (hs && !hs.firstSuccessfulHit) {
      if (weapon?.effects?.firstHitDamage) bonusDamage += Number(weapon.effects.firstHitDamage);
      if (weapon?.effects?.firstHitDie) {
        const extra = rollDice(1, Number(weapon.effects.firstHitDie)).total;
        bonusDamage += extra;
        combatLogEntry(`🗡️ ${weapon.name} 추가 피해 D${weapon.effects.firstHitDie} = ${extra}`);
      }
      hs.firstSuccessfulHit = true;
    }

    const damageType = weapon?.effects?.fireWeapon ? 'fire' : (damageSpec.type || 'physical');
    const rawDamage = rolledDamage.total + damageSpec.bonus + bonusDamage;
    const damage = applyDamageToEnemy(enemy, rawDamage, damageType, hero);
    combatLogEntry(`${naturalCrit && !options.noCrit ? '💥 CRITICAL! ' : '⚔️ '}${hero.name} → ${enemy.name} <strong>${damage} 피해</strong>${bonusDamage ? ` (장비 보너스 +${bonusDamage})` : ''}`);
    return { hit:true, damage, crit:naturalCrit && !options.noCrit };
  }

  async function maybeRerollNaturalOne(hero, roll, label) {
    const hs = combatHeroState(hero?.id);
    if (roll !== 1 || !hero || !hs || hs.fateCoinUsed || equipmentEffect(hero, 'rerollNaturalOne') <= 0) return roll;
    hs.fateCoinUsed = true;
    combatLogEntry(`🪙 운명의 동전 발동! ${hero.name}의 Natural 1을 다시 굴린다.`);
    const reroll = Math.floor(Math.random() * 20) + 1;
    await animateCombatD20(reroll, `${hero.icon} 운명의 동전 재굴림`);
    await sleep(120);
    return reroll;
  }

  async function heroBasicAttack() {
    const c = state.combat;
    const hero = getCombatHero();
    const enemy = selectedCombatEnemy();
    if (!c || !hero || !enemy || c.busy) return;
    const hs = combatHeroState(hero.id);
    if (hs?.acted) return;

    c.busy = true;
    renderCombat();
    setCombatMessage(`${hero.name} 공격 판정!`, '');
    let roll = Math.floor(Math.random() * 20) + 1;
    await animateCombatD20(roll, `${hero.icon} ${hero.name} 공격`);
    roll = await maybeRerollNaturalOne(hero, roll, `${hero.icon} ${hero.name} 공격`);
    // 주사위 결과를 먼저 확실히 보여준 뒤, 실제 공격 애니메이션을 재생한다.
    await sleep(150);
    await animateActorWindup(heroActorElement(hero.id));
    const damageSpec = heroBasicDamage(hero);
    const result = resolveHeroHit(hero, enemy, roll, heroMainStat(hero) + equipmentStat(hero, 'attack'), damageSpec);
    setCombatMessage(result.hit ? `${enemy.name}에게 ${result.damage} 피해!` : 'MISS!', result.hit ? 'good' : 'danger');
    await animateHeroResult(hero, enemy, result, damageSpec.melee ? 'melee' : hero.id === 'mage' ? 'magic' : 'ranged');

    if (hero.id === 'knight' || hero.id === 'rogue') {
      if (enemy.id === 'slime' && result.hit && enemy.currentHp > 0) {
        damageHero(hero, 1, '슬라임 산성 몸체');
        combatLogEntry(`🟢 산성 몸체! ${hero.name}에게 1 피해.`);
        fxAtElement(heroActorElement(hero.id), '-1', 'damage');
      }
    }

    hs.acted = true;
    hero.acPenalty = 0;
    c.heroActionsThisRound += 1;
    c.busy = false;
    await afterHeroAction();
  }

  async function heroSkillAction() {
    const c = state.combat;
    const hero = getCombatHero();
    const enemy = selectedCombatEnemy();
    if (!c || !hero || !enemy || c.busy || !canUseCombatSkill(hero)) return;
    const hs = combatHeroState(hero.id);
    c.busy = true;
    renderCombat();
    setCombatMessage(`${hero.name} · ${skillName(hero)}!`, '');

    if (hero.id === 'mage') {
      // 마력 폭발은 명중 판정이 없으므로 주문 시전 동작부터 보여준다.
      await animateActorWindup(heroActorElement(hero.id));
      hero.currentMana -= 2;
      hs.skillUsedBattle = true;
      const spell = rollDice(3, 6);
      const damage = applyDamageToEnemy(enemy, spell.total + hero.magic + equipmentStat(hero, 'damage'), 'magic', hero);
      combatD20Value.textContent = '✨';
      combatDiceLabel.textContent = '마력 폭발';
      combatLogEntry(`✨ ${hero.name} 마력 폭발 → ${enemy.name} <strong>${damage} 피해</strong> / MANA -2`);
      setCombatMessage(`${enemy.name}에게 ${damage} 마법 피해!`, 'good');
      await animateMagicBurst(hero, enemy, damage);
    } else {
      let roll = Math.floor(Math.random() * 20) + 1;
      await animateCombatD20(roll, `${hero.icon} ${skillName(hero)}`);
      roll = await maybeRerollNaturalOne(hero, roll, `${hero.icon} ${skillName(hero)}`);
      // 스킬도 D20 결과가 멈춘 다음 캐릭터가 공격한다.
      await sleep(150);
      await animateActorWindup(heroActorElement(hero.id));
      let result = null;
      let mode = 'melee';
      if (hero.id === 'knight') {
        result = resolveHeroHit(hero, enemy, roll, hero.str + equipmentStat(hero, 'attack'), {count:1,sides:6,bonus:hero.str + equipmentStat(hero, 'damage'),type:'physical',melee:true});
        if (result.hit && enemy.currentHp > 0) enemy.nextAttackPenalty = 2;
        hs.skillUsedBattle = true;
      } else if (hero.id === 'archer') {
        result = resolveHeroHit(hero, enemy, roll, hero.dex + equipmentStat(hero, 'attack'), {count:2,sides:8,bonus:hero.dex + equipmentStat(hero, 'damage'),type:'physical',melee:false}, {hitBonus:2,noCrit:true});
        mode = 'ranged';
        hs.skillUsedBattle = true;
      } else if (hero.id === 'rogue') {
        const sneak = rollDice(1, 6).total;
        result = resolveHeroHit(hero, enemy, roll, hero.dex + equipmentStat(hero, 'attack'), {count:1,sides:6,bonus:hero.dex + sneak + equipmentStat(hero, 'damage'),type:'physical',melee:true});
        hs.skillUsedRound = true;
      }
      if (result) {
        setCombatMessage(result.hit ? `${skillName(hero)} · ${result.damage} 피해!` : `${skillName(hero)} MISS!`, result.hit ? 'good' : 'danger');
        await animateHeroResult(hero, enemy, result, mode);
      }
    }

    hs.acted = true;
    hero.acPenalty = 0;
    c.heroActionsThisRound += 1;
    c.busy = false;
    await afterHeroAction();
  }

  async function heroDefendAction() {
    const c = state.combat;
    const hero = getCombatHero();
    if (!c || !hero || c.busy) return;
    const hs = combatHeroState(hero.id);
    if (!hs || hs.acted) return;
    c.busy = true;
    renderCombat();
    hs.defending = true;
    combatLogEntry(`🛡 ${hero.name} 방어 태세 → 이번 몬스터 공격까지 AC +3`);
    setCombatMessage(`${hero.name} 방어! AC +3`, 'good');
    await animateDefend(hero);
    hs.acted = true;
    hero.acPenalty = 0;
    c.heroActionsThisRound += 1;
    c.busy = false;
    await afterHeroAction();
  }

  function openCombatItems() {
    const c = state.combat;
    const hero = getCombatHero();
    const hs = hero ? combatHeroState(hero.id) : null;
    if (!c || !hero || !hs || c.busy || hs.acted || hs.itemUsed) return;
    const items = heroInventory(hero).map((id,index) => ({ item:getItemCard?.(id), index })).filter(x => x.item?.type === 'consumable' && x.item.effect !== 'autoRevive');
    if (!items.length) return;
    modal.classList.remove('hero-status-modal','party-manage-modal','item-transfer-modal');
    modalContent.innerHTML = `<div class="combat-item-sheet"><div class="status-kicker">COMBAT ITEM</div><h3>🎒 ${hero.name}의 아이템</h3><p>이번 전투 라운드에는 소비 아이템을 1개만 사용할 수 있어. 아이템 사용 후에도 공격/스킬/방어가 가능해.</p><div class="combat-item-grid">${items.map(({item,index}) => `<button type="button" class="transfer-item-row" data-combat-item="${index}"><span>${item.icon}</span><strong>${item.name}</strong><small>${item.desc}</small></button>`).join('')}</div></div>`;
    modalCloseBtn.textContent = '취소';
    modalContent.querySelectorAll('[data-combat-item]').forEach(btn => btn.addEventListener('click', async () => {
      const index = Number(btn.dataset.combatItem);
      const itemId = heroInventory(hero)[index];
      const item = getItemCard?.(itemId);
      if (!item || item.type !== 'consumable' || hs.itemUsed) return;
      const enemy = selectedCombatEnemy();
      if ((item.effect === 'fireBomb' || item.effect === 'bomb') && !enemy) return;
      if (item.effect === 'mana' && hero.currentMana === null) {
        showModal('🔵 마나 물약', `${hero.name}은(는) MANA를 사용하지 않아.`);
        return;
      }
      if (item.effect === 'escape' && c.isBoss) {
        showModal('💨 연막탄', '보스전에서는 연막탄으로 도주할 수 없어.');
        return;
      }
      heroInventory(hero).splice(index, 1);
      hs.itemUsed = true;
      closeModalPanel();

      if (item.effect === 'heal') {
        const before = hero.currentHp; hero.currentHp = Math.min(hero.hp, hero.currentHp + item.value);
        combatLogEntry(`${item.icon} ${item.name} · ${hero.name} HP +${hero.currentHp-before}`);
        fxAtElement(heroActorElement(hero.id), `+${hero.currentHp-before}`, 'good');
      } else if (item.effect === 'mana') {
        const before = hero.currentMana; hero.currentMana = Math.min(maxMana(hero), hero.currentMana + item.value);
        combatLogEntry(`🔵 ${item.name} · ${hero.name} MANA +${hero.currentMana-before}`);
      } else if (item.effect === 'focus') {
        hero.nextAttackBonus = Math.max(hero.nextAttackBonus || 0, Number(item.value || 3));
        combatLogEntry(`🎯 집중의 비약 · ${hero.name}의 다음 공격 명중 +${hero.nextAttackBonus}`);
      } else if (item.effect === 'fireBomb') {
        const rolled = rollDice(1,6).total + 2;
        const damage = applyDamageToEnemy(enemy, rolled, 'fire', hero);
        combatLogEntry(`🔥 화염병 → ${enemy.name} <strong>${damage} 피해</strong>`);
        await animateProjectile(heroActorElement(hero.id), enemyActorElement(enemy.uid), '🔥');
        fxAtElement(enemyActorElement(enemy.uid), `-${damage}`, 'damage');
      } else if (item.effect === 'bomb') {
        const rolled = rollDice(2,6).total;
        const damage = applyDamageToEnemy(enemy, rolled, 'physical', hero);
        combatLogEntry(`💣 폭탄 → ${enemy.name} <strong>${damage} 피해</strong>`);
        await animateProjectile(heroActorElement(hero.id), enemyActorElement(enemy.uid), '💣');
        fxAtElement(enemyActorElement(enemy.uid), `-${damage}`, 'damage');
      } else if (item.effect === 'escape') {
        combatLogEntry(`💨 연막탄! ${hero.name}이 전투에서 빠져나간다.`);
        await endCombat('escaped');
        return;
      }
      renderCombat();
      renderParty();
      if (!aliveCombatEnemies().length) await endCombat('victory');
    }));
    modal.classList.remove('hidden');
  }

  function chooseMonsterTarget(enemy) {
    let heroes = aliveCombatHeroes();
    if (!heroes.length) return null;
    const by = (fn, asc = true) => [...heroes].sort((a,b) => (fn(a)-fn(b)) * (asc ? 1 : -1))[0];

    if (enemy.ai === 'lowHp') return by(h => h.currentHp);
    if (enemy.ai === 'highHp') return by(h => h.currentHp, false);
    if (enemy.ai === 'lowAc') return by(h => effectiveHeroAc(h));
    if (enemy.ai === 'highStr') return by(h => h.str, false);
    if (enemy.ai === 'highMagic') return by(h => h.magic, false);
    if (enemy.ai === 'lowDex') return by(h => h.dex);
    return heroes[Math.floor(Math.random() * heroes.length)];
  }

  async function monsterAttack(enemy) {
    if (!state.combat || enemy.currentHp <= 0 || state.gameOver) return;
    const target = chooseMonsterTarget(enemy);
    if (!target) return;

    let attackBonus = enemy.attack;
    let damageBonus = enemy.damage.bonus;
    if (enemy.id === 'orc' && enemy.currentHp <= enemy.maxHp / 2) attackBonus += 1;
    if (enemy.id === 'demonKnight' && target.currentHp <= 15) attackBonus += 2;
    if (enemy.id === 'minotaur' && !enemy.chargeUsed) {
      attackBonus += 2;
      damageBonus += 2;
      enemy.chargeUsed = true;
    }
    attackBonus -= enemy.nextAttackPenalty || 0;
    enemy.nextAttackPenalty = 0;
    const targetState = combatHeroState(target.id);
    if (targetState && !targetState.rangerCloakUsed && equipmentEffect(target, 'firstEnemyAttackPenalty') > 0) {
      attackBonus -= equipmentEffect(target, 'firstEnemyAttackPenalty');
      targetState.rangerCloakUsed = true;
      combatLogEntry(`🏹 레인저의 망토 · ${target.name}을 향한 첫 적 공격 명중 -${equipmentEffect(target, 'firstEnemyAttackPenalty')}.`);
    }

    setCombatMessage(`${enemy.name} 공격 판정!`, 'danger');
    const roll = Math.floor(Math.random() * 20) + 1;
    await animateCombatD20(roll, `${enemy.icon} ${enemy.name} 공격`);
    // 몬스터도 주사위 결과가 먼저 확정되고 나서 공격 모션을 시작한다.
    await sleep(150);
    await animateActorWindup(enemyActorElement(enemy.uid));
    const ac = effectiveHeroAc(target);
    const total = roll + attackBonus;
    const hit = roll !== 1 && (roll === 20 || total >= ac);

    if (!hit) {
      combatLogEntry(`🛡 ${enemy.name} 공격 빗나감 · D20 ${roll} + ${attackBonus} = ${total} / ${target.name} AC ${ac}`);
      setCombatMessage(`${target.name} 회피!`, 'good');
      await animateMonsterResult(enemy, target, false, 0);
      return;
    }

    const dmgRoll = rollDice(enemy.damage.count, enemy.damage.sides);
    let damage = dmgRoll.total + damageBonus;
    if (enemy.id === 'trollKing' && enemy.currentHp <= 20) damage += 2;
    const dealt = damageHero(target, damage, enemy.name, enemy.damageType || (enemy.id === 'fireImp' ? 'fire' : 'physical'));
    combatLogEntry(`💢 ${enemy.name} → ${target.name} <strong>${dealt} 피해</strong>`);
    setCombatMessage(`${target.name} ${dealt} 피해!`, 'danger');
    await animateMonsterResult(enemy, target, true, dealt);

    if (enemy.id === 'spider' && !target.down) {
      target.attackPenalty = Math.max(target.attackPenalty || 0, 1);
      combatLogEntry(`🕷️ 독! ${target.name}의 다음 공격 판정 -1.`);
    }
    if (enemy.id === 'ogre' && roll >= 17 && !target.down) {
      target.acPenalty = Math.max(target.acPenalty || 0, 2);
      combatLogEntry(`🧌 내려찍기! ${target.name}의 다음 행동 전까지 AC -2.`);
    }
  }

  async function runBossInterleaveIfNeeded() {
    const c = state.combat;
    if (!c || !c.isBoss || c.participantIds.length < 4 || c.busy) return;
    if (c.heroActionsThisRound !== 2 && c.heroActionsThisRound !== 4) return;

    const boss = aliveCombatEnemies().find(e => e.tier === 'boss');
    if (!boss) return;
    c.busy = true;
    c.currentHeroId = null;
    setCombatMessage('보스가 끼어든다!', 'danger');
    renderCombat();
    await new Promise(r => setTimeout(r, 280));
    await monsterAttack(boss);
    c.bossActionsThisRound += 1;
    c.busy = false;
    renderCombat();
  }

  async function runMonsterPhase() {
    const c = state.combat;
    if (!c || c.busy || state.gameOver) return;
    c.busy = true;
    c.currentHeroId = null;
    setCombatMessage('MONSTER PHASE', 'danger');
    renderCombat();

    // 트롤 왕 재생.
    const troll = aliveCombatEnemies().find(e => e.id === 'trollKing');
    if (troll) {
      if (troll.fireBlockedRound === c.round) {
        combatLogEntry('🔥 트롤 왕 재생 실패 · 이번 라운드에 화염 피해를 받았다.');
      } else {
        const before = troll.currentHp;
        troll.currentHp = Math.min(troll.maxHp, troll.currentHp + 3);
        const healed = troll.currentHp - before;
        if (healed > 0) combatLogEntry(`👑 트롤 왕 재생 +${healed} HP`);
      }
    }

    const enemies = aliveCombatEnemies();
    for (const enemy of enemies) {
      if (!aliveCombatHeroes().length || state.gameOver) break;

      // 4인 보스전의 메인 보스는 영웅 2명 행동마다 이미 공격한다.
      if (c.isBoss && c.participantIds.length >= 4 && enemy.tier === 'boss') continue;

      let actions = 1;
      if (c.participantIds.length >= 4 && enemy.tier === 'elite' && enemies.length === 1) actions = 2;
      for (let i = 0; i < actions; i += 1) {
        if (!aliveCombatHeroes().length || state.gameOver || enemy.currentHp <= 0) break;
        await new Promise(r => setTimeout(r, 220));
        await monsterAttack(enemy);
        renderCombat();
      }
    }

    c.busy = false;
    if (state.gameOver) {
      await endCombat('defeat');
      return;
    }
    if (!aliveCombatHeroes().length) {
      await endCombat('defeat');
      return;
    }
    beginNextCombatRound();
  }

  function beginNextCombatRound() {
    const c = state.combat;
    if (!c) return;
    c.round += 1;
    c.heroActionsThisRound = 0;
    c.bossActionsThisRound = 0;
    c.participantIds.forEach(id => {
      const hs = combatHeroState(id);
      const hero = state.heroes.find(h => h.id === id);
      if (!hs || !hero || hero.down) return;
      hs.acted = false;
      hs.defending = false;
      hs.skillUsedRound = false;
      hs.itemUsed = false;
    });
    const next = c.participantIds
      .map(id => state.heroes.find(h => h.id === id))
      .find(h => h && !h.down);
    c.currentHeroId = next?.id || null;
    setCombatMessage(`COMBAT ROUND ${c.round}`, '');
    renderCombat();
  }

  async function afterHeroAction() {
    const c = state.combat;
    if (!c) return;

    renderCombat();
    if (!aliveCombatEnemies().length) {
      await endCombat('victory');
      return;
    }
    if (!aliveCombatHeroes().length || state.gameOver) {
      await endCombat('defeat');
      return;
    }

    await runBossInterleaveIfNeeded();
    if (!state.combat) return;
    if (!aliveCombatHeroes().length || state.gameOver) {
      await endCombat('defeat');
      return;
    }
    if (!aliveCombatEnemies().length) {
      await endCombat('victory');
      return;
    }

    const ready = c.participantIds
      .map(id => state.heroes.find(h => h.id === id))
      .find(h => h && !h.down && !combatHeroState(h.id)?.acted);

    if (ready) {
      c.currentHeroId = ready.id;
      renderCombat();
      return;
    }
    await runMonsterPhase();
  }

  function lootTierForCombat(c) {
    if (c?.isBoss) return 'boss';
    if (c?.enemies?.some(enemy => enemy.tier === 'elite' && !enemy.summoned)) return 'elite';
    return 'normal';
  }

  function itemSlotLabel(slot) {
    return slot === 'weapon' ? '무기' : slot === 'armor' ? '방어구' : slot === 'accessory' ? '장신구' : '';
  }

  function itemStatsText(item) {
    const stats = item?.stats || {};
    const parts = [];
    if (stats.attack) parts.push(`명중 +${stats.attack}`);
    if (stats.damage) parts.push(`피해 +${stats.damage}`);
    if (stats.ac) parts.push(`AC +${stats.ac}`);
    if (item?.equip?.length && item.equip.length < 4) parts.push(`장착: ${item.equip.map(id => HEROES.find(h=>h.id===id)?.name || id).join('/')}`);
    return parts.join(' · ');
  }

  function stashLoot(hero, item) {
    if (!hero || !item || !bagHasSpace(hero)) return false;
    heroInventory(hero).push(item.id);
    log(`🎒 ${hero.icon} <strong>${hero.name}</strong> · ${item.name} 보관 (${heroInventory(hero).length}/${BAG_LIMIT}).`);
    return true;
  }

  function equipLoot(hero, item, { discardOldIfNeeded = false } = {}) {
    if (!hero || !item || !canHeroEquip(hero, item)) return false;
    const slot = item.slot;
    const oldId = hero.equipment?.[slot];
    if (!hero.equipment) hero.equipment = { armor:null, weapon:null, accessory:null };
    if (oldId) {
      if (bagHasSpace(hero)) {
        heroInventory(hero).push(oldId);
        const old = getItemCard(oldId);
        if (old) log(`🎒 ${hero.name}의 <strong>${old.name}</strong> → 가방으로 이동.`);
      } else if (discardOldIfNeeded) {
        const old = getItemCard(oldId);
        log(`🗑️ 가방이 가득 차 ${hero.name}의 <strong>${old?.name || '기존 장비'}</strong>를 버렸다.`);
      } else return false;
    }
    hero.equipment[slot] = item.id;
    if (hero.currentMana !== null) hero.currentMana = Math.min(hero.currentMana, maxMana(hero));
    log(`✨ ${hero.icon} <strong>${hero.name}</strong> · ${item.name} 장착!`);
    return true;
  }

  function acquireSimpleLoot(owner, item) {
    if (item.type === 'gold') {
      state.gold += Number(item.value || 0);
      log(`💰 <strong>${item.value} 골드</strong> 획득!`);
      return true;
    }
    if (item.type === 'consumable') return stashLoot(owner, item);
    return false;
  }

  function hasLuckyRing(hero) {
    return hasEquipped(hero, 'lucky_ring');
  }

  function renderBagReplacementChoices(owner, newItem, finish) {
    const inv = heroInventory(owner);
    if (!inv.length || !lootActions) return;
    const title = document.createElement('div');
    title.className = 'loot-replace-title';
    title.textContent = '가방이 가득 참 · 버릴 아이템 선택';
    lootActions.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'loot-replace-grid';
    inv.forEach((oldId,index) => {
      const old = getItemCard?.(oldId);
      if (!old) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'loot-replace-card';
      btn.innerHTML = `<span>${old.icon||'🎒'}</span><strong>${old.name}</strong><small>이 아이템을 버리고 ${newItem.name} 보관</small>`;
      btn.addEventListener('click', () => {
        const removed = heroInventory(owner).splice(index,1)[0];
        heroInventory(owner).push(newItem.id);
        log(`🗑️ ${owner.name}이 ${getItemCard?.(removed)?.name || '기존 아이템'}을 버리고 <strong>${newItem.name}</strong> 보관.`);
        finish(newItem);
      }, {once:true});
      grid.appendChild(btn);
    });
    lootActions.appendChild(grid);
  }

  function showLootReward({ owner, draw, title = '전리품 상자', guide = '카드를 터치해서 열기' }) {
    return new Promise(resolve => {
      if (!lootOverlay || !lootCard || !draw || !owner) { resolve(null); return; }
      const choiceCount = hasLuckyRing(owner) ? 2 : 1;
      const choices = Array.from({length:choiceCount}, () => draw());
      let revealed = false;
      let finished = false;
      lootOverlay.classList.remove('hidden');
      lootCard.classList.add('face-down');
      lootCard.classList.remove('revealed','rare','legendary','danger');
      lootCard.disabled = false;
      lootCardIcon.textContent='📦'; lootCardName.textContent='?'; lootCardDesc.textContent='카드를 터치해서 열기';
      lootGuide.textContent = hasLuckyRing(owner) ? `💍 행운의 반지 · ${owner.name}이 카드 2장 중 1장을 선택한다.` : `${guide} · ${owner.name} 소유`;
      lootActions.innerHTML='';
      const finish = item => { if (finished) return; finished=true; lootOverlay.classList.add('hidden'); renderAll(); resolve(item || null); };
      const makeButton=(text,cls,handler)=>{const btn=document.createElement('button');btn.type='button';btn.className=`pixel-btn ${cls||''}`.trim();btn.textContent=text;btn.addEventListener('click',handler,{once:true});lootActions.appendChild(btn);return btn;};

      const presentItem = item => {
        lootCard.classList.remove('face-down'); lootCard.classList.add('revealed');
        if (item.rarity === 'rare') lootCard.classList.add('rare');
        if (item.rarity === 'legendary') lootCard.classList.add('legendary');
        lootCardIcon.textContent=item.icon||'🎁'; lootCardName.textContent=item.name;
        const stats=itemStatsText(item); lootCardDesc.textContent=`${item.desc}${stats ? ` · ${stats}` : ''}`;
        lootActions.innerHTML='';
        if (item.type === 'equipment') {
          const canEquip = canHeroEquip(owner,item);
          const oldId = owner.equipment?.[item.slot];
          const directNeedsDiscard = Boolean(oldId && !bagHasSpace(owner));
          lootGuide.textContent = `${owner.icon} ${owner.name} 소유 · ${itemSlotLabel(item.slot)}${canEquip ? '' : ' · 현재 직업은 장착 불가'}.`;
          if (canEquip) makeButton(directNeedsDiscard ? '기존 장비 버리고 장착' : `${owner.name} 바로 장착`, 'primary', () => { equipLoot(owner,item,{discardOldIfNeeded:directNeedsDiscard}); finish(item); });
          if (bagHasSpace(owner)) makeButton(`🎒 가방에 보관 (${heroInventory(owner).length+1}/${BAG_LIMIT})`, '', () => { stashLoot(owner,item); finish(item); });
          else renderBagReplacementChoices(owner, item, finish);
          makeButton('아이템 포기', 'danger', () => { log(`🗑️ ${owner.name}이 ${item.name}을 포기했다.`); finish(null); });
          return;
        }
        if (item.type === 'gold') {
          lootGuide.textContent=`${item.value} 골드를 발견했다.`;
          makeButton(`💰 ${item.value} 골드 획득`,'primary',()=>{acquireSimpleLoot(owner,item);finish(item);}); return;
        }
        if (item.type === 'consumable') {
          lootGuide.textContent=`${owner.icon} ${owner.name}의 개인 가방에 들어간다.`;
          if (bagHasSpace(owner)) makeButton(`🎒 가방에 넣기 (${heroInventory(owner).length+1}/${BAG_LIMIT})`,'primary',()=>{stashLoot(owner,item);finish(item);});
          else renderBagReplacementChoices(owner, item, finish);
          makeButton('아이템 포기','danger',()=>{log(`🗑️ ${owner.name}이 ${item.name}을 포기했다.`);finish(null);}); return;
        }
        lootGuide.textContent='이번 상자는 비어 있었다.'; makeButton('계속','primary',()=>finish(item));
      };

      const reveal = () => {
        if (revealed) return; revealed=true; lootCard.disabled=true;
        if (choices.length === 1) { presentItem(choices[0]); return; }
        lootCard.classList.remove('face-down'); lootCard.classList.add('revealed');
        lootCardIcon.textContent='💍'; lootCardName.textContent='행운의 선택'; lootCardDesc.textContent='아래 카드 2장 중 하나를 골라.';
        lootActions.innerHTML='<div class="loot-choice-title">2장 중 1장 선택</div>';
        const grid=document.createElement('div'); grid.className='loot-choice-grid';
        choices.forEach((item,index)=>{const btn=document.createElement('button');btn.type='button';btn.className=`loot-choice-card ${item.rarity||''}`;btn.innerHTML=`<span>${item.icon||'🎁'}</span><strong>${item.name}</strong><small>${item.desc}</small>`;btn.addEventListener('click',()=>presentItem(item),{once:true});grid.appendChild(btn);});
        lootActions.appendChild(grid);
      };
      lootCard.addEventListener('click',reveal,{once:true});
    });
  }

  function showCombatLoot(c) {
    if (!window.drawCombatLoot) return Promise.resolve(null);
    const tier = lootTierForCombat(c);
    const owner = state.heroes.find(h => h.id === c.lootOwnerId) || state.heroes.find(h => h.id === c.initiatorHeroId) || state.heroes.find(h => h.id === c.participantIds[0]);
    const guide = tier === 'boss' ? '보스 전리품 · 장비 1개 확정' : tier === 'elite' ? '정예 전리품 · 장비 확률 상승' : '전투 전리품';
    return showLootReward({ owner, draw:() => drawCombatLoot(tier), title:'전리품', guide });
  }

  function showTreasureLoot(hero) {
    if (!window.drawTreasureLoot) return Promise.resolve(null);
    return showLootReward({ owner:hero, draw:() => drawTreasureLoot(), title:'보물', guide:'보물 상자' });
  }

  function finishCombatTurns(participantIds) {
    participantIds.forEach(id => {
      const hero = state.heroes.find(h => h.id === id);
      if (hero) hero.acted = true;
    });
    state.rolled = null;
    clearDiceDisplay();

    if (state.gameOver) {
      renderAll();
      return;
    }

    const next = getNextReadyHero();
    if (next) {
      state.activeHeroId = next.id;
      // 전투가 끝나는 순간 다음 영웅의 지역으로 즉시 카메라를 넘긴다.
      // rollD6()에서 뒤늦게 이동시키면 "주사위를 굴려야 맵이 바뀌는" 것처럼 보인다.
      state.viewAreaId = getNodeAreaId(next.position);
    } else {
      endRound();
    }
    renderAll();
  }

  async function endCombat(result) {
    const c = state.combat;
    if (!c || c.ending) return;
    c.ending = true;
    c.busy = true;
    // 전투 중 열린 소비 아이템/안내 모달이 월드까지 남지 않도록 즉시 정리한다.
    closeModalPanel();

    if (result === 'victory') {
      setCombatMessage('VICTORY!', 'good');
      combatLogEntry('🏆 전투 승리!');
      log(`🏆 ${c.node.icon} <strong>${c.node.name}</strong> 전투 승리.`);

      // 마법사는 전투 종료 시 MANA 1 회복.
      c.participantIds.forEach(id => {
        const hero = state.heroes.find(h => h.id === id);
        if (hero?.id === 'mage' && !hero.down) hero.currentMana = Math.min(maxMana(hero), (hero.currentMana ?? 0) + 1 + equipmentEffect(hero, 'endBattleManaBonus'));
      });

      if (c.isBoss && !state.defeatedBosses.has(c.node.id)) {
        state.defeatedBosses.add(c.node.id);
        if (state.seals < 3) {
          state.seals += 1;
          combatLogEntry(`🗿 용의 봉인석 획득! ${state.seals}/3`);
          log(`🗿 지역 보스 처치 → <strong>봉인석 ${state.seals}/3</strong>`);
          checkDragonCastleSpawn('seal');
        }
      }
    } else if (result === 'escaped') {
      setCombatMessage('ESCAPED!', 'good');
      combatLogEntry('💨 전투에서 도주했다. 전리품은 없다.');
      c.participantIds.forEach(id => {
        const hero = state.heroes.find(h => h.id === id);
        if (hero && !hero.down) hero.position = c.originNodeId;
      });
      log(`💨 ${c.node.name} 전투에서 도주 → 이전 칸으로 후퇴.`);
    } else {
      setCombatMessage(state.gameOver ? 'KINGDOM FALLS' : 'DEFEAT', 'danger');
      combatLogEntry('☠️ 전투 패배. 쓰러진 영웅은 해당 지역의 중앙 마을로 귀환한다.');
      log('☠️ 전투 패배. 살아남지 못한 영웅은 다음 라운드에 쓰러졌던 지역의 중앙 마을에서 부활한다.');
    }

    renderCombat();
    await new Promise(r => setTimeout(r, result === 'victory' ? 620 : 650));
    if (result === 'victory' && !state.gameOver) {
      await showCombatLoot(c);
    }
    closeModalPanel();
    const ids = [...c.participantIds];
    const resolver = c.resolve;
    combatOverlay.classList.add('hidden');
    state.combat = null;
    finishCombatTurns(ids);
    flushDragonCastleNotice();
    resolver?.(result);
  }

  function startCombat(hero, node, originNodeId) {
    return new Promise(resolve => {
      if (state.combat) {
        resolve('busy');
        return;
      }

      // V0.4.8: 파티 기능 잠금. 같은 칸에 다른 영웅이 있어도 전투는 현재 영웅 SOLO로 진행한다.
      // 파티 코드는 이후 다시 켤 수 있도록 유지하지만 PARTY_SYSTEM_ENABLED=false에서는 참가하지 않는다.
      const party = getHeroParty(hero);
      const participants = party
        ? getPartyMembers(party, { aliveOnly:true }).filter(h => h.position === node.id)
        : [hero].filter(h => !h.down && h.currentHp > 0);
      if (!participants.some(h => h.id === hero.id) && !hero.down && hero.currentHp > 0) participants.unshift(hero);

      const enemies = chooseEncounter(node, participants.length);
      const isBoss = node.type === '보스';
      const heroStates = {};
      participants.forEach(h => {
        heroStates[h.id] = { acted:false, defending:false, skillUsedBattle:false, skillUsedRound:false, itemUsed:false, attackAttempts:0, firstSuccessfulHit:false, fateCoinUsed:false, guardianCharmUsed:false, rangerCloakUsed:false };
        h.nextAttackBonus = 0;
      });

      state.combat = {
        node,
        nodeId: node.id,
        originNodeId,
        isBoss,
        participantIds: participants.map(h => h.id),
        initiatorHeroId: hero.id,
        lootOwnerId: hero.id,
        partyId: party?.id || null,
        heroStates,
        enemies,
        selectedEnemyId: enemies[0]?.uid || null,
        currentHeroId: hero.id,
        round: 1,
        busy: false,
        ending: false,
        heroActionsThisRound: 0,
        bossActionsThisRound: 0,
        necroHalfSummoned: false,
        resolve,
      };

      // 네크로맨서 전투는 해골 병사 1체와 함께 시작.
      if (enemies[0]?.id === 'necromancer') {
        const skeleton = cloneEnemy('skeleton', encounterScale('normal', participants.length), '-summon1');
        skeleton.summoned = true;
        state.combat.enemies.push(skeleton);
      }

      combatLog.innerHTML = '';
      combatLog.classList.remove('expanded');
      if (combatLogSummary) combatLogSummary.innerHTML = '';
      if (combatLogToggle) combatLogToggle.textContent = '전체 기록 보기 ▾';
      combatD20Value.textContent = '20';
      combatDiceLabel.textContent = 'D20';
      combatOverlay.classList.remove('hidden');
      combatLogEntry(`⚔️ <strong>${participants.map(h => h.name).join(', ')}</strong> 전투 참가`);
      combatLogEntry(`${enemies.map(e => `${e.icon} ${e.name}`).join(' + ')} 등장!`);
      setCombatMessage('영웅 페이즈 · 대상을 선택하고 행동해', '');
      renderCombat();
      renderHUD();
    });
  }

  async function moveActiveHero(nodeId) {
    if (state.isMoving || state.isRolling || state.gameOver || state.combat) return;
    const reachable = getReachableNodeIds();
    if (!reachable.has(nodeId)) return;
    const hero = getWorldUnitLeader(getActiveHero());
    if (!hero || hero.down) return;
    const unit = getWorldUnitMembers(hero);
    if (!unit.length || unit.some(h => h.acted || h.down)) return;
    const originNodeId = hero.position;
    const path = getShortestPath(hero.position, nodeId, state.rolled ?? 0);
    if (!path) return;
    const node = WORLD_NODES.find(n => n.id === nodeId);
    state.activeHeroId = hero.id;
    state.isMoving = true; renderControls();
    await Promise.all(unit.map((member,index) => animateHeroHop(member,path,index,unit.length)));
    unit.forEach(member => { member.position = nodeId; });
    state.isMoving = false;
    const party = getHeroParty(hero);
    if (party) log(`🤝 <strong>${partyDisplayName(party)}</strong> → ${node.icon} ${node.name} <span class="move-steps">(${path.length - 1}칸)</span>`);
    else log(`${hero.icon} <strong>${hero.name}</strong> → ${node.icon} ${node.name} <span class="move-steps">(${path.length - 1}칸)</span>`);
    // 이동 결과 주사위는 목적지 선택까지만 보여준다. 이동이 끝난 뒤에는
    // 사건/보상/상점 등의 모달보다 앞에 남지 않도록 즉시 정리한다.
    clearDiceDisplay();
    const turnHandled = await resolveNode(hero,node,originNodeId,unit);
    if (!turnHandled) finishWorldUnitTurn(hero);
  }


  function shuffleArray(values) {
    const arr = [...values];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function drawEventCard() {
    if (!Array.isArray(state.eventDeck) || !state.eventDeck.length) {
      const source = Array.isArray(window.EVENT_CARDS) ? window.EVENT_CARDS : [];
      state.eventDeck = shuffleArray(source.map(card => card.id));
      state.eventDiscard = [];
    }
    const id = state.eventDeck.shift();
    const card = (window.EVENT_CARDS || []).find(entry => entry.id === id) || null;
    if (card) state.eventDiscard.push(card.id);
    return card;
  }

  function heroEventStat(hero, stat) {
    const value = Number(hero?.[stat] || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function eventStatLabel(stat) {
    return ({ str:'⚔ 힘', dex:'🏹 민첩', magic:'✨ 마력', luck:'🍀 행운' })[stat] || stat;
  }

  function weightedEventOutcome(list) {
    const entries = Array.isArray(list) ? list : [];
    const total = entries.reduce((sum, e) => sum + Math.max(0, Number(e.weight || 0)), 0);
    if (!entries.length) return null;
    if (total <= 0) return entries[0];
    let roll = Math.random() * total;
    for (const entry of entries) {
      roll -= Math.max(0, Number(entry.weight || 0));
      if (roll <= 0) return entry;
    }
    return entries[entries.length - 1];
  }

  function rollEventD20(finalValue) {
    return new Promise(resolve => {
      const valueEl = modalContent.querySelector('[data-event-d20-value]');
      const dieEl = modalContent.querySelector('.event-d20');
      if (!valueEl || !dieEl) { resolve(); return; }
      dieEl.classList.add('rolling');
      let ticks = 0;
      const timer = setInterval(() => {
        ticks += 1;
        valueEl.textContent = String(Math.floor(Math.random() * 20) + 1);
        if (ticks >= 10) {
          clearInterval(timer);
          valueEl.textContent = String(finalValue);
          dieEl.classList.remove('rolling');
          dieEl.classList.add(finalValue === 1 ? 'bad' : finalValue === 20 ? 'good' : 'settled');
          setTimeout(resolve, 430);
        }
      }, 62);
    });
  }

  async function applyEventEffects(hero, effects, context = {}) {
    let turnHandled = false;
    for (const effect of (effects || [])) {
      if (!effect) continue;
      if (effect.type === 'heal') {
        const before = hero.currentHp;
        hero.currentHp = Math.min(hero.hp, hero.currentHp + Number(effect.value || 0));
        log(`❤️ ${hero.name} HP +${hero.currentHp - before}`);
      } else if (effect.type === 'mana') {
        if (hero.currentMana !== null) {
          const before = hero.currentMana;
          hero.currentMana = Math.min(maxMana(hero), hero.currentMana + Number(effect.value || 0));
          log(`🔵 ${hero.name} MANA +${hero.currentMana - before}`);
        }
      } else if (effect.type === 'damage') {
        const damage = Math.max(0, Number(effect.value || 0));
        hero.currentHp = Math.max(0, hero.currentHp - damage);
        log(`💥 ${hero.name} 사건 피해 ${damage}`);
        if (hero.currentHp <= 0) {
          const deathAreaId = getNodeAreaId(hero.position);
          hero.down = true;
          hero.reviveRound = state.round + 1;
          hero.reviveAreaId = deathAreaId;
          hero.position = getAreaCenterNodeId(deathAreaId);
          state.threat = Math.min(12, state.threat + 1);
          checkDragonCastleSpawn('threat');
          log(`💀 ${hero.name} 쓰러짐 → ${deathAreaId} 지역 마을 귀환 / THREAT +1`);
        }
      } else if (effect.type === 'gold') {
        const delta = Number(effect.value || 0);
        if (delta >= 0) {
          state.gold += delta;
          log(`💰 골드 +${delta}`);
        } else {
          const lost = Math.min(state.gold, Math.abs(delta));
          state.gold -= lost;
          log(`💸 골드 -${lost}`);
        }
      } else if (effect.type === 'threat') {
        const delta = Number(effect.value || 0);
        state.threat = Math.max(0, Math.min(12, state.threat + delta));
        log(`🔥 사건으로 THREAT ${delta >= 0 ? '+' : ''}${delta} → ${state.threat}/12`);
        checkDragonCastleSpawn('threat');
      } else if (effect.type === 'loot') {
        closeModalPanel();
        await showTreasureLoot(hero);
      } else if (effect.type === 'combat') {
        closeModalPanel();
        const monster = window.MONSTERS?.[effect.monsterId];
        const eventNode = {
          id:`event-${effect.monsterId}-${Date.now()}`,
          type:'전투', icon:monster?.icon || '👹', name:`사건 전투 · ${monster?.name || '마물'}`,
          region: context.node?.region || 'road', areaId:getNodeAreaId(hero.position), eventMonsterId:effect.monsterId
        };
        const originalChoose = chooseEncounter;
        // startCombat 내부 encounter 선택을 우회할 수 있도록 임시 monster id를 node에 싣는다.
        eventNode.monsterId = effect.monsterId;
        await startCombat(hero, eventNode, context.originNodeId || hero.position);
        turnHandled = true;
      }
    }
    renderAll();
    return turnHandled;
  }

  async function resolveEventCard(hero, node, originNodeId) {
    const card = drawEventCard();
    if (!card) {
      showModal('❓ 사건', '이벤트 카드를 불러오지 못했다.');
      return false;
    }

    return new Promise(resolve => {
      let settled = false;
      const finish = async (effects = [], extraText = '') => {
        if (settled) return;
        settled = true;
        if (extraText) log(`${card.icon} <strong>${card.name}</strong> · ${extraText}`);

        const before = {
          hp: hero.currentHp,
          mana: hero.currentMana,
          gold: state.gold,
          threat: state.threat
        };
        const hasLoot = (effects || []).some(effect => effect?.type === 'loot');
        const hasCombat = (effects || []).some(effect => effect?.type === 'combat');
        const handled = await applyEventEffects(hero, effects, { node, originNodeId });

        // 전투/전리품은 각 전용 화면이 결과를 보여주므로 중복 결과창을 띄우지 않는다.
        if (handled || hasCombat || hasLoot) {
          closeModalPanel();
          resolve(handled);
          return;
        }

        const resultLines = [];
        if (hero.currentHp !== before.hp) {
          const diff = hero.currentHp - before.hp;
          resultLines.push(`${diff >= 0 ? '❤️' : '💥'} HP ${diff >= 0 ? '+' : ''}${diff}`);
        }
        if (hero.currentMana !== before.mana && hero.currentMana !== null && before.mana !== null) {
          const diff = hero.currentMana - before.mana;
          resultLines.push(`🔵 MANA ${diff >= 0 ? '+' : ''}${diff}`);
        }
        if (state.gold !== before.gold) {
          const diff = state.gold - before.gold;
          resultLines.push(`💰 골드 ${diff >= 0 ? '+' : ''}${diff}`);
        }
        if (state.threat !== before.threat) {
          const diff = state.threat - before.threat;
          resultLines.push(`🔥 THREAT ${diff >= 0 ? '+' : ''}${diff}`);
        }
        if (!resultLines.length) resultLines.push('변화 없음');

        modal.classList.remove('hidden');
        modalCloseBtn.hidden = true;
        modalContent.innerHTML = `<div class="event-sheet event-result-sheet">
          <div class="status-kicker">EVENT RESULT</div>
          <div class="event-card-head"><span class="event-card-icon">${card.icon}</span><div><h3>${card.name}</h3><p>${extraText || '사건이 끝났다.'}</p></div></div>
          <div class="event-resolution-box">${resultLines.map(line => `<div>${line}</div>`).join('')}</div>
          <button type="button" class="pixel-btn primary event-main-btn" data-event-result-close>계속</button>
        </div>`;
        modalContent.querySelector('[data-event-result-close]').addEventListener('click', () => {
          closeModalPanel();
          resolve(false);
        }, { once:true });
      };

      modal.classList.remove('hero-status-modal','party-manage-modal','item-transfer-modal');
      modalCloseBtn.hidden = true;
      modalContent.innerHTML = `<div class="event-sheet">
        <div class="status-kicker">EVENT CARD · ${state.eventDiscard.length}/20</div>
        <div class="event-card-head"><span class="event-card-icon">${card.icon}</span><div><h3>${card.name}</h3><p>${card.text}</p></div></div>
        <div class="event-body"></div>
      </div>`;
      modal.classList.remove('hidden');
      const body = modalContent.querySelector('.event-body');

      if (card.kind === 'simple') {
        body.innerHTML = `<button type="button" class="pixel-btn primary event-main-btn">확인</button>`;
        body.querySelector('button').addEventListener('click', () => finish(card.effects, card.text), {once:true});
        return;
      }

      if (card.kind === 'check') {
        body.innerHTML = `<div class="event-check-box"><div class="event-check-label">${eventStatLabel(card.stat)} 판정 · DC ${card.dc}</div><div class="event-d20"><span data-event-d20-value>20</span></div><div class="event-check-result" data-event-result>주사위를 굴려 결과를 확인해.</div></div><button type="button" class="pixel-btn primary event-main-btn">🎲 D20 굴리기</button>`;
        const btn = body.querySelector('button');
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          const roll = Math.floor(Math.random() * 20) + 1;
          await rollEventD20(roll);
          const bonus = heroEventStat(hero, card.stat);
          const total = roll + bonus;
          const success = roll === 20 || (roll !== 1 && total >= Number(card.dc || 10));
          const branch = success ? card.success : card.fail;
          const resultEl = body.querySelector('[data-event-result]');
          resultEl.innerHTML = `${success ? '✅ 성공' : '❌ 실패'} · D20 ${roll} ${bonus >= 0 ? '+' : '-'} ${Math.abs(bonus)} = <strong>${total}</strong><br>${branch?.text || ''}`;
          btn.textContent = '계속';
          btn.disabled = false;
          btn.addEventListener('click', () => finish(branch?.effects || [], branch?.text || ''), {once:true});
        }, {once:true});
        return;
      }

      if (card.kind === 'choice') {
        body.innerHTML = `<div class="event-choice-grid">${(card.options || []).map((opt,index)=>`<button type="button" class="event-choice-btn" data-event-choice="${index}"><strong>${opt.label}</strong><small>${opt.desc || ''}</small></button>`).join('')}</div>`;
        body.querySelectorAll('[data-event-choice]').forEach(btn => btn.addEventListener('click', async () => {
          const opt = card.options[Number(btn.dataset.eventChoice)];
          if (!opt) return;
          if (Number(opt.costGold || 0) > state.gold) {
            btn.classList.add('denied');
            const old = btn.querySelector('small')?.textContent || '';
            if (btn.querySelector('small')) btn.querySelector('small').textContent = `골드가 부족해. 필요 ${opt.costGold}.`;
            setTimeout(() => { if (btn.querySelector('small')) btn.querySelector('small').textContent = old; btn.classList.remove('denied'); }, 900);
            return;
          }
          if (Number(opt.requireHp || 0) > hero.currentHp) {
            btn.classList.add('denied');
            return;
          }
          if (opt.costGold) { state.gold -= Number(opt.costGold); log(`💰 ${hero.name} 골드 -${opt.costGold}`); }
          let chosen = opt;
          if (Array.isArray(opt.random)) chosen = weightedEventOutcome(opt.random) || opt;
          await finish(chosen.effects || [], chosen.text || opt.label);
        }));
        return;
      }

      body.innerHTML = `<button type="button" class="pixel-btn primary event-main-btn">계속</button>`;
      body.querySelector('button').addEventListener('click', () => finish([], card.text), {once:true});
    });
  }


  async function resolveNode(hero, node, originNodeId, unitMembers = getWorldUnitMembers(hero)) {
    switch (node.type) {
      case '마을':
        unitMembers.forEach(member => { member.currentHp=member.hp; member.down=false; member.reviveRound=null; if (member.currentMana !== null) member.currentMana=maxMana(member); });
        showModal('🏠 왕국 마을', `${unitMembers.length > 1 ? '파티 전원' : hero.name}의 HP가 모두 회복되었다.${unitMembers.some(member => member.currentMana !== null) ? ' 마나도 회복.' : ''}`);
        return false;

      case '입구': {
        const target = WORLD_NODES.find(n => n.id === node.portalEntryId);
        if (!target) return false;
        unitMembers.forEach(member => { member.position = target.id; });
        state.viewAreaId = target.areaId;
        const targetMeta = window.WORLD_AREAS?.[target.areaId];
        log(`🗺️ ${hero.icon} <strong>${hero.name}</strong> → <strong>${target.areaId} 지역</strong> 진입 (${targetMeta?.themeLabel || ''})`);
        showModal(`🗺️ ${target.areaId} 지역 진입`, `${targetMeta?.icon || ''} ${targetMeta?.themeLabel || target.areaId + ' 지역'}으로 이동했다.`);
        return false;
      }

      case '전투':
        await startCombat(hero, node, originNodeId);
        return true;

      case '보물':
        if (node.consumed) {
          showModal('📭 빈 상자', '이 보물은 이미 누군가 가져갔다.');
          return false;
        }
        node.consumed = true;
        node.type = '빈상자';
        node.icon = '📭';
        node.short = '빈상자';
        node.name = '비어 있는 상자';
        log(`🎁 ${hero.icon} <strong>${hero.name}</strong>이 보물 상자를 열었다. 이 칸의 보물은 이번 게임에서 소진.`);
        await showTreasureLoot(hero);
        return false;

      case '빈상자':
        showModal('📭 빈 상자', '이미 비어 있는 상자다. 이번 게임에서는 다시 보상이 생기지 않아.');
        return false;

      case '사건':
        return await resolveEventCard(hero, node, originNodeId);

      case '상점':
        showModal('🏪 상점', `${node.name}에서 물품을 사고팔 수 있다. 상점/골드는 카드 시스템과 함께 연결한다.`);
        return false;

      case '휴식':
        unitMembers.forEach(member => { member.currentHp=Math.min(member.hp,member.currentHp+Math.ceil(member.hp*.3)); if (member.currentMana !== null) member.currentMana=Math.min(maxMana(member),member.currentMana+1); });
        showModal('❤️ 휴식', `${unitMembers.length > 1 ? '파티 전원' : hero.name}이 휴식했다. HP 일부 회복${unitMembers.some(member => member.currentMana !== null) ? ' / MANA +1' : ''}.`);
        return false;

      case '길':
        showModal('🛤 길', `${node.name}. 안전한 지름길이다.`);
        return false;

      case '보스':
        if (state.defeatedBosses.has(node.id)) {
          showModal('🏆 정복한 지역', `${node.name}의 보스는 이미 쓰러뜨렸다.`);
          return false;
        }
        await startCombat(hero, node, originNodeId);
        return true;

      case '봉인':
        if (state.seals < 3) {
          state.seals += 1;
          showModal('🗿 용의 봉인석', `고대 신전의 봉인을 해제했다. 현재 봉인석 ${state.seals}/3.`);
          log(`🗿 <strong>봉인석 ${state.seals}/3</strong> 획득.`);
          checkDragonCastleSpawn('seal');
        } else {
          showModal('🗿 고대 신전', '이미 필요한 봉인석을 모두 확보했다.');
        }
        return false;

      case '위험':
        if (Math.random() < 0.5) {
          state.threat = Math.min(12, state.threat + 1);
          showModal('🔥 위험 지역', '불길한 징조가 번진다. DRAGON THREAT +1');
          log('🔥 위험 사건으로 <strong>THREAT +1</strong>.');
          checkDragonCastleSpawn('threat');
        } else {
          showModal('🔥 위험 지역', '아무 일도 일어나지 않았다.');
        }
        return false;

      case '드래곤성':
      case '잠김':
        showModal('🐉 드래곤의 성', '드래곤의 성에 도착했다. 최종 던전/드래곤전은 다음 프로토 단계에서 연결한다.');
        return false;
    }
    return false;
  }

  function finishWorldUnitTurn(hero, reason = 'normal') {
    const leader = getWorldUnitLeader(hero) || hero;
    const unit = getWorldUnitMembers(leader);
    unit.forEach(member => { member.acted = true; });
    state.rolled = null; clearDiceDisplay();
    if (reason === 'item-transfer') {
      const party = getHeroParty(leader);
      log(`⏹️ ${party ? partyDisplayName(party) : leader.name} · 아이템 전달로 이번 월드 턴 종료.`);
    }
    if (state.gameOver) { renderAll(); return; }
    const next = getNextReadyHero();
    if (next) {
      state.activeHeroId = next.id;
      state.viewAreaId = getNodeAreaId(next.position);
    } else endRound();
    renderAll();
  }
  function finishHeroTurn(hero) { finishWorldUnitTurn(hero); }

  function endRound() {
    state.threat = Math.min(12, state.threat + 1);
    log(`라운드 종료 → 🔥 <strong>DRAGON THREAT ${state.threat}/12</strong>`);
    checkDragonCastleSpawn('threat');

    state.round += 1;

    state.heroes.forEach(h => {
      if (h.down && h.reviveRound !== null && h.reviveRound <= state.round) {
        const reviveAreaId = h.reviveAreaId || getNodeAreaId(h.position);
        h.down = false;
        h.currentHp = h.hp;
        h.reviveRound = null;
        h.position = getAreaCenterNodeId(reviveAreaId);
        h.reviveAreaId = null;
        h.attackPenalty = 0;
        h.acPenalty = 0;
        if (h.currentMana !== null) h.currentMana = maxMana(h);
        log(`✨ ${h.icon} <strong>${h.name}</strong>이 ${reviveAreaId} 지역 마을에서 부활했다.`);
      }
      h.acted = false;
      if (!window.PARTY_SYSTEM_ENABLED) h.partyId = null;
    });

    if (window.PARTY_SYSTEM_ENABLED) Object.keys(state.parties).forEach(cleanupParty);
    else state.parties = {};
    const firstReady = getNextReadyHero();
    state.activeHeroId = firstReady?.id || state.heroes.find(h => !h.down)?.id || state.heroes[0]?.id || null;
    if (state.activeHeroId) {
      const active = state.heroes.find(h => h.id === state.activeHeroId);
      if (active) state.viewAreaId = getNodeAreaId(active.position);
    }
    flushDragonCastleNotice();
  }


  function equipmentName(hero, slot) {
    const item = getItemCard?.(hero?.equipment?.[slot]);
    return item ? `${item.icon || ''} ${item.name}`.trim() : '장비 없음';
  }

  function equipmentBonusText(hero, slot) {
    const item = getItemCard?.(hero?.equipment?.[slot]);
    if (!item) return '—';
    const text = itemStatsText(item);
    return text || item.desc || '효과 없음';
  }

  function openHeroStatus(hero) {
    if (!hero) return;
    const totalAc = Math.max(1, hero.ac + equipmentStat(hero, 'ac') - (hero.acPenalty || 0));
    const attackBonus = equipmentStat(hero, 'attack');
    const damageBonus = equipmentStat(hero, 'damage');
    const pos = window.WORLD_NODES?.find?.(node => node.id === hero.position);
    const party = getHeroParty(hero);
    const stateText = hero.down ? 'DOWN' : hero.acted ? '이번 라운드 행동 완료' : party ? `${partyDisplayName(party)} · ${party.leaderId === hero.id ? '리더' : '멤버'}` : '행동 가능';
    const inv = heroInventory(hero);
    const active = getActiveHero();
    const canEquipNow = canUseWorldPrepActions() && getWorldUnitMembers(active).some(h => h.id === hero.id);
    modalContent.innerHTML = `
      <div class="hero-status-sheet">
        <div class="hero-status-top"><div class="hero-status-portrait">${heroSpriteHTML(hero, 'large')}</div><div class="hero-status-title"><div class="status-kicker">CHARACTER STATUS</div><h3>${hero.icon} ${hero.name}</h3><p>${hero.role}</p><div class="status-now">${stateText}${pos ? ` · 📍 ${pos.name}` : ''}</div></div></div>
        <div class="hero-status-bars"><div><span>❤️ HP</span><strong>${hero.currentHp}/${hero.hp}</strong></div>${hero.currentMana !== null ? `<div><span>🔵 MANA</span><strong>${hero.currentMana}/${maxMana(hero)}</strong></div>` : ''}</div>
        <div class="hero-status-stats"><div><span>⚔ 힘</span><strong>${signed(hero.str)}</strong></div><div><span>🏹 민첩</span><strong>${signed(hero.dex)}</strong></div><div><span>✨ 마력</span><strong>${signed(hero.magic)}</strong></div><div><span>🍀 행운</span><strong>${signed(hero.luck)}</strong></div><div><span>🛡 AC</span><strong>${totalAc}${totalAc !== hero.ac ? ` <small>(${hero.ac} ${signed(totalAc-hero.ac)})</small>` : ''}</strong></div><div><span>🎯 장비 명중</span><strong>${signed(attackBonus)}</strong></div><div><span>💥 장비 피해</span><strong>${signed(damageBonus)}</strong></div></div>
        <div class="hero-status-section"><h4>EQUIPMENT</h4><div class="equipment-list"><div><span>⚔ 무기</span><strong>${equipmentName(hero,'weapon')}</strong><small>${equipmentBonusText(hero,'weapon')}</small></div><div><span>🛡 방어구</span><strong>${equipmentName(hero,'armor')}</strong><small>${equipmentBonusText(hero,'armor')}</small></div><div><span>💍 장신구</span><strong>${equipmentName(hero,'accessory')}</strong><small>${equipmentBonusText(hero,'accessory')}</small></div></div></div>
        <div class="hero-status-section"><h4>PERSONAL BAG · ${inv.length}/${BAG_LIMIT}</h4><div class="personal-bag-list">${inv.length ? inv.map((id,index)=>{const item=getItemCard?.(id); if(!item)return ''; const statText=itemStatsText(item); return `<div class="personal-bag-row"><span class="bag-item-icon">${item.icon||'🎁'}</span><div><strong>${item.name}</strong><small>${item.desc}${statText ? ` · ${statText}` : ''}</small></div>${item.type==='equipment' && canEquipNow && canHeroEquip(hero,item) ? `<button type="button" class="text-btn bag-equip-btn" data-equip-index="${index}">장착</button>` : ''}</div>`;}).join('') : '<div class="personal-bag-empty">가방이 비어 있어.</div>'}</div><div class="bag-rule-note">가방은 최대 ${BAG_LIMIT}칸. 전리품은 획득한 영웅의 개인 가방에 들어간다. 다른 영웅에게 주려면 자신의 월드 턴에 ‘아이템 전달’을 사용해야 해.</div></div>
        <div class="hero-status-section skill-status"><h4>ABILITY</h4><p><strong>패시브</strong> ${hero.passive}</p><p><strong>고유기</strong> ${hero.skill}</p></div>
      </div>`;
    modalContent.querySelectorAll('[data-equip-index]').forEach(btn => btn.addEventListener('click',()=>{
      if(!canUseWorldPrepActions())return; const activeUnit=getWorldUnitMembers(getActiveHero()); if(!activeUnit.some(h=>h.id===hero.id))return; const index=Number(btn.dataset.equipIndex); const itemId=heroInventory(hero)[index]; if(!itemId||!equipInventoryItem(hero,itemId,index))return; renderAll(); openHeroStatus(hero);
    }));
    modalCloseBtn.textContent='닫기'; modal.classList.remove('party-manage-modal','item-transfer-modal'); modal.classList.add('hero-status-modal'); modal.classList.remove('hidden');
  }

  function showModal(title, body) {
    modal.classList.remove('hero-status-modal', 'party-manage-modal', 'item-transfer-modal');
    modalCloseBtn.textContent = '확인';
    modalContent.innerHTML = `<h3>${title}</h3><p>${body}</p>`;
    modal.classList.remove('hidden');
  }

  function signed(v) { return v >= 0 ? `+${v}` : `${v}`; }

  function resetGame() {
    if (!confirm('프로토타입을 처음부터 다시 시작할까?')) return;
    state.selectedHeroIds = [];
    state.heroes = [];
    state.rolled = null;
    state.isRolling = false;
    state.isMoving = false;
    state.combat = null;
    state.eventDeck = [];
    state.eventDiscard = [];
    state.parties = {};
    state.nextPartySerial = 1;
    state.defeatedBosses = new Set();
    clearDiceDisplay();
    combatOverlay?.classList.add('hidden');
    state.gameOver = false;
    modal.classList.add('hidden');
    showScreen(titleScreen);
  }

  // iPhone/Safari에서도 확실히 시작되도록 실제 button + 전체 타이틀 영역을 둘 다 연결한다.
  titleStartBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    goToHeroSelect();
  });
  titleStartArea?.addEventListener('click', goToHeroSelect);
  titleStartArea?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToHeroSelect();
    }
  });
  backToTitleBtn.addEventListener('click', () => showScreen(titleScreen));
  startGameBtn.addEventListener('click', startGame);
  rollBtn.addEventListener('click', rollD6);
  partyManageBtn?.addEventListener('click', openPartyManager);
  itemTransferBtn?.addEventListener('click', openItemTransfer);
  combatAttackBtn?.addEventListener('click', heroBasicAttack);
  combatSkillBtn?.addEventListener('click', heroSkillAction);
  combatDefendBtn?.addEventListener('click', heroDefendAction);
  combatItemBtn?.addEventListener('click', openCombatItems);
  combatLogToggle?.addEventListener('click', () => {
    const expanded = combatLog?.classList.toggle('expanded');
    if (combatLogToggle) combatLogToggle.textContent = expanded ? '전체 기록 닫기 ▴' : '전체 기록 보기 ▾';
  });
  $('#resetBtn').addEventListener('click', resetGame);
  $('#clearLogBtn').addEventListener('click', () => gameLog.innerHTML = '');
  modalCloseBtn.addEventListener('click', closeModalPanel);

  renderSetup();
})();
