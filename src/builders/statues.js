import { assetUrl } from '../asset-url.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FLOORS } from '../statues-data.js';
import { prepareStatueModel } from '../statue-asset.js';

// ============================================================================
// Yingxian Wooden Pagoda — 26 Liao-Dynasty Polychrome & Gilded Sculptures
// High-precision parametric 3D sculptural modeling (Zero SDF voxel blobs)
// Based on on-site archival photographs: IMG_9512 (1F), IMG_9513 (3F), IMG_9514 (4F), IMG_9515 (5F)
// ============================================================================

function createStatueMaterials() {
  const std = (color, roughness = 0.48, metalness = 0.08, emissive = 0x1a1208, emissiveIntensity = 0.14) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });

  // Multi-colored polychrome lotus petal material (uses vertex colors)
  const petal = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.45,
    metalness: 0.12,
    emissive: 0x1c1208,
    emissiveIntensity: 0.12,
  });

  return {
    // Burnished Liao gold leaf (1F Sakyamuni face/chest, 4F Buddha face, crowns, jewelry, halos)
    gilt: std(0xe5b552, 0.24, 0.78, 0x4a3208, 0.24),
    giltWarm: std(0xd8a03c, 0.3, 0.68, 0x3d2806, 0.2),
    // Antique aged polychrome clay skin (2F, 3F, 5F Buddhas & Bodhisattvas, matching IMG_9513/9515)
    ivorySkin: std(0xe8dcc8, 0.46, 0.05, 0x241c14, 0.14),
    warmSkin: std(0xdfc8a8, 0.48, 0.05, 0x241a10, 0.14),
    tanSkin: std(0xc4956c, 0.52, 0.05, 0x20140b, 0.14),
    // Hair & facial details
    hairBlue: std(0x283c66, 0.58, 0.08, 0x0c1428, 0.18),
    inkDark: std(0x1f1a17, 0.45, 0.05, 0x080605, 0.1),
    beardGreen: std(0x2d685e, 0.5, 0.08, 0x0b221e, 0.15),
    lipRed: std(0xb83b32, 0.38, 0.06, 0x300c08, 0.18),
    // Robes: authentic Liao mineral pigments & aged ivory-ochre clay
    robeVermilion: std(0xa83b2f, 0.52, 0.06, 0x280b08, 0.15),
    robeCrimson: std(0x8e2f26, 0.54, 0.06, 0x220806, 0.14),
    robeIvory: std(0xdfd3be, 0.52, 0.05, 0x221d15, 0.14),
    robeOchre: std(0xc9a05d, 0.52, 0.06, 0x241a0a, 0.14),
    robeAmber: std(0xc99648, 0.5, 0.08, 0x261a08, 0.15),
    robeMineralGreen: std(0x366b61, 0.52, 0.06, 0x0b1f1b, 0.15),
    robeMineralBlue: std(0x365578, 0.52, 0.06, 0x0b1624, 0.15),
    robeMonk: std(0x8c583a, 0.56, 0.05, 0x1f1108, 0.14),
    // Pedestals & Mounts
    sumeruWood: std(0x6e4e3a, 0.62, 0.06, 0x18100a, 0.12),
    sumeruStone: std(0x8c7865, 0.6, 0.05, 0x1a1510, 0.12),
    lotusGreen: std(0x356e62, 0.5, 0.08, 0x0c201b, 0.14),
    lionBlue: std(0x4a5d6e, 0.5, 0.1, 0x101820, 0.15),
    lionMane: std(0x2f4860, 0.48, 0.12, 0x0c1622, 0.15),
    elephantWhite: std(0xebe4d8, 0.44, 0.06, 0x24201a, 0.15),
    mandorlaBg: std(0x523224, 0.52, 0.15, 0x1c0e08, 0.16),
    petal,
  };
}

const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

class Parts {
  constructor(M) {
    this.M = M;
    this.map = new Map();
  }
  add(key, geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], tilt = 0 } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (g.attributes.uv) g.deleteAttribute('uv');
    const m = new THREE.Matrix4();
    if (tilt) {
      const qY = new THREE.Quaternion().setFromAxisAngle(UP, r[1]);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
      _q.multiplyQuaternions(qY, qX);
    } else {
      _q.setFromEuler(_e.set(r[0], r[1], r[2]));
    }
    m.compose(_v.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
    g.applyMatrix4(m);
    if (!this.map.has(key)) this.map.set(key, []);
    this.map.get(key).push(g);
  }
  seg(key, a, b, r0, r1 = r0, radialSeg = 14) {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    if (len < 1e-4) return;
    const mid = va.add(vb).multiplyScalar(0.5);
    const g = new THREE.CylinderGeometry(r1, r0, len, radialSeg).toNonIndexed();
    if (g.attributes.uv) g.deleteAttribute('uv');
    _q.setFromUnitVectors(UP, dir.normalize());
    const m = new THREE.Matrix4().compose(mid, _q, _s.set(1, 1, 1));
    g.applyMatrix4(m);
    if (!this.map.has(key)) this.map.set(key, []);
    this.map.get(key).push(g);
  }
  limb(key, pts, radii) {
    for (let i = 0; i < pts.length - 1; i++) {
      this.seg(key, pts[i], pts[i + 1], radii[i], radii[i + 1], 14);
      if (i > 0) {
        this.add(key, new THREE.SphereGeometry(radii[i] * 0.98, 12, 10), { p: pts[i] });
      }
    }
  }
  lathe(key, pts, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], seg = 32 } = {}) {
    const g = new THREE.LatheGeometry(pts.map(([rad, y]) => new THREE.Vector2(rad, y)), seg);
    this.add(key, g, { p, r, s });
  }
  toGroup() {
    const g = new THREE.Group();
    for (const [key, list] of this.map) {
      if (!list.length || !this.M[key]) continue;
      const merged = mergeGeometries(list, false);
      if (!merged) continue;
      merged.computeVertexNormals();
      const mesh = new THREE.Mesh(merged, this.M[key]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
    }
    return g;
  }
}

// ============================================================================
// Sculpted Geometries: Draped Lathe, Polychrome Lotus Petals, Snail-Curl Hair
// ============================================================================
function drapedLatheGeo(pts, folds = 12, amp = 0.04, seg = 48, scaleZ = 0.78) {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const a = g.attributes.position;
  const y0 = pts[0][1];
  const y1 = pts[pts.length - 1][1];
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i);
    const y = a.getY(i);
    const z = a.getZ(i) * scaleZ;
    const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0 || 1)));
    const ang = Math.atan2(x, z);
    const foldWave = Math.sin(ang * folds + Math.sin(t * Math.PI) * 1.4);
    const k = 1 + amp * foldWave * Math.sin(t * Math.PI);
    a.setX(i, x * k);
    a.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

// Polychrome Lotus Petal Geometry (mineral blue-green center, vermilion border, gilded tip — ref IMG_9512)
function createPolychromePetalGeo() {
  const g = new THREE.SphereGeometry(1, 16, 12, 0, Math.PI, 0, Math.PI).toNonIndexed();
  if (g.attributes.uv) g.deleteAttribute('uv');
  const a = g.attributes.position;
  const col = new Float32Array(a.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < a.count; i++) {
    let x = a.getX(i);
    let y = a.getY(i);
    let z = a.getZ(i);
    const t = (y + 1) / 2;
    // Sculpted lotus petal profile with central ridge and upturned tip
    const widthFactor = 1 - 0.62 * t * t * t;
    x *= widthFactor;
    const ridge = Math.max(0, 1 - Math.abs(x) * 1.8) * 0.12;
    z = z * 0.34 + 0.26 * t * t + ridge;
    a.setXYZ(i, x, y, z);

    const u = Math.hypot(x / (widthFactor + 1e-3), (t - 0.42) * 1.5);
    if (t > 0.88) c.set('#e5b552'); // Gilded tip
    else if (u < 0.45) c.set('#2c6b62'); // Mineral green-blue core
    else if (u < 0.58) c.set('#e8dcc6'); // Cream inner border
    else if (u < 0.76) c.set('#b43d30'); // Vermilion outer rim
    else c.set('#d9a441'); // Gold edge
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
const PETAL_GEO = createPolychromePetalGeo();

function addLotusThrone(P, r, h, y0, layersCount = 2) {
  // Lotus seed-pod receptacle (莲蓬承座)
  P.add('lotusGreen', new THREE.CylinderGeometry(r * 0.82, r * 0.64, h * 0.58, 32), { p: [0, y0 + h * 0.62, 0] });
  P.add('giltWarm', new THREE.TorusGeometry(r * 0.81, h * 0.045, 10, 36), { p: [0, y0 + h * 0.9, 0], r: [Math.PI / 2, 0, 0] });
  P.add('sumeruWood', new THREE.CylinderGeometry(r * 0.64, r * 0.7, h * 0.32, 32), { p: [0, y0 + h * 0.16, 0] });

  const rows = [
    { n: 16, rad: r * 0.84, tilt: 0.92, y: 0.42, s: [r * 0.22, h * 0.54, r * 0.22], off: 0 },
    { n: 16, rad: r * 0.70, tilt: 0.54, y: 0.62, s: [r * 0.2, h * 0.52, r * 0.2], off: 0.5 },
  ];
  if (layersCount >= 3) {
    rows.unshift({ n: 16, rad: r * 0.9, tilt: 1.25, y: 0.25, s: [r * 0.21, h * 0.46, r * 0.21], off: 0.25 });
  }
  for (const row of rows) {
    for (let i = 0; i < row.n; i++) {
      const a = ((i + row.off) / row.n) * Math.PI * 2;
      P.add('petal', PETAL_GEO, {
        p: [Math.sin(a) * row.rad, y0 + h * row.y, Math.cos(a) * row.rad],
        r: [0, a, 0],
        tilt: row.tilt,
        s: row.s,
      });
    }
  }
}

// ============================================================================
// Sculpted Flame Mandorla Backscreen (舟形火焰纹背屏 / 头光身光 — Ref IMG_9513, 9514, 9515)
// ============================================================================
function addMandorlaBackscreen(P, yBase, totalH, width, zBack = -0.22, hasBodyMandorla = true) {
  if (hasBodyMandorla) {
    // Ogee-arched solid wooden/gilded mandorla screen behind the Buddha
    const pts = [];
    const N = 28;
    for (let i = 0; i <= N; i++) {
      const t = i / N; // 0 at bottom, 1 at pointed apex
      const y = yBase + t * totalH;
      // Ogee curve: widens at waist/shoulders, tapers to a pointed flame apex at top
      const w =
        t < 0.65
          ? width * (0.68 + 0.32 * Math.sin((t / 0.65) * Math.PI * 0.75))
          : width * Math.pow(1 - (t - 0.65) / 0.35, 0.75) * 0.88;
      pts.push([Math.max(0.02, w), y - yBase]);
    }
    // Thin flattened lathe creates a double-sided carved mandorla board
    P.lathe('mandorlaBg', pts, { p: [0, yBase, zBack], s: [1, 1, 0.1], seg: 28 });

    // Concentric gilded inner rim & flame border scallops around the mandorla
    const rimCount = 22;
    for (let i = 0; i <= rimCount; i++) {
      const t = i / rimCount;
      const y = yBase + t * totalH * 0.96;
      const w =
        t < 0.65
          ? width * (0.68 + 0.32 * Math.sin((t / 0.65) * Math.PI * 0.75))
          : width * Math.pow(1 - (t - 0.65) / 0.35, 0.75) * 0.88;
      for (const side of [-1, 1]) {
        if (i < rimCount) {
          const tNext = (i + 1) / rimCount;
          const yNext = yBase + tNext * totalH * 0.96;
          const wNext =
            tNext < 0.65
              ? width * (0.68 + 0.32 * Math.sin((tNext / 0.65) * Math.PI * 0.75))
              : width * Math.pow(1 - (tNext - 0.65) / 0.35, 0.75) * 0.88;
          // Outer golden flame border
          P.seg('gilt', [side * w, y, zBack + 0.02], [side * wNext, yNext, zBack + 0.02], width * 0.04, width * 0.035, 8);
          // Inner lotus scroll band
          P.seg('giltWarm', [side * w * 0.82, y, zBack + 0.03], [side * wNext * 0.82, yNext, zBack + 0.03], width * 0.025, width * 0.025, 8);
        }
        // Sculpted flame tongue along the outer edge
        if (i > 1 && i < rimCount) {
          P.add('gilt', new THREE.ConeGeometry(width * 0.045, width * 0.16, 6), {
            p: [side * (w + width * 0.04), y + width * 0.05, zBack + 0.02],
            r: [0, 0, -side * 0.38],
          });
        }
      }
    }
    // Pointed top flame finial
    P.add('gilt', new THREE.ConeGeometry(width * 0.08, width * 0.28, 10), {
      p: [0, yBase + totalH, zBack + 0.02],
    });
  }

  // Circular sacred head halo (头光圆轮)
  const headY = yBase + totalH * 0.68;
  const headR = width * 0.48;
  P.add('gilt', new THREE.TorusGeometry(headR, width * 0.032, 10, 36), { p: [0, headY, zBack + 0.04] });
  P.add('lotusGreen', new THREE.TorusGeometry(headR * 0.78, width * 0.022, 8, 32), { p: [0, headY, zBack + 0.045] });
}

// ============================================================================
// Dignified Liao-Dynasty Head, Visage & Crown (佛/菩萨/弟子/力士头部法相)
// ============================================================================
function buildHead(P, yNeck, H, opts = {}) {
  const {
    skinKey = 'ivorySkin',
    isBuddha = false,
    isBodhi = false,
    isMonk = false,
    fiveKnots = false,
    hasBeard = false, // 1F Colossal Sakyamuni's signature Liao green-blue moustache & goatee
    old = false,
  } = opts;

  const r = H * 0.5; // Head half-width
  const yc = yNeck + H * 0.56; // Center of cranium

  // 1. Neck with Liao "Three Auspicious Neck Fold Lines" (三道蚕节纹)
  P.add(skinKey, new THREE.CylinderGeometry(r * 0.46, r * 0.52, H * 0.34, 24), { p: [0, yNeck + H * 0.14, 0] });
  for (let i = 0; i < 3; i++) {
    P.add('giltWarm', new THREE.TorusGeometry(r * 0.49, r * 0.022, 8, 24, Math.PI), {
      p: [0, yNeck + H * (0.08 + i * 0.065), r * 0.02],
      r: [Math.PI / 2, 0, 0],
    });
  }

  // 2. Sculpted Liao Cranium & Full Rounded Jawline (丰润饱满的辽代面相，绝不捏瘪)
  const headProfile = [
    [0.01, -0.52],
    [0.42, -0.49], // Chin
    [0.76, -0.38], // Full lower jaw (颐部丰满)
    [0.92, -0.18], // Full cheeks
    [0.96, 0.04],  // Cheekbones
    [0.93, 0.28],  // Forehead
    [0.80, 0.48],  // Upper cranium
    [0.45, 0.60],
    [0.01, 0.63],
  ].map(([rad, y]) => [rad * r, y * H]);
  P.lathe(skinKey, headProfile, { p: [0, yc, 0], s: [1, 1, 0.94], seg: 36 });

  // Subtle fullness of the cheeks & chin pad
  P.add(skinKey, new THREE.SphereGeometry(r * 0.28, 14, 12), {
    p: [0, yc - H * 0.36, r * 0.72],
    s: [1.15, 0.65, 0.65],
  });

  // 3. Noble Facial Features (五官庄严：弯眉、慈目、直鼻、朱唇、白毫)
  // Arched Brow Ridges (石青/描金弯眉)
  const browKey = hasBeard ? 'hairBlue' : old ? 'ivorySkin' : 'inkDark';
  for (const s of [-1, 1]) {
    P.add(browKey, new THREE.TorusGeometry(r * 0.25, r * 0.028, 8, 18, Math.PI * 0.72), {
      p: [s * r * 0.31, yc + H * 0.06, r * 0.84],
      r: [0.15, s * 0.22, Math.PI * 0.14],
    });
    // Meditative half-closed upper eyelid canopy (垂眸慈悲眼睑)
    P.add(skinKey, new THREE.SphereGeometry(r * 0.16, 14, 10), {
      p: [s * r * 0.31, yc - H * 0.01, r * 0.85],
      s: [1.25, 0.55, 0.55],
    });
    // Dark slit eye line & pupil glint
    P.add('inkDark', new THREE.TorusGeometry(r * 0.15, r * 0.018, 6, 14, Math.PI * 0.82), {
      p: [s * r * 0.31, yc - H * 0.03, r * 0.89],
      r: [0.1, s * 0.18, Math.PI * 0.09],
    });
  }

  // Straight, well-defined nose bridge & nose wings (高直鼻梁)
  P.seg(skinKey, [0, yc + H * 0.09, r * 0.88], [0, yc - H * 0.16, r * 0.99], r * 0.085, r * 0.12, 12);
  P.add(skinKey, new THREE.SphereGeometry(r * 0.115, 12, 10), {
    p: [0, yc - H * 0.17, r * 0.98],
    s: [1.25, 0.85, 0.9],
  });

  // Full vermilion lips (端庄朱唇)
  P.add('lipRed', new THREE.SphereGeometry(r * 0.14, 14, 10), {
    p: [0, yc - H * 0.28, r * 0.89],
    s: [1.35, 0.42, 0.65],
  });
  P.add('lipRed', new THREE.SphereGeometry(r * 0.13, 14, 10), {
    p: [0, yc - H * 0.31, r * 0.88],
    s: [1.2, 0.45, 0.65],
  });

  // Forehead Urna jewel (眉间白毫相)
  if (isBuddha || isBodhi) {
    P.add('gilt', new THREE.SphereGeometry(r * 0.068, 12, 10), {
      p: [0, yc + H * 0.18, r * 0.91],
    });
  }

  // 1F Colossal Sakyamuni's signature Liao-dynasty green-blue moustache & goatee (见照片 IMG_9512)
  if (hasBeard) {
    for (const s of [-1, 1]) {
      P.add('beardGreen', new THREE.TorusGeometry(r * 0.18, r * 0.025, 8, 16, Math.PI * 0.75), {
        p: [s * r * 0.16, yc - H * 0.24, r * 0.9],
        r: [0.2, s * 0.3, s > 0 ? -0.4 : -2.7],
      });
    }
    // Curly chin goatee
    P.add('beardGreen', new THREE.SphereGeometry(r * 0.1, 10, 10), {
      p: [0, yc - H * 0.38, r * 0.88],
      s: [1.1, 0.75, 0.6],
    });
  }

  // 4. Long Auspicious Earlobes (长耳垂肩)
  for (const s of [-1, 1]) {
    P.seg(skinKey, [s * r * 0.93, yc + H * 0.02, -r * 0.04], [s * r * 0.96, yc - H * 0.38, r * 0.02], r * 0.13, r * 0.11, 10);
    P.add(skinKey, new THREE.SphereGeometry(r * 0.12, 10, 10), {
      p: [s * r * 0.95, yc - H * 0.42, r * 0.03],
      s: [0.65, 1.35, 0.8],
    });
  }

  // 5. Hair, Ushnisha (螺发肉髻) or Liao Bodhisattva Crown (透雕花冠)
  if (isBuddha) {
    // Mineral-blue hair cap with concentric rows of snail-shell curls (螺发)
    P.add('hairBlue', new THREE.SphereGeometry(r * 0.99, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.56), {
      p: [0, yc + H * 0.06, -r * 0.03],
      r: [-0.14, 0, 0],
    });
    // Prominent Liao Ushnisha (高肉髻)
    P.add('hairBlue', new THREE.SphereGeometry(r * 0.48, 20, 16), {
      p: [0, yc + H * 0.66, -r * 0.02],
      s: [1.05, 0.82, 1.0],
    });
    // Ushnisha-mani sacred jewel on front of ushnisha (肉髻宝珠)
    P.add('gilt', new THREE.SphereGeometry(r * 0.11, 12, 10), {
      p: [0, yc + H * 0.48, r * 0.68],
      s: [1.2, 0.85, 0.7],
    });
    // Discrete 3D snail-shell curls (螺发颗粒) across hair dome & ushnisha
    const curlRings = [
      { y: yc + H * 0.25, rad: r * 0.94, n: 18 },
      { y: yc + H * 0.38, rad: r * 0.86, n: 16 },
      { y: yc + H * 0.50, rad: r * 0.70, n: 13 },
      { y: yc + H * 0.64, rad: r * 0.46, n: 10 },
      { y: yc + H * 0.74, rad: r * 0.32, n: 8 },
    ];
    const curlGeo = new THREE.SphereGeometry(r * 0.085, 7, 6);
    for (const cr of curlRings) {
      for (let i = 0; i < cr.n; i++) {
        const a = (i / cr.n) * Math.PI * 2;
        if (Math.cos(a) > 0.65 && cr.y < yc + H * 0.32) continue; // Keep forehead hairline clean
        P.add('hairBlue', curlGeo, {
          p: [Math.sin(a) * cr.rad, cr.y, Math.cos(a) * cr.rad - r * 0.02],
        });
      }
    }
  } else if (isBodhi) {
    // High Liao chignon + Ornate Filigree Lotus Crown (辽代高髻宝冠 — Ref IMG_9514, 9515)
    P.add('hairBlue', new THREE.SphereGeometry(r * 0.97, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), {
      p: [0, yc + H * 0.06, -r * 0.03],
    });
    // Tall chignon (高发髻)
    P.add('hairBlue', new THREE.CylinderGeometry(r * 0.28, r * 0.38, H * 0.58, 16), {
      p: [0, yc + H * 0.74, 0],
    });
    P.add('hairBlue', new THREE.SphereGeometry(r * 0.28, 14, 12), {
      p: [0, yc + H * 1.02, 0],
    });
    // 5F Southeast Manjusri's iconic Five Chignons (五髻文殊 — Ref IMG_9515)
    if (fiveKnots) {
      for (let k = 0; k < 5; k++) {
        const ang = ((k - 2) / 4) * Math.PI * 0.85;
        P.add('hairBlue', new THREE.SphereGeometry(r * 0.2, 12, 10), {
          p: [Math.sin(ang) * r * 0.62, yc + H * 0.86 + (2 - Math.abs(k - 2)) * H * 0.08, Math.cos(ang) * r * 0.25],
        });
        P.add('gilt', new THREE.SphereGeometry(r * 0.06, 8, 8), {
          p: [Math.sin(ang) * r * 0.62, yc + H * 0.98 + (2 - Math.abs(k - 2)) * H * 0.08, Math.cos(ang) * r * 0.25],
        });
      }
    }
    // Golden Crown Base Rim & Filigree Plaques (宝冠金箍与五叶花瓣冠片)
    P.add('gilt', new THREE.TorusGeometry(r * 0.96, r * 0.075, 10, 32), {
      p: [0, yc + H * 0.32, 0],
      r: [Math.PI / 2, 0, 0],
    });
    for (let k = -2; k <= 2; k++) {
      const ang = k * 0.52;
      const leafH = (1.35 - Math.abs(k) * 0.22) * H * 0.38;
      P.add('gilt', new THREE.ConeGeometry(r * 0.24, leafH, 6), {
        p: [Math.sin(ang) * r * 0.94, yc + H * 0.36 + leafH * 0.45, Math.cos(ang) * r * 0.94],
        r: [0.12, ang, 0],
        s: [1, 1, 0.35],
      });
      // Gem inset on each crown plaque
      P.add(k === 0 ? 'lipRed' : 'robeMineralGreen', new THREE.SphereGeometry(r * 0.075, 10, 8), {
        p: [Math.sin(ang) * r * 0.98, yc + H * 0.44, Math.cos(ang) * r * 0.98],
      });
    }
    // Flowing hair tresses & crown ribbons over shoulders (垂肩发辫与宝缯)
    for (const s of [-1, 1]) {
      P.limb('hairBlue', [
        [s * r * 0.88, yc - H * 0.1, -r * 0.1],
        [s * r * 1.05, yc - H * 0.55, r * 0.08],
        [s * r * 1.15, yc - H * 0.95, r * 0.18],
      ], [r * 0.11, r * 0.09, r * 0.07]);
    }
  }
}

// ============================================================================
// Articulated Hands & Mudras (施无畏印 / 说法印 / 禅定印 / 触地印 / 与愿印 / 智拳印 / 合十)
// ============================================================================
function addHandMudra(P, skinKey, pos, side, mudra, scale) {
  const [x, y, z] = pos;
  const r = 0.095 * scale;
  if (mudra === 'upPalm') {
    // Raised palm facing viewer (Abhaya / Vitarka right hand)
    P.add(skinKey, new THREE.SphereGeometry(r, 12, 10), { p: [x, y, z], s: [0.85, 1.15, 0.45] });
    for (let f = -1.5; f <= 1.5; f += 1) {
      P.seg(skinKey, [x + f * r * 0.36, y + r * 0.4, z], [x + f * r * 0.34, y + r * 1.65, z + r * 0.1], r * 0.19, r * 0.14, 8);
    }
    // Thumb
    P.seg(skinKey, [x - side * r * 0.55, y - r * 0.1, z + r * 0.1], [x - side * r * 0.25, y + r * 0.75, z + r * 0.35], r * 0.22, r * 0.16, 8);
  } else if (mudra === 'downPalm') {
    // Lowered palm facing outward/downward (Varada / left knee hand)
    P.add(skinKey, new THREE.SphereGeometry(r, 12, 10), { p: [x, y, z], s: [0.9, 0.55, 1.1] });
    for (let f = -1.5; f <= 1.5; f += 1) {
      P.seg(skinKey, [x + f * r * 0.35, y - r * 0.1, z + r * 0.4], [x + f * r * 0.32, y - r * 0.75, z + r * 1.45], r * 0.18, r * 0.13, 8);
    }
  } else if (mudra === 'earthTouch') {
    // Bhumisparsha: fingers draped vertically over the right knee touching the lotus throne
    P.add(skinKey, new THREE.SphereGeometry(r, 12, 10), { p: [x, y, z], s: [0.85, 0.9, 0.55] });
    for (let f = -1.5; f <= 1.5; f += 1) {
      P.seg(skinKey, [x + f * r * 0.34, y - r * 0.3, z + r * 0.2], [x + f * r * 0.32, y - r * 1.65, z + r * 0.15], r * 0.18, r * 0.13, 8);
    }
  } else {
    // Lap / Dhyana meditation hand (palm up in lap)
    P.add(skinKey, new THREE.SphereGeometry(r, 12, 10), { p: [x, y, z], s: [1.3, 0.42, 0.85] });
  }
}

function addSeatedArms(P, ySit, bodyH, mudra, skinKey, robeKey, isBodhi = false, isColossal = false) {
  const shY = ySit + bodyH * 0.53;
  const shX = bodyH * 0.24;
  const elY = ySit + bodyH * 0.29;
  const lapY = ySit + bodyH * 0.14;
  const rUpper = bodyH * 0.068;
  const rFore = bodyH * 0.056;
  const rWrist = bodyH * 0.044;
  const sleeveKey = isBodhi ? skinKey : robeKey;

  // Rounded natural shoulder caps & draped sleeve cuffs
  for (const s of [-1, 1]) {
    P.add(robeKey, new THREE.SphereGeometry(rUpper * 1.15, 14, 12), {
      p: [s * shX, shY, -0.02 * bodyH],
      s: [1.05, 0.95, 0.95],
    });
    if (isBodhi) {
      // Golden upper-armlet (臂钏) & wrist bangle (手镯)
      P.add('gilt', new THREE.TorusGeometry(rUpper * 1.05, bodyH * 0.012, 8, 20), {
        p: [s * (shX + 0.02 * bodyH), shY - bodyH * 0.11, 0.02 * bodyH],
        r: [Math.PI / 2, 0, s * 0.18],
      });
    }
  }

  const R = [rUpper, rFore, rWrist];

  if (mudra === 'lap') {
    // Dhyana (Meditation) Mudra: both hands resting palms-up in lap
    for (const s of [-1, 1]) {
      P.limb(sleeveKey, [
        [s * shX, shY, -0.01 * bodyH],
        [s * (shX + 0.05 * bodyH), elY, 0.08 * bodyH],
        [s * 0.07 * bodyH, lapY, 0.25 * bodyH],
      ], R);
      addHandMudra(P, skinKey, [s * 0.04 * bodyH, lapY, 0.27 * bodyH], s, 'lap', bodyH);
    }
  } else if (mudra === 'zhiquan') {
    // 5F Vairocana's Esoteric Wisdom-Fist Mudra (智拳印：双手当胸相抱)
    for (const s of [-1, 1]) {
      P.limb(sleeveKey, [
        [s * shX, shY, -0.01 * bodyH],
        [s * (shX + 0.04 * bodyH), elY + 0.03 * bodyH, 0.1 * bodyH],
        [s * 0.035 * bodyH, ySit + bodyH * 0.39 + (s < 0 ? 0.04 * bodyH : -0.02 * bodyH), 0.24 * bodyH],
      ], R);
    }
    P.add(skinKey, new THREE.SphereGeometry(bodyH * 0.058, 14, 12), {
      p: [0, ySit + bodyH * 0.4, 0.25 * bodyH],
      s: [0.95, 1.35, 0.95],
    });
  } else if (mudra === 'earth') {
    // 3F East Akshobhya: right hand touching the earth over right knee, left hand in lap
    P.limb(sleeveKey, [
      [-shX, shY, -0.01 * bodyH],
      [-(shX + 0.04 * bodyH), elY, 0.11 * bodyH],
      [-0.22 * bodyH, ySit + bodyH * 0.14, 0.28 * bodyH],
    ], R);
    addHandMudra(P, skinKey, [-0.22 * bodyH, ySit + bodyH * 0.11, 0.30 * bodyH], -1, 'earthTouch', bodyH);

    P.limb(sleeveKey, [
      [shX, shY, -0.01 * bodyH],
      [shX + 0.04 * bodyH, elY, 0.08 * bodyH],
      [0.06 * bodyH, lapY, 0.25 * bodyH],
    ], R);
    addHandMudra(P, skinKey, [0.04 * bodyH, lapY, 0.27 * bodyH], 1, 'lap', bodyH);
  } else if (mudra === 'giving') {
    // 3F South Ratnasambhava: right hand extended forward over knee palm-up, left hand in lap
    P.limb(sleeveKey, [
      [-shX, shY, -0.01 * bodyH],
      [-(shX + 0.04 * bodyH), elY, 0.1 * bodyH],
      [-0.2 * bodyH, ySit + bodyH * 0.16, 0.28 * bodyH],
    ], R);
    addHandMudra(P, skinKey, [-0.2 * bodyH, ySit + bodyH * 0.15, 0.31 * bodyH], -1, 'downPalm', bodyH);

    P.limb(sleeveKey, [
      [shX, shY, -0.01 * bodyH],
      [shX + 0.04 * bodyH, elY, 0.08 * bodyH],
      [0.06 * bodyH, lapY, 0.25 * bodyH],
    ], R);
    addHandMudra(P, skinKey, [0.04 * bodyH, lapY, 0.27 * bodyH], 1, 'lap', bodyH);
  } else {
    // Abhaya (Fearlessness) & Vitarka (Teaching): Right hand raised at chest, left hand resting on knee/lap
    const rhX = mudra === 'teach' ? -0.14 * bodyH : -0.19 * bodyH;
    const rhY = ySit + bodyH * 0.42;
    const rhZ = 0.24 * bodyH;
    P.limb(sleeveKey, [
      [-shX, shY, -0.01 * bodyH],
      [-(shX + 0.04 * bodyH), elY - 0.02 * bodyH, 0.11 * bodyH],
      [rhX, rhY, rhZ],
    ], R);
    addHandMudra(P, skinKey, [rhX, rhY + 0.02 * bodyH, rhZ + 0.02 * bodyH], -1, 'upPalm', bodyH);

    // 1F Colossal Sakyamuni holds a golden silk banner ribbon in his right hand (见 IMG_9512)
    if (isColossal) {
      P.seg('gilt', [rhX - 0.03 * bodyH, rhY + 0.02 * bodyH, rhZ + 0.04 * bodyH], [rhX - 0.04 * bodyH, rhY - 0.22 * bodyH, rhZ + 0.05 * bodyH], bodyH * 0.018, bodyH * 0.028, 10);
    }

    // Left hand gracefully resting on left knee (or lap)
    P.limb(sleeveKey, [
      [shX, shY, -0.01 * bodyH],
      [shX + 0.05 * bodyH, elY, 0.1 * bodyH],
      [0.16 * bodyH, ySit + bodyH * 0.18, 0.27 * bodyH],
    ], R);
    addHandMudra(P, skinKey, [0.15 * bodyH, ySit + bodyH * 0.16, 0.30 * bodyH], 1, 'downPalm', bodyH);
  }
}

// ============================================================================
// Seated Buddha / Bodhisattva Torso, Crossed Legs & Liao Jewelry
// ============================================================================
function buildSeatedFigure(P, ySit, bodyH, opts = {}) {
  const {
    skinKey = 'ivorySkin',
    robeKey = 'robeIvory',
    innerKey = 'robeMineralGreen',
    isBuddha = true,
    isBodhi = false,
    halfLotus = false,
    isColossal = false,
    fiveKnots = false,
    isMonk = false,
    mudra = 'teach',
  } = opts;

  // 1. Cross-legged Lotus Posture Base (结跏趺坐 / 半跏趺坐双腿)
  const legW = bodyH * 0.44;
  const legD = bodyH * 0.28;
  const legR = bodyH * 0.115;
  for (const s of [-1, 1]) {
    // Thigh sweeping from hip to knee
    P.seg(robeKey, [s * legW * 0.32, ySit + legR * 1.05, -0.02 * bodyH], [s * legW * 0.92, ySit + legR * 0.92, legD * 0.55], legR * 1.12, legR * 1.05, 16);
    // Rounded knee cap with drapery folds
    P.add(robeKey, new THREE.SphereGeometry(legR * 1.08, 16, 12), {
      p: [s * legW * 0.92, ySit + legR * 0.92, legD * 0.55],
      s: [1.1, 0.88, 1.05],
    });
    // Shin sweeping inward across the front
    if (halfLotus && s === -1) {
      // 4F Manjusri / Samantabhadra Half-Lotus (半跏趺坐): right leg steps down onto a small lotus pad
      P.seg(robeKey, [s * legW * 0.85, ySit + legR * 0.85, legD * 0.65], [s * legW * 0.55, ySit - bodyH * 0.22, legD * 0.95], legR * 0.92, legR * 0.68, 14);
      P.add(skinKey, new THREE.SphereGeometry(legR * 0.55, 12, 10), {
        p: [s * legW * 0.55, ySit - bodyH * 0.24, legD * 1.02],
        s: [0.85, 0.45, 1.35],
      });
      // Small foot-lotus pad (踏足小莲台)
      addLotusThrone(P, bodyH * 0.16, bodyH * 0.09, ySit - bodyH * 0.33, 1);
    } else {
      P.seg(robeKey, [s * legW * 0.88, ySit + legR * 0.88, legD * 0.6], [-s * legW * 0.18, ySit + legR * 0.95, legD * 0.86], legR * 0.95, legR * 0.76, 14);
      // Exposed upturned sole of foot (足心朝上)
      P.add(skinKey, new THREE.SphereGeometry(legR * 0.52, 12, 10), {
        p: [-s * legW * 0.22, ySit + legR * 1.15, legD * 0.72],
        r: [0.2, s * 0.4, s * 0.3],
        s: [1.3, 0.42, 0.82],
      });
    }
  }
  // Central dhoti skirt apron cascading between knees (膝前扇形衣褶)
  P.add(innerKey, new THREE.CylinderGeometry(legW * 0.48, legW * 0.62, legR * 1.4, 20), {
    p: [0, ySit + legR * 0.72, legD * 0.42],
    s: [1, 1, 0.68],
  });

  // 2. Sculpted Torso with Draped Robes (躯干与双领下垂袈裟 / 菩萨天衣)
  const torsoPts = [
    [0.29, 0.08],
    [0.24, 0.20], // Narrowed waist
    [0.22, 0.28],
    [0.27, 0.42], // Broad ribcage
    [0.30, 0.52], // Dignified shoulders
    [0.22, 0.58],
    [0.09, 0.60],
  ].map(([rad, y]) => [rad * bodyH, y * bodyH]);
  P.add(robeKey, drapedLatheGeo(torsoPts, 14, 0.035, 40, 0.74), { p: [0, ySit, 0] });

  // Exposed Golden/Ivory Chest Panel (袒胸 + 僧祇支内衣缘 — Ref IMG_9512, 9513, 9514)
  const chestKey = isBuddha ? 'gilt' : skinKey;
  P.add(chestKey, new THREE.SphereGeometry(bodyH * 0.16, 18, 14), {
    p: [0, ySit + bodyH * 0.42, bodyH * 0.09],
    s: [1.05, 1.18, 0.68],
  });

  // Medallion Waistband & Sash (辽代团花束腰带 — Ref IMG_9512)
  P.add(innerKey, new THREE.CylinderGeometry(bodyH * 0.235, bodyH * 0.245, bodyH * 0.09, 28), {
    p: [0, ySit + bodyH * 0.24, bodyH * 0.01],
    s: [1, 1, 0.78],
  });
  P.add('gilt', new THREE.TorusGeometry(bodyH * 0.238, bodyH * 0.014, 8, 28), {
    p: [0, ySit + bodyH * 0.285, bodyH * 0.01],
    r: [Math.PI / 2, 0, 0],
    s: [1, 0.78, 1],
  });
  if (isColossal) {
    // 1F Sakyamuni's three circular floral medallions on the waist sash (见 IMG_9512)
    for (const ang of [-0.42, 0, 0.42]) {
      P.add('robeVermilion', new THREE.CylinderGeometry(bodyH * 0.036, bodyH * 0.036, bodyH * 0.02, 16), {
        p: [Math.sin(ang) * bodyH * 0.23, ySit + bodyH * 0.24, Math.cos(ang) * bodyH * 0.185],
        r: [Math.PI / 2, 0, -ang],
      });
      P.add('gilt', new THREE.TorusGeometry(bodyH * 0.038, bodyH * 0.006, 6, 16), {
        p: [Math.sin(ang) * bodyH * 0.232, ySit + bodyH * 0.24, Math.cos(ang) * bodyH * 0.188],
        r: [0, ang, 0],
      });
    }
  }

  // Double-Collar Kasaya Lapels (双领下垂式袈裟领缘) for Buddhas, or Jeweled Necklace (璎珞) for Bodhisattvas
  if (isBuddha || isMonk) {
    for (const s of [-1, 1]) {
      P.limb('gilt', [
        [s * bodyH * 0.13, ySit + bodyH * 0.56, bodyH * 0.11],
        [s * bodyH * 0.15, ySit + bodyH * 0.42, bodyH * 0.17],
        [s * bodyH * 0.11, ySit + bodyH * 0.28, bodyH * 0.18],
      ], [bodyH * 0.016, bodyH * 0.018, bodyH * 0.014]);
    }
  }
  if (isBodhi) {
    // Ornate Liao Golden Torque & Beaded Chest Necklace (项圈与胸前珠玉璎珞 — Ref IMG_9515)
    P.add('gilt', new THREE.TorusGeometry(bodyH * 0.135, bodyH * 0.016, 10, 28, Math.PI * 1.15), {
      p: [0, ySit + bodyH * 0.54, bodyH * 0.06],
      r: [Math.PI * 0.58, 0, -Math.PI * 0.075],
    });
    // Central pectoral jewel & U-shaped beaded garland
    for (let i = -4; i <= 4; i++) {
      const a = (i / 4) * 0.65;
      const bx = Math.sin(a) * bodyH * 0.14;
      const by = ySit + bodyH * (0.45 - Math.cos(a) * 0.09);
      const bz = bodyH * 0.195;
      P.add(i === 0 ? 'lipRed' : 'gilt', new THREE.SphereGeometry(bodyH * (i === 0 ? 0.024 : 0.014), 10, 8), {
        p: [bx, by, bz],
      });
    }
    // Flowing celestial silk ribbons (帔帛) looping from shoulders down to the lotus base
    for (const s of [-1, 1]) {
      P.limb('giltWarm', [
        [s * bodyH * 0.24, ySit + bodyH * 0.54, 0.04 * bodyH],
        [s * bodyH * 0.31, ySit + bodyH * 0.34, 0.12 * bodyH],
        [s * bodyH * 0.36, ySit + bodyH * 0.12, 0.18 * bodyH],
        [s * bodyH * 0.42, ySit - bodyH * 0.02, 0.22 * bodyH],
      ], [bodyH * 0.022, bodyH * 0.02, bodyH * 0.018, bodyH * 0.015]);
    }
  }

  // 3. Articulated Arms & Mudra
  addSeatedArms(P, ySit, bodyH, mudra, skinKey, robeKey, isBodhi, isColossal);

  // 4. Head & Crown
  const headH = bodyH * (isColossal ? 0.30 : 0.28);
  buildHead(P, ySit + bodyH * 0.57, headH, {
    skinKey: isBuddha && (isColossal || opts.giltFace) ? 'gilt' : skinKey,
    isBuddha: isBuddha && !isMonk,
    isBodhi: isBodhi && !isMonk,
    isMonk,
    fiveKnots,
    hasBeard: isColossal,
  });
}

// ============================================================================
// Standing Figures: 2F Attendant Bodhisattvas, 4F Disciples (Kasyapa & Ananda), 4F Grooms
// ============================================================================
function buildStandingFigure(P, yFoot, figH, opts = {}) {
  const {
    kind = 'standBodhi', // 'standBodhi' | 'disciple' | 'groom'
    old = false,
    idx = 0,
  } = opts;

  const isBodhi = kind === 'standBodhi';
  const isGroom = kind === 'groom';
  const skinKey = isGroom ? 'tanSkin' : 'ivorySkin';
  const robeKey = isBodhi ? 'robeIvory' : isGroom ? 'robeMineralBlue' : 'robeMonk';
  const innerKey = isBodhi ? 'robeMineralGreen' : 'robeAmber';

  // Bare feet on lotus pad
  for (const s of [-1, 1]) {
    const strideX = isGroom ? s * figH * 0.14 : s * figH * 0.065;
    P.add(skinKey, new THREE.SphereGeometry(figH * 0.04, 10, 8), {
      p: [strideX, yFoot + figH * 0.02, figH * 0.05],
      s: [0.8, 0.45, 1.4],
    });
  }

  // Draped monastic or Bodhisattva robe column
  const skirtPts = [
    [0.14, 0.02],
    [0.15, 0.18],
    [0.13, 0.42],
    [0.11, 0.54], // Waist
    [0.15, 0.72], // Chest
    [0.17, 0.78], // Shoulders
    [0.06, 0.82],
  ].map(([r, y]) => [r * figH, y * figH]);
  P.add(robeKey, drapedLatheGeo(skirtPts, 14, 0.04, 36, 0.76), { p: [0, yFoot, 0] });

  // Inner sash & collar
  P.add(innerKey, new THREE.CylinderGeometry(figH * 0.115, figH * 0.122, figH * 0.07, 24), {
    p: [0, yFoot + figH * 0.53, 0],
    s: [1, 1, 0.78],
  });
  P.add('gilt', new THREE.TorusGeometry(figH * 0.118, figH * 0.01, 8, 24), {
    p: [0, yFoot + figH * 0.565, 0],
    r: [Math.PI / 2, 0, 0],
    s: [1, 0.78, 1],
  });

  // Arms: Anjali (prayer hands at chest) for disciples/Bodhisattvas, or dynamic rein-holding pose for Grooms
  const shY = yFoot + figH * 0.76;
  const shX = figH * 0.15;
  const R = [figH * 0.045, figH * 0.038, figH * 0.03];
  for (const s of [-1, 1]) {
    if (isGroom) {
      // Dynamic martial stance holding the mount's reins (见 IMG_9514 狮奴象奴)
      P.limb(robeKey, [
        [s * shX, shY, 0],
        [s * (shX + 0.05 * figH), yFoot + figH * 0.62, 0.08 * figH],
        [s * 0.12 * figH, yFoot + figH * (s < 0 ? 0.72 : 0.56), 0.16 * figH],
      ], R);
    } else {
      P.limb(robeKey, [
        [s * shX, shY, 0],
        [s * (shX + 0.03 * figH), yFoot + figH * 0.60, 0.08 * figH],
        [s * 0.022 * figH, yFoot + figH * 0.64, 0.15 * figH],
      ], R);
    }
  }
  if (!isGroom) {
    // Clasped Anjali hands at chest
    P.add(skinKey, new THREE.ConeGeometry(figH * 0.035, figH * 0.095, 10), {
      p: [0, yFoot + figH * 0.66, 0.16 * figH],
      r: [0.22, 0, 0],
      s: [0.7, 1, 1.1],
    });
  }

  if (isBodhi) {
    // Necklace & circular head halo
    P.add('gilt', new THREE.TorusGeometry(figH * 0.095, figH * 0.012, 8, 24, Math.PI * 1.1), {
      p: [0, yFoot + figH * 0.77, figH * 0.04],
      r: [Math.PI * 0.58, 0, -Math.PI * 0.05],
    });
    P.add('gilt', new THREE.TorusGeometry(figH * 0.17, figH * 0.012, 10, 32), {
      p: [0, yFoot + figH * 0.9, -figH * 0.08],
    });
  }

  buildHead(P, yFoot + figH * 0.80, figH * 0.18, {
    skinKey,
    isBuddha: false,
    isBodhi,
    isMonk: !isBodhi,
    old,
  });
}

// ============================================================================
// Sacred Mounts: Roaring Blue Lion (青狮) & Six-Tusked White Elephant (六牙白象)
// Modeled after on-site photograph IMG_9514
// ============================================================================
function buildBlueLion(P, yBase, mountH) {
  const L = mountH; // ~0.95m
  const bodyY = yBase + L * 0.56;

  // Four small lotus pads under the paws (四足踏莲)
  const legPos = [
    [-L * 0.34, L * 0.36],
    [L * 0.34, L * 0.36],
    [-L * 0.30, -L * 0.34],
    [L * 0.30, -L * 0.34],
  ];
  for (const [lx, lz] of legPos) {
    P.add('lotusGreen', new THREE.CylinderGeometry(L * 0.14, L * 0.11, L * 0.08, 16), { p: [lx, yBase + L * 0.04, lz] });
    P.add('giltWarm', new THREE.TorusGeometry(L * 0.13, L * 0.02, 6, 16), { p: [lx, yBase + L * 0.08, lz], r: [Math.PI / 2, 0, 0] });
    // Muscular splayed lion leg
    P.seg('lionBlue', [lx * 0.78, bodyY, lz * 0.85], [lx, yBase + L * 0.09, lz], L * 0.125, L * 0.095, 12);
    // Paw
    P.add('lionBlue', new THREE.SphereGeometry(L * 0.11, 10, 8), { p: [lx, yBase + L * 0.10, lz + L * 0.03], s: [1.0, 0.55, 1.25] });
  }

  // Broad muscular lion torso & chest
  P.seg('lionBlue', [0, bodyY + L * 0.06, L * 0.32], [0, bodyY - L * 0.02, -L * 0.36], L * 0.33, L * 0.27, 18);
  // Ornate brocade saddle blanket (华丽障泥鞍帕)
  P.add('robeVermilion', new THREE.CylinderGeometry(L * 0.34, L * 0.36, L * 0.45, 18), {
    p: [0, bodyY + L * 0.05, 0],
    r: [Math.PI / 2, 0, 0],
    s: [1.08, 1.0, 0.85],
  });
  P.add('gilt', new THREE.TorusGeometry(L * 0.35, L * 0.025, 8, 24), {
    p: [0, bodyY + L * 0.06, L * 0.33],
  });

  // Lion Head & Curled Mane Ring (威武狮首与卷毛狮鬃)
  const headY = bodyY + L * 0.20;
  const headZ = L * 0.52;
  P.add('lionBlue', new THREE.SphereGeometry(L * 0.25, 18, 14), { p: [0, headY, headZ], s: [1.08, 0.96, 1.05] });
  // Broad snout & open roaring mouth
  P.add('lionBlue', new THREE.SphereGeometry(L * 0.16, 14, 10), { p: [0, headY - L * 0.06, headZ + L * 0.18], s: [1.25, 0.75, 0.95] });
  P.add('lipRed', new THREE.SphereGeometry(L * 0.11, 10, 8), { p: [0, headY - L * 0.11, headZ + L * 0.17], s: [1.2, 0.45, 0.8] });
  // Ring of spiral mane curls around the head
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    P.add('lionMane', new THREE.SphereGeometry(L * 0.085, 8, 8), {
      p: [Math.cos(a) * L * 0.25, headY + Math.sin(a) * L * 0.23, headZ - L * 0.06],
    });
  }
  // Golden eyes & brow
  for (const s of [-1, 1]) {
    P.add('gilt', new THREE.SphereGeometry(L * 0.045, 10, 8), { p: [s * L * 0.12, headY + L * 0.05, headZ + L * 0.20] });
  }
  // Golden chest bell (胸前金铃)
  P.add('gilt', new THREE.SphereGeometry(L * 0.065, 10, 10), { p: [0, bodyY - L * 0.05, L * 0.46] });
  // Upturned tail
  P.limb('lionMane', [[0, bodyY + L * 0.05, -L * 0.45], [0, bodyY + L * 0.28, -L * 0.60], [0, bodyY + L * 0.38, -L * 0.54]], [L * 0.055, L * 0.045, L * 0.075]);
}

function buildWhiteElephant(P, yBase, mountH) {
  const L = mountH; // ~0.95m
  const bodyY = yBase + L * 0.56;

  // Four lotus pads + stout pillar-like elephant legs
  const legPos = [
    [-L * 0.30, L * 0.34],
    [L * 0.30, L * 0.34],
    [-L * 0.28, -L * 0.34],
    [L * 0.28, -L * 0.34],
  ];
  for (const [lx, lz] of legPos) {
    P.add('lotusGreen', new THREE.CylinderGeometry(L * 0.14, L * 0.11, L * 0.08, 16), { p: [lx, yBase + L * 0.04, lz] });
    P.add('giltWarm', new THREE.TorusGeometry(L * 0.13, L * 0.02, 6, 16), { p: [lx, yBase + L * 0.08, lz], r: [Math.PI / 2, 0, 0] });
    P.seg('elephantWhite', [lx * 0.85, bodyY, lz * 0.9], [lx, yBase + L * 0.08, lz], L * 0.135, L * 0.12, 14);
  }

  // Rounded white elephant body & patterned saddle blanket
  P.seg('elephantWhite', [0, bodyY + L * 0.04, L * 0.30], [0, bodyY, -L * 0.36], L * 0.35, L * 0.32, 20);
  P.add('robeVermilion', new THREE.CylinderGeometry(L * 0.36, L * 0.37, L * 0.46, 18), {
    p: [0, bodyY + L * 0.05, 0],
    r: [Math.PI / 2, 0, 0],
    s: [1.08, 1.0, 0.88],
  });
  P.add('gilt', new THREE.TorusGeometry(L * 0.35, L * 0.022, 8, 24), { p: [0, bodyY + L * 0.04, L * 0.32] });

  // Noble Elephant Head, Fan Ears, Long Trunk & Six Ivory Tusks (六牙白象 — Ref IMG_9514)
  const headY = bodyY + L * 0.15;
  const headZ = L * 0.50;
  P.add('elephantWhite', new THREE.SphereGeometry(L * 0.24, 18, 14), { p: [0, headY, headZ], s: [1.02, 1.05, 0.98] });
  // Golden crown & harness on forehead
  P.add('gilt', new THREE.SphereGeometry(L * 0.07, 10, 8), { p: [0, headY + L * 0.22, headZ + L * 0.06] });
  // Fan-shaped ears
  for (const s of [-1, 1]) {
    P.add('elephantWhite', new THREE.SphereGeometry(L * 0.19, 12, 10), {
      p: [s * L * 0.25, headY, headZ - L * 0.04],
      r: [0, -s * 0.35, 0],
      s: [0.28, 1.05, 0.85],
    });
    // Three curved tusks on each side = Six Tusks (六牙)!
    for (let t = 0; t < 3; t++) {
      const tx = s * L * (0.10 + t * 0.042);
      const ty = headY - L * (0.10 + t * 0.02);
      P.limb('gilt', [
        [tx, ty, headZ + L * 0.14],
        [tx * 1.25, ty - L * 0.12, headZ + L * 0.28],
        [tx * 1.35, ty - L * 0.06, headZ + L * 0.36],
      ], [L * 0.024, L * 0.018, L * 0.008]);
    }
  }
  // Long graceful trunk reaching down toward a front lotus pad
  P.limb('elephantWhite', [
    [0, headY - L * 0.04, headZ + L * 0.18],
    [0, headY - L * 0.24, headZ + L * 0.28],
    [0, yBase + L * 0.26, headZ + L * 0.32],
    [0, yBase + L * 0.12, headZ + L * 0.26],
  ], [L * 0.095, L * 0.075, L * 0.058, L * 0.048]);
}

// ============================================================================
// Floor 1 Colossal Sumeru Pedestal with 8 Vajra Warriors & 8 Coiled Dragon Columns
// Modeled after on-site photograph IMG_9512
// ============================================================================
function buildColossalPedestal(P, baseW, baseH) {
  const r = baseW * 0.5; // 4.24m
  const h = baseH;       // ~2.8m total pedestal + lotus

  // 1. Octagonal Stepped Sumeru Base (八角束腰须弥座)
  const rot8 = [0, Math.PI / 8, 0];
  P.add('sumeruStone', new THREE.CylinderGeometry(r * 0.96, r * 1.0, h * 0.12, 8), { p: [0, h * 0.06, 0], r: rot8 });
  P.add('robeVermilion', new THREE.CylinderGeometry(r * 0.88, r * 0.94, h * 0.08, 8), { p: [0, h * 0.16, 0], r: rot8 });
  // Recessed octagonal waist (束腰)
  P.add('sumeruWood', new THREE.CylinderGeometry(r * 0.68, r * 0.68, h * 0.30, 8), { p: [0, h * 0.35, 0], r: rot8 });
  // Upper projecting cornice slab Supporting the Lotus Throne
  P.add('sumeruStone', new THREE.CylinderGeometry(r * 0.92, r * 0.76, h * 0.10, 8), { p: [0, h * 0.54, 0], r: rot8 });
  P.add('gilt', new THREE.TorusGeometry(r * 0.86, h * 0.018, 8, 8), { p: [0, h * 0.56, 0], r: [Math.PI / 2, 0, Math.PI / 8] });

  // 2. Eight Coiled Dragon Columns + Eight Lotus-Bearing Vajra Warriors (八大托举力士与盘龙柱 — Ref IMG_9512)
  const wy0 = h * 0.18;
  const wH = h * 0.34; // ~0.95m warrior height in waist
  for (let i = 0; i < 8; i++) {
    const aCol = ((i + 0.5) / 8) * Math.PI * 2;
    const colR = r * 0.78;
    const cx = Math.sin(aCol) * colR;
    const cz = Math.cos(aCol) * colR;
    // Red-and-gold coiled dragon column at each corner of the waist
    P.seg('robeVermilion', [cx, wy0, cz], [cx, wy0 + wH, cz], wH * 0.08, wH * 0.08, 10);
    P.add('gilt', new THREE.TorusGeometry(wH * 0.1, wH * 0.025, 6, 14), { p: [cx, wy0 + wH * 0.35, cz], r: [Math.PI / 2 + 0.3, aCol, 0] });
    P.add('gilt', new THREE.TorusGeometry(wH * 0.1, wH * 0.025, 6, 14), { p: [cx, wy0 + wH * 0.68, cz], r: [Math.PI / 2 - 0.3, aCol, 0] });

    // Mighty Vajra Warrior (力士) on each of the 8 faces holding up the lotus cornice
    const aFace = (i / 8) * Math.PI * 2;
    const wr = r * 0.78;
    const wx = Math.sin(aFace) * wr;
    const wz = Math.cos(aFace) * wr;
    const nx = Math.sin(aFace);
    const nz = Math.cos(aFace);
    const tx = Math.cos(aFace);
    const tz = -Math.sin(aFace);

    // Wide martial horse-stance legs
    for (const s of [-1, 1]) {
      P.seg('robeMineralBlue', [wx + tx * s * wH * 0.14, wy0 + wH * 0.38, wz + tz * s * wH * 0.14], [wx + tx * s * wH * 0.22, wy0, wz + tz * s * wH * 0.22], wH * 0.08, wH * 0.06, 8);
    }
    // Muscular torso & armored dhoti
    P.seg('tanSkin', [wx, wy0 + wH * 0.35, wz], [wx + nx * wH * 0.04, wy0 + wH * 0.68, wz + nz * wH * 0.04], wH * 0.15, wH * 0.18, 10);
    P.add('robeVermilion', new THREE.SphereGeometry(wH * 0.16, 10, 8), { p: [wx, wy0 + wH * 0.36, wz], s: [1, 0.7, 1] });
    // Raised arms bearing the upper cornice slab
    for (const s of [-1, 1]) {
      P.seg('tanSkin', [wx + tx * s * wH * 0.18, wy0 + wH * 0.66, wz + tz * s * wH * 0.18], [wx + tx * s * wH * 0.25 + nx * wH * 0.06, wy0 + wH * 0.96, wz + tz * s * wH * 0.25 + nz * wH * 0.06], wH * 0.065, wH * 0.055, 8);
    }
    // Warrior head
    P.add('tanSkin', new THREE.SphereGeometry(wH * 0.13, 10, 10), { p: [wx + nx * wH * 0.08, wy0 + wH * 0.80, wz + nz * wH * 0.08] });
    P.add('hairBlue', new THREE.SphereGeometry(wH * 0.08, 8, 8), { p: [wx + nx * wH * 0.06, wy0 + wH * 0.93, wz + nz * wH * 0.06] });
  }

  // 3. Double-Tier Polychrome Lotus Throne on top (重层彩绘仰莲座)
  addLotusThrone(P, r * 0.92, h * 0.42, h * 0.56, 3);
}

// Standard Octagonal Sumeru + Lotus Pedestal for Floors 2, 3, 4, 5 (Ref IMG_9513, 9514, 9515)
function buildSumeruLotusPedestal(P, r, h, seatAnimal = null) {
  const rot8 = [0, Math.PI / 8, 0];
  // Lower stepped octagonal base
  P.add('sumeruWood', new THREE.CylinderGeometry(r * 0.92, r * 0.98, h * 0.16, 8), { p: [0, h * 0.08, 0], r: rot8 });
  P.add('robeIvory', new THREE.CylinderGeometry(r * 0.82, r * 0.88, h * 0.08, 8), { p: [0, h * 0.20, 0], r: rot8 });
  // Waist with corner colonnettes
  P.add('sumeruWood', new THREE.CylinderGeometry(r * 0.62, r * 0.62, h * 0.24, 8), { p: [0, h * 0.36, 0], r: rot8 });
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    P.seg('robeIvory', [Math.sin(a) * r * 0.72, h * 0.24, Math.cos(a) * r * 0.72], [Math.sin(a) * r * 0.72, h * 0.48, Math.cos(a) * r * 0.72], r * 0.04, r * 0.04, 8);
  }
  // 3F Directional Buddhas' sacred mount reliefs inside the waist niches (象/马/孔雀/迦楼罗座 — Ref IMG_9513)
  if (seatAnimal) {
    for (let i = -1; i <= 1; i++) {
      const a = i * (Math.PI / 4);
      P.add('ivorySkin', new THREE.SphereGeometry(r * 0.11, 10, 8), {
        p: [Math.sin(a) * r * 0.68, h * 0.35, Math.cos(a) * r * 0.68],
        s: [0.9, 1.1, 1.2],
      });
    }
  }
  P.add('robeIvory', new THREE.CylinderGeometry(r * 0.86, r * 0.72, h * 0.08, 8), { p: [0, h * 0.52, 0], r: rot8 });
  // Polychrome Lotus Throne
  addLotusThrone(P, r * 0.88, h * 0.46, h * 0.54, 2);
}

// ============================================================================
// Build Complete Statue Group for Any of the 26 Sculptures
// ============================================================================
// Asset-backed statues never receive legacy procedural pedestals, mounts or figures.
// Missing parts remain absent until a matching asset is available.
const usesOwnAsset = (sp) => !!(sp.glb || sp.cutout);

function addGlow(g, H) {
  const glow = new THREE.Sprite(haloMat.clone());
  glow.position.y = H * 0.55;
  glow.scale.setScalar(H * 1.45);
  glow.material.opacity = 0;
  g.add(glow);
  g.userData.glow = glow;
  return g;
}

function buildStatue(sp, M, idx) {
  if (usesOwnAsset(sp)) return addGlow(new THREE.Group(), sp.assetHeight ?? sp.height);
  const P = new Parts(M);
  const H = sp.height;

  // Authentic Liao color scheme per floor & icon type
  let robeKey = 'robeIvory';
  let innerKey = 'robeMineralGreen';
  let skinKey = sp.gilt ? 'gilt' : 'ivorySkin';

  if (sp.base === 'colossal') {
    robeKey = 'robeVermilion';
    innerKey = 'robeMineralGreen';
    skinKey = 'gilt';
  } else if (sp.kind === 'buddha') {
    // 2F, 3F, 4F, 5F Buddhas: aged ivory-ochre robes with gilded chests & faces (Ref IMG_9513, 9514, 9515)
    robeKey = idx % 2 === 0 ? 'robeIvory' : 'robeAmber';
    innerKey = 'robeVermilion';
  } else if (sp.kind === 'bodhi') {
    const bodhiRobes = ['robeIvory', 'robeMineralGreen', 'robeAmber', 'robeVermilion'];
    robeKey = bodhiRobes[idx % bodhiRobes.length];
    innerKey = idx % 2 === 0 ? 'robeVermilion' : 'robeMineralBlue';
  }

  if (sp.base === 'colossal') {
    // Floor 1 Colossal Sakyamuni (Total 10.32m, Figure 5.54m, Base 2.8m)
    const baseH = 2.82;
    const bodyH = H - baseH - 0.6;
    buildColossalPedestal(P, 8.48, baseH);
    if (!sp.glb) {
      buildSeatedFigure(P, baseH, bodyH, {
        skinKey: 'gilt',
        robeKey: 'robeVermilion',
        innerKey: 'robeMineralGreen',
        isBuddha: true,
        isColossal: true,
        giltFace: true,
        mudra: sp.mudra,
      });
      addMandorlaBackscreen(P, baseH + bodyH * 0.05, bodyH * 1.02, bodyH * 0.56, -bodyH * 0.18, false);
    }
  } else if (sp.mount) {
    // Riding Bodhisattvas (2F & 4F Manjusri on Lion, Samantabhadra on Elephant)
    const baseH = H * 0.08;
    const mountH = H * 0.34;
    const lotusH = H * 0.11;
    const ySit = baseH + mountH + lotusH;
    const bodyH = H - ySit;

    P.add('sumeruWood', new THREE.CylinderGeometry(H * 0.28, H * 0.31, baseH, 8), { p: [0, baseH / 2, 0], r: [0, Math.PI / 8, 0] });
    if (sp.mount === 'lion') buildBlueLion(P, baseH, mountH);
    else buildWhiteElephant(P, baseH, mountH);

    if (!sp.glb) {
      addLotusThrone(P, H * 0.24, lotusH, baseH + mountH * 0.92, 2);
      buildSeatedFigure(P, ySit - H * 0.03, bodyH, {
        skinKey: 'ivorySkin',
        robeKey,
        innerKey,
        isBuddha: false,
        isBodhi: true,
        halfLotus: !!sp.halfLotus,
        mudra: sp.mudra,
      });
      addMandorlaBackscreen(P, ySit, bodyH * 0.95, bodyH * 0.48, -bodyH * 0.16, false);
    }
  } else if (sp.kind === 'standBodhi' || sp.kind === 'disciple' || sp.kind === 'groom') {
    // Standing Bodhisattvas (2F), Disciples (4F Mahakasyapa & Ananda), or Grooms (4F)
    const baseH = sp.kind === 'groom' ? H * 0.08 : H * 0.16;
    if (sp.kind === 'groom') {
      P.add('sumeruWood', new THREE.CylinderGeometry(H * 0.24, H * 0.26, baseH, 8), { p: [0, baseH / 2, 0] });
    } else {
      addLotusThrone(P, H * 0.20, baseH, 0, 2);
    }
    buildStandingFigure(P, baseH, H - baseH, {
      kind: sp.kind,
      old: !!sp.old,
      idx,
    });
  } else {
    // Seated Buddhas (2F, 3F, 4F, 5F) & 5F Eight Great Bodhisattvas Mandala
    const isBodhi = sp.kind === 'bodhi';
    const baseH = H * 0.29;
    const baseR = H * 0.34;
    const bodyH = H - baseH;

    buildSumeruLotusPedestal(P, baseR, baseH, sp.seat);
    buildSeatedFigure(P, baseH, bodyH, {
      skinKey: sp.gilt ? 'gilt' : 'ivorySkin',
      robeKey,
      innerKey,
      isBuddha: !isBodhi,
      isBodhi,
      fiveKnots: !!sp.fiveKnots,
      isMonk: !!sp.monk,
      giltFace: !!sp.gilt || !isBodhi,
      mudra: sp.mudra,
    });
    // Sculpted Flame Mandorla Backscreen behind all Buddhas & circular head halo behind Bodhisattvas
    addMandorlaBackscreen(P, baseH + bodyH * 0.04, bodyH * 1.04, bodyH * 0.56, -bodyH * 0.19, !isBodhi);
  }

  return addGlow(P.toGroup(), H);
}

const gltfLoader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();

// Tripo models face +X, have their feet at y = 0 and are normalised to height 1 (rotated to face +Z below).
// Photo cut-outs are drawn as a flat card fixed to the statue's facing ("fake 3D").
function attachAsset(g, sp) {
  const H = sp.assetHeight ?? sp.height;
  if (sp.glb) {
    g.userData.assetState = 'loading';
    gltfLoader.load(
      assetUrl(`models/statues/${sp.glb}.glb`),
      (gltf) => {
        const model = prepareStatueModel(gltf.scene, H);
        model.traverse((o) => {
          if (!o.isMesh) return;
          o.userData.statue = g;
        });
        g.add(model);
        g.userData.assetState = 'loaded';
        g.userData.assetModel = model;
      },
      undefined,
      (err) => {
        g.userData.assetState = 'failed';
        console.warn(`[statues] failed to load ${sp.glb}`, err);
      }
    );
  } else if (sp.cutout) {
    texLoader.load(assetUrl(`statues/${sp.cutout}.png`), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      // A flat card fixed in the statue's own facing direction: it keeps its orientation when the
      // camera orbits, and shows a dimmed copy of the photo from behind (vanishes edge-on).
      const w = (H * tex.image.width) / tex.image.height;
      const geo = new THREE.PlaneGeometry(w, H).translate(0, H / 2, 0);
      const front = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.06 }));
      const back = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.06, color: 0x8c8379, side: THREE.BackSide })
      );
      back.position.z = -0.01;
      for (const m of [front, back]) {
        m.userData.statue = g;
        g.add(m);
      }
      g.userData.glow.renderOrder = -1; // keep the additive halo behind the photo, not washing it out
    });
  }
}

// Soft golden backlight halo sprite
const haloTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 232, 175, 0.72)');
  g.addColorStop(0.4, 'rgba(255, 200, 115, 0.25)');
  g.addColorStop(1, 'rgba(255, 180, 90, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const haloMat = new THREE.SpriteMaterial({
  map: haloTex,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

// ============================================================================
// Statue System & "Buddhas Ascend" (万佛出塔) Spiral Orbit Controller
// ============================================================================
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const bez = (a, b, c, d, t, out) => {
  const u = 1 - t;
  return out
    .copy(a)
    .multiplyScalar(u * u * u)
    .addScaledVector(b, 3 * u * u * t)
    .addScaledVector(c, 3 * u * t * t)
    .addScaledVector(d, t * t * t);
};
const faceToRotY = (az) => Math.PI - (az * Math.PI) / 180;

export function createStatueSystem(towerGroup, info) {
  const M = createStatueMaterials();
  const root = new THREE.Group();
  root.name = 'statues';
  towerGroup.add(root);

  const brights = info.layers.filter((l) => l.kind === 'bright');
  const items = [];
  let idx = 0;

  for (const F of FLOORS) {
    const L = info.levels[F.level - 1];
    const floorY = (F.level === 1 ? 0 : L.floorY) + F.altar + (F.altarCap ?? 0);
    F.statues.forEach((sp) => {
      const g = buildStatue(sp, M, idx);
      attachAsset(g, sp);
      g.userData.info = { ...sp, level: F.level, floor: F.title, floorNote: F.note };
      g.traverse((o) => (o.userData.statue = g));
      g.visible = false;
      root.add(g);
      items.push({
        g,
        sp,
        level: F.level,
        home: new THREE.Vector3(sp.pos[0], floorY, sp.pos[1]),
        homeRot: faceToRotY(sp.face),
        p: 0,
        wait: 0,
        order: idx,
      });
      idx++;
    });
  }

  const N = items.length;
  items.forEach((it, i) => {
    const t = i / (N - 1);
    it.slotA = i * ((Math.PI * 2 * 3.2) / N) + Math.PI * 0.75;
    it.slotY = 9 + t * 54;
    it.slotR = 26 + (i % 2) * 2;
    it.floatScale = THREE.MathUtils.clamp(8 / (it.sp.assetHeight ?? it.sp.height), 1, 3.2);
  });

  // Golden celestial light motes
  const PN = 700;
  const pos = new Float32Array(PN * 3);
  const rnd = [];
  for (let i = 0; i < PN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 22;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.random() * 72;
    pos[i * 3 + 2] = Math.sin(a) * r;
    rnd.push(0.4 + Math.random() * 1.2);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({
    color: 0xffdf9a,
    size: 0.45,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const motes = new THREE.Points(pg, pm);
  motes.visible = false;
  root.add(motes);

  const state = { target: 0, spin: 0, time: 0, floor: null, showHome: false };
  const DUR = 2.4;
  const tmp = { a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(), r: new THREE.Vector3() };

  function toggle(on) {
    state.target = on ?? (state.target ? 0 : 1);
    if (state.target) state.floor = null;
    items.forEach((it) => {
      it.wait = state.target ? it.order * 0.05 : (N - 1 - it.order) * 0.03;
    });
    return state.target === 1;
  }

  function setFloor(floorNum = null, showAllHome = false) {
    state.floor = floorNum;
    state.showHome = showAllHome;
    if (floorNum !== null || showAllHome) {
      state.target = 0;
      items.forEach((it) => {
        it.wait = 0;
        it.p = 0;
      });
    }
  }

  function update(dt) {
    state.time += dt;
    let any = 0;
    let sum = 0;
    for (const it of items) {
      if (it.wait > 0) it.wait -= dt;
      else it.p = THREE.MathUtils.clamp(it.p + (state.target ? dt : -dt) / DUR, 0, 1);
      any = Math.max(any, it.p);
      sum += it.p;
    }
    const level = sum / N;
    if (level > 0.5) state.spin += dt * 0.05 * Math.min(1, level * 1.5);
    const hasHome = state.floor !== null || state.showHome;
    root.visible = any > 0 || hasHome;
    if (!root.visible) return;

    for (const it of items) {
      const g = it.g;
      const onActiveFloor = state.showHome || state.floor === it.level;
      g.visible = it.p > 0 || onActiveFloor;
      if (!g.visible) continue;
      const e = ease(it.p);
      const ang = it.slotA + state.spin;
      const bob = Math.sin(state.time * 0.8 + it.order) * 0.35 * e;
      const slot = tmp.d.set(Math.cos(ang) * it.slotR, it.slotY + bob, Math.sin(ang) * it.slotR);
      const radial = tmp.r.set(Math.cos(ang), 0, Math.sin(ang));
      const home = tmp.a.copy(it.home);
      home.y += brights[it.level - 1]?.group.position.y ?? 0;
      const p1 = tmp.b.copy(home).addScaledVector(radial, 10).add(new THREE.Vector3(0, 2, 0));
      const p2 = tmp.c.copy(slot).addScaledVector(radial, -2).add(new THREE.Vector3(0, -5, 0));
      bez(home, p1, p2, slot, e, g.position);
      const out = Math.atan2(radial.x, radial.z);
      let d = out - it.homeRot;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      g.rotation.y = it.homeRot + d * e;
      g.scale.setScalar(1 + (it.floatScale - 1) * e);
      const homeGlow = onActiveFloor ? 0.32 : 0;
      g.userData.glow.material.opacity = Math.max(homeGlow, THREE.MathUtils.smoothstep(e, 0.35, 1) * 0.52);
    }

    motes.visible = level > 0.01 || state.floor !== null;
    motes.material.opacity = Math.max(state.floor !== null ? 0.35 : 0, level * 0.9);
    const a = pg.attributes.position.array;
    for (let i = 0; i < PN; i++) {
      a[i * 3 + 1] += dt * rnd[i] * 0.8;
      if (a[i * 3 + 1] > 72) a[i * 3 + 1] = 0;
    }
    pg.attributes.position.needsUpdate = true;
    motes.rotation.y = state.spin * 0.6;
  }

  return {
    root,
    toggle,
    setFloor,
    update,
    items,
    status: {
      get done() { return items.filter(it => it.g.userData.assetState === 'loaded').length; },
      get failed() { return items.filter(it => it.g.userData.assetState === 'failed').length; },
      total: N,
    },
    get out() {
      return state.target === 1;
    },
    get floor() {
      return state.floor;
    },
  };
}
