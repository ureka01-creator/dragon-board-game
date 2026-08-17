// DRAGON BOARD V0.6.5.0 — status item tap UX
(() => {
  const modalContent = document.querySelector('#modalContent');
  if (!modalContent) return;

  const ITEM_ROW_SELECTOR = '[data-status-equipped-slot], [data-status-bag-index]';

  // 기존 상세/교체 로직을 그대로 재사용한다.
  // 아이템 행을 일반 탭했을 때 기존 long-press pointerdown 핸들러를
  // 즉시 실행시키되, 전역 타이머에는 영향을 주지 않는다.
  document.addEventListener('click', (event) => {
    const row = event.target.closest?.(ITEM_ROW_SELECTOR);
    if (!row || !modalContent.contains(row)) return;
    if (event.target.closest('button')) return;
    if (row.classList.contains('long-press-fired')) return;

    const nativeSetTimeout = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => {
      const nextDelay = Number(delay) === 520 ? 0 : delay;
      return nativeSetTimeout(callback, nextDelay, ...args);
    };

    try {
      const PointerCtor = window.PointerEvent || window.MouseEvent;
      row.dispatchEvent(new PointerCtor('pointerdown', {
        bubbles: false,
        cancelable: true,
        clientX: 0,
        clientY: 0,
        pointerType: 'touch',
      }));
    } finally {
      window.setTimeout = nativeSetTimeout;
    }
  });

  function refreshTapCopy() {
    modalContent.querySelectorAll('.status-item-hint, .bag-rule-note').forEach((el) => {
      if (el.innerHTML.includes('길게 누르면')) {
        el.innerHTML = el.innerHTML.replaceAll('길게 누르면', '누르면');
      }
    });
    modalContent.querySelectorAll(`${ITEM_ROW_SELECTOR}[aria-label]`).forEach((el) => {
      const label = el.getAttribute('aria-label') || '';
      if (label.includes('길게 눌러')) {
        el.setAttribute('aria-label', label.replaceAll('길게 눌러', '눌러'));
      }
    });
  }

  new MutationObserver(refreshTapCopy).observe(modalContent, {
    childList: true,
    subtree: true,
  });
  refreshTapCopy();
})();