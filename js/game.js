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
        : active
          ? `${active.icon} ${active.name} 턴`
          : '-';
      const guide = currentTurnBanner.querySelector('.turn-guide');
      if (guide) {
        guide.textContent = state.gameOver
          ? '왕국의 운명이 끝났다'
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
      el.className = `party-member ${isActive ? 'active' : ''} ${hero.acted ? 'done' : ''}`;
      el.innerHTML = `
        ${heroSpriteHTML(hero, 'medium')}
        <div class="party-info">
          <div class="name-row"><strong>${hero.icon} ${hero.name}</strong><span>${hero.acted ? 'DONE' : 'READY'}</span></div>
          <div>❤️ ${hero.currentHp}/${hero.hp} · 🛡 ${hero.ac}${hero.currentMana !== null ? ` · 🔵 ${hero.currentMana}/3` : ''}</div>
          <div class="hp-bar"><div class="hp-fill" style="width:${hero.currentHp/hero.hp*100}%"></div></div>
        </div>
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
    const canAct = active && !active.acted && !state.gameOver;
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

  async function moveActiveHero(nodeId) {
    if (state.isMoving || state.isRolling || state.gameOver) return;
    const reachable = getReachableNodeIds();
    if (!reachable.has(nodeId)) return;
    const hero = getActiveHero();
    if (!hero) return;
    const path = getShortestPath(hero.position, nodeId, state.rolled ?? 0);
    if (!path) return;
    const node = WORLD_NODES.find(n => n.id === nodeId);

    state.isMoving = true;
    renderControls();
    await animateHeroHop(hero, path);
    hero.position = nodeId;
    state.isMoving = false;

    log(`${hero.icon} <strong>${hero.name}</strong> → ${node.icon} ${node.name} <span class="move-steps">(${path.length - 1}칸)</span>`);
    resolveNode(hero, node);
    finishHeroTurn(hero);
  }

  function stayPut() {
    if (state.rolled === null || state.isMoving || state.isRolling) return;
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
        showModal(`${node.icon} 전투 발생`, `이 지역에서 몬스터와 조우했다. 다음 코드 작업에서 D20 명중/피해/몬스터 반격을 이 칸에 연결한다.`);
        break;
      case '보물':
        showModal('🎁 보물 발견', `${node.name}에서 보물을 발견했다. 다음 단계에서 장비 카드를 연결하면 캐릭터 위에 실제 장비 레이어가 입혀진다.`);
        break;
      case '사건':
        showModal('❓ 사건 발생', `${node.name}에서 랜덤 사건이 발생한다. 이벤트 카드 시스템은 이후 연결한다.`);
        break;
      case '상점':
        showModal('🏪 상점', `${node.name}에서 물품을 사고팔 수 있다. 상점/골드는 카드 시스템과 함께 연결한다.`);
        break;
      case '휴식':
        hero.currentHp = Math.min(hero.hp, hero.currentHp + Math.ceil(hero.hp * 0.3));
        if (hero.currentMana !== null) hero.currentMana = Math.min(3, hero.currentMana + 1);
        showModal('❤️ 휴식', `${hero.name}이 휴식했다. HP 일부 회복${hero.currentMana !== null ? ' / MANA +1' : ''}.`);
        break;
      case '길':
        showModal('🛤 길', `${node.name}. 안전한 지름길이다.`);
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
    clearDiceDisplay();

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
    state.selectedHeroIds = [];
    state.heroes = [];
    state.rolled = null;
    state.isRolling = false;
    clearDiceDisplay();
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
  $('#resetBtn').addEventListener('click', resetGame);
  $('#clearLogBtn').addEventListener('click', () => gameLog.innerHTML = '');
  modalCloseBtn.addEventListener('click', () => modal.classList.add('hidden'));

  renderSetup();
})();
