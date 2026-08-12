// DRAGON BOARD V0.6.3.1 — DEV castle locator/preview
(() => {
  if (new URLSearchParams(location.search).get('dev') !== '1') return;

  function install() {
    const api = window.DRAGON_BOARD_DEV_API;
    const grid = document.querySelector('.dev-grid');
    const heroSel = document.querySelector('[data-dev-hero]');
    const message = document.querySelector('[data-dev-message]');
    const overlay = document.querySelector('.dev-overlay');
    if (!api || !grid || !heroSel || !message || grid.querySelector('[data-dev-castle-preview]')) return false;

    const enterBtn = grid.querySelector('[data-act="dragonEnter"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dev-action primary dev-wide';
    btn.dataset.devCastlePreview = '1';
    btn.textContent = '👁️ 드래곤 성 위치 보기';
    if (enterBtn) enterBtn.insertAdjacentElement('afterend', btn);
    else grid.appendChild(btn);

    btn.addEventListener('click', async () => {
      const snapshot = api.snapshot();
      if (!snapshot.dragonCastleSpawned) {
        message.textContent = '드래곤 성을 먼저 개방해.';
        message.style.borderLeftColor = '#ae574d';
        return;
      }
      const heroId = heroSel.value;
      let found = null;
      let foundArea = null;
      for (const area of (snapshot.areas || [])) {
        api.teleportVillage(heroId, area.id);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const tile = document.querySelector('#worldMap .map-node.region-dragon');
        if (tile) { found = tile; foundArea = area; break; }
      }
      if (!found) {
        message.textContent = '드래곤 성 타일을 찾지 못했어.';
        message.style.borderLeftColor = '#ae574d';
        return;
      }

      found.classList.add('castle-ux-reveal');
      window.DRAGON_CASTLE_UX?.revealVisibleCastle?.();
      message.textContent = `드래곤 성 위치: ${foundArea?.name || '현재 지역'} · 해당 지역 마을로 이동 완료`;
      message.style.borderLeftColor = '#82a854';
      if (overlay) overlay.hidden = true;
      setTimeout(() => {
        const tile = document.querySelector('#worldMap .map-node.region-dragon');
        window.DRAGON_CASTLE_UX?.revealVisibleCastle?.();
        tile?.scrollIntoView?.({ behavior:'smooth', block:'center', inline:'center' });
      }, 80);
    });
    return true;
  }

  if (install()) return;
  const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
  observer.observe(document.body, { childList:true, subtree:true });
})();