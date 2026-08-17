// DRAGON BOARD V0.6.4.6 — iOS modal scroll lock + reliable status item tap
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
  let touchGesture = null;

  document.addEventListener('touchstart', (event) => {
    const row = event.target.closest?.(ITEM_ROW_SELECTOR);
    if (!row || !modalContent.contains(row) || event.target.closest('button')) {
      touchGesture = null;
      return;
    }
    const touch = event.touches?.[0];
    if (!touch) {
      touchGesture = null;
      return;
    }
    touchGesture = {
      row,
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
    };
  }, { passive: true });

  document.addEventListener('touchmove', (event) => {
    if (!touchGesture) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    if (Math.hypot(touch.clientX - touchGesture.startX, touch.clientY - touchGesture.startY) > 12) {
      touchGesture.moved = true;
    }
  }, { passive: true });

  document.addEventListener('touchend', (event) => {
    const gesture = touchGesture;
    touchGesture = null;
    if (!gesture || gesture.moved) return;
    if (!modalContent.contains(gesture.row)) return;
    if (event.target.closest?.('button')) return;

    // iOS Safari에서는 pointer/click 합성이 누락되는 경우가 있어
    // touchend에서 기존 game.js의 row click 핸들러를 직접 실행한다.
    event.preventDefault();
    gesture.row.click();
  }, { passive: false });

  document.addEventListener('touchcancel', () => {
    touchGesture = null;
  }, { passive: true });
})();
