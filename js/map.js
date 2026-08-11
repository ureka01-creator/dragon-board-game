window.WORLD_NODES = [
  { id:'village', name:'왕국 마을', icon:'🏠', type:'마을', x:3, y:3, links:['forest','mine','battlefield'] },
  { id:'forest', name:'저주받은 숲', icon:'🌲', type:'탐험', x:2, y:3, links:['village','cemetery','temple'] },
  { id:'cemetery', name:'공동묘지', icon:'☠️', type:'전투', x:2, y:2, links:['forest','abbey'] },
  { id:'abbey', name:'버려진 수도원', icon:'🏰', type:'보스', x:2, y:1, links:['cemetery'] },
  { id:'temple', name:'고대 신전', icon:'🗿', type:'봉인', x:2, y:4, links:['forest','volcano'] },
  { id:'mine', name:'폐광', icon:'⛏️', type:'전투', x:3, y:4, links:['village','volcano'] },
  { id:'battlefield', name:'전쟁터', icon:'⚔️', type:'전투', x:4, y:3, links:['village','volcano'] },
  { id:'volcano', name:'화산지대', icon:'🔥', type:'위험', x:3, y:5, links:['temple','mine','battlefield','dragon'] },
  { id:'dragon', name:'드래곤의 성', icon:'🐉', type:'잠김', x:4, y:5, links:['volcano'], locked:true }
];
