// DRAGON BOARD V0.6.2.2 — Traveler's Boots dice conversion UX
(() => {
  const gameLog = document.querySelector('#gameLog');
  const moveHint = document.querySelector('#moveHint');
  const diceValue = document.querySelector('#diceValue');
  const boardPanel = document.querySelector('.board-panel');
  if (!gameLog || !moveHint || !diceValue || !boardPanel) return;

  const style = document.createElement('style');
  style.textContent = `
    .boots-roll-notice {
      position: absolute;
      left: 50%;
      top: 52%;
      z-index: 28;
      transform: translate(-50%, -50%);
      min-width: min(78%, 340px);
      padding: 10px 14px;
      border: 3px solid #d7a743;
      background: rgba(26, 18, 12, .95);
      box-shadow: 4px 4px 0 #090705, 0 0 18px rgba(215,167,67,.28);
      color: #f3e4b8;
      text-align: center;
      pointer-events: none;
      animation: bootsRollPop .16s ease-out both;
    }
    .boots-roll-notice span {
      display: block;
      color: #d7a743;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .boots-roll-notice strong {
      display: block;
      font-size: 20px;
      letter-spacing: .04em;
    }
    @keyframes bootsRollPop {
      from { opacity: 0; transform: translate(-50%, -44%) scale(.92); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
  `;
  document.head.appendChild(style);

  let noticeTimer = null;
  function showBootConversion() {
    moveHint.textContent = '👢 여행자의 장화 발동! · 🎲 1 → 2';
    diceValue.textContent = '1→2';

    boardPanel.querySelector('.boots-roll-notice')?.remove();
    const notice = document.createElement('div');
    notice.className = 'boots-roll-notice';
    notice.setAttribute('role', 'status');
    notice.innerHTML = '<span>👢 여행자의 장화 발동!</span><strong>🎲 1 → 2</strong>';
    boardPanel.appendChild(notice);

    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.remove(), 880);
  }

  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const text = node?.textContent || '';
        if (text.includes('여행자의 장화') && text.includes('이동 주사위 1')) {
          showBootConversion();
          return;
        }
      }
    }
  }).observe(gameLog, { childList: true });
})();
