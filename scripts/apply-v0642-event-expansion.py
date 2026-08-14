from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise SystemExit(f'missing marker in {path}: {old[:140]!r}')
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, replacement):
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'pattern count {count} in {path}: {pattern[:120]!r}')
    write(path, updated)


# ---------- events.js: 20 -> 40 cards ----------
events_path = 'js/events.js'
events = read(events_path)
marker = "\n  ];\n\n  window.EVENT_CARDS = cards;"
if marker not in events:
    raise SystemExit('events.js end marker missing')
extra_cards = r''',
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
'''
events = events.replace(marker, extra_cards + marker, 1)
write(events_path, events)

# ---------- map.js: event tiles 4 -> 8, combat tiles 14 -> 10 ----------
map_path = 'js/map.js'
map_text = read(map_path)
map_text = map_text.replace("// DRAGON BOARD V0.5.8.0", "// DRAGON BOARD V0.6.4.2", 1)
replacements = {
    "eventNames:['울리는 종','핏자국','검은 까마귀','사라진 묘지기']": "eventNames:['울리는 종','핏자국','검은 까마귀','사라진 묘지기','봉인된 묘실','망자의 행렬','피묻은 제단','길 잃은 영혼']",
    "eventNames:['속삭이는 나무','길 잃은 여행자','수상한 발자국','푸른 불빛']": "eventNames:['속삭이는 나무','길 잃은 여행자','수상한 발자국','푸른 불빛','요정의 고리','사냥꾼 야영지','움직이는 덩굴','우는 아이']",
    "eventNames:['꺼지지 않는 봉화','부상병','찢어진 군기','전령의 시체']": "eventNames:['꺼지지 않는 봉화','부상병','찢어진 군기','전령의 시체','부상병 행렬','버려진 보급마차','룬 지뢰','탈영병 은신처']",
    "eventNames:['지진','분화 징조','붉은 유성','광부의 흔적']": "eventNames:['지진','분화 징조','붉은 유성','광부의 흔적','용암 분출구','붉은 수정맥','불의 정령','무너진 갱도']",
}
for old, new in replacements.items():
    if old not in map_text:
        raise SystemExit(f'map eventNames marker missing: {old}')
    map_text = map_text.replace(old, new, 1)

pattern = r"function buildTileDeck\(theme\) \{.*?return shuffle\(tiles\); // 30개\. 게이트 2개 \+ 중앙 1개를 제외한 슬롯 수와 동일\.\n\}"
replacement = r'''function buildTileDeck(theme) {
  const tiles = [];
  // V0.6.4.2: 탐험 반복감을 줄이기 위해 사건칸을 4→8로 늘리고 일반 전투를 14→10으로 낮춘다.
  // 전체 30슬롯은 그대로 유지해 맵 크기/연결 구조에는 영향을 주지 않는다.
  const fixedSlots = 1 // 던전
    + theme.treasureNames.length
    + theme.eventNames.length
    + theme.restNames.length
    + 1 // 상점
    + theme.dangerNames.length
    + 1 // 길
    + 1; // 보스
  const combatSlots = Math.max(1, 30 - fixedSlots);
  theme.combatNames.slice(0, combatSlots).forEach(name => tiles.push({ type:'전투', name, short:name.slice(0,4), icon:iconForType('전투',theme), encounterPool:theme.combatPool }));
  tiles.push({ type:'던전', name:theme.dungeonName, short:'소형던전', icon:'🕳️', encounterPool:theme.combatPool });
  theme.treasureNames.forEach(name => tiles.push({ type:'보물', name, short:name.slice(0,4), icon:'🎁' }));
  theme.eventNames.forEach(name => tiles.push({ type:'사건', name, short:name.slice(0,4), icon:'❓' }));
  theme.restNames.forEach(name => tiles.push({ type:'휴식', name, short:name.slice(0,4), icon:'❤️' }));
  tiles.push({ type:'상점', name:theme.shopName, short:'상점', icon:'🏪' });
  theme.dangerNames.forEach(name => tiles.push({ type:'위험', name, short:name.slice(0,4), icon:'🔥' }));
  tiles.push({ type:'길', name:`${theme.label}의 길`, short:'길', icon:'🛤️' });
  tiles.push({ type:'보스', name:theme.bossName, short:'지역보스', icon:'👑', bossMonsterId:theme.boss });
  return shuffle(tiles); // 항상 30개
}'''
map_text, count = re.subn(pattern, replacement, map_text, count=1, flags=re.S)
if count != 1:
    raise SystemExit('buildTileDeck pattern mismatch')
write(map_path, map_text)

# ---------- game.js: region-aware event deck ----------
game_path = 'js/game.js'
game = read(game_path)
game = game.replace('// DRAGON BOARD V0.6.3.8', '// DRAGON BOARD V0.6.4.2', 1)
if 'eventDeckRegion: null,' not in game:
    game = game.replace('eventDiscard: [],\n', 'eventDiscard: [],\neventDeckRegion: null,\n', 1)
# start/reset states only; new draw function below does not use this exact pair.
game = game.replace('state.eventDeck = [];\nstate.eventDiscard = [];', 'state.eventDeck = [];\nstate.eventDiscard = [];\nstate.eventDeckRegion = null;')
old_draw_pattern = r"function drawEventCard\(\) \{.*?\n\}\nfunction heroEventStat"
new_draw = r'''function drawEventCard(node = null) {
const region = node?.region || null;
const allCards = Array.isArray(window.EVENT_CARDS) ? window.EVENT_CARDS : [];
const source = allCards.filter(card => {
const regions = Array.isArray(card?.regions) ? card.regions : [];
return !regions.length || !region || regions.includes(region);
});
const hasPreparedTestDeck = Array.isArray(state.eventDeck) && state.eventDeck.length > 0 && state.eventDeckRegion === null;
if (!Array.isArray(state.eventDeck) || !state.eventDeck.length || (!hasPreparedTestDeck && state.eventDeckRegion !== region)) {
const weightedIds = [];
source.forEach(card => {
const isRegional = Array.isArray(card.regions) && card.regions.includes(region);
const copies = isRegional ? 2 : 1;
for (let i = 0; i < copies; i += 1) weightedIds.push(card.id);
});
state.eventDeck = shuffleArray(weightedIds);
state.eventDiscard = [];
state.eventDeckRegion = region;
}
const id = state.eventDeck.shift();
const card = allCards.find(entry => entry.id === id) || null;
if (card) state.eventDiscard.push(card.id);
return card;
}
function heroEventStat'''
game, count = re.subn(old_draw_pattern, new_draw, game, count=1, flags=re.S)
if count != 1:
    raise SystemExit('drawEventCard pattern mismatch')
if 'const card = drawEventCard();' not in game:
    raise SystemExit('drawEventCard call marker missing')
game = game.replace('const card = drawEventCard();', 'const card = drawEventCard(node);', 1)
old_kicker = '<div class="status-kicker">EVENT CARD · ${state.eventDiscard.length}/20</div>'
new_kicker = '<div class="status-kicker">${card.rarity === \'rare\' ? \'RARE EVENT\' : (Array.isArray(card.regions) && card.regions.length ? \'REGION EVENT\' : \'EVENT CARD\')} · ${getAreaDisplayName(getNodeAreaId(hero.position))}</div>'
if old_kicker not in game:
    raise SystemExit('event kicker marker missing')
game = game.replace(old_kicker, new_kicker, 1)
write(game_path, game)

# ---------- version/cache ----------
replace_once('js/dev-bootstrap.js', '// DRAGON BOARD V0.6.4.0 — developer runtime bootstrap', '// DRAGON BOARD V0.6.4.2 — developer runtime bootstrap')
replace_once('js/dev-bootstrap.js', "js/game.js?v=0640-dev", "js/game.js?v=0642-dev")

index = read('index.html')
for old, new in [
    ('PROTOTYPE V0.6.4.0', 'PROTOTYPE V0.6.4.2'),
    ('js/map.js?v=0620', 'js/map.js?v=0642'),
    ('js/events.js?v=0620', 'js/events.js?v=0642'),
    ('js/dev-bootstrap.js?v=0640', 'js/dev-bootstrap.js?v=0642'),
    ('js/game.js?v=0640', 'js/game.js?v=0642'),
]:
    if old not in index:
        raise SystemExit(f'index marker missing: {old}')
    index = index.replace(old, new, 1)
write('index.html', index)

for path in ['tests/regression.spec.cjs', 'tests/dev-tools.spec.cjs']:
    text = read(path)
    if 'PROTOTYPE V0.6.4.0' not in text:
        raise SystemExit(f'version expectation missing in {path}')
    write(path, text.replace('PROTOTYPE V0.6.4.0', 'PROTOTYPE V0.6.4.2'))

workflow = read('.github/workflows/browser-regression.yml')
workflow = workflow.replace('Run V0.6.4.0 regression suite', 'Run V0.6.4.2 regression suite')
write('.github/workflows/browser-regression.yml', workflow)

# ---------- new Playwright coverage: 3 cases x 2 engines ----------
Path('tests/event-expansion.spec.cjs').write_text(r'''const { test, expect } = require('@playwright/test');

const EVENT_API_INJECTION = String.raw`
window.__EVENT_EXPANSION_TEST_API = {
  drawRegion(region, count = 36) {
    state.eventDeck = [];
    state.eventDiscard = [];
    state.eventDeckRegion = null;
    const result = [];
    for (let i = 0; i < count; i++) {
      const card = drawEventCard({ region });
      if (!card) break;
      result.push({ id:card.id, regions:Array.isArray(card.regions) ? [...card.regions] : [], rarity:card.rarity || 'common' });
    }
    return result;
  }
};
`;

async function installEventApi(page) {
  await page.route('**/js/game.js*', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const marker = body.lastIndexOf('})();');
    if (marker < 0) throw new Error('Unable to inject event expansion test API');
    body = body.slice(0, marker) + '\n' + EVENT_API_INJECTION + '\n' + body.slice(marker);
    await route.fulfill({ response, body, contentType:'application/javascript' });
  });
}

test('V0.6.4.2 expands the event library to 40 cards with regional and rare events', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.version-label')).toHaveText('PROTOTYPE V0.6.4.2');
  const summary = await page.evaluate(() => {
    const cards = window.EVENT_CARDS || [];
    const regionCounts = {};
    ['grave','forest','war','volcano'].forEach(region => {
      regionCounts[region] = cards.filter(card => Array.isArray(card.regions) && card.regions.includes(region)).length;
    });
    return {
      total: cards.length,
      ids: cards.map(card => card.id),
      rare: cards.filter(card => card.rarity === 'rare').length,
      regionCounts
    };
  });
  expect(summary.total).toBe(40);
  expect(new Set(summary.ids).size).toBe(40);
  expect(summary.rare).toBeGreaterThanOrEqual(4);
  Object.values(summary.regionCounts).forEach(count => expect(count).toBeGreaterThanOrEqual(4));
  expect(errors).toEqual([]);
});

test('each region generates 8 event tiles and 10 normal combat tiles', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const composition = await page.evaluate(() => ['A','B','C','D'].map(areaId => {
    const nodes = WORLD_NODES.filter(node => node.areaId === areaId);
    return {
      areaId,
      events:nodes.filter(node => node.type === '사건').length,
      combats:nodes.filter(node => node.type === '전투').length,
      dungeons:nodes.filter(node => node.type === '던전').length,
      bosses:nodes.filter(node => node.type === '보스').length
    };
  }));
  composition.forEach(area => {
    expect(area.events).toBe(8);
    expect(area.combats).toBe(10);
    expect(area.dungeons).toBe(1);
    expect(area.bosses).toBe(1);
  });
  expect(errors).toEqual([]);
});

test('regional event deck never serves another region specific card', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await installEventApi(page);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!window.__EVENT_EXPANSION_TEST_API)).toBe(true);
  const result = await page.evaluate(() => {
    const output = {};
    for (const region of ['grave','forest','war','volcano']) {
      output[region] = window.__EVENT_EXPANSION_TEST_API.drawRegion(region, 36);
    }
    return output;
  });
  for (const [region, cards] of Object.entries(result)) {
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.some(card => card.regions.includes(region))).toBe(true);
    for (const card of cards) {
      if (!card.regions.length) continue;
      expect(card.regions).toContain(region);
    }
  }
  expect(errors).toEqual([]);
});
''', encoding='utf-8')

print('V0.6.4.2 event expansion patch prepared')
