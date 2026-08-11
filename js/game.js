(() => {
  const $ = (sel) => document.querySelector(sel);
  const state = {
    selectedHeroIds: [],
    heroes: [],
    round: 1,
    threat: 0,
    seals: 0,
    activeHeroId: null,
    rolled: null,
    gameOver: false,
  };

  const setupScreen = $('#setupScreen');
  const gameScreen = $('#gameScreen');
  const heroGrid = $('#heroGrid');
  const heroCount = $('#heroCount');
  const startGameBtn = $('#startGameBtn');
  const partyList = $('#partyList');
  const activeHeroLabel = $('#activeHeroLabel');
  const worldMap = $('#worldMap');
  const rollBtn = $('#rollBtn');
  const stayBtn = $('#stayBtn');
  const diceValue = $('#diceValue');
  const moveHint = $('#moveHint');
  const threatValue = $('#threatValue');
  const threatFill = $('#threatFill');
  const roundValue = $('#roundValue');
  const gameLog = $('#gameLog');
  const modal = $('#modal');
  const modalContent = $('#modalContent');
  const modalCloseBtn = $('#modalCloseBtn');

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
      const el = document.createElement('article');
      el.className = `hero-card ${selected ? 'selected' : ''}`;
      el.innerHTML = `
        <div class="hero-icon">${hero.icon}</div>
        <div class="hero-name">${hero.name}</div>
        <div class="hero-role">${hero.role}</div>
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

  function startGame() {
    state.heroes = state.selectedHeroIds.map(id => {
      const src = HEROES.find(h => h.id === id);
      return {
        ...src,
        currentHp: src.hp,
        currentMana: src.mana ?? null,
        position: 'village',
        acted: false,
      };
    });
    state.round = 1;
    state.threat = 0;
    state.seals = 0;
    state.activeHeroId = state.heroes[0].id;
    state.rolled = null;
    state.gameOver = false;

    setupScreen.classList.remove('active');
    gameScreen.classList.add('active');
    log(`<strong>모험 시작!</strong> ${state.heroes.map(h => h.icon + h.name).join(', ')} 출발.`);
    renderAll();
  }

  function renderAll() {
    renderHUD();
    renderParty();
    renderMap();
    renderControls();
  }

  function renderHUD() {
    roundValue.textContent = state.round;
    threatValue.textContent = `${state.threat} / 12`;
    threatFill.style.width = `${Math.min(100, state.threat / 12 * 100)}%`;
  }

  function renderParty() {
    partyList.innerHTML = '';
    state.heroes.forEach(hero => {
      const el = document.createElement('div');
      const isActive = hero.id === state.activeHeroId;
      el.className = `party-member ${isActive ? 'active' : ''} ${hero.acted ? 'done' : ''}`;
      el.innerHTML = `
        <div class="name-row"><strong>${hero.icon} ${hero.name}</strong><span>${hero.acted ? 'DONE' : 'READY'}</span></div>
        <div>❤️ ${hero.currentHp}/${hero.hp} · 🛡 ${hero.ac}${hero.currentMana !== null ? ` · 🔵 ${hero.currentMana}/3` : ''}</div>
        <div class="hp-bar"><div class="hp-fill" style="width:${hero.currentHp/hero.hp*100}%"></div></div>
      `;
      el.addEventListener('click', () => {
        if (!hero.acted && state.rolled === null && !state.gameOver) {
          state.activeHeroId = hero.id;
          renderAll();
        }
      });
      partyList.appendChild(el);
    });
    const active = getActiveHero();
    activeHeroLabel.textContent = active ? `${active.icon} ${active.name}` : '';
  }

  function renderMap() {
    worldMap.innerHTML = '';
    const reachable = getReachableNodeIds();
    WORLD_NODES.forEach(node => {
      const el = document.createElement('div');
      const heroesHere = state.heroes.filter(h => h.position === node.id);
      const isCurrent = getActiveHero()?.position === node.id;
      const locked = node.locked && state.seals < 3 && state.threat < 9;
      el.className = `map-node ${reachable.has(node.id) ? 'reachable' : ''} ${isCurrent ? 'current' : ''} ${locked ? 'locked' : ''}`;
      el.style.gridColumn = node.x;
      el.style.gridRow = node.y;
      el.innerHTML = `
        <div class="node-icon">${node.icon}</div>
        <div class="node-name">${node.name}</div>
        <div class="node-type">${locked ? '🔒 잠김' : node.type}</div>
        <div class="token-row">${heroesHere.map(h => h.icon).join('')}</div>
      `;
      if (reachable.has(node.id)) el.addEventListener('click', () => moveActiveHero(node.id));
      worldMap.appendChild(el);
    });
  }

  function renderControls() {
    const active = getActiveHero();
    const canAct = active && !active.acted && !state.gameOver;
    rollBtn.disabled = !canAct || state.rolled !== null;
    stayBtn.disabled = !canAct || state.rolled === null;
    diceValue.textContent = state.rolled ?? '-';
    moveHint.textContent = state.rolled === null ? '주사위를 굴려 이동' : `0~${state.rolled}칸 이동 가능`;
  }

  function rollD6() {
    if (state.rolled !== null || state.gameOver) return;
    state.rolled = Math.floor(Math.random() * 6) + 1;
    const hero = getActiveHero();
    log(`${hero.icon} <strong>${hero.name}</strong> 이동 주사위 → 🎲 <strong>${state.rolled}</strong>`);
    renderAll();
  }

  function getActiveHero() {
    return state.heroes.find(h => h.id === state.activeHeroId);
  }

  function getReachableNodeIds() {
    const result = new Set();
    const hero = getActiveHero();
    if (!hero || state.rolled === null || hero.acted) return result;

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

  function moveActiveHero(nodeId) {
    const reachable = getReachableNodeIds();
    if (!reachable.has(nodeId)) return;
    const hero = getActiveHero();
    const node = WORLD_NODES.find(n => n.id === nodeId);
    hero.position = nodeId;
    log(`${hero.icon} <strong>${hero.name}</strong> → ${node.icon} ${node.name}`);
    resolveNode(hero, node);
    finishHeroTurn(hero);
  }

  function stayPut() {
    if (state.rolled === null) return;
    const hero = getActiveHero();
    const node = WORLD_NODES.find(n => n.id === hero.position);
    log(`${hero.icon} <strong>${hero.name}</strong> 이동하지 않음 → ${node.icon} ${node.name} 행동`);
    resolveNode(hero, node);
    finishHeroTurn(hero);
  }

  function resolveNode(hero, node) {
    switch (node.type) {
      case '마을':
        hero.currentHp = hero.hp;
        if (hero.currentMana !== null) hero.currentMana = 3;
        showModal('🏠 왕국 마을', `${hero.name}의 HP가 모두 회복되었다.${hero.currentMana !== null ? ' 마나도 3/3 회복.' : ''}`);
        break;
      case '전투':
        showModal(`${node.icon} 전투 발생`, `프로토 V0.1에서는 전투 UI 연결 전 단계야. 다음 코드 작업에서 D20 명중/피해/몬스터 반격을 여기에 붙인다.`);
        break;
      case '보스':
        showModal('👹 지역 보스', `${node.name}에 강력한 존재가 있다. 다음 단계에서 보스 전투와 봉인석 보상을 연결한다.`);
        break;
      case '봉인':
        if (state.seals < 3) {
          state.seals += 1;
          showModal('🗿 용의 봉인석', `봉인석을 하나 확보했다. 현재 ${state.seals}/3.`);
          log(`🗿 <strong>봉인석 ${state.seals}/3</strong> 획득.`);
        } else {
          showModal('🗿 고대 신전', '이미 필요한 봉인석을 모두 확보했다.');
        }
        break;
      case '위험':
        if (Math.random() < 0.5) {
          state.threat = Math.min(12, state.threat + 1);
          showModal('🔥 위험 지역', '불길한 징조가 번진다. DRAGON THREAT +1');
          log('🔥 위험 사건으로 <strong>THREAT +1</strong>.');
        } else {
          showModal('🔥 화산지대', '아무 일도 일어나지 않았다.');
        }
        break;
      case '잠김':
        showModal('🐉 드래곤의 성', '성문 앞에 도착했다. 최종 던전은 다음 프로토 단계에서 연결한다.');
        break;
    }
  }

  function finishHeroTurn(hero) {
    hero.acted = true;
    state.rolled = null;

    const next = state.heroes.find(h => !h.acted);
    if (next) {
      state.activeHeroId = next.id;
    } else {
      endRound();
    }
    renderAll();
  }

  function endRound() {
    state.threat += 1;
    log(`라운드 종료 → 🔥 <strong>DRAGON THREAT ${state.threat}/12</strong>`);

    if (state.threat >= 12) {
      state.gameOver = true;
      showModal('☠️ 왕국 멸망', 'DRAGON THREAT가 12에 도달했다. 프로토타입 GAME OVER.');
      return;
    }

    if (state.threat === 9 && state.seals < 3) {
      log('🐉 <strong>THREAT 9!</strong> 드래곤의 성이 강제로 개방되었다.');
      showModal('🐉 강제 개방', '위협도 9. 봉인석이 부족하지만 드래곤의 성이 강제로 개방되었다.');
    }

    state.round += 1;
    state.heroes.forEach(h => h.acted = false);
    state.activeHeroId = state.heroes[0].id;
  }

  function showModal(title, body) {
    modalContent.innerHTML = `<h3>${title}</h3><p>${body}</p>`;
    modal.classList.remove('hidden');
  }

  function signed(v) { return v >= 0 ? `+${v}` : `${v}`; }

  function resetGame() {
    if (!confirm('프로토타입을 처음부터 다시 시작할까?')) return;
    location.reload();
  }

  startGameBtn.addEventListener('click', startGame);
  rollBtn.addEventListener('click', rollD6);
  stayBtn.addEventListener('click', stayPut);
  $('#resetBtn').addEventListener('click', resetGame);
  $('#clearLogBtn').addEventListener('click', () => gameLog.innerHTML = '');
  modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));

  renderSetup();
})();
