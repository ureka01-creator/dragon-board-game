// DRAGON BOARD V0.6.3.1 — dragon castle presentation + final victory screen
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
    .map-node.region-dragon.castle-ux-reveal .node-type {
      visibility: visible !important;
    }
    .map-node.region-dragon.castle-ux-reveal .node-icon {
      width:100%; min-height:30px; display:grid; place-items:center; position:relative;
      filter:none !important;
    }
    .dragon-castle-art { position:relative; display:inline-grid; place-items:center; line-height:1; }
    .dragon-castle-art .castle { font-size:clamp(22px,3.6vw,34px); filter:drop-shadow(0 2px 0 #090505) drop-shadow(0 0 5px rgba(255,98,62,.45)); }
    .dragon-castle-art .dragon { position:absolute; right:-9px; top:-7px; font-size:clamp(10px,1.7vw,15px); filter:drop-shadow(0 0 4px rgba(255,86,55,.8)); }
    .map-node.region-dragon.castle-ux-reveal .node-name { color:#ffd28a; font-weight:800; }
    .map-node.region-dragon.castle-ux-reveal .node-type { color:#df806c; }
    @keyframes dragonCastleUxPulse { 50% { filter:brightness(1.17); } }

    .final-victory-overlay {
      position:fixed; inset:0; z-index:16000; display:grid; place-items:center;
      padding:max(18px,env(safe-area-inset-top)) 16px max(18px,env(safe-area-inset-bottom));
      background:
        radial-gradient(circle at 50% 30%, rgba(215,167,67,.14), transparent 34%),
        rgba(5,4,3,.94);
      opacity:0; transition:opacity .28s ease;
    }
    .final-victory-overlay.show { opacity:1; }
    .final-victory-card {
      width:min(560px,100%); text-align:center; padding:28px 18px 20px;
      color:#f3e4b8; background:#251a12; border:3px solid #a97d37;
      box-shadow:0 0 0 4px #090705, 8px 8px 0 #090705, 0 0 32px rgba(215,167,67,.13);
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
      if (forceReveal || tile.classList.contains('dragon-spawned') || !tile.classList.contains('deep-fog')) {
        tile.classList.add('castle-ux-reveal');
      }
      if (!tile.classList.contains('castle-ux-reveal')) return;
      const icon = tile.querySelector('.node-icon');
      const name = tile.querySelector('.node-name');
      const type = tile.querySelector('.node-type');
      if (icon) icon.innerHTML = '<span class="dragon-castle-art"><span class="castle">🏰</span><span class="dragon">🐉</span></span>';
      if (name) name.textContent = '용의 성';
      if (type) type.textContent = 'FINAL DUNGEON';
    });
  }

  window.DRAGON_CASTLE_UX = {
    revealVisibleCastle() { enhanceCastleTiles(true); },
  };

  new MutationObserver(() => enhanceCastleTiles(false)).observe(worldMap, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });
  enhanceCastleTiles(false);

  let endingShown = false;
  let endingScheduled = false;
  function isHidden(el) { return !el || el.classList.contains('hidden'); }
  function victoryReady() {
    return moveHint.textContent.includes('VICTORY') && isHidden(modal) && isHidden(combatOverlay);
  }
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