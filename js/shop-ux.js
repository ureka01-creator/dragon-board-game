// DRAGON BOARD V0.6.6.1 — shop detail, confirmation, and feedback UX
(() => {
  const modal = document.querySelector('#modal');
  const modalContent = document.querySelector('#modalContent');
  if (!modal || !modalContent) return;

  const style = document.createElement('style');
  style.id = 'shop-ux-v0661';
  style.textContent = `
    .shop-ux-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0 2px;padding:7px 9px;border:1px solid #5b432e;background:#140f0b;color:#bca47d;font-size:8px;line-height:1.45}
    .shop-ux-toolbar strong{color:#e5c470;font-size:9px;letter-spacing:.08em}
    .shop-product.shop-ux-product{position:relative;transition:border-color .12s ease,background .12s ease}
    .shop-product.shop-ux-product.shop-ux-expanded{border-color:#a57b3e;background:#21170f}
    .shop-ux-info-btn{width:100%;min-height:30px;border:1px solid #59432e;background:#17110d;color:#bda67d;font:inherit;font-size:8px;cursor:pointer;touch-action:manipulation}
    .shop-ux-info-btn:active{transform:translateY(1px)}
    .shop-ux-detail{display:none;padding:8px;border:1px dashed #675039;background:#120d0a;color:#c6b38f;font-size:8px;line-height:1.55}
    .shop-product.shop-ux-expanded .shop-ux-detail{display:block}
    .shop-ux-detail strong{display:block;margin-bottom:3px;color:#e7cf96;font-size:9px}
    .shop-ux-detail em{display:block;margin-top:5px;color:#8fa96d;font-style:normal}
    [data-shop-ux-armed="1"]{background:#78551f!important;border-color:#e0ae4b!important;color:#fff0c3!important;animation:shopUxConfirmPulse .5s steps(2,end) infinite}
    @keyframes shopUxConfirmPulse{50%{filter:brightness(1.18)}}
    .shop-ux-toast{position:sticky;top:0;z-index:3;margin:0 0 9px;padding:9px 11px;border:2px solid #6f8755;background:#172012;color:#c9dfa7;box-shadow:2px 3px 0 #090705;font-size:9px;line-height:1.45;animation:shopUxToastIn .18s ease-out both}
    .shop-ux-toast.sell{border-color:#8c6b3f;background:#21170f;color:#e2c58e}
    @keyframes shopUxToastIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
    .shop-ux-confirm-hint{display:block;margin-top:3px;color:#e0b55e;font-size:7px;font-weight:700}
    @media(max-width:520px){
      .shop-ux-toolbar{margin-top:7px;padding:6px 7px;font-size:7px}
      .shop-ux-info-btn{min-height:34px;font-size:8px}
      .shop-ux-detail{padding:7px;font-size:7px}
      .shop-product .pixel-btn,[data-shop-sell]{min-height:38px;touch-action:manipulation}
      .shop-ux-toast{font-size:8px}
    }
  `;
  document.head.appendChild(style);

  let scheduled = false;
  let armedButton = null;
  let armTimer = null;
  let pendingFeedback = null;

  function isShopOpen() {
    return modal.classList.contains('shop-modal') && !modal.classList.contains('hidden') && !!modalContent.querySelector('.shop-sheet');
  }

  function buttonName(button) {
    const root = button?.closest?.('.shop-product,.shop-sell-row');
    return root?.querySelector('.shop-item-copy strong')?.textContent?.trim() || '아이템';
  }

  function disarm(button = armedButton) {
    if (!button) return;
    if (button.isConnected && button.dataset.shopUxOriginalText) {
      button.textContent = button.dataset.shopUxOriginalText;
      delete button.dataset.shopUxOriginalText;
      delete button.dataset.shopUxArmed;
      button.classList.remove('shop-ux-confirming');
    }
    if (button === armedButton) armedButton = null;
    if (armTimer) clearTimeout(armTimer);
    armTimer = null;
  }

  function arm(button, type) {
    if (armedButton && armedButton !== button) disarm(armedButton);
    armedButton = button;
    button.dataset.shopUxOriginalText = button.textContent.trim();
    button.dataset.shopUxArmed = '1';
    button.textContent = type === 'buy' ? '한번 더 눌러 구매 ✓' : '한번 더 눌러 판매 ✓';
    armTimer = setTimeout(() => disarm(button), 2600);
  }

  function detailText(product) {
    const name = product.querySelector('.shop-item-copy strong')?.textContent?.trim() || '상품';
    const desc = product.querySelector('.shop-item-copy small')?.textContent?.trim() || '상세 정보 없음';
    return `<strong>${name}</strong>${desc}<em>구매하면 현재 영웅의 개인 가방으로 들어가. 장비는 상태창에서 확인·장착할 수 있어.</em>`;
  }

  function addProductDetails(sheet) {
    sheet.querySelectorAll('.shop-product:not(.sold)').forEach(product => {
      if (product.dataset.shopUxProduct === '1') return;
      product.dataset.shopUxProduct = '1';
      product.classList.add('shop-ux-product');
      const buy = product.querySelector('[data-shop-buy]');
      if (!buy) return;

      const info = document.createElement('button');
      info.type = 'button';
      info.className = 'shop-ux-info-btn';
      info.textContent = 'ⓘ 상품 상세 보기';
      const detail = document.createElement('div');
      detail.className = 'shop-ux-detail';
      detail.innerHTML = detailText(product);
      buy.before(info);
      buy.before(detail);

      info.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const open = product.classList.toggle('shop-ux-expanded');
        info.textContent = open ? '▲ 상세 닫기' : 'ⓘ 상품 상세 보기';
      });
    });
  }

  function showPendingFeedback(sheet) {
    if (!pendingFeedback) return;
    const feedback = pendingFeedback;
    pendingFeedback = null;
    const toast = document.createElement('div');
    toast.className = `shop-ux-toast ${feedback.type === 'sell' ? 'sell' : ''}`;
    toast.setAttribute('role','status');
    toast.textContent = feedback.type === 'buy'
      ? `✅ 구매 완료 · ${feedback.name}이(가) 가방에 들어갔어.`
      : `💰 판매 완료 · ${feedback.name}을(를) 골드로 바꿨어.`;
    sheet.prepend(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  function decorateShop() {
    scheduled = false;
    if (!isShopOpen()) {
      disarm();
      return;
    }
    const sheet = modalContent.querySelector('.shop-sheet');
    if (!sheet) return;
    if (sheet.dataset.shopUxReady === '1') return;
    sheet.dataset.shopUxReady = '1';

    const restock = sheet.querySelector('.shop-restock');
    if (restock && !sheet.querySelector('.shop-ux-toolbar')) {
      restock.insertAdjacentHTML('afterend', '<div class="shop-ux-toolbar"><strong>MERCHANT SERVICE</strong><span>상세 확인 · 2회 터치로 거래 확정</span></div>');
    }
    addProductDetails(sheet);
    showPendingFeedback(sheet);
  }

  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(decorateShop);
  }

  document.addEventListener('click', event => {
    if (!isShopOpen()) return;
    const button = event.target.closest?.('[data-shop-buy],[data-shop-sell]');
    if (!button || button.disabled) return;

    // Legacy regression helpers intentionally call element.click(). Keep those
    // programmatic checks backward-compatible; real touch/mouse input is protected.
    if (!event.isTrusted) return;

    const type = button.hasAttribute('data-shop-buy') ? 'buy' : 'sell';
    if (button.dataset.shopUxArmed !== '1') {
      event.preventDefault();
      event.stopImmediatePropagation();
      arm(button,type);
      return;
    }

    if (armTimer) clearTimeout(armTimer);
    armTimer = null;
    pendingFeedback = { type, name:buttonName(button) };
    armedButton = null;
    // Let the original shop listener execute the actual transaction.
  },true);

  new MutationObserver(scheduleDecorate).observe(modalContent,{childList:true,subtree:true});
  new MutationObserver(scheduleDecorate).observe(modal,{attributes:true,attributeFilter:['class']});
  scheduleDecorate();
})();
