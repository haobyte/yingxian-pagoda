import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FACES, T8, Frame, cornerDir } from '../lib/kit.js';

// 八角屋面（腰檐 / 顶层攒尖 / 副阶）
// o = {
//   aOut  檐口边心距（面中）     aIn  屋面上端边心距（腰檐=上层暗层墙；攒尖=刹座半径）
//   aLia  橑檐枋边心距  yLia 橑檐枋顶高度  yTop 屋面上端高度
//   sA    檐口段坡度（橑檐枋以外为直线）；以内为切线连续的二次曲线（举折：下缓上陡）
//   lift  角部起翘  extra 角部出翘（径向外伸）
//   thick 屋面厚度  ridgeTop 是否做博脊（腰檐）
// }
export function buildRoof(o, mats, boxes, rods) {
  const span = o.aOut - o.aIn;
  const thick = o.thick ?? 0.3;
  const sA = o.sA ?? 0.32;
  const yL = o.yLia + thick; // 屋面在橑檐枋处的高度
  const yEave = yL - (o.aOut - o.aLia) * sA;
  const inner = o.aLia - o.aIn;
  const k1 = Math.min(1, (sA * inner) / (o.yTop - yL)); // 二次曲线起始斜率（归一化）
  const profile = (r) => {
    if (r >= o.aLia) return yL - (r - o.aLia) * sA;
    const w = (o.aLia - r) / inner;
    return yL + (o.yTop - yL) * (k1 * w + (1 - k1) * w * w);
  };
  const rise = o.yTop - yEave;
  const slopeLen = Math.hypot(span, rise);

  const S = (k, x, v, out = new THREE.Vector3()) => {
    const f = FACES[k];
    const r = o.aOut - span * v;
    const u = Math.min(1, Math.abs(x) / (r * T8));
    const w = u * u * u;
    out.copy(f.n).multiplyScalar(r).addScaledVector(f.t, x);
    const len = Math.hypot(out.x, out.z);
    const push = o.extra * w * Math.pow(1 - v, 1.5);
    out.x += (out.x / len) * push;
    out.z += (out.z / len) * push;
    out.y = profile(r) + o.lift * w * (1 - v) * (1 - v);
    return out;
  };
  const rAt = (v) => o.aOut - span * v;

  // 局部切向量与法线
  const _a = new THREE.Vector3();
  const _b = new THREE.Vector3();
  const tangents = (k, x, v) => {
    const e = 0.01;
    const dx = S(k, x + e, v, _a.clone()).sub(S(k, x - e, v, _b.clone())).normalize();
    const v0 = Math.max(0, v - e);
    const v1 = Math.min(1, v + e);
    const dv = S(k, x, v1, _a.clone()).sub(S(k, x, v0, _b.clone())).normalize();
    const n = new THREE.Vector3().crossVectors(dx, dv).normalize();
    return { dx, dv, n };
  };

  const group = new THREE.Group();

  // ---------- 屋面（板瓦底）+ 望板底 + 连檐 ----------
  const nu = 28;
  const nv = 18;
  const bedGeos = [];
  const soffitGeos = [];
  const fasciaGeos = [];
  for (let k = 0; k < 8; k++) {
    const pos = [];
    const uv = [];
    const sPos = [];
    const idx = [];
    const p = new THREE.Vector3();
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      for (let i = 0; i <= nu; i++) {
        const u = -1 + (2 * i) / nu;
        const x = u * rAt(v) * T8;
        S(k, x, v, p);
        pos.push(p.x, p.y, p.z);
        sPos.push(p.x, p.y - thick, p.z);
        uv.push(x, v * slopeLen);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i;
        const b = a + 1;
        const c = a + nu + 1;
        const d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    bedGeos.push(g);

    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    sg.setIndex(idx.slice().reverse());
    sg.computeVertexNormals();
    soffitGeos.push(sg);

    // 连檐（檐口立面）
    const fp = [];
    const fi = [];
    const fu = [];
    for (let i = 0; i <= nu; i++) {
      const u = -1 + (2 * i) / nu;
      S(k, u * o.aOut * T8, 0, p);
      fp.push(p.x, p.y + 0.02, p.z, p.x, p.y - thick, p.z);
      fu.push(i, 0, i, 1);
    }
    for (let i = 0; i < nu; i++) {
      const a = i * 2;
      fi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    fg.setAttribute('uv', new THREE.Float32BufferAttribute(fu, 2));
    fg.setIndex(fi);
    fg.computeVertexNormals();
    fasciaGeos.push(fg);
  }
  const bed = new THREE.Mesh(mergeGeometries(bedGeos), mats.tileBed);
  const bedMap = mats.tileBed.map;
  bedMap.repeat.set(1 / (3 * 0.34), 1 / 3);
  const soffit = new THREE.Mesh(mergeGeometries(soffitGeos), mats.soffit);
  const fascia = new THREE.Mesh(mergeGeometries(fasciaGeos), mats.fascia);
  for (const m of [bed, soffit, fascia]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }

  // ---------- 筒瓦（几何瓦垄）+ 瓦当 ----------
  const R = 0.085;
  const seg = 6;
  const spacing = 0.34;
  const tPos = [];
  const tIdx = [];
  const tUv = [];
  for (let k = 0; k < 8; k++) {
    const half = o.aOut * T8;
    for (let x = -half + spacing / 2; x < half; x += spacing) {
      const vEnd = Math.min(1, (o.aOut - Math.abs(x) / T8) / span);
      if (vEnd < 0.02) continue;
      const nS = Math.max(3, Math.ceil((vEnd * slopeLen) / 0.3));
      const base = tPos.length / 3;
      for (let s = 0; s <= nS; s++) {
        const v = (s / nS) * vEnd * 0.995;
        const P = S(k, x, v);
        const { dx, n } = tangents(k, x, v);
        for (let i = 0; i <= seg; i++) {
          const ph = (i / seg) * Math.PI;
          const c = Math.cos(ph) * R;
          const sn = Math.sin(ph) * R;
          tPos.push(P.x + dx.x * c + n.x * sn, P.y + dx.y * c + n.y * sn, P.z + dx.z * c + n.z * sn);
          tUv.push(i / seg, (v * slopeLen) / 0.35);
        }
      }
      for (let s = 0; s < nS; s++)
        for (let i = 0; i < seg; i++) {
          const a = base + s * (seg + 1) + i;
          const b = a + 1;
          const c = a + seg + 1;
          const d = c + 1;
          tIdx.push(a, c, b, b, c, d);
        }
      // 瓦当（檐口端半圆盖）
      const P0 = S(k, x, 0);
      const { dx, n } = tangents(k, x, 0);
      const cb = tPos.length / 3;
      tPos.push(P0.x, P0.y, P0.z);
      tUv.push(0.5, 0);
      for (let i = 0; i <= seg; i++) {
        const ph = (i / seg) * Math.PI;
        const c = Math.cos(ph) * R * 1.15;
        const sn = Math.sin(ph) * R * 1.15;
        tPos.push(P0.x + dx.x * c + n.x * sn, P0.y + dx.y * c + n.y * sn, P0.z + dx.z * c + n.z * sn);
        tUv.push(i / seg, 0);
      }
      for (let i = 0; i < seg; i++) tIdx.push(cb, cb + 1 + i, cb + 2 + i);
    }
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3));
  tg.setAttribute('uv', new THREE.Float32BufferAttribute(tUv, 2));
  tg.setIndex(tIdx);
  tg.computeVertexNormals();
  const tiles = new THREE.Mesh(tg, mats.tile);
  tiles.castShadow = true;
  tiles.receiveShadow = true;
  group.add(tiles);

  // ---------- 戗脊（角脊）+ 脊端兽 + 风铎 ----------
  const cornerTips = [];
  for (let k = 0; k < 8; k++) {
    const pts = [];
    const n = 20;
    for (let s = 0; s <= n; s++) {
      const v = s / n;
      const P = S(k, rAt(v) * T8 - 1e-4, v);
      P.y += 0.16;
      pts.push(P);
    }
    const d = cornerDir(k);
    const tip = pts[0].clone().addScaledVector(d, 0.35);
    tip.y += 0.12;
    pts.unshift(tip);
    // 戗脊：沿角线逐段方截面脊（宽 0.32，高 0.3），比圆管更接近叠瓦脊的形态
    for (let s2 = 0; s2 < pts.length - 1; s2++) {
      const a = pts[s2];
      const b = pts[s2 + 1];
      const ext = b.clone().sub(a).multiplyScalar(0.04); // 段间略重叠，避免缝隙
      boxes.beam('ridge', a.clone().sub(ext), b.clone().add(ext), 0.32, 0.3);
    }
    cornerTips.push(tip.clone());

    // 脊端兽（简化为叠块）
    const f = Frame.radial(d, Math.hypot(tip.x, tip.z) - 0.25, tip.y + 0.12);
    boxes.box('ridge', f, 0, 0.05, 0, 0.26, 0.32, 0.4, -0.3);
    boxes.box('ridge', f, 0, 0.3, 0.12, 0.18, 0.2, 0.22, 0.4);
    // 角梁头 + 套兽
    const eaveTip = S(k, rAt(0) * T8 - 1e-4, 0);
    const f2 = Frame.radial(d, Math.hypot(eaveTip.x, eaveTip.z) + 0.1, eaveTip.y - thick * 0.6);
    boxes.box('wood', f2, 0, 0, -0.4, 0.3, 0.38, 1.2, -0.25);
    boxes.box('ridge', f2, 0, -0.02, 0.28, 0.32, 0.32, 0.3);
    // 风铎
    const bTop = new THREE.Vector3().copy(eaveTip).addScaledVector(d, 0.22);
    bTop.y -= thick + 0.1;
    const bMid = bTop.clone();
    bMid.y -= 0.45;
    rods.rod('iron', bTop, bMid, 0.012);
    const bBot = bMid.clone();
    bBot.y -= 0.32;
    rods.rod('iron', bMid, bBot, 0.11);
  }


  // ---------- 博脊（腰檐上端与墙相交处）----------
  if (o.ridgeTop) {
    for (let k = 0; k < 8; k++) {
      const len = 2 * o.aIn * T8 + 0.2;
      const f = Frame.onFace(k, o.aIn + 0.12, 0, o.yTop + 0.05);
      boxes.box('ridge', f, 0, 0, 0, len, 0.38, 0.42);
    }
  }

  // ---------- 椽子（翼角处自然呈扇形）----------
  const vLia = Math.max(0, Math.min(1, (o.aOut - o.aLia) / span));
  const rafterStep = 0.3;
  for (let k = 0; k < 8; k++) {
    const half = o.aOut * T8;
    const liaHalf = o.aLia * T8 * 0.97;
    for (let x = -half + rafterStep / 2; x < half; x += rafterStep) {
      const xs = Math.max(-liaHalf, Math.min(liaHalf, x));
      const A = S(k, xs, vLia);
      const B = S(k, x, 0);
      A.y -= thick + 0.07;
      B.y -= thick + 0.07;
      const dir = B.clone().sub(A).normalize();
      B.addScaledVector(dir, 0.08);
      rods.rod('wood', A, B, 0.065, 0.85 + 0.15 * Math.random());
    }
  }

  return { group, cornerTips, S, yEave };
}
