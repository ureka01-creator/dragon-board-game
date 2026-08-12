// DRAGON BOARD V0.6.1.2 — persistent playable 3D exploration
const worldMap = document.querySelector('#worldMap');
const rollBtn = document.querySelector('#rollBtn');
const diceValue = document.querySelector('#diceValue');
const moveHint = document.querySelector('#moveHint');
const boardTitle = document.querySelector('#boardTitle');
if (!worldMap || !rollBtn || !diceValue || !boardTitle) throw new Error('3D play controller targets not found');

let activeOverlay = null;
let syncTimer = 0;
let actionInFlight = false;
let lastWorldMutation = Date.now();
const pointerStarts = new Map();
const movingHeroIds = new Set();

injectStyles();
observe3DOverlay();

const worldObserver = new MutationObserver(() => {
  lastWorldMutation = Date.now();
  mirrorUnderlyingMovement();
});
worldObserver.observe(worldMap, { childList:true, subtree:true, attributes:true, characterData:true });

function api() { return window.DRAGON_BOARD_3D_API; }

function injectStyles() {
  if (document.querySelector('#board3dPlayStyles')) return;
  const style = document.createElement('style');
  style.id = 'board3dPlayStyles';
  style.textContent = `
    .board3d-overlay{grid-template-rows:auto 1fr auto auto!important}
    .board3d-gamebar{display:grid;gap:6px;padding:8px 10px;background:rgba(31,22,15,.97);border-top:1px solid #765334;color:#ead9b0}
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
    .board3d-overlay[data-theme="forest"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#65794c 0%,#39472c 35%,#20291a 70%,#12160f 100%)!important}
    .board3d-overlay[data-theme="grave"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#68647a 0%,#403e50 34%,#282632 70%,#15131b 100%)!important}
    .board3d-overlay[data-theme="war"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#815a49 0%,#51352c 34%,#30201b 70%,#18100e 100%)!important}
    .board3d-overlay[data-theme="volcano"] .board3d-canvas-wrap{background:radial-gradient(circle at 50% 28%,#965f38 0%,#623523 34%,#381e17 70%,#1b0f0c 100%)!important}
    .board3d-overlay[data-action-busy="true"] .board3d-gamebar{opacity:.84}
    .board3d-die-layer{position:absolute;inset:0;z-index:8;display:grid;place-items:center;pointer-events:none;perspective:720px;overflow:hidden}
    .board3d-die-shadow{position:absolute;left:50%;top:62%;width:62px;height:18px;border-radius:50%;background:rgba(0,0,0,.42);filter:blur(4px);transform:translate(-50%,-50%) scale(.45);opacity:0;transition:opacity .15s,transform .15s}
    .board3d-die-shadow.visible{opacity:.68;transform:translate(-50%,-50%) scale(1)}
    .board3d-die{--die:58px;position:absolute;left:50%;top:62%;width:var(--die);height:var(--die);margin:calc(var(--die)*-.5);transform-style:preserve-3d;opacity:0;will-change:transform,opacity;filter:drop-shadow(8px 12px 5px rgba(0,0,0,.42))}
    .board3d-die.visible{opacity:1}
    .board3d-die-face{position:absolute;inset:0;display:grid;place-items:center;border:2px solid #6c5636;border-radius:9px;background:linear-gradient(145deg,#fff3d2,#e9d3aa 72%,#c5a873);color:#30261b;font-size:38px;line-height:1;box-shadow:inset 2px 2px 0 rgba(255,255,255,.45),inset -3px -3px 0 rgba(78,49,23,.18);backface-visibility:hidden}
    .board3d-die-face.f1{transform:translateZ(calc(var(--die)*.5))}.board3d-die-face.f6{transform:rotateY(180deg) translateZ(calc(var(--die)*.5))}.board3d-die-face.f3{transform:rotateY(90deg) translateZ(calc(var(--die)*.5))}.board3d-die-face.f4{transform:rotateY(-90deg) translateZ(calc(var(--die)*.5))}.board3d-die-face.f2{transform:rotateX(90deg) translateZ(calc(var(--die)*.5))}.board3d-die-face.f5{transform:rotateX(-90deg) translateZ(calc(var(--die)*.5))}
    .board3d-die-result{position:absolute;left:50%;top:72%;transform:translateX(-50%);padding:5px 8px;border:1px solid rgba(230,185,89,.72);background:rgba(23,16,10,.88);color:#f0cf80;font-size:9px;letter-spacing:.5px;opacity:0;transition:opacity .15s}
    .board3d-die-result.visible{opacity:1}
    @media(max-width:700px){.board3d-gamebar{padding:7px 8px;gap:5px}.board3d-gamebar-main{grid-template-columns:minmax(0,1fr) 108px}.board3d-roll{min-width:108px;padding:8px;font-size:8px}.board3d-die{--die:52px}.board3d-die-face{font-size:34px}}
  `;
  document.head.appendChild(style);
}

function observe3DOverlay() {
  const observer = new MutationObserver(() => {
    const overlay = document.querySelector('.board3d-overlay');
    if (overlay && overlay !== activeOverlay) setupOverlay(overlay);
    if (!overlay && activeOverlay) cleanupOverlay();
  });
  observer.observe(document.body,{childList:true});
  const existing=document.querySelector('.board3d-overlay');
  if(existing)setupOverlay(existing);
}

function setupOverlay(overlay) {
  activeOverlay=overlay;
  overlay.dataset.actionBusy='false';
  applyTheme();
  const wrap=overlay.querySelector('.board3d-canvas-wrap');
  if(wrap&&!wrap.querySelector('.board3d-die-layer')){
    const layer=document.createElement('div');
    layer.className='board3d-die-layer';
    layer.innerHTML='<div class="board3d-die-shadow"></div><div class="board3d-die"><div class="board3d-die-face f1">⚀</div><div class="board3d-die-face f2">⚁</div><div class="board3d-die-face f3">⚂</div><div class="board3d-die-face f4">⚃</div><div class="board3d-die-face f5">⚄</div><div class="board3d-die-face f6">⚅</div></div><div class="board3d-die-result"></div>';
    wrap.appendChild(layer);
  }
  const hint=overlay.querySelector('.board3d-hint');
  const gamebar=document.createElement('section');
  gamebar.className='board3d-gamebar';
  gamebar.innerHTML='<div class="board3d-gamebar-main"><div><div class="board3d-atmosphere"></div><div class="board3d-turn-info"><span data-3d-turn>턴 준비</span><strong data-3d-move>MOVE -</strong></div></div><button class="board3d-roll" type="button" data-3d-roll>🎲 D6 굴리기</button></div><div class="board3d-route-row" data-3d-routes><span class="board3d-route-hint">주사위를 굴리면 3D 보드에서 이동할 수 있어.</span></div>';
  overlay.insertBefore(gamebar,hint||null);
  gamebar.querySelector('[data-3d-roll]').addEventListener('click',()=>{if(!actionInFlight&&!rollBtn.disabled)run3DDiceRoll();});
  const canvas=overlay.querySelector('.board3d-canvas');
  if(canvas)bind3DTileTap(canvas);
  syncGamebar();
  clearInterval(syncTimer);
  syncTimer=window.setInterval(syncGamebar,120);
}

function cleanupOverlay(){activeOverlay=null;clearInterval(syncTimer);syncTimer=0;pointerStarts.clear();movingHeroIds.clear();}

function currentTheme(){
  const title=boardTitle.textContent||'';
  if(title.includes('저주받은 숲'))return ['forest','🌲 녹빛 안개가 내려앉은 저주받은 숲'];
  if(title.includes('망자의 땅'))return ['grave','☠️ 차가운 망령의 안개가 흐르는 망자의 땅'];
  if(title.includes('피의 전쟁터'))return ['war','⚔️ 붉은 먼지와 잿빛 연기가 감도는 피의 전쟁터'];
  if(title.includes('불타는 황무지'))return ['volcano','🔥 용암빛과 화산재가 번지는 불타는 황무지'];
  return ['road',`🗺️ ${title||'미지의 지역'}`];
}
function applyTheme(){if(activeOverlay)activeOverlay.dataset.theme=currentTheme()[0];}

function syncGamebar(){
  if(!activeOverlay?.isConnected)return;
  applyTheme();
  const [,atmosphere]=currentTheme();
  const atmosphereEl=activeOverlay.querySelector('.board3d-atmosphere');
  const turnEl=activeOverlay.querySelector('[data-3d-turn]');
  const moveEl=activeOverlay.querySelector('[data-3d-move]');
  const roll3D=activeOverlay.querySelector('[data-3d-roll]');
  const routes=activeOverlay.querySelector('[data-3d-routes]');
  if(atmosphereEl)atmosphereEl.textContent=atmosphere;
  if(turnEl)turnEl.textContent=moveHint?.textContent?.trim()||'현재 영웅 턴';
  if(moveEl)moveEl.textContent=`MOVE ${diceValue.textContent?.trim()||'-'}`;
  if(roll3D){roll3D.disabled=rollBtn.disabled||actionInFlight;roll3D.textContent=actionInFlight?'진행 중…':'🎲 D6 굴리기';}
  if(!routes)return;
  const reachable=[...worldMap.querySelectorAll('.map-node.reachable')];
  routes.innerHTML='';
  if(actionInFlight){routes.innerHTML='<span class="board3d-route-hint">말이 이동 중이야…</span>';return;}
  if(reachable.length){
    const label=document.createElement('span');label.className='board3d-route-hint';label.textContent=reachable.length>1?'갈림길 · 빛나는 칸을 직접 탭하거나:':'이동 가능:';routes.appendChild(label);
    reachable.forEach((tile,index)=>{const b=document.createElement('button');b.type='button';b.className='board3d-route';b.textContent=tile.querySelector('.node-name')?.textContent?.trim()||`경로 ${index+1}`;b.addEventListener('click',()=>runGameAction(()=>tile.click(),260));routes.appendChild(b);});
    return;
  }
  routes.innerHTML=!rollBtn.disabled?'<span class="board3d-route-hint">D6를 굴려 이동을 시작해.</span>':'<span class="board3d-route-hint">자동 이동 또는 도착 처리를 진행 중이야.</span>';
}

function hasForegroundGameUI(){return Boolean(document.querySelector('#modal:not(.hidden),#combatOverlay:not(.hidden),#lootOverlay:not(.hidden)'));}
function waitMs(ms){return new Promise(r=>setTimeout(r,ms));}
function dieFinalTransform(face){if(face===2)return'translateY(0) rotateX(-90deg)';if(face===3)return'translateY(0) rotateY(-90deg)';if(face===4)return'translateY(0) rotateY(90deg)';if(face===5)return'translateY(0) rotateX(90deg)';if(face===6)return'translateY(0) rotateY(180deg)';return'translateY(0) rotateX(0deg) rotateY(0deg)';}

async function run3DDiceRoll(){
  if(actionInFlight||!activeOverlay||rollBtn.disabled)return;
  actionInFlight=true;activeOverlay.dataset.actionBusy='true';
  const die=activeOverlay.querySelector('.board3d-die');const shadow=activeOverlay.querySelector('.board3d-die-shadow');const resultEl=activeOverlay.querySelector('.board3d-die-result');
  die?.getAnimations().forEach(a=>a.cancel());die?.classList.add('visible');shadow?.classList.remove('visible');resultEl?.classList.remove('visible');if(resultEl)resultEl.textContent='';
  const before=diceValue.textContent?.trim()||'-';lastWorldMutation=Date.now();rollBtn.click();syncGamebar();
  const rolling=die?.animate([
    {transform:'translateY(-190px) rotateX(20deg) rotateY(0deg) rotateZ(0deg)',offset:0},
    {transform:'translateY(-78px) rotateX(430deg) rotateY(310deg) rotateZ(185deg)',offset:.42},
    {transform:'translateY(5px) rotateX(760deg) rotateY(610deg) rotateZ(420deg)',offset:.61},
    {transform:'translateY(-42px) rotateX(920deg) rotateY(740deg) rotateZ(520deg)',offset:.74},
    {transform:'translateY(2px) rotateX(1080deg) rotateY(905deg) rotateZ(650deg)',offset:.87},
    {transform:'translateY(0) rotateX(1260deg) rotateY(1080deg) rotateZ(720deg)',offset:1}
  ],{duration:1450,easing:'cubic-bezier(.2,.72,.18,1)',fill:'forwards'});
  setTimeout(()=>shadow?.classList.add('visible'),720);
  const started=Date.now();let finalValue=null;
  while(Date.now()-started<6500){
    if(hasForegroundGameUI())break;
    const v=Number.parseInt(diceValue.textContent?.trim()||'',10);
    if(Number.isInteger(v)&&v>=1&&v<=6&&(diceValue.textContent?.trim()!==before||Date.now()-started>1500))finalValue=v;
    const quiet=Date.now()-lastWorldMutation;const moving=Boolean(worldMap.querySelector('.hero-hop-mover'))||worldMap.classList.contains('movement-lock');
    if(finalValue&&Date.now()-started>1500&&quiet>330&&!moving)break;
    await waitMs(90);
  }
  try{await rolling?.finished;}catch{}
  finalValue=finalValue||Number.parseInt(diceValue.textContent?.trim()||'',10)||1;
  die?.getAnimations().forEach(a=>a.cancel());die?.animate([{transform:'translateY(0) rotateX(1260deg) rotateY(1080deg) rotateZ(720deg)'},{transform:dieFinalTransform(finalValue)}],{duration:230,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
  if(resultEl){resultEl.textContent=`D6 · ${finalValue}`;resultEl.classList.add('visible');}
  await waitMs(430);
  shadow?.classList.remove('visible');resultEl?.classList.remove('visible');die?.classList.remove('visible');
  finishAction();
}

function runGameAction(action,minDelay){
  if(actionInFlight||!activeOverlay)return;
  actionInFlight=true;activeOverlay.dataset.actionBusy='true';lastWorldMutation=Date.now();action();syncGamebar();
  const started=Date.now();const timer=setInterval(()=>{
    if(!activeOverlay?.isConnected){clearInterval(timer);actionInFlight=false;return;}
    if(hasForegroundGameUI()){clearInterval(timer);actionInFlight=false;api()?.close?.();return;}
    const moving=Boolean(worldMap.querySelector('.hero-hop-mover'))||worldMap.classList.contains('movement-lock');
    if(Date.now()-started>=minDelay&&Date.now()-lastWorldMutation>330&&!moving){clearInterval(timer);finishAction();}
  },90);
  setTimeout(()=>{if(actionInFlight){clearInterval(timer);if(hasForegroundGameUI())api()?.close?.();else finishAction();}},8500);
}

function finishAction(){
  actionInFlight=false;
  if(activeOverlay)activeOverlay.dataset.actionBusy='false';
  if(hasForegroundGameUI()){api()?.close?.();return;}
  setTimeout(()=>{api()?.refresh?.();syncGamebar();},40);
}

function parseTranslate3d(value){const m=(value||'').match(/translate3d\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px/i);return m?{x:Number(m[1]),y:Number(m[2])}:null;}
function mirrorUnderlyingMovement(){
  if(!activeOverlay?.isConnected||!api()?.isActive?.())return;
  const mover=worldMap.querySelector('.hero-hop-mover');
  const shadow=worldMap.querySelector('.hero-hop-shadow');
  if(mover&&shadow){
    const token=mover.querySelector('.map-hero-token[data-hero-id]');const heroId=token?.dataset.heroId;const mp=parseTranslate3d(mover.style.transform);const sp=parseTranslate3d(shadow.style.transform);
    if(heroId&&mp&&sp){movingHeroIds.add(heroId);api().setHeroFromMapPixel(heroId,sp.x,sp.y,Math.max(0,sp.y-mp.y));}
    return;
  }
  if(movingHeroIds.size){const ids=[...movingHeroIds];movingHeroIds.clear();ids.forEach(id=>api()?.endHeroMotion?.(id));setTimeout(()=>api()?.refresh?.(),70);}
}

function bind3DTileTap(canvas){
  canvas.addEventListener('pointerdown',e=>pointerStarts.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:false}),true);
  canvas.addEventListener('pointermove',e=>{const s=pointerStarts.get(e.pointerId);if(s&&Math.hypot(e.clientX-s.x,e.clientY-s.y)>8)s.moved=true;},true);
  canvas.addEventListener('pointerup',e=>{const s=pointerStarts.get(e.pointerId);pointerStarts.delete(e.pointerId);if(!s||s.moved||actionInFlight)return;pickReachableTile(e.clientX,e.clientY);},true);
  canvas.addEventListener('pointercancel',e=>pointerStarts.delete(e.pointerId),true);
}

function pickReachableTile(clientX,clientY){
  const reachable=[...worldMap.querySelectorAll('.map-node.reachable')];if(!reachable.length)return;
  const ids=reachable.map(t=>t.dataset.nodeId).filter(Boolean);const id=api()?.pickNodeAt?.(clientX,clientY,ids);if(!id)return;
  const tile=worldMap.querySelector(`.map-node[data-node-id="${CSS.escape(id)}"]`);if(tile)runGameAction(()=>tile.click(),260);
}
