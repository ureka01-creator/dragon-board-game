// DRAGON BOARD V0.6.4.3 — combat consumable availability + iOS modal stability
(() => {
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  const modalCloseBtn = document.querySelector('#modalCloseBtn');
  const combatEnemies = document.querySelector('#combatEnemies');
  const combatItemBtn = document.querySelector('#combatItemBtn');
  if (!modal || !modalContent || !combatEnemies) return;

  const style = document.createElement('style');
  style.textContent = `
    .combat-item-modal [data-combat-item].combat-item-unavailable {
      opacity: .58;
      cursor: not-allowed;
      filter: saturate(.45);
    }
    .combat-item-modal [data-combat-item].combat-item-unavailable small {
      color: #d7a977;
    }
    .combat-item-rule-badge {
      display:inline-block;
      margin-left:6px;
      padding:2px 5px;
      border:1px solid rgba(205,145,86,.65);
      color:#e4b27b;
      font-size:.76em;
      white-space:nowrap;
    }
    body.combat-open .modal.combat-item-modal:not(.hidden) {
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483000 !important;
      pointer-events: auto !important;
      touch-action: manipulation !important;
      -webkit-transform: translate3d(0,0,1px) !important;
      transform: translate3d(0,0,1px) !important;
    }
    body.combat-open .modal.combat-item-modal:not(.hidden) .modal-card {
      pointer-events: auto !important;
      touch-action: pan-y !important;
      -webkit-overflow-scrolling: touch;
    }
  `;
  document.head.appendChild(style);

  function isBossBattle() {
    return Boolean(combatEnemies.querySelector('.stage-enemy-actor.tier-boss'));
  }

  function stabilizeCombatItemModal() {
    if (modal.classList.contains('hidden') || !modal.classList.contains('combat-item-modal')) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '2147483000';
    modal.removeAttribute('aria-hidden');
    if (modalCloseBtn) {
      modalCloseBtn.hidden = false;
      if (!modalCloseBtn.textContent?.trim()) modalCloseBtn.textContent = '전투로 돌아가기';
    }
  }

  function refreshCombatItemAvailability() {
    if (modal.classList.contains('hidden') || !modal.classList.contains('combat-item-modal')) return;
    stabilizeCombatItemModal();
    const bossBattle = isBossBattle();

    modalContent.querySelectorAll('[data-combat-item]').forEach(button => {
      const name = button.querySelector('strong')?.textContent?.trim() || '';
      if (name !== '연막탄') return;

      const desc = button.querySelector('small');
      let badge = button.querySelector('.combat-item-rule-badge');

      if (bossBattle) {
        button.disabled = true;
        button.classList.add('combat-item-unavailable');
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('aria-label', '연막탄 · 보스전 사용 불가 · 일반/정예 전투 전용');
        if (desc) desc.textContent = '일반/정예 전투에서 즉시 도주 · 보스전 사용 불가';
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'combat-item-rule-badge';
          badge.textContent = '보스전 사용 불가';
          button.appendChild(badge);
        }
      } else {
        button.disabled = false;
        button.classList.remove('combat-item-unavailable');
        button.removeAttribute('aria-disabled');
        button.setAttribute('aria-label', '연막탄 · 즉시 도주');
        if (desc) desc.textContent = '일반/정예 전투에서 즉시 도주.';
        badge?.remove();
      }
    });
  }

  combatItemBtn?.addEventListener('click', () => {
    requestAnimationFrame(stabilizeCombatItemModal);
    setTimeout(stabilizeCombatItemModal, 60);
  }, true);

  combatItemBtn?.addEventListener('touchend', () => {
    setTimeout(stabilizeCombatItemModal, 0);
  }, { passive: true, capture: true });

  new MutationObserver(refreshCombatItemAvailability).observe(modalContent, {
    childList: true,
    subtree: true,
  });
  new MutationObserver(refreshCombatItemAvailability).observe(modal, {
    attributes: true,
    attributeFilter: ['class'],
  });
  new MutationObserver(refreshCombatItemAvailability).observe(combatEnemies, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  refreshCombatItemAvailability();
})();
