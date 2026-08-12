// DRAGON BOARD V0.6.1.0 — playable 3D exploration controller
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';

const worldMap = document.querySelector('#worldMap');
const rollBtn = document.querySelector('#rollBtn');
const diceValue = document.querySelector('#diceValue');
const moveHint = document.querySelector('#moveHint');
const boardTitle = document.querySelector('#boardTitle');
const open3DBtnSelector = '.board3d-open-btn';

if (!worldMap || !rollBtn || !diceValue || !boardTitle) throw new Error('3D play controller targets not found');

let activeOverlay = null;
let syncTimer = 0;
let actionInFlight = false;
let lastWorldMutation = Date.now();
let cameraState = { azimuth: Math.PI * 0.23, elevation: Math.PI * 0.29, radius: 10.2 };
let pointerStarts = new Map();
let pointerPositions = new Map();
let lastPinchDistance = 0;

injectStyles();
observe3DOverlay();

const worldObserver = new MutationObserver(() => { lastWorldMutation = Date.now(); });
worldObserver.observe(worldMap, { childList:true, subtree:true, attributes:true, characterData:true });

function injectStyles() {
  if (document.querySelector('#board3dPlayStyles')) return;
  const style = document.createElement('style');
  style.id = 'board3dPlayStyles';
  style.textContent = `
    .board3d-overlay{grid-template-rows:auto 1fr auto auto!important}
    .board3d-gamebar{display:grid;gap:6px;padding:8px 10px;background:rgba(25,18,12,.96);border-top:1px solid #6c4d2d;color:#ead9b0}
    .board3d-gamebar-main{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
    .board3d-turn-info{min-width:0;display:flex;align-items:center;gap:7px;font-size:8px;color:#d8c59b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .board3d-turn-info strong{color:#f0bd4f;font-size:10px}
    .board3d-roll{min-width:116px;border:2px solid #89ad59;background:#4e7136;color:#fff0c8;padding:9px 11px;font:inherit;font-size:9px;box-shadow:2px 2px 0 #0a0705}
    .board3d-roll:disabled{opacity:.42;filter:grayscale(.5)}
    .board3d-route-row{display:flex;gap:6px;overflow-x:auto;padding-bottom:1px;min-height:28px;align-items:center}
    .board3d-route-row::-webkit-scrollbar{display:none}
    .board3d-route{flex:0 0 auto;border:1px solid #91b85d;background:#27351c;color:#e5efc6;padding:6px 8px;font:inherit;font-size:7px}
    .board3d-route-hint{font-size:7px;color:#a99673;line-height:1.4}
    .board3d-atmosphere{font-size:7px;color:#ccb882;letter-spacing:.2px}
    .board3d-overlay[data-theme="forest"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#5d7045 0%,#344128 35%,#1c2418 70%,#10130d 100%)!important}
    .board3d-overlay[data-theme="forest"] .board3d-canvas{filter:brightness(1.48) saturate(1.18) contrast(.94)!important}
    .board3d-overlay[data-theme="grave"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#5d5a70 0%,#383746 34%,#22212b 70%,#121117 100%)!important}
    .board3d-overlay[data-theme="grave"] .board3d-canvas{filter:brightness(1.48) saturate(.88) contrast(.93) hue-rotate(4deg)!important}
    .board3d-overlay[data-theme="war"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#765243 0%,#4b3028 34%,#2b1d19 70%,#150f0d 100%)!important}
    .board3d-overlay[data-theme="war"] .board3d-canvas{filter:brightness(1.46) saturate(1.12) contrast(.95) sepia(.08)!important}
    .board3d-overlay[data-theme="volcano"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#8b5834 0%,#5a3020 34%,#321b15 70%,#170d0b 100%)!important}
    .board3d-overlay[data-theme="volcano"] .board3d-canvas{filter:brightness(1.48) saturate(1.24) contrast(.94)!important}
    .board3d-overlay[data-action-busy="true"] .board3d-gamebar{opacity:.78}
    @media(max-width:700px){.board3d-gamebar{padding:7px 8px;gap:5px}.board3d-gamebar-main{grid-template-columns:minmax(0,1fr) 108px}.board3d-roll{min-width:108px;padding:8px;font-size:8px}}
  `;
  document.head.appendChild(style);
}

function observe3DOverlay() {
  const observer = new MutationObserver(() => {
    const overlay = document.querySelector('.board3d-overlay');
    if (overlay && overlay !== activeOverlay) setupOverlay(overlay);
    if (!overlay && activeOverlay) cleanupOverlay();
  });
  observer.observe(document.body, { childList:true });
  const existing = document.querySelector('.board3d-overlay');
  if (existing) setupOverlay(existing);
}

function setupOverlay(overlay) {
  activeOverlay = overlay;
  overlay.dataset.actionBusy = 'false';
  applyTheme(overlay);
  const hint = overlay.querySelector('.board3d-hint');
  const gamebar = document.createElement('section');
  gamebar.className = 'board3d-gamebar';
  gamebar.innerHTML = `<div class="board3d-gamebar-main"><div><div class="board3d-atmosphere"></div><div class="board3d-turn-info"><span data-3d-turn>턴 준비</span><strong data-3d-move>MOVE -</strong></div></div><button class="board3d-roll" type="button" data-3d-roll>🎲 D6 굴리기</button></div><div class="board3d-route-row" data-3d-routes><span class="board3d-route-hint">주사위를 굴리면 3D 보드에서 이동할 수 있어.</span></div>`;
  overlay.insertBefore(gamebar, hint || null);
  gamebar.querySelector('[data-3d-roll]').addEventListener('click', () => {
    if (actionInFlight || rollBtn.disabled) return;
    runGameAction(() => rollBtn.click(), 1700);
  });
  overlay.querySelector('[data-3d-reset]')?.addEventListener('click', () => {
    cameraState = { azimuth:Math.PI * 0.23, elevation:Math.PI * 0.29, radius:10.2 };
  });
  const canvas = overlay.querySelector('.board3d-canvas');
  if (canvas) bind3DTileTap(canvas);
  syncGamebar();
  clearInterval(syncTimer);
  syncTimer = window.setInterval(syncGamebar, 120);
}

function cleanupOverlay() {
  activeOverlay = null;
  clearInterval(syncTimer);
  syncTimer = 0;
  pointerStarts.clear();
  pointerPositions.clear();
  lastPinchDistance = 0;
}

function currentTheme() {
  const title = boardTitle.textContent || '';
  if (title.includes('저주받은 숲')) return ['forest','🌲 녹빛 안개가 내려앉은 저주받은 숲'];
  if (title.includes('망자의 땅')) return ['grave','☠️ 차가운 망령의 안개가 흐르는 망자의 땅'];
  if (title.includes('피의 전쟁터')) return ['war','⚔️ 붉은 먼지와 잿빛 연기가 감도는 피의 전쟁터'];
  if (title.includes('불타는 황무지')) return ['volcano','🔥 용암빛과 화산재가 번지는 불타는 황무지'];
  return ['road',`🗺️ ${title || '미지의 지역'}`];
}

function applyTheme(overlay) { overlay.dataset.theme = currentTheme()[0]; }

function syncGamebar() {
  if (!activeOverlay?.isConnected) return;
  applyTheme(activeOverlay);
  const [, atmosphere] = currentTheme();
  const atmosphereEl = activeOverlay.querySelector('.board3d-atmosphere');
  const turnEl = activeOverlay.querySelector('[data-3d-turn]');
  const moveEl = activeOverlay.querySelector('[data-3d-move]');
  const roll3D = activeOverlay.querySelector('[data-3d-roll]');
  const routesEl = activeOverlay.querySelector('[data-3d-routes]');
  if (atmosphereEl) atmosphereEl.textContent = atmosphere;
  if (turnEl) turnEl.textContent = moveHint?.textContent?.trim() || '현재 영웅 턴';
  if (moveEl) moveEl.textContent = `MOVE ${diceValue.textContent?.trim() || '-'}`;
  if (roll3D) { roll3D.disabled = rollBtn.disabled || actionInFlight; roll3D.textContent = actionInFlight ? '진행 중…' : '🎲 D6 굴리기'; }
  if (!routesEl) return;
  const reachable = [...worldMap.querySelectorAll('.map-node.reachable')];
  routesEl.innerHTML = '';
  if (actionInFlight) { routesEl.innerHTML = '<span class="board3d-route-hint">주사위/이동을 처리 중이야…</span>'; return; }
  if (reachable.length) {
    const hint = document.createElement('span');
    hint.className = 'board3d-route-hint';
    hint.textContent = reachable.length > 1 ? '갈림길 · 빛나는 3D 칸을 탭하거나:' : '이동 가능:';
    routesEl.appendChild(hint);
    reachable.forEach((tile,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'board3d-route';
      button.textContent = tile.querySelector('.node-name')?.textContent?.trim() || `경로 ${index + 1}`;
      button.addEventListener('click', () => runGameAction(() => tile.click(), 280));
      routesEl.appendChild(button);
    });
    return;
  }
  routesEl.innerHTML = !rollBtn.disabled ? '<span class="board3d-route-hint">D6를 굴려 이동을 시작해.</span>' : '<span class="board3d-route-hint">자동 이동 또는 도착 처리를 진행 중이야.</span>';
}

function hasForegroundGameUI() {
  return Boolean(document.querySelector('#modal:not(.hidden), #combatOverlay:not(.hidden), #lootOverlay:not(.hidden)'));
}

function runGameAction(action, minDelay) {
  if (actionInFlight || !activeOverlay) return;
  actionInFlight = true;
  activeOverlay.dataset.actionBusy = 'true';
  lastWorldMutation = Date.now();
  action();
  syncGamebar();
  const started = Date.now();
  const settle = window.setInterval(() => {
    if (!activeOverlay?.isConnected) { clearInterval(settle); actionInFlight = false; return; }
    if (hasForegroundGameUI()) { clearInterval(settle); actionInFlight = false; activeOverlay.querySelector('[data-3d-close]')?.click(); return; }
    const elapsed = Date.now() - started;
    const quietFor = Date.now() - lastWorldMutation;
    const moving = worldMap.classList.contains('movement-lock');
    if (elapsed >= minDelay && quietFor > 360 && !moving) { clearInterval(settle); actionInFlight = false; refresh3DView(); }
  }, 120);
  window.setTimeout(() => {
    if (!actionInFlight) return;
    clearInterval(settle);
    actionInFlight = false;
    if (hasForegroundGameUI()) activeOverlay?.querySelector('[data-3d-close]')?.click();
    else refresh3DView();
  }, 8500);
}

function refresh3DView() {
  if (!activeOverlay?.isConnected) return;
  const close = activeOverlay.querySelector('[data-3d-close]');
  const open = document.querySelector(open3DBtnSelector);
  close?.click();
  window.setTimeout(() => { if (!hasForegroundGameUI()) open?.click(); }, 70);
}

function bind3DTileTap(canvas) {
  canvas.addEventListener('pointerdown', event => {
    pointerStarts.set(event.pointerId,{x:event.clientX,y:event.clientY,moved:false});
    pointerPositions.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pointerPositions.size === 2) lastPinchDistance = pointerDistance();
  }, true);
  canvas.addEventListener('pointermove', event => {
    const prev = pointerPositions.get(event.pointerId); const start = pointerStarts.get(event.pointerId);
    if (!prev || !start) return;
    const dx = event.clientX - prev.x; const dy = event.clientY - prev.y;
    if (Math.hypot(event.clientX-start.x,event.clientY-start.y) > 7) start.moved = true;
    pointerPositions.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pointerPositions.size >= 2) {
      const distance = pointerDistance();
      if (lastPinchDistance > 0 && distance > 0) cameraState.radius = THREE.MathUtils.clamp(cameraState.radius * (lastPinchDistance/distance),6.4,15.5);
      lastPinchDistance = distance; return;
    }
    cameraState.azimuth -= dx * 0.009;
    cameraState.elevation = THREE.MathUtils.clamp(cameraState.elevation + dy * 0.006,0.28,1.10);
  }, true);
  canvas.addEventListener('pointerup', event => {
    const start = pointerStarts.get(event.pointerId);
    pointerStarts.delete(event.pointerId); pointerPositions.delete(event.pointerId);
    if (pointerPositions.size < 2) lastPinchDistance = 0;
    if (!start || start.moved || actionInFlight) return;
    pickReachableTile(event.clientX,event.clientY,canvas);
  }, true);
  canvas.addEventListener('pointercancel', event => { pointerStarts.delete(event.pointerId); pointerPositions.delete(event.pointerId); if (pointerPositions.size < 2) lastPinchDistance = 0; }, true);
  canvas.addEventListener('wheel', event => { cameraState.radius = THREE.MathUtils.clamp(cameraState.radius + Math.sign(event.deltaY)*0.55,6.4,15.5); }, {capture:true,passive:true});
}

function pointerDistance() {
  const values = [...pointerPositions.values()];
  if (values.length < 2) return 0;
  return Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y);
}

function pickReachableTile(clientX, clientY, canvas) {
  const reachable = [...worldMap.querySelectorAll('.map-node.reachable')];
  if (!reachable.length) return;
  const rect = canvas.getBoundingClientRect();
  const camera = new THREE.PerspectiveCamera(38,rect.width/Math.max(1,rect.height),0.1,50);
  const flat = Math.cos(cameraState.elevation) * cameraState.radius;
  camera.position.set(Math.sin(cameraState.azimuth)*flat,Math.sin(cameraState.elevation)*cameraState.radius,Math.cos(cameraState.azimuth)*flat);
  camera.lookAt(0,0.18,0); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  let best = null;
  reachable.forEach(tile => {
    const col = Number.parseInt(tile.style.gridColumn,10) || 1; const row = Number.parseInt(tile.style.gridRow,10) || 1;
    const p = new THREE.Vector3((col-4)*1.05,0.18,(row-4)*1.05).project(camera);
    if (p.z < -1 || p.z > 1) return;
    const sx = rect.left + (p.x*.5+.5)*rect.width; const sy = rect.top + (-p.y*.5+.5)*rect.height;
    const distance = Math.hypot(clientX-sx,clientY-sy);
    if (!best || distance < best.distance) best = {tile,distance};
  });
  const threshold = Math.max(34,Math.min(60,rect.width*.095));
  if (best && best.distance <= threshold) runGameAction(() => best.tile.click(),280);
}
