window.MONSTERS = {
  slime: { id:'slime', name:'슬라임', icon:'🟢', tier:'normal', hp:8, ac:10, attack:1, damage:{count:1,sides:4,bonus:1}, ai:'lowHp', trait:'산성 몸체: 근접 공격으로 처치하지 못하면 공격자에게 1 피해.' },
  goblin: { id:'goblin', name:'고블린', icon:'👺', tier:'normal', hp:9, ac:11, attack:2, damage:{count:1,sides:6,bonus:1}, ai:'lowHp', trait:'비겁한 습격: HP가 가장 낮은 영웅을 노린다.' },
  skeleton: { id:'skeleton', name:'해골 병사', icon:'💀', tier:'normal', hp:11, ac:12, attack:2, damage:{count:1,sides:6,bonus:2}, ai:'random', trait:'뼈 갑옷: 전투 중 처음 받는 피해를 2 감소.' },
  wolf: { id:'wolf', name:'늑대', icon:'🐺', tier:'normal', hp:10, ac:12, attack:3, damage:{count:1,sides:6,bonus:1}, ai:'lowAc', trait:'사냥 본능: AC가 가장 낮은 영웅을 노린다.' },
  spider: { id:'spider', name:'거대 거미', icon:'🕷️', tier:'normal', hp:9, ac:12, attack:2, damage:{count:1,sides:4,bonus:2}, ai:'lowAc', trait:'독: 명중한 영웅의 다음 공격 판정 -1.' },
  ghost: { id:'ghost', name:'망령', icon:'👻', tier:'normal', hp:10, ac:13, attack:3, damage:{count:1,sides:6,bonus:0}, ai:'highStr', trait:'비물질: 전투 중 처음 받는 물리 피해를 3 감소.' },
  orc: { id:'orc', name:'오크 전사', icon:'👹', tier:'normal', hp:14, ac:13, attack:3, damage:{count:1,sides:8,bonus:2}, ai:'highHp', trait:'격노: HP가 절반 이하가 되면 공격 판정 +1.' },
  fireImp: { id:'fireImp', name:'화염 임프', icon:'🔥', tier:'normal', hp:8, ac:12, attack:3, damage:{count:1,sides:6,bonus:1}, ai:'highMagic', trait:'불꽃 사냥: 마력이 가장 높은 영웅을 노린다.' },

  ogre: { id:'ogre', name:'오우거', icon:'🧌', tier:'elite', hp:24, ac:12, attack:4, damage:{count:1,sides:10,bonus:3}, ai:'highHp', trait:'내려찍기: Natural 17+ 명중 시 대상의 다음 방어도 -2.' },
  darkKnight: { id:'darkKnight', name:'흑기사', icon:'⚔️', tier:'elite', hp:22, ac:15, attack:4, damage:{count:1,sides:8,bonus:3}, ai:'highStr', trait:'반격: 영웅이 Natural 1을 굴리면 즉시 D6 피해.' },
  minotaur: { id:'minotaur', name:'미노타우로스', icon:'🐂', tier:'elite', hp:28, ac:13, attack:4, damage:{count:1,sides:10,bonus:2}, ai:'random', trait:'돌진: 첫 몬스터 행동의 공격 +2 / 피해 +2.' },
  wyvern: { id:'wyvern', name:'와이번', icon:'🐲', tier:'elite', hp:25, ac:14, attack:4, damage:{count:1,sides:8,bonus:2}, ai:'lowDex', trait:'비행: 짝수 전투 라운드에는 기사/도적의 명중 판정 -3.' },

  necromancer: { id:'necromancer', name:'네크로맨서', icon:'☠️', tier:'boss', hp:42, ac:13, attack:4, damage:{count:1,sides:8,bonus:2}, ai:'highMagic', trait:'망자의 군대: 전투 시작 시 해골 1체, HP 절반 이하에서 해골 1체 추가 소환.' },
  trollKing: { id:'trollKing', name:'트롤 왕', icon:'👑', tier:'boss', hp:50, ac:13, attack:5, damage:{count:1,sides:10,bonus:3}, ai:'highHp', trait:'재생: 몬스터 페이즈 시작 시 HP +3. HP 20 이하에서는 피해 +2.' },
  demonKnight: { id:'demonKnight', name:'악마 기사', icon:'😈', tier:'boss', hp:46, ac:15, attack:5, damage:{count:1,sides:8,bonus:3}, ai:'lowHp', trait:'지옥의 갑주: 한 번의 공격으로 받는 피해는 최대 10. HP 15 이하 영웅 공격 시 명중 +2.' },
};

window.NODE_ENCOUNTERS = {
  cemetery: ['skeleton','ghost','slime'],
  watchtower: ['skeleton','ghost'],
  warCamp: ['goblin','orc'],
  warGate: ['goblin','orc'],
  orcField: ['orc','ogre'],
  wyvernNest: ['wyvern'],
  mine: ['orc','ogre','minotaur'],
  deepForest: ['wolf','goblin'],
  spiderNest: ['spider','wolf'],
  boneRoad: ['skeleton','ghost'],
};

window.BOSS_ENCOUNTERS = {
  abbey: 'necromancer',
  demonKeep: 'demonKnight',
  trollGrove: 'trollKing',
};
