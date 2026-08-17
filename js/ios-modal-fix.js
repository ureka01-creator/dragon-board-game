// DRAGON BOARD V0.6.4.5 — iOS modal scroll lock + status item tap fallback
(() => {
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  if (!modal || !modalContent) return;

  const root = document.documentElement;
  let rootLocked = false;
  let previousRootOverflow = '';

  function syncRootScrollLock() {
    const open = !modal.classList.contains('hidden');
    if (open && !rootLocked) {
      previousRootOverflow = root.style.overflow || '';
      root.style.overflow = 'hidden';
      root.classList.add('dragon-modal-root-lock');
      rootLocked = true;
      return;
    }
    if (!open && rootLocked) {
      root.style.overflow = previousRootOverflow;
      root.classList.remove('dragon-modal-root-lock');
      rootLocked = false;
    }
  }

  new MutationObserver(syncRootScrollLock).observe(modal, {
    attributes: true,
    attributeFilter: ['class'],
  });
  syncRootScrollLock();

  const ITEM_ROW_SELECTOR = '[data-status-equipped-slot], [data-status-bag-index]';
  const nativeSetTimeout = window.setTimeout.bind(window);

  function activateStatusRow(row, clientX = 0, clientY = 0) {
    if (!row || !modalContent.contains(row)) return;
    if (row.classList.contains('long-press-fired')) return;

    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      const nextDelay = Number(delay) === 520 ? 0 : delay;
      return nativeSetTimeout(callback, nextDelay, ...args);
    };

    try {
      const PointerCtor = window.PointerEvent || window.MouseEvent;
      row.dispatchEvent(new PointerCtor('pointerdown', {
        bubbles: false,
        cancelable: true,
        clientX,
        clientY,
        pointerType: 'touch',
      }));
    } finally {
      window.setTimeout = originalSetTimeout;
    }
  }

  let touchGesture = null;

  document.addEventListener('touchstart', (event) => {
    const row = event.target.closest?.(ITEM_ROW_SELECTOR);
    if (!row || !modalContent.contains(row) || event.target.closest('button')) {
      touchGesture = null;
      return;
    }
    const touch = event.touches?.[0];
    if (!touch) return;
    touchGesture = {
      row,
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastY: touch.clientY,
      moved: false,
    };
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!touchGesture) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    touchGesture.lastX = touch.clientX;
    touchGesture.lastY = touch.clientY;
    if (Math.hypot(touch.clientX - touchGesture.startX, touch.clientY - touchGesture.startY) > 10) {
      touchGesture.moved = true;
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    const gesture = touchGesture;
    touchGesture = null;
    if (!gesture || gesture.moved) return;
    nativeSetTimeout(() => {
      if (!modalContent.contains(gesture.row)) return;
      activateStatusRow(gesture.row, gesture.lastX, gesture.lastY);
    }, 0);
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    touchGesture = null;
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const row = event.target.closest?.(ITEM_ROW_SELECTOR);
    if (!row || !modalContent.contains(row)) return;
    if (event.target.closest('button')) return;
    activateStatusRow(row, event.clientX || 0, event.clientY || 0);
  });
})();
