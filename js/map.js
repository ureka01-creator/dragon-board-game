window.WORLD_NODES = [
  // ─────────────────────────────────────────────
  // OUTER RING — square board path
  // North: cemetery / ruined abbey
  // ─────────────────────────────────────────────
  { id:'abbey', name:'버려진 수도원', short:'수도원', icon:'🏰', type:'보스', region:'grave', x:1, y:1, links:['boneRoad','cemetery'] },
  { id:'cemetery', name:'공동묘지', short:'묘지', icon:'☠️', type:'전투', region:'grave', x:2, y:1, links:['abbey','crypt'] },
  { id:'crypt', name:'지하 묘실', short:'묘실', icon:'⚰️', type:'사건', region:'grave', x:3, y:1, links:['cemetery','graveTreasure'] },
  { id:'graveTreasure', name:'망자의 제단', short:'제단', icon:'🎁', type:'보물', region:'grave', x:4, y:1, links:['crypt','watchtower','northRoad'] },
  { id:'watchtower', name:'무너진 망루', short:'망루', icon:'💀', type:'전투', region:'grave', x:5, y:1, links:['graveTreasure','warCamp'] },
  { id:'warCamp', name:'버려진 진지', short:'진지', icon:'⚔️', type:'전투', region:'war', x:6, y:1, links:['watchtower','demonKeep'] },
  { id:'demonKeep', name:'악마 기사의 성채', short:'성채', icon:'😈', type:'보스', region:'war', x:7, y:1, links:['warCamp','brokenWall'] },

  // East: battlefield
  { id:'brokenWall', name:'부서진 성벽', short:'성벽', icon:'🧱', type:'사건', region:'war', x:7, y:2, links:['demonKeep','battleTreasure'] },
  { id:'battleTreasure', name:'전장의 유품', short:'유품', icon:'🎁', type:'보물', region:'war', x:7, y:3, links:['brokenWall','warGate'] },
  { id:'warGate', name:'전쟁터 관문', short:'관문', icon:'⚔️', type:'전투', region:'war', x:7, y:4, links:['battleTreasure','orcField','eastRoad'] },
  { id:'orcField', name:'오크 전장', short:'오크', icon:'👹', type:'전투', region:'war', x:7, y:5, links:['warGate','ashField'] },
  { id:'ashField', name:'잿빛 평원', short:'잿빛', icon:'🔥', type:'위험', region:'volcano', x:7, y:6, links:['orcField','dragon'] },
  { id:'dragon', name:'드래곤의 성', short:'용의 성', icon:'🐉', type:'잠김', region:'dragon', x:7, y:7, links:['ashField','lavaBridge'], locked:true },

  // South: volcano / mine
  { id:'lavaBridge', name:'용암 다리', short:'용암', icon:'🌋', type:'위험', region:'volcano', x:6, y:7, links:['dragon','wyvernNest'] },
  { id:'wyvernNest', name:'와이번 둥지', short:'와이번', icon:'🐲', type:'전투', region:'volcano', x:5, y:7, links:['lavaBridge','temple'] },
  { id:'temple', name:'고대 신전', short:'신전', icon:'🗿', type:'봉인', region:'volcano', x:4, y:7, links:['wyvernNest','mine','southRoad'] },
  { id:'mine', name:'폐광', short:'폐광', icon:'⛏️', type:'전투', region:'mine', x:3, y:7, links:['temple','lostCart'] },
  { id:'lostCart', name:'버려진 광차', short:'광차', icon:'🎁', type:'보물', region:'mine', x:2, y:7, links:['mine','trollGrove'] },
  { id:'trollGrove', name:'트롤 왕의 숲', short:'트롤왕', icon:'🧌', type:'보스', region:'forest', x:1, y:7, links:['lostCart','deepForest'] },

  // West: cursed forest
  { id:'deepForest', name:'깊은 숲', short:'깊은숲', icon:'🌲', type:'전투', region:'forest', x:1, y:6, links:['trollGrove','spiderNest'] },
  { id:'spiderNest', name:'거미 둥지', short:'거미', icon:'🕷️', type:'전투', region:'forest', x:1, y:5, links:['deepForest','forestGate'] },
  { id:'forestGate', name:'숲의 관문', short:'숲문', icon:'🌳', type:'사건', region:'forest', x:1, y:4, links:['spiderNest','witchHut','westRoad'] },
  { id:'witchHut', name:'마녀의 오두막', short:'오두막', icon:'🧙', type:'상점', region:'forest', x:1, y:3, links:['forestGate','boneRoad'] },
  { id:'boneRoad', name:'뼈의 길', short:'뼈길', icon:'🦴', type:'전투', region:'grave', x:1, y:2, links:['witchHut','abbey'] },

  // ─────────────────────────────────────────────
  // INNER CROSS — shortcuts back to the village
  // ─────────────────────────────────────────────
  { id:'northRoad', name:'북쪽 순례길', short:'북로', icon:'⬆️', type:'길', region:'road', x:4, y:2, links:['graveTreasure','northShrine'] },
  { id:'northShrine', name:'작은 성소', short:'성소', icon:'❤️', type:'휴식', region:'road', x:4, y:3, links:['northRoad','village'] },

  { id:'eastRoad', name:'동쪽 군용로', short:'동로', icon:'➡️', type:'길', region:'road', x:6, y:4, links:['warGate','eastCross'] },
  { id:'eastCross', name:'동쪽 교차로', short:'교차로', icon:'❓', type:'사건', region:'road', x:5, y:4, links:['eastRoad','village'] },

  { id:'southRoad', name:'남쪽 광산길', short:'남로', icon:'⬇️', type:'길', region:'road', x:4, y:6, links:['temple','southCamp'] },
  { id:'southCamp', name:'광부의 야영지', short:'야영지', icon:'❤️', type:'휴식', region:'road', x:4, y:5, links:['southRoad','village'] },

  { id:'westRoad', name:'서쪽 숲길', short:'서로', icon:'⬅️', type:'길', region:'road', x:2, y:4, links:['forestGate','westCross'] },
  { id:'westCross', name:'서쪽 교차로', short:'교차로', icon:'❓', type:'사건', region:'road', x:3, y:4, links:['westRoad','village'] },

  // Center
  { id:'village', name:'왕국 마을', short:'마을', icon:'🏠', type:'마을', region:'village', x:4, y:4, links:['northShrine','eastCross','southCamp','westCross'] }
];
