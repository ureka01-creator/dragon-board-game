// DRAGON BOARD V0.6.3.3 — DEV castle locator/preview
(() => {
  if (new URLSearchParams(location.search).get('dev') !== '1') return;

  function install() {
    const api = window.DRAGON_BOARD_DEV_API;
    const grid = document.querySelector('.dev-grid');
    const heroSel = document.querySelector('[data-dev-hero]');
    const message = document.querySelector('[data-dev-message]');
    const overlay = document.querySelector('.dev-overlay');
    const closeBtn = document.querySelector('[data-dev-close]');
    const activeHeroLabel = document.querySelector('#activeHeroLabel');
    if (!api || !grid || !heroSel || !message || !overlay || !closeBtn || grid.querySelector('[data-dev-castle-preview]')) return false;

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
      setTimeout(() => el.remove(), 1800);
    }

    btn.addEventListener('click', async () => {
      const snapshot = api.snapshot();
      if (!snapshot.dragonCastleSpawned) {
        message.textContent = '드래곤 성을 먼저 개방해.';
        message.style.borderLeftColor = '#ae574d';
        return;
      }

      // 먼저 DEV 패널을 닫는다. 이후 위치 탐색이 실패해도 오버레이가 남지 않는다.
      closeBtn.click();
      overlay.hidden = true;
      overlay.setAttribute('hidden', '');

      // 현재 턴 영웅을 찾아서 그 영웅으로 지역 뷰를 넘긴다.
      // 선택된 DEV 대상이 현재 턴 영웅이 아닐 때 viewAreaId가 바뀌지 않던 문제를 피한다.
      const activeText = activeHeroLabel?.textContent || '';
      const activeHero = (snapshot.heroes || []).find(h => activeText.includes(h.name)) || (snapshot.heroes || [])[0] || null;
      const heroId = activeHero?.id || heroSel.value;

      let found = null;
      let foundArea = null;
      for (const area of (snapshot.areas || [])) {
        api.teleportVillage(heroId, area.id);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const tile = document.querySelector('#worldMap .map-node.region-dragon');
        if (tile) { found = tile; foundArea = area; break; }
      }

      if (!found) {
        toast('드래곤 성 타일을 찾지 못했어.', true);
        return;
      }

      found.classList.add('castle-ux-reveal');
      window.DRAGON_CASTLE_UX?.revealVisibleCastle?.();
      toast(`🐉 드래곤 성 위치 · ${foundArea?.name || '현재 지역'}`);

      requestAnimationFrame(() => requestAnimationFrame(() => {
        const tile = document.querySelector('#worldMap .map-node.region-dragon');
        window.DRAGON_CASTLE_UX?.revealVisibleCastle?.();
        tile?.classList.add('castle-ux-reveal');
        tile?.scrollIntoView?.({ behavior:'smooth', block:'center', inline:'center' });
      }));
    });
    return true;
  }

  if (install()) return;
  const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
  observer.observe(document.body, { childList:true, subtree:true });
})();