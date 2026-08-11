(() => {
  // V0.5.0 정식 프로토 아이템 세트: 장비 22 + 소비품 8 = 30장.
  // 골드/빈 상자는 아이템 30장에 포함하지 않는 별도 보상 카드다.
  const cards = [
    // ── 무기 8 ───────────────────────────────────────────────
    { id:'iron_sword', name:'철검', icon:'⚔️', type:'equipment', slot:'weapon', visual:'sword', rarity:'common', desc:'묵직한 철제 검. 근접 공격 피해 +1.', equip:['knight','rogue'], effects:{ meleeDamage:1 } },
    { id:'hunter_bow', name:'사냥꾼의 장궁', icon:'🏹', type:'equipment', slot:'weapon', visual:'bow', rarity:'common', desc:'원거리 공격 명중 +1.', equip:['archer'], stats:{ attack:1 }, effects:{ rangedOnly:true } },
    { id:'war_hammer', name:'전투 망치', icon:'🔨', type:'equipment', slot:'weapon', visual:'hammer', rarity:'rare', desc:'전투에서 처음 명중한 공격 피해 +3.', equip:['knight'], effects:{ firstHitDamage:3 } },
    { id:'poison_dagger', name:'독니 단검', icon:'🗡️', type:'equipment', slot:'weapon', visual:'dagger', rarity:'rare', desc:'전투에서 처음 명중한 공격에 추가 D4 피해.', equip:['rogue'], effects:{ firstHitDie:4 } },
    { id:'flame_sword', name:'화염검', icon:'🔥', type:'equipment', slot:'weapon', visual:'sword', rarity:'rare', desc:'공격이 화염 속성. 언데드 +2 피해 / 트롤 재생 차단.', equip:['knight','rogue'], effects:{ fireWeapon:true, undeadDamage:2 } },
    { id:'arcane_staff', name:'마도 지팡이', icon:'🔮', type:'equipment', slot:'weapon', visual:'staff', rarity:'rare', desc:'마법사의 기본 마력탄 피해 주사위가 D6에서 D8이 된다.', equip:['mage'], effects:{ mageBoltDie:8 } },
    { id:'holy_sword', name:'성광검', icon:'✨', type:'equipment', slot:'weapon', visual:'sword', rarity:'legendary', desc:'명중 +1. 언데드·악마에게 추가 피해 +3.', equip:['knight'], stats:{ attack:1 }, effects:{ undeadDamage:3, demonDamage:3 } },
    { id:'dragon_slayer', name:'용살검', icon:'🐉', type:'equipment', slot:'weapon', visual:'sword', rarity:'legendary', desc:'일반 적 +1 피해 / 정예·보스·드래곤 +3 피해.', equip:['knight','rogue'], effects:{ normalDamage:1, eliteBossDamage:3 } },

    // ── 방어구 7 ─────────────────────────────────────────────
    { id:'leather_armor', name:'가죽 갑옷', icon:'🥋', type:'equipment', slot:'armor', visual:'leather', rarity:'common', desc:'가볍고 기본적인 보호구. AC +1.', equip:['knight','archer','mage','rogue'], stats:{ ac:1 } },
    { id:'chain_armor', name:'사슬 갑옷', icon:'⛓️', type:'equipment', slot:'armor', visual:'plate', rarity:'common', desc:'촘촘한 쇠사슬 갑옷. AC +2.', equip:['knight','archer','rogue'], stats:{ ac:2 } },
    { id:'knight_plate', name:'기사의 판금갑옷', icon:'🛡️', type:'equipment', slot:'armor', visual:'plate', rarity:'rare', desc:'기사 전용 중갑. AC +3.', equip:['knight'], stats:{ ac:3 } },
    { id:'ranger_cloak', name:'레인저의 망토', icon:'🏹', type:'equipment', slot:'armor', visual:'leather', rarity:'rare', desc:'AC +1. 전투에서 처음 받는 적 공격의 명중 판정 -2.', equip:['archer'], stats:{ ac:1 }, effects:{ firstEnemyAttackPenalty:2 } },
    { id:'shadow_garb', name:'그림자의 의복', icon:'🌑', type:'equipment', slot:'armor', visual:'leather', rarity:'rare', desc:'AC +1. 도주 판정 +3.', equip:['rogue'], stats:{ ac:1 }, effects:{ fleeBonus:3 } },
    { id:'starlight_robe', name:'별빛 로브', icon:'🌌', type:'equipment', slot:'armor', visual:'robe', rarity:'rare', desc:'AC +1. 최대 MANA +1.', equip:['mage'], stats:{ ac:1 }, effects:{ maxMana:1 } },
    { id:'dragon_scale_armor', name:'용비늘 갑옷', icon:'🐲', type:'equipment', slot:'armor', visual:'plate', rarity:'legendary', desc:'AC +2. 화염 피해를 3 감소.', equip:['knight','archer','mage','rogue'], stats:{ ac:2 }, effects:{ fireReduction:3 } },

    // ── 장신구 7 ─────────────────────────────────────────────
    { id:'lucky_ring', name:'행운의 반지', icon:'💍', type:'equipment', slot:'accessory', visual:'ring', rarity:'rare', desc:'전리품을 받을 때 카드 2장 중 1장을 선택한다.', equip:['knight','archer','mage','rogue'], effects:{ lootChoice:2 } },
    { id:'guardian_charm', name:'수호의 부적', icon:'🧿', type:'equipment', slot:'accessory', visual:'amulet', rarity:'common', desc:'전투에서 처음 받는 피해를 2 감소.', equip:['knight','archer','mage','rogue'], effects:{ firstDamageReduction:2 } },
    { id:'hawk_eye', name:'매의 눈', icon:'👁️', type:'equipment', slot:'accessory', visual:'amulet', rarity:'common', desc:'전투에서 자신의 첫 공격 명중 판정 +2.', equip:['knight','archer','mage','rogue'], effects:{ firstAttackBonus:2 } },
    { id:'blood_pendant', name:'피의 펜던트', icon:'🩸', type:'equipment', slot:'accessory', visual:'amulet', rarity:'rare', desc:'적을 직접 처치하면 HP 2 회복.', equip:['knight','archer','mage','rogue'], effects:{ killHeal:2 } },
    { id:'mana_crystal', name:'마나 수정', icon:'💎', type:'equipment', slot:'accessory', visual:'amulet', rarity:'rare', desc:'마법사 최대 MANA +1 / 전투 종료 MANA 회복 +1 추가.', equip:['mage'], effects:{ maxMana:1, endBattleManaBonus:1 } },
    { id:'traveler_boots', name:'여행자의 장화', icon:'👢', type:'equipment', slot:'accessory', visual:'none', rarity:'common', desc:'이동 D6 결과가 1이면 2로 취급한다.', equip:['knight','archer','mage','rogue'], effects:{ minimumMove:2 } },
    { id:'fate_coin', name:'운명의 동전', icon:'🪙', type:'equipment', slot:'accessory', visual:'ring', rarity:'legendary', desc:'전투당 1회, 자신의 Natural 1을 자동으로 다시 굴린다.', equip:['knight','archer','mage','rogue'], effects:{ rerollNaturalOne:1 } },

    // ── 소비 아이템 8 ───────────────────────────────────────
    { id:'heal_potion', name:'회복약', icon:'❤️', type:'consumable', rarity:'common', desc:'HP 5 회복.', effect:'heal', value:5 },
    { id:'greater_heal', name:'상급 회복약', icon:'❤️‍🔥', type:'consumable', rarity:'rare', desc:'HP 10 회복.', effect:'heal', value:10 },
    { id:'mana_potion', name:'마나 물약', icon:'🔵', type:'consumable', rarity:'common', desc:'MANA 2 회복.', effect:'mana', value:2 },
    { id:'fire_bomb', name:'화염병', icon:'🔥', type:'consumable', rarity:'common', desc:'적 하나에게 D6+2 화염 피해.', effect:'fireBomb' },
    { id:'bomb', name:'폭탄', icon:'💣', type:'consumable', rarity:'rare', desc:'명중 판정 없이 적 하나에게 2D6 피해.', effect:'bomb' },
    { id:'smoke_bomb', name:'연막탄', icon:'💨', type:'consumable', rarity:'common', desc:'일반/정예 전투에서 즉시 도주.', effect:'escape' },
    { id:'focus_elixir', name:'집중의 비약', icon:'🎯', type:'consumable', rarity:'common', desc:'다음 공격 명중 판정 +3.', effect:'focus', value:3 },
    { id:'phoenix_feather', name:'불사조의 깃털', icon:'🪶', type:'consumable', rarity:'legendary', desc:'HP가 0이 되는 순간 자동 사용되어 HP 6으로 즉시 부활.', effect:'autoRevive', value:6 },
  ];

  const rewardCards = [
    { id:'gold_10', name:'금화 주머니', icon:'💰', type:'gold', rarity:'common', desc:'골드 10 획득.', value:10 },
    { id:'gold_20', name:'묵직한 금화 주머니', icon:'💰', type:'gold', rarity:'common', desc:'골드 20 획득.', value:20 },
    { id:'gold_30', name:'작은 보물상자', icon:'🪙', type:'gold', rarity:'rare', desc:'골드 30 획득.', value:30 },
    { id:'empty_chest', name:'빈 상자', icon:'📦', type:'empty', rarity:'common', desc:'아쉽지만 안에는 아무것도 없다.' },
  ];

  const byId = new Map(cards.map(card => [card.id, card]));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const pool = type => cards.filter(card => card.type === type);
  const goldPool = rewardCards.filter(card => card.type === 'gold');
  const empty = rewardCards.find(card => card.type === 'empty');

  window.ITEM_CARDS = cards;
  window.REWARD_CARDS = rewardCards;
  window.getItemCard = id => byId.get(id) || null;
  window.getRewardCard = id => rewardCards.find(card => card.id === id) || null;

  // 전투 전리품: 일반은 소비품/골드 중심, 정예는 장비 확률 상승, 보스는 장비 확정.
  window.drawCombatLoot = function drawCombatLoot(tier = 'normal') {
    const r = Math.random();
    if (tier === 'boss') return { ...pick(pool('equipment')) };
    if (tier === 'elite') {
      if (r < .55) return { ...pick(pool('equipment')) };
      if (r < .80) return { ...pick(pool('consumable')) };
      return { ...pick(goldPool) };
    }
    if (r < .25) return { ...pick(pool('equipment')) };
    if (r < .60) return { ...pick(pool('consumable')) };
    if (r < .90) return { ...pick(goldPool) };
    return { ...empty };
  };

  // 보물칸: 한 번만 열 수 있다. 전투보다 장비 비중을 약간 높인다.
  window.drawTreasureLoot = function drawTreasureLoot() {
    const r = Math.random();
    if (r < .45) return { ...pick(pool('equipment')) };
    if (r < .75) return { ...pick(pool('consumable')) };
    if (r < .95) return { ...pick(goldPool) };
    return { ...empty };
  };
})();
