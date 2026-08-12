from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}')
    p.write_text(text.replace(old, new, 1))

# game.js: drive the live 3D hero directly from the exact same movement frame.
replace_once('js/game.js',
"""      const unitOffset = offsets[Math.min(unitIndex, offsets.length - 1)] || [0,0];

      const sourceToken = worldMap.querySelector(`.map-hero-token[data-hero-id=\"${hero.id}\"]`);""",
"""      const unitOffset = offsets[Math.min(unitIndex, offsets.length - 1)] || [0,0];
      // V0.6.1.3: 3D VIEW가 열려 있으면 DOM 감지가 아니라 실제 이동 프레임에서
      // 같은 좌표를 직접 전달한다. 2D/3D 말이 정확히 같은 타이밍으로 움직인다.
      const board3d = window.DRAGON_BOARD_3D_API;
      const board3dActive = Boolean(board3d?.isActive?.());

      const sourceToken = worldMap.querySelector(`.map-hero-token[data-hero-id=\"${hero.id}\"]`);""")

replace_once('js/game.js',
"""      const hopMs = 215;
      const pauseMs = 34;""",
"""      const hopMs = board3dActive ? 285 : 215;
      const pauseMs = board3dActive ? 42 : 34;""")

replace_once('js/game.js',
"""        shadow.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${shadowScale})`;
        shadow.style.opacity = String(shadowOpacity);
      }""",
"""        shadow.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${shadowScale})`;
        shadow.style.opacity = String(shadowOpacity);
        if (board3dActive) {
          board3d.setHeroFromMapPixel?.(hero.id, px, py, lift);
        }
      }""")

replace_once('js/game.js',
"""          setTimeout(() => {
            mover.remove();
            shadow.remove();
            sourceToken?.classList.remove('movement-source-hidden');
            worldMap.classList.remove('movement-lock');
            resolve();
          }, 95);""",
"""          setTimeout(() => {
            if (board3dActive) {
              board3d.snapHeroToNode?.(hero.id, path[path.length - 1]);
              board3d.endHeroMotion?.(hero.id);
            }
            mover.remove();
            shadow.remove();
            sourceToken?.classList.remove('movement-source-hidden');
            worldMap.classList.remove('movement-lock');
            resolve();
          }, 95);""")

replace_once('js/game.js',
"""          place(to, 0, 1.045, .94, 1.05, .38);
          const landedNode = worldMap.querySelector(`[data-node-id=\"${path[segment + 1]}\"]`);""",
"""          place(to, 0, 1.045, .94, 1.05, .38);
          if (board3dActive) board3d.snapHeroToNode?.(hero.id, path[segment + 1]);
          const landedNode = worldMap.querySelector(`[data-node-id=\"${path[segment + 1]}\"]`);""")

# board3d.js: exact destination snapping so height and tile centre never jump after movement.
replace_once('js/board3d.js',
"""function endHeroMotion(heroId) {
  const piece=heroPieces.get(heroId);
  if(piece)piece.userData.motionLocked=false;
}

function pickNodeAt""",
"""function endHeroMotion(heroId) {
  const piece=heroPieces.get(heroId);
  if(piece)piece.userData.motionLocked=false;
}

function snapHeroToNode(heroId,nodeId) {
  const piece=heroPieces.get(heroId);
  const rec=tileRecords.get(nodeId);
  if(!piece||!rec)return;
  const y=rec.height+.03;
  piece.position.set(rec.x,y,rec.z);
  piece.userData.baseY=y;
  piece.userData.motionLocked=true;
}

function pickNodeAt""")

replace_once('js/board3d.js',
"""    setHeroFromMapPixel,
    endHeroMotion,
    pickNodeAt,""",
"""    setHeroFromMapPixel,
    snapHeroToNode,
    endHeroMotion,
    pickNodeAt,""")

# board3d-play.js: movement is now explicitly driven by game.js; observer is state timing only.
replace_once('js/board3d-play.js',
"""const pointerStarts = new Map();
const movingHeroIds = new Set();""",
"""const pointerStarts = new Map();""")

replace_once('js/board3d-play.js',
"""const worldObserver = new MutationObserver(() => {
  lastWorldMutation = Date.now();
  mirrorUnderlyingMovement();
});""",
"""const worldObserver = new MutationObserver(() => {
  lastWorldMutation = Date.now();
});""")

replace_once('js/board3d-play.js',
"""function cleanupOverlay(){activeOverlay=null;clearInterval(syncTimer);syncTimer=0;pointerStarts.clear();movingHeroIds.clear();}""",
"""function cleanupOverlay(){activeOverlay=null;clearInterval(syncTimer);syncTimer=0;pointerStarts.clear();}""")

# Remove the old observer mirroring helper entirely to avoid double-driving the 3D piece.
text = Path('js/board3d-play.js').read_text()
start = text.find('function parseTranslate3d(value)')
end = text.find('function bind3DTileTap(canvas)', start)
if start < 0 or end < 0:
    raise SystemExit('board3d-play.js: old movement mirror block not found')
text = text[:start] + text[end:]
Path('js/board3d-play.js').write_text(text)

# Version/cache busting.
for f in ['js/board3d.js','js/board3d-play.js']:
    p=Path(f); t=p.read_text(); t=t.replace('V0.6.1.2','V0.6.1.3',1); p.write_text(t)

p=Path('index.html'); t=p.read_text();
t=t.replace('PROTOTYPE V0.6.1.1','PROTOTYPE V0.6.1.3')
t=t.replace('?v=0611','?v=0613')
p.write_text(t)

# Keep a concise version note.
p=Path('README.md'); t=p.read_text()
if t.startswith('# DRAGON BOARD'):
    lines=t.splitlines()
    lines[0]='# DRAGON BOARD — Web Prototype V0.6.1.3'
    t='\n'.join(lines)
    if not t.endswith('\n'): t+='\n'
    p.write_text(t)
