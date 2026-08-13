// DRAGON BOARD V0.6.3.6 — hidden developer/test panel entry + UI
(() => {
  const params = new URLSearchParams(location.search);
  const isDevPage = params.get('dev') === '1';
  const api = window.DRAGON_BOARD_DEV_API;

  // Normal mode: ROUND number or version label 5 fast taps -> reload once into ?dev=1.
  if (!isDevPage || !api) {
    const targets = [document.querySelector('#roundValue'), document.querySelector('.version-label')].filter(Boolean);
    let taps = 0;
    let lastTap = 0;
    targets.forEach(target => target.addEventListener('click', () => {
      const now = Date.now();
      taps = now - lastTap < 650 ? taps + 1 : 1;
      lastTap = now;
      if (taps < 5) return;
      taps = 0;
      const next = new URL(location.href);
      next.searchParams.set('dev', '1');
      location.href = next.toString();
    }));
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    .dev-toggle-btn{position:fixed;z-index:12020;top:max(10px,env(safe-area-inset-top));right:10px;border:2px solid #d7a743;background:#24180f;color:#f3e4b8;padding:7px 9px;font:700 10px ui-monospace,monospace;box-shadow:3px 3px 0 #090705;cursor:pointer}
    .dev-overlay{position:fixed;inset:0;z-index:12030;background:rgba(0,0,0,.84);padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));display:grid;place-items:center}
    .dev-overlay[hidden]{display:none!important}.dev-panel{width:min(620px,100%);max-height:92dvh;overflow:auto;background:#241a12;color:#f3e4b8;border:3px solid #8a6332;box-shadow:6px 6px 0 #080604;padding:12px;font:12px ui-monospace,monospace}
    .dev-head{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px dashed #6c4d2d;padding-bottom:8px}.dev-head strong{color:#e8bb59;font-size:16px}.dev-close{border:1px solid #75583a;background:#3d2d20;color:#f3e4b8;padding:6px 9px}.dev-summary{margin:8px 0;padding:7px;background:#17100c;color:#c6b38d;line-height:1.55}
    .dev-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.dev-section{grid-column:1/-1;margin-top:6px;color:#88a866;font-size:10px;letter-spacing:.12em}.dev-panel select,.dev-panel button{min-height:36px;font:inherit}.dev-panel select{width:100%;background:#17100c;color:#f3e4b8;border:1px solid #6c4d2d;padding:6px}.dev-action{border:2px solid #73583a;background:#41301f;color:#f3e4b8;padding:7px;cursor:pointer}.dev-action.primary{background:#486832;border-color:#82a854}.dev-action.danger{background:#6c2e28;border-color:#ae574d}.dev-action.gold{background:#5d4723;border-color:#b5893a}.dev-wide{grid-column:1/-1}.dev-message{grid-column:1/-1;min-height:30px;padding:7px;background:#120d09;border-left:3px solid #6c4d2d;color:#d8c59f}.dev-off{color:#d78375}
    .dev-toast{position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));z-index:14050;transform:translateX(-50%);max-width:90vw;padding:9px 12px;border:2px solid #82a854;background:#21170f;color:#f3e4b8;box-shadow:3px 3px 0 #090705;font:700 11px ui-monospace,monospace;text-align:center}.dev-toast.bad{border-color:#ae574d}
    @media(max-width:520px){.dev-panel{padding:9px}.dev-grid{gap:5px}.dev-action{padding:6px 4px;font-size:10px}.dev-panel select{font-size:10px}}
  `;
  document.head.appendChild(style);

  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'dev-toggle-btn'; toggle.textContent = '🛠 DEV';
  document.body.appendChild(toggle);

  const overlay = document.createElement('div');
  overlay.className = 'dev-overlay'; overlay.hidden = true;
  overlay.innerHTML = `<div class="dev-panel" role="dialog" aria-modal="true" aria-label="개발자 모드">
    <div class="dev-head"><div><div>DEVELOPER / TEST MODE</div><strong>🛠 DRAGON BOARD DEV</strong></div><button type="button" class="dev-close" data-dev-close>닫기</button></div>
    <div class="dev-summary" data-dev-summary></div>
    <div class="dev-grid">
      <div class="dev-section">TARGET HERO</div><select class="dev-wide" data-dev-hero></select>
      <button class="dev-action" data-act="hp1">❤️ HP 1</button><button class="dev-action danger" data-act="ko">💀 즉사 테스트</button><button class="dev-action primary dev-wide" data-act="heal">✨ 완전 회복 / 부활</button>
      <div class="dev-section">ITEM / RESOURCE</div><select class="dev-wide" data-dev-item></select>
      <button class="dev-action primary" data-act="item">🎁 아이템 지급</button><button class="dev-action" data-act="clearBag">🎒 가방 비우기</button><button class="dev-action gold dev-wide" data-act="gold">💰 골드 +100</button>
      <div class="dev-section">WORLD / BOSS</div><select class="dev-wide" data-dev-area></select>
      <button class="dev-action" data-act="village">🏠 지역 마을 이동</button><button class="dev-action" data-act="boss">👑 지역 보스 처치 처리</button><button class="dev-action primary" data-act="dragonUnlock">🐉 드래곤 성 즉시 개방</button><button class="dev-action primary" data-act="dragonEnter">🏰 드래곤 성 즉시 진입</button>
      <div class="dev-section">DICE / COMBAT</div><select data-dev-d6><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select><button class="dev-action" data-act="d6">🎲 다음 D6 고정</button><button class="dev-action danger dev-wide" data-act="enemy1">👹 현재 적 HP 1</button>
      <div class="dev-message" data-dev-message>테스트 기능을 선택해.</div><button class="dev-action dev-off dev-wide" data-act="off">DEV MODE 종료</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  const heroSel = overlay.querySelector('[data-dev-hero]');
  const itemSel = overlay.querySelector('[data-dev-item]');
  const areaSel = overlay.querySelector('[data-dev-area]');
  const d6Sel = overlay.querySelector('[data-dev-d6]');
  const summary = overlay.querySelector('[data-dev-summary]');
  const message = overlay.querySelector('[data-dev-message]');

  function refresh() {
    const s = api.snapshot();
    const hv=heroSel.value, iv=itemSel.value, av=areaSel.value;
    heroSel.innerHTML=(s.heroes||[]).map(h=>`<option value="${h.id}">${h.icon} ${h.name} · HP ${h.hp}/${h.maxHp}${h.down?' · DOWN':''}</option>`).join('');
    if(hv&&[...heroSel.options].some(o=>o.value===hv))heroSel.value=hv;
    itemSel.innerHTML=(s.items||[]).map(i=>`<option value="${i.id}">${i.icon||'🎁'} ${i.name} · ${i.rarity||i.type}</option>`).join('');
    if(iv&&[...itemSel.options].some(o=>o.value===iv))itemSel.value=iv;
    areaSel.innerHTML=(s.areas||[]).map(a=>`<option value="${a.id}">${a.name}${a.bossDefeated?' · 보스✓':''}</option>`).join('');
    if(av&&[...areaSel.options].some(o=>o.value===av))areaSel.value=av;
    summary.textContent=`ROUND ${s.round??'-'} · 봉인석 ${s.seals??0}/4 · 골드 ${s.gold??0} · 드래곤 성 ${s.dragonCastleSpawned?'OPEN':'LOCK'}${s.combat?.active?` · ${s.combat.enemy} HP ${s.combat.enemyHp}`:''}`;
  }
  function tell(r){message.textContent=r?.message||'완료';message.style.borderLeftColor=r?.ok===false?'#ae574d':'#82a854';refresh();}
  function toast(text,bad=false){
    document.querySelector('.dev-toast')?.remove();
    const el=document.createElement('div');
    el.className=`dev-toast${bad?' bad':''}`;
    el.textContent=text||'완료';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),2200);
  }
  function open(){refresh();overlay.hidden=false;overlay.removeAttribute('hidden');}
  function close(){overlay.hidden=true;overlay.setAttribute('hidden','');document.activeElement?.blur?.();}
  toggle.addEventListener('click',open); overlay.querySelector('[data-dev-close]').addEventListener('click',close); overlay.addEventListener('click',e=>{if(e.target===overlay)close()});

  overlay.querySelectorAll('[data-act]').forEach(btn=>btn.addEventListener('click',()=>{
    const act=btn.dataset.act, heroId=heroSel.value; let r;
    if(act==='hp1')r=api.setHp(heroId,1);
    else if(act==='ko'){close();r=api.knockOut(heroId);toast(r?.message,r?.ok===false);return;}
    else if(act==='heal')r=api.fullHeal(heroId);
    else if(act==='item')r=api.giveItem(heroId,itemSel.value);
    else if(act==='clearBag')r=api.clearBag(heroId);
    else if(act==='gold')r=api.addGold(100);
    else if(act==='village')r=api.teleportVillage(heroId,areaSel.value);
    else if(act==='boss')r=api.defeatBoss(areaSel.value);
    else if(act==='dragonUnlock')r=api.unlockDragonCastle();
    else if(act==='dragonEnter'){
      close();
      toast('🏰 드래곤 성 진입 준비…');
      try {
        Promise.resolve(api.enterDragonCastle(heroId)).then(result=>{
          if(result?.ok===false)toast(result.message||'드래곤 성 진입 실패',true);
        }).catch(error=>{
          console.error('DEV dragon enter failed',error);
          toast(`드래곤 성 진입 오류 · ${error?.message||error}`,true);
        });
      } catch(error) {
        console.error('DEV dragon enter failed',error);
        toast(`드래곤 성 진입 오류 · ${error?.message||error}`,true);
      }
      return;
    }
    else if(act==='d6')r=api.forceD6(Number(d6Sel.value));
    else if(act==='enemy1')r=api.enemyHpOne();
    else if(act==='off'){const u=new URL(location.href);u.searchParams.delete('dev');location.href=u.toString();return;}
    tell(r);
  }));
})();
