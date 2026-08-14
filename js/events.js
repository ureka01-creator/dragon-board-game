(() => {
  const cards = [
    { id:'lostMerchant', icon:'🧳', name:'길 잃은 상인', kind:'check', stat:'luck', dc:12,
      text:'짐을 잃어버린 상인이 도움을 청한다.',
      success:{ text:'상인은 고마움의 표시로 보답했다.', effects:[{type:'gold',value:5},{type:'loot'}] },
      fail:{ text:'시간만 허비하고 빈손으로 돌아섰다.', effects:[] } },
    { id:'cursedWell', icon:'🕳️', name:'저주받은 우물', kind:'choice', text:'검은 물이 고요하게 출렁인다.',
      options:[
        { label:'물을 마신다', desc:'회복을 노리지만 저주가 있을 수 있다.', random:[
          { weight:65, text:'차가운 기운이 상처를 아물게 했다.', effects:[{type:'heal',value:7}] },
          { weight:35, text:'저주가 몸을 파고든다.', effects:[{type:'damage',value:5}] }
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
        { label:'지나친다', desc:'전투를 피하고 길을 떠난다.', effects:[] }
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
      fail:{ text:'불길한 미래가 정신을 흔든다.', effects:[{type:'damage',value:2}] } },
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
    { id:'bloodMoon', icon:'🌕', name:'핏빛 달', kind:'simple', text:'붉은 달이 떠오르며 마물들이 날뛴다.', effects:[{type:'damage',value:4}] },
    { id:'quietChapel', icon:'⛪', name:'고요한 예배당', kind:'simple', text:'잠시 숨을 돌릴 수 있는 안전한 장소다.', effects:[{type:'heal',value:8},{type:'mana',value:1}] },
    { id:'sealedChest', icon:'🔐', name:'봉인된 상자', kind:'check', stat:'str', dc:13,
      text:'무거운 쇠사슬로 감긴 상자가 있다.',
      success:{ text:'힘으로 봉인을 뜯어냈다.', effects:[{type:'loot'}] },
      fail:{ text:'힘을 쓰다 손을 다쳤다.', effects:[{type:'damage',value:3}] } },
    { id:'blackCat', icon:'🐈‍⬛', name:'검은 고양이', kind:'choice', text:'검은 고양이가 앞을 가로막고 바라본다.',
      options:[
        { label:'따라간다', desc:'행운을 믿어본다.', random:[
          {weight:70,text:'작은 금화 더미를 발견했다.',effects:[{type:'gold',value:5}]},
          {weight:30,text:'길을 헤매다 소지품 일부를 잃었다.',effects:[{type:'gold',value:-2}]}
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
      fail:{ text:'드래곤의 공포가 정신을 짓누른다.', effects:[{type:'damage',value:6}] } },
    // V0.6.4.2 — 지역 전용 사건: 망자의 땅
    { id:'funeralProcession', regions:['grave'], icon:'🕯️', name:'망자의 행렬', kind:'choice', text:'촛불을 든 망자들의 행렬이 길을 가로지른다.',
      options:[
        { label:'고개를 숙인다', desc:'망자들을 존중하며 조용히 기다린다.', effects:[{type:'heal',value:3},{type:'mana',value:1}] },
        { label:'뒤를 따라간다', desc:'무덤 깊숙한 곳의 비밀을 노린다.', random:[
          {weight:55,text:'행렬 끝에서 오래된 공물을 발견했다.',effects:[{type:'gold',value:6}]},
          {weight:45,text:'행렬이 멈추고 망령이 뒤돌아봤다.',effects:[{type:'combat',monsterId:'ghost'}]}
        ]}
      ] },
    { id:'bloodAltar', regions:['grave'], icon:'🩸', name:'피묻은 제단', kind:'check', stat:'magic', dc:14,
      text:'말라붙은 피가 가득한 제단에서 희미한 마력이 새어 나온다.',
      success:{ text:'저주를 역으로 풀어 제단 속 봉헌물을 꺼냈다.', effects:[{type:'loot'}] },
      fail:{ text:'제단의 저주가 몸을 파고든다.', effects:[{type:'damage',value:5}] } },
    { id:'lostSpirit', regions:['grave'], icon:'👻', name:'길 잃은 영혼', kind:'check', stat:'luck', dc:13,
      text:'희미한 영혼이 자신의 묘를 찾아달라고 속삭인다.',
      success:{ text:'영혼을 안식시키자 숨겨둔 금화의 위치를 알려줬다.', effects:[{type:'gold',value:7},{type:'heal',value:2}] },
      fail:{ text:'영혼이 원혼으로 변해 달려든다.', effects:[{type:'combat',monsterId:'ghost'}] } },
    { id:'sealedCrypt', regions:['grave'], icon:'⚰️', name:'봉인된 묘실', kind:'check', stat:'str', dc:14,
      text:'돌문 틈 사이로 오래된 보물의 빛이 새어 나온다.',
      success:{ text:'무거운 돌문을 밀어내고 유물을 손에 넣었다.', effects:[{type:'loot'},{type:'gold',value:3}] },
      fail:{ text:'돌문이 무너지며 팔을 짓눌렀다.', effects:[{type:'damage',value:4}] } },

    // V0.6.4.2 — 지역 전용 사건: 저주받은 숲
    { id:'fairyRing', regions:['forest'], icon:'🍄', name:'요정의 고리', kind:'choice', text:'푸른 버섯들이 원을 그리며 빛나고 있다.',
      options:[
        { label:'고리 안으로 들어간다', desc:'요정의 축복 또는 장난을 감수한다.', random:[
          {weight:50,text:'따뜻한 빛이 몸을 감싸며 상처가 회복됐다.',effects:[{type:'heal',value:8},{type:'mana',value:1}]},
          {weight:25,text:'요정들이 금화를 훔쳐 달아났다.',effects:[{type:'gold',value:-4}]},
          {weight:25,text:'요정의 숨겨진 선물을 발견했다.',effects:[{type:'loot'}]}
        ]},
        { label:'고리를 피해간다', desc:'수상한 마법과 거리를 둔다.', effects:[] }
      ] },
    { id:'hunterCamp', regions:['forest'], icon:'🏕️', name:'사냥꾼 야영지', kind:'choice', text:'주인 없는 야영지에 약초와 식량이 남아 있다.',
      options:[
        { label:'골드 3을 두고 쉰다', desc:'정당한 값을 남기고 충분히 회복한다.', costGold:3, effects:[{type:'heal',value:8}] },
        { label:'물자를 뒤진다', desc:'쓸 만한 물건이나 주인을 만날 수 있다.', random:[
          {weight:55,text:'바닥 밑에서 숨겨둔 물건을 찾았다.',effects:[{type:'loot'}]},
          {weight:45,text:'야영지의 주인인 늑대 무리가 돌아왔다.',effects:[{type:'combat',monsterId:'wolf'}]}
        ]}
      ] },
    { id:'livingVines', regions:['forest'], icon:'🌿', name:'움직이는 덩굴', kind:'check', stat:'dex', dc:13,
      text:'길 전체가 살아 움직이는 덩굴로 뒤덮이기 시작한다.',
      success:{ text:'덩굴 사이를 빠져나오며 매달린 주머니까지 챙겼다.', effects:[{type:'gold',value:5}] },
      fail:{ text:'가시에 휘감겨 상처를 입었다.', effects:[{type:'damage',value:5}] } },
    { id:'cryingChild', regions:['forest'], icon:'🧒', name:'우는 아이', kind:'check', stat:'luck', dc:13,
      text:'숲 한가운데에서 아이의 울음소리가 들린다.',
      success:{ text:'길 잃은 아이를 사냥꾼에게 데려다주고 사례를 받았다.', effects:[{type:'gold',value:6},{type:'heal',value:2}] },
      fail:{ text:'아이의 모습이 사라지고 고블린들이 튀어나왔다.', effects:[{type:'combat',monsterId:'goblin'}] } },

    // V0.6.4.2 — 지역 전용 사건: 피의 전쟁터
    { id:'woundedCompany', regions:['war'], icon:'🩹', name:'부상병 행렬', kind:'choice', text:'후퇴 중인 부상병들이 치료를 부탁한다.',
      options:[
        { label:'내 체력으로 돕는다', desc:'HP 3을 희생해 병사들을 돕고 사례를 받는다.', requireHp:4, effects:[{type:'damage',value:3},{type:'gold',value:8}] },
        { label:'갈 길을 간다', desc:'전쟁터에서는 자신의 생존도 중요하다.', effects:[] }
      ] },
    { id:'abandonedSupplyWagon', regions:['war'], icon:'🛒', name:'버려진 보급마차', kind:'choice', text:'전복된 군용 보급마차가 길가에 방치되어 있다.',
      options:[
        { label:'마차를 수색한다', desc:'보급품 또는 매복을 발견할 수 있다.', random:[
          {weight:45,text:'멀쩡한 군수품을 찾아냈다.',effects:[{type:'loot'}]},
          {weight:30,text:'숨겨진 군자금 상자를 발견했다.',effects:[{type:'gold',value:8}]},
          {weight:25,text:'약탈자들이 마차 뒤에서 튀어나왔다.',effects:[{type:'combat',monsterId:'orc'}]}
        ]},
        { label:'지나친다', desc:'매복의 위험을 피한다.', effects:[] }
      ] },
    { id:'runeMine', regions:['war'], icon:'💣', name:'룬 지뢰', kind:'check', stat:'magic', dc:14,
      text:'땅속에서 붉은 룬이 깜빡인다. 마법 폭발물이 묻혀 있다.',
      success:{ text:'룬을 해제하고 안쪽의 마력 부품을 회수했다.', effects:[{type:'loot'}] },
      fail:{ text:'룬이 폭발하며 온몸을 강타했다.', effects:[{type:'damage',value:7}] } },
    { id:'deserterHideout', regions:['war'], icon:'🗡️', name:'탈영병 은신처', kind:'choice', text:'무장을 한 탈영병들이 거래를 제안한다.',
      options:[
        { label:'골드 4로 거래한다', desc:'전장에서 주운 물건 하나를 산다.', costGold:4, effects:[{type:'loot'}] },
        { label:'무기를 들이댄다', desc:'위험하지만 전리품을 노린다.', effects:[{type:'combat',monsterId:'darkKnight'}] },
        { label:'떠난다', desc:'분쟁을 만들지 않는다.', effects:[] }
      ] },

    // V0.6.4.2 — 지역 전용 사건: 불타는 황무지
    { id:'lavaVent', regions:['volcano'], icon:'🌋', name:'용암 분출구', kind:'check', stat:'dex', dc:14,
      text:'바닥의 균열이 붉게 빛나며 곧 용암이 솟을 것 같다.',
      success:{ text:'분출 직전에 뛰어넘고 굳은 광석까지 챙겼다.', effects:[{type:'gold',value:6}] },
      fail:{ text:'뜨거운 용암 파편이 몸을 덮쳤다.', effects:[{type:'damage',value:7}] } },
    { id:'redCrystalVein', regions:['volcano'], icon:'💎', name:'붉은 수정맥', kind:'check', stat:'str', dc:14,
      text:'절벽에 값비싸 보이는 붉은 수정이 박혀 있다.',
      success:{ text:'수정을 통째로 떼어내 숨겨진 장비까지 발견했다.', effects:[{type:'loot'}] },
      fail:{ text:'수정맥이 깨지며 날카로운 파편이 튀었다.', effects:[{type:'damage',value:4}] } },
    { id:'fireSpirit', regions:['volcano'], icon:'🔥', name:'불의 정령', kind:'check', stat:'magic', dc:14,
      text:'작은 불의 정령이 길 위에서 도전하듯 타오른다.',
      success:{ text:'정령과 공명해 생명력과 마력을 얻었다.', effects:[{type:'heal',value:4},{type:'mana',value:2}] },
      fail:{ text:'정령이 화염 임프로 변해 공격해왔다.', effects:[{type:'combat',monsterId:'fireImp'}] } },
    { id:'collapsedMine', regions:['volcano'], icon:'⛏️', name:'무너진 갱도', kind:'choice', text:'무너진 갱도 안쪽에서 금속 부딪히는 소리가 들린다.',
      options:[
        { label:'안으로 들어간다', desc:'광맥, 장비, 붕괴 중 하나를 만날 수 있다.', random:[
          {weight:40,text:'광부들이 숨겨둔 금괴를 발견했다.',effects:[{type:'gold',value:9}]},
          {weight:35,text:'무너진 작업대 아래에서 장비를 찾았다.',effects:[{type:'loot'}]},
          {weight:25,text:'천장이 다시 무너지며 돌더미에 맞았다.',effects:[{type:'damage',value:6}]}
        ]},
        { label:'밖으로 돌아간다', desc:'갱도 붕괴 위험을 피한다.', effects:[] }
      ] },

    // V0.6.4.2 — 전 지역 희귀 사건
    { id:'fateMerchant', rarity:'rare', icon:'🎭', name:'운명을 파는 상인', kind:'choice', text:'얼굴 없는 상인이 금화 대신 운명을 거래하자고 속삭인다.',
      options:[
        { label:'골드 10을 지불한다', desc:'값비싼 물건과 작은 축복을 받는다.', costGold:10, effects:[{type:'loot'},{type:'heal',value:5}] },
        { label:'거절한다', desc:'상인은 웃으며 안개 속으로 사라진다.', effects:[] }
      ] },
    { id:'fallenStar', rarity:'rare', icon:'🌠', name:'떨어진 별', kind:'simple', text:'눈앞에 떨어진 별 조각이 따뜻한 빛을 뿜는다.', effects:[{type:'heal',value:7},{type:'mana',value:2},{type:'gold',value:5}] },
    { id:'dragonEgg', rarity:'rare', icon:'🥚', name:'금이 간 용의 알', kind:'choice', text:'아직 온기가 남은 거대한 알이 바위틈에서 꿈틀거린다.',
      options:[
        { label:'알을 조사한다', desc:'귀중한 것을 얻거나 보호자를 깨울 수 있다.', random:[
          {weight:55,text:'껍질 안쪽에서 희귀한 물건을 발견했다.',effects:[{type:'loot'}]},
          {weight:45,text:'와이번이 포효하며 알을 지키러 날아왔다.',effects:[{type:'combat',monsterId:'wyvern'}]}
        ]},
        { label:'건드리지 않는다', desc:'불길한 기운을 피해 떠난다.', effects:[] }
      ] },
    { id:'namelessHeroGrave', rarity:'rare', icon:'🗡️', name:'이름 없는 영웅의 무덤', kind:'check', stat:'luck', dc:15,
      text:'검 한 자루가 꽂힌 오래된 무덤 앞에서 이상한 기운이 느껴진다.',
      success:{ text:'선대 영웅의 의지가 길을 인정하고 유산을 남겼다.', effects:[{type:'loot'},{type:'gold',value:8}] },
      fail:{ text:'무덤의 원념이 스쳐 지나가며 힘이 빠졌다.', effects:[{type:'damage',value:2}] } }

  ];

  window.EVENT_CARDS = cards;
})();
