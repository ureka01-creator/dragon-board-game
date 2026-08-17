// DRAGON BOARD V0.6.5.5 — iPhone-safe shared modal viewport lock
(() => {
  const modal = document.querySelector('#modal');
  const root = document.documentElement;
  const body = document.body;
  if (!modal || !root || !body) return;

  // game.js still writes body { position:fixed; top:-scrollY } while a modal opens.
  // On iPhone Safari that geometry change can move the visual viewport before any
  // later JavaScript correction runs. Keep the legacy class for compatibility,
  // but make those inline geometry properties ineffective at style resolution.
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
    html.dragon-modal-viewport-lock,
    html.dragon-modal-viewport-lock body {
      overflow: hidden !important;
      overscroll-behavior: none !important;
    }
    html.dragon-modal-viewport-lock #modal:not(.hidden) {
      position: fixed !important;
      inset: 0 !important;
      width: 100vw !important;
      height: 100dvh !important;
      max-height: 100dvh !important;
      box-sizing: border-box !important;
    }
  `;
  document.head.appendChild(guardStyle);

  let active = false;
  let savedScrollY = 0;
  let previousRootOverflow = '';
  let previousBodyOverflow = '';
  let previousOverscroll = '';

  function readScrollY() {
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
  }

  function sync() {
    const open = !modal.classList.contains('hidden');

    if (open) {
      if (!active) {
        savedScrollY = readScrollY();
        previousRootOverflow = root.style.overflow || '';
        previousBodyOverflow = body.style.overflow || '';
        previousOverscroll = root.style.overscrollBehavior || '';
        active = true;
      }

      // Clear the legacy inline geometry too, so getComputedStyle/layout callers
      // do not inherit stale fixed-body values while the modal is visible.
      clearLegacyBodyGeometry();
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      root.style.overscrollBehavior = 'none';
      root.classList.add('dragon-modal-viewport-lock');
      return;
    }

    if (!active) return;

    clearLegacyBodyGeometry();
    body.style.overflow = previousBodyOverflow;
    root.style.overflow = previousRootOverflow;
    root.style.overscrollBehavior = previousOverscroll;
    root.classList.remove('dragon-modal-viewport-lock');
    active = false;

    const restoreY = savedScrollY;
    requestAnimationFrame(() => {
      if (Math.abs((window.scrollY || 0) - restoreY) > 1) {
        window.scrollTo({ top: restoreY, left: 0, behavior: 'auto' });
      }
    });
  }

  // Do not allow the page behind the modal to rubber-band on iOS. Scrolling
  // inside the modal card remains available.
  document.addEventListener('touchmove', (event) => {
    if (!active) return;
    if (event.target.closest?.('.modal-card')) return;
    event.preventDefault();
  }, { passive: false });

  new MutationObserver(sync).observe(modal, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // game.js can re-apply its inline fixed geometry after the modal observer.
  // Strip it in the same microtask checkpoint, before Safari paints a frame.
  new MutationObserver(() => {
    if (!modal.classList.contains('hidden') &&
        (body.style.position === 'fixed' || body.style.top || body.style.left || body.style.right)) {
      queueMicrotask(sync);
    }
  }).observe(body, {
    attributes: true,
    attributeFilter: ['style'],
  });

  sync();
})();
