// DRAGON BOARD V0.6.5.3 — iOS status item tap bridge
(() => {
  const modalContent = document.querySelector('#modalContent');
  if (!modalContent) return;

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

    // iOS Safari에서 짧은 탭 뒤 click이 누락되는 경우를 직접 보정한다.
    // game.js의 기존 row click 핸들러를 그대로 호출하므로 상세/교체 로직은 한 곳에만 유지된다.
    event.preventDefault();
    gesture.row.click();
  }, { passive: false, capture: true });

  document.addEventListener('touchcancel', () => {
    touchGesture = null;
  }, { passive: true, capture: true });
})();
