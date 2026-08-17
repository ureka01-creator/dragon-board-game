// DRAGON BOARD V0.6.4.7 — iOS status button + item detail tap hardening
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
  const STATUS_BUTTON_SELECTOR = '.party-status-btn';
  const nativeSetTimeout = window.setTimeout.bind(window);
  let touchGesture = null;

  function isDetailOpen() {
    return Boolean(modalContent.querySelector('.status-item-detail-sheet'));
  }

  function forceExistingItemHandler(row, clientX, clientY) {
    if (!row || !row.isConnected || isDetailOpen()) return;

    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      const normalized = Number(delay) === 520 ? 0 : delay;
      return nativeSetTimeout(callback, normalized, ...args);
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

    nativeSetTimeout(() => {
      if (!row.isConnected) return;
      const PointerCtor = window.PointerEvent || window.MouseEvent;
      row.dispatchEvent(new PointerCtor('pointerup', {
        bubbles: false,
        cancelable: true,
        clientX,
        clientY,
        pointerType: 'touch',
      }));
    }, 24);
  }

  function activateItemRow(row, clientX, clientY) {
    if (!row || !row.isConnected) return;

    // 1차: game.js의 일반 click 핸들러 사용.
    row.click();

    // iOS에서 합성 click이 기존 row 핸들러까지 전달되지 않는 경우,
    // 이미 존재하는 520ms pointerdown 핸들러를 즉시 실행하는 fallback.
    nativeSetTimeout(() => {
      if (!isDetailOpen()) forceExistingItemHandler(row, clientX, clientY);
    }, 0);
  }

  document.addEventListener('touchstart', (event) => {
    const target = event.target;
    const statusBtn = target.closest?.(STATUS_BUTTON_SELECTOR);
    const itemRow = target.closest?.(ITEM_ROW_SELECTOR);

    if (!statusBtn && !itemRow) {
      touchGesture = null;
      return;
    }
    if (itemRow && target.closest?.('button')) {
      touchGesture = null;
      return;
    }

    const touch = event.touches?.[0];
    if (!touch) {
      touchGesture = null;
      return;
    }

    touchGesture = {
      statusBtn,
      itemRow,
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
    if (Math.hypot(touch.clientX - touchGesture.startX, touch.clientY - touchGesture.startY) > 12) {
      touchGesture.moved = true;
    }
  }, { passive: true });

  document.addEventListener('touchend', (event) => {
    const gesture = touchGesture;
    touchGesture = null;
    if (!gesture || gesture.moved) return;

    if (gesture.statusBtn?.isConnected) {
      event.preventDefault();
      gesture.statusBtn.click();
      return;
    }

    if (gesture.itemRow?.isConnected && modalContent.contains(gesture.itemRow)) {
      event.preventDefault();
      activateItemRow(gesture.itemRow, gesture.lastX, gesture.lastY);
    }
  }, { passive: false });

  document.addEventListener('touchcancel', () => {
    touchGesture = null;
  }, { passive: true });
})();
