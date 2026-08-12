// DRAGON BOARD V0.6.1.3 — persistent WebGL board + live movement bridge
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js';

const worldMap = document.querySelector('#worldMap');
const boardPanel = document.querySelector('.board-panel');
if (!worldMap || !boardPanel) throw new Error('3D board target not found');

const REGION_COLORS = {
  forest: 0x304526,
  grave: 0x45424d,
  war: 0x5a3528,
  volcano: 0x63301f,
  mine: 0x4a4030,
  road: 0x574931,
  village: 0x79582f,
  dragon: 0x692429,
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
let boardRoot = null;
let resizeObserver = null;
let azimuth = Math.PI * 0.23;
let elevation = Math.PI * 0.29;
let radius = 10.2;
const pointers = new Map();
let lastPinchDistance = 0;
const heroPieces = new Map();
const tileRecords = new Map();

injectStyles();
installButton();
installPublicApi();

function injectStyles() {
  if (document.querySelector('#board3dStyles')) return;
  const style = document.createElement('style');
  style.id = 'board3dStyles';
  style.textContent = `
    .board3d-open-btn{margin-left:auto;padding:5px 8px;border:1px solid #7a5b34;background:#21180f;color:#e1c47f;font-size:8px;letter-spacing:.6px;white-space:nowrap}
    .board3d-open-btn:active{transform:translateY(1px)}
    .board3d-overlay{position:fixed;inset:0;z-index:500;background:#17110c;display:grid;grid-template-rows:auto 1fr auto;touch-action:none;overscroll-behavior:none}
    .board3d-overlay.hidden{display:none}
    .board3d-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:max(10px,env(safe-area-inset-top)) 12px 9px;background:#241a12;border-bottom:2px solid #765634;color:#f0ddb0}
    .board3d-topbar strong{font-size:11px;letter-spacing:1.1px;color:#e4b453}
    .board3d-actions{display:flex;gap:6px}
    .board3d-actions button{border:1px solid #806141;background:#34261a;color:#ead6aa;padding:6px 9px;font:inherit;font-size:8px}
    .board3d-canvas-wrap{position:relative;min-height:0;overflow:hidden;background:radial-gradient(circle at 50% 34%,#4b3924 0%,#2b2117 38%,#17110c 75%,#0f0c09 100%)}
    .board3d-canvas{display:block;width:100%;height:100%;touch-action:none;filter:brightness(1.32) saturate(1.08) contrast(.98)}
    .board3d-badge{position:absolute;left:10px;top:10px;padding:5px 7px;border:1px solid rgba(231,187,93,.75);background:rgba(37,27,18,.82);color:#f1ddb0;font-size:7px;pointer-events:none}
    .board3d-hint{padding:8px 12px max(9px,env(safe-area-inset-bottom));text-align:center;background:#1d1610;border-top:1px solid #5c432d;color:#ad9977;font-size:7px;line-height:1.5}
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
  overlay.setAttribute('aria-label', '3D 보드');
  overlay.innerHTML = `
    <header class="board3d-topbar">
      <strong>DRAGON BOARD · 3D</strong>
      <div class="board3d-actions">
        <button type="button" data-3d-reset>시점 초기화</button>
        <button type="button" data-3d-close>2D로 돌아가기</button>
      </div>
    </header>
    <div class="board3d-canvas-wrap">
      <canvas class="board3d-canvas"></canvas>
      <div class="board3d-badge">3D 탐험 모드</div>
    </div>
    <div class="board3d-hint">한 손가락 드래그: 시점 회전 · 두 손가락: 확대/축소</div>`;
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
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  disposeObject(boardRoot);
  boardRoot = null;
  heroPieces.clear();
  tileRecords.clear();
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
  scene.background = new THREE.Color(0x18120d);
  scene.fog = new THREE.Fog(0x18120d, 11.5, 20);
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  updateCamera();

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.34;

  scene.add(new THREE.HemisphereLight(0xffe5b5, 0x3a281a, 2.05));
  const key = new THREE.DirectionalLight(0xffdfaa, 3.25);
  key.position.set(4.5,8,5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fa5c7, 1.0);
  rim.position.set(-6,3,-5);
  scene.add(rim);

  rebuildBoardFromDOM();
  bindPointerCamera(canvas);
  const resize = () => {
    if (!renderer || !camera || !canvas.isConnected) return;
    const width = Math.max(1,canvas.clientWidth);
    const height = Math.max(1,canvas.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  renderer.setAnimationLoop((time) => {
    if (!renderer || !scene || !camera) return;
    const t = time * 0.001;
    heroPieces.forEach(piece => {
      if (!piece.userData.motionLocked) {
        piece.position.y = piece.userData.baseY + Math.sin(t*2.2 + piece.userData.phase)*0.014;
      }
    });
    renderer.render(scene,camera);
  });
}

function updateCamera() {
  if (!camera) return;
  const flat = Math.cos(elevation) * radius;
  camera.position.set(Math.sin(azimuth)*flat, Math.sin(elevation)*radius, Math.cos(azimuth)*flat);
  camera.lookAt(0,0.18,0);
}

function rebuildBoardFromDOM() {
  if (!scene) return;
  if (boardRoot) {
    scene.remove(boardRoot);
    disposeObject(boardRoot);
  }
  heroPieces.clear();
  tileRecords.clear();
  boardRoot = new THREE.Group();
  scene.add(boardRoot);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(8.15,.28,8.15),
    new THREE.MeshStandardMaterial({color:0x302319,roughness:.87,metalness:.04}),
  );
  base.position.y = -.25;
  base.receiveShadow = true;
  boardRoot.add(base);
  const underBase = new THREE.Mesh(
    new THREE.BoxGeometry(8.42,.13,8.42),
    new THREE.MeshStandardMaterial({color:0x130e0a,roughness:1}),
  );
  underBase.position.y = -.43;
  underBase.receiveShadow = true;
  boardRoot.add(underBase);
  const grid = new THREE.GridHelper(7.35,7,0x8a6338,0x44301f);
  grid.position.y = -.095;
  boardRoot.add(grid);

  [...worldMap.querySelectorAll('.map-node')].forEach(tile => addTile(boardRoot,tile));
}

function tileHeight(tile) {
  return tile.classList.contains('current') ? .24 : tile.classList.contains('reachable') ? .21 : .16;
}

function tileWorldPoint(tile) {
  const col = Number.parseInt(tile.style.gridColumn,10) || 1;
  const row = Number.parseInt(tile.style.gridRow,10) || 1;
  const h = tileHeight(tile);
  return {x:(col-4)*1.05,z:(row-4)*1.05,y:h+.03,height:h,col,row};
}

function addTile(board,tile) {
  const nodeId = tile.dataset.nodeId || '';
  const p = tileWorldPoint(tile);
  const deepFog = tile.classList.contains('deep-fog');
  const fogged = tile.classList.contains('fogged');
  const reachable = tile.classList.contains('reachable');
  const current = tile.classList.contains('current');
  const region = [...tile.classList].find(name=>name.startsWith('region-'))?.replace('region-','') || 'road';
  let color = REGION_COLORS[region] || REGION_COLORS.road;
  if (deepFog) color = 0x151519;
  else if (fogged) color = 0x24252a;

  const material = new THREE.MeshStandardMaterial({
    color, roughness:.76, metalness:current ? .16 : .04,
    emissive:current ? 0x72500c : reachable ? 0x294b11 : 0x000000,
    emissiveIntensity:current ? .72 : reachable ? .52 : 0,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(.91,p.height,.91),material);
  mesh.position.set(p.x,p.height*.5,p.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  board.add(mesh);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({color:current?0xf0bd55:reachable?0xb3dc72:0x805d39,transparent:true,opacity:deepFog ? .25 : .82}),
  );
  edges.position.copy(mesh.position);
  board.add(edges);
  if (nodeId) tileRecords.set(nodeId,{tile,mesh,edges,...p});

  if (!deepFog) {
    const icon = tile.querySelector('.node-icon')?.textContent?.trim() || '';
    const name = tile.querySelector('.node-name')?.textContent?.trim() || '';
    const type = tile.querySelector('.node-type')?.textContent?.trim() || '';
    if (icon || name) {
      const label = makeLabelSprite(icon,name,current);
      label.position.set(p.x,p.height+.34,p.z-.03);
      board.add(label);
    }
    addLandmark(board,type,p.x,p.z,p.height);
  }

  const tokens = [...tile.querySelectorAll('.map-hero-token')];
  tokens.forEach((token,index)=>{
    const heroId = token.dataset.heroId || 'knight';
    const offsets = tokens.length<=1 ? [[0,0]] : [[-.16,-.12],[.16,-.12],[-.16,.17],[.16,.17]];
    const [ox,oz] = offsets[index] || [0,0];
    const piece = makeHeroPiece(heroId,token.classList.contains('active'));
    piece.position.set(p.x+ox,p.y,p.z+oz);
    piece.userData.baseY = p.y;
    piece.userData.phase = index*1.3+p.col*.4;
    piece.userData.heroPiece = true;
    piece.userData.heroId = heroId;
    piece.userData.motionLocked = false;
    heroPieces.set(heroId,piece);
    board.add(piece);
  });
}

function addLandmark(board,type,x,z,h) {
  if (!type || /길|사건|빈|위험/.test(type)) return;
  const group = new THREE.Group();
  group.position.set(x+.25,h+.03,z+.23);
  if (/보스/.test(type)) {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.10,.14,.2,6),new THREE.MeshStandardMaterial({color:0xa37a31,metalness:.3,roughness:.45}));
    pedestal.position.y=.10;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(.12,.18,5),new THREE.MeshStandardMaterial({color:0xe4b54a,emissive:0x6a3d08,emissiveIntensity:.5}));
    crown.position.y=.28;
    group.add(pedestal,crown);
  } else if (/마을|상점/.test(type)) {
    const house = new THREE.Mesh(new THREE.BoxGeometry(.22,.18,.20),new THREE.MeshStandardMaterial({color:0x8b6241}));
    house.position.y=.09;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(.19,.15,4),new THREE.MeshStandardMaterial({color:0xad6244}));
    roof.rotation.y=Math.PI/4; roof.position.y=.235; group.add(house,roof);
  } else if (/던전/.test(type)) {
    const mat = new THREE.MeshStandardMaterial({color:0x777067});
    const left = new THREE.Mesh(new THREE.BoxGeometry(.06,.24,.08),mat);
    const right = left.clone();
    const top = new THREE.Mesh(new THREE.BoxGeometry(.24,.06,.08),mat.clone());
    left.position.set(-.08,.12,0); right.position.set(.08,.12,0); top.position.set(0,.23,0); group.add(left,right,top);
  } else if (/보물/.test(type)) {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(.22,.15,.16),new THREE.MeshStandardMaterial({color:0x9b6b30,metalness:.12}));
    chest.position.y=.075; group.add(chest);
  }
  group.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  board.add(group);
}

function makeHeroPiece(heroId,active) {
  const color = HERO_COLORS[heroId] || HERO_COLORS.knight;
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.16,.19,.07,12),new THREE.MeshStandardMaterial({color:0x302116,metalness:.22,roughness:.58}));
  base.position.y=.035;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.095,.13,.28,8),new THREE.MeshStandardMaterial({color,roughness:.55,emissive:active?color:0x000000,emissiveIntensity:active?.30:0}));
  body.position.y=.21;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.10,12,8),new THREE.MeshStandardMaterial({color:0xd39a73,roughness:.7}));
  head.position.y=.42;
  const weapon = new THREE.Mesh(new THREE.BoxGeometry(.025,.34,.025),new THREE.MeshStandardMaterial({color:0xc8c0af,metalness:.52,roughness:.32}));
  weapon.rotation.z=-.22; weapon.position.set(.14,.25,0);
  group.add(base,body,head,weapon);
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  return group;
}

function makeLabelSprite(icon,name,active) {
  const c=document.createElement('canvas'); c.width=512; c.height=156;
  const ctx=c.getContext('2d');
  ctx.fillStyle=active?'rgba(82,53,18,.95)':'rgba(28,21,16,.9)'; roundedRect(ctx,8,10,496,136,18); ctx.fill();
  ctx.strokeStyle=active?'#efb84b':'#866344'; ctx.lineWidth=5; roundedRect(ctx,8,10,496,136,18); ctx.stroke();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f4dfaf';ctx.font='56px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';ctx.fillText(icon||'·',256,50);
  ctx.font='bold 34px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif';
  const text=(name||'').length>9?`${name.slice(0,9)}…`:name;ctx.fillText(text,256,108);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  sprite.scale.set(1.20,.37,1);return sprite;
}

function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

function bindPointerCamera(canvas) {
  let lastX=0,lastY=0;
  canvas.addEventListener('pointerdown',e=>{
    canvas.setPointerCapture?.(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); lastX=e.clientX;lastY=e.clientY;
    if(pointers.size===2)lastPinchDistance=pointerDistance();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size>=2){const d=pointerDistance();if(lastPinchDistance>0&&d>0){radius=THREE.MathUtils.clamp(radius*(lastPinchDistance/d),6.4,15.5);updateCamera();}lastPinchDistance=d;return;}
    azimuth-=(e.clientX-(prev?.x??lastX))*.009;elevation=THREE.MathUtils.clamp(elevation+(e.clientY-(prev?.y??lastY))*.006,.28,1.10);lastX=e.clientX;lastY=e.clientY;updateCamera();
  });
  const release=e=>{pointers.delete(e.pointerId);if(pointers.size<2)lastPinchDistance=0;};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('wheel',e=>{e.preventDefault();radius=THREE.MathUtils.clamp(radius+Math.sign(e.deltaY)*.55,6.4,15.5);updateCamera();},{passive:false});
}
function pointerDistance(){const v=[...pointers.values()];return v.length<2?0:Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);}

function linearFit(samples) {
  if (samples.length < 2) return {m:1,b:0};
  const n=samples.length;
  const sx=samples.reduce((a,s)=>a+s[0],0), sy=samples.reduce((a,s)=>a+s[1],0);
  const sxx=samples.reduce((a,s)=>a+s[0]*s[0],0), sxy=samples.reduce((a,s)=>a+s[0]*s[1],0);
  const den=n*sxx-sx*sx;
  if(Math.abs(den)<1e-6)return {m:1,b:0};
  const m=(n*sxy-sx*sy)/den;return {m,b:(sy-m*sx)/n};
}

function mapPixelToWorld(px,py) {
  const mapRect=worldMap.getBoundingClientRect();
  const nodes=[...worldMap.querySelectorAll('.map-node')];
  const xs=[],ys=[];
  nodes.forEach(tile=>{
    const r=tile.getBoundingClientRect();
    const col=Number.parseInt(tile.style.gridColumn,10)||1;
    const row=Number.parseInt(tile.style.gridRow,10)||1;
    xs.push([r.left-mapRect.left+r.width*.5,(col-4)*1.05]);
    ys.push([r.top-mapRect.top+r.height*.5,(row-4)*1.05]);
  });
  const fx=linearFit(xs),fy=linearFit(ys);
  return {x:fx.m*px+fx.b,z:fy.m*py+fy.b};
}

function setHeroFromMapPixel(heroId,px,py,liftPx=0) {
  let piece=heroPieces.get(heroId);
  if(!piece){rebuildBoardFromDOM();piece=heroPieces.get(heroId);}
  if(!piece)return;
  const p=mapPixelToWorld(px,py);
  const dx=p.x-piece.position.x,dz=p.z-piece.position.z;
  if(Math.hypot(dx,dz)>.001)piece.rotation.y=Math.atan2(dx,dz);
  piece.userData.motionLocked=true;
  piece.position.x=p.x;piece.position.z=p.z;
  const lift=Math.min(.12,Math.max(0,liftPx)*.0045);
  piece.position.y=(piece.userData.baseY||.27)+lift;
}

function endHeroMotion(heroId) {
  const piece=heroPieces.get(heroId);
  if(piece)piece.userData.motionLocked=false;
}

function snapHeroToNode(heroId,nodeId) {
  const piece=heroPieces.get(heroId);
  const rec=tileRecords.get(nodeId);
  if(!piece||!rec)return;
  const y=rec.height+.03;
  piece.position.set(rec.x,y,rec.z);
  piece.userData.baseY=y;
  piece.userData.motionLocked=true;
}

function pickNodeAt(clientX,clientY,nodeIds=[]) {
  if(!camera||!renderer)return null;
  const allowed=new Set(nodeIds);
  const rect=renderer.domElement.getBoundingClientRect();
  let best=null;
  tileRecords.forEach((rec,id)=>{
    if(allowed.size&&!allowed.has(id))return;
    const v=new THREE.Vector3(rec.x,rec.height+.04,rec.z).project(camera);
    if(v.z < -1 || v.z > 1)return;
    const sx=rect.left+(v.x*.5+.5)*rect.width;
    const sy=rect.top+(-v.y*.5+.5)*rect.height;
    const d=Math.hypot(clientX-sx,clientY-sy);
    if(!best||d<best.distance)best={id,distance:d};
  });
  const threshold=Math.max(34,Math.min(62,rect.width*.10));
  return best&&best.distance<=threshold?best.id:null;
}

function disposeObject(root) {
  if(!root)return;
  root.traverse?.(o=>{
    o.geometry?.dispose?.();
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.filter(Boolean).forEach(m=>{m.map?.dispose?.();m.dispose?.();});
  });
}

function installPublicApi() {
  window.DRAGON_BOARD_3D_API = {
    isActive:()=>Boolean(overlay?.isConnected&&scene&&renderer),
    refresh:()=>{if(overlay?.isConnected)rebuildBoardFromDOM();},
    setHeroFromMapPixel,
    snapHeroToNode,
    endHeroMotion,
    pickNodeAt,
    close:close3D,
  };
}
