// DRAGON BOARD V0.6.3.5 — safe DEV dragon castle preview + non-blocking entry
(() => {
  if (new URLSearchParams(location.search).get('dev') !== '1') return;

  const getApi = () => window.DRAGON_BOARD_DEV_API || null;
  const getCastleNode = () => (window.WORLD_NODES || []).find(node => node?.type === '드래곤성') || null;
  const getAreaMeta = areaId => window.WORLD_AREAS?.[areaId] || { themeLabel:'미지의 지역', icon:'🗺️' };

  function closeDevOverlay() {
    const overlay = document.querySelector('.dev-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('hidden', '');
  }

  function toast(text, bad = false) {
    document.querySelector('.dev-castle-toast')?.remove();
    const el = document.createElement('div');
    el.className = 'dev-castle-toast';
    el.textContent = text;
    Object.assign(el.style, {
      position:'fixed', left:'50%', top:'max(16px, env(safe-area-inset-top))', zIndex:'14050',
      transform:'translateX(-50%)', padding:'9px 12px', maxWidth:'90vw',
      border:`2px solid ${bad ? '#ae574d' : '#82a854'}`,
      background:'#21170f', color:'#f3e4b8', boxShadow:'3px 3px 0 #090705',
      font:'700 11px ui-monospace, monospace', textAlign:'center'
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function openCastlePreview() {
    closeDevOverlay();
    document.querySelector('.dev-castle-preview-overlay')?.remove();

    const castle = getCastleNode();
    if (!castle) {
      toast('드래곤 성 타일을 찾지 못했어. 성을 먼저 개방해.', true);
      return;
    }

    const meta = getAreaMeta(castle.areaId);
    const areaNodes = (window.WORLD_NODES || []).filter(node => node.areaId === castle.areaId);
    const overlay = document.createElement('div');
    overlay.className = 'dev-castle-preview-overlay';
    Object.assign(overlay.style, {
      position:'fixed', inset:'0', zIndex:'14020', background:'rgba(0,0,0,.9)',
      padding:'max(14px,env(safe-area-inset-top)) 14px max(14px,env(safe-area-inset-bottom))',
      display:'grid', placeItems:'center'
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      width:'min(560px,100%)', maxHeight:'94dvh', overflow:'auto', background:'#241a12',
      color:'#f3e4b8', border:'3px solid #8a6332', boxShadow:'6px 6px 0 #080604', padding:'12px',
      font:'11px ui-monospace, monospace'
    });
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px">
        <div><div style="font-size:9px;letter-spacing:.15em;color:#89a766">DEV CASTLE LOCATION</div><strong style="font-size:17px;color:#e8bb59">🏰🐉 드래곤의 성</strong></div>
        <button type="button" data-castle-preview-close style="border:1px solid #75583a;background:#3d2d20;color:#f3e4b8;padding:7px 10px">닫기</button>
      </div>
      <div style="padding:8px;background:#17100c;color:#c6b38d;margin-bottom:9px">${meta.icon || '🗺️'} ${meta.themeLabel || meta.name || '미지의 지역'} · 좌표 ${castle.x},${castle.y}</div>
      <div data-castle-mini-map style="position:relative;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:3px;aspect-ratio:1/1;background:#100c08;border:2px solid #513a27;padding:4px"></div>
      <div style="margin-top:9px;color:#b49e78;line-height:1.55">※ 이 화면은 위치 확인용 DEV 미리보기야. 영웅 위치·턴·MOVE는 변경하지 않아.</div>`;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const map = panel.querySelector('[data-castle-mini-map]');
    areaNodes.forEach(node => {
      const cell = document.createElement('div');
      const isCastle = node.id === castle.id;
      cell.style.gridColumn = String(node.x);
      cell.style.gridRow = String(node.y);
      Object.assign(cell.style, {
        minWidth:'0', minHeight:'0', display:'grid', placeItems:'center', textAlign:'center',
        border:isCastle ? '2px solid #e45b46' : '1px solid #504333',
        background:isCastle ? '#4b1716' : '#262019',
        boxShadow:isCastle ? '0 0 0 2px rgba(160,42,31,.65),0 0 15px rgba(235,73,49,.55)' : 'inset 0 0 7px rgba(0,0,0,.45)',
        fontSize:isCastle ? 'clamp(15px,5vw,27px)' : 'clamp(8px,2.6vw,14px)',
        overflow:'hidden'
      });
      cell.innerHTML = isCastle
        ? '<div><div>🏰</div><div style="font-size:.75em">🐉</div></div>'
        : `<span style="opacity:.5">${node.icon || '·'}</span>`;
      if (isCastle) cell.title = '드래곤의 성';
      map.appendChild(cell);
    });

    const close = () => overlay.remove();
    panel.querySelector('[data-castle-preview-close]')?.addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  }

  function installPreviewButton() {
    const grid = document.querySelector('.dev-grid');
    const api = getApi();
    if (!grid || !api || grid.querySelector('[data-dev-castle-preview]')) return false;
    const enterBtn = grid.querySelector('[data-act="dragonEnter"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dev-action primary dev-wide';
    btn.dataset.devCastlePreview = '1';
    btn.textContent = '👁️ 드래곤 성 위치 미리보기';
    if (enterBtn) enterBtn.insertAdjacentElement('afterend', btn);
    else grid.appendChild(btn);
    btn.addEventListener('click', openCastlePreview);
    return true;
  }

  // 기존 dev-mode.js의 dragonEnter await 핸들러보다 먼저 가로챈다.
  // DEV 패널을 즉시 닫고, 최종 던전 진입 Promise는 UI와 분리해 실행한다.
  document.addEventListener('click', event => {
    const btn = event.target.closest?.('[data-act="dragonEnter"]');
    if (!btn) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const api = getApi();
    const heroId = document.querySelector('[data-dev-hero]')?.value;
    const castle = getCastleNode();
    if (!api || !castle) {
      toast('드래곤 성을 먼저 개방해.', true);
      return;
    }

    closeDevOverlay();
    toast('🏰 드래곤 성 진입 준비…');

    requestAnimationFrame(() => {
      try {
        const task = api.enterDragonCastle(heroId);
        Promise.resolve(task).then(result => {
          if (result?.ok === false) toast(result.message || '드래곤 성 진입 실패', true);
        }).catch(error => {
          console.error('DEV dragon enter failed', error);
          toast(`드래곤 성 진입 오류 · ${error?.message || error}`, true);
        });
      } catch (error) {
        console.error('DEV dragon enter failed', error);
        toast(`드래곤 성 진입 오류 · ${error?.message || error}`, true);
      }
    });
  }, true);

  if (!installPreviewButton()) {
    const observer = new MutationObserver(() => { if (installPreviewButton()) observer.disconnect(); });
    observer.observe(document.body, { childList:true, subtree:true });
  }
})();