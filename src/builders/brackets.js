import { Frame, T8, C8 } from '../lib/kit.js';

// 一圈铺作（斗拱层）。所有尺寸以“材”c 为模数：c = H / (4.35 + 1.45·n)
// o = {
//   apothem, side, y（柱头 = 普拍枋底）, height H, projection P, steps n,
//   ang（是否带下昂）, xie（补间是否用斜栱）, bays（三间比例）, key（材质）
// }
export function bracketRing(boxes, o) {
  const n = o.steps;
  const H = o.height;
  const c = H / (4.35 + 1.45 * n);
  const P = o.projection;
  const a = o.apothem;
  const key = o.key ?? 'wood';
  const bays = o.bays ?? [0.31, 0.38, 0.31];
  const yb = (j) => 1.7 * c + (j - 1) * 1.45 * c; // 第 j 跳华栱底
  const L = { a, c, n, P, yb, key };

  const colX = (side) => [-side / 2, -side / 2 + bays[0] * side, side / 2 - bays[2] * side, side / 2];
  const xs = colX(o.side);

  for (let k = 0; k < 8; k++) {
    // 柱头铺作（面内两根柱）
    for (const x of [xs[1], xs[2]]) cluster(boxes, Frame.onFace(k, a, x, o.y), { ...L, tint: 1 });
    // 补间铺作（每间一朵）
    for (let b = 0; b < 3; b++) {
      const x = (xs[b] + xs[b + 1]) / 2;
      cluster(boxes, Frame.onFace(k, a, x, o.y), { ...L, buJian: true, xie: o.xie, ang: o.ang, tint: 0.95 });
    }
    // 转角铺作：角缝 + 两侧正身出跳
    cluster(boxes, Frame.atCorner(k, a, o.y), { ...L, P: P / C8, ang: o.ang, tint: 1.05 });
    for (const kk of [k, (k + 1) % 8]) {
      const sign = kk === k ? 1 : -1;
      const fr = Frame.onFace(kk, a, (sign * a * T8), o.y);
      cluster(boxes, fr, { ...L, noCap: true, tint: 0.97 });
    }
    ringBeams(boxes, k, { ...L, H, side: o.side, y: o.y });
  }
}

function cluster(boxes, fr, o) {
  const { c, n, P, yb, key } = o;
  const t = o.tint ?? 1;
  const arm = 0.66 * c;
  if (!o.noCap) boxes.box(key, fr, 0, 0.7 * c + 0.75 * c, 0, 2.3 * c, 1.5 * c, 2.3 * c, 0, 0, 0, t * 0.92); // 栌斗
  // 泥道栱
  if (!o.noCap) boxes.box(key, fr, 0, yb(1) + 0.5 * c, 0, 5.2 * c, c, arm, 0, 0, 0, t);

  const steps = o.buJian && o.short ? n - 1 : n;
  for (let j = 1; j <= steps; j++) {
    const zt = (j * P) / n;
    const y = yb(j);
    // 用下昂时，最上一跳由昂代替
    const isAngTier = o.ang && j === n;
    if (!isAngTier) {
      const z0 = -0.4;
      const z1 = zt + 0.5 * c;
      boxes.box(key, fr, 0, y + 0.5 * c, (z0 + z1) / 2, arm, c, z1 - z0, 0, 0, 0, t);
    }
    // 交互斗
    boxes.box(key, fr, 0, y + 1.225 * c, zt, c, 0.45 * c, c, 0, 0, 0, t * 0.9);
    // 跳头横栱（瓜子栱 / 令栱）
    const len = j === n ? 6.4 * c : 5.0 * c;
    boxes.box(key, fr, 0, y + 1.95 * c, zt, len, c, arm, 0, 0, 0, t);
    // 散斗
    for (const sx of [-len / 2 + 0.5 * c, 0, len / 2 - 0.5 * c])
      boxes.box(key, fr, sx, y + 2.675 * c, zt, c * 0.9, 0.45 * c, c * 0.9, 0, 0, 0, t * 0.9);
  }

  // 下昂：自内上方斜下伸出，昂嘴压在令栱之下
  if (o.ang) {
    const yA = yb(n) + 2.4 * c;
    const yB = yb(n) - 0.5 * c;
    const zA = -0.8;
    const zB = P + 1.1 * c;
    const dy = yB - yA;
    const dz = zB - zA;
    const len = Math.hypot(dy, dz);
    boxes.box(key, fr, 0, (yA + yB) / 2, (zA + zB) / 2, arm, c, len, Math.atan2(-dy, dz), 0, 0, t * 0.95);
    if (n >= 3) {
      const yA2 = yb(n - 1) + 2.0 * c;
      const yB2 = yb(n - 1) - 0.4 * c;
      const zB2 = ((n - 1) * P) / n + 0.9 * c;
      const dy2 = yB2 - yA2;
      const dz2 = zB2 - zA;
      boxes.box(key, fr, 0, (yA2 + yB2) / 2, (zA + zB2) / 2, arm, c, Math.hypot(dy2, dz2), Math.atan2(-dy2, dz2), 0, 0, t * 0.95);
    }
  }

  // 辽式斜栱：补间 ±45° 出跳
  if (o.xie) {
    for (const s of [-1, 1]) {
      const psi = (s * Math.PI) / 4;
      for (let j = 1; j <= Math.min(2, n); j++) {
        const Lr = (j * P) / n / Math.cos(psi) + 0.4 * c;
        const y = yb(j);
        boxes.box(key, fr, Math.sin(psi) * (Lr / 2), y + 0.5 * c, Math.cos(psi) * (Lr / 2), arm, c, Lr, 0, psi, 0, t * 0.97);
        const tx = Math.sin(psi) * ((j * P) / n / Math.cos(psi));
        const tz = Math.cos(psi) * ((j * P) / n / Math.cos(psi));
        boxes.box(key, fr, tx, y + 1.225 * c, tz, c, 0.45 * c, c, 0, 0, 0, t * 0.9);
      }
    }
  }
}

// 每面的通长枋子：普拍枋、阑额、柱头枋、罗汉枋、橑檐枋、栱眼壁
function ringBeams(boxes, k, o) {
  const { a, c, n, P, yb, key, H } = o;
  const arm = 0.66 * c;
  const faceLen = (ap) => 2 * ap * T8;
  const fr = (ap) => Frame.onFace(k, ap, 0, o.y);

  const f0 = fr(a);
  const y0 = 0;
  boxes.box(key, f0, 0, y0 + 0.35 * c, 0, faceLen(a) + 1.2 * c, 0.7 * c, 2.0 * c, 0, 0, 0, 0.9); // 普拍枋
  boxes.box(key, f0, 0, y0 - 0.8 * c, 0, faceLen(a) - 0.4, 1.5 * c, 1.1 * c, 0, 0, 0, 0.85); // 阑额
  // 柱心缝上的柱头枋（素枋叠置）
  for (let j = 2; j <= n + 1; j++) boxes.box(key, f0, 0, yb(j) + 0.5 * c, 0, faceLen(a) + c, c, arm, 0, 0, 0, 0.88);
  // 栱眼壁（白灰）
  const wallTop = yb(n + 1) + c;
  boxes.box('plaster', f0, 0, (0.7 * c + wallTop) / 2, -0.12, faceLen(a), wallTop - 0.7 * c, 0.12);
  // 罗汉枋
  for (let j = 1; j < n; j++) {
    const ap = a + (j * P) / n;
    boxes.box(key, fr(ap), 0, yb(j) + 2.95 * c, 0, faceLen(ap) + c, c, arm, 0, 0, 0, 0.88);
  }
  // 橑檐枋
  const apL = a + P;
  boxes.box(key, fr(apL), 0, H - 0.6 * c, 0, faceLen(apL) + 1.5 * c, 1.2 * c, 0.8 * c, 0, 0, 0, 0.9);
  // 檐下遮板：橑檐枋至望板之间（防止从下方漏光）
  boxes.box('woodDark', fr(a + P / 2), 0, H + 0.1, 0, faceLen(a + P / 2), 0.08, P + 0.6);
}
