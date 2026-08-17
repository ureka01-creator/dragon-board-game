// DRAGON BOARD V0.6.4.8 — iOS modal scroll lock + item row tap fallback
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

  // 상태 버튼(.party-status-btn)은 game.js의 기존 click 처리에만 맡긴다.
  // 여기서는 캐릭터 상태창 내부 아이템 행의 iOS 탭 누락만 보정한다.
  const ITEM_ROW_SELECTOR = '[data-status-equipped-slot], [data-status-bag-index]';
  let touchGesture = null;

  function isDetailOpen() {
    return Boolean(modalContent.querySelector('.status-item-detail-sheet'));
  }

  function dispatchPointer(row, type, x, y) {
    if (!row?.isConnected) return;
    const PointerCtor = window.PointerEvent || window.MouseEvent;
    row.dispatchEvent(new PointerCtor(type, {
      bubbles: false,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerType: 'touch',
    }));
  }

  function activateItemRow(row, x, y) {
    if (!row?.isConnected || isDetailOpen()) return;

    // 1차: game.js가 이미 등록한 일반 click 핸들러 사용.
    row.click();
    if (isDetailOpen()) return;

    // 2차: 일부 iOS Safari에서 합성 click이 누락될 때만
    // 기존 game.js의 long-press 경로를 그대로 재사용한다.
    // 전역 setTimeout을 덮어쓰지 않아 다른 UI 타이머에 영향 주지 않는다.
    window.setTimeout(() => {
      if (!row.isConnected || isDetailOpen()) return;
      dispatchPointer(row, 'pointerdown', x, y);
      window.setTimeout(() => {
        if (!row.isConnected || isDetailOpen()) return;
        dispatchPointer(row, 'pointerup', x, y);
      }, 560);
    }, 20);
  }

  document.addEventListener('touchstart', (event) => {
    const row = event.target.closest?.(ITEM_ROW_SELECTOR);
    if (!row || !modalContent.contains(row) || event.target.closest?.('button')) {
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
    if (!gesture.row?.isConnected || !modalContent.contains(gesture.row)) return;
    if (event.target.closest?.('button')) return;

    event.preventDefault();
    activateItemRow(gesture.row, gesture.lastX, gesture.lastY);
  }, { passive: false });

  document.addEventListener('touchcancel', () => {
    touchGesture = null;
  }, { passive: true });
})();
