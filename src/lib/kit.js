import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const T8 = Math.tan(Math.PI / 8); // tan 22.5°
export const C8 = Math.cos(Math.PI / 8);
export const UP = new THREE.Vector3(0, 1, 0);

// 八边形第 k 个面（k=0 朝南 +z，逆时针俯视为 +k 方向）
// n: 面外法线；t: 沿面方向（u=+1 端即与 k+1 面相交的角）
export function faceFrame(k) {
  const th = (k * Math.PI) / 4;
  return {
    k,
    th,
    n: new THREE.Vector3(Math.sin(th), 0, Math.cos(th)),
    t: new THREE.Vector3(Math.cos(th), 0, -Math.sin(th)),
  };
}

// 第 k 个角（面 k 与面 k+1 之间）的径向单位向量
export function cornerDir(k) {
  const a = (k * Math.PI) / 4 + Math.PI / 8;
  return new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
}

export const FACES = Array.from({ length: 8 }, (_, k) => faceFrame(k));

// 局部坐标系：x 轴、y 轴、z 轴（单位向量）+ 原点
export class Frame {
  constructor(origin, x, y, z) {
    this.m = new THREE.Matrix4().makeBasis(x, y, z).setPosition(origin);
  }
  static onFace(k, apothem, xAlong, y) {
    const f = FACES[k];
    const o = f.n.clone().multiplyScalar(apothem).addScaledVector(f.t, xAlong);
    o.y = y;
    return new Frame(o, f.t, UP, f.n);
  }
  static atCorner(k, apothem, y) {
    const d = cornerDir(k);
    const o = d.clone().multiplyScalar(apothem / C8);
    o.y = y;
    const x = new THREE.Vector3(d.z, 0, -d.x);
    return new Frame(o, x, UP, d);
  }
  static radial(dir, radius, y) {
    const o = dir.clone().multiplyScalar(radius);
    o.y = y;
    return new Frame(o, new THREE.Vector3(dir.z, 0, -dir.x), UP, dir);
  }
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// 将大量长方体合并为 InstancedMesh（按材质分组）
export class BoxBatch {
  constructor() {
    this.groups = new Map();
  }
  _g(key) {
    if (!this.groups.has(key)) this.groups.set(key, { mats: [], colors: [] });
    return this.groups.get(key);
  }
  // 在 frame 局部坐标中放置盒子：中心 (cx,cy,cz)，尺寸 (sx,sy,sz)，可选欧拉旋转（局部）
  box(key, frame, cx, cy, cz, sx, sy, sz, rx = 0, ry = 0, rz = 0, tint = 1) {
    _p.set(cx, cy, cz);
    _e.set(rx, ry, rz);
    _q.setFromEuler(_e);
    _s.set(sx, sy, sz);
    const local = _m.compose(_p, _q, _s);
    const world = frame ? frame.m.clone().multiply(local) : local.clone();
    const g = this._g(key);
    g.mats.push(world);
    g.colors.push(tint);
  }
  // 世界坐标中两点之间的杆件（截面 w×h，h 方向尽量朝上）
  beam(key, a, b, w, h, tint = 1) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    dir.normalize();
    let side = new THREE.Vector3().crossVectors(UP, dir);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    const up = new THREE.Vector3().crossVectors(dir, side).normalize();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const frame = new Frame(mid, side, up, dir);
    this.box(key, frame, 0, 0, 0, w, h, len, 0, 0, 0, tint);
  }
  build(materials, geometry = new THREE.BoxGeometry(1, 1, 1)) {
    const root = new THREE.Group();
    const c = new THREE.Color();
    for (const [key, g] of this.groups) {
      const mesh = new THREE.InstancedMesh(geometry, materials[key], g.mats.length);
      g.mats.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        const t = g.colors[i];
        mesh.setColorAt(i, c.setRGB(t, t, t));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `boxes:${key}`;
      mesh.computeBoundingSphere();
      root.add(mesh);
    }
    return root;
  }
}

// 圆柱形杆件（柱子、椽子、铃铛）——实例化
export class RodBatch {
  constructor() {
    this.groups = new Map();
  }
  rod(key, a, b, radius, tint = 1) {
    if (!this.groups.has(key)) this.groups.set(key, { mats: [], colors: [] });
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const g = this.groups.get(key);
    g.mats.push(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(radius, len, radius)));
    g.colors.push(tint);
  }
  build(materials, segments = 10) {
    const root = new THREE.Group();
    const geo = new THREE.CylinderGeometry(1, 1, 1, segments, 1, false);
    const c = new THREE.Color();
    for (const [key, g] of this.groups) {
      const mesh = new THREE.InstancedMesh(geo, materials[key], g.mats.length);
      g.mats.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        const t = g.colors[i];
        mesh.setColorAt(i, c.setRGB(t, t, t));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `rods:${key}`;
      mesh.computeBoundingSphere();
      root.add(mesh);
    }
    return root;
  }
}

// 简单可复现随机数
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 正八边形 Shape（边心距 a，面朝 +z），用于挤出
export function octagonShape(a) {
  const R = a / C8;
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + Math.PI / 8;
    const x = Math.sin(ang) * R;
    const y = Math.cos(ang) * R;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export function octagonPath(a) {
  const R = a / C8;
  const p = new THREE.Path();
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + Math.PI / 8;
    const x = Math.sin(ang) * R;
    const y = Math.cos(ang) * R;
    i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
  }
  p.closePath();
  return p;
}

// 水平八边形环板（外边心距 aOut，内边心距 aIn），顶面位于 y
export function octagonRing(aOut, aIn, y, thickness) {
  const shape = octagonShape(aOut);
  if (aIn > 0) shape.holes.push(octagonPath(aIn));
  const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 1 });
  // Shape 在 XY 平面（y 对应世界 -z 方向需翻转），旋转到水平
  g.rotateX(Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

// 合并静态小网格（按材质），减少绘制调用。
// 只合并：非实例化、单一材质、顶点数 < maxVerts 的网格；保持 group 自身的变换不变。
export function mergeStatic(group, maxVerts = 6000) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert();
  const buckets = new Map();
  const victims = [];
  group.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.userData.keep) return;
    const g = o.geometry;
    if (g.attributes.position.count >= maxVerts) return;
    let geo = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
    if (!geo.attributes.normal) geo.computeVertexNormals();
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));
    const key = o.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, geos: [], cast: false });
    const b = buckets.get(key);
    b.geos.push(geo);
    b.cast ||= o.castShadow;
    victims.push(o);
  });
  for (const o of victims) o.removeFromParent();
  let n = 0;
  for (const b of buckets.values()) {
    const merged = new THREE.Mesh(mergeGeometries(b.geos), b.mat);
    merged.castShadow = b.cast;
    merged.receiveShadow = true;
    merged.name = 'merged';
    group.add(merged);
    n++;
  }
  return { removed: victims.length, added: n };
}

// 跨对象合并实例化网格：材质相同、几何参数相同的 InstancedMesh 并为一个（把父级变换烘焙进实例矩阵）
export function mergeInstances(group) {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert();
  const buckets = new Map();
  const victims = [];
  group.traverse((o) => {
    if (!o.isInstancedMesh || Array.isArray(o.material)) return;
    const key = `${o.material.uuid}|${o.geometry.type}|${JSON.stringify(o.geometry.parameters ?? {})}`;
    if (!buckets.has(key)) buckets.set(key, { geo: o.geometry, mat: o.material, list: [], cast: false });
    const b = buckets.get(key);
    b.list.push({ o, rel: inv.clone().multiply(o.matrixWorld) });
    b.cast ||= o.castShadow;
    victims.push(o);
  });
  for (const o of victims) o.removeFromParent();
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  for (const b of buckets.values()) {
    const total = b.list.reduce((n, it) => n + it.o.count, 0);
    const mesh = new THREE.InstancedMesh(b.geo, b.mat, total);
    let k = 0;
    for (const { o, rel } of b.list)
      for (let i = 0; i < o.count; i++, k++) {
        o.getMatrixAt(i, m);
        mesh.setMatrixAt(k, m.premultiply(rel));
        if (o.instanceColor) {
          o.getColorAt(i, c);
          mesh.setColorAt(k, c);
        }
      }
    mesh.castShadow = b.cast;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    group.add(mesh);
  }
  return { removed: victims.length, added: buckets.size };
}
