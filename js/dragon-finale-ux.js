// DRAGON BOARD V0.6.6.0 — dragon castle presentation + interactive final dungeon + victory screen
(() => {
  const worldMap = document.querySelector('#worldMap');
  const moveHint = document.querySelector('#moveHint');
  const modal = document.querySelector('#modal');
  const combatOverlay = document.querySelector('#combatOverlay');
  const roundValue = document.querySelector('#roundValue');
  const sealValue = document.querySelector('#sealValue');
  if (!worldMap || !moveHint) return;

  const style = document.createElement('style');
  style.textContent = `
    .map-node.region-dragon.castle-ux-reveal {
      opacity: 1 !important;
      filter: none !important;
      visibility: visible !important;
      overflow: visible;
      border-color: #d85b45 !important;
      background:
        radial-gradient(circle at 50% 56%, rgba(208,64,42,.28), transparent 48%),
        linear-gradient(180deg, #3e1719, #1d0d0e) !important;
      box-shadow:
        0 0 0 2px rgba(111,31,25,.92),
        inset 0 0 16px rgba(255,77,47,.20),
        0 0 16px rgba(222,63,43,.38) !important;
      animation: dragonCastleUxPulse 1.05s steps(2,end) infinite !important;
    }
    .map-node.region-dragon.castle-ux-reveal::after { content:none !important; }
    .map-node.region-dragon.castle-ux-reveal .node-icon,
    .map-node.region-dragon.castle-ux-reveal .node-name,
    .map-node.region-dragon.castle-ux-reveal .node-type { visibility:visible !important; }
    .map-node.region-dragon.castle-ux-reveal .node-icon {
      width:100%; min-height:30px; display:grid; place-items:center; position:relative; filter:none !important;
    }
    .dragon-castle-art { position:relative; display:inline-grid; place-items:center; line-height:1; }
    .dragon-castle-art .castle { font-size:clamp(22px,3.6vw,34px); filter:drop-shadow(0 2px 0 #090505) drop-shadow(0 0 5px rgba(255,98,62,.45)); }
    .dragon-castle-art .dragon { position:absolute; right:-9px; top:-7px; font-size:clamp(10px,1.7vw,15px); filter:drop-shadow(0 0 4px rgba(255,86,55,.8)); }
    .map-node.region-dragon.castle-ux-reveal .node-name { color:#ffd28a; font-weight:800; }
    .map-node.region-dragon.castle-ux-reveal .node-type { color:#df806c; }
    @keyframes dragonCastleUxPulse { 50% { filter:brightness(1.17); } }

    .final-dungeon-track {
      display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px;
      margin:13px 0 14px; padding:9px 7px; border:2px solid #4f3927;
      background:linear-gradient(180deg,#160f0c,#0d0907); box-shadow:inset 0 0 18px rgba(0,0,0,.45);
    }
    .final-dungeon-track-stage {
      min-width:0; position:relative; display:grid; justify-items:center; gap:4px;
      padding:7px 2px 6px; color:#796c59; border:1px solid #33261c; background:#17110d;
      font:700 9px ui-monospace,monospace; text-align:center;
    }
    .final-dungeon-track-stage::after {
      content:'›'; position:absolute; right:-7px; top:50%; z-index:2; transform:translateY(-54%);
      color:#6f5332; font-size:15px; text-shadow:0 1px #000;
    }
    .final-dungeon-track-stage:last-child::after { content:none; }
    .final-dungeon-track-stage .fd-icon { font-size:20px; line-height:1; filter:grayscale(.45) brightness(.65); }
    .final-dungeon-track-stage.done { color:#9fbc77; border-color:#50663b; background:#172015; }
    .final-dungeon-track-stage.done .fd-icon { filter:none; }
    .final-dungeon-track-stage.current {
      color:#f2d183; border-color:#c38e3f; background:#352414;
      box-shadow:0 0 0 1px #6d4827,0 0 13px rgba(219,151,61,.18);
    }
    .final-dungeon-track-stage.current .fd-icon { filter:none; animation:fdStagePulse .9s steps(2,end) infinite; }
    @keyframes fdStagePulse { 50% { transform:translateY(-2px); filter:brightness(1.25); } }

    .final-dungeon-stage-card {
      padding:13px; border:2px solid #67462a; background:linear-gradient(180deg,#261812,#160e0a);
      box-shadow:inset 0 0 22px rgba(0,0,0,.38); text-align:center;
    }
    .final-dungeon-stage-kicker { color:#b99058; font:800 9px ui-monospace,monospace; letter-spacing:.18em; }
    .final-dungeon-stage-title { margin:7px 0 5px; color:#f0c66d; font-size:19px; }
    .final-dungeon-stage-objective { margin:0 auto 12px; color:#c8b697; font-size:11px; line-height:1.65; }
    .final-dungeon-d20 {
      width:76px; height:76px; margin:8px auto 12px; display:grid; place-items:center;
      clip-path:polygon(50% 0,93% 24%,93% 76%,50% 100%,7% 76%,7% 24%);
      background:linear-gradient(145deg,#a36d32,#503019 60%,#28160e); color:#ffe5a4;
      font:900 25px ui-monospace,monospace; filter:drop-shadow(0 5px 0 #080504);
    }
    .final-dungeon-roll-btn,.final-dungeon-continue-btn,.final-dungeon-altar-continue,.final-dungeon-throne-open {
      width:100%; min-height:48px; margin-top:5px;
    }
    .final-dungeon-roll-result {
      margin:10px 0; padding:11px; border:2px solid #5d4932; background:#100c09;
      color:#d9c7a5; font:800 12px ui-monospace,monospace; line-height:1.7;
    }
    .final-dungeon-roll-result.success { border-color:#67814d; color:#a9c77d; }
    .final-dungeon-roll-result.failed { border-color:#984f42; color:#e48b78; }
    .final-dungeon-altar { text-align:center; }
    .final-dungeon-seals { display:flex; justify-content:center; gap:7px; margin:13px 0; font-size:27px; }
    .final-dungeon-seals span { animation:fdSealGlow 1s steps(2,end) infinite; filter:drop-shadow(0 0 5px rgba(222,175,75,.5)); }
    .final-dungeon-seals span:nth-child(2){animation-delay:.12s}.final-dungeon-seals span:nth-child(3){animation-delay:.24s}.final-dungeon-seals span:nth-child(4){animation-delay:.36s}
    @keyframes fdSealGlow { 50% { transform:scale(1.1); filter:drop-shadow(0 0 10px rgba(255,204,91,.9)); } }
    .final-dungeon-throne-warning {
      margin-top:10px; padding:15px 12px; text-align:center; border:2px solid #9d4739;
      background:radial-gradient(circle at 50% 15%,rgba(180,48,38,.2),transparent 40%),#170b0b;
      box-shadow:inset 0 0 25px rgba(102,16,16,.35),0 0 15px rgba(178,51,39,.12);
    }
    .final-dungeon-throne-warning .dragon-mark { font-size:42px; margin-bottom:4px; }
    .final-dungeon-throne-warning h3 { margin:4px 0 7px; color:#e77863; letter-spacing:.08em; }
    .final-dungeon-throne-warning p { margin:0 0 9px; color:#c7a69c; font-size:11px; line-height:1.65; }

    .final-victory-overlay {
      position:fixed; inset:0; z-index:16000; display:grid; place-items:center;
      padding:max(18px,env(safe-area-inset-top)) 16px max(18px,env(safe-area-inset-bottom));
      background:radial-gradient(circle at 50% 30%, rgba(215,167,67,.14), transparent 34%),rgba(5,4,3,.94);
      opacity:0; transition:opacity .28s ease;
    }
    .final-victory-overlay.show { opacity:1; }
    .final-victory-card {
      width:min(560px,100%); text-align:center; padding:28px 18px 20px;
      color:#f3e4b8; background:#251a12; border:3px solid #a97d37;
      box-shadow:0 0 0 4px #090705,8px 8px 0 #090705,0 0 32px rgba(215,167,67,.13);
    }
    .final-victory-kicker { color:#8fa96d; letter-spacing:.22em; font:700 11px ui-monospace,monospace; }
    .final-victory-crown { font-size:58px; margin:10px 0 2px; filter:drop-shadow(0 0 12px rgba(215,167,67,.25)); }
    .final-victory-card h2 { margin:2px 0 10px; color:#e8bb59; font-size:clamp(28px,8vw,44px); letter-spacing:.08em; }
    .final-victory-card p { margin:0 auto 16px; max-width:430px; line-height:1.75; color:#d8c59f; font-size:13px; }
    .final-victory-stats { margin:15px 0; padding:10px; border:1px solid #654928; background:#17100c; color:#cdb785; font-size:12px; }
    .final-victory-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px; }
    .final-victory-actions button { min-height:48px; }
  `;
  document.head.appendChild(style);

  function enhanceCastleTiles(forceReveal = false) {
    worldMap.querySelectorAll('.map-node.region-dragon').forEach(tile => {
      const shouldReveal = forceReveal || tile.classList.contains('dragon-spawned') || !tile.classList.contains('deep-fog');
      if (shouldReveal && !tile.classList.contains('castle-ux-reveal')) tile.classList.add('castle-ux-reveal');
      if (!tile.classList.contains('castle-ux-reveal')) return;
      const icon = tile.querySelector('.node-icon');
      const name = tile.querySelector('.node-name');
      const type = tile.querySelector('.node-type');
      if (icon && !icon.querySelector('.dragon-castle-art')) icon.innerHTML = '<span class="dragon-castle-art"><span class="castle">🏰</span><span class="dragon">🐉</span></span>';
      if (name && name.textContent !== '용의 성') name.textContent = '용의 성';
      if (type && type.textContent !== 'FINAL DUNGEON') type.textContent = 'FINAL DUNGEON';
    });
  }

  window.DRAGON_CASTLE_UX = { revealVisibleCastle() { enhanceCastleTiles(true); } };

  let castleEnhanceScheduled = false;
  const castleObserver = new MutationObserver(() => {
    if (castleEnhanceScheduled) return;
    castleEnhanceScheduled = true;
    requestAnimationFrame(() => {
      castleEnhanceScheduled = false;
      enhanceCastleTiles(false);
    });
  });
  castleObserver.observe(worldMap, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  enhanceCastleTiles(false);

  // V0.6.6.0 — keep the proven core dungeon state machine intact and layer
  // player-controlled presentation over its modal beats. The core only advances
  // when this UX deliberately releases the existing modal Promise.
  const modalContent = document.querySelector('#modalContent');
  const modalCloseBtn = document.querySelector('#modalCloseBtn');
  const STAGES = [
    { icon:'🚪', name:'성문' },
    { icon:'🗿', name:'회랑' },
    { icon:'✨', name:'제단' },
    { icon:'🐉', name:'왕좌' },
  ];
  let processScheduled = false;
  let waitingCorridorResult = false;
  let throneBypass = false;

  function trackHTML(activeIndex) {
    const safe = Math.max(0, Math.min(3, Number(activeIndex) || 0));
    return `<div class="final-dungeon-track" aria-label="최종 던전 진행도">${STAGES.map((stage,index) => {
      const cls = index < safe ? 'done' : index === safe ? 'current' : '';
      return `<div class="final-dungeon-track-stage ${cls}" data-stage="${index}"><span class="fd-icon">${index < safe ? '✓' : stage.icon}</span><span>${stage.name}</span></div>`;
    }).join('')}</div>`;
  }

  function entryStageIndex(sheet) {
    const kicker = sheet?.querySelector('.status-kicker')?.textContent || '';
    const match = kicker.match(/(\d+)\s*\/\s*4/);
    return Math.max(0, Math.min(3, (Number(match?.[1]) || 1) - 1));
  }

  function enhanceEntrySheet(sheet) {
    if (!sheet || sheet.dataset.fdUxReady === '1') return;
    sheet.dataset.fdUxReady = '1';
    modalContent.dataset.fdUxStage = 'entry';
    const index = entryStageIndex(sheet);
    const head = sheet.querySelector('.event-card-head');
    if (head && !sheet.querySelector('.final-dungeon-track')) head.insertAdjacentHTML('afterend', trackHTML(index));
    const enter = sheet.querySelector('.final-dungeon-enter');
    const small = enter?.querySelector('small');
    if (small) small.textContent = `${['성문 수호자','봉인의 회랑','용의 제단','용의 왕좌'][index]}부터 진행`;
  }

  function decorateGuardianClear() {
    if (modalContent.dataset.fdUxStage === 'guardian-clear') return;
    modalContent.dataset.fdUxStage = 'guardian-clear';
    if (!modalContent.querySelector('.final-dungeon-track')) modalContent.insertAdjacentHTML('afterbegin', trackHTML(1));
  }

  function showCorridorRoll() {
    modalContent.dataset.fdUxStage = 'corridor-roll';
    modalCloseBtn.hidden = true;
    modalContent.innerHTML = `
      ${trackHTML(1)}
      <div class="final-dungeon-stage-card final-dungeon-corridor">
        <div class="final-dungeon-stage-kicker">STAGE 2 · TRIAL</div>
        <h3 class="final-dungeon-stage-title">🗿 봉인의 회랑</h3>
        <p class="final-dungeon-stage-objective">민첩 또는 행운으로 용염 함정을 돌파하라.<br><strong>목표 13</strong></p>
        <div class="final-dungeon-d20">D20</div>
        <button type="button" class="pixel-btn primary final-dungeon-roll-btn">🎲 D20 굴리기</button>
      </div>`;
    modalContent.querySelector('.final-dungeon-roll-btn')?.addEventListener('click', () => {
      waitingCorridorResult = true;
      modalCloseBtn.hidden = false;
      modalCloseBtn.click();
    }, { once:true });
  }

  function decorateCorridorResult(title, body) {
    const success = !title.includes('🔥');
    waitingCorridorResult = false;
    modalContent.dataset.fdUxStage = 'corridor-result';
    modalCloseBtn.hidden = true;
    modalContent.innerHTML = `
      ${trackHTML(1)}
      <div class="final-dungeon-stage-card">
        <div class="final-dungeon-stage-kicker">STAGE 2 · RESULT</div>
        <h3 class="final-dungeon-stage-title">${success ? '🗿 봉인의 회랑' : '🔥 봉인의 회랑'}</h3>
        <div class="final-dungeon-roll-result ${success ? 'success' : 'failed'}"><strong>${success ? 'SUCCESS' : 'FAILED'}</strong><br>${body}</div>
        <button type="button" class="pixel-btn primary final-dungeon-continue-btn">다음 구간으로 ▶</button>
      </div>`;
    modalContent.querySelector('.final-dungeon-continue-btn')?.addEventListener('click', () => {
      modalCloseBtn.hidden = false;
      modalCloseBtn.click();
    }, { once:true });
  }

  function showThroneWarning({ preserveEntryButton = null } = {}) {
    modalContent.dataset.fdUxStage = 'throne-warning';
    modalCloseBtn.hidden = true;
    const host = modalContent.querySelector('.final-dungeon-altar') || modalContent.querySelector('.final-dungeon-sheet') || modalContent;
    host.querySelector('.final-dungeon-throne-warning')?.remove();
    if (preserveEntryButton) {
      preserveEntryButton.hidden = true;
      const leave = host.querySelector('.final-dungeon-leave');
      if (leave) leave.hidden = true;
    }
    host.insertAdjacentHTML('beforeend', `
      <div class="final-dungeon-throne-warning">
        <div class="dragon-mark">🐉</div>
        <div class="final-dungeon-stage-kicker">FINAL STAGE · THRONE</div>
        <h3>ANCIENT DRAGON</h3>
        <p>이 문 너머에 고대 드래곤이 기다리고 있다.<br>마지막 전투를 시작하면 승리하거나 쓰러질 때까지 물러설 수 없다.</p>
        <button type="button" class="pixel-btn danger final-dungeon-throne-open">🚪 왕좌의 문 열기</button>
      </div>`);
    host.querySelector('.final-dungeon-throne-open')?.addEventListener('click', () => {
      if (preserveEntryButton) {
        throneBypass = true;
        preserveEntryButton.hidden = false;
        preserveEntryButton.click();
        throneBypass = false;
        return;
      }
      modalCloseBtn.hidden = false;
      modalCloseBtn.click();
    }, { once:true });
  }

  function decorateAltar(body) {
    modalContent.dataset.fdUxStage = 'altar';
    modalCloseBtn.hidden = true;
    modalContent.innerHTML = `
      ${trackHTML(2)}
      <div class="final-dungeon-stage-card final-dungeon-altar">
        <div class="final-dungeon-stage-kicker">STAGE 3 · THE FOUR SEALS ANSWER</div>
        <h3 class="final-dungeon-stage-title">✨ 용의 제단</h3>
        <div class="final-dungeon-seals" aria-label="네 개의 봉인석"><span>🗿</span><span>🗿</span><span>🗿</span><span>🗿</span></div>
        <p class="final-dungeon-stage-objective">${body}</p>
        <button type="button" class="pixel-btn primary final-dungeon-altar-continue">🐉 왕좌로 향한다</button>
      </div>`;
    modalContent.querySelector('.final-dungeon-altar-continue')?.addEventListener('click', () => showThroneWarning(), { once:true });
  }

  function processFinalDungeonModal() {
    if (!modalContent || !modalCloseBtn || modal?.classList.contains('hidden')) return;
    if (modalContent.querySelector('.final-dungeon-corridor') || modalContent.querySelector('.final-dungeon-altar') || modalContent.querySelector('.final-dungeon-throne-warning')) return;
    const entry = modalContent.querySelector('.final-dungeon-sheet');
    if (entry) {
      enhanceEntrySheet(entry);
      return;
    }
    const title = modalContent.querySelector('h3')?.textContent?.trim() || '';
    const body = modalContent.querySelector('p')?.textContent?.trim() || '';
    if (title.includes('성문 돌파')) {
      decorateGuardianClear();
      return;
    }
    if (waitingCorridorResult && title.includes('봉인의 회랑')) {
      decorateCorridorResult(title, body);
      return;
    }
    if (title.includes('용의 제단')) {
      decorateAltar(body);
      return;
    }
  }

  function scheduleFinalDungeonProcess() {
    if (processScheduled) return;
    processScheduled = true;
    requestAnimationFrame(() => {
      processScheduled = false;
      processFinalDungeonModal();
    });
  }

  if (modalContent && modalCloseBtn) {
    new MutationObserver(scheduleFinalDungeonProcess).observe(modalContent, { childList:true, subtree:true });
    if (modal) new MutationObserver(scheduleFinalDungeonProcess).observe(modal, { attributes:true, attributeFilter:['class'] });

    document.addEventListener('click', event => {
      const enter = event.target.closest?.('.final-dungeon-enter');
      if (enter && !throneBypass) {
        const sheet = enter.closest('.final-dungeon-sheet');
        if (entryStageIndex(sheet) === 3) {
          event.preventDefault();
          event.stopImmediatePropagation();
          showThroneWarning({ preserveEntryButton:enter });
          return;
        }
      }
      if (event.target === modalCloseBtn && modalContent.dataset.fdUxStage === 'guardian-clear') {
        event.preventDefault();
        event.stopImmediatePropagation();
        showCorridorRoll();
      }
    }, true);
    scheduleFinalDungeonProcess();
  }

  let endingShown = false;
  let endingScheduled = false;
  function isHidden(el) { return !el || el.classList.contains('hidden'); }
  function victoryReady() { return moveHint.textContent.includes('VICTORY') && isHidden(modal) && isHidden(combatOverlay); }
  function scheduleEnding() {
    if (endingShown || endingScheduled || !moveHint.textContent.includes('VICTORY')) return;
    endingScheduled = true;
    setTimeout(() => {
      endingScheduled = false;
      if (!victoryReady()) return;
      showEnding();
    }, 320);
  }
  function showEnding() {
    if (endingShown) return;
    endingShown = true;
    const overlay = document.createElement('section');
    overlay.className = 'final-victory-overlay';
    overlay.setAttribute('aria-label','게임 승리');
    overlay.innerHTML = `
      <div class="final-victory-card">
        <div class="final-victory-kicker">DRAGON SLAIN · KINGDOM SAVED</div>
        <div class="final-victory-crown">🏆</div>
        <h2>VICTORY</h2>
        <p>고대 드래곤이 쓰러졌다. 네 지역의 봉인이 완성되고 왕국을 뒤덮던 어둠이 걷힌다.<br><strong>모험은 여기서 끝난다.</strong></p>
        <div class="final-victory-stats">ROUND ${roundValue?.textContent || '-'} · 봉인석 ${sealValue?.textContent || '4 / 4'} · 🐉 고대 드래곤 토벌 완료</div>
        <div class="final-victory-actions">
          <button type="button" class="pixel-btn" data-victory-map>🗺️ 왕국 지도 보기</button>
          <button type="button" class="pixel-btn primary" data-victory-new>⚔ 새 모험</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.querySelector('[data-victory-map]')?.addEventListener('click', () => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 280);
    });
    overlay.querySelector('[data-victory-new]')?.addEventListener('click', () => location.reload());
  }

  new MutationObserver(scheduleEnding).observe(moveHint, { childList:true, characterData:true, subtree:true });
  if (modal) new MutationObserver(scheduleEnding).observe(modal, { attributes:true, attributeFilter:['class'] });
  if (combatOverlay) new MutationObserver(scheduleEnding).observe(combatOverlay, { attributes:true, attributeFilter:['class'] });
  scheduleEnding();
})();