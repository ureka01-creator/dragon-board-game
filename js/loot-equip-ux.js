// DRAGON BOARD V0.6.2.1 — loot candidate detail + equipment modal UX
(() => {
  const lootActions = document.querySelector('#lootActions');
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  const modalCloseBtn = document.querySelector('#modalCloseBtn');
  if (!lootActions || !modal || !modalContent || !modalCloseBtn) return;

  const allowOriginalDiscard = new WeakSet();

  function rarityLabel(item) {
    return item?.rarity === 'legendary' ? 'LEGENDARY' : item?.rarity === 'rare' ? 'RARE' : 'COMMON';
  }

  function typeLabel(item) {
    if (item?.type === 'equipment') {
      return item.slot === 'weapon' ? '무기' : item.slot === 'armor' ? '방어구' : item.slot === 'accessory' ? '장신구' : '장비';
    }
    if (item?.type === 'consumable') return '소비 아이템';
    return '아이템';
  }

  function statText(item) {
    const parts = [];
    const stats = item?.stats || {};
    if (stats.attack) parts.push(`명중 +${stats.attack}`);
    if (stats.damage) parts.push(`피해 +${stats.damage}`);
    if (stats.ac) parts.push(`AC +${stats.ac}`);
    if (Array.isArray(item?.equip) && item.equip.length < 4) {
      const names = item.equip.map(id => (window.HEROES || []).find(hero => hero.id === id)?.name || id);
      parts.push(`장착: ${names.join(' / ')}`);
    }
    return parts.join(' · ');
  }

  function itemForCard(card) {
    const name = card.querySelector('strong')?.textContent?.trim();
    if (!name) return null;
    return (window.ITEM_CARDS || []).find(item => item.name === name) || null;
  }

  function clearCandidateDetail() {
    lootActions.querySelector('.loot-candidate-detail-v0621')?.remove();
    lootActions.querySelectorAll('.loot-replace-card').forEach(card => {
      card.style.borderColor = '';
      card.removeAttribute('aria-pressed');
    });
  }

  function showCandidateDetail(card) {
    const item = itemForCard(card);
    if (!item) return;
    clearCandidateDetail();
    card.style.borderColor = '#d7a743';
    card.setAttribute('aria-pressed', 'true');

    const stats = statText(item);
    const panel = document.createElement('div');
    panel.className = 'loot-candidate-detail-v0621';
    panel.style.cssText = 'margin-top:8px;padding:12px;border:2px solid #765535;background:#21150f;text-align:left;';
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:30px">${item.icon || '🎒'}</span>
        <div><strong style="display:block;color:#e6ca7a;font-size:13px">${item.name}</strong><small style="display:block;margin-top:2px;color:#9f876d">${rarityLabel(item)} · ${typeLabel(item)}</small></div>
      </div>
      <div style="margin-top:9px;color:#d7c7a5;font-size:11px;line-height:1.7">${item.desc || '상세 설명 없음'}${stats ? `<br><span style="color:#a9bd7d">${stats}</span>` : ''}</div>
      <div style="display:grid;gap:7px;margin-top:11px">
        <button type="button" class="pixel-btn danger" data-loot-discard-confirm>🗑️ 이 아이템 버리기</button>
        <button type="button" class="pixel-btn" data-loot-detail-close>다른 아이템 보기</button>
      </div>`;

    const grid = card.closest('.loot-replace-grid');
    (grid || lootActions).insertAdjacentElement('afterend', panel);

    panel.querySelector('[data-loot-discard-confirm]')?.addEventListener('click', () => {
      allowOriginalDiscard.add(card);
      card.click();
    }, { once: true });
    panel.querySelector('[data-loot-detail-close]')?.addEventListener('click', clearCandidateDetail);
  }

  // 기존 카드의 click은 즉시 아이템을 버린다. 캡처 단계에서 먼저 막아
  // 상세 확인을 거친 뒤 확정 버튼에서만 원래 click을 통과시킨다.
  lootActions.addEventListener('click', event => {
    const card = event.target.closest?.('.loot-replace-card');
    if (!card || !lootActions.contains(card)) return;
    if (allowOriginalDiscard.has(card)) {
      allowOriginalDiscard.delete(card);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    showCandidateDetail(card);
  }, true);

  function refreshLootCopy() {
    const title = lootActions.querySelector('.loot-replace-title');
    if (title && title.textContent.includes('버릴 아이템 선택')) {
      title.textContent = '가방이 가득 참 · 아이템을 눌러 상세 확인';
    }
    lootActions.querySelectorAll('.loot-replace-card small').forEach(small => {
      if (small.textContent.includes('이 아이템을 버리고')) small.textContent = '탭해서 상세 정보 확인';
    });
    if (!lootActions.querySelector('.loot-replace-grid')) clearCandidateDetail();
  }

  function refreshEquipModal() {
    const comparing = Boolean(modalContent.querySelector('.equip-confirm-sheet')) && modal.classList.contains('equip-compare-modal');
    modalCloseBtn.style.display = comparing ? 'none' : '';
    // 중요: 없는 클래스를 반복 remove 하면 WebKit MutationObserver가 자기 mutation을
    // 다시 받아 microtask loop에 빠질 수 있다. 실제 클래스가 있을 때만 제거한다.
    if (!comparing && modalContent.querySelector('.hero-status-sheet') && modal.classList.contains('equip-compare-modal')) {
      modal.classList.remove('equip-compare-modal');
    }
  }

  new MutationObserver(() => {
    refreshLootCopy();
    refreshEquipModal();
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  refreshLootCopy();
  refreshEquipModal();
})();
