// DRAGON BOARD V0.6.6.2 — graphics polish + authored external audio runtime
(() => {
  const MEDIEVAL_COMMIT = '8ee84ce61b7e9034603301931629c53bab248da4';
  const AOZORA_COMMIT = '6dc06266c3263e93d8b8efd3d7e9a31b7db141f8';
  const KENNEY_CASINO_COMMIT = '48de332dd9a6c896e6faa6dba4c15676f69c9c84';
  const DUNGEON_COMMIT = '8a443d355b99dc3aa09b5c5cd8bf02b55b2fe2c4';

  const medieval = file => `https://cdn.jsdelivr.net/gh/tunasafa/medieaval-days@${MEDIEVAL_COMMIT}/assets/music/${file}`;
  const aozora = file => `https://cdn.jsdelivr.net/gh/tegnike/aozora-islands@${AOZORA_COMMIT}/src/assets/audio/${file}`;
  const casino = file => `https://cdn.jsdelivr.net/gh/ash4rk/food-pusher@${KENNEY_CASINO_COMMIT}/assets/sfx/kenney_casino/Audio/${file}`;
  const dungeon = file => `https://cdn.jsdelivr.net/gh/jarlah/dungeon-haskell@${DUNGEON_COMMIT}/assets/${file}`;

  const MUSIC = Object.freeze({
    title: medieval('Lament_for_a_Warriors_Soul.mp3'),
    setup: medieval('Lament_for_a_Warriors_Soul.mp3'),
    field: medieval('Exploration.mp3'),
    combat: medieval('Battle.mp3'),
    boss: dungeon('music/boss.ogg'),
  });

  const SFX = Object.freeze({
    dice: casino('dice-throw-1.ogg'),
    diceShake: casino('dice-shake-1.ogg'),
    attack: aozora('sfx-attack.ogg'),
    damage: aozora('sfx-damage.ogg'),
    block: aozora('sfx-block.ogg'),
    confirm: aozora('sfx-command.ogg'),
    loot: aozora('sfx-card-draw.ogg'),
    shop: casino('chips-collide-1.ogg'),
    skill: dungeon('sfx/crit.ogg'),
    miss: dungeon('sfx/miss.ogg'),
    victory: dungeon('sfx/levelup.ogg'),
  });

  const MUSIC_VOLUME = Object.freeze({ title:.20, setup:.18, field:.17, combat:.22, boss:.25 });
  const SFX_VOLUME = Object.freeze({ dice:.55, diceShake:.42, attack:.48, damage:.46, block:.44, confirm:.22, loot:.38, shop:.38, skill:.46, miss:.35, victory:.48 });

  const body = document.body;
  if (!body) return;
  body.classList.add('graphics-audio-v0662');

  let unlocked = false;
  let muted = localStorage.getItem('dragon-audio-muted') === '1';
  let mode = 'title';
  let lastSfx = null;
  let lastMusicError = null;
  let sfxSerial = 0;

  const music = new Audio();
  music.loop = true;
  music.preload = 'none';
  music.playsInline = true;
  music.setAttribute('playsinline', '');
  music.dataset.dragonAudio = 'music';

  const toggle = document.createElement('button');
  toggle.id = 'audioToggle';
  toggle.type = 'button';
  toggle.className = 'dragon-audio-toggle audio-toggle-v0662';
  toggle.setAttribute('aria-label', '게임 사운드 켜기 또는 끄기');
  body.appendChild(toggle);

  function updateToggle() {
    toggle.setAttribute('aria-pressed', muted ? 'true' : 'false');
    toggle.textContent = muted ? '🔇 SOUND' : '🔊 SOUND';
    toggle.title = muted ? '사운드 켜기' : '사운드 끄기';
  }

  function safePlay(media) {
    try {
      const result = media.play();
      if (result && typeof result.catch === 'function') result.catch(() => {});
      return true;
    } catch (_) {
      return false;
    }
  }

  function syncMusic() {
    body.dataset.audioMode = mode;
    body.dataset.avScene = mode;
    if (!unlocked || muted) {
      music.pause();
      return;
    }

    const next = MUSIC[mode] || MUSIC.field;
    const current = music.getAttribute('src') || '';
    if (current !== next) {
      music.pause();
      music.src = next;
      music.volume = MUSIC_VOLUME[mode] ?? .18;
      lastMusicError = null;
    } else {
      music.volume = MUSIC_VOLUME[mode] ?? .18;
    }
    safePlay(music);
  }

  function setMode(next) {
    const valid = Object.prototype.hasOwnProperty.call(MUSIC, next) ? next : 'field';
    if (mode === valid) {
      syncMusic();
      return mode;
    }
    mode = valid;
    syncMusic();
    return mode;
  }

  function inferMode() {
    const combat = document.querySelector('#combatOverlay');
    if (combat && !combat.classList.contains('hidden')) {
      const title = document.querySelector('#combatTitle')?.textContent || '';
      return setMode(/드래곤|ANCIENT|BOSS/i.test(title) ? 'boss' : 'combat');
    }
    if (document.querySelector('#gameScreen.active')) return setMode('field');
    if (document.querySelector('#setupScreen.active')) return setMode('setup');
    return setMode('title');
  }

  function syncVisualTheme() {
    const map = document.querySelector('#worldMap');
    if (!map) return;
    const boardTitle = document.querySelector('#boardTitle')?.textContent || '';
    let theme = 'road';
    if (/망자|묘지|수도원/.test(boardTitle)) theme = 'grave';
    else if (/숲|고목|뿌리/.test(boardTitle)) theme = 'forest';
    else if (/전쟁|전장|성채|참호/.test(boardTitle)) theme = 'war';
    else if (/화산|황무지|용암|잿불/.test(boardTitle)) theme = 'volcano';
    map.dataset.theme = theme;
  }

  function playSfx(name, volume) {
    const src = SFX[name];
    if (!src || muted || !unlocked) return false;
    lastSfx = name;
    const effect = new Audio(src);
    effect.preload = 'auto';
    effect.playsInline = true;
    effect.volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : (SFX_VOLUME[name] ?? .35)));
    effect.dataset.dragonAudio = 'sfx';
    effect.dataset.dragonSfx = name;
    const serial = ++sfxSerial;
    effect.dataset.dragonSerial = String(serial);
    safePlay(effect);
    const cleanup = () => {
      effect.removeEventListener('ended', cleanup);
      effect.removeEventListener('error', cleanup);
    };
    effect.addEventListener('ended', cleanup, { once:true });
    effect.addEventListener('error', cleanup, { once:true });
    return true;
  }

  function unlock() {
    if (!unlocked) unlocked = true;
    inferMode();
    syncVisualTheme();
    syncMusic();
    updateToggle();
    return true;
  }

  function setMuted(next) {
    muted = Boolean(next);
    localStorage.setItem('dragon-audio-muted', muted ? '1' : '0');
    updateToggle();
    if (muted) music.pause();
    else if (unlocked) syncMusic();
    return muted;
  }

  function clickSfx(target) {
    if (!target?.closest) return;
    if (target.closest('#audioToggle')) return;
    if (target.closest('#rollBtn,.final-dungeon-roll,[data-final-dungeon-roll]')) {
      playSfx('dice');
      return;
    }
    if (target.closest('#combatAttackBtn')) { playSfx('attack'); return; }
    if (target.closest('#combatSkillBtn')) { playSfx('skill'); return; }
    if (target.closest('#combatDefendBtn')) { playSfx('block'); return; }
    if (target.closest('#lootCard')) { playSfx('loot'); return; }
    if (target.closest('[data-shop-buy],[data-shop-sell]')) { playSfx('shop'); return; }
    if (target.closest('button,[role="button"]')) playSfx('confirm');
  }

  toggle.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (!unlocked) unlock();
    setMuted(!muted);
  });

  // iOS/Safari: the first media play must originate from a real user gesture.
  const firstGesture = event => {
    if (!event.isTrusted) return;
    unlock();
    document.removeEventListener('pointerdown', firstGesture, true);
    document.removeEventListener('touchstart', firstGesture, true);
    document.removeEventListener('click', firstGesture, true);
  };
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('touchstart', firstGesture, true);
  document.addEventListener('click', firstGesture, true);

  document.addEventListener('click', event => {
    clickSfx(event.target);
    requestAnimationFrame(() => {
      inferMode();
      syncVisualTheme();
    });
  }, true);

  // Observe only the small set of elements whose own class/text determines the audio scene.
  // No subtree-wide modal observer and no class writes inside these observers.
  const sceneObserver = new MutationObserver(() => {
    inferMode();
    syncVisualTheme();
  });
  ['titleScreen','setupScreen','gameScreen','combatOverlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) sceneObserver.observe(el, { attributes:true, attributeFilter:['class'] });
  });
  const combatTitle = document.querySelector('#combatTitle');
  if (combatTitle) sceneObserver.observe(combatTitle, { childList:true });
  const boardTitle = document.querySelector('#boardTitle');
  if (boardTitle) sceneObserver.observe(boardTitle, { childList:true });

  music.addEventListener('error', () => {
    lastMusicError = music.error?.message || 'media-error';
  });

  updateToggle();
  inferMode();
  syncVisualTheme();

  window.DRAGON_AUDIO_API = Object.freeze({
    unlock,
    setMuted,
    playSfx,
    setMode,
    snapshot() {
      return {
        assetKind:'external',
        unlocked,
        muted,
        mode,
        musicSrc:music.getAttribute('src') || '',
        musicPaused:music.paused,
        lastSfx,
        lastMusicError,
        assets:{ music:{...MUSIC}, sfx:{...SFX} },
      };
    },
  });
})();
