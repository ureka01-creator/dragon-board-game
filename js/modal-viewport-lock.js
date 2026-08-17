// DRAGON BOARD V0.6.5.6 — iPhone visual-viewport anchored modal
(() => {
  const modal = document.querySelector('#modal');
  const root = document.documentElement;
  const body = document.body;
  if (!modal || !root || !body) return;

  // game.js의 기존 body fixed 잠금은 iPhone Safari에서 현재 스크롤 위치를
  // 기준으로 모달을 화면 밖에 배치할 수 있다. body는 항상 정상 흐름에 둔다.
  const guardStyle = document.createElement('style');
  guardStyle.id = 'dragon-modal-viewport-guard';
  guardStyle.textContent = `
    body.modal-open {
      position: static !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      width: auto !important;
    }
    #modal.dragon-vv-modal:not(.hidden) {
      position: absolute !important;
      inset: auto !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      z-index: 10000 !important;
    }
    #modal.dragon-vv-modal:not(.hidden) > .modal-card {
      max-height: calc(var(--dragon-vv-height, 100vh) - 24px) !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch;
    }
  `;
  document.head.appendChild(guardStyle);

  let active = false;
  let savedScrollY = 0;
  let savedOverscroll = '';
  let rafId = 0;

  const vv = window.visualViewport;

  function currentDocumentY() {
    const fixedTop = Number.parseFloat(body.style.top || '0');
    if (Number.isFinite(fixedTop) && fixedTop < 0) return -fixedTop;
    return window.scrollY || root.scrollTop || 0;
  }

  function clearLegacyBodyGeometry() {
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    // game.js가 넣은 overflow 값이 있으면 제거하되 페이지 자체 overflow는 건드리지 않는다.
    if (body.style.overflow === 'hidden') body.style.overflow = '';
    if (root.style.overflow === 'hidden') root.style.overflow = '';
  }

  function viewportMetrics() {
    return {
      top: (window.scrollY || root.scrollTop || savedScrollY || 0) + (vv?.offsetTop || 0),
      left: (vv?.offsetLeft || 0),
      width: Math.max(1, vv?.width || root.clientWidth || window.innerWidth),
      height: Math.max(1, vv?.height || window.innerHeight || root.clientHeight),
    };
  }

  function applyModalGeometry() {
    if (!active || modal.classList.contains('hidden')) return;
    const m = viewportMetrics();
    modal.classList.add('dragon-vv-modal');
    modal.style.setProperty('top', `${m.top}px`, 'important');
    modal.style.setProperty('left', `${m.left}px`, 'important');
    modal.style.setProperty('width', `${m.width}px`, 'important');
    modal.style.setProperty('height', `${m.height}px`, 'important');
    modal.style.setProperty('max-height', `${m.height}px`, 'important');
    modal.style.setProperty('--dragon-vv-height', `${m.height}px`);
  }

  function scheduleGeometry() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(applyModalGeometry);
  }

  function clearModalGeometry() {
    cancelAnimationFrame(rafId);
    modal.classList.remove('dragon-vv-modal');
    ['top','left','width','height','max-height','--dragon-vv-height'].forEach(prop => {
      modal.style.removeProperty(prop);
    });
  }

  function sync() {
    const open = !modal.classList.contains('hidden');

    if (open) {
      if (!active) {
        savedScrollY = currentDocumentY();
        savedOverscroll = root.style.overscrollBehavior || '';
        active = true;
      }

      clearLegacyBodyGeometry();
      root.style.overscrollBehavior = 'none';
      applyModalGeometry();
      return;
    }

    if (!active) return;

    clearModalGeometry();
    clearLegacyBodyGeometry();
    root.style.overscrollBehavior = savedOverscroll;
    active = false;

    const restoreY = savedScrollY;
    requestAnimationFrame(() => {
      if (Math.abs((window.scrollY || 0) - restoreY) > 1) {
        window.scrollTo({ top: restoreY, left: 0, behavior: 'auto' });
      }
    });
  }

  // 모달 카드 안쪽은 스크롤 허용, 배경은 iOS rubber-band를 막는다.
  document.addEventListener('touchmove', (event) => {
    if (!active) return;
    if (event.target.closest?.('.modal-card')) return;
    event.preventDefault();
  }, { passive: false });

  new MutationObserver(sync).observe(modal, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // game.js observer가 body fixed를 다시 쓰더라도 paint 전에 제거한다.
  new MutationObserver(() => {
    if (!active || modal.classList.contains('hidden')) return;
    if (body.style.position === 'fixed' || body.style.top || body.style.left || body.style.right) {
      clearLegacyBodyGeometry();
      scheduleGeometry();
    }
  }).observe(body, {
    attributes: true,
    attributeFilter: ['style'],
  });

  vv?.addEventListener('resize', scheduleGeometry);
  vv?.addEventListener('scroll', scheduleGeometry);
  window.addEventListener('orientationchange', scheduleGeometry);

  sync();
})();
