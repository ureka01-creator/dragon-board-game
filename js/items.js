(() => {
  const cards = [
    // 장비 14장
    { id:'iron_sword', name:'철 장검', icon:'⚔️', type:'equipment', slot:'weapon', visual:'sword', rarity:'common', desc:'단단한 기본 장검.', stats:{ attack:1 } },
    { id:'flame_sword', name:'화염검', icon:'🔥', type:'equipment', slot:'weapon', visual:'sword', rarity:'rare', desc:'붉은 불꽃이 감도는 검.', stats:{ attack:1, damage:1 } },
    { id:'hunter_bow', name:'사냥꾼의 활', icon:'🏹', type:'equipment', slot:'weapon', visual:'bow', rarity:'common', desc:'가볍고 정확한 장궁.', stats:{ attack:1 } },
    { id:'war_bow', name:'전쟁 장궁', icon:'🎯', type:'equipment', slot:'weapon', visual:'bow', rarity:'rare', desc:'강한 장력으로 피해를 높인다.', stats:{ damage:1 } },
    { id:'oak_staff', name:'참나무 지팡이', icon:'🪄', type:'equipment', slot:'weapon', visual:'staff', rarity:'common', desc:'마력을 안정시키는 지팡이.', stats:{ attack:1 } },
    { id:'shadow_dagger', name:'그림자 단검', icon:'🗡️', type:'equipment', slot:'weapon', visual:'dagger', rarity:'rare', desc:'급소를 노리기 좋은 날렵한 단검.', stats:{ attack:1, damage:1 } },

    { id:'leather_armor', name:'가죽 갑옷', icon:'🥋', type:'equipment', slot:'armor', visual:'leather', rarity:'common', desc:'가볍고 움직이기 편한 갑옷.', stats:{ ac:1 } },
    { id:'reinforced_leather', name:'강화 가죽갑옷', icon:'🧥', type:'equipment', slot:'armor', visual:'leather', rarity:'rare', desc:'철판을 덧댄 가죽갑옷.', stats:{ ac:2 } },
    { id:'chain_plate', name:'쇠사슬 갑옷', icon:'🛡️', type:'equipment', slot:'armor', visual:'plate', rarity:'common', desc:'무겁지만 확실하게 몸을 보호한다.', stats:{ ac:2 } },
    { id:'knight_plate', name:'기사의 판금갑옷', icon:'🛡️', type:'equipment', slot:'armor', visual:'plate', rarity:'rare', desc:'전신을 감싸는 두꺼운 판금갑옷.', stats:{ ac:3 } },
    { id:'arcane_robe', name:'비전 로브', icon:'🧙', type:'equipment', slot:'armor', visual:'robe', rarity:'rare', desc:'마력이 깃든 천으로 만든 로브.', stats:{ ac:1, damage:1 } },

    { id:'lucky_ring', name:'행운의 반지', icon:'💍', type:'equipment', slot:'accessory', visual:'ring', rarity:'rare', desc:'손끝에 기묘한 행운이 맴돈다.', stats:{ attack:1 } },
    { id:'iron_charm', name:'철의 부적', icon:'📿', type:'equipment', slot:'accessory', visual:'amulet', rarity:'common', desc:'착용자를 단단하게 지켜주는 작은 부적.', stats:{ ac:1 } },
    { id:'dragon_tooth', name:'용아 목걸이', icon:'🦷', type:'equipment', slot:'accessory', visual:'amulet', rarity:'rare', desc:'작은 용의 이빨로 만든 목걸이.', stats:{ damage:1 } },

    // 소비/전투 아이템 8장
    { id:'heal_potion', name:'회복 물약', icon:'🧪', type:'consumable', rarity:'common', desc:'전투 중 HP 6 회복.', effect:'heal', value:6 },
    { id:'greater_heal', name:'큰 회복 물약', icon:'❤️', type:'consumable', rarity:'rare', desc:'전투 중 HP 10 회복.', effect:'heal', value:10 },
    { id:'mana_potion', name:'마나 물약', icon:'🔵', type:'consumable', rarity:'common', desc:'마법사의 MANA 2 회복.', effect:'mana', value:2 },
    { id:'antidote', name:'해독제', icon:'🌿', type:'consumable', rarity:'common', desc:'독과 명중 패널티를 제거.', effect:'cleanse', value:1 },
    { id:'fire_bomb', name:'화염병', icon:'💣', type:'consumable', rarity:'rare', desc:'전투에서 적 하나에게 고정 피해를 준다. (사용 기능 추후)', effect:'battle', value:6 },
    { id:'smoke_bomb', name:'연막탄', icon:'💨', type:'consumable', rarity:'common', desc:'도주나 회피에 사용할 수 있다. (사용 기능 추후)', effect:'battle', value:1 },
    { id:'holy_water', name:'성수', icon:'💧', type:'consumable', rarity:'rare', desc:'언데드에게 강하다. (사용 기능 추후)', effect:'battle', value:1 },
    { id:'ration', name:'야전 식량', icon:'🍖', type:'consumable', rarity:'common', desc:'휴식 때 회복량을 높인다. (사용 기능 추후)', effect:'rest', value:1 },

    // 골드 4장
    { id:'gold_10', name:'금화 주머니', icon:'💰', type:'gold', rarity:'common', desc:'골드 10 획득.', value:10 },
    { id:'gold_20', name:'묵직한 금화 주머니', icon:'💰', type:'gold', rarity:'common', desc:'골드 20 획득.', value:20 },
    { id:'gold_30', name:'작은 보물상자', icon:'🪙', type:'gold', rarity:'rare', desc:'골드 30 획득.', value:30 },
    { id:'gold_40', name:'왕국의 옛 주화', icon:'👑', type:'gold', rarity:'rare', desc:'골드 40 획득.', value:40 },

    // 보물칸 전용 위험 카드 4장 (전투 보상에서는 나오지 않음)
    { id:'curse_weakness', name:'쇠약의 저주', icon:'☠️', type:'curse', rarity:'curse', desc:'불길한 저주가 깃들어 있다. (보물칸용)' },
    { id:'curse_greed', name:'탐욕의 저주', icon:'🕯️', type:'curse', rarity:'curse', desc:'손에 쥔 순간 불길한 기운이 번진다. (보물칸용)' },
    { id:'mimic', name:'미믹', icon:'👹', type:'mimic', rarity:'danger', desc:'상자인 줄 알았는데 이빨이 돋아났다! (보물칸용)' },
    { id:'empty_chest', name:'빈 상자', icon:'📦', type:'empty', rarity:'common', desc:'아쉽지만 안에는 아무것도 없다.' },
  ];

  const byId = new Map(cards.map(card => [card.id, card]));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const pool = type => cards.filter(card => card.type === type);

  window.ITEM_CARDS = cards;
  window.getItemCard = id => byId.get(id) || null;

  // 전투 전리품 규칙: 일반은 골드/소비품 중심, 정예는 장비 확률 상승, 보스는 장비 확정.
  window.drawCombatLoot = function drawCombatLoot(tier = 'normal') {
    const r = Math.random();
    if (tier === 'boss') return { ...pick(pool('equipment')) };
    if (tier === 'elite') {
      if (r < .55) return { ...pick(pool('equipment')) };
      if (r < .80) return { ...pick(pool('consumable')) };
      return { ...pick(pool('gold')) };
    }
    if (r < .25) return { ...pick(pool('equipment')) };
    if (r < .60) return { ...pick(pool('consumable')) };
    if (r < .90) return { ...pick(pool('gold')) };
    return { ...byId.get('empty_chest') };
  };
})();
