import * as THREE from 'three';
import { rng } from './lib/kit.js';

// ---------- canvas 程序化纹理 ----------

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat = 1, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 简单值噪声（多层叠加），用于斑驳
function noiseLayer(ctx, w, h, seed, cells, alpha, colors) {
  // 低分辨率随机色块经双线性放大 → 平滑斑驳（避免硬边方块）
  const [small, sctx] = canvas(cells);
  const r = rng(seed);
  for (let y = 0; y < cells; y++)
    for (let x = 0; x < cells; x++) {
      sctx.fillStyle = colors[Math.floor(r() * colors.length)];
      sctx.globalAlpha = r();
      sctx.fillRect(x, y, 1, 1);
    }
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = alpha;
  ctx.drawImage(small, 0, 0, w, h);
  ctx.restore();
}

function blotches(ctx, w, h, seed, n, rMin, rMax, color, alpha) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = rMin + r() * (rMax - rMin);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha * (0.4 + r() * 0.6);
    ctx.fillStyle = g;
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

// 风化木纹（灰褐偏红，参考照片 9483/9541）
function woodTexture(base, seed) {
  const W = 512;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, W);
  const r = rng(seed);
  // 纵向木纹
  for (let i = 0; i < 260; i++) {
    const x = r() * W;
    const wv = 0.5 + r() * 2.5;
    ctx.strokeStyle = r() < 0.5 ? 'rgba(30,18,10,0.22)' : 'rgba(255,235,210,0.10)';
    ctx.lineWidth = wv;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= W; y += 32) ctx.lineTo(x + Math.sin(y * 0.02 + i) * 3 * r(), y);
    ctx.stroke();
  }
  noiseLayer(ctx, W, W, seed + 1, 16, 0.18, ['#2a1a10', '#c9b49a', '#6a4632']);
  blotches(ctx, W, W, seed + 2, 40, 20, 90, 'rgba(190,180,165,1)', 0.25); // 褪色发白
  blotches(ctx, W, W, seed + 3, 30, 10, 60, 'rgba(20,12,8,1)', 0.25);
  return tex(c);
}

// 板瓦底面：沿坡向的瓦沟（u 方向周期 = 一垄瓦宽），带青苔与风化
function tileBedTexture() {
  const W = 512;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = '#74726c';
  ctx.fillRect(0, 0, W, W);
  const r = rng(11);
  const rows = 3; // 纹理宽度 = 3 垄
  for (let i = 0; i < rows; i++) {
    const x0 = (i * W) / rows;
    const g = ctx.createLinearGradient(x0, 0, x0 + W / rows, 0);
    g.addColorStop(0, '#4a4843');
    g.addColorStop(0.5, '#83817a');
    g.addColorStop(1, '#4a4843');
    ctx.fillStyle = g;
    ctx.fillRect(x0, 0, W / rows, W);
    // 板瓦搭接横缝
    for (let y = 0; y < W; y += W / 8) {
      ctx.fillStyle = 'rgba(30,30,28,0.45)';
      ctx.fillRect(x0, y + r() * 4, W / rows, 3);
    }
  }
  blotches(ctx, W, W, 12, 50, 8, 50, 'rgba(160,160,150,1)', 0.35);
  blotches(ctx, W, W, 13, 25, 6, 30, 'rgba(70,80,55,1)', 0.25); // 苔
  return tex(c);
}

// 筒瓦：浅灰、风化斑点
function tileTexture() {
  const W = 256;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = '#8a8883';
  ctx.fillRect(0, 0, W, W);
  for (let y = 0; y < W; y += W / 4) {
    ctx.fillStyle = 'rgba(40,40,38,0.5)';
    ctx.fillRect(0, y, W, 4);
  }
  blotches(ctx, W, W, 21, 40, 5, 30, 'rgba(190,188,180,1)', 0.35);
  blotches(ctx, W, W, 22, 20, 4, 18, 'rgba(60,62,50,1)', 0.3);
  return tex(c);
}

// 红墙：赭红、上部褪色、下部返碱
function redWallTexture() {
  const W = 512;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = '#6c342b';
  ctx.fillRect(0, 0, W, W);
  noiseLayer(ctx, W, W, 31, 32, 0.12, ['#7b2e22', '#b5604c', '#8a3a2c']);
  blotches(ctx, W, W, 32, 30, 20, 120, 'rgba(200,150,130,1)', 0.18);
  blotches(ctx, W, W, 33, 20, 10, 60, 'rgba(60,20,15,1)', 0.15);
  return tex(c);
}

// 栱眼壁 / 灰白抹灰（带淡彩画痕迹）
function plasterTexture() {
  const W = 256;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = '#a8a091';
  ctx.fillRect(0, 0, W, W);
  blotches(ctx, W, W, 41, 25, 10, 60, 'rgba(120,130,120,1)', 0.25);
  blotches(ctx, W, W, 42, 15, 10, 40, 'rgba(150,90,70,1)', 0.15);
  noiseLayer(ctx, W, W, 43, 32, 0.08, ['#ffffff', '#8a8070']);
  return tex(c);
}

// 砖墙（台基）
function brickTexture() {
  const W = 512;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = '#7d7466';
  ctx.fillRect(0, 0, W, W);
  const r = rng(51);
  const bh = W / 16;
  const bw = W / 4;
  for (let row = 0; row < 16; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let i = -1; i < 5; i++) {
      const v = 128 + r() * 30;
      ctx.fillStyle = `rgb(${v + 8},${v + 4},${v - 4})`;
      ctx.fillRect(i * bw + off + 2, row * bh + 2, bw - 4, bh - 4);
    }
  }
  blotches(ctx, W, W, 52, 30, 20, 90, 'rgba(60,58,52,1)', 0.2);
  blotches(ctx, W, W, 53, 30, 20, 90, 'rgba(220,215,200,1)', 0.15);
  return tex(c);
}

// 石材条石 / 地面铺装
function pavingTexture(base = 112, n = 8) {
  const W = 512;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = '#3e3b37';
  ctx.fillRect(0, 0, W, W);
  const r = rng(61 + n);
  const s = W / n;
  for (let y = 0; y < n; y++) {
    const off = y % 2 ? s / 2 : 0;
    for (let x = -1; x < n; x++) {
      const v = base + r() * 22;
      ctx.fillStyle = `rgb(${v + 6},${v},${v - 12})`;
      ctx.fillRect(x * s + off + 1.5, y * s + 1.5, s - 3, s - 3);
    }
  }
  noiseLayer(ctx, W, W, 63, 24, 0.18, ['#2c2a26', '#b0aca2']);
  blotches(ctx, W, W, 62, 30, 20, 100, 'rgba(40,38,34,1)', 0.15);
  return tex(c);
}

// 院外地面：灰黄土与杂草斑块
function dirtTexture() {
  const W = 512;
  const [c, ctx] = canvas(W);
  ctx.fillStyle = '#6f6556';
  ctx.fillRect(0, 0, W, W);
  noiseLayer(ctx, W, W, 81, 32, 0.5, ['#5a5245', '#857a68', '#4f5a3c']);
  noiseLayer(ctx, W, W, 82, 96, 0.25, ['#3e382f', '#9a8f7c']);
  blotches(ctx, W, W, 83, 40, 15, 70, 'rgba(70,85,50,1)', 0.3);
  return tex(c);
}

// 格子窗 / 格子门（含边框、障水板），alpha 通透处露出室内暗面
export function latticeTexture(kind = 'window') {
  const W = 512;
  const H = 512;
  const [c, ctx] = canvas(W, H);
  const wood = '#5a3a2a';
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, W, H);
  const r = rng(kind === 'door' ? 71 : 72);
  // 四扇
  const leaves = 4;
  const leafW = W / leaves;
  for (let l = 0; l < leaves; l++) {
    const x0 = l * leafW;
    const top = kind === 'door' ? 0.06 : 0.12;
    const bot = kind === 'door' ? 0.62 : 0.6;
    const y0 = H * top;
    const y1 = H * bot;
    const inset = 14;
    // 方格棂
    ctx.clearRect(x0 + inset, y0, leafW - inset * 2, y1 - y0);
    ctx.fillStyle = wood;
    const cell = 17;
    for (let x = x0 + inset; x <= x0 + leafW - inset; x += cell) ctx.fillRect(x - 2, y0, 4, y1 - y0);
    for (let y = y0; y <= y1; y += cell) ctx.fillRect(x0 + inset, y - 2, leafW - inset * 2, 4);
    // 障水板
    ctx.fillStyle = '#4a2f22';
    ctx.fillRect(x0 + inset, H * (bot + 0.04), leafW - inset * 2, H * (0.96 - bot - 0.04));
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x0 + 4, 4, leafW - 8, H - 8);
  }
  // 风化
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const d = (r() - 0.5) * 30;
    img.data[i] += d;
    img.data[i + 1] += d * 0.9;
    img.data[i + 2] += d * 0.8;
  }
  ctx.putImageData(img, 0, 0);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// ---------- 三平面映射：实例化长方体无需 UV ----------
function triplanar(mat, scale = 1) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.tpScale = { value: scale };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vTpPos;\nvarying vec3 vTpNrm;',
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 tpW = vec4(transformed, 1.0);
        vec3 tpN = objectNormal;
        #ifdef USE_INSTANCING
          tpW = instanceMatrix * tpW;
          tpN = mat3(instanceMatrix) * tpN;
        #endif
        tpW = modelMatrix * tpW;
        vTpPos = tpW.xyz;
        vTpNrm = normalize(mat3(modelMatrix) * tpN);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vTpPos;\nvarying vec3 vTpNrm;\nuniform float tpScale;',
      )
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec3 bw = pow(abs(vTpNrm), vec3(4.0));
          bw /= (bw.x + bw.y + bw.z);
          vec4 tx = texture2D(map, vTpPos.zy * tpScale);
          vec4 ty = texture2D(map, vTpPos.xz * tpScale);
          vec4 tz = texture2D(map, vTpPos.xy * tpScale);
          diffuseColor *= tx * bw.x + ty * bw.y + tz * bw.z;
        #endif`,
      );
  };
  mat.customProgramCacheKey = () => `tp${scale}`;
  return mat;
}

// ---------- 材质表 ----------
export function createMaterials() {
  const woodMap = woodTexture('#715d4c', 101);
  const woodDarkMap = woodTexture('#463b32', 102);
  const columnMap = woodTexture('#6a3e31', 103);

  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });

  const m = {
    wood: triplanar(std({ map: woodMap, roughness: 0.82 }), 0.9),
    woodDark: triplanar(std({ map: woodDarkMap, roughness: 0.9 }), 0.9),
    column: triplanar(std({ map: columnMap, roughness: 0.8 }), 0.7),
    plaster: triplanar(std({ map: plasterTexture(), roughness: 0.95 }), 0.6),
    redwall: triplanar(std({ map: redWallTexture(), roughness: 0.95 }), 0.25),
    brick: triplanar(std({ map: brickTexture(), roughness: 0.95 }), 0.45),
    stone: triplanar(std({ map: pavingTexture(150, 4), roughness: 0.92 }), 0.35),
    ridge: triplanar(std({ map: tileTexture(), color: 0x8a8a86, roughness: 0.9 }), 1.2),
    iron: std({ color: 0x46423e, roughness: 0.6, metalness: 0.45 }),
    ironChain: std({ color: 0x1e1e20, roughness: 0.6, metalness: 0.6 }),
    tileBed: std({ map: tileBedTexture(), roughness: 0.92, side: THREE.DoubleSide }),
    tile: std({ map: tileTexture(), roughness: 0.88 }),
    fascia: triplanar(std({ map: woodDarkMap, roughness: 0.9 }), 0.9),
    soffit: triplanar(std({ map: woodDarkMap, roughness: 0.95, side: THREE.DoubleSide }), 0.9),
    window: std({ map: latticeTexture('window'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 }),
    door: std({ map: latticeTexture('door'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 }),
    interior: std({ color: 0x0d0907, roughness: 1 }),
    ground: std({ map: pavingTexture(96, 8), roughness: 0.95 }),
  };
  m.ground.map = m.ground.map.clone();
  m.ground.map.repeat.set(200, 200);
  m.ground.map.needsUpdate = true;
  // 周边环境
  m.bark = triplanar(std({ map: woodTexture('#4a3f36', 104), roughness: 0.95 }), 1.5);
  m.court = std({ map: pavingTexture(112, 8), roughness: 0.95 });
  m.court.map.repeat.set(152 / 7.5, 186 / 7.5);
  m.ground.map = dirtTexture();
  m.ground.map.repeat.set(120, 120);
  m.ground.color.set(0xffffff);
  m.townWall = std({ color: 0x6b6158, roughness: 0.95 });
  m.townRoof = std({ color: 0x3f4043, roughness: 0.9 });
  return m;
}
