// DRAGON BOARD V0.6.4.9 — iOS visible modal lock + item row tap fallback
(() => {
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  const root = document.documentElement;
  const body = document.body;
  if (!modal || !modalContent || !root || !body) return;

  let safeLockActive = false;
  let savedScrollY = 0;
  let previousRootOverflow = '';
  let previousBodyOverflow = '';

  function clearLegacyFixedBody() {
    if (body.style.position !== 'fixed') return;

    const fixedTop = Number.parseFloat(body.style.top || '0');
    if (Number.isFinite(fixedTop) && fixedTop < 0) {
      savedScrollY = Math.max(savedScrollY, -fixedTop);
    }

    // game.js의 기존 body fixed 방식은 iOS Safari에서 fixed 자식 모달까지
    // 화면 밖으로 밀어내는 경우가 있다. 모달이 열린 동안에는 geometry만 해제한다.
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';

    if (savedScrollY > 0 && Math.abs((window.scrollY || 0) - savedScrollY) > 1) {
      window.scrollTo(0, savedScrollY);
    }
  }

  function syncSafeModalLock() {
    const open = !modal.classList.contains('hidden');

    if (open) {
      if (!safeLockActive) {
        const fixedTop = Number.parseFloat(body.style.top || '0');
        savedScrollY = window.scrollY || (Number.isFinite(fixedTop) && fixedTop < 0 ? -fixedTop : 0);
        previousRootOverflow = root.style.overflow || '';
        previousBodyOverflow = body.style.overflow || '';
        safeLockActive = true;
      }

      clearLegacyFixedBody();
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      root.classList.add('dragon-modal-root-lock');
      return;
    }

    if (safeLockActive) {
      // 혹시 남은 fixed geometry가 있더라도 닫을 때 완전히 제거한다.
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = previousBodyOverflow;
      root.style.overflow = previousRootOverflow;
      root.classList.remove('dragon-modal-root-lock');
      safeLockActive = false;
    }
  }

  const scheduleSafeLockSync = () => queueMicrotask(syncSafeModalLock);

  // game.js의 모달 class observer가 먼저 body fixed를 적용한 뒤,
  // 같은 프레임의 microtask에서 iOS-safe lock으로 교체한다.
  new MutationObserver(scheduleSafeLockSync).observe(modal, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // 다른 모달 코드가 열린 상태에서 body fixed를 다시 적용해도 즉시 교정한다.
  new MutationObserver(() => {
    if (!modal.classList.contains('hidden') && body.style.position === 'fixed') {
      scheduleSafeLockSync();
    }
  }).observe(body, {
    attributes: true,
    attributeFilter: ['style'],
  });

  syncSafeModalLock();

  // 상태 버튼(.party-status-btn)은 game.js의 기존 click 처리에만 맡긴다.
  // 캐릭터 상태창 내부 아이템 행의 iOS 탭 누락만 보정한다.
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

    // 1차: game.js가 등록한 일반 click 핸들러.
    row.click();
    if (isDetailOpen()) return;

    // 2차: 합성 click이 누락되는 iOS Safari에서만 기존 long-press 경로 재사용.
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
