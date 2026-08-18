// DRAGON BOARD V0.6.6.0 — interactive final dungeon presentation layer
(() => {
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  const modalCloseBtn = document.querySelector('#modalCloseBtn');
  if (!modal || !modalContent || !modalCloseBtn) return;

  const STAGES = [
    { icon:'🚪', short:'성문', name:'성문 수호자' },
    { icon:'🗿', short:'회랑', name:'봉인의 회랑' },
    { icon:'✨', short:'제단', name:'용의 제단' },
    { icon:'🐉', short:'왕좌', name:'용의 왕좌' },
  ];

  const style = document.createElement('style');
  style.id = 'final-dungeon-ux-v0660';
  style.textContent = `
    .final-dungeon-track{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:14px 0 16px;padding:10px 8px;border:2px solid #5e4429;background:linear-gradient(180deg,#17100c,#100b08);position:relative}
    .final-dungeon-track-stage{min-width:0;position:relative;text-align:center;color:#786a55}
    .final-dungeon-track-stage:not(:last-child)::after{content:'';position:absolute;left:67%;right:-39%;top:18px;height:2px;background:#4b3926;z-index:0}
    .final-dungeon-track-stage.done:not(:last-child)::after{background:#8fa96d}
    .final-dungeon-track-node{width:36px;height:36px;margin:0 auto 6px;display:grid;place-items:center;position:relative;z-index:1;border:2px solid #4d3a28;background:#21170f;font-size:18px;box-shadow:2px 2px 0 #090705}
    .final-dungeon-track-stage.done .final-dungeon-track-node{border-color:#7f9862;background:#25301d}
    .final-dungeon-track-stage.current .final-dungeon-track-node{border-color:#d7a743;background:#3b2917;box-shadow:0 0 0 2px #6f4e1d,2px 2px 0 #090705;animation:fdCurrentPulse .9s steps(2,end) infinite}
    .final-dungeon-track-label{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;letter-spacing:.04em}
    .final-dungeon-track-stage.done .final-dungeon-track-label{color:#9eb681}.final-dungeon-track-stage.current .final-dungeon-track-label{color:#e5bb63;font-weight:800}
    .final-dungeon-hero-token{display:block;margin-top:4px;font-size:11px;color:#f0c45f}
    @keyframes fdCurrentPulse{50%{filter:brightness(1.25);transform:translateY(-1px)}}

    .final-dungeon-stage-shell,.final-dungeon-altar,.final-dungeon-throne-warning{text-align:left}
    .final-dungeon-stage-kicker{color:#8fa96d;letter-spacing:.2em;font-size:10px;font-weight:800}
    .final-dungeon-stage-title{margin:8px 0 5px;color:#e7bd64;font-size:23px}
    .final-dungeon-stage-copy{color:#cdbb96;font-size:12px;line-height:1.65}
    .final-dungeon-stage-objective{margin:13px 0;padding:11px;border-left:4px solid #8fa96d;background:#17100c;color:#e1cfa6;font-size:12px;line-height:1.55}
    .final-dungeon-roll-zone{display:grid;place-items:center;gap:10px;margin:14px 0 4px}
    .final-dungeon-d20{width:76px;height:76px;display:grid;place-items:center;border:3px solid #a97932;background:#2d1d11;color:#f2cb72;font-size:28px;font-weight:900;clip-path:polygon(50% 0,91% 19%,100% 62%,72% 100%,28% 100%,0 62%,9% 19%);filter:drop-shadow(3px 5px 0 #090705)}
    .final-dungeon-d20.rolling{animation:fdD20Shake .09s steps(2,end) infinite}@keyframes fdD20Shake{50%{transform:rotate(5deg) scale(1.05)}}
    .final-dungeon-roll-btn,.final-dungeon-continue-btn,.final-dungeon-altar-continue,.final-dungeon-throne-open{width:100%;min-height:50px;touch-action:manipulation}
    .final-dungeon-roll-result{width:100%;min-height:76px;padding:12px;border:2px solid #5e4429;background:#120c09;text-align:center;color:#cdbb96;line-height:1.55}
    .final-dungeon-roll-result strong{display:block;margin-bottom:5px;color:#f0c45f;font-size:20px;letter-spacing:.08em}
    .final-dungeon-roll-result.success{border-color:#728d52}.final-dungeon-roll-result.success strong{color:#a9c87e}
    .final-dungeon-roll-result.failed{border-color:#985044}.final-dungeon-roll-result.failed strong{color:#d97866}
    .final-dungeon-guardian-clear{margin-top:10px;padding:11px;border:1px solid #556a42;background:#162012;color:#aec88b;font-size:11px;line-height:1.6}

    .final-dungeon-seals{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:16px 0}
    .final-dungeon-seal{min-height:54px;display:grid;place-items:center;border:2px solid #75603a;background:#18110c;font-size:24px;animation:fdSealGlow 1.15s steps(2,end) infinite}
    .final-dungeon-seal:nth-child(2){animation-delay:.12s}.final-dungeon-seal:nth-child(3){animation-delay:.24s}.final-dungeon-seal:nth-child(4){animation-delay:.36s}
    @keyframes fdSealGlow{50%{border-color:#c29a4b;filter:brightness(1.22)}}
    .final-dungeon-recovery{margin:12px 0 16px;padding:12px;border:2px solid #5c7046;background:#172013;color:#bed39f;line-height:1.65;font-size:12px}
    .final-dungeon-throne-warning{text-align:center}.final-dungeon-throne-dragon{font-size:58px;margin:7px 0 2px;filter:drop-shadow(0 0 10px rgba(207,72,53,.42))}
    .final-dungeon-throne-warning h3{margin:4px 0;color:#dc725d;letter-spacing:.09em;font-size:23px}
    .final-dungeon-throne-warning .final-dungeon-stage-copy{margin:10px auto 15px;max-width:390px}
    .final-dungeon-throne-status{margin:10px 0 15px;padding:10px;border:2px solid #6c392f;background:#1d0e0c;color:#d8baa3;font-size:11px}
    @media(max-width:520px){.final-dungeon-track{gap:3px;padding:9px 5px}.final-dungeon-track-node{width:32px;height:32px;font-size:16px}.final-dungeon-track-stage:not(:last-child)::after{top:16px}.final-dungeon-track-label{font-size:8px}.final-dungeon-stage-title{font-size:20px}}
  `;
  document.head.appendChild(style);

  let scheduled = false;
  let waitingCorridorResult = false;
  let corridorRelease = null;
  let bypassEntryIntercept = false;

  function resetCoreCloseButton({ hide = false } = {}) {
    modalCloseBtn.classList.remove('final-dungeon-continue-btn');
    delete modalCloseBtn.dataset.finalDungeonAction;
    modalCloseBtn.textContent = '확인';
    modalCloseBtn.hidden = hide;
  }

  function trackHTML(currentIndex) {
    const current = Math.max(0,Math.min(3,Number(currentIndex) || 0));
    return `<div class="final-dungeon-track" data-final-dungeon-stage="${current}" aria-label="최종 던전 진행도">${STAGES.map((stage,index) => {
      const cls = index < current ? 'done' : index === current ? 'current' : '';
      return `<div class="final-dungeon-track-stage ${cls}"><span class="final-dungeon-track-node">${index < current ? '✓' : stage.icon}</span><span class="final-dungeon-track-label">${stage.short}</span>${index === current ? '<span class="final-dungeon-hero-token">▲</span>' : ''}</div>`;
    }).join('')}</div>`;
  }

  function inferEntryIndex(sheet) {
    const spans = [...(sheet?.querySelectorAll('.dungeon-progress span') || [])];
    if (spans.length) {
      const current = spans.findIndex(span => span.classList.contains('current'));
      if (current >= 0) return Math.min(3,current);
      return Math.min(3,spans.filter(span => span.classList.contains('done')).length);
    }
    const kicker = sheet?.querySelector('.status-kicker')?.textContent || '';
    const match = kicker.match(/(\d+)\s*\/\s*4/);
    return Math.max(0,Math.min(3,(Number(match?.[1]) || 1)-1));
  }

  function enhanceEntrySheet(sheet) {
    if (!sheet || sheet.dataset.finalDungeonUxReady === '1') return;
    resetCoreCloseButton({ hide:true });
    sheet.dataset.finalDungeonUxReady = '1';
    const index = inferEntryIndex(sheet);
    const oldProgress = sheet.querySelector('.dungeon-progress');
    if (oldProgress) oldProgress.style.display = 'none';
    const head = sheet.querySelector('.event-card-head');
    (head || sheet).insertAdjacentHTML(head ? 'afterend' : 'afterbegin',trackHTML(index));
    const enter = sheet.querySelector('.final-dungeon-enter');
    const labels = ['⚔ 성문 수호자에게 도전','🗿 봉인의 회랑으로 진입','✨ 용의 제단으로 이동','🐉 용의 왕좌로 진입'];
    if (enter) enter.textContent = labels[index];
  }

  function clickCoreClose() {
    resetCoreCloseButton();
    modalCloseBtn.click();
  }

  function clickOriginalEntry(button) {
    bypassEntryIntercept = true;
    try { button.click(); }
    finally { bypassEntryIntercept = false; }
  }

  function showCorridorPrompt({ entryButton = null } = {}) {
    resetCoreCloseButton({ hide:true });
    corridorRelease = entryButton ? () => clickOriginalEntry(entryButton) : () => clickCoreClose();
    modalContent.innerHTML = `
      <div class="final-dungeon-stage-shell final-dungeon-corridor" data-final-dungeon-ux="corridor-prompt">
        <div class="final-dungeon-stage-kicker">FINAL DUNGEON · STAGE 2/4</div>
        ${trackHTML(1)}
        <h3 class="final-dungeon-stage-title">🗿 봉인의 회랑</h3>
        <div class="final-dungeon-stage-copy">네 개의 봉인석이 잠든 회랑을 통과해야 한다. 벽 사이로 용염 함정이 깨어난다.</div>
        <div class="final-dungeon-stage-objective"><strong>민첩 또는 행운 판정</strong><br>더 높은 보정치를 사용해 함정을 돌파하라 · <strong>목표 13</strong></div>
        <div class="final-dungeon-roll-zone">
          <div class="final-dungeon-d20" data-final-dungeon-d20>?</div>
          <button type="button" class="pixel-btn primary final-dungeon-roll-btn">🎲 D20 굴리기</button>
          <div class="final-dungeon-roll-result" aria-live="polite">버튼을 누르면 실제 판정이 시작돼.</div>
        </div>
      </div>`;
    const die = modalContent.querySelector('[data-final-dungeon-d20]');
    const roll = modalContent.querySelector('.final-dungeon-roll-btn');
    roll?.addEventListener('click',() => {
      roll.disabled = true;
      die?.classList.add('rolling');
      let frame = 0;
      const ticker = setInterval(() => { if (die) die.textContent = String(((++frame * 7 + 3) % 20) + 1); },55);
      waitingCorridorResult = true;
      setTimeout(() => {
        clearInterval(ticker);
        const release = corridorRelease;
        corridorRelease = null;
        release?.();
      },260);
    },{once:true});
  }

  function parseCorridorResult(textValue) {
    const text = String(textValue || '').replace(/\s+/g,' ').trim();
    const match = text.match(/D20\s*(\d+)\s*\+\s*(?:보정\s*)?([+-]?\d+)\s*=\s*(\d+)/i);
    const die = match ? Number(match[1]) : null;
    const bonus = match ? Number(match[2]) : null;
    const total = match ? Number(match[3]) : null;
    const success = Number.isFinite(total) ? total >= 13 : !/피해|폭발|실패/.test(text);
    const damage = text.match(/HP\s*(\d+)\s*피해/)?.[1] || text.match(/HP\s*-\s*(\d+)/)?.[1] || null;
    return { text,die,bonus,total,success,damage };
  }

  function showCorridorResult(bodyText) {
    waitingCorridorResult = false;
    const result = parseCorridorResult(bodyText);
    modalContent.innerHTML = `
      <div class="final-dungeon-stage-shell final-dungeon-corridor" data-final-dungeon-ux="corridor-result">
        <div class="final-dungeon-stage-kicker">FINAL DUNGEON · STAGE 2/4</div>
        ${trackHTML(1)}
        <h3 class="final-dungeon-stage-title">${result.success ? '🗿' : '🔥'} 봉인의 회랑</h3>
        <div class="final-dungeon-roll-zone">
          <div class="final-dungeon-d20">${Number.isFinite(result.die) ? result.die : '!'}</div>
          <div class="final-dungeon-roll-result ${result.success ? 'success' : 'failed'}"><strong>${result.success ? 'SUCCESS' : 'FAILED'}</strong>${Number.isFinite(result.total) ? `D20 ${result.die} + 보정 ${result.bonus} = ${result.total}` : result.text}<br>${result.success ? '봉인석의 힘이 함정을 잠재웠다. 회랑 돌파 성공.' : `용염 함정이 폭발했다.${result.damage ? ` HP ${result.damage} 피해.` : ''} 그래도 회랑은 돌파했다.`}</div>
        </div>
      </div>`;
    // Use the core button itself. It lives outside #modalContent, so WebKit cannot
    // detach it if another observer refreshes the modal body.
    modalCloseBtn.hidden = false;
    modalCloseBtn.textContent = '다음 구간으로 이동 ▶';
    modalCloseBtn.classList.add('final-dungeon-continue-btn');
    modalCloseBtn.dataset.finalDungeonAction = 'corridor-continue';
  }

  function decorateGuardianClear() {
    if (modalContent.dataset.finalDungeonUxStage === 'guardian-clear') return;
    resetCoreCloseButton();
    modalContent.dataset.finalDungeonUxStage = 'guardian-clear';
    if (!modalContent.querySelector('.final-dungeon-track')) modalContent.insertAdjacentHTML('afterbegin',trackHTML(1));
    if (!modalContent.querySelector('.final-dungeon-guardian-clear')) modalContent.insertAdjacentHTML('beforeend','<div class="final-dungeon-guardian-clear">✓ 성문 수호자 격파 · 다음은 봉인의 회랑이다.</div>');
  }

  function showThroneWarning({ entryButton = null } = {}) {
    resetCoreCloseButton({ hide:true });
    modalContent.innerHTML = `
      <div class="final-dungeon-throne-warning" data-final-dungeon-ux="throne-warning">
        <div class="final-dungeon-stage-kicker">FINAL DUNGEON · STAGE 4/4</div>
        ${trackHTML(3)}
        <div class="final-dungeon-throne-dragon">🐉</div>
        <h3>ANCIENT DRAGON</h3>
        <div class="final-dungeon-stage-copy">왕좌의 문 너머에서 고대 드래곤의 숨결이 들린다.<br>이 문을 열면 마지막 전투가 시작된다.</div>
        <div class="final-dungeon-throne-status">❤️ 회복 완료 · 🗿 봉인석 4/4 · 최종 전투 준비</div>
        <button type="button" class="pixel-btn danger final-dungeon-throne-open">🚪 왕좌의 문 열기</button>
      </div>`;
    modalContent.querySelector('.final-dungeon-throne-open')?.addEventListener('click',() => {
      if (entryButton) clickOriginalEntry(entryButton);
      else clickCoreClose();
    },{once:true});
  }

  function enhanceAltar(bodyText) {
    resetCoreCloseButton({ hide:true });
    const recovery = String(bodyText || '').replace(/\s+/g,' ').trim() || '봉인석이 영웅의 힘을 회복시킨다.';
    modalContent.innerHTML = `
      <div class="final-dungeon-altar" data-final-dungeon-ux="altar">
        <div class="final-dungeon-stage-kicker">FINAL DUNGEON · STAGE 3/4</div>
        ${trackHTML(2)}
        <h3 class="final-dungeon-stage-title">✨ 용의 제단</h3>
        <div class="final-dungeon-stage-copy">네 지역에서 모은 봉인석이 마지막 힘을 내어 왕좌의 봉인을 연다.</div>
        <div class="final-dungeon-seals" aria-label="네 개의 봉인석"><span class="final-dungeon-seal">🗿</span><span class="final-dungeon-seal">🗿</span><span class="final-dungeon-seal">🗿</span><span class="final-dungeon-seal">🗿</span></div>
        <div class="final-dungeon-recovery">${recovery}</div>
        <button type="button" class="pixel-btn primary final-dungeon-altar-continue">🐉 왕좌의 봉인 해제</button>
      </div>`;
    modalContent.querySelector('.final-dungeon-altar-continue')?.addEventListener('click',() => showThroneWarning(),{once:true});
  }

  function enhanceCurrentModal() {
    scheduled = false;
    if (modal.classList.contains('hidden')) return;
    const custom = modalContent.querySelector('[data-final-dungeon-ux]');
    if (custom) return;
    const entry = modalContent.querySelector('.final-dungeon-sheet');
    if (entry) { enhanceEntrySheet(entry); return; }
    const title = modalContent.querySelector('h3')?.textContent?.trim() || '';
    const body = modalContent.querySelector('p')?.textContent?.trim() || '';
    if (title.includes('성문 돌파')) { decorateGuardianClear(); return; }
    if (waitingCorridorResult && title.includes('봉인의 회랑')) { showCorridorResult(body); return; }
    if (title.includes('용의 제단')) enhanceAltar(body);
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(enhanceCurrentModal);
  }

  document.addEventListener('click',event => {
    const enter = event.target.closest?.('.final-dungeon-enter');
    if (enter && !bypassEntryIntercept) {
      const index = inferEntryIndex(enter.closest('.final-dungeon-sheet'));
      if (index === 1) {
        event.preventDefault();event.stopImmediatePropagation();
        showCorridorPrompt({entryButton:enter});
        return;
      }
      if (index === 3) {
        event.preventDefault();event.stopImmediatePropagation();
        showThroneWarning({entryButton:enter});
        return;
      }
    }
    if (event.target === modalCloseBtn && modalContent.dataset.finalDungeonUxStage === 'guardian-clear') {
      event.preventDefault();event.stopImmediatePropagation();
      delete modalContent.dataset.finalDungeonUxStage;
      showCorridorPrompt();
      return;
    }
    if (event.target === modalCloseBtn && modalCloseBtn.dataset.finalDungeonAction === 'corridor-continue') {
      // Do not prevent the core close handler. Just clean our decoration first.
      modalCloseBtn.classList.remove('final-dungeon-continue-btn');
      delete modalCloseBtn.dataset.finalDungeonAction;
      modalCloseBtn.textContent = '확인';
    }
  },true);

  new MutationObserver(scheduleEnhance).observe(modalContent,{childList:true,subtree:true});
  new MutationObserver(scheduleEnhance).observe(modal,{attributes:true,attributeFilter:['class']});
  scheduleEnhance();
})();