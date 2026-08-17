// DRAGON BOARD V0.6.5.4 — iOS hero status viewport + item tap bridge
(() => {
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  const root = document.documentElement;
  const body = document.body;
  if (!modal || !modalContent || !root || !body) return;

  function releaseHeroStatusViewportLock() {
    if (modal.classList.contains('hidden') || !modal.classList.contains('hero-status-modal')) return;

    const fixedTop = Number.parseFloat(body.style.top || '0');
    const restoreY = Number.isFinite(fixedTop) && fixedTop < 0
      ? -fixedTop
      : (window.scrollY || document.documentElement.scrollTop || 0);

    // game.js의 공용 모달 스크롤락은 iPhone Safari에서 캐릭터 상태 모달을
    // 화면 밖/비표시 상태로 만들 수 있다. 캐릭터 상태 계열에서만 락을 해제한다.
    body.classList.remove('modal-open');
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';

    if (!body.classList.contains('combat-open')) {
      root.style.overscrollBehavior = '';
    }

    if (restoreY > 0 && Math.abs((window.scrollY || 0) - restoreY) > 1) {
      window.scrollTo(0, restoreY);
    }
  }

  const scheduleStatusViewportRelease = () => queueMicrotask(releaseHeroStatusViewportLock);
  new MutationObserver(scheduleStatusViewportRelease).observe(modal, {
    attributes: true,
    attributeFilter: ['class'],
  });
  scheduleStatusViewportRelease();

  const ITEM_ROW_SELECTOR = '[data-status-equipped-slot], [data-status-bag-index]';
  let touchGesture = null;

  function getItemRow(target) {
    const row = target?.closest?.(ITEM_ROW_SELECTOR);
    if (!row || !modalContent.contains(row)) return null;
    if (target?.closest?.('button')) return null;
    return row;
  }

  document.addEventListener('touchstart', (event) => {
    const row = getItemRow(event.target);
    const touch = event.touches?.[0];
    if (!row || !touch) {
      touchGesture = null;
      return;
    }

    touchGesture = {
      row,
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
    };
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (event) => {
    if (!touchGesture) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    if (Math.hypot(touch.clientX - touchGesture.startX, touch.clientY - touchGesture.startY) > 12) {
      touchGesture.moved = true;
    }
  }, { passive: true, capture: true });

  document.addEventListener('touchend', (event) => {
    const gesture = touchGesture;
    touchGesture = null;
    if (!gesture || gesture.moved) return;
    if (!gesture.row?.isConnected || !modalContent.contains(gesture.row)) return;
    if (event.target?.closest?.('button')) return;

    event.preventDefault();
    gesture.row.click();
  }, { passive: false, capture: true });

  document.addEventListener('touchcancel', () => {
    touchGesture = null;
  }, { passive: true, capture: true });
})();
