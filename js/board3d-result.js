// DRAGON BOARD V0.6.1.6 — 3D dice result confirmation
(() => {
  let hookTimer = 0;
  let hideTimer = 0;

  function ensureStyles() {
    if (document.querySelector('#board3dResultStyles')) return;
    const style = document.createElement('style');
    style.id = 'board3dResultStyles';
    style.textContent = `
      .board3d-result-confirm{
        position:absolute;
        left:50%;
        bottom:16%;
        z-index:14;
        transform:translate(-50%,10px) scale(.94);
        opacity:0;
        pointer-events:none;
        min-width:120px;
        padding:7px 12px 8px;
        border:1px solid rgba(239,190,83,.86);
        background:linear-gradient(180deg,rgba(55,39,22,.96),rgba(27,19,12,.96));
        color:#f6df9d;
        box-shadow:0 8px 22px rgba(0,0,0,.38),0 0 18px rgba(221,165,58,.14);
        text-align:center;
        font-size:9px;
        letter-spacing:.45px;
        transition:opacity 150ms ease,transform 180ms cubic-bezier(.2,.8,.2,1);
      }
      .board3d-result-confirm strong{
        display:inline-block;
        margin-left:4px;
        color:#ffd36a;
        font-size:12px;
        text-shadow:0 0 10px rgba(255,190,70,.28);
      }
      .board3d-result-confirm.show{
        opacity:1;
        transform:translate(-50%,0) scale(1);
      }
      .board3d-result-confirm::before{
        content:'RESULT';
        display:block;
        margin-bottom:2px;
        color:#aa956d;
        font-size:6px;
        letter-spacing:1.2px;
      }
      @media(max-width:700px){
        .board3d-result-confirm{bottom:15%;min-width:112px;padding:6px 10px 7px;font-size:8px}
        .board3d-result-confirm strong{font-size:11px}
      }
    `;
    document.head.appendChild(style);
  }

  function getBadge() {
    const wrap = document.querySelector('.board3d-overlay .board3d-canvas-wrap');
    if (!wrap) return null;
    let badge = wrap.querySelector('.board3d-result-confirm');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'board3d-result-confirm';
      badge.setAttribute('aria-live', 'polite');
      wrap.appendChild(badge);
    }
    return badge;
  }

  function showResult(face) {
    clearTimeout(hideTimer);
    const badge = getBadge();
    if (!badge) return;
    badge.innerHTML = `🎲 D6 <strong>${face} 확정</strong>`;
    badge.classList.remove('show');
    void badge.offsetWidth;
    badge.classList.add('show');
  }

  function hideResult() {
    clearTimeout(hideTimer);
    const badge = document.querySelector('.board3d-result-confirm');
    if (!badge) return;
    badge.classList.remove('show');
  }

  function hookApi() {
    const api = window.DRAGON_BOARD_3D_API;
    if (!api || api.__diceResultConfirmHooked || typeof api.settleDice !== 'function') return false;

    const nativeSettle = api.settleDice.bind(api);
    const nativeStart = typeof api.startDiceRoll === 'function' ? api.startDiceRoll.bind(api) : null;
    const nativeHide = typeof api.hideDice === 'function' ? api.hideDice.bind(api) : null;

    api.startDiceRoll = (...args) => {
      hideResult();
      return nativeStart?.(...args);
    };

    api.settleDice = async (face, ...args) => {
      hideResult();
      const result = await nativeSettle(face, ...args);
      showResult(face);
      // 확정된 주사위와 숫자를 충분히 인지한 뒤 이동을 시작한다.
      await new Promise(resolve => setTimeout(resolve, 820));
      return result;
    };

    api.hideDice = (...args) => {
      hideTimer = setTimeout(hideResult, 120);
      return nativeHide?.(...args);
    };

    api.__diceResultConfirmHooked = true;
    return true;
  }

  ensureStyles();
  if (!hookApi()) {
    hookTimer = window.setInterval(() => {
      if (hookApi()) {
        clearInterval(hookTimer);
        hookTimer = 0;
      }
    }, 80);
  }
})();