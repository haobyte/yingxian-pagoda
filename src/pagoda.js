import { assetUrl } from './asset-url.js';
import * as THREE from 'three';
import { spec as SPEC, deriveLevels, apothemFromSide } from './pagoda-spec.js';
import { BoxBatch, RodBatch, Frame, FACES, T8, C8, cornerDir, octagonRing, octagonShape, mergeStatic } from './lib/kit.js';
import { bracketRing } from './builders/brackets.js';
import { buildRoof } from './builders/roof.js';

const STEPS = { 七铺作: 4, 六铺作: 3, 五铺作: 2 };
const BAYS = [0.31, 0.38, 0.31];

const columnXs = (side) => [-side / 2, -side / 2 + BAYS[0] * side, side / 2 - BAYS[2] * side, side / 2];

// 一圈 24 根柱：每面两根 + 八角
function columnRing(rods, apothem, side, y0, y1, radius, key = 'column') {
  const xs = columnXs(side);
  for (let k = 0; k < 8; k++) {
    const f = FACES[k];
    for (const x of [xs[1], xs[2]]) {
      const p = f.n.clone().multiplyScalar(apothem).addScaledVector(f.t, x);
      rods.rod(key, new THREE.Vector3(p.x, y0, p.z), new THREE.Vector3(p.x, y1, p.z), radius);
    }
    const c = cornerDir(k).multiplyScalar(apothem / C8);
    rods.rod(key, new THREE.Vector3(c.x, y0, c.z), new THREE.Vector3(c.x, y1, c.z), radius);
  }
}

// 平坐栏杆（寻杖、盆唇、地栿、望柱、蜀柱）
function railing(boxes, apothem, y, frontBoxes = null) {
  for (let k = 0; k < 8; k++) {
    const target = frontBoxes && (k === 0 || k === 1 || k === 7) ? frontBoxes : boxes;
    const len = 2 * apothem * T8;
    const f = Frame.onFace(k, apothem, 0, y);
    target.box('wood', f, 0, 1.0, 0, len, 0.09, 0.1, 0, 0, 0, 0.95); // 寻杖
    target.box('wood', f, 0, 0.6, 0, len, 0.12, 0.09, 0, 0, 0, 0.9); // 盆唇
    target.box('wood', f, 0, 0.07, 0, len, 0.14, 0.14, 0, 0, 0, 0.85); // 地栿
    const nPost = Math.max(2, Math.round(len / 1.5));
    for (let i = 0; i <= nPost; i++) {
      const x = -len / 2 + (i * len) / nPost;
      target.box('wood', f, x, 0.58, 0, 0.16, 1.16, 0.16, 0, 0, 0, 0.92); // 望柱
    }
    const nS = Math.round(len / 0.38);
    for (let i = 1; i < nS; i++) {
      const x = -len / 2 + (i * len) / nS;
      target.box('wood', f, x, 0.33, 0, 0.06, 0.42, 0.06, 0, 0, 0, 0.85); // 蜀柱
      if (i % 2 === 0) target.box('wood', f, x, 0.8, 0, 0.07, 0.38, 0.07, 0, 0, 0, 0.85); // 瘿项
    }
  }
}

// 明层隔扇：每面三间（标记 userData.keep 以支持剖切透视与 X 光模式独立显隐）
function bayPanels(group, mats, apothem, side, y0, y1) {
  const xs = columnXs(side);
  const h = y1 - y0;
  const panels = [];
  for (let k = 0; k < 8; k++) {
    const f = FACES[k];
    for (let b = 0; b < 3; b++) {
      const w = xs[b + 1] - xs[b] - 0.45;
      const xc = (xs[b] + xs[b + 1]) / 2;
      const isDoor = b === 1 && k % 2 === 0;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), isDoor ? mats.door : mats.window);
      const p = f.n.clone().multiplyScalar(apothem - 0.1).addScaledVector(f.t, xc);
      mesh.position.set(p.x, y0 + h / 2, p.z);
      mesh.rotation.y = f.th;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.keep = true;
      mesh.userData.face = k;
      group.add(mesh);
      panels.push(mesh);
    }
  }
  // 室内暗面（正常远观时透过窗格显暗；剖切看室内佛像或骨架透视时隐藏）
  const R = (apothem - 0.9) / C8;
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(R, R, h, 8, 1, true, Math.PI / 8), mats.interior);
  inner.position.y = y0 + h / 2;
  inner.userData.keep = true;
  group.add(inner);
  return { panels, inner };
}

// 辽代一层内槽六如来壁画贴图（依据现场照片 IMG_9512：暖黄泥壁、朱红圆光、石绿背光与结跏趺坐佛）
let _tathagataMuralTex = null;
function getTathagataMuralTexture() {
  if (_tathagataMuralTex) return _tathagataMuralTex;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 768;
  const ctx = c.getContext('2d');

  // 1. 辽代古旧泥壁底色（暖黄赭石微斑）
  const bg = ctx.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, '#bfa37a');
  bg.addColorStop(0.5, '#cbb188');
  bg.addColorStop(1, '#a88c64');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  // 岁月斑驳肌理
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(90, 62, 36, 0.055)' : 'rgba(235, 220, 190, 0.05)';
    const rx = (Math.sin(i * 17.3) * 0.5 + 0.5) * c.width;
    const ry = (Math.cos(i * 29.7) * 0.5 + 0.5) * c.height;
    ctx.beginPath();
    ctx.arc(rx, ry, 6 + (i % 24), 0, Math.PI * 2);
    ctx.fill();
  }

  // 朱红边框与栏界
  ctx.strokeStyle = '#7e281d';
  ctx.lineWidth = 18;
  ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
  ctx.strokeStyle = '#3b5e54';
  ctx.lineWidth = 5;
  ctx.strokeRect(28, 28, c.width - 56, c.height - 56);

  // 绘制尊像圆光与如来坐像（上下双铺或单铺大圆光，呼应 IMG_9512 内槽壁画）
  const drawBuddhaRoundel = (cx, cy, R) => {
    // 外圈朱红火焰边饰
    const gOuter = ctx.createRadialGradient(cx, cy, R * 0.65, cx, cy, R);
    gOuter.addColorStop(0, '#2c584e');
    gOuter.addColorStop(0.7, '#8e2d22');
    gOuter.addColorStop(0.92, '#c89b48');
    gOuter.addColorStop(1, 'rgba(180,140,95,0)');
    ctx.fillStyle = gOuter;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 内圈石绿与群青身光
    ctx.fillStyle = '#264648';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.74, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4a64a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 头光
    const headY = cy - R * 0.26;
    ctx.fillStyle = '#993326';
    ctx.beginPath();
    ctx.arc(cx, headY, R * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e0b656';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 仰莲宝座
    ctx.fillStyle = '#8d3024';
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.42, R * 0.46, R * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#deb252';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 结跏趺坐佛身（朱红袈裟 + 泥金胸腹面相）
    ctx.fillStyle = '#9e3325';
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.36, cy + R * 0.36);
    ctx.quadraticCurveTo(cx - R * 0.34, cy - R * 0.12, cx - R * 0.14, cy - R * 0.14);
    ctx.lineTo(cx + R * 0.14, cy - R * 0.14);
    ctx.quadraticCurveTo(cx + R * 0.34, cy - R * 0.12, cx + R * 0.36, cy + R * 0.36);
    ctx.closePath();
    ctx.fill();

    // 胸前金肤与定印
    ctx.fillStyle = '#dfc180';
    ctx.beginPath();
    ctx.ellipse(cx, cy + R * 0.02, R * 0.11, R * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 佛首与螺发肉髻
    ctx.fillStyle = '#e5c687';
    ctx.beginPath();
    ctx.arc(cx, headY, R * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#243248';
    ctx.beginPath();
    ctx.arc(cx, headY - R * 0.05, R * 0.125, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, headY - R * 0.16, R * 0.055, 0, Math.PI * 2);
    ctx.fill();
  };

  drawBuddhaRoundel(c.width * 0.5, c.height * 0.36, 175);
  drawBuddhaRoundel(c.width * 0.27, c.height * 0.76, 98);
  drawBuddhaRoundel(c.width * 0.73, c.height * 0.76, 98);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  _tathagataMuralTex = tex;
  return tex;
}

// 八角藻井（一层与五层内槽顶部：朱红八角肋木、石绿斗八藻井壁板、明镜泥金莲花/九龙垂莲）
function buildOctagonalCaisson(group, aIn, yBase, height) {
  const caisson = new THREE.Group();
  caisson.name = 'octagonalCaisson';
  caisson.userData.keep = true;

  const matRib = new THREE.MeshStandardMaterial({
    color: 0x9b2f23,
    roughness: 0.48,
    metalness: 0.08,
    emissive: 0x260805,
    emissiveIntensity: 0.18,
  });
  const matCoffer = new THREE.MeshStandardMaterial({
    color: 0x2d5c52,
    roughness: 0.52,
    metalness: 0.08,
    emissive: 0x0b1f1a,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xe2b24a,
    roughness: 0.26,
    metalness: 0.76,
    emissive: 0x422c06,
    emissiveIntensity: 0.24,
  });

  // 外圈平棊边框
  const outerCollar = new THREE.Mesh(octagonRing(aIn + 0.18, aIn * 0.86, yBase, 0.12), matRib);
  outerCollar.userData.keep = true;
  caisson.add(outerCollar);

  // 三叠斗八藻井收分（下大上小）
  const r0 = (aIn * 0.88) / C8;
  const r1 = (aIn * 0.62) / C8;
  const r2 = (aIn * 0.36) / C8;
  const h1 = height * 0.45;
  const h2 = height * 0.38;
  const h3 = height * 0.17;

  const tier1 = new THREE.Mesh(
    new THREE.CylinderGeometry(r1, r0, h1, 8, 1, true, Math.PI / 8),
    matCoffer,
  );
  tier1.position.y = yBase + h1 * 0.5;
  tier1.userData.keep = true;
  caisson.add(tier1);

  const tier2 = new THREE.Mesh(
    new THREE.CylinderGeometry(r2, r1, h2, 8, 1, true, Math.PI / 8),
    matCoffer,
  );
  tier2.position.y = yBase + h1 + h2 * 0.5;
  tier2.userData.keep = true;
  caisson.add(tier2);

  // 藻井顶心明镜（八角金盘 + 垂莲宝珠）
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(r2 * 1.02, r2 * 1.02, 0.08, 8, 1, false, Math.PI / 8),
    matRib,
  );
  topCap.position.y = yBase + h1 + h2 + 0.04;
  topCap.userData.keep = true;
  caisson.add(topCap);

  const boss = new THREE.Mesh(new THREE.SphereGeometry(r2 * 0.32, 16, 12), matGold);
  boss.scale.set(1, 0.65, 1);
  boss.position.y = yBase + h1 + h2 - 0.06;
  boss.userData.keep = true;
  caisson.add(boss);

  // 八根朱红攒尖斜肋与横枋
  for (let k = 0; k < 8; k++) {
    const dir = cornerDir(k);
    const p0 = new THREE.Vector3(dir.x * (r0 * 0.98), yBase, dir.z * (r0 * 0.98));
    const p1 = new THREE.Vector3(dir.x * (r2 * 0.95), yBase + h1 + h2, dir.z * (r2 * 0.95));
    const len = p0.distanceTo(p1);
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.11, len, 0.11), matRib);
    rib.position.copy(p0).add(p1).multiplyScalar(0.5);
    rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
    rib.userData.keep = true;
    caisson.add(rib);
  }

  for (const [rad, yy] of [
    [r0 * C8, yBase + 0.06],
    [r1 * C8, yBase + h1],
    [r2 * C8, yBase + h1 + h2],
  ]) {
    const ring = new THREE.Mesh(octagonRing(rad + 0.07, Math.max(0.2, rad - 0.09), yy, 0.09), matGold);
    ring.userData.keep = true;
    caisson.add(ring);
  }

  group.add(caisson);
  return caisson;
}

// 明层内槽柱网与佛坛（内外双槽八角柱 + 阑额普拍枋 + 室内楼板 + 佛坛 + 藻井与壁画）
function brightInnerStructure(boxes, rods, group, mats, L, y0, y1, levelIdx) {
  const aIn = apothemFromSide(L.innerSide);
  const rIn = aIn / C8;
  // 内槽八角柱与内额
  for (let k = 0; k < 8; k++) {
    const c = cornerDir(k).multiplyScalar(rIn);
    rods.rod('column', new THREE.Vector3(c.x, y0, c.z), new THREE.Vector3(c.x, y1, c.z), levelIdx === 0 ? 0.3 : 0.25);
    const fin = Frame.onFace(k, aIn, 0, y0);
    const len = 2 * aIn * T8;
    boxes.box('wood', fin, 0, y1 - y0 - 0.22, 0, len + 0.3, 0.28, 0.28, 0, 0, 0, 0.88);
    boxes.box('wood', fin, 0, y1 - y0 - 0.52, 0, len, 0.22, 0.22, 0, 0, 0, 0.84);
    // 内外槽拉结穿插枋（乳栿）
    const co = cornerDir(k).multiplyScalar((L.apothem - 0.2) / C8);
    boxes.beam('wood', new THREE.Vector3(c.x, y1 - 0.35, c.z), new THREE.Vector3(co.x, y1 - 0.35, co.z), 0.22, 0.28, 0.86);
  }

  // 一层内槽壁板与辽代“六如来”壁画（布置在东、东北、西北、西四面内槽壁，剖切看一层大佛时作为真实背景）
  if (levelIdx === 0) {
    const muralMat = new THREE.MeshStandardMaterial({
      map: getTathagataMuralTexture(),
      roughness: 0.65,
      metalness: 0.04,
      emissive: 0x1e140a,
      emissiveIntensity: 0.16,
      side: THREE.DoubleSide,
    });
    const wallW = 2 * aIn * T8 - 0.48;
    const wallH = y1 - y0 - 0.72;
    for (const k of [2, 3, 5, 6]) {
      const f = FACES[k];
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(wallW, wallH), muralMat);
      const pos = f.n.clone().multiplyScalar(aIn - 0.08);
      panel.position.set(pos.x, y0 + wallH * 0.5 + 0.1, pos.z);
      panel.rotation.y = f.th + Math.PI;
      panel.userData.keep = true;
      panel.userData.innerMural = true;
      group.add(panel);
    }
    // 一层内槽顶部八角藻井（位于大佛头顶上方 10.65m~12.35m 处，呼应 IMG_9512）
    buildOctagonalCaisson(group, aIn, y1 + 1.85, 1.7);
  } else if (levelIdx === 4) {
    // 五层内槽顶部八角九龙藻井（呼应 IMG_9515）
    buildOctagonalCaisson(group, aIn, y1 + 1.15, 1.35);
  }

  // 二~五层室内木楼板（填满平坐内圈）
  if (levelIdx > 0) {
    const floorGeo = octagonRing(L.apothem - 0.85, 0, y0 + 0.02, 0.18);
    const floorMesh = new THREE.Mesh(floorGeo, mats.woodDark);
    floorMesh.receiveShadow = true;
    group.add(floorMesh);
  }
  // 佛坛（依据王南等实测：二层方坛5.29m，三层八角坛边长2.756m，四层方坛5.646m，五层方坛7.111m）
  const ALTARS = [
    null,
    { shape: 'square', w: 5.29, h: 0.368 },
    { shape: 'octagon', apothem: apothemFromSide(2.756), h: 0.567 },
    { shape: 'square', w: 5.646, h: 0.436 },
    { shape: 'square', w: 7.111, h: 0.556 },
  ];
  const al = ALTARS[levelIdx];
  if (al) {
    if (al.shape === 'square') {
      const m1 = new THREE.Mesh(new THREE.BoxGeometry(al.w, al.h, al.w), mats.brick);
      m1.position.y = y0 + al.h / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(al.w + 0.18, 0.08, al.w + 0.18), mats.stone);
      cap.position.y = y0 + al.h;
      m1.castShadow = m1.receiveShadow = cap.receiveShadow = true;
      m1.userData.statueSupport = cap.userData.statueSupport = true;
      m1.userData.keep = cap.userData.keep = true;
      m1.userData.statueFloor = cap.userData.statueFloor = levelIdx + 1;
      group.add(m1, cap);
    } else {
      const ag = new THREE.ExtrudeGeometry(octagonShape(al.apothem), { depth: al.h, bevelEnabled: false });
      ag.rotateX(Math.PI / 2);
      ag.translate(0, y0 + al.h, 0);
      const m1 = new THREE.Mesh(ag, mats.brick);
      m1.castShadow = m1.receiveShadow = true;
      m1.userData.statueSupport = true;
      m1.userData.keep = true;
      m1.userData.statueFloor = levelIdx + 1;
      group.add(m1);
    }
  }
}

// 墙环（每面一块，可在指定面开门洞，并支持按面过滤）
function wallRing(boxes, key, apothem, thick, y0, y1, doorFaces = [], door = { w: 2.6, h: 4.6 }, faceFilter = null) {
  for (let k = 0; k < 8; k++) {
    if (faceFilter && !faceFilter(k)) continue;
    const len = 2 * apothem * T8 + 0.15;
    const f = Frame.onFace(k, apothem - thick / 2, 0, y0);
    const h = y1 - y0;
    if (!doorFaces.includes(k)) {
      boxes.box(key, f, 0, h / 2, 0, len, h, thick);
      continue;
    }
    const side = (len - door.w) / 2;
    boxes.box(key, f, -(door.w / 2 + side / 2), h / 2, 0, side, h, thick);
    boxes.box(key, f, door.w / 2 + side / 2, h / 2, 0, side, h, thick);
    boxes.box(key, f, 0, door.h + (h - door.h) / 2, 0, door.w, h - door.h, thick);
    // 门框
    boxes.box('wood', f, -door.w / 2, door.h / 2, thick / 2, 0.28, door.h, 0.3);
    boxes.box('wood', f, door.w / 2, door.h / 2, thick / 2, 0.28, door.h, 0.3);
    boxes.box('wood', f, 0, door.h + 0.15, thick / 2, door.w + 0.56, 0.3, 0.3);
  }
}

function platform(group, mats, s) {
  const P = s.platform;
  const lower = new THREE.Mesh(new THREE.BoxGeometry(P.lower.halfWidth * 2, P.lower.height, P.lower.halfWidth * 2), mats.brick);
  lower.position.y = P.lower.height / 2;
  const cap1 = new THREE.Mesh(new THREE.BoxGeometry(P.lower.halfWidth * 2 + 0.3, 0.16, P.lower.halfWidth * 2 + 0.3), mats.stone);
  cap1.position.y = P.lower.height;
  const upperGeo = new THREE.ExtrudeGeometry(octagonShape(P.upper.apothem), { depth: P.upper.height, bevelEnabled: false });
  upperGeo.rotateX(Math.PI / 2);
  upperGeo.translate(0, P.height, 0);
  const upper = new THREE.Mesh(upperGeo, mats.brick);
  const top = new THREE.Mesh(octagonRing(P.upper.apothem + 0.2, 0, P.height + 0.001, 0.18), mats.stone);
  // 南侧踏道（照片 9524 可见）
  const stairs = new THREE.Group();
  const N = 25;
  const h = P.height / N;
  for (let i = 0; i < N; i++) {
    const zFront = P.upper.apothem + (N - i) * 0.3;
    const depth = zFront - (P.upper.apothem - 0.5);
    const step = new THREE.Mesh(new THREE.BoxGeometry(P.stairs.width, (i + 1) * h, depth), mats.stone);
    step.position.set(0, ((i + 1) * h) / 2, zFront - depth / 2);
    stairs.add(step);
  }
  // 垂带
  for (const sx of [-1, 1]) {
    const run = N * 0.3;
    const len = Math.hypot(run, P.height);
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, len), mats.stone);
    cheek.position.set(sx * (P.stairs.width / 2 + 0.25), P.height / 2 + 0.15, P.upper.apothem + run / 2);
    cheek.rotation.x = Math.atan2(P.height, run);
    stairs.add(cheek);
  }
  for (const m of [lower, cap1, upper, top, ...stairs.children]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  group.add(lower, cap1, upper, top, stairs);
  // 西侧踏道见照片 9518/9519；东、北两侧未拍到，按四出踏道对称补全（估算）
  for (const k of [2, 4, 6]) {
    const c = stairs.clone();
    c.rotation.y = (k * Math.PI) / 4;
    group.add(c);
  }
}

// 塔刹：比例取自照片 IMG_9448（120mm 长焦），总高按 [X] 表21 12.73 m
function spire(group, mats, rods, y0, roofTips) {
  const g = new THREE.Group();
  const add = (geo, mat, y) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const oct = (r0, r1, h) => new THREE.CylinderGeometry(r1, r0, h, 8, 1, false, Math.PI / 8);
  // 刹座：白色八角须弥座（叠涩上下收分）
  const tiers = [
    [1.75, 1.75, 0.3], [1.55, 1.45, 0.35], [1.3, 1.3, 0.5], [1.45, 1.6, 0.3], [1.7, 1.7, 0.25],
  ];
  let y = 0;
  for (const [r0, r1, h] of tiers) {
    add(oct(r0, r1, h), mats.plaster, y + h / 2);
    y += h;
  }
  // 仰莲（白灰，花瓣起伏）
  const lotusPts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    lotusPts.push(new THREE.Vector2(1.0 + 0.75 * Math.pow(t, 1.4), t * 0.75));
  }
  const lotus = new THREE.LatheGeometry(lotusPts, 64);
  const lp = lotus.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i);
    const z = lp.getZ(i);
    const a = Math.atan2(x, z);
    const bump = 1 + 0.09 * Math.pow(Math.abs(Math.cos(a * 8)), 2) * (lp.getY(i) / 0.75);
    lp.setX(i, x * bump);
    lp.setZ(i, z * bump);
  }
  lotus.computeVertexNormals();
  add(lotus, mats.plaster, y);
  y += 0.75;
  // 覆钵：铁质瓶形
  const bowl = [new THREE.Vector2(0.0, 0), new THREE.Vector2(0.75, 0)];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const r = 0.75 + 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.35)) - 0.25 * Math.max(0, t - 0.75) * 4;
    bowl.push(new THREE.Vector2(Math.max(0.5, r), 0.05 + t * 2.35));
  }
  bowl.push(new THREE.Vector2(0.0, 2.4));
  add(new THREE.LatheGeometry(bowl, 40), mats.iron, y);
  y += 2.4;
  // 相轮：带箍圆筒
  add(new THREE.CylinderGeometry(0.88, 0.92, 1.9, 32), mats.iron, y + 0.95);
  for (let i = 0; i < 5; i++) add(new THREE.TorusGeometry(0.93, 0.06, 8, 32).rotateX(Math.PI / 2), mats.iron, y + 0.1 + i * 0.42);
  add(new THREE.CylinderGeometry(0.98, 0.98, 0.12, 32), mats.iron, y + 1.9);
  const chainY = y + 1.9;
  y += 1.9;
  // 刹杆
  const shaftLen = 12.73 - y;
  add(new THREE.CylinderGeometry(0.07, 0.14, shaftLen, 12), mats.iron, y + shaftLen / 2);
  // 圆光：镂空立轮（朝东北—西南方向，见 9448）
  const halo = add(new THREE.TorusGeometry(0.85, 0.07, 8, 48), mats.iron, y + 1.25);
  halo.rotation.y = Math.PI / 4;
  halo.add(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 36), mats.iron));
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.045, 0.045), mats.iron);
    spoke.rotation.z = (i * Math.PI) / 8;
    halo.add(spoke);
  }
  // 仰月
  const moon = add(new THREE.TorusGeometry(0.34, 0.055, 8, 24, Math.PI), mats.iron, y + 2.55);
  moon.rotation.set(0, Math.PI / 4, Math.PI);
  // 宝珠
  add(new THREE.SphereGeometry(0.24, 20, 14), mats.iron, y + 3.05);
  add(new THREE.SphereGeometry(0.15, 16, 12), mats.iron, y + 3.55);
  add(new THREE.ConeGeometry(0.05, 12.73 - (y + 3.7), 8), mats.iron, y + 3.7 + (12.73 - (y + 3.7)) / 2);
  g.position.y = y0;
  group.add(g);

  // 八条铁链：相轮顶 → 屋面八角
  const top = new THREE.Vector3(0, y0 + chainY, 0);
  for (const tip of roofTips) {
    const a = top.clone().add(new THREE.Vector3(tip.x, 0, tip.z).setLength(0.9));
    const b = tip.clone().addScaledVector(new THREE.Vector3(tip.x, 0, tip.z).normalize(), -1.2);
    b.y += 0.6;
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(Math.PI * t) * 0.6;
      pts.push(p);
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.045, 5), mats.ironChain);
    tube.castShadow = true;
    group.add(tube);
  }
}

// 牌匾：贴图取自现场照片（透视校正），位置依据照片 GPS/罗盘方位判定所在面
// k: 0=南 1=东南 4=北
const PLAQUES = [
  { tex: 'wangu', where: 'L1door', k: 0, w: 3.0, h: 1.09 }, // 万古观瞻 IMG_9483（朝北拍，南门）
  { tex: 'yongzhen', where: 'fujie', k: 4, w: 3.2, h: 1.0 }, // 永镇金城 IMG_9490（朝南拍，北面）
  { tex: 'tiangong', level: 2, k: 0, w: 2.7, h: 1.0 }, // 天宫高耸 IMG_9541
  { tex: 'shijiata', level: 3, k: 0, w: 1.0, h: 2.0, vertical: true }, // 释迦塔 IMG_9541
  { tex: 'junji', level: 3, k: 1, w: 2.5, h: 0.78 }, // IMG_9541 东南面
  { tex: 'tianxia', level: 4, k: 0, w: 2.7, h: 1.0 }, // 天下奇观 IMG_9541
  { tex: 'top5', level: 5, k: 0, w: 2.6, h: 0.98 }, // 峻极神工 IMG_9541
];

function plaques(groupFor, mats, lv, ps, L1wallOuter) {
  const loader = new THREE.TextureLoader();
  for (const p of PLAQUES) {
    const map = loader.load(assetUrl(`plaques/${p.tex}.jpg`));
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    const face = new THREE.MeshStandardMaterial({ map, roughness: 0.9 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.16, p.h + 0.16, 0.1), [
      mats.wood, mats.wood, mats.wood, mats.wood, face, mats.wood,
    ]);
    // 让贴图只占正面内框
    const uv = mesh.geometry.attributes.uv;
    for (let i = 16; i < 20; i++) uv.setXY(i, uv.getX(i) < 0.5 ? -0.03 : 1.03, uv.getY(i) < 0.5 ? -0.07 : 1.07);
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    let ap;
    let y;
    if (p.where === 'L1door') {
      ap = L1wallOuter + 0.07;
      y = 5.35;
    } else if (p.where === 'fujie') {
      ap = ps.apothem + 0.38;
      y = ps.columnHeight - 0.15;
    } else {
      const L = lv[p.level - 1];
      ap = L.apothem + (p.vertical ? 0.45 : 0.3);
      y = p.vertical ? L.colTop - 0.25 : L.colTop - 0.48;
    }
    const f = FACES[p.k];
    mesh.position.copy(f.n).multiplyScalar(ap);
    mesh.position.y = y;
    mesh.rotation.y = f.th;
    if (p.vertical) mesh.rotateX(-0.12);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    groupFor(p).add(mesh);
  }
}

// 暗层内部：内外两圈柱 + 斜撑（展板 IMG_9510：“暗层则由很多斜撑组成，如同四道刚性‘箍’”）
function darkLayerFrame(boxes, rods, L, y0, y1) {
  const aIn = apothemFromSide(L.innerSide);
  const xs = columnXs(L.side);
  const h = y1 - y0;
  const P = (k, ap, x, y) => {
    const f = FACES[k];
    const p = f.n.clone().multiplyScalar(ap).addScaledVector(f.t, x);
    p.y = y;
    return p;
  };
  for (let k = 0; k < 8; k++) {
    const ao = L.apothem - 0.45;
    // 外圈：每间一对交叉斜撑 + 上下枋
    for (let b = 0; b < 3; b++) {
      const xa = (xs[b] * ao) / L.apothem;
      const xb = (xs[b + 1] * ao) / L.apothem;
      boxes.beam('wood', P(k, ao, xa, y0 + 0.2), P(k, ao, xb, y1 - 0.2), 0.2, 0.26, 0.85);
      boxes.beam('wood', P(k, ao, xb, y0 + 0.2), P(k, ao, xa, y1 - 0.2), 0.2, 0.26, 0.85);
    }
    const fo = Frame.onFace(k, ao, 0, 0);
    boxes.box('wood', fo, 0, y0 + 0.12, 0, 2 * ao * T8, 0.24, 0.3, 0, 0, 0, 0.8);
    boxes.box('wood', fo, 0, y1 - 0.12, 0, 2 * ao * T8, 0.24, 0.3, 0, 0, 0, 0.8);
    // 内圈：一间一对斜撑
    const xi = aIn * T8;
    boxes.beam('wood', P(k, aIn, -xi, y0 + 0.2), P(k, aIn, xi, y1 - 0.2), 0.2, 0.26, 0.8);
    boxes.beam('wood', P(k, aIn, xi, y0 + 0.2), P(k, aIn, -xi, y1 - 0.2), 0.2, 0.26, 0.8);
    // 内外槽之间的角部拉结斜撑
    const c = cornerDir(k);
    const po = c.clone().multiplyScalar(ao / C8);
    const pi = c.clone().multiplyScalar(aIn / C8);
    boxes.beam('wood', new THREE.Vector3(pi.x, y0 + 0.2, pi.z), new THREE.Vector3(po.x, y1 - 0.2, po.z), 0.2, 0.26, 0.8);
    // 柱
    rods.rod('column', new THREE.Vector3(po.x, y0, po.z), new THREE.Vector3(po.x, y1, po.z), 0.24);
    rods.rod('column', new THREE.Vector3(pi.x, y0, pi.z), new THREE.Vector3(pi.x, y1, pi.z), 0.26);
    for (const x of [xs[1], xs[2]]) {
      const q = P(k, ao, (x * ao) / L.apothem, 0);
      rods.rod('column', new THREE.Vector3(q.x, y0, q.z), new THREE.Vector3(q.x, y1, q.z), 0.22);
    }
  }
  // 暗层楼板（从外面看不到，拆解时可见）
  return octagonRing(L.apothem - 0.3, 0, y0 + 0.05, 0.12);
}

const CN = ['一', '二', '三', '四', '五'];

export function buildPagoda(mats, s = SPEC) {
  const root = new THREE.Group();
  root.name = 'pagoda';
  platform(root, mats, s);

  const tower = new THREE.Group();
  tower.position.y = s.platform.height;
  root.add(tower);

  const lv = deriveLevels(s);
  const info = { levels: lv, roofs: [], layers: [] };

  // 结构层：明五暗四 + 塔刹，各自独立，可拆解
  const layers = [];
  const mkLayer = (name, kind, y0) => {
    const L = {
      name,
      kind,
      y0,
      y1: y0,
      group: new THREE.Group(),
      boxes: new BoxBatch(),
      rods: new RodBatch(),
      roofBoxes: new BoxBatch(),
      roofRods: new RodBatch(),
      railings: new BoxBatch(),
      wall: new BoxBatch(),
      frontWall: new BoxBatch(),
      panels: [],
      innerOccluder: null,
      ceil: null,
      fuJie: null,
      light: null,
    };
    L.group.name = name;
    layers.push(L);
    tower.add(L.group);
    return L;
  };

  const FRONT_FACES = new Set([0, 1, 7]); // 南、东南、西南三面（用于南向剖切透视）

  // ---------- 一层（明层）：外槽墙 + 内槽柱网 + 副阶 ----------
  const L1 = lv[0];
  const ps = s.peristyle;
  const ly1 = mkLayer('L1 · Bright Floor', 'bright', 0);
  wallRing(ly1.frontWall, 'redwall', L1.apothem + 0.15, 1.2, 0, L1.colTop, [0, 4], { w: 2.6, h: 4.6 }, (k) => FRONT_FACES.has(k));
  wallRing(ly1.wall, 'redwall', L1.apothem + 0.15, 1.2, 0, L1.colTop, [0, 4], { w: 2.6, h: 4.6 }, (k) => !FRONT_FACES.has(k));
  // 正常外观时南门/北门内的暗面遮挡（剖切或透视时隐藏）
  const l1Occ = new THREE.Mesh(
    new THREE.CylinderGeometry((L1.apothem - 1.1) / C8, (L1.apothem - 1.1) / C8, L1.colTop - 0.2, 8, 1, true, Math.PI / 8),
    mats.interior,
  );
  l1Occ.position.y = L1.colTop / 2;
  l1Occ.userData.keep = true;
  ly1.group.add(l1Occ);
  ly1.innerOccluder = l1Occ;

  columnRing(ly1.rods, L1.apothem + 0.05, L1.side, 0, L1.colTop, 0.32);
  brightInnerStructure(ly1.boxes, ly1.rods, ly1.group, mats, L1, 0, L1.colTop, 0);
  columnRing(ly1.rods, ps.apothem, ps.side, 0, ps.columnHeight, 0.28);
  bracketRing(ly1.boxes, {
    apothem: ps.apothem, side: ps.side, y: ps.columnHeight,
    height: ps.bracket.height, projection: ps.bracket.projection, steps: 2, xie: false,
  });
  const fuJie = buildRoof(
    {
      aOut: ps.apothem + ps.eave.overhang, aIn: L1.apothem + 0.15,
      aLia: ps.apothem + ps.bracket.projection, yLia: ps.columnHeight + ps.bracket.height,
      yTop: ps.roofTopHeight, sA: 0.3,
      lift: ps.eave.cornerLift, extra: ps.eave.cornerExtra, ridgeTop: true,
    },
    mats, ly1.roofBoxes, ly1.roofRods,
  );
  ly1.group.add(fuJie.group);
  ly1.fuJie = fuJie.group;
  info.roofs.push({ name: 'Peristyle', yEave: fuJie.yEave });

  // ---------- 逐层 ----------
  let prevRoofTop = ps.roofTopHeight;
  let topTips = [];
  const brightOf = [ly1];
  lv.forEach((L, i) => {
    const steps = STEPS[L.bracket.type];
    const ang = L.bracket.type === '七铺作';
    let ly = ly1;

    if (i > 0) {
      // 暗层：外墙（拆解时隐藏）、内部斜撑、平坐铺作 + 平坐 + 栏杆
      const dk = mkLayer(`Dark Ring ${i}`, 'dark', L.darkBase);
      dk.y1 = L.floorY;
      wallRing(dk.wall, 'woodDark', L.apothem, 0.5, prevRoofTop - 0.6, L.balconyBase + 0.2);
      const floor = new THREE.Mesh(darkLayerFrame(dk.boxes, dk.rods, L, L.darkBase, L.balconyBase), mats.woodDark);
      floor.receiveShadow = true;
      dk.group.add(floor);
      bracketRing(dk.boxes, {
        apothem: L.apothem, side: L.side, y: L.balconyBase,
        height: L.balconyBracket, projection: L.balconyOut - 0.25,
        steps: L.balconyBracket > 1.5 ? 3 : 2, xie: true, key: 'wood',
      });
      const slab = new THREE.Mesh(octagonRing(L.apothem + L.balconyOut, L.apothem - 0.9, L.floorY, 0.24), mats.wood);
      slab.castShadow = slab.receiveShadow = true;
      dk.group.add(slab);
      railing(dk.railings, L.apothem + L.balconyOut - 0.12, L.floorY, dk.frontWall);

      // 明层：外槽柱、内槽柱、佛坛、隔扇
      ly = mkLayer(`L${i + 1} · Bright Floor`, 'bright', L.floorY);
      brightOf.push(ly);
      columnRing(ly.rods, L.apothem, L.side, L.floorY, L.colTop, 0.26);
      brightInnerStructure(ly.boxes, ly.rods, ly.group, mats, L, L.floorY, L.colTop, i);
      const bp = bayPanels(ly.group, mats, L.apothem, L.side, L.floorY, L.colTop - 0.45);
      ly.panels = bp.panels;
      ly.innerOccluder = bp.inner;
    }

    // 室内暖光灯（用于礼佛剖切或暮色模式照亮塔内佛坛与内槽）
    const light = new THREE.PointLight(0xffcf80, 0, 20, 1.3);
    light.position.set(0, (i === 0 ? 0 : L.floorY) + 4.2, 2.8);
    ly.group.add(light);
    ly.light = light;

    // 檐下铺作
    bracketRing(ly.boxes, {
      apothem: L.apothem, side: L.side, y: L.colTop,
      height: L.bracket.height, projection: L.bracket.projection, steps, ang, xie: false,
    });

    const yLia = L.colTop + L.bracket.height;
    const isTop = i === lv.length - 1;
    const roof = buildRoof(
      isTop
        ? {
            aOut: L.apothem + L.eave.overhang, aIn: 1.3,
            aLia: L.apothem + L.bracket.projection, yLia,
            yTop: yLia + s.topRoof.rise, sA: 0.3,
            lift: L.eave.cornerLift, extra: L.eave.cornerExtra, ridgeTop: false,
          }
        : {
            aOut: L.apothem + L.eave.overhang, aIn: lv[i + 1].apothem,
            aLia: L.apothem + L.bracket.projection, yLia,
            yTop: yLia + 0.4 + s.waistRoofRise, sA: 0.32,
            lift: L.eave.cornerLift, extra: L.eave.cornerExtra, ridgeTop: true,
          },
      mats, ly.roofBoxes, ly.roofRods,
    );
    roof.group.traverse((o) => {
      if (o.isMesh) o.userData.keep = true;
    });
    ly.group.add(roof.group);
    ly.roofGroup = roof.group;
    if (!isTop) {
      // 明层顶板（平时藏在腰檐内，拆解时封住空心）
      const ceil = new THREE.Mesh(octagonRing(lv[i + 1].apothem + 0.2, 0, yLia + 0.3, 0.15), mats.woodDark);
      ceil.receiveShadow = true;
      ceil.userData.keep = true;
      ly.group.add(ceil);
      ly.ceil = ceil;
    }
    info.roofs.push({ name: `L${L.level} Eave`, yEave: roof.yEave });
    prevRoofTop = isTop ? 0 : yLia + 0.4 + s.waistRoofRise;
    ly.y1 = isTop ? yLia + s.topRoof.rise : prevRoofTop;
    if (isTop) {
      topTips = roof.cornerTips;
      info.spireBase = yLia + s.topRoof.rise;
    }
  });

  const sp = mkLayer('Iron Spire', 'spire', info.spireBase);
  sp.y1 = info.spireBase + 12.73;
  spire(sp.group, mats, sp.rods, info.spireBase, topTips);
  const plaquesGroup = [];
  plaques((p) => {
    const g = p.level ? brightOf[p.level - 1].group : ly1.group;
    return {
      add(m) {
        m.userData.keep = true;
        m.userData.plaque = p;
        plaquesGroup.push(m);
        g.add(m);
      },
    };
  }, mats, lv, ps, L1.apothem + 0.15);

  // 台基（台阶等）合并
  const plat = new THREE.Group();
  for (const c of root.children.filter((c) => c !== tower)) plat.add(c);
  root.add(plat);
  info.merge = { platform: mergeStatic(plat) };

  for (const L of layers) {
    if (L.fuJie) {
      L.fuJie.traverse((o) => {
        if (o.isMesh) o.userData.keep = true;
      });
    }
    info.merge[L.name] = mergeStatic(L.group);
    const frameBoxes = L.boxes.build(mats);
    const frameRods = L.rods.build(mats);
    frameBoxes.userData.coreStructure = true;
    frameRods.userData.coreStructure = true;
    L.group.add(frameBoxes, frameRods);
    const roofDetails = new THREE.Group();
    roofDetails.add(L.roofBoxes.build(mats), L.roofRods.build(mats));
    L.group.add(roofDetails, L.railings.build(mats));
    const w = L.wall.build(mats);
    w.userData.darkWall = true;
    L.group.add(w);
    const fw = L.frontWall.build(mats);
    L.group.add(fw);
    info.layers.push({
      name: L.name,
      kind: L.kind,
      y0: L.y0 + s.platform.height,
      y1: L.y1 + s.platform.height,
      group: L.group,
      wall: w,
      frontWall: fw,
      panels: L.panels,
      innerOccluder: L.innerOccluder,
      ceil: L.ceil,
      fuJie: L.fuJie,
      roofGroup: L.roofGroup,
      roofDetails,
      light: L.light,
    });
  }

  info.brightLayers = info.layers.filter((l) => l.kind === 'bright');
  info.darkLayers = info.layers.filter((l) => l.kind === 'dark');
  info.plaques = plaquesGroup;
  info.cutawayState = { floor: null, xray: false, nightGlow: 0 };
  // Restore each object's own visibility before applying the next viewing mode.
  const coreHidden = new Map();

  // 控制剖切透视（逐层看佛像）与骨架X光模式（看内外双槽柱网与暗层斜撑）
  info.setCutaway = (opts = {}) => {
    for (const [object, visible] of coreHidden) object.visible = visible;
    coreHidden.clear();
    Object.assign(info.cutawayState, opts);
    const { floor, xray, nightGlow, section } = info.cutawayState;
    info.brightLayers.forEach((bL, idx) => {
      const lvNum = idx + 1;
      const isTargetFloor = floor === lvNum;
      const openFront = xray || isTargetFloor;
      if (bL.innerOccluder) bL.innerOccluder.visible = !openFront && !section && nightGlow < 0.5;
      if (bL.frontWall) bL.frontWall.visible = !openFront;
      if (lvNum === 1 && bL.wall) bL.wall.visible = !xray;
      if (lvNum === 1 && bL.fuJie) bL.fuJie.visible = !isTargetFloor;
      if (bL.roofGroup) bL.roofGroup.visible = !isTargetFloor;
      if (bL.roofDetails) bL.roofDetails.visible = !isTargetFloor;
      if (bL.ceil) bL.ceil.visible = !isTargetFloor && !xray;
      for (const p of bL.panels) {
        if (xray) p.visible = false;
        else if (isTargetFloor) p.visible = !FRONT_FACES.has(p.userData.face);
        else p.visible = true;
      }
      bL.group.traverse((o) => {
        if (o.userData.innerMural || o.name === 'octagonalCaisson') {
          o.visible = !xray;
        }
      });
      if (bL.light) {
        bL.light.intensity = section || isTargetFloor ? 26 : xray ? 8 : nightGlow * 12;
      }
    });
    // 二~五层平坐南向栏杆在对应楼层剖切时同步敞开，避免遮挡佛坛与骑乘造像下部
    info.darkLayers.forEach((dL, idx) => {
      const upperFloorNum = idx + 2;
      if (dL.frontWall) dL.frontWall.visible = floor !== upperFloorNum;
      if (idx === 0) {
        // 一层大佛高达 10.32m，伸入暗层一藻井，看一层佛像时同步隐藏暗层一底板遮挡
        dL.group.traverse((o) => {
          if (o.isMesh && !o.isInstancedMesh && o !== dL.wall && o !== dL.frontWall) {
            o.visible = floor !== 1;
          }
        });
      }
    });
    // 南向一层的万古观瞻匾在南墙剖开时同步隐藏，避免悬空
    for (const pm of plaquesGroup) {
      if (pm.userData.plaque.where === 'L1door') pm.visible = !xray && floor !== 1;
      else if (pm.userData.plaque.level) pm.visible = !xray && floor !== pm.userData.plaque.level;
    }
    if (xray) {
      for (const layer of info.layers) {
        for (const object of layer.group.children) {
          if (layer.kind !== 'spire' && (object.userData.coreStructure || object.isLight)) {
            object.traverse(part => {
              if (part.name === 'boxes:plaster' || part.name === 'boxes:woodDark') {
                coreHidden.set(part, part.visible);
                part.visible = false;
              }
            });
            continue;
          }
          coreHidden.set(object, object.visible);
          object.visible = false;
        }
      }
    }
  };

  info.height = s.platform.height + info.spireBase + 12.73;
  return { root, info, tower };
}
