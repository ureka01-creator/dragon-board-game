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
    isRolling: false,
    isMoving: false,
    gameOver: false,
    defeatedBosses: new Set(),
    gold: 0,
    inventory: [],
    combat: null,
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
  const activeHeroLabel = $('#activeHeroLabel');
  const resourceSummary = $('#resourceSummary');
  const worldMap = $('#worldMap');
  const currentTurnBanner = $('#currentTurnBanner');
  const currentTurnName = $('#currentTurnName');
  const rollBtn = $('#rollBtn');
  const stayBtn = $('#stayBtn');
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

  function startGame() {
    state.heroes = state.selectedHeroIds.map(id => {
      const src = HEROES.find(h => h.id === id);
      return {
        ...src,
        currentHp: src.hp,
        currentMana: src.mana ?? null,
        position: 'village',
        acted: false,
        down: false,
        reviveRound: null,
        attackPenalty: 0,
        acPenalty: 0,
        equipment: { armor: null, weapon: null, accessory: null },
      };
    });
    state.round = 1;
    state.threat = 0;
    state.seals = 0;
    state.activeHeroId = state.heroes[0].id;
    state.rolled = null;
    state.isRolling = false;
    state.isMoving = false;
    state.gameOver = false;
    state.defeatedBosses = new Set();
    state.gold = 0;
    state.inventory = [];
    state.combat = null;
    gameLog.innerHTML = '';

    showScreen(gameScreen);
    log(`<strong>모험 시작!</strong> ${state.heroes.map(h => h.icon + h.name).join(', ')} 출발.`);
    log('👕 모든 영웅은 기본 장비가 없는 상태다. 이후 보물/상점에서 얻은 장비가 캐릭터 외형에 표시된다.');
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

    const active = getActiveHero();
    if (currentTurnBanner && currentTurnName) {
      currentTurnBanner.classList.toggle('game-over', state.gameOver);
      currentTurnBanner.dataset.hero = active?.id || '';
      currentTurnName.textContent = state.gameOver
        ? '☠ GAME OVER'
        : state.combat
          ? '⚔ 전투 진행 중'
          : active
            ? `${active.icon} ${active.name} 턴`
            : '-';
      const guide = currentTurnBanner.querySelector('.turn-guide');
      if (guide) {
        guide.textContent = state.gameOver
          ? '왕국의 운명이 끝났다'
          : state.combat
            ? '전투를 먼저 해결해'
            : state.isMoving
              ? '이동 중…'
              : state.isRolling
                ? '주사위 굴리는 중…'
                : state.rolled === null
                  ? '주사위를 굴려 행동해'
                  : `최대 ${state.rolled}칸 이동할 곳을 선택해`;
      }
    }
  }

  function renderParty() {
    partyList.innerHTML = '';
    state.heroes.forEach(hero => {
      const el = document.createElement('div');
      const isActive = hero.id === state.activeHeroId;
      el.className = `party-member ${isActive ? 'active' : ''} ${hero.acted ? 'done' : ''} ${hero.down ? 'down' : ''}`;
      const status = hero.down ? 'DOWN' : (hero.acted ? 'DONE' : 'READY');
      el.innerHTML = `
        ${heroSpriteHTML(hero, 'medium')}
        <div class="party-info">
          <div class="name-row"><strong>${hero.icon} ${hero.name}</strong><span>${status}</span></div>
          <div>❤️ ${hero.currentHp}/${hero.hp} · 🛡 ${Math.max(1, hero.ac + equipmentStat(hero, 'ac') - (hero.acPenalty || 0))}${hero.currentMana !== null ? ` · 🔵 ${hero.currentMana}/3` : ''}</div>
          <div class="hp-bar"><div class="hp-fill" style="width:${hero.currentHp/hero.hp*100}%"></div></div>
          ${hero.down ? `<div class="down-note">다음 라운드 마을에서 부활</div>` : ''}
        </div>
      `;
      el.addEventListener('click', () => {
        if (!hero.down && !hero.acted && state.rolled === null && !state.gameOver && !state.combat) {
          state.activeHeroId = hero.id;
          renderAll();
        }
      });
      partyList.appendChild(el);
    });
    const active = getActiveHero();
    activeHeroLabel.textContent = active ? `${active.icon} ${active.name}` : '';
    if (resourceSummary) resourceSummary.textContent = `🗿 ${state.seals}/3 · 💰 ${state.gold} · 🎒 ${state.inventory.length}`;
  }

  function renderMap() {
    worldMap.innerHTML = '';
    const reachable = getReachableNodeIds();
    WORLD_NODES.forEach(node => {
      const el = document.createElement('div');
      const heroesHere = state.heroes.filter(h => h.position === node.id);
      const isCurrent = getActiveHero()?.position === node.id;
      const locked = node.locked && state.seals < 3 && state.threat < 9;
      el.className = `map-node region-${node.region || 'road'} ${reachable.has(node.id) ? 'reachable' : ''} ${isCurrent ? 'current' : ''} ${locked ? 'locked' : ''}`;
      el.dataset.nodeId = node.id;
      el.style.gridColumn = node.x;
      el.style.gridRow = node.y;
      el.innerHTML = `
        <div class="node-icon">${node.icon}</div>
        <div class="node-name">${node.short || node.name}</div>
        <div class="node-type">${locked ? '🔒 잠김' : node.type}</div>
        ${heroesHere.length ? `<div class="map-token-grid count-${heroesHere.length}">${heroesHere.map(h => `<div class="map-hero-token token-${h.id} ${h.id === state.activeHeroId ? 'active' : ''}" data-hero-id="${h.id}" aria-label="${h.name}">${h.icon}</div>`).join('')}</div>` : ''}
      `;
      if (reachable.has(node.id)) el.addEventListener('click', () => moveActiveHero(node.id));
      worldMap.appendChild(el);
    });
  }

  function renderControls() {
    const active = getActiveHero();
    const canAct = active && !active.acted && !active.down && !state.gameOver && !state.combat;
    rollBtn.disabled = !canAct || state.rolled !== null || state.isRolling || state.isMoving;
    stayBtn.disabled = !canAct || state.rolled === null || state.isRolling || state.isMoving;
    diceValue.textContent = state.isRolling ? '…' : (state.rolled === null ? '-' : `${DICE_FACES[state.rolled - 1]} ${state.rolled}`);
    if (state.isMoving) {
      moveHint.textContent = '영웅 이동 중…';
    } else if (state.isRolling) {
      moveHint.textContent = '주사위 굴리는 중…';
    } else {
      moveHint.textContent = state.rolled === null ? '주사위를 굴려 이동' : `0~${state.rolled}칸 이동 가능`;
    }
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

        // 결과 주사위는 사라지지 않는다. 플레이어가 이동/이동 안 함을 확정할 때까지 보드 위에 남아 있다.
        setTimeout(resolve, 180);
      }

      setRollingDieFace(Math.floor(Math.random() * 6) + 1);
      diceAnimationFrame = requestAnimationFrame(draw);
    });
  }

  async function rollD6() {
    if (state.rolled !== null || state.isRolling || state.isMoving || state.gameOver) return;
    const hero = getActiveHero();
    const result = Math.floor(Math.random() * 6) + 1;
    state.isRolling = true;
    renderControls();

    await playDiceRollAnimation(result);

    state.rolled = result;
    state.isRolling = false;
    log(`${hero.icon} <strong>${hero.name}</strong> 이동 주사위 → 🎲 <strong>${state.rolled}</strong>`);
    renderAll();
  }

  function getActiveHero() {
    return state.heroes.find(h => h.id === state.activeHeroId);
  }

  function getReachableNodeIds() {
    const result = new Set();
    const hero = getActiveHero();
    if (state.combat || !hero || hero.down || state.rolled === null || hero.acted) return result;

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

  function animateHeroHop(hero, path) {
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
        mover.style.transform = `translate3d(${point.x}px, ${point.y - lift}px, 0)`;
        if (token) token.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`;
        shadow.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${shadowScale})`;
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
    if (node.type === '보스') {
      const monsterId = BOSS_ENCOUNTERS[node.id];
      const src = MONSTERS[monsterId];
      return [cloneEnemy(monsterId, encounterScale(src.tier, participantCount))];
    }

    const pool = NODE_ENCOUNTERS[node.id] || (
      node.region === 'grave' ? ['skeleton','ghost','slime'] :
      node.region === 'war' ? ['goblin','orc'] :
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
    if (hero.id === 'knight') return { count:1, sides:8, bonus:hero.str + gearDamage, type:'physical', melee:true };
    if (hero.id === 'archer') return { count:1, sides:8, bonus:hero.dex + gearDamage, type:'physical', melee:false };
    if (hero.id === 'mage') return { count:1, sides:6, bonus:hero.magic + gearDamage, type:'magic', melee:false };
    return { count:1, sides:6, bonus:hero.dex + gearDamage, type:'physical', melee:true };
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
      const active = id === c.currentHeroId && !c.busy;
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
          ${hero.currentMana !== null ? `<span>🔵 ${hero.currentMana}/3</span>` : ''}
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

  function applyDamageToEnemy(enemy, rawDamage, damageType = 'physical') {
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

    enemy.currentHp = Math.max(0, enemy.currentHp - damage);
    if (enemy.currentHp === 0) {
      combatLogEntry(`☠️ <strong>${enemy.name}</strong> 처치!`);
      setCombatMessage(`${enemy.name} 처치!`, 'good');
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

  function damageHero(hero, amount, sourceName = '몬스터') {
    hero.currentHp = Math.max(0, hero.currentHp - Math.max(0, amount));
    if (hero.currentHp <= 0) knockOutHero(hero, sourceName);
  }

  function knockOutHero(hero, sourceName) {
    if (hero.down) return;
    hero.down = true;
    hero.currentHp = 0;
    hero.position = 'village';
    hero.acted = true;
    hero.reviveRound = state.round + 1;
    state.threat = Math.min(12, state.threat + 1);
    combatLogEntry(`💀 <strong>${hero.name}</strong> 쓰러짐 → 마을 귀환 / THREAT +1`);
    log(`💀 ${hero.icon} <strong>${hero.name}</strong> 쓰러짐 (${sourceName}) → 마을 귀환 / 🔥 THREAT +1`);

    if (state.threat >= 12) {
      state.gameOver = true;
    }
  }

  function resolveHeroHit(hero, enemy, roll, attackBonus, damageSpec, options = {}) {
    const naturalCrit = hero.id === 'archer' ? roll >= 19 : roll === 20;
    const autoMiss = roll === 1;
    const autoHit = roll === 20;
    let hitPenalty = hero.attackPenalty || 0;

    // 와이번은 짝수 전투 라운드에 비행한다. 근접 영웅은 불리하다.
    if (enemy.id === 'wyvern' && state.combat.round % 2 === 0 && (hero.id === 'knight' || hero.id === 'rogue')) {
      hitPenalty += 3;
    }

    const total = roll + attackBonus - hitPenalty + (options.hitBonus || 0);
    const hit = !autoMiss && (autoHit || total >= enemy.ac);
    hero.attackPenalty = 0;

    if (!hit) {
      combatLogEntry(`❌ ${hero.name} 공격 실패 · D20 ${roll} + 보정 ${attackBonus + (options.hitBonus || 0) - hitPenalty} = ${total} / AC ${enemy.ac}`);
      if (roll === 1 && enemy.id === 'darkKnight') {
        const counter = rollDice(1, 6).total;
        damageHero(hero, counter, '흑기사 반격');
        combatLogEntry(`⚔️ 흑기사 반격! ${hero.name}에게 ${counter} 피해.`);
      }
      return { hit:false, damage:0, crit:false };
    }

    const diceCount = damageSpec.count * (naturalCrit && !options.noCrit ? 2 : 1);
    const rolledDamage = rollDice(diceCount, damageSpec.sides);
    const rawDamage = rolledDamage.total + damageSpec.bonus + (options.flatBonus || 0);
    const damage = applyDamageToEnemy(enemy, rawDamage, damageSpec.type || 'physical');
    combatLogEntry(`${naturalCrit && !options.noCrit ? '💥 CRITICAL! ' : '⚔️ '}${hero.name} → ${enemy.name} <strong>${damage} 피해</strong>`);
    return { hit:true, damage, crit:naturalCrit && !options.noCrit };
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
    const roll = Math.floor(Math.random() * 20) + 1;
    await animateCombatD20(roll, `${hero.icon} ${hero.name} 공격`);
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
      const damage = applyDamageToEnemy(enemy, spell.total + hero.magic + equipmentStat(hero, 'damage'), 'magic');
      combatD20Value.textContent = '✨';
      combatDiceLabel.textContent = '마력 폭발';
      combatLogEntry(`✨ ${hero.name} 마력 폭발 → ${enemy.name} <strong>${damage} 피해</strong> / MANA -2`);
      setCombatMessage(`${enemy.name}에게 ${damage} 마법 피해!`, 'good');
      await animateMagicBurst(hero, enemy, damage);
    } else {
      const roll = Math.floor(Math.random() * 20) + 1;
      await animateCombatD20(roll, `${hero.icon} ${skillName(hero)}`);
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
    damageHero(target, damage, enemy.name);
    combatLogEntry(`💢 ${enemy.name} → ${target.name} <strong>${damage} 피해</strong>`);
    setCombatMessage(`${target.name} ${damage} 피해!`, 'danger');
    await animateMonsterResult(enemy, target, true, damage);

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
      const before = troll.currentHp;
      troll.currentHp = Math.min(troll.maxHp, troll.currentHp + 3);
      const healed = troll.currentHp - before;
      if (healed > 0) combatLogEntry(`👑 트롤 왕 재생 +${healed} HP`);
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
    return parts.join(' · ');
  }

  function stashLoot(item) {
    state.inventory.push(item.id);
    log(`🎒 <strong>${item.name}</strong> 가방에 보관.`);
  }

  function equipLoot(hero, item) {
    const slot = item.slot;
    const oldId = hero.equipment?.[slot];
    if (!hero.equipment) hero.equipment = { armor:null, weapon:null, accessory:null };
    if (oldId) {
      state.inventory.push(oldId);
      const old = getItemCard(oldId);
      if (old) log(`🎒 ${hero.name}의 <strong>${old.name}</strong> → 가방으로 이동.`);
    }
    hero.equipment[slot] = item.id;
    log(`✨ ${hero.icon} <strong>${hero.name}</strong> · ${item.name} 장착!`);
  }

  function acquireSimpleLoot(item) {
    if (item.type === 'gold') {
      state.gold += Number(item.value || 0);
      log(`💰 <strong>${item.value} 골드</strong> 획득!`);
      return;
    }
    if (item.type === 'consumable') {
      stashLoot(item);
      return;
    }
  }

  function showCombatLoot(c) {
    return new Promise(resolve => {
      if (!lootOverlay || !lootCard || !window.drawCombatLoot) {
        resolve(null);
        return;
      }

      const tier = lootTierForCombat(c);
      const item = drawCombatLoot(tier);
      let revealed = false;
      let finished = false;

      lootOverlay.classList.remove('hidden');
      lootCard.classList.add('face-down');
      lootCard.classList.remove('revealed', 'rare', 'danger');
      lootCard.disabled = false;
      lootCardIcon.textContent = '📦';
      lootCardName.textContent = '?';
      lootCardDesc.textContent = '카드를 터치해서 열기';
      lootGuide.textContent = tier === 'boss' ? '보스 전리품 · 장비 1개 확정' : tier === 'elite' ? '정예 전리품 · 장비 확률 상승' : '전리품 상자를 발견했다.';
      lootActions.innerHTML = '';

      const finish = () => {
        if (finished) return;
        finished = true;
        lootOverlay.classList.add('hidden');
        renderParty();
        resolve(item);
      };

      const makeButton = (text, cls, handler) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pixel-btn ${cls || ''}`.trim();
        btn.textContent = text;
        btn.addEventListener('click', handler, { once:true });
        lootActions.appendChild(btn);
        return btn;
      };

      const reveal = () => {
        if (revealed) return;
        revealed = true;
        lootCard.disabled = true;
        lootCard.classList.remove('face-down');
        lootCard.classList.add('revealed');
        if (item.rarity === 'rare') lootCard.classList.add('rare');
        if (item.type === 'curse' || item.type === 'mimic') lootCard.classList.add('danger');
        lootCardIcon.textContent = item.icon || '🎁';
        lootCardName.textContent = item.name;
        const stats = itemStatsText(item);
        lootCardDesc.textContent = `${item.desc}${stats ? ` · ${stats}` : ''}`;
        lootActions.innerHTML = '';

        if (item.type === 'equipment') {
          lootGuide.textContent = `${itemSlotLabel(item.slot)} · 장착할 영웅을 선택해.`;
          state.heroes.forEach(hero => {
            const current = getItemCard(hero.equipment?.[item.slot]);
            makeButton(`${hero.icon} ${hero.name}${current ? ` ↔ ${current.name}` : ''}`, '', () => {
              equipLoot(hero, item);
              finish();
            });
          });
          makeButton('🎒 가방에 보관', '', () => {
            stashLoot(item);
            finish();
          });
          return;
        }

        if (item.type === 'gold') {
          lootGuide.textContent = `${item.value} 골드를 발견했다.`;
          makeButton(`💰 ${item.value} 골드 획득`, 'primary', () => {
            acquireSimpleLoot(item);
            finish();
          });
          return;
        }

        if (item.type === 'consumable') {
          lootGuide.textContent = '소비 아이템을 발견했다.';
          makeButton('🎒 가방에 넣기', 'primary', () => {
            acquireSimpleLoot(item);
            finish();
          });
          return;
        }

        lootGuide.textContent = '이번 상자는 비어 있었다.';
        makeButton('계속', 'primary', finish);
      };

      lootCard.addEventListener('click', reveal, { once:true });
    });
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

    const next = state.heroes.find(h => !h.acted && !h.down);
    if (next) {
      state.activeHeroId = next.id;
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

    if (result === 'victory') {
      setCombatMessage('VICTORY!', 'good');
      combatLogEntry('🏆 전투 승리!');
      log(`🏆 ${c.node.icon} <strong>${c.node.name}</strong> 전투 승리.`);

      // 마법사는 전투 종료 시 MANA 1 회복.
      c.participantIds.forEach(id => {
        const hero = state.heroes.find(h => h.id === id);
        if (hero?.id === 'mage' && !hero.down) hero.currentMana = Math.min(3, (hero.currentMana ?? 0) + 1);
      });

      if (c.isBoss && !state.defeatedBosses.has(c.node.id)) {
        state.defeatedBosses.add(c.node.id);
        if (state.seals < 3) {
          state.seals += 1;
          combatLogEntry(`🗿 용의 봉인석 획득! ${state.seals}/3`);
          log(`🗿 지역 보스 처치 → <strong>봉인석 ${state.seals}/3</strong>`);
        }
      }
    } else {
      setCombatMessage(state.gameOver ? 'KINGDOM FALLS' : 'DEFEAT', 'danger');
      combatLogEntry('☠️ 전투 패배. 쓰러진 영웅은 마을로 귀환한다.');
      log('☠️ 전투 패배. 살아남지 못한 영웅은 다음 라운드 마을에서 부활한다.');
    }

    renderCombat();
    await new Promise(r => setTimeout(r, result === 'victory' ? 620 : 850));
    if (result === 'victory' && !state.gameOver) {
      await showCombatLoot(c);
    }
    const ids = [...c.participantIds];
    const resolver = c.resolve;
    combatOverlay.classList.add('hidden');
    state.combat = null;
    finishCombatTurns(ids);

    if (state.gameOver) showModal('☠️ 왕국 멸망', 'DRAGON THREAT가 12에 도달했다. GAME OVER.');
    resolver?.(result);
  }

  function startCombat(hero, node, originNodeId) {
    return new Promise(resolve => {
      if (state.combat) {
        resolve('busy');
        return;
      }

      // 같은 칸의 아직 행동하지 않은 영웅은 자동으로 전투에 합류한다.
      const participants = state.heroes.filter(h =>
        !h.down && h.currentHp > 0 && h.position === node.id && (!h.acted || h.id === hero.id)
      );
      if (!participants.some(h => h.id === hero.id)) participants.unshift(hero);

      const enemies = chooseEncounter(node, participants.length);
      const isBoss = node.type === '보스';
      const heroStates = {};
      participants.forEach(h => {
        heroStates[h.id] = { acted:false, defending:false, skillUsedBattle:false, skillUsedRound:false };
      });

      state.combat = {
        node,
        nodeId: node.id,
        originNodeId,
        isBoss,
        participantIds: participants.map(h => h.id),
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
    const hero = getActiveHero();
    if (!hero || hero.down) return;
    const originNodeId = hero.position;
    const path = getShortestPath(hero.position, nodeId, state.rolled ?? 0);
    if (!path) return;
    const node = WORLD_NODES.find(n => n.id === nodeId);

    state.isMoving = true;
    renderControls();
    await animateHeroHop(hero, path);
    hero.position = nodeId;
    state.isMoving = false;

    log(`${hero.icon} <strong>${hero.name}</strong> → ${node.icon} ${node.name} <span class="move-steps">(${path.length - 1}칸)</span>`);
    const turnHandled = await resolveNode(hero, node, originNodeId);
    if (!turnHandled) finishHeroTurn(hero);
  }

  async function stayPut() {
    if (state.rolled === null || state.isMoving || state.isRolling || state.combat) return;
    const hero = getActiveHero();
    if (!hero || hero.down) return;
    const node = WORLD_NODES.find(n => n.id === hero.position);
    log(`${hero.icon} <strong>${hero.name}</strong> 이동하지 않음 → ${node.icon} ${node.name} 행동`);
    const turnHandled = await resolveNode(hero, node, hero.position);
    if (!turnHandled) finishHeroTurn(hero);
  }

  async function resolveNode(hero, node, originNodeId) {
    switch (node.type) {
      case '마을':
        hero.currentHp = hero.hp;
        hero.down = false;
        hero.reviveRound = null;
        if (hero.currentMana !== null) hero.currentMana = 3;
        showModal('🏠 왕국 마을', `${hero.name}의 HP가 모두 회복되었다.${hero.currentMana !== null ? ' 마나도 3/3 회복.' : ''}`);
        return false;

      case '전투':
        await startCombat(hero, node, originNodeId);
        return true;

      case '보물':
        showModal('🎁 보물 발견', `${node.name}에서 보물을 발견했다. 다음 단계에서 장비 카드를 연결하면 캐릭터 위에 실제 장비 레이어가 입혀진다.`);
        return false;

      case '사건':
        showModal('❓ 사건 발생', `${node.name}에서 랜덤 사건이 발생한다. 이벤트 카드 시스템은 이후 연결한다.`);
        return false;

      case '상점':
        showModal('🏪 상점', `${node.name}에서 물품을 사고팔 수 있다. 상점/골드는 카드 시스템과 함께 연결한다.`);
        return false;

      case '휴식':
        hero.currentHp = Math.min(hero.hp, hero.currentHp + Math.ceil(hero.hp * 0.3));
        if (hero.currentMana !== null) hero.currentMana = Math.min(3, hero.currentMana + 1);
        showModal('❤️ 휴식', `${hero.name}이 휴식했다. HP 일부 회복${hero.currentMana !== null ? ' / MANA +1' : ''}.`);
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
        } else {
          showModal('🗿 고대 신전', '이미 필요한 봉인석을 모두 확보했다.');
        }
        return false;

      case '위험':
        if (Math.random() < 0.5) {
          state.threat = Math.min(12, state.threat + 1);
          showModal('🔥 위험 지역', '불길한 징조가 번진다. DRAGON THREAT +1');
          log('🔥 위험 사건으로 <strong>THREAT +1</strong>.');
          if (state.threat >= 12) {
            state.gameOver = true;
            showModal('☠️ 왕국 멸망', 'DRAGON THREAT가 12에 도달했다. GAME OVER.');
          }
        } else {
          showModal('🔥 화산지대', '아무 일도 일어나지 않았다.');
        }
        return false;

      case '잠김':
        showModal('🐉 드래곤의 성', '성문 앞에 도착했다. 최종 던전/드래곤전은 다음 프로토 단계에서 연결한다.');
        return false;
    }
    return false;
  }

  function finishHeroTurn(hero) {
    hero.acted = true;
    state.rolled = null;
    clearDiceDisplay();

    if (state.gameOver) {
      renderAll();
      return;
    }

    const next = state.heroes.find(h => !h.acted && !h.down);
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

    state.heroes.forEach(h => {
      if (h.down && h.reviveRound !== null && h.reviveRound <= state.round) {
        h.down = false;
        h.currentHp = h.hp;
        h.reviveRound = null;
        h.position = 'village';
        h.attackPenalty = 0;
        h.acPenalty = 0;
        if (h.currentMana !== null) h.currentMana = 3;
        log(`✨ ${h.icon} <strong>${h.name}</strong>이 마을에서 부활했다.`);
      }
      h.acted = false;
    });

    const firstReady = state.heroes.find(h => !h.down);
    state.activeHeroId = firstReady?.id || state.heroes[0]?.id || null;
  }

  function showModal(title, body) {
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
  stayBtn.addEventListener('click', stayPut);
  combatAttackBtn?.addEventListener('click', heroBasicAttack);
  combatSkillBtn?.addEventListener('click', heroSkillAction);
  combatDefendBtn?.addEventListener('click', heroDefendAction);
  combatLogToggle?.addEventListener('click', () => {
    const expanded = combatLog?.classList.toggle('expanded');
    if (combatLogToggle) combatLogToggle.textContent = expanded ? '전체 기록 닫기 ▴' : '전체 기록 보기 ▾';
  });
  $('#resetBtn').addEventListener('click', resetGame);
  $('#clearLogBtn').addEventListener('click', () => gameLog.innerHTML = '');
  modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));

  renderSetup();
})();
