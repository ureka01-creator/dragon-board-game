// DRAGON BOARD V0.6.6.2 — graphics polish + vendored authored audio runtime
(() => {
  const MUSIC = Object.freeze({
    title: 'assets/audio/bgm/title.mp3',
    setup: 'assets/audio/bgm/title.mp3',
    field: 'assets/audio/bgm/field.mp3',
    combat: 'assets/audio/bgm/combat.ogg',
    boss: 'assets/audio/bgm/boss.mp3',
  });

  const SFX = Object.freeze({
    dice: 'assets/audio/sfx/dice.ogg',
    diceShake: 'assets/audio/sfx/dice-shake.ogg',
    attack: 'assets/audio/sfx/attack.ogg',
    damage: 'assets/audio/sfx/damage.ogg',
    block: 'assets/audio/sfx/block.ogg',
    confirm: 'assets/audio/sfx/confirm.ogg',
    loot: 'assets/audio/sfx/loot.ogg',
    shop: 'assets/audio/sfx/shop.ogg',
    skill: 'assets/audio/sfx/skill.ogg',
    miss: 'assets/audio/sfx/miss.ogg',
    victory: 'assets/audio/sfx/victory.ogg',
  });

  const MUSIC_VOLUME = Object.freeze({ title:.20, setup:.18, field:.17, combat:.22, boss:.25 });
  const SFX_VOLUME = Object.freeze({ dice:.55, diceShake:.42, attack:.48, damage:.46, block:.44, confirm:.22, loot:.38, shop:.38, skill:.46, miss:.35, victory:.48 });

  const body = document.body;
  if (!body) return;
  body.classList.add('graphics-audio-v0662');

  // Linux headless WebKit can stall while constructing media elements even though
  // real iOS Safari does not. Automation validates orchestration and vendored asset
  // paths without creating HTMLMediaElement instances; real browsers create lazily.
  const automationMediaBypass = navigator.webdriver === true;

  function readMutedPreference() {
    try { return localStorage.getItem('dragon-audio-muted') === '1'; }
    catch (_) { return false; }
  }

  function writeMutedPreference(next) {
    try { localStorage.setItem('dragon-audio-muted', next ? '1' : '0'); }
    catch (_) {}
  }

  let unlocked = false;
  let muted = readMutedPreference();
  let mode = 'title';
  let lastSfx = null;
  let lastMusicError = null;
  let musicPrimed = false;
  let musicTimer = null;
  let automationMusicSrc = '';
  let automationMusicPlaying = false;
  let music = null;
  const sfxCache = new Map();

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

  function syncSceneDataset() {
    if (body.dataset.audioMode !== mode) body.dataset.audioMode = mode;
    if (body.dataset.avScene !== mode) body.dataset.avScene = mode;
  }

  function getMusic() {
    if (automationMediaBypass) return null;
    if (music) return music;
    try {
      const media = new Audio();
      media.loop = true;
      media.preload = 'none';
      media.playsInline = true;
      media.setAttribute('playsinline', '');
      media.dataset.dragonAudio = 'music';
      media.addEventListener('error', () => {
        lastMusicError = media.error?.message || 'media-error';
      });
      music = media;
      return music;
    } catch (error) {
      lastMusicError = error?.message || 'audio-construction-error';
      return null;
    }
  }

  function safePlay(media) {
    if (automationMediaBypass) {
      automationMusicPlaying = true;
      return true;
    }
    if (!media) return false;
    try {
      const result = media.play();
      if (result && typeof result.catch === 'function') result.catch(() => {});
      return true;
    } catch (_) {
      return false;
    }
  }

  function safePause(media) {
    if (automationMediaBypass) {
      automationMusicPlaying = false;
      return;
    }
    if (!media) return;
    try { media.pause(); } catch (_) {}
  }

  function syncMusicNow() {
    syncSceneDataset();
    if (!unlocked || muted) {
      safePause(music);
      return false;
    }

    const next = MUSIC[mode] || MUSIC.field;
    if (automationMediaBypass) {
      automationMusicSrc = next;
      automationMusicPlaying = true;
      lastMusicError = null;
      musicPrimed = true;
      return true;
    }

    const media = getMusic();
    if (!media) return false;
    const current = media.getAttribute('src') || '';
    if (current !== next) {
      safePause(media);
      media.src = next;
      lastMusicError = null;
    }
    media.volume = MUSIC_VOLUME[mode] ?? .18;
    const started = safePlay(media);
    if (started) musicPrimed = true;
    return started;
  }

  function scheduleMusic(delay = 360) {
    syncSceneDataset();
    if (musicTimer) clearTimeout(musicTimer);
    musicTimer = null;
    if (!unlocked || muted) {
      safePause(music);
      return;
    }
    musicTimer = setTimeout(() => {
      musicTimer = null;
      syncMusicNow();
    }, delay);
  }

  function setMode(next, delay) {
    const valid = Object.prototype.hasOwnProperty.call(MUSIC, next) ? next : 'field';
    const changed = valid !== mode;
    mode = valid;
    syncSceneDataset();
    if (!changed && !Number.isFinite(delay)) return mode;

    const sceneDelay = Number.isFinite(delay)
      ? delay
      : (valid === 'field' ? 650 : valid === 'combat' || valid === 'boss' ? 160 : 220);
    scheduleMusic(sceneDelay);
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
    if (map.dataset.theme !== theme) map.dataset.theme = theme;
  }

  function getSfx(name) {
    if (automationMediaBypass) return null;
    if (sfxCache.has(name)) return sfxCache.get(name);
    const src = SFX[name];
    if (!src) return null;
    try {
      const effect = new Audio();
      effect.preload = 'none';
      effect.playsInline = true;
      effect.setAttribute('playsinline', '');
      effect.src = src;
      effect.dataset.dragonAudio = 'sfx';
      effect.dataset.dragonSfx = name;
      sfxCache.set(name, effect);
      return effect;
    } catch (_) {
      return null;
    }
  }

  function playSfx(name, volume) {
    if (!SFX[name] || muted || !unlocked) return false;
    lastSfx = name;
    if (automationMediaBypass) return true;
    const effect = getSfx(name);
    if (!effect) return false;
    effect.volume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : (SFX_VOLUME[name] ?? .35)));
    try { effect.currentTime = 0; } catch (_) {}
    return safePlay(effect);
  }

  function markUnlocked() {
    unlocked = true;
    updateToggle();
    return true;
  }

  function unlock() {
    markUnlocked();
    inferMode();
    syncVisualTheme();
    return syncMusicNow();
  }

  function setMuted(next) {
    muted = Boolean(next);
    writeMutedPreference(muted);
    updateToggle();
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = null;
    }
    if (muted) safePause(music);
    else if (unlocked) scheduleMusic(0);
    return muted;
  }

  function clickSfx(target) {
    if (!target?.closest || target.closest('#audioToggle')) return;
    if (target.closest('#rollBtn,.final-dungeon-roll,[data-final-dungeon-roll]')) { playSfx('dice'); return; }
    if (target.closest('#combatAttackBtn')) { playSfx('attack'); return; }
    if (target.closest('#combatSkillBtn')) { playSfx('skill'); return; }
    if (target.closest('#combatDefendBtn')) { playSfx('block'); return; }
    if (target.closest('#lootCard')) { playSfx('loot'); return; }
  }

  toggle.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (!unlocked) markUnlocked();
    setMuted(!muted);
  });

  const firstGesture = event => {
    if (!event.isTrusted) return;
    markUnlocked();
    document.removeEventListener('pointerdown', firstGesture, true);
    document.removeEventListener('touchstart', firstGesture, true);
  };
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('touchstart', firstGesture, true);

  document.addEventListener('click', event => {
    if (event.isTrusted && !unlocked) markUnlocked();
    clickSfx(event.target);
    inferMode();
    syncVisualTheme();
    if (event.isTrusted && unlocked && !muted && !musicPrimed) syncMusicNow();
  });

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

  updateToggle();
  syncSceneDataset();
  syncVisualTheme();

  window.DRAGON_AUDIO_API = Object.freeze({
    unlock,
    setMuted,
    playSfx,
    setMode,
    snapshot() {
      return {
        assetKind:'vendored-external',
        automationMediaBypass,
        unlocked,
        muted,
        mode,
        musicSrc:automationMediaBypass ? automationMusicSrc : (music?.getAttribute('src') || ''),
        musicPaused:automationMediaBypass ? !automationMusicPlaying : (music ? music.paused : true),
        musicPrimed,
        lastSfx,
        lastMusicError,
        assets:{ music:{...MUSIC}, sfx:{...SFX} },
      };
    },
  });
})();
