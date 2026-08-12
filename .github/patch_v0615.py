from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected 1 match, got {count}')
    p.write_text(text.replace(old, new, 1))

p = Path('js/board3d.js')
text = p.read_text()
text = text.replace('// DRAGON BOARD V0.6.1.4', '// DRAGON BOARD V0.6.1.5', 1)
text = text.replace('let sceneDieRollToken = 0;', 'let sceneDieRollToken = 0;\nlet sceneDieMotion = null;', 1)
text = text.replace('new THREE.BoxGeometry(.62,.62,.62)', 'new THREE.BoxGeometry(.54,.54,.54)', 1)
p.write_text(text)

replace_once('js/board3d.js', '''function startSceneDiceRoll() {
  const die = ensureSceneDie();
  if (!die) return;
  const token = ++sceneDieRollToken;
  die.visible = true;
  die.position.set(-2.45, 3.9, 1.55);
  die.rotation.set(.28,.12,.08);
  const started = performance.now();
  const loop = now => {
    if (token !== sceneDieRollToken || !sceneDie?.visible) return;
    const t = (now - started) / 1000;
    if (t < .78) {
      const u = Math.max(0, Math.min(1, t / .78));
      const e = u * u * (3 - 2 * u);
      die.position.x = THREE.MathUtils.lerp(-2.45, .35, e);
      die.position.z = THREE.MathUtils.lerp(1.55, -.35, e);
      die.position.y = THREE.MathUtils.lerp(3.9, .47, u * u);
    } else {
      const g = t - .78;
      const travel = Math.min(g, 1.1);
      die.position.x = .35 + travel * .46;
      die.position.z = -.35 - travel * .19;
      const bounce = Math.abs(Math.sin(g * 10.5)) * Math.max(0, .62 - g * .52);
      die.position.y = .47 + bounce;
    }
    die.rotation.x = .28 + t * 10.8;
    die.rotation.y = .12 + t * 8.4;
    die.rotation.z = .08 + t * 6.1;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
''', '''function startSceneDiceRoll() {
  const die = ensureSceneDie();
  if (!die) return;
  const token = ++sceneDieRollToken;
  die.visible = true;
  die.position.set(-2.05, 3.15, 1.22);
  die.rotation.set(.34,.18,.12);

  // V0.6.1.5: scripted bounce 대신 간단한 중력/충돌/마찰 적분으로
  // 낙하부터 바닥 굴림까지 한 흐름으로 이어지게 한다.
  const motion = {
    vx: 2.15,
    vy: -0.25,
    vz: -1.02,
    wx: 8.2,
    wy: 6.9,
    wz: 5.2,
    last: performance.now(),
    floorY: .43,
  };
  sceneDieMotion = motion;

  const loop = now => {
    if (token !== sceneDieRollToken || !sceneDie?.visible || sceneDieMotion !== motion) return;
    const dt = Math.min(.033, Math.max(.008, (now - motion.last) / 1000));
    motion.last = now;

    motion.vy -= 9.1 * dt;
    die.position.x += motion.vx * dt;
    die.position.y += motion.vy * dt;
    die.position.z += motion.vz * dt;

    die.rotation.x += motion.wx * dt;
    die.rotation.y += motion.wy * dt;
    die.rotation.z += motion.wz * dt;

    if (die.position.y <= motion.floorY) {
      die.position.y = motion.floorY;
      if (Math.abs(motion.vy) > .62) {
        motion.vy = -motion.vy * .38;
        motion.vx *= .88;
        motion.vz *= .88;
        motion.wx *= .82;
        motion.wy *= .82;
        motion.wz *= .82;
      } else {
        motion.vy = 0;
        const friction = Math.pow(.25, dt);
        motion.vx *= friction;
        motion.vz *= friction;
        motion.wx *= Math.pow(.20, dt);
        motion.wy *= Math.pow(.20, dt);
        motion.wz *= Math.pow(.20, dt);
      }
    }

    // 너무 일찍 완전히 멎지 않게 마지막 또르르 느낌만 아주 약하게 유지한다.
    if (die.position.y <= motion.floorY + .001 && Math.hypot(motion.vx,motion.vz) < .18) {
      motion.vx += .035 * dt;
      motion.vz -= .018 * dt;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
''')

replace_once('js/board3d.js', '''function settleSceneDice(face) {
  const die = ensureSceneDie();
  if (!die) return Promise.resolve();
  sceneDieRollToken += 1;
  die.visible = true;
  const fromPos = die.position.clone();
  const fromQuat = die.quaternion.clone();
  const toPos = new THREE.Vector3(.70,.47,-.55);
  const toQuat = dieTargetQuaternion(face);
  return new Promise(resolve => {
    const started = performance.now();
    const duration = 360;
    const frame = now => {
      const u = Math.max(0, Math.min(1, (now - started) / duration));
      const e = 1 - Math.pow(1 - u, 3);
      die.position.lerpVectors(fromPos,toPos,e);
      die.quaternion.copy(fromQuat).slerp(toQuat,e);
      if (u < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
''', '''function settleSceneDice(face) {
  const die = ensureSceneDie();
  if (!die) return Promise.resolve();
  sceneDieRollToken += 1;
  sceneDieMotion = null;
  die.visible = true;
  const fromPos = die.position.clone();
  const fromQuat = die.quaternion.clone();
  const toPos = new THREE.Vector3(fromPos.x + .30, .43, fromPos.z - .12);
  const toQuat = dieTargetQuaternion(face);
  const extraAxis = new THREE.Vector3(.72,1,.48).normalize();
  const baseQuat = new THREE.Quaternion();
  const extraQuat = new THREE.Quaternion();
  return new Promise(resolve => {
    const started = performance.now();
    const duration = 760;
    const frame = now => {
      const u = Math.max(0, Math.min(1, (now - started) / duration));
      const smooth = u * u * (3 - 2 * u);
      const orient = 1 - Math.pow(1 - u, 2.35);

      die.position.x = THREE.MathUtils.lerp(fromPos.x,toPos.x,smooth);
      die.position.z = THREE.MathUtils.lerp(fromPos.z,toPos.z,smooth);
      const tinyHop = Math.sin(Math.PI * u) * .075 * (1 - u);
      die.position.y = THREE.MathUtils.lerp(fromPos.y,toPos.y,smooth) + tinyHop;

      baseQuat.copy(fromQuat).slerp(toQuat,orient);
      const residualRoll = Math.sin(Math.PI * u) * (1 - u) * 1.05;
      extraQuat.setFromAxisAngle(extraAxis,residualRoll);
      die.quaternion.copy(baseQuat).multiply(extraQuat);

      if (u < 1) requestAnimationFrame(frame);
      else {
        die.position.copy(toPos);
        die.quaternion.copy(toQuat);
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}
''')

replace_once('js/board3d.js', '''function hideSceneDice() {
  sceneDieRollToken += 1;
  if (sceneDie) sceneDie.visible = false;
}''', '''function hideSceneDice() {
  sceneDieRollToken += 1;
  sceneDieMotion = null;
  if (sceneDie) sceneDie.visible = false;
}''')

p=Path('js/board3d-play.js'); t=p.read_text(); t=t.replace('// DRAGON BOARD V0.6.1.4','// DRAGON BOARD V0.6.1.5',1); t=t.replace('await waitMs(320);','await waitMs(430);',1); p.write_text(t)

p=Path('index.html'); t=p.read_text(); t=t.replace('PROTOTYPE V0.6.1.4','PROTOTYPE V0.6.1.5'); t=t.replace('?v=0614','?v=0615'); p.write_text(t)

p=Path('README.md'); t=p.read_text();
lines=t.splitlines();
if lines and lines[0].startswith('# DRAGON BOARD'):
    lines[0]='# DRAGON BOARD — Web Prototype V0.6.1.5'
    t='\n'.join(lines)+'\n'
    p.write_text(t)
