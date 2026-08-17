// DRAGON BOARD V0.6.5.4 — shared modal viewport lock bridge
(() => {
  const modal = document.querySelector('#modal');
  const root = document.documentElement;
  const body = document.body;
  if (!modal || !root || !body) return;

  let active = false;
  let savedScrollY = 0;
  let previousRootOverflow = '';
  let previousBodyOverflow = '';
  let previousOverscroll = '';

  function readLockedScrollY() {
    const top = Number.parseFloat(body.style.top || '0');
    if (body.style.position === 'fixed' && Number.isFinite(top) && top < 0) return -top;
    return window.scrollY || root.scrollTop || 0;
  }

  function clearLegacyBodyGeometry() {
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
  }

  function sync() {
    const open = !modal.classList.contains('hidden');

    if (open) {
      if (!active) {
        savedScrollY = readLockedScrollY();
        previousRootOverflow = root.style.overflow || '';
        previousBodyOverflow = body.style.overflow || '';
        previousOverscroll = root.style.overscrollBehavior || '';
        active = true;
      }
      clearLegacyBodyGeometry();
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      root.style.overscrollBehavior = 'none';
      root.classList.add('dragon-modal-viewport-lock');
      return;
    }

    if (!active) return;
    clearLegacyBodyGeometry();
    body.style.overflow = previousBodyOverflow;
    root.style.overflow = previousRootOverflow;
    root.style.overscrollBehavior = previousOverscroll;
    root.classList.remove('dragon-modal-viewport-lock');
    active = false;
    requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
  }

  new MutationObserver(sync).observe(modal, {
    attributes: true,
    attributeFilter: ['class'],
  });

  sync();
})();
