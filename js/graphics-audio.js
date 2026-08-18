// DRAGON BOARD V0.6.6.2 — visual polish + lightweight Web Audio runtime
(() => {
  const body = document.body;
  const titleScreen = document.querySelector('#titleScreen');
  const setupScreen = document.querySelector('#setupScreen');
  const gameScreen = document.querySelector('#gameScreen');
  const combatOverlay = document.querySelector('#combatOverlay');
  const combatTitle = document.querySelector('#combatTitle');
  const rollBtn = document.querySelector('#rollBtn');
  if (!body || !titleScreen || !setupScreen || !gameScreen) return;

  body.classList.add('graphics-audio-v0662');

  let audioContext = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let unlocked = false;
  let muted = localStorage.getItem('dragon-audio-muted') === '1';
  let mode = 'title';
  let musicTimer = null;
  let musicStep = 0;
  let lastSfx = null;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;

  function ensureAudio() {
    if (!AudioCtx) {
      unlocked = true;
      return null;
    }
    if (!audioContext) {
      audioContext = new AudioCtx();
      masterGain = audioContext.createGain();
      musicGain = audioContext.createGain();
      sfxGain = audioContext.createGain();
      masterGain.gain.value = muted ? 0 : 0.55;
      musicGain.gain.value = 0.18;
      sfxGain.gain.value = 0.7;
      musicGain.connect(masterGain);
      sfxGain.connect(masterGain);
      masterGain.connect(audioContext.destination);
    }
    return audioContext;
  }

  async function unlockAudio() {
    const ctx = ensureAudio();
    if (!ctx) {
      unlocked = true;
      return true;
    }
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      unlocked = ctx.state === 'running' || ctx.state === 'interrupted';
    } catch (_) {
      unlocked = true;
    }
    if (unlocked) restartMusic();
    return unlocked;
  }

  function tone({ freq = 220, duration = 0.08, type = 'square', volume = 0.16, slide = 0 } = {}) {
    const ctx = ensureAudio();
    if (!ctx || muted || !unlocked || !sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playSfx(name) {
    lastSfx = name;
    if (name === 'dice-roll') {
      tone({ freq:150, duration:0.055, volume:0.12, slide:90 });
      setTimeout(() => tone({ freq:210, duration:0.06, volume:0.11, slide:-55 }), 55);
      setTimeout(() => tone({ freq:125, duration:0.09, volume:0.13, slide:-30 }), 120);
    } else if (name === 'attack') {
      tone({ freq:210, duration:0.07, volume:0.14, slide:-120 });
      setTimeout(() => tone({ freq:95, duration:0.11, volume:0.16, slide:-35 }), 55);
    } else if (name === 'skill') {
      tone({ freq:430, duration:0.12, type:'triangle', volume:0.11, slide:260 });
    } else if (name === 'defend') {
      tone({ freq:150, duration:0.12, type:'triangle', volume:0.12, slide:45 });
    } else if (name === 'shop') {
      tone({ freq:540, duration:0.07, type:'triangle', volume:0.10, slide:90 });
    } else if (name === 'confirm') {
      tone({ freq:360, duration:0.055, type:'triangle', volume:0.08, slide:70 });
    } else if (name === 'danger') {
      tone({ freq:88, duration:0.18, volume:0.11, slide:-25 });
    }
  }

  const MUSIC = {
    title: { notes:[110,165,147,123], beat:1380, volume:0.028, type:'triangle' },
    setup: { notes:[147,196,174,131], beat:1200, volume:0.022, type:'triangle' },
    field: { notes:[98,123,147,110,131,147], beat:1100, volume:0.022, type:'sine' },
    combat: { notes:[82,98,110,92], beat:640, volume:0.034, type:'square' },
    boss: { notes:[65,78,73,58], beat:520, volume:0.040, type:'sawtooth' },
  };

  function musicPulse() {
    const ctx = ensureAudio();
    const preset = MUSIC[mode] || MUSIC.field;
    if (!ctx || muted || !unlocked || !musicGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = preset.notes[musicStep++ % preset.notes.length];
    osc.type = preset.type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(preset.volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(0.7, preset.beat / 1000 * 0.72));
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(now);
    osc.stop(now + Math.min(0.78, preset.beat / 1000 * 0.8));
  }

  function restartMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    musicStep = 0;
    if (!unlocked || muted) return;
    const preset = MUSIC[mode] || MUSIC.field;
    musicPulse();
    musicTimer = setInterval(musicPulse, preset.beat);
  }

  function inferMode() {
    let next = 'title';
    if (!combatOverlay?.classList.contains('hidden')) {
      next = /드래곤|DRAGON/i.test(combatTitle?.textContent || '') ? 'boss' : 'combat';
    } else if (gameScreen.classList.contains('active')) next = 'field';
    else if (setupScreen.classList.contains('active')) next = 'setup';
    if (next === mode) {
      body.dataset.avScene = next;
      return;
    }
    mode = next;
    body.dataset.avScene = next;
    restartMusic();
  }

  function setMuted(next) {
    muted = Boolean(next);
    localStorage.setItem('dragon-audio-muted', muted ? '1' : '0');
    if (masterGain && audioContext) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.55, audioContext.currentTime, 0.025);
    }
    updateToggle();
    restartMusic();
  }

  const toggle = document.createElement('button');
  toggle.id = 'audioToggle';
  toggle.type = 'button';
  toggle.className = 'audio-toggle-v0662';
  toggle.setAttribute('aria-label', '게임 사운드 켜기 또는 끄기');
  toggle.addEventListener('click', async event => {
    event.stopPropagation();
    await unlockAudio();
    setMuted(!muted);
  });
  body.appendChild(toggle);

  function updateToggle() {
    toggle.setAttribute('aria-pressed', muted ? 'true' : 'false');
    toggle.textContent = muted ? '🔇' : '🔊';
    toggle.title = muted ? '사운드 켜기' : '사운드 끄기';
  }

  const firstGesture = async () => {
    await unlockAudio();
    document.removeEventListener('pointerdown', firstGesture, true);
    document.removeEventListener('touchstart', firstGesture, true);
    document.removeEventListener('click', firstGesture, true);
  };
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('touchstart', firstGesture, true);
  document.addEventListener('click', firstGesture, true);

  document.addEventListener('click', event => {
    const target = event.target.closest?.('button,.map-node.reachable');
    if (!target) return;
    if (target.id === 'audioToggle') return;
    if (target.id === 'rollBtn') playSfx('dice-roll');
    else if (target.id === 'combatAttackBtn') playSfx('attack');
    else if (target.id === 'combatSkillBtn') playSfx('skill');
    else if (target.id === 'combatDefendBtn') playSfx('defend');
    else if (target.matches('[data-shop-buy],[data-shop-sell]')) playSfx('shop');
    else if (target.matches('.danger,[data-dungeon-trap-roll]')) playSfx('danger');
    else playSfx('confirm');
  }, true);

  [titleScreen, setupScreen, gameScreen, combatOverlay].forEach(el => {
    if (!el) return;
    new MutationObserver(inferMode).observe(el, { attributes:true, attributeFilter:['class'] });
  });
  if (combatTitle) new MutationObserver(inferMode).observe(combatTitle, { childList:true, characterData:true, subtree:true });

  window.DRAGON_AUDIO_API = {
    unlock: unlockAudio,
    setMuted,
    playSfx,
    setMode(next) {
      if (!MUSIC[next]) return false;
      mode = next;
      body.dataset.avScene = next;
      restartMusic();
      return true;
    },
    snapshot() {
      return {
        unlocked,
        muted,
        mode,
        contextState: audioContext?.state || 'none',
        lastSfx,
      };
    },
  };

  updateToggle();
  inferMode();
})();
