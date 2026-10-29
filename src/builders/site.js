import * as THREE from 'three';
import { BoxBatch, RodBatch, Frame, UP, rng, mergeStatic, mergeInstances } from '../lib/kit.js';

// 佛宫寺周边环境（坐北朝南，前塔后殿）
// 依据：梁思成 1933《山西应县佛宫寺辽释迦木塔》——山门五间；门内东西为钟楼、鼓楼；其北东西配殿各三间；
//       塔北高台，券桥相连，台上正殿七间（大雄宝殿），殿前东西配殿。占地约 2.5 万 m²。
// 各建筑间距无公开测绘，以下坐标均为估算（est），并保证与照片 9519（塔西 68 m 开阔广场）不冲突。
// 坐标：x 东，z 南，原点为塔心地面。
export const SITE = {
  wall: { x: 76, zN: -112, zS: 74, height: 4.2, thick: 1.2 },
  gate: { z: 74, bays: 5, w: 22, d: 10, eave: 6.2, rise: 5.2 }, // 山门
  bellDrum: { x: 38, z: 55, size: 9, base: 4.2, upper: 3.6 }, // 东钟楼、西鼓楼（照片 9541 机位 (21,60) 视野开阔 → 不能在塔正前方）
  sideHalls: { x: 33, z: 25, w: 13, d: 8, eave: 5.0, rise: 4.0 }, // 塔前东西配殿
  terrace: { zFront: -40, zBack: -104, halfW: 42, height: 3.3, bridgeW: 8 }, // 塔北高台
  mainHall: { z: -74, bays: 7, w: 31, d: 17, eave: 7.6, rise: 7.2 }, // 大雄宝殿
  rearSideHalls: { x: 27, z: -52, w: 12, d: 8, eave: 5.0, rise: 4.0 },
};

// ---------- 歇山顶（高度场网格：下部四坡 + 上部两坡，二者高差即山花面）----------
function xieshanRoof(hx, hz, yEave, rise, mats, skirt = 0.42) {
  const nx = 64;
  const nz = 32;
  const dG = hz * skirt; // 下檐四坡的水平进深
  const H = (d, dmax) => rise * Math.pow(Math.min(1, d / dmax), 1.35);
  const height = (x, z) => {
    const dx = hx - Math.abs(x);
    const dz = hz - Math.abs(z);
    const m = Math.min(dx, dz);
    let y = m < dG ? H(m, hz) : H(dz, hz);
    // 角部起翘
    const cx = 1 - Math.min(1, dx / (hx * 0.35));
    const cz = 1 - Math.min(1, dz / (hz * 0.5));
    y += 0.55 * Math.pow(cx * cz, 2);
    return yEave + y;
  };
  const pos = [];
  const uv = [];
  const idx = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = -hx + (2 * hx * i) / nx;
      const z = -hz + (2 * hz * j) / nz;
      pos.push(x, height(x, z), z);
      uv.push(x, z);
    }
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const roof = new THREE.Mesh(g, mats.tileBed);
  roof.castShadow = roof.receiveShadow = true;
  const group = new THREE.Group();
  group.add(roof);
  // 望板底 + 正脊 + 鸱吻
  const soffit = new THREE.Mesh(new THREE.BoxGeometry(hx * 2 - 0.2, 0.15, hz * 2 - 0.2), mats.soffit);
  soffit.position.y = yEave - 0.25;
  const ridgeY = yEave + rise;
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(2 * (hx - dG) + 0.4, 0.55, 0.5), mats.ridge);
  ridge.position.y = ridgeY + 0.2;
  group.add(soffit, ridge);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.7), mats.ridge);
    w.position.set(s * (hx - dG + 0.2), ridgeY + 0.6, 0);
    group.add(w);
  }
  for (const m of group.children) m.castShadow = m.receiveShadow = true;
  return group;
}

// ---------- 殿宇：台基、柱网、墙门、铺作带、歇山顶 ----------
// 建在局部坐标中（正面朝 +z），再整体旋转/平移
function hall(o, mats) {
  const g = new THREE.Group();
  const boxes = new BoxBatch();
  const rods = new RodBatch();
  const { w, d, eave, rise } = o;
  const base = o.base ?? 0.9;
  const hx = w / 2;
  const hz = d / 2;
  boxes.box('stone', null, 0, base / 2, 0, w + 3, base, d + 3);
  const colH = eave - base - 1.0;
  const bays = o.bays ?? 3;
  const bw = w / bays;
  // 前后檐柱 + 山面柱
  for (let i = 0; i <= bays; i++) {
    const x = -hx + i * bw;
    for (const z of [-hz, hz]) rods.rod('column', new THREE.Vector3(x, base, z), new THREE.Vector3(x, base + colH, z), 0.28);
  }
  for (const x of [-hx, hx]) rods.rod('column', new THREE.Vector3(x, base, 0), new THREE.Vector3(x, base + colH, 0), 0.28);
  // 后墙、山墙（红墙）
  const wallH = colH;
  boxes.box('redwall', null, 0, base + wallH / 2, -hz + 0.1, w, wallH, 0.7);
  for (const s of [-1, 1]) boxes.box('redwall', null, s * (hx - 0.1), base + wallH / 2, 0, 0.7, wallH, d);
  // 正面：中间各间格子门，两梢间槛窗
  const front = new THREE.Group();
  for (let i = 0; i < bays; i++) {
    const x = -hx + (i + 0.5) * bw;
    const isDoor = Math.abs(i - (bays - 1) / 2) <= (bays >= 5 ? 1 : 0);
    const h = wallH - 0.5;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.6, h), isDoor ? mats.door : mats.window);
    p.position.set(x, base + h / 2, hz - 0.15);
    front.add(p);
  }
  const inner = new THREE.Mesh(new THREE.BoxGeometry(w - 1, wallH, d - 1.4), mats.interior);
  inner.position.y = base + wallH / 2;
  g.add(front, inner);
  // 阑额 + 铺作带（简化斗块）
  const yb = base + colH;
  for (const z of [-hz, hz]) boxes.box('wood', null, 0, yb + 0.15, z, w + 0.6, 0.3, 0.4, 0, 0, 0, 0.9);
  for (const x of [-hx, hx]) boxes.box('wood', null, x, yb + 0.15, 0, 0.4, 0.3, d + 0.6, 0, 0, 0, 0.9);
  const step = bw / 2;
  for (let x = -hx; x <= hx + 1e-6; x += step)
    for (const z of [-hz, hz]) {
      const f = new Frame(new THREE.Vector3(x, yb + 0.3, z), new THREE.Vector3(1, 0, 0), UP, new THREE.Vector3(0, 0, Math.sign(z)));
      boxes.box('wood', f, 0, 0.18, 0, 0.45, 0.36, 0.45);
      boxes.box('wood', f, 0, 0.5, 0.25, 0.16, 0.28, 1.1);
      boxes.box('wood', f, 0, 0.72, 0.6, 1.0, 0.2, 0.16);
    }
  boxes.box('plaster', null, 0, yb + 0.6, hz - 0.05, w, 0.6, 0.1);
  boxes.box('plaster', null, 0, yb + 0.6, -hz + 0.05, w, 0.6, 0.1);
  g.add(xieshanRoof(hx + 1.8, hz + 1.8, eave, rise, mats));
  g.add(boxes.build(mats), rods.build(mats));
  g.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
  g.rotation.y = o.rotY ?? 0;
  return g;
}

// ---------- 钟楼 / 鼓楼：砖砌下层 + 木构上层 + 歇山顶 ----------
function bellTower(o, mats) {
  const g = new THREE.Group();
  const s = o.size;
  const lower = new THREE.Mesh(new THREE.BoxGeometry(s, o.base, s), mats.brick);
  lower.position.y = o.base / 2;
  const arch = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, s + 0.1), mats.interior);
  arch.position.y = 1.4;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(s + 0.4, 0.25, s + 0.4), mats.stone);
  cap.position.y = o.base;
  g.add(lower, arch, cap);
  const up = hall({ w: s - 2.2, d: s - 2.2, eave: o.upper + 0.9, rise: 3.0, bays: 3, base: 0.3 }, mats);
  up.position.y = o.base;
  g.add(up);
  for (const m of [lower, arch, cap]) m.castShadow = m.receiveShadow = true;
  g.position.set(o.x, 0, o.z);
  return g;
}

// ---------- 树：程序化枝干 + 叶片卡（实例化）----------
function leafTexture(kind) {
  const W = 256;
  const c = document.createElement('canvas');
  c.width = c.height = W;
  const ctx = c.getContext('2d');
  const r = rng(kind === 'pine' ? 5 : 6);
  const n = kind === 'pine' ? 260 : 110;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * W * 0.42;
    const x = W / 2 + Math.cos(a) * rad;
    const y = W / 2 + Math.sin(a) * rad;
    const g = 70 + r() * 70;
    ctx.fillStyle = kind === 'pine' ? `rgb(${g * 0.35},${g * 0.75},${g * 0.4})` : `rgb(${g * 0.55},${g},${g * 0.35})`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r() * Math.PI);
    ctx.beginPath();
    if (kind === 'pine') ctx.ellipse(0, 0, 14, 2.2, 0, 0, Math.PI * 2);
    else ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const TREES = [
  // [x, z, 高度, 种类]  种类：huai 槐（圆冠） / pine 松柏（深绿）
  [-60, -13, 15, 'huai'], [-48, 38, 13, 'huai'], [-58, 58, 12, 'huai'], [-38, -40, 11, 'pine'],
  [47, -14, 14, 'huai'], [55, 22, 12, 'huai'], [50, 52, 13, 'huai'], [38, -38, 11, 'pine'],
  [5, 50, 9, 'huai'], [-14, 48, 11, 'huai'], [26, -27, 13, 'pine'], [-24, -26, 12, 'pine'], // [5,50] 见照片 9541 左下角
  [-12, 62, 10, 'huai'], [12, 62, 10, 'huai'], [-40, 66, 11, 'huai'], [40, 66, 11, 'huai'],
  [-34, -66, 12, 'pine'], [34, -66, 12, 'pine'], [-52, -96, 14, 'huai'], [52, -96, 14, 'huai'],
  [-66, -60, 13, 'huai'], [66, -60, 13, 'huai'], [-66, 8, 14, 'huai'], [68, -32, 12, 'huai'],
];

function trees(mats, list = TREES) {
  const group = new THREE.Group();
  const rods = new RodBatch();
  const cards = { huai: [], pine: [] };
  const r = rng(99);
  const v = new THREE.Vector3();
  const T = SITE.terrace;
  for (const [x, z0, h, kind] of list) {
    const z = z0;
    const y0 = Math.abs(x) < T.halfW && z < T.zFront && z > T.zBack ? T.height : 0; // 高台上的树
    const trunkH = kind === 'pine' ? h * 0.35 : h * 0.42;
    const lean = new THREE.Vector3((r() - 0.5) * 0.8, 0, (r() - 0.5) * 0.8);
    const top = new THREE.Vector3(x, y0 + trunkH, z).add(lean);
    rods.rod('bark', new THREE.Vector3(x, y0, z), top, kind === 'pine' ? 0.35 : 0.42);
    // 主枝
    const nb = kind === 'pine' ? 5 : 6;
    const tips = [];
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * Math.PI * 2 + r();
      const up = kind === 'pine' ? 0.35 + (i / nb) * 0.55 : 0.5 + r() * 0.35;
      const len = kind === 'pine' ? h * (0.45 - 0.2 * (i / nb)) : h * (0.32 + r() * 0.12);
      const dir = v.set(Math.cos(a), up * 1.4, Math.sin(a)).normalize();
      const start = top.clone().add(new THREE.Vector3(0, kind === 'pine' ? (i / nb) * h * 0.4 : 0, 0));
      const end = start.clone().addScaledVector(dir, len);
      rods.rod('bark', start, end, 0.16);
      tips.push(end);
    }
    if (kind === 'pine') tips.push(new THREE.Vector3(x, y0 + h, z).add(lean));
    // 叶团
    const crownR = kind === 'pine' ? h * 0.22 : h * 0.3;
    const clusters = kind === 'pine' ? 26 : 34;
    for (let c = 0; c < clusters; c++) {
      const base = tips[c % tips.length];
      const center = base.clone().add(new THREE.Vector3((r() - 0.5) * crownR, (r() - 0.3) * crownR * 0.8, (r() - 0.5) * crownR));
      const n = kind === 'pine' ? 9 : 12;
      for (let k = 0; k < n; k++) {
        const p = center.clone().add(new THREE.Vector3((r() - 0.5) * 2.2, (r() - 0.5) * 1.6, (r() - 0.5) * 2.2));
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * Math.PI, r() * Math.PI, r() * Math.PI));
        const s = (kind === 'pine' ? 1.9 : 2.3) * (0.7 + r() * 0.6);
        cards[kind].push({ m: new THREE.Matrix4().compose(p, q, new THREE.Vector3(s, s, s)), t: 0.75 + r() * 0.5 });
      }
    }
  }
  const plane = new THREE.PlaneGeometry(1, 1);
  const col = new THREE.Color();
  for (const kind of ['huai', 'pine']) {
    const mat = new THREE.MeshStandardMaterial({ map: leafTexture(kind), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
    const list2 = cards[kind];
    const mesh = new THREE.InstancedMesh(plane, mat, list2.length);
    list2.forEach((c, i) => {
      mesh.setMatrixAt(i, c.m);
      mesh.setColorAt(i, col.setRGB(c.t, c.t, c.t * 0.95));
    });
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  group.add(rods.build(mats, 7));
  return group;
}

// ---------- 院墙 ----------
function walls(mats, w) {
  const boxes = new BoxBatch();
  const seg = (x0, z0, x1, z1, gapCenter = null, gapW = 0) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const dir = new THREE.Vector3(x1 - x0, 0, z1 - z0).normalize();
    const parts = gapCenter === null ? [[0, len]] : [[0, gapCenter - gapW / 2], [gapCenter + gapW / 2, len]];
    for (const [a, b] of parts) {
      const mid = new THREE.Vector3(x0, 0, z0).addScaledVector(dir, (a + b) / 2);
      const f = new Frame(mid, dir, UP, new THREE.Vector3(-dir.z, 0, dir.x));
      boxes.box('redwall', f, 0, w.height / 2, 0, b - a, w.height, w.thick);
      boxes.box('ridge', f, 0, w.height + 0.2, 0, b - a + 0.3, 0.4, w.thick + 0.7);
      boxes.box('stone', f, 0, 0.3, 0, b - a + 0.1, 0.6, w.thick + 0.15);
    }
  };
  seg(-w.x, w.zS, w.x, w.zS, w.x, 24); // 南墙（山门处留口）
  seg(-w.x, w.zN, w.x, w.zN);
  seg(-w.x, w.zN, -w.x, w.zS);
  seg(w.x, w.zN, w.x, w.zS);
  return boxes.build(mats);
}

// ---------- 远处城区：实例化民居（坡顶小房）----------
function town(mats) {
  const group = new THREE.Group();
  const r = rng(7);
  const body = [];
  const roofs = [];
  for (let i = 0; i < 2600; i++) {
    const a = r() * Math.PI * 2;
    const d = 100 + Math.pow(r(), 0.8) * 650;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (Math.abs(x) < 85 && z > -120 && z < 82) continue;
    const w = 7 + r() * 9;
    const dp = 5 + r() * 5;
    const h = 3.0 + r() * (r() < 0.06 ? 12 : 1.8);
    const rot = Math.round(r() * 4) * (Math.PI / 2) + (r() - 0.5) * 0.1;
    const q = new THREE.Quaternion().setFromAxisAngle(UP, rot);
    body.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(w, h, dp)));
    roofs.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h, z), q, new THREE.Vector3(w + 0.8, 1.6 + r(), dp + 0.8)));
  }
  const prism = new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1);
  prism.rotateZ(Math.PI / 2); // 轴向 → x（屋脊方向）
  prism.rotateX(-Math.PI / 2); // 三角形尖端朝上
  prism.translate(0, 0.25, 0);
  prism.scale(1, 1.33, 1.15);
  const bm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mats.townWall, body.length);
  const rm = new THREE.InstancedMesh(prism, mats.townRoof, roofs.length);
  body.forEach((m, i) => bm.setMatrixAt(i, m));
  roofs.forEach((m, i) => rm.setMatrixAt(i, m));
  for (const m of [bm, rm]) {
    m.receiveShadow = true;
    m.computeBoundingSphere();
    group.add(m);
  }
  return group;
}

export function buildSite(mats) {
  const S = SITE;
  const root = new THREE.Group();
  root.name = 'site';
  // 院内铺地 + 院外土地
  const court = new THREE.Mesh(new THREE.PlaneGeometry(S.wall.x * 2, S.wall.zS - S.wall.zN), mats.court);
  court.rotation.x = -Math.PI / 2;
  court.position.set(0, 0.02, (S.wall.zS + S.wall.zN) / 2);
  court.receiveShadow = true;
  root.add(court);

  root.add(walls(mats, S.wall));
  root.add(hall({ ...S.gate, x: 0, z: S.gate.z }, mats));
  for (const s of [-1, 1]) {
    root.add(bellTower({ ...S.bellDrum, x: s * S.bellDrum.x }, mats));
    root.add(hall({ ...S.sideHalls, x: s * S.sideHalls.x, z: S.sideHalls.z, rotY: -s * Math.PI / 2 }, mats));
  }
  // 北侧高台 + 券桥
  const T = S.terrace;
  const tz = (T.zFront + T.zBack) / 2;
  const terr = new THREE.Mesh(new THREE.BoxGeometry(T.halfW * 2, T.height, T.zFront - T.zBack), mats.brick);
  terr.position.set(0, T.height / 2, tz);
  const terrTop = new THREE.Mesh(new THREE.BoxGeometry(T.halfW * 2 + 0.4, 0.2, T.zFront - T.zBack + 0.4), mats.stone);
  terrTop.position.set(0, T.height, tz);
  const bridgeLen = T.zFront - -20.5;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(T.bridgeW, T.height, -bridgeLen), mats.brick);
  bridge.position.set(0, T.height / 2, (T.zFront + -20.5) / 2);
  const archHole = new THREE.Mesh(new THREE.BoxGeometry(T.bridgeW + 0.1, 2.2, 3.2), mats.interior);
  archHole.position.set(0, 1.1, (T.zFront + -20.5) / 2);
  for (const m of [terr, terrTop, bridge, archHole]) {
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  }
  root.add(hall({ ...S.mainHall, x: 0, y: T.height, z: S.mainHall.z, base: 1.4 }, mats));
  for (const s of [-1, 1]) root.add(hall({ ...S.rearSideHalls, x: s * S.rearSideHalls.x, y: T.height, z: S.rearSideHalls.z, rotY: -s * Math.PI / 2 }, mats));

  mergeStatic(root);
  mergeInstances(root);
  root.add(trees(mats));
  root.add(town(mats));
  return root;
}
