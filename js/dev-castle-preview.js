// DRAGON BOARD V0.6.3.4 — DEV castle locator/preview without mutating game state
(() => {
  if (new URLSearchParams(location.search).get('dev') !== '1') return;

  function install() {
    const api = window.DRAGON_BOARD_DEV_API;
    const grid = document.querySelector('.dev-grid');
    const message = document.querySelector('[data-dev-message]');
    const overlay = document.querySelector('.dev-overlay');
    const closeBtn = document.querySelector('[data-dev-close]');
    if (!api || !grid || !message || !overlay || !closeBtn || grid.querySelector('[data-dev-castle-preview]')) return false;

    const enterBtn = grid.querySelector('[data-act="dragonEnter"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dev-action primary dev-wide';
    btn.dataset.devCastlePreview = '1';
    btn.textContent = '👁️ 드래곤 성 위치 보기';
    if (enterBtn) enterBtn.insertAdjacentElement('afterend', btn);
    else grid.appendChild(btn);

    function toast(text, bad = false) {
      document.querySelector('.dev-castle-toast')?.remove();
      const el = document.createElement('div');
      el.className = 'dev-castle-toast';
      el.textContent = text;
      Object.assign(el.style, {
        position:'fixed', left:'50%', top:'max(16px, env(safe-area-inset-top))', zIndex:'13050',
        transform:'translateX(-50%)', padding:'9px 12px', maxWidth:'88vw',
        border:`2px solid ${bad ? '#ae574d' : '#82a854'}`,
        background:'#21170f', color:'#f3e4b8', boxShadow:'3px 3px 0 #090705',
        font:'700 11px ui-monospace, monospace', textAlign:'center'
      });
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }

    const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    btn.addEventListener('click', async () => {
      const snapshot = api.snapshot();
      if (!snapshot.dragonCastleSpawned) {
        message.textContent = '드래곤 성을 먼저 개방해.';
        message.style.borderLeftColor = '#ae574d';
        return;
      }

      // 위치 보기는 게임 상태를 절대 바꾸지 않는다.
      // 먼저 DEV 패널을 닫고, 지역 네비게이터의 🐉 표시만 이용해 화면을 전환한다.
      closeBtn.click();
      overlay.hidden = true;
      overlay.setAttribute('hidden', '');

      await nextFrame();
      const regionButtons = [...document.querySelectorAll('#regionNavigator .region-nav-btn')];
      const dragonRegionBtn = regionButtons.find(regionBtn =>
        (regionBtn.querySelector('.region-icon')?.textContent || '').includes('🐉')
      );

      if (!dragonRegionBtn) {
        toast('드래곤 성이 있는 지역 표시를 찾지 못했어.', true);
        return;
      }

      const areaName = dragonRegionBtn.querySelector('small')?.textContent?.replace(/\s*·.*$/, '') || '드래곤 성 지역';
      dragonRegionBtn.click();
      await nextFrame();

      const tile = document.querySelector('#worldMap .map-node.region-dragon');
      if (!tile) {
        toast('현재 이동/전투 상태라 지역 화면을 바꿀 수 없어.', true);
        return;
      }

      // DEV 미리보기에서만 성의 외형을 보이게 한다. 실제 탐험/영웅 위치는 변경하지 않는다.
      tile.classList.add('castle-ux-reveal');
      window.DRAGON_CASTLE_UX?.revealVisibleCastle?.();
      tile.classList.add('castle-ux-reveal');
      tile.scrollIntoView?.({ behavior:'smooth', block:'center', inline:'center' });
      toast(`🐉 드래곤 성 위치 · ${areaName}`);
    });
    return true;
  }

  if (install()) return;
  const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
  observer.observe(document.body, { childList:true, subtree:true });
})();