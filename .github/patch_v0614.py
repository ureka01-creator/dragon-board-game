from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}')
    p.write_text(text.replace(old, new, 1))

# board3d.js — add a real Three.js die that lives inside the WebGL scene.
replace_once('js/board3d.js',
"const tileRecords = new Map();",
"""const tileRecords = new Map();
let sceneDie = null;
let sceneDieRollToken = 0;""")

replace_once('js/board3d.js',
"""  disposeObject(boardRoot);
  boardRoot = null;""",
"""  if (sceneDie) {
    scene?.remove(sceneDie);
    disposeObject(sceneDie);
    sceneDie = null;
  }
  sceneDieRollToken += 1;
  disposeObject(boardRoot);
  boardRoot = null;""")

marker = 'function pickNodeAt(clientX,clientY,nodeIds=[]) {'
text = Path('js/board3d.js').read_text()
if marker not in text:
    raise SystemExit('board3d.js: pickNodeAt marker missing')

dice_code = r'''
function makeDieFaceTexture(value) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f3e2bd';
  ctx.fillRect(0,0,256,256);
  ctx.strokeStyle = '#6b5434';
  ctx.lineWidth = 10;
  ctx.strokeRect(5,5,246,246);
  ctx.fillStyle = '#30261b';
  const p = {
    tl:[70,70], tc:[128,70], tr:[186,70],
    ml:[70,128], mc:[128,128], mr:[186,128],
    bl:[70,186], bc:[128,186], br:[186,186],
  };
  const faces = {
    1:['mc'], 2:['tl','br'], 3:['tl','mc','br'],
    4:['tl','tr','bl','br'], 5:['tl','tr','mc','bl','br'],
    6:['tl','tr','ml','mr','bl','br'],
  };
  for (const key of faces[value] || []) {
    const [x,y] = p[key];
    ctx.beginPath(); ctx.arc(x,y,18,0,Math.PI*2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function ensureSceneDie() {
  if (!scene || sceneDie) return sceneDie;
  // BoxGeometry material order: right, left, top, bottom, front, back.
  const faceOrder = [3,4,2,5,1,6];
  const materials = faceOrder.map(value => new THREE.MeshStandardMaterial({
    map: makeDieFaceTexture(value),
    roughness: .42,
    metalness: .02,
  }));
  sceneDie = new THREE.Mesh(new THREE.BoxGeometry(.62,.62,.62), materials);
  sceneDie.castShadow = true;
  sceneDie.receiveShadow = true;
  sceneDie.visible = false;
  scene.add(sceneDie);
  return sceneDie;
}

function startSceneDiceRoll() {
  const die = ensureSceneDie();
  if (!die) return;
  const token = ++sceneDieRollToken;
  die.visible = true;
  die.position.set(-2.45, 3.9, 1.55);
  die.rotation.set(.28,.12,.08);
  const started = performance.now();
  const loop = now => {
    if (token !== sceneDieRollToken || !sceneDie?.visible) return;
    const t = (now - started) / 1000;
    if (t < .78) {
      const u = Math.max(0, Math.min(1, t / .78));
      const e = u * u * (3 - 2 * u);
      die.position.x = THREE.MathUtils.lerp(-2.45, .35, e);
      die.position.z = THREE.MathUtils.lerp(1.55, -.35, e);
      die.position.y = THREE.MathUtils.lerp(3.9, .47, u * u);
    } else {
      const g = t - .78;
      const travel = Math.min(g, 1.1);
      die.position.x = .35 + travel * .46;
      die.position.z = -.35 - travel * .19;
      const bounce = Math.abs(Math.sin(g * 10.5)) * Math.max(0, .62 - g * .52);
      die.position.y = .47 + bounce;
    }
    die.rotation.x = .28 + t * 10.8;
    die.rotation.y = .12 + t * 8.4;
    die.rotation.z = .08 + t * 6.1;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function dieTargetQuaternion(face) {
  const e = new THREE.Euler(0,0,0,'XYZ');
  if (face === 1) e.x = -Math.PI / 2;
  else if (face === 3) e.z = Math.PI / 2;
  else if (face === 4) e.z = -Math.PI / 2;
  else if (face === 5) e.x = Math.PI;
  else if (face === 6) e.x = Math.PI / 2;
  // face 2 is already on top in BoxGeometry material order.
  return new THREE.Quaternion().setFromEuler(e);
}

function settleSceneDice(face) {
  const die = ensureSceneDie();
  if (!die) return Promise.resolve();
  sceneDieRollToken += 1;
  die.visible = true;
  const fromPos = die.position.clone();
  const fromQuat = die.quaternion.clone();
  const toPos = new THREE.Vector3(.70,.47,-.55);
  const toQuat = dieTargetQuaternion(face);
  return new Promise(resolve => {
    const started = performance.now();
    const duration = 360;
    const frame = now => {
      const u = Math.max(0, Math.min(1, (now - started) / duration));
      const e = 1 - Math.pow(1 - u, 3);
      die.position.lerpVectors(fromPos,toPos,e);
      die.quaternion.copy(fromQuat).slerp(toQuat,e);
      if (u < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

function hideSceneDice() {
  sceneDieRollToken += 1;
  if (sceneDie) sceneDie.visible = false;
}

'''
text = text.replace(marker, dice_code + marker, 1)
Path('js/board3d.js').write_text(text)

replace_once('js/board3d.js',
"""    snapHeroToNode,
    endHeroMotion,
    pickNodeAt,""",
"""    snapHeroToNode,
    endHeroMotion,
    startDiceRoll:startSceneDiceRoll,
    settleDice:settleSceneDice,
    hideDice:hideSceneDice,
    pickNodeAt,""")

# board3d-play.js — stop using the fake DOM/CSS cube; drive the scene die instead.
p = Path('js/board3d-play.js')
t = p.read_text()
t = t.replace('.board3d-die-layer{position:', '.board3d-die-layer{display:none!important;position:', 1)
start = t.find('async function run3DDiceRoll(){')
end = t.find('function runGameAction(', start)
if start < 0 or end < 0:
    raise SystemExit('board3d-play.js: run3DDiceRoll block missing')
new_roll = r'''async function run3DDiceRoll(){
  if(actionInFlight||!activeOverlay||rollBtn.disabled)return;
  actionInFlight=true;
  activeOverlay.dataset.actionBusy='true';
  const before=diceValue.textContent?.trim()||'-';
  lastWorldMutation=Date.now();
  api()?.startDiceRoll?.();
  rollBtn.click();
  syncGamebar();

  const started=Date.now();
  let finalValue=null;
  while(Date.now()-started<6500){
    if(hasForegroundGameUI())break;
    const v=Number.parseInt(diceValue.textContent?.trim()||'',10);
    if(Number.isInteger(v)&&v>=1&&v<=6&&(diceValue.textContent?.trim()!==before||Date.now()-started>1500)){
      finalValue=v;
      break;
    }
    await waitMs(70);
  }
  finalValue=finalValue||Number.parseInt(diceValue.textContent?.trim()||'',10)||1;
  await api()?.settleDice?.(finalValue);
  await waitMs(320);
  api()?.hideDice?.();

  const movementWaitStarted=Date.now();
  while(Date.now()-movementWaitStarted<5200){
    if(hasForegroundGameUI())break;
    const moving=Boolean(worldMap.querySelector('.hero-hop-mover'))||worldMap.classList.contains('movement-lock');
    if(!moving&&Date.now()-lastWorldMutation>330)break;
    await waitMs(90);
  }
  finishAction();
}

'''
t = t[:start] + new_roll + t[end:]
p.write_text(t)

# Version/cache busting.
for f in ['js/board3d.js','js/board3d-play.js']:
    p=Path(f); t=p.read_text(); t=t.replace('V0.6.1.3','V0.6.1.4',1); p.write_text(t)

p=Path('index.html'); t=p.read_text();
t=t.replace('PROTOTYPE V0.6.1.3','PROTOTYPE V0.6.1.4')
t=t.replace('?v=0613','?v=0614')
p.write_text(t)

p=Path('README.md'); t=p.read_text()
lines=t.splitlines()
if lines and lines[0].startswith('# DRAGON BOARD'):
    lines[0]='# DRAGON BOARD — Web Prototype V0.6.1.4'
    t='\n'.join(lines)
    if not t.endswith('\n'): t+='\n'
    p.write_text(t)
