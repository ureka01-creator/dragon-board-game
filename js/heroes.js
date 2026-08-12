window.HEROES = [
  {
    id: 'knight', name: '기사', icon: '🛡️', role: '탱커 / 근접 / 피해 경감',
    hp: 26, str: 3, dex: 0, magic: -1, luck: 0, ac: 14,
    passive: '철벽: 전투 라운드마다 처음 받는 피해를 2 감소.',
    skill: '방패 강타: 전투당 1회, D6+힘 피해 및 적의 다음 공격 -2.',
    visual: { skin: '#c98b63', hair: '#4a2b1f', hair2: '#2c1712', eye: '#d7c48d', body: 'broad' }
  },
  {
    id: 'archer', name: '궁수', icon: '🏹', role: '원거리 / 안정 딜 / 치명타',
    hp: 20, str: 1, dex: 3, magic: 0, luck: 1, ac: 12,
    passive: '정밀 사격: 원거리 공격 Natural 19~20 크리티컬.',
    skill: '관통 사격: 전투당 1회, 명중 +2, 명중 시 2D8+민첩.',
    visual: { skin: '#d9a077', hair: '#98672e', hair2: '#5f3d1d', eye: '#cfe39a', body: 'lean' }
  },
  {
    id: 'mage', name: '마법사', icon: '🔮', role: '마법 / 광역 / 자원 관리',
    hp: 16, str: -1, dex: 0, magic: 3, luck: 1, ac: 10, mana: 3,
    passive: '마나 3/3: 전투 종료 시 1 회복. 마을/휴식에서 전부 회복.',
    skill: '마력 폭발: 전투당 1회, MANA 2, 명중 판정 없이 3D6+마력.',
    visual: { skin: '#c98b72', hair: '#d8d1c0', hair2: '#827b72', eye: '#8dc3e8', body: 'slim' }
  },
  {
    id: 'rogue', name: '도적', icon: '🗡️', role: '탐험 / 보물 / 급소 공격',
    hp: 18, str: 0, dex: 3, magic: -1, luck: 3, ac: 12,
    passive: '손재주: 보물/함정/자물쇠 판정에서 D20 2개 중 높은 값 사용.',
    skill: '급소 공격: 이미 피해를 입은 적에게 라운드당 1회, 명중 시 +D6 피해.',
    visual: { skin: '#b87857', hair: '#202025', hair2: '#0e0e12', eye: '#dfb966', body: 'compact' }
  }
];
