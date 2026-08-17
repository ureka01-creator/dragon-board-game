// DRAGON BOARD V0.6.5.0 — combat consumable availability UX
(() => {
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  const combatEnemies = document.querySelector('#combatEnemies');
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
  `;
  document.head.appendChild(style);

  function isBossBattle() {
    return Boolean(combatEnemies.querySelector('.stage-enemy-actor.tier-boss'));
  }

  function refreshCombatItemAvailability() {
    if (modal.classList.contains('hidden') || !modal.classList.contains('combat-item-modal')) return;
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

  new MutationObserver(refreshCombatItemAvailability).observe(modalContent, {
    childList: true,
    subtree: true,
  });
  new MutationObserver(refreshCombatItemAvailability).observe(combatEnemies, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  refreshCombatItemAvailability();
})();