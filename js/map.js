// DRAGON BOARD V0.5.6.2
// 외곽 실루엣과 내부 길 구조/테마/타일 배치 모두 지역마다, 새 게임마다 다시 생성된다.
window.PARTY_SYSTEM_ENABLED = false;

const AREA_IDS = ['A','B','C','D'];
const AREA_NEIGHBORS = {
  A: { east:'B', south:'C' },
  B: { west:'A', south:'D' },
  C: { north:'A', east:'D' },
  D: { north:'B', west:'C' },
};

const THEMES = {
  grave: {
    label:'망자의 땅', icon:'☠️', region:'grave',
    combatPool:['skeleton','ghost','slime'], boss:'necromancer',
    combatNames:['백골길','낡은 묘비군','망자의 뜰','검은 장례길','유령 회랑','부서진 납골당','침묵의 묘역','핏빛 비석길','썩은 관문','망령의 샛길','해골 참호','저주받은 계단','흐느끼는 언덕','빈 관 속 길','장송의 골목'],
    treasureNames:['도굴꾼의 상자','망자의 유품','봉인된 관','성자의 유골함'],
    eventNames:['울리는 종','핏자국','검은 까마귀','사라진 묘지기'],
    restNames:['작은 성소','순례자의 쉼터'], shopName:'묘지기 상점', dangerNames:['저주의 안개','죽음의 종소리'], bossName:'버려진 수도원'
  },
  forest: {
    label:'저주받은 숲', icon:'🌲', region:'forest',
    combatPool:['wolf','spider','goblin'], boss:'trollKing',
    combatNames:['가시숲','늑대길','거미굴','검은 수풀','뒤틀린 고목','버섯 숲','사냥꾼 길','독초 지대','울창한 협곡','마른 개울','수액 동굴','고블린 흔적','숲속 폐허','굶주린 짐승길','마녀의 오솔길'],
    treasureNames:['버려진 배낭','고목의 보물','사냥꾼 은닉처','요정의 상자'],
    eventNames:['속삭이는 나무','길 잃은 여행자','수상한 발자국','푸른 불빛'],
    restNames:['맑은 샘','숲속 야영지'], shopName:'마녀의 오두막', dangerNames:['독안개','가시 폭풍'], bossName:'트롤 왕의 숲'
  },
  war: {
    label:'피의 전쟁터', icon:'⚔️', region:'war',
    combatPool:['goblin','orc','ogre','darkKnight'], boss:'demonKnight',
    combatNames:['부서진 방진','오크 전초기지','검은 참호','피의 언덕','무너진 성벽','불탄 막사','버려진 포대','투석기 잔해','창병의 길','검은 군기지','쇠사슬 광장','패잔병 진지','붉은 관문','철갑 전선','악마군 흔적'],
    treasureNames:['전장의 유품','장교의 상자','보급품 마차','무기고 잔해'],
    eventNames:['꺼지지 않는 봉화','부상병','찢어진 군기','전령의 시체'],
    restNames:['야전 천막','낡은 막사'], shopName:'용병 상인', dangerNames:['화살 세례','붕괴하는 성벽'], bossName:'악마 기사의 성채'
  },
  volcano: {
    label:'불타는 황무지', icon:'🔥', region:'volcano',
    combatPool:['fireImp','orc','minotaur','wyvern'], boss:'demonKnight',
    combatNames:['잿빛 평원','용암 틈','화염 동굴','검댕 길','불타는 폐광','검은 용암지','와이번 흔적','붉은 협곡','유황 구덩이','불꽃 계단','잿더미 언덕','용암 폭포','마른 광맥','화산 동굴','재의 관문'],
    treasureNames:['광부의 금고','화산석 상자','잿더미 보물','용암 옆 유품'],
    eventNames:['지진','분화 징조','붉은 유성','광부의 흔적'],
    restNames:['광부 야영지','온천 틈새'], shopName:'광산 상인', dangerNames:['용암 분출','화산재 폭풍'], bossName:'화염 성채'
  }
};

// V0.5.6.2: 외곽도 고정 사각형이 아니다.
// 네 모서리 중 1~3곳을 안쪽으로 꺾어서, 지역마다/새 게임마다 실루엣이 달라진다.
// 노드 수는 24칸으로 유지해 기존 보드 밸런스(총 33칸)를 깨지 않는다.
function makeRandomOuterShape() {
  // 0001~1110 중 하나: 최소 한 모서리는 변하고, 네 모서리 전부 동일하게 꺾이지도 않게 한다.
  const mask = 1 + Math.floor(Math.random() * 14);
  const insetNW = Boolean(mask & 1);
  const insetNE = Boolean(mask & 2);
  const insetSE = Boolean(mask & 4);
  const insetSW = Boolean(mask & 8);

  const coords = [];

  // 위쪽: 좌→우
  [[2,1],[3,1],[4,1],[5,1],[6,1]].forEach(p => coords.push(p));
  coords.push(insetNE ? [6,2] : [7,1]);

  // 오른쪽: 위→아래
  [[7,2],[7,3],[7,4],[7,5],[7,6]].forEach(p => coords.push(p));
  coords.push(insetSE ? [6,6] : [7,7]);

  // 아래쪽: 우→좌
  [[6,7],[5,7],[4,7],[3,7],[2,7]].forEach(p => coords.push(p));
  coords.push(insetSW ? [2,6] : [1,7]);

  // 왼쪽: 아래→위
  [[1,6],[1,5],[1,4],[1,3],[1,2]].forEach(p => coords.push(p));
  coords.push(insetNW ? [2,2] : [1,1]);

  return coords;
}

// V0.5.6.2: 내부 9칸의 모양은 더 이상 고정 십자가가 아니다.
// 각 지역/새 게임마다 5x5 내부에서 연결된 9칸을 새로 생성한다.
const INNER_CELLS = [];
for (let y=2; y<=6; y++) {
  for (let x=2; x<=6; x++) INNER_CELLS.push([x,y]);
}

function coordKey(x,y) { return `${x},${y}`; }

function makeRandomInnerShape(outerCoords) {
  const blocked = new Set((outerCoords || []).map(([x,y]) => coordKey(x,y)));

  for (let attempt=0; attempt<120; attempt++) {
    const chosen = new Map();
    const seed = blocked.has(coordKey(4,4))
      ? INNER_CELLS.find(([x,y]) => !blocked.has(coordKey(x,y)))
      : [4,4];
    if (!seed) break;
    chosen.set(coordKey(...seed), seed);

    let guard = 0;
    while (chosen.size < 9 && guard++ < 300) {
      const existing = shuffle([...chosen.values()]);
      let added = false;
      for (const base of existing) {
        const dirs = shuffle([[1,0],[-1,0],[0,1],[0,-1]]);
        for (const [dx,dy] of dirs) {
          const x = base[0] + dx;
          const y = base[1] + dy;
          if (x < 2 || x > 6 || y < 2 || y > 6) continue;
          const key = coordKey(x,y);
          if (blocked.has(key) || chosen.has(key)) continue;
          chosen.set(key,[x,y]);
          added = true;
          break;
        }
        if (added) break;
      }
      if (!added) break;
    }

    if (chosen.size !== 9) continue;
    const cells = [...chosen.values()];
    const outerAdj = cells.reduce((sum,[x,y]) => {
      return sum + (outerCoords || []).filter(([ox,oy]) => Math.abs(x-ox)+Math.abs(y-oy)===1).length;
    },0);
    if (outerAdj >= 2) return cells;
  }

  // 안전 fallback: 외곽과 겹치지 않는 내부칸을 연결 성장으로 다시 채운다.
  const available = INNER_CELLS.filter(([x,y]) => !blocked.has(coordKey(x,y)));
  return available.slice(0,9);
}

function outerNodeKeyAt(outerShape, x, y) {
  const index = (outerShape || []).findIndex(([ox,oy]) => ox===x && oy===y);
  return index >= 0 ? `o${index}` : null;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function iconForType(type, theme) {
  if (type === '전투') return theme.region === 'grave' ? '💀' : theme.region === 'forest' ? '🐺' : theme.region === 'war' ? '⚔️' : '🔥';
  if (type === '보물') return '🎁';
  if (type === '사건') return '❓';
  if (type === '휴식') return '❤️';
  if (type === '상점') return '🏪';
  if (type === '위험') return '🔥';
  if (type === '보스') return '👑';
  return '·';
}

function buildTileDeck(theme) {
  const tiles = [];
  theme.combatNames.forEach(name => tiles.push({ type:'전투', name, short:name.slice(0,4), icon:iconForType('전투',theme), encounterPool:theme.combatPool }));
  theme.treasureNames.forEach(name => tiles.push({ type:'보물', name, short:name.slice(0,4), icon:'🎁' }));
  theme.eventNames.forEach(name => tiles.push({ type:'사건', name, short:name.slice(0,4), icon:'❓' }));
  theme.restNames.forEach(name => tiles.push({ type:'휴식', name, short:name.slice(0,4), icon:'❤️' }));
  tiles.push({ type:'상점', name:theme.shopName, short:'상점', icon:'🏪' });
  theme.dangerNames.forEach(name => tiles.push({ type:'위험', name, short:name.slice(0,4), icon:'🔥' }));
  tiles.push({ type:'길', name:`${theme.label}의 길`, short:'길', icon:'🛤️' });
  tiles.push({ type:'보스', name:theme.bossName, short:'지역보스', icon:'👑', bossMonsterId:theme.boss });
  return shuffle(tiles); // 30개. 게이트 2개 + 중앙 1개를 제외한 슬롯 수와 동일.
}

function localId(areaId, key) { return `${areaId.toLowerCase()}-${key}`; }

function makeAreaBase(areaId) {
  const nodes = [];
  const outerShape = makeRandomOuterShape();

  outerShape.forEach(([x,y],i) => nodes.push({
    id:localId(areaId,`o${i}`), localKey:`o${i}`, x,y, links:[], isOuter:true
  }));

  const innerShape = makeRandomInnerShape(outerShape);
  innerShape.forEach(([x,y],i) => nodes.push({
    id:localId(areaId,`i${i}`), localKey:`i${i}`, x,y, links:[], isOuter:false
  }));

  // 랜덤 외곽 24칸을 순서대로 닫힌 링으로 연결한다.
  for (let i=0;i<outerShape.length;i++) {
    const prev = localId(areaId,`o${(i+outerShape.length-1)%outerShape.length}`);
    const next = localId(areaId,`o${(i+1)%outerShape.length}`);
    nodes.find(n=>n.localKey===`o${i}`).links.push(prev,next);
  }

  const addLink = (a,b) => {
    if (!a || !b || a.id === b.id) return;
    if (!a.links.includes(b.id)) a.links.push(b.id);
    if (!b.links.includes(a.id)) b.links.push(a.id);
  };

  const innerNodes = nodes.filter(n => !n.isOuter);
  const outerNodes = nodes.filter(n => n.isOuter);

  // 내부는 실제로 상하좌우가 붙어 있는 타일끼리 연결.
  innerNodes.forEach(node => {
    innerNodes.forEach(other => {
      if (Math.abs(node.x-other.x) + Math.abs(node.y-other.y) === 1) addLink(node, other);
    });
  });

  // 내부와 외곽도 실제로 한 칸 붙어 있는 지점에서만 연결.
  innerNodes.forEach(node => {
    outerNodes.forEach(outer => {
      if (Math.abs(node.x-outer.x) + Math.abs(node.y-outer.y) === 1) addLink(node, outer);
    });
  });

  return nodes;
}

function generateWorld() {
  const themeKeys = shuffle(Object.keys(THEMES));
  const areas = {};
  const nodes = [];
  const areaData = {};

  // 먼저 모든 지역의 테마를 확정한다. 화면에는 A/B/C/D 대신 실제 지역명만 사용한다.
  AREA_IDS.forEach((areaId,index) => {
    const themeKey = themeKeys[index % themeKeys.length];
    const theme = THEMES[themeKey];
    const areaNodes = makeAreaBase(areaId);
    areas[areaId] = { id:areaId, name:theme.label, themeKey, themeLabel:theme.label, icon:theme.icon };
    areaData[areaId] = { themeKey, theme, areaNodes, gateKeys:new Set() };
  });

  // 지역 간 연결 입구는 매 게임마다 외곽의 서로 다른 칸에 랜덤 배치한다.
  // 내부 식별자는 A/B/C/D를 유지하지만 플레이어에게는 지역명만 노출한다.
  const connections = [['A','B'],['A','C'],['B','D'],['C','D']];
  const pickGateKey = areaId => {
    const used = areaData[areaId].gateKeys;
    const outerKeys = areaData[areaId].areaNodes
      .filter(node => node.isOuter)
      .map(node => node.localKey);
    const candidates = shuffle(outerKeys.filter(key => !used.has(key)));
    const key = candidates[0];
    used.add(key);
    return key;
  };
  const portals = [];
  connections.forEach(([fromArea,toArea]) => {
    const fromKey = pickGateKey(fromArea);
    const toKey = pickGateKey(toArea);
    portals.push({fromArea,fromKey,toArea,toKey});
  });

  const villageNodeIds = {};

  AREA_IDS.forEach(areaId => {
    const {theme, areaNodes, gateKeys} = areaData[areaId];

    // 마을도 중앙 고정이 아니다. 각 지역의 입구 칸을 제외한 모든 칸 중 한 곳을
    // 새 게임마다 무작위로 골라 마을로 만든다. 따라서 같은 테마라도 매 판 위치가 달라진다.
    const villageCandidates = shuffle(areaNodes.filter(n => !gateKeys.has(n.localKey)));
    const village = villageCandidates[0];
    village.name = `${theme.label} 마을`;
    village.short = '마을';
    village.icon = '🏠';
    village.type = '마을';
    village.region = 'village';
    village.areaId = areaId;
    villageNodeIds[areaId] = village.id;

    const fillable = areaNodes.filter(n => n.id !== village.id && !gateKeys.has(n.localKey));
    const deck = buildTileDeck(theme);
    fillable.forEach((node,i) => Object.assign(node, deck[i % deck.length]));

    portals.forEach(link => {
      let gate = null;
      let targetArea = null;
      let targetKey = null;
      if (link.fromArea === areaId) {
        gate = areaNodes.find(n=>n.localKey===link.fromKey);
        targetArea = link.toArea;
        targetKey = link.toKey;
      } else if (link.toArea === areaId) {
        gate = areaNodes.find(n=>n.localKey===link.toKey);
        targetArea = link.fromArea;
        targetKey = link.fromKey;
      }
      if (!gate || !targetArea || !targetKey) return;
      const targetMeta = areas[targetArea];
      gate.name = `${targetMeta.themeLabel} 입구`;
      gate.short = '지역입구';
      gate.icon = '🗺️';
      gate.type = '입구';
      gate.region = 'road';
      gate.portalTo = targetArea;
      gate.portalEntryId = localId(targetArea, targetKey);
    });

    areaNodes.forEach(node => {
      node.areaId = areaId;
      node.region ||= theme.region;
      node.short ||= node.name?.slice(0,4) || '길';
      node.icon ||= '·';
      node.type ||= '길';
      delete node.localKey;
    });
    nodes.push(...areaNodes);
  });

  return { nodes, areas, villageNodeIds, startNodeId:villageNodeIds.A || nodes[0]?.id };
}

window.resetWorldMap = function resetWorldMap() {
  const generated = generateWorld();
  window.WORLD_NODES = generated.nodes;
  window.WORLD_AREAS = generated.areas;
  window.WORLD_VILLAGE_NODE_IDS = generated.villageNodeIds;
  window.WORLD_START_NODE_ID = generated.startNodeId;
  return generated;
};

// 최초 로드용 1회 생성. 실제 게임 시작 시 다시 생성되어 매 판 구성이 달라진다.
window.resetWorldMap();
