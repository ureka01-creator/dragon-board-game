// DRAGON BOARD V0.6.3.7
(() => {
  const $ = (sel) => document.querySelector(sel);
  const state = {
    selectedHeroIds: [],
    heroes: [],
    round: 1,
    seals: 0,
    activeHeroId: null,
    focusHeroId: null,
    rolled: null,
    isRolling: false,
    isMoving: false,
    gameOver: false,
    victory: false,
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
    acquiredEquipmentIds: new Set(),
    shopStocks: {},
    discoveredNodeIds: new Set(),
    moveRemaining: 0,
    moveStepsTaken: 0,
    moveOriginNodeId: null,
    moveVisitedNodeIds: new Set(),
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
  const currentObjective = $('#currentObjective');
  const boardTitle = $('#boardTitle');
  const regionNavigator = $('#regionNavigator');
  const regionTitle = $('#regionTitle');
  const worldActionBar = $('#worldActionBar');
  const partyManageBtn = $('#partyManageBtn');
  const itemTransferBtn = $('#itemTransferBtn');
  const partyStatusText = $('#partyStatusText');
  const rollBtn = $('#rollBtn');
  const diceValue = $('#diceValue');
  const diceBox = $('#diceBox');
  const diceRoller = $('#diceRoller');
  const moveHint = $('#moveHint');
  const sealValue = $('#sealValue');
  const sealFill = $('#sealFill');
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
  const lootNewBadge = $('#lootNewBadge');
  const lootCurrentEquipInfo = $('#lootCurrentEquipInfo');
  const lootCurrentEquipDetail = $('#lootCurrentEquipDetail');

  const modal = $('#modal');
  const modalContent = $('#modalContent');
  const modalCloseBtn = $('#modalCloseBtn');

  const BAG_LIMIT = 3;

  // V0.5.9.0 — NORMAL 모드는 4개 지역 보스가 각각 봉인석 1개를 지닌다.
  // 랜덤 봉인 목표와 시간 압박 게이지는 사용하지 않는다.
  function getAreaBossNode(areaId) {
    return WORLD_NODES.find(node => node.areaId === areaId && node.type === '보스') || null;
  }

  function showBossSealModal() {
    const rows = ['A','B','C','D'].map(areaId => {
      const meta = window.WORLD_AREAS?.[areaId];
      const boss = getAreaBossNode(areaId);
      const defeated = Boolean(boss && state.defeatedBosses.has(boss.id));
      return `<div class="seal-quest-row ${defeated ? 'complete' : ''}"><span class="seal-quest-icon">${defeated ? '🗿' : '👑'}</span><div><strong>${meta?.themeLabel || '미지의 지역'}</strong><small>${boss?.name || '지역 보스'} 토벌</small></div><b>${defeated ? '봉인석 획득' : '미토벌'}</b></div>`;
    }).join('');
    modal.classList.remove('hero-status-modal','party-manage-modal','item-transfer-modal','combat-item-modal');
    modalCloseBtn.hidden = false;
    modalContent.innerHTML = `<div class="event-sheet"><div class="status-kicker">REGION BOSS SEALS</div><div class="event-card-head"><span class="event-card-icon">🗿</span><div><h3>드래곤의 봉인석 ${state.seals}/4</h3><p>각 지역 보스를 처음 토벌할 때 봉인석 1개를 얻는다. 네 지역의 봉인석을 모두 모으면 드래곤의 성이 출현한다.</p></div></div><div class="seal-quest-list">${rows}</div></div>`;
    modal.classList.remove('hidden');
  }

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
        <div class="skill-line">🧩 <strong>패시브</strong> · ${hero.passive}</div>
        <div class="skill-line">✨ <strong>고유기</strong> · ${hero.skill}</div>
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

  function getAreaVillageNodeId(areaId) {
    const normalized = String(areaId || 'A');
    const mapped = window.WORLD_VILLAGE_NODE_IDS?.[normalized];
    if (mapped && WORLD_NODES.some(n => n.id === mapped && n.type === '마을')) return mapped;
    const village = WORLD_NODES.find(n => n.areaId === normalized && n.type === '마을');
    return village?.id || window.WORLD_START_NODE_ID || WORLD_NODES[0]?.id;
  }

  function getRandomStartNodeId() {
    const areaIds = Object.keys(window.WORLD_AREAS || {});
    const pool = areaIds.length ? areaIds : ['A','B','C','D'];
    const areaId = pool[Math.floor(Math.random() * pool.length)];
    return getAreaVillageNodeId(areaId);
  }

  function startGame() {
    window.resetWorldMap?.();
    state.viewAreaId = 'A';
    state.dragonCastleNodeId = null;
    state.dragonCastleSpawned = false;
    state.dragonSpawnNoticePending = null;
    // V0.4.9: 월드 턴 순서는 직업 고정 순서(기사→궁수→마법사→도적)를 따른다.
    // 각 영웅의 시작 위치는 새 게임마다 무작위 지역의 무작위 배치된 마을로 독립 랜덤 배정한다.
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
    state.seals = 0;
    state.activeHeroId = state.heroes[0].id;
    state.viewAreaId = getNodeAreaId(state.heroes[0].position);
    state.focusHeroId = null;
    state.rolled = null;
    state.isRolling = false;
    state.isMoving = false;
    state.moveRemaining = 0;
    state.moveStepsTaken = 0;
    state.moveOriginNodeId = null;
    state.moveVisitedNodeIds = new Set();
    state.gameOver = false;
    state.victory = false;
    state.defeatedBosses = new Set();
    state.gold = 0;
    state.parties = {};
    state.nextPartySerial = 1;
    state.combat = null;
    setCombatViewportLock(false);
    state.eventDeck = [];
    state.eventDiscard = [];
    state.acquiredEquipmentIds = new Set();
    state.shopStocks = {};
    modalCloseAction = null;
    state.discoveredNodeIds = new Set();
    revealAroundAllHeroes();
    gameLog.innerHTML = '';

    showScreen(gameScreen);
    log(`<strong>모험 시작!</strong> ${state.heroes.map(h => h.icon + h.name).join(', ')} 출발.`);
    log('👕 모든 영웅은 기본 장비가 없는 상태다. 이후 얻은 장비가 캐릭터 외형에 표시된다.');
    log('🗺️ 4개 지역의 타일 내용과 테마가 이번 게임용으로 새롭게 생성되었다.');
    log(`🎲 시작 위치 랜덤 · ${state.heroes.map(h => `${h.icon}${h.name}:${getAreaDisplayName(getNodeAreaId(h.position))} 마을`).join(' · ')}`);
    log('🔒 파티 편성 기능은 현재 잠김 · 모든 영웅은 SOLO로 행동한다.');
    log(`🔁 월드 턴은 <strong>${state.heroes.map(h => h.name).join(' → ')}</strong> 고정 순서로 진행된다.`);
    log('🗿 NORMAL 목표 · 4개 지역 보스를 각각 토벌해 봉인석 4개를 모으면 드래곤의 성이 출현한다.');
    renderAll();
    // 인게임 진입 시 스크롤 위치를 강제로 보드 중앙에 맞추지 않는다.
    // 화면 전환 직후 최상단을 한 번만 유지해 iOS Safari의 자동 재정렬/점프를 막는다.
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
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
    sealValue.textContent = `${state.seals} / 4`;
    sealFill.style.width = `${Math.min(100, state.seals / 4 * 100)}%`;

    let active = getActiveHero();
    const leader = getWorldUnitLeader(active);
    if (leader && active?.id !== leader.id && state.rolled === null && !state.combat) {
      state.activeHeroId = leader.id;
      active = leader;
    }
    const party = getHeroParty(active);
    const unit = getWorldUnitMembers(active);

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
          ${hero.down ? `<div class="down-note">다음 라운드 ${getAreaDisplayName(hero.reviveAreaId || getNodeAreaId(hero.position))} 마을에서 부활</div>` : ''}
        </div>
      `;
      el.querySelector('.party-status-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        openHeroStatus(hero);
      });
      // V0.4.8: 영웅 카드를 눌러도 턴은 바뀌지 않는다.
      // 해당 영웅이 있는 지역으로 카메라만 이동하고 토큰을 잠깐 강조한다.
      el.addEventListener('click', () => {
        if (st