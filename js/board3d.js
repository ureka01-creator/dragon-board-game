// DRAGON BOARD V0.6.0.0 — experimental WebGL board preview
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';

const worldMap = document.querySelector('#worldMap');
const boardPanel = document.querySelector('.board-panel');
if (!worldMap || !boardPanel) throw new Error('3D board target not found');

const REGION_COLORS = {
  forest: 0x304526,
  grave: 0x39363f,
  war: 0x503126,
  volcano: 0x54271d,
  mine: 0x433a2b,
  road: 0x4c402b,
  village: 0x705028,
  dragon: 0x591d21,
};
const HERO_COLORS = {
  knight: 0xb94b3f,
  archer: 0x6f9b52,
  mage: 0x8068b4,
  rogue: 0x687a8d,
};

let overlay = null;
let renderer = null;
let scene = null;
let camera = null;
let animationId = 0;
let azimuth = Math.PI * 0.23;
let elevation = Math.PI * 0.29;
let radius = 10.2;
const pointers = new Map();
let lastPinchDistance = 0;

injectStyles();
installButton();

function injectStyles() {
  if (document.querySelector('#board3dStyles')) return;
  const style = document.createElement('style');
  style.id = 'board3dStyles';
  style.textContent = `
    .board3d-open-btn{margin-left:auto;padding:5px 8px;border:1px solid #7a5b34;background:#21180f;color:#e1c47f;font-size:8px;letter-spacing:.6px;white-space:nowrap}
    .board3d-open-btn:active{transform:translateY(1px)}
    .board3d-overlay{position:fixed;inset:0;z-index:500;background:#090806;display:grid;grid-template-rows:auto 1fr auto;touch-action:none;overscroll-behavior:none}
    .board3d-overlay.hidden{display:none}
    .board3d-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:max(10px,env(safe-area-inset-top)) 12px 9px;background:#1c150f;border-bottom:2px solid #604629;color:#e8d6aa}
    .board3d-topbar strong{font-size:11px;letter-spacing:1.1px;color:#d7a743}
    .board3d-actions{display:flex;gap:6px}
    .board3d-actions button{border:1px solid #715535;background:#2b2016;color:#dac89f;padding:6px 9px;font:inherit;font-size:8px}
    .board3d-canvas-wrap{position:relative;min-height:0;overflow:hidden;background:radial-gradient(circle at 50% 35%,#231b12,#090806 72%)}
    .board3d-canvas{display:block;width:100%;height:100%;touch-action:none}
    .board3d-badge{position:absolute;left:10px;top:10px;padding:5px 7px;border:1px solid rgba(215,167,67,.55);background:rgba(18,13,9,.78);color:#d8c28f;font-size:7px;pointer-events:none}
    .board3d-hint{padding:8px 12px max(9px,env(safe-area-inset-bottom));text-align:center;background:#17110d;border-top:1px solid #4d3928;color:#9f8d6d;font-size:7px;line-height:1.5}
    @media(max-width:700px){.board3d-open-btn{font-size:7px;padding:4px 6px}.board3d-topbar strong{font-size:9px}}
  `;
  document.head.appendChild(style);
}

function installButton() {
  const head = boardPanel.querySelector(':scope > .section-head');
  if (!head || head.querySelector('.board3d-open-btn')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'board3d-open-btn';
  button.textContent = '◇ 3D VIEW';
  button.setAttribute('aria-label', '현재 지역 3D 보드 보기');
  const moveHint = head.querySelector('#moveHint');
  head.insertBefore(button, moveHint || null);
  button.addEventListener('click', open3D);
}

function open3D() {
  close3D();
  overlay = document.createElement('section');
  overlay.className = 'board3d-overlay';
  overlay.setAttribute('aria-label', '3D 보드 미리보기');
  overlay.innerHTML = `
    <header class="board3d-topbar">
      <strong>DRAGON BOARD · 3D TEST</strong>
      <div class="board3d-actions">
        <button type="button" data-3d-reset>시점 초기화</button>
        <button type="button" data-3d-close>2D로 돌아가기</button>
      </div>
    </header>
    <div class="board3d-canvas-wrap">
      <canvas class="board3d-canvas"></canvas>
      <div class="board3d-badge">현재 지역 스냅샷 · 게임 로직은 기존 2D와 동일</div>
    </div>
    <div class="board3d-hint">한 손가락 드래그: 시점 회전 · 두 손가락: 확대/축소 · 3D 화면은 현재 지역을 그대로 재구성한 테스트 뷰야.</div>`;
  document.body.appendChild(overlay);
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  overlay.querySelector('[data-3d-close]').addEventListener('click', close3D);
  overlay.querySelector('[data-3d-reset]').addEventListener('click', () => {
    azimuth = Math.PI * 0.23;
    elevation = Math.PI * 0.29;
    radius = 10.2;
    updateCamera();
  });

  initScene(overlay.querySelector('canvas'));
}

function close3D() {
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  if (animationId) cancelAnimationFrame(animationId);
  animationId = 0;
  renderer = null;
  scene = null;
  camera = null;
  pointers.clear();
  lastPinchDistance = 0;
  overlay?.remove();
  overlay = null;
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

function initScene(canvas) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0907);
  scene.fog = new THREE.Fog(0x0b0907, 10, 18);

  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  updateCamera();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  scene.add(new THREE.HemisphereLight(0xe6cf9d, 0x24170e, 1.55));
  const key = new THREE.DirectionalLight(0xffdda2, 2.6);
  key.position.set(4.5, 8, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x7288aa, 0.75);
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  buildBoardFromDOM();
  bindPointerCamera(canvas);

  const resize = () => {
    if (!renderer || !camera || !canvas.isConnected) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  overlay?.addEventListener('remove', () => ro.disconnect(), { once: true });

  renderer.setAnimationLoop((time) => {
    if (!renderer || !scene || !camera) return;
    const t = time * 0.001;
    scene.traverse(obj => {
      if (obj.userData.heroPiece) obj.position.y = obj.userData.baseY + Math.sin(t * 2.2 + obj.userData.phase) * 0.018;
    });
    renderer.render(scene, camera);
  });
}

function updateCamera() {
  if (!camera) return;
  const flat = Math.cos(elevation) * radius;
  camera.position.set(
    Math.sin(azimuth) * flat,
    Math.sin(elevation) * radius,
    Math.cos(azimuth) * flat,
  );
  camera.lookAt(0, 0.18, 0);
}

function buildBoardFromDOM() {
  const board = new THREE.Group();
  scene.add(board);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(8.15, 0.28, 8.15),
    new THREE.MeshStandardMaterial({ color: 0x241a11, roughness: 0.88, metalness: 0.05 }),
  );
  base.position.y = -0.25;
  base.receiveShadow = true;
  board.add(base);

  const underBase = new THREE.Mesh(
    new THREE.BoxGeometry(8.42, 0.13, 8.42),
    new THREE.MeshStandardMaterial({ color: 0x0d0906, roughness: 1 }),
  );
  underBase.position.y = -0.43;
  underBase.receiveShadow = true;
  board.add(underBase);

  const grid = new THREE.GridHelper(7.35, 7, 0x77552f, 0x302318);
  grid.position.y = -0.095;
  board.add(grid);

  [...worldMap.querySelectorAll('.map-node')].forEach(tileEl => addTile(board, tileEl));
}

function addTile(board, tileEl) {
  const col = Number.parseInt(tileEl.style.gridColumn, 10) || 1;
  const row = Number.parseInt(tileEl.style.gridRow, 10) || 1;
  const x = (col - 4) * 1.05;
  const z = (row - 4) * 1.05;
  const deepFog = tileEl.classList.contains('deep-fog');
  const fogged = tileEl.classList.contains('fogged');
  const reachable = tileEl.classList.contains('reachable');
  const current = tileEl.classList.contains('current');
  const region = [...tileEl.classList].find(name => name.startsWith('region-'))?.replace('region-', '') || 'road';
  const height = current ? 0.24 : reachable ? 0.21 : 0.16;
  let color = REGION_COLORS[region] || REGION_COLORS.road;
  if (deepFog) color = 0x101014;
  else if (fogged) color = 0x1b1c20;

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: current ? 0.18 : 0.05,
    emissive: current ? 0x5c3c08 : reachable ? 0x223b0e : 0x000000,
    emissiveIntensity: current ? 0.65 : reachable ? 0.45 : 0,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.91, height, 0.91), material);
  mesh.position.set(x, height * 0.5, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  board.add(mesh);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: current ? 0xe0aa45 : reachable ? 0x9fca60 : 0x6a4d2e, transparent: true, opacity: deepFog ? 0.25 : 0.78 }),
  );
  edges.position.copy(mesh.position);
  board.add(edges);

  if (!deepFog) {
    const icon = tileEl.querySelector('.node-icon')?.textContent?.trim() || '';
    const name = tileEl.querySelector('.node-name')?.textContent?.trim() || '';
    const type = tileEl.querySelector('.node-type')?.textContent?.trim() || '';
    if (icon || name) {
      const label = makeLabelSprite(icon, name, current);
      label.position.set(x, height + 0.34, z - 0.03);
      board.add(label);
    }
    addLandmark(board, type, x, z, height);
  }

  const tokens = [...tileEl.querySelectorAll('.map-hero-token')];
  tokens.forEach((token, index) => {
    const heroId = token.dataset.heroId || 'knight';
    const offsets = tokens.length <= 1 ? [[0,0]] : [[-0.16,-0.12],[0.16,-0.12],[-0.16,0.17],[0.16,0.17]];
    const [ox, oz] = offsets[index] || [0,0];
    const piece = makeHeroPiece(heroId, token.classList.contains('active'));
    piece.position.set(x + ox, height + 0.03, z + oz);
    piece.userData.baseY = height + 0.03;
    piece.userData.phase = index * 1.3 + col * 0.4;
    piece.userData.heroPiece = true;
    board.add(piece);
  });
}

function addLandmark(board, type, x, z, tileHeight) {
  if (!type || /길|사건|빈|위험/.test(type)) return;
  const group = new THREE.Group();
  group.position.set(x + 0.25, tileHeight + 0.03, z + 0.23);

  if (/보스/.test(type)) {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x8f6a28, metalness: 0.35, roughness: 0.45 }));
    pedestal.position.y = 0.10;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 5), new THREE.MeshStandardMaterial({ color: 0xd7a743, emissive: 0x5a3305, emissiveIntensity: 0.45 }));
    crown.position.y = 0.28;
    group.add(pedestal, crown);
  } else if (/마을|상점/.test(type)) {
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.20), new THREE.MeshStandardMaterial({ color: 0x765238 }));
    house.position.y = 0.09;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.15, 4), new THREE.MeshStandardMaterial({ color: 0x9a553a }));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.235;
    group.add(house, roof);
  } else if (/던전/.test(type)) {
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.08), new THREE.MeshStandardMaterial({ color: 0x5b554d }));
    const right = left.clone();
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.08), new THREE.MeshStandardMaterial({ color: 0x6b645a }));
    left.position.set(-0.08,0.12,0); right.position.set(0.08,0.12,0); top.position.set(0,0.23,0);
    group.add(left,right,top);
  } else if (/보물/.test(type)) {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.15,0.16), new THREE.MeshStandardMaterial({ color: 0x8a5e2b, metalness: 0.12 }));
    chest.position.y = 0.075;
    group.add(chest);
  }

  group.traverse(obj => { if (obj.isMesh) obj.castShadow = true; });
  board.add(group);
}

function makeHeroPiece(heroId, active) {
  const color = HERO_COLORS[heroId] || 0xb94b3f;
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0x241a11, metalness: 0.25, roughness: 0.6 }));
  base.position.y = 0.035;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.13, 0.28, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.58, emissive: active ? color : 0x000000, emissiveIntensity: active ? 0.35 : 0 }));
  body.position.y = 0.21;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 8), new THREE.MeshStandardMaterial({ color: 0xc7906b, roughness: 0.75 }));
  head.position.y = 0.42;
  const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.34, 0.025), new THREE.MeshStandardMaterial({ color: 0xbcb3a1, metalness: 0.55, roughness: 0.35 }));
  weapon.rotation.z = -0.22;
  weapon.position.set(0.14,0.25,0);
  group.add(base, body, head, weapon);
  group.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
  return group;
}

function makeLabelSprite(icon, name, active) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 156;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = active ? 'rgba(67,43,14,.94)' : 'rgba(18,14,11,.88)';
  roundedRect(ctx, 8, 10, 496, 136, 18);
  ctx.fill();
  ctx.strokeStyle = active ? '#e0aa45' : '#745738';
  ctx.lineWidth = 5;
  roundedRect(ctx, 8, 10, 496, 136, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f0ddb0';
  ctx.font = '56px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  ctx.fillText(icon || '·', 256, 50);
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif';
  const text = (name || '').length > 9 ? `${name.slice(0,9)}…` : name;
  ctx.fillText(text, 256, 108);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map:texture, transparent:true, depthWrite:false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.20, 0.37, 1);
  return sprite;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function bindPointerCamera(canvas) {
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', event => {
    canvas.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
    lastX = event.clientX;
    lastY = event.clientY;
    if (pointers.size === 2) lastPinchDistance = pointerDistance();
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const prev = pointers.get(event.pointerId);
    pointers.set(event.pointerId, { x:event.clientX, y:event.clientY });

    if (pointers.size >= 2) {
      const distance = pointerDistance();
      if (lastPinchDistance > 0 && distance > 0) {
        radius = THREE.MathUtils.clamp(radius * (lastPinchDistance / distance), 6.4, 15.5);
        updateCamera();
      }
      lastPinchDistance = distance;
      return;
    }

    const dx = event.clientX - (prev?.x ?? lastX);
    const dy = event.clientY - (prev?.y ?? lastY);
    azimuth -= dx * 0.009;
    elevation = THREE.MathUtils.clamp(elevation + dy * 0.006, 0.28, 1.10);
    lastX = event.clientX;
    lastY = event.clientY;
    updateCamera();
  });
  const release = event => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) lastPinchDistance = 0;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    radius = THREE.MathUtils.clamp(radius + Math.sign(event.deltaY) * 0.55, 6.4, 15.5);
    updateCamera();
  }, { passive:false });
}

function pointerDistance() {
  const values = [...pointers.values()];
  if (values.length < 2) return 0;
  return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
}
