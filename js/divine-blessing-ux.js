// DRAGON BOARD V0.6.4.4 — HP 0 / divine blessing explanation + iOS scroll lock
(() => {
  const gameLog = document.querySelector('#gameLog');
  const combatOverlay = document.querySelector('#combatOverlay');
  const modal = document.querySelector('#modal');
  if (!gameLog) return;

  const style = document.createElement('style');
  style.textContent = `
    .blessing-overlay{position:fixed;inset:0;z-index:13050;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:18px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
    .blessing-overlay[hidden]{display:none!important}
    .blessing-card{width:min(520px,100%);margin:auto;background:#2a1d13;border:3px solid #b78a43;box-shadow:6px 6px 0 #080604;padding:18px;color:#f3e4b8;font:inherit}
    .blessing-kicker{color:#89a766;font-size:10px;letter-spacing:.18em;margin-bottom:8px}
    .blessing-title{font-size:24px;color:#e8bb59;margin:0 0 12px}
    .blessing-copy{line-height:1.7;color:#e1d2ad;margin:0 0 10px}
    .blessing-destination{margin:10px 0;padding:9px;background:#17100c;border-left:3px solid #89a766;color:#cdb98e}
    .blessing-rule{font-size:11px;line-height:1.55;color:#b9a27b;margin:10px 0 14px}
    .blessing-ok{width:100%;border:3px solid #82a854;background:#496a32;color:#f3e4b8;padding:12px;font:inherit;touch-action:manipulation}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'blessing-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `<div class="blessing-card" role="dialog" aria-modal="true" aria-label="신의 가호 안내">
    <div class="blessing-kicker">DIVINE BLESSING</div>
    <h3 class="blessing-title">✨ 신의 가호</h3>
    <p class="blessing-copy"><strong data-blessing-hero>영웅</strong>의 HP가 0이 되어 쓰러졌어.</p>
    <p class="blessing-copy">하지만 신의 가호가 영웅을 감싸 안전한 마을로 귀환시켰다.</p>
    <div class="blessing-destination" data-blessing-destination>🏠 해당 지역 마을로 귀환</div>
    <div class="blessing-rule">다음 라운드 시작 시 <strong>HP를 전부 회복</strong>하고 부활해. MANA가 있는 영웅은 MANA도 전부 회복한다.</div>
    <button type="button" class="blessing-ok">확인</button>
  </div>`;
  document.body.appendChild(overlay);

  const queue = [];
  let showing = false;
  let scrollLock = null;

  function lockPageScroll() {
    if (scrollLock) return;
    const body = document.body;
    const root = document.documentElement;
    const y = window.scrollY || window.pageYOffset || 0;
    scrollLock = {
      y,
      body: {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow,
      },
      root: {
        overflow: root.style.overflow,
        overscrollBehavior: root.style.overscrollBehavior,
      },
    };
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
  }

  function unlockPageScroll() {
    if (!scrollLock) return;
    const body = document.body;
    const root = document.documentElement;
    const saved = scrollLock;
    scrollLock = null;
    body.style.position = saved.body.position;
    body.style.top = saved.body.top;
    body.style.left = saved.body.left;
    body.style.right = saved.body.right;
    body.style.width = saved.body.width;
    body.style.overflow = saved.body.overflow;
    root.style.overflow = saved.root.overflow;
    root.style.overscrollBehavior = saved.root.overscrollBehavior;
    window.scrollTo(0, saved.y);
  }

  function blocked() {
    const inCombat = combatOverlay && !combatOverlay.classList.contains('hidden');
    const modalOpen = modal && !modal.classList.contains('hidden');
    return inCombat || modalOpen;
  }

  function parseNotice(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean.includes('쓰러짐') || !clean.includes('마을 귀환')) return null;
    const before = clean.split('쓰러짐')[0].replace(/^💀\s*/, '').replace(/^✨\s*/, '').trim();
    const hero = before.replace(/^[^가-힣A-Za-z0-9]+\s*/, '').trim() || '영웅';
    const arrow = clean.match(/→\s*(.+?)\s*마을 귀환/);
    const destination = arrow?.[1]?.trim() || '해당 지역';
    return { hero, destination };
  }

  function pump() {
    if (showing || !queue.length || blocked()) return;
    const notice = queue.shift();
    showing = true;
    overlay.querySelector('[data-blessing-hero]').textContent = notice.hero;
    overlay.querySelector('[data-blessing-destination]').textContent = `🏠 ${notice.destination} 마을로 귀환`;
    lockPageScroll();
    overlay.hidden = false;
  }

  overlay.querySelector('.blessing-ok')?.addEventListener('click', () => {
    overlay.hidden = true;
    showing = false;
    unlockPageScroll();
    setTimeout(pump, 30);
  });

  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        const notice = parseNotice(node?.textContent);
        if (notice) queue.push(notice);
      }
    }
    pump();
  }).observe(gameLog, { childList:true });

  if (combatOverlay) new MutationObserver(pump).observe(combatOverlay, { attributes:true, attributeFilter:['class'] });
  if (modal) new MutationObserver(pump).observe(modal, { attributes:true, attributeFilter:['class'] });
})();
