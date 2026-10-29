import * as THREE from 'three';
import { cornerDir } from './lib/kit.js';

// 现状变形场（塔坐标：x 东，y 上，z 南）
// 依据（详见 docs/pagoda-research.md）：
//  · 永昕群（中国文化遗产研究院）《中国文化遗产》2021(1)：二层各柱整体自西南向东北倾斜并持续发展，
//    倾斜增量自西南向东北递减；北侧和东北侧部分柱子外倾；有的柱头因内倾而沉降
//  · 同院监测（2015）：23 号柱（二层西南侧）柱头相对柱脚偏移 >56 cm
//  · 山西省文物局 2004 报告：塔身整体向东北倾斜 65 cm；西南面南平柱向东北倾斜 50 cm；
//    二层外槽西面北角柱相对下沉 20 cm；（2020 报道）二层西面屋檐明显下沉
//  · 莫宗江 1950：塔身歪向东北，二层内各柱向东北倾斜最甚
//
// 参数（t=1 对应约 2020 年状态）：
export const TILT = {
  dir: new THREE.Vector3(Math.SQRT1_2, 0, -Math.SQRT1_2), // 指向东北（x 东，-z 北）
  layers: [
    { level: 2, avg: 0.42, spread: 0.14 }, // 西南 0.56 m，东北 0.28 m（实测两端，中间线性：估算）
    { level: 3, avg: 0.15, spread: 0 }, // 估算
    { level: 4, avg: 0.08, spread: 0 }, // 估算；塔身累计 0.65 m（2004 报告）
  ],
  columnH: 2.805, // 二层明层柱高（报道值）
  settle: { corner: 5, amount: 0.2, sigma: 5 }, // 西面北角柱（西面与西北面交角）下沉 20 cm，影响半径为估算
  outward: { azimuth: 22.5, amount: 0.06 }, // 北—东北侧外倾：方向依文献，幅度 6 cm 为示意估算
};

const VCAP = 1.2;

export function createDeformer(towerGroup, info) {
  const lv = info.levels;
  const dir = TILT.dir;
  const segs = TILT.layers.map((t) => {
    const L = lv[t.level - 1];
    const next = lv[t.level];
    return {
      ...t,
      y0: L.floorY,
      y1: L.colTop,
      yFade0: L.colTop + L.bracket.height,
      yFade1: next ? next.balconyBase : L.colTop + 6,
      R: L.apothem / Math.cos(Math.PI / 8),
    };
  });
  const s2 = segs[0];
  const settleC = cornerDir(TILT.settle.corner).multiplyScalar(s2.R);
  const outU = { x: Math.sin((TILT.outward.azimuth * Math.PI) / 180), z: -Math.cos((TILT.outward.azimuth * Math.PI) / 180) };
  const hc = TILT.columnH;

  // 返回位移（米）。s：年份比例（真实变形），m：夸张倍数（线性放大，避免大倾角下几何失效）
  const out = new THREE.Vector3();
  const field = (x, y, z, s, m) => {
    let ne = 0;
    let radial = 0;
    let dy = 0;
    for (const sg of segs) {
      if (y <= sg.y0) break;
      const h = Math.min(1, (y - sg.y0) / (sg.y1 - sg.y0)); // 柱架段内：0→1
      let w = h; // 局部差异：柱头以上保持，至上层平坐处衰减为 0
      if (y > sg.yFade0) w = Math.max(0, 1 - (y - sg.yFade0) / (sg.yFade1 - sg.yFade0));
      const sw = Math.max(-1, Math.min(1, -(x * dir.x + z * dir.z) / sg.R));
      ne += sg.avg * h + sg.spread * sw * w;
      if (sg !== s2) continue;
      // 柱头因倾斜而沉降：刚性柱 Δy ≈ d²/(2h)；均值部分随上部整体下降，差异部分衰减
      const dAvg = s * sg.avg;
      const dLoc = s * (sg.avg + sg.spread * sw);
      dy -= ((dAvg * dAvg) / (2 * hc)) * h + (((dLoc * dLoc) - dAvg * dAvg) / (2 * hc)) * w;
      // 西面北角柱下沉
      const ddx = x - settleC.x;
      const ddz = z - settleC.z;
      const g = Math.exp(-(ddx * ddx + ddz * ddz) / (2 * TILT.settle.sigma ** 2));
      dy -= TILT.settle.amount * s * g * w;
      // 北—东北侧外倾
      const r = Math.hypot(x, z);
      if (r > 1) {
        const c = Math.max(0, (x * outU.x + z * outU.z) / r);
        radial += TILT.outward.amount * Math.pow(c, 4) * w;
      }
    }
    const r = Math.hypot(x, z) || 1;
    const k = s * m;
    // 竖向：夸张显示时软上限（tanh，1.2 m），避免二层（柱高 2.8 m）被压扁；m=1 时几乎无影响
    const vy = m > 1 ? -VCAP * Math.tanh((-dy * m) / VCAP) : dy;
    out.set(dir.x * ne * k + (x / r) * radial * k, vy, dir.z * ne * k + (z / r) * radial * k);
    return out;
  };

  towerGroup.updateMatrixWorld(true);
  const towerInv = towerGroup.matrixWorld.clone().invert();
  const items = [];
  const _p = new THREE.Vector3();
  for (const L of info.layers) {
    L.group.traverse((o) => {
      // Statues stay at their nominal floor positions; their altar must stay with them.
      // The historical deformation field applies to the timber structure, not this support.
      if (!o.isMesh || o.userData.statueSupport) return;
      const T = towerInv.clone().multiply(o.matrixWorld); // 网格局部 → 塔坐标
      if (o.isInstancedMesh) {
        items.push({ o, inst: true, orig: o.instanceMatrix.array.slice(), T, Tinv: T.clone().invert() });
      } else {
        const pos = o.geometry.attributes.position;
        const world = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
          _p.fromBufferAttribute(pos, i).applyMatrix4(T);
          world[i * 3] = _p.x;
          world[i * 3 + 1] = _p.y;
          world[i * 3 + 2] = _p.z;
        }
        items.push({ o, inst: false, orig: pos.array.slice(), world, Tinv: T.clone().invert() });
      }
    });
  }

  const mtx = new THREE.Matrix4();
  const S = new THREE.Matrix4();
  const c = new THREE.Vector3();
  const d0 = new THREE.Vector3();
  const g = new THREE.Vector3();
  const setDeform = (s, m = 1) => {
    for (const it of items) {
      if (it.inst) {
        // 实例：在中心处取位移与竖向梯度，局部仿射（平移 + 剪切 + 竖向伸缩），杆件保持笔直
        const arr = it.o.instanceMatrix.array;
        for (let i = 0; i < it.o.count; i++) {
          mtx.fromArray(it.orig, i * 16).premultiply(it.T);
          c.setFromMatrixPosition(mtx);
          d0.copy(field(c.x, c.y, c.z, s, m));
          g.copy(field(c.x, c.y + 0.05, c.z, s, m)).sub(field(c.x, c.y - 0.05, c.z, s, m).clone()).divideScalar(0.1);
          S.set(1, g.x, 0, d0.x - g.x * c.y, 0, 1 + g.y, 0, d0.y - g.y * c.y, 0, g.z, 1, d0.z - g.z * c.y, 0, 0, 0, 1);
          mtx.premultiply(S).premultiply(it.Tinv);
          mtx.toArray(arr, i * 16);
        }
        it.o.instanceMatrix.needsUpdate = true;
        it.o.computeBoundingSphere();
      } else {
        const pos = it.o.geometry.attributes.position;
        const a = pos.array;
        const w = it.world;
        for (let i = 0; i < pos.count; i++) {
          const x = w[i * 3];
          const y = w[i * 3 + 1];
          const z = w[i * 3 + 2];
          const d = field(x, y, z, s, m);
          c.set(x + d.x, y + d.y, z + d.z).applyMatrix4(it.Tinv);
          a[i * 3] = c.x;
          a[i * 3 + 1] = c.y;
          a[i * 3 + 2] = c.z;
        }
        pos.needsUpdate = true;
        it.o.geometry.computeBoundingSphere();
      }
    }
  };
  setDeform.field = field;
  return setDeform;
}
