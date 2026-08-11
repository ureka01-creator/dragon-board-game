(() => {
  const cards = [
    { id:'lostMerchant', icon:'🧳', name:'길 잃은 상인', kind:'check', stat:'luck', dc:12,
      text:'짐을 잃어버린 상인이 도움을 청한다.',
      success:{ text:'상인은 고마움의 표시로 보답했다.', effects:[{type:'gold',value:5},{type:'loot'}] },
      fail:{ text:'시간만 허비하고 빈손으로 돌아섰다.', effects:[{type:'threat',value:1}] } },
    { id:'cursedWell', icon:'🕳️', name:'저주받은 우물', kind:'choice', text:'검은 물이 고요하게 출렁인다.',
      options:[
        { label:'물을 마신다', desc:'회복을 노리지만 저주가 있을 수 있다.', random:[
          { weight:65, text:'차가운 기운이 상처를 아물게 했다.', effects:[{type:'heal',value:7}] },
          { weight:35, text:'저주가 몸을 파고든다.', effects:[{type:'damage',value:4},{type:'threat',value:1}] }
        ]},
        { label:'떠난다', desc:'아무 일도 일어나지 않는다.', effects:[] }
      ] },
    { id:'wanderingMage', icon:'🧙', name:'떠돌이 마법사', kind:'choice', text:'낡은 로브의 마법사가 거래를 제안한다.',
      options:[
        { label:'골드 5 지불', desc:'보물 카드 1장을 받는다.', costGold:5, effects:[{type:'loot'}] },
        { label:'거절한다', desc:'조용히 길을 떠난다.', effects:[] }
      ] },
    { id:'burningHamlet', icon:'🔥', name:'불타는 마을', kind:'choice', text:'작은 마을이 마물의 습격을 받고 있다.',
      options:[
        { label:'구하러 간다', desc:'전투에서 승리하면 보상을 얻는다.', effects:[{type:'combat',monsterId:'orc'}] },
        { label:'지나친다', desc:'왕국의 불안이 커진다.', effects:[{type:'threat',value:1}] }
      ] },
    { id:'ancientShrine', icon:'🗿', name:'고대의 기도', kind:'check', stat:'magic', dc:13,
      text:'희미한 룬이 새겨진 제단이 반응한다.',
      success:{ text:'룬이 빛나며 마력이 회복된다.', effects:[{type:'mana',value:2},{type:'heal',value:3}] },
      fail:{ text:'불안정한 룬이 폭발했다.', effects:[{type:'damage',value:3}] } },
    { id:'huntersTrap', icon:'🪤', name:'사냥꾼의 덫', kind:'check', stat:'dex', dc:12,
      text:'발밑에서 철컥 소리가 난다.',
      success:{ text:'재빨리 덫을 피하고 남겨진 주머니를 챙겼다.', effects:[{type:'gold',value:4}] },
      fail:{ text:'덫에 발목을 잡혔다.', effects:[{type:'damage',value:5}] } },
    { id:'oldBattlefield', icon:'⚔️', name:'옛 전장의 잔해', kind:'choice', text:'녹슨 무기와 갑옷이 흩어져 있다.',
      options:[
        { label:'수색한다', desc:'보물을 찾지만 위험이 따른다.', random:[
          {weight:60,text:'쓸 만한 물건을 찾아냈다.',effects:[{type:'loot'}]},
          {weight:40,text:'시체 사이의 마물이 깨어났다.',effects:[{type:'combat',monsterId:'skeleton'}]}
        ]},
        { label:'그냥 지나간다', desc:'안전을 택한다.', effects:[] }
      ] },
    { id:'moonlitHerbs', icon:'🌿', name:'달빛 약초', kind:'simple', text:'희귀한 약초를 발견했다.', effects:[{type:'heal',value:5}] },
    { id:'fortuneStone', icon:'🔮', name:'운명의 돌', kind:'check', stat:'luck', dc:14,
      text:'손을 대자 미래의 파편이 스쳐 지나간다.',
      success:{ text:'좋은 징조다. 귀중한 물건의 위치를 알아냈다.', effects:[{type:'loot'}] },
      fail:{ text:'불길한 미래를 보고 말았다.', effects:[{type:'threat',value:1}] } },
    { id:'collapsedBridge', icon:'🌉', name:'무너진 다리', kind:'check', stat:'dex', dc:13,
      text:'썩은 다리를 건너야 한다.',
      success:{ text:'균형을 잡아 무사히 건넜다.', effects:[{type:'gold',value:3}] },
      fail:{ text:'발판이 무너져 아래로 떨어졌다.', effects:[{type:'damage',value:6}] } },
    { id:'beggarKnight', icon:'🛡️', name:'몰락한 기사', kind:'choice', text:'상처 입은 기사가 마지막 부탁을 한다.',
      options:[
        { label:'HP 3을 나눠준다', desc:'도움을 주고 그의 유품을 받는다.', requireHp:4, effects:[{type:'damage',value:3},{type:'loot'}] },
        { label:'떠난다', desc:'그의 시선을 뒤로한다.', effects:[] }
      ] },
    { id:'goblinDice', icon:'🎲', name:'고블린의 내기', kind:'check', stat:'luck', dc:11,
      text:'고블린이 주사위 내기를 걸어온다.',
      success:{ text:'고블린의 돈주머니를 따냈다.', effects:[{type:'gold',value:7}] },
      fail:{ text:'속임수에 당했다.', effects:[{type:'gold',value:-3}] } },
    { id:'ghostLantern', icon:'🏮', name:'유령 등불', kind:'choice', text:'길가에 홀로 켜진 등불이 흔들린다.',
      options:[
        { label:'등불을 따라간다', desc:'어딘가로 이끈다.', random:[
          {weight:55,text:'숨겨진 보물 장소에 도착했다.',effects:[{type:'loot'}]},
          {weight:45,text:'망령의 함정이었다.',effects:[{type:'combat',monsterId:'ghost'}]}
        ]},
        { label:'무시한다', desc:'그 길을 지나친다.', effects:[] }
      ] },
    { id:'bloodMoon', icon:'🌕', name:'핏빛 달', kind:'simple', text:'붉은 달이 떠오르며 마물들이 날뛴다.', effects:[{type:'threat',value:1},{type:'damage',value:2}] },
    { id:'quietChapel', icon:'⛪', name:'고요한 예배당', kind:'simple', text:'잠시 숨을 돌릴 수 있는 안전한 장소다.', effects:[{type:'heal',value:8},{type:'mana',value:1}] },
    { id:'sealedChest', icon:'🔐', name:'봉인된 상자', kind:'check', stat:'str', dc:13,
      text:'무거운 쇠사슬로 감긴 상자가 있다.',
      success:{ text:'힘으로 봉인을 뜯어냈다.', effects:[{type:'loot'}] },
      fail:{ text:'힘을 쓰다 손을 다쳤다.', effects:[{type:'damage',value:3}] } },
    { id:'blackCat', icon:'🐈‍⬛', name:'검은 고양이', kind:'choice', text:'검은 고양이가 앞을 가로막고 바라본다.',
      options:[
        { label:'따라간다', desc:'행운을 믿어본다.', random:[
          {weight:70,text:'작은 금화 더미를 발견했다.',effects:[{type:'gold',value:5}]},
          {weight:30,text:'길을 헤매는 동안 시간이 흘렀다.',effects:[{type:'threat',value:1}]}
        ]},
        { label:'다른 길로 간다', desc:'아무 일도 없다.', effects:[] }
      ] },
    { id:'mysteriousFeast', icon:'🍖', name:'수상한 만찬', kind:'choice', text:'누가 차렸는지 모를 따뜻한 음식이 놓여 있다.',
      options:[
        { label:'먹는다', desc:'회복하거나 탈이 날 수 있다.', random:[
          {weight:65,text:'놀랍도록 훌륭한 음식이었다.',effects:[{type:'heal',value:10}]},
          {weight:35,text:'독이 들어 있었다.',effects:[{type:'damage',value:6}]}
        ]},
        { label:'먹지 않는다', desc:'유혹을 참는다.', effects:[] }
      ] },
    { id:'royalCourier', icon:'📜', name:'왕실 전령', kind:'simple', text:'왕실 전령이 보급금을 건넨다.', effects:[{type:'gold',value:6}] },
    { id:'dragonWhisper', icon:'🐉', name:'드래곤의 속삭임', kind:'check', stat:'magic', dc:15,
      text:'머릿속에 거대한 존재의 목소리가 울린다.',
      success:{ text:'의지를 지켜내고 드래곤의 힘을 역으로 흡수했다.', effects:[{type:'heal',value:4},{type:'mana',value:2}] },
      fail:{ text:'공포가 왕국에 번진다.', effects:[{type:'threat',value:2}] } }
  ];

  window.EVENT_CARDS = cards;
})();
