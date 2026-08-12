// DRAGON BOARD V0.5.9.4 — shared party objective copy
(() => {
  const currentObjective = document.querySelector('#currentObjective');
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  const modalCloseBtn = document.querySelector('#modalCloseBtn');
  if (!currentObjective || !modal || !modalContent || !modalCloseBtn) return;

  // 목표 도움말은 현재 보고 있는 지역/영웅과 무관한 파티 공통 목표로 안내한다.
  // 각 영웅은 서로 다른 지역 보스를 맡아도 되며, 봉인석은 전체 파티에 공통 집계된다.
  document.addEventListener('click', (event) => {
    const helpBtn = event.target.closest?.('#currentObjective .objective-help-btn');
    if (!helpBtn) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const castleOpen = /현재 목표\s*4\/4/.test(currentObjective.textContent || '');
    modal.classList.remove('hero-status-modal', 'party-manage-modal', 'item-transfer-modal', 'combat-item-modal', 'shop-modal', 'status-item-detail-modal');
    modalCloseBtn.hidden = false;
    modalCloseBtn.textContent = '확인';

    if (castleOpen) {
      modalContent.innerHTML = '<h3>🐉 현재 목표</h3><p>봉인석 4개를 모두 모았다. 출현한 드래곤의 성을 찾아가자.</p>';
    } else {
      modalContent.innerHTML = '<h3>🗿 현재 목표</h3><p>👑 네 지역의 보스를 각각 토벌하여 봉인석 4개를 모으자.</p><p class="objective-party-note">어떤 영웅이 어느 지역 보스를 잡아도 봉인석은 파티 공통으로 획득한다.</p>';
    }
    modal.classList.remove('hidden');
  }, true);
})();
