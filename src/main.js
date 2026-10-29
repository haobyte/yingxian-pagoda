import { assetUrl } from './asset-url.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createSkyDome } from './sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createMaterials } from './materials.js';
import { buildPagoda } from './pagoda.js';
import { buildSite } from './builders/site.js';
import { createDeformer } from './deform.js';
import { createStatueSystem } from './builders/statues.js';
import { createSectionView } from './section-view.js';
import { FLOORS } from './statues-data.js';
import { t, misc, getLang, setLang, onLangChange, applyStatic, chapterText, stepText, statueText, floorText, photoText, eventText } from './i18n.js';
import { EVENTS, COLUMN_H, columnOffsetMM, angleDeg, deformScale } from './timeline.js';
import { createOverlays } from './overlays.js';
import { CHAPTERS, SoundEngine } from './director.js';

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 6000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.9;
controls.minDistance = 2.5;
controls.maxDistance = 600;

// ---------- 天空与光照 ----------
const sky = createSkyDome();
scene.add(sky);
const su = sky.material.uniforms;

const sun = new THREE.DirectionalLight(0xfff3e2, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
const sc = sun.shadow.camera;
sc.left = -110; sc.right = 110; sc.top = 110; sc.bottom = -110; sc.near = 10; sc.far = 500;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
sun.target.position.set(0, 30, 0);
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xbcd3ef, 0x9a8c7a, 0.6); // 含广场地面反射
scene.add(hemi);

const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;
const TIMES = [
  // Oct 1 Yingxian (39.6°N) solar azimuth clockwise from North (0°)
  { name: 'Noon', elev: 47, azim: 182, color: 0xfff4e4, k: 3.4, zenith: '#1a4ed2', horizon: '#9cbdf0', fog: 0xb4c8e2, nightGlow: 0 },
  { name: 'Morning', elev: 32, azim: 130, color: 0xfff0dc, k: 3.0, zenith: '#2a60c4', horizon: '#b8cde8', fog: 0xb8cde8, nightGlow: 0 },
  { name: 'Dusk', elev: 8, azim: 252, color: 0xffa860, k: 2.5, zenith: '#2b4b82', horizon: '#f0b98a', fog: 0xc9a88e, nightGlow: 0.35 },
  { name: 'Sacred Twilight', elev: 2, azim: 265, color: 0xff8a46, k: 1.35, zenith: '#0f1c36', horizon: '#4a3d54', fog: 0x26283a, nightGlow: 1.0 },
];
let timeIdx = 0;
const envScene = new THREE.Scene();
const envSky = createSkyDome();
envSky.scale.setScalar(100);
envScene.add(envSky);

// ---------- Ground ----------
const mats = createMaterials();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), mats.ground);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
scene.fog = new THREE.Fog(0xb4c8e2, 180, 1400);

// ---------- Pagoda ----------
const t0 = performance.now();
const { root, info, tower } = buildPagoda(mats);
scene.add(root);
const site = buildSite(mats);
scene.add(site);
const buildMs = performance.now() - t0;

function setSun({ elev, azim, color, k, zenith, horizon, fog, nightGlow = 0 }) {
  const phi = THREE.MathUtils.degToRad(elev);
  const az = THREE.MathUtils.degToRad(azim);
  // East = +x, South = +z
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(phi), Math.sin(phi), -Math.cos(az) * Math.cos(phi));
  for (const u of [su, envSky.material.uniforms]) {
    u.sunDir.value.copy(dir);
    u.zenith.value.set(zenith);
    u.horizon.value.set(horizon);
    u.sunColor.value.set(color);
  }
  sun.position.copy(dir).multiplyScalar(260).add(sun.target.position);
  sun.color.set(color);
  sun.intensity = k;
  if (scene.fog && fog) scene.fog.color.setHex(fog);
  envRT?.dispose();
  envRT = pmrem.fromScene(envScene, 0, 0.1, 1000);
  scene.environment = envRT.texture;
  scene.environmentIntensity = nightGlow > 0.5 ? 0.85 : 1.35;
  info.setCutaway({ nightGlow });
}
setSun(TIMES[0]);

// ---------- Post-processing ----------
const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
gtao.updateGtaoMaterial({ radius: 2.5, distanceExponent: 1.4, thickness: 3.0, scale: 1.2, samples: 16 });
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
gtao.blendIntensity = 0.85;
// Hide Sprites (statue halos) during GTAO normal/depth pass
{
  const base = gtao._overrideVisibility.bind(gtao);
  gtao._overrideVisibility = function () {
    base();
    this.scene.traverse((o) => {
      if (o.isSprite && o.visible) {
        o.visible = false;
        this._visibilityCache.push(o);
      }
    });
  };
}
composer.addPass(gtao);
composer.addPass(new OutputPass());

// ---------- Camera Views ----------
const VIEWS = {
  'South Eye-Level': { pos: [0, 1.6, 78], target: [0, 30, 0] },
  'SW Close-Up': { pos: [-20, 1.8, 36], target: [0, 26, 0] },
  'Dougong Macro': { pos: [-9, 18, 22], target: [-4, 15.5, 11] },
  'Bird’s-Eye': { pos: [70, 80, 90], target: [0, 28, 0] },
  'Panorama': { pos: [55, 22, 95], target: [0, 30, 0] },
  'Temple Gate': { pos: [6, 1.7, 112], target: [0, 24, 0] },
  'Precinct Aerial': { pos: [130, 120, 170], target: [0, 8, -15] },
};
let tween = null;
function flyTo(pos, target, dur = 1.8, fromPos = null, fromTarget = null) {
  tween = {
    from: {
      pos: fromPos ? new THREE.Vector3(...fromPos) : camera.position.clone(),
      target: fromTarget ? new THREE.Vector3(...fromTarget) : controls.target.clone(),
    },
    to: { pos: new THREE.Vector3(...pos), target: new THREE.Vector3(...target) },
    t: 0,
    dur,
  };
  if (fromPos) camera.position.set(...fromPos);
  if (fromTarget) controls.target.set(...fromTarget);
}
function goView(name, instant = false) {
  const v = VIEWS[name];
  if (!v) return;
  if (instant) {
    camera.position.set(...v.pos);
    controls.target.set(...v.target);
    tween = null;
    return;
  }
  flyTo(v.pos, v.target, 1.6);
}
const viewsEl = document.getElementById('views');
const viewBtns = [];
for (const name of Object.keys(VIEWS)) {
  const b = document.createElement('button');
  b.className = 'tool-btn';
  b.textContent = misc(name);
  b.onclick = () => goView(name);
  viewsEl.appendChild(b);
  viewBtns.push([name, b]);
}
goView('Panorama', true);

const rotateBtn = document.getElementById('rotate');
function setAutoRotate(on) {
  controls.autoRotate = on;
  controls.autoRotateSpeed = 0.55;
  rotateBtn.classList.toggle('on', on);
}
rotateBtn.onclick = () => setAutoRotate(!controls.autoRotate);

const aoBtn = document.getElementById('ao');
aoBtn.onclick = () => setAO(!gtao.enabled);
const lowEnd = matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
function setAO(on) {
  gtao.enabled = on;
  aoBtn.classList.toggle('on', on);
}
if (lowEnd) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  sun.shadow.mapSize.set(2048, 2048);
  setAO(false);
}
const perfWatch = { frames: 0, sum: 0, level: 0 };
function watchPerf(dt) {
  if (perfWatch.level >= 2 || document.hidden) return;
  perfWatch.frames++;
  if (perfWatch.frames < 30) return;
  perfWatch.sum += dt;
  if (perfWatch.frames < 150) return;
  const avg = perfWatch.sum / 120;
  perfWatch.frames = 0;
  perfWatch.sum = 0;
  if (avg < 1 / 30) return;
  perfWatch.level++;
  if (perfWatch.level === 1 && gtao.enabled) setAO(false);
  else {
    perfWatch.level = 2;
    renderer.setPixelRatio(1);
    resize();
  }
  console.info(`[Quality] Avg frame ${(avg * 1000).toFixed(0)} ms → step ${perfWatch.level}`);
}

const timeBtn = document.getElementById('time');
function setTimeIdx(idx) {
  timeIdx = ((idx % TIMES.length) + TIMES.length) % TIMES.length;
  setSun(TIMES[timeIdx]);
  timeBtn.textContent = t('tools.time', { name: misc(TIMES[timeIdx].name) });
}
timeBtn.onclick = () => setTimeIdx(timeIdx + 1);

const xrayBtn = document.getElementById('xrayBtn');
xrayBtn.onclick = () => {
  if (sectionView.enabled) setSectionView(false);
  const next = !info.cutawayState.xray;
  if (next) {
    setStatuesOut(false);
    statues.setFloor(null, false);
    liftAboveFloor = null;
  }
  info.setCutaway({ xray: next, floor: null });
  overlays.setMode({ struct: next });
  xrayBtn.classList.toggle('on', next);
};

// ---------- 倾斜时间轴：年份 → 变形倍数 ----------
const setDeform = createDeformer(tower, info);
const overlays = createOverlays(scene, tower, info, setDeform);

const tl = {
  year: 2026,
  rate: 2,
  mult: 1,
  playing: false,
  cur: 0,
  curM: 1,
};
const Y0 = 1056;
const YK = 1930; // 1056–1930 压缩在左侧 12%
const Y1 = 2300;
const KU = 0.12;
const u2y = (u) => (u < KU ? Y0 + (u / KU) * (YK - Y0) : YK + ((u - KU) / (1 - KU)) * (Y1 - YK));
const y2u = (y) => (y < YK ? ((y - Y0) / (YK - Y0)) * KU : KU + ((y - YK) / (Y1 - YK)) * (1 - KU));
const tlSlider = document.getElementById('tlSlider');
const tlChart = document.getElementById('tlChart');
function drawChart() {
  const W = tlChart.clientWidth || 700;
  const H = 52;
  const maxMM = 1250;
  const X = (y) => y2u(y) * W;
  const Yp = (mm) => H - (mm / maxMM) * (H - 6);
  let past = '';
  let fut = '';
  for (let y = Y0; y <= Y1; y += y < YK ? 20 : 1) {
    const p = `${X(y).toFixed(1)},${Yp(columnOffsetMM(y, tl.rate)).toFixed(1)} `;
    if (y <= 2020) past += p;
    if (y >= 2020) fut += p;
  }
  const grid = [0, 15, 20].map((deg) => {
    const mm = Math.tan((deg * Math.PI) / 180) * COLUMN_H * 1000;
    return `<line x1="0" x2="${W}" y1="${Yp(mm)}" y2="${Yp(mm)}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="2 3"/><text x="${W - 2}" y="${Yp(mm) - 2}" fill="rgba(255,255,255,0.45)" font-size="9" text-anchor="end">${deg}°</text>`;
  });
  const dots = EVENTS.map((e) => {
    const c = e.kind === 'measured' ? '#7cc487' : e.kind === 'est' ? '#d6aa60' : '#bbb';
    return `<circle cx="${X(e.year)}" cy="${Yp(e.mm)}" r="3.2" fill="${c}"><title>${e.year} ${eventText(e)}</title></circle>`;
  });
  const now = X(tl.year);
  tlChart.innerHTML = `${grid.join('')}
    <polyline points="${past}" fill="none" stroke="#e8d9bf" stroke-width="1.6"/>
    <polyline points="${fut}" fill="none" stroke="#d6aa60" stroke-width="1.6" stroke-dasharray="4 3"/>
    <line x1="${X(2026)}" x2="${X(2026)}" y1="0" y2="${H}" stroke="rgba(255,255,255,0.35)"/>
    <text x="${X(2026) + 3}" y="9" fill="rgba(255,255,255,0.6)" font-size="9">${t('tl.now')}</text>
    ${dots.join('')}
    <line x1="${now}" x2="${now}" y1="0" y2="${H}" stroke="#fff" stroke-width="1.5"/>
    <text x="${X(Y0)}" y="${H + 10}" fill="rgba(255,255,255,0.5)" font-size="9">1056</text>
    <text x="${X(1950)}" y="${H + 10}" fill="rgba(255,255,255,0.5)" font-size="9" text-anchor="middle">1950</text>
    <text x="${X(2100)}" y="${H + 10}" fill="rgba(255,255,255,0.5)" font-size="9" text-anchor="middle">2100</text>
    <text x="${X(Y1)}" y="${H + 10}" fill="rgba(255,255,255,0.5)" font-size="9" text-anchor="end">2300</text>`;
}
function updateTimelineUI() {
  const y = Math.round(tl.year);
  const mm = columnOffsetMM(y, tl.rate);
  const topCm = (deformScale(y, tl.rate) * 65).toFixed(0);
  document.getElementById('tlYear').textContent = t('tl.year', { y });
  document.getElementById('tlRead').innerHTML = t('tl.read', { mm: mm.toFixed(0), deg: angleDeg(mm).toFixed(1), cm: topCm });
  let ev = EVENTS.filter((e) => e.year <= y).pop();
  let html = `<span class="tag ${ev.kind}">${t('tl.' + ev.kind)}</span>${ev.year}: ${eventText(ev)}`;
  if (y > 2020) {
    const yearsTo = (deg) => Math.round((Math.tan((deg * Math.PI) / 180) * COLUMN_H * 1000 - 576.4) / tl.rate);
    html = `<span class="tag future">${t('tl.projection')}</span>${t('tl.future', { rate: tl.rate, y15: yearsTo(15), y20: yearsTo(20) })}`;
  } else if (y > 1935 && y < 2004) {
    html += `<br><span style="opacity:.75">${t('tl.interp')}</span>`;
  }
  if (tl.mult === 1 && y > 1935) html += `<br><span style="opacity:.75">${t('tl.trueTilt')}</span>`;
  document.getElementById('tlEvent').innerHTML = html;
  drawChart();
}
function setYear(y) {
  tl.year = Math.max(Y0, Math.min(Y1, y));
  tlSlider.value = Math.round(y2u(tl.year) * 1000);
  updateTimelineUI();
}
function setMult(m) {
  tl.mult = m;
  document.querySelectorAll('#tl [data-mult]').forEach((x) => x.classList.toggle('on', +x.dataset.mult === m));
  updateTimelineUI();
}
tlSlider.oninput = (e) => {
  tl.playing = false;
  document.getElementById('tlPlay').textContent = t('tl.play');
  setYear(u2y(+e.target.value / 1000));
};
document.getElementById('tlPlay').onclick = (e) => {
  tl.playing = !tl.playing;
  if (tl.playing && tl.year >= Y1 - 1) setYear(1930);
  e.target.textContent = tl.playing ? t('tl.pause') : t('tl.play');
};
for (const b of document.querySelectorAll('#tl [data-rate]')) {
  b.onclick = () => {
    tl.rate = +b.dataset.rate;
    document.querySelectorAll('#tl [data-rate]').forEach((x) => x.classList.toggle('on', x === b));
    updateTimelineUI();
  };
}
for (const b of document.querySelectorAll('#tl [data-mult]')) {
  b.onclick = () => setMult(+b.dataset.mult);
}
window.addEventListener('resize', drawChart);
const tlEl = document.getElementById('tl');
const foldBtn = document.getElementById('tlFold');
const cinemaBarEl = document.getElementById('cinemaBar');
// Keep the tower clear of the bottom timeline card: while it is open, shift the picture up by half its height.
function applyViewShift() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const shift = tlEl.classList.contains('folded') ? 0 : Math.round(tlEl.offsetHeight * 0.5);
  if (shift) camera.setViewOffset(w, h, 0, shift, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
const setFold = (f) => {
  tlEl.classList.toggle('folded', f);
  foldBtn.textContent = f ? t('tl.expand') : t('tl.collapse');
  cinemaBarEl.classList.toggle('above-tl', !f);
  if (!f) drawChart();
  applyViewShift();
};
foldBtn.onclick = () => setFold(!tlEl.classList.contains('folded'));
setFold(true);

// Central Axis: dashed white plumb line vs red deformed spine
const axisN = 80;
const axisTop = info.height - tower.position.y;
const axisGeo = new THREE.BufferGeometry();
axisGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((axisN + 1) * 3), 3));
const axisLine = new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ color: 0xff3b30, depthTest: false, transparent: true }));
const refLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, axisTop + 3, 0)]),
  new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1, gapSize: 0.6, depthTest: false, transparent: true, opacity: 0.8 }),
);
refLine.computeLineDistances();
for (const l of [axisLine, refLine]) {
  l.renderOrder = 10;
  l.frustumCulled = false;
  l.visible = false;
  tower.add(l);
}
function updateAxis(s, m) {
  const a = axisGeo.attributes.position.array;
  for (let i = 0; i <= axisN; i++) {
    const y = -1 + ((axisTop + 4) * i) / axisN;
    const d = setDeform.field(0, y, 0, s, m);
    a[i * 3] = d.x;
    a[i * 3 + 1] = y + d.y;
    a[i * 3 + 2] = d.z;
  }
  axisGeo.attributes.position.needsUpdate = true;
  const show = (m > 1.5 || overlays.tiltGroup.visible) && explode < 0.02 && liftAmount < 0.02;
  axisLine.visible = refLine.visible = show;
}

function updateDeform(dt) {
  if (tl.playing) {
    setYear(tl.year + dt * (tl.year < 1935 ? 200 : 25));
    if (tl.year >= Y1) {
      tl.playing = false;
      document.getElementById('tlPlay').textContent = t('tl.play');
    }
  }
  const ts = deformScale(tl.year, tl.rate);
  const tm = tl.mult;
  if (Math.abs(ts - tl.cur) < 1e-4 && Math.abs(tm - tl.curM) < 1e-4) return;
  const k = Math.min(1, dt * 6);
  tl.cur += (ts - tl.cur) * k;
  tl.curM += (tm - tl.curM) * k;
  if (Math.abs(ts - tl.cur) < 0.002) tl.cur = ts;
  if (Math.abs(tm - tl.curM) < 0.01) tl.curM = tm;
  setDeform(tl.cur, tl.curM);
  updateAxis(tl.cur, tl.curM);
}
setYear(2026);
tl.cur = deformScale(2026, tl.rate);
tl.curM = 1;
setDeform(tl.cur, 1);

// ---------- 9-Layer Explosion + Upper-Story Lift for Per-Floor Buddha Inspection ----------
const LAYER_GAP = 7.5;
const LIFT_HEIGHT = 11.5;
const layers = info.layers;
for (const L of layers) {
  L.el = document.createElement('div');
  L.el.className = `lbl ${L.kind}`;
  document.body.appendChild(L.el);
}
function renderLayerLabels() {
  for (const L of layers) {
    const note = t(`layer.${L.kind}`);
    L.el.innerHTML = `${misc(L.name)}<small>${note}</small>`;
  }
}
renderLayerLabels();
let explode = 0;
let explodeTarget = 0;
let liftAboveFloor = null;
let liftAmount = 0;
const explodeEl = document.getElementById('explode');
const explodeBtn = document.getElementById('explodeBtn');
explodeEl.oninput = (e) => {
  if (sectionView.enabled) setSectionView(false);
  explodeTarget = +e.target.value;
  explodeBtn.classList.toggle('on', explodeTarget > 0.1);
};
explodeBtn.onclick = () => {
  if (sectionView.enabled) setSectionView(false);
  explodeTarget = explodeTarget > 0.5 ? 0 : 1;
  explodeEl.value = explodeTarget;
  explodeBtn.classList.toggle('on', explodeTarget > 0.1);
  if (explodeTarget) {
    liftAboveFloor = null;
    flyTo([105, 48, 165], [0, 58, 0], 1.8);
  }
};
const _v = new THREE.Vector3();
const _r = new THREE.Vector3();
function updateLayers(dt) {
  explode += (explodeTarget - explode) * Math.min(1, dt * 5);
  if (Math.abs(explodeTarget - explode) < 1e-3) explode = explodeTarget;
  const liftTarget = liftAboveFloor !== null ? 1 : 0;
  liftAmount += (liftTarget - liftAmount) * Math.min(1, dt * 5);
  if (Math.abs(liftTarget - liftAmount) < 1e-3) liftAmount = liftTarget;

  const splitIdx = liftAboveFloor !== null ? (liftAboveFloor - 1) * 2 : 999;
  layers.forEach((L, i) => {
    const expOff = i * LAYER_GAP * explode;
    const liftOff = i > splitIdx ? LIFT_HEIGHT * liftAmount : 0;
    L.group.position.y = expOff + liftOff;
    L.wall.visible = L.kind === 'dark' ? explode < 0.03 && !info.cutawayState.xray : !info.cutawayState.xray;
  });
  const show = explode > 0.2 && !match;
  _r.setFromMatrixColumn(camera.matrixWorld, 0);
  for (const [i, L] of layers.entries()) {
    if (!show) {
      L.el.style.opacity = 0;
      continue;
    }
    _v.copy(_r).multiplyScalar(19);
    _v.y = (L.y0 + L.y1) / 2 + L.group.position.y;
    _v.project(camera);
    const x = (_v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
    L.el.style.transform = `translate(${x}px, ${y}px) translate(0, -50%)`;
    L.el.style.opacity = _v.z < 1 ? Math.min(1, (explode - 0.2) * 3) : 0;
  }
}

// ---------- Sacred Statues System ----------
const statues = createStatueSystem(tower, info);
const sectionView = createSectionView(tower, renderer);
const sectionBtn = document.getElementById('sectionBtn');
const sectionPanel = document.getElementById('sectionPanel');
let sectionAO = false;
function sectionCamera(floor = 0) {
  if (!floor) {
    flyTo([0, 33, 112], [0, 31, 0], 1.5);
  } else {
    const item = statues.items.find(item => item.level === floor);
    const height = item.sp.assetHeight ?? item.sp.height;
    const y = tower.position.y + item.home.y + height * 0.55;
    flyTo([0, y - 0.4, floor === 1 ? 16 : 13], [0, y, 0], 1.3);
  }
  sectionPanel.querySelectorAll('[data-section-floor]').forEach(b => {
    b.classList.toggle('on', Number(b.dataset.sectionFloor) === floor);
  });
}
function setSectionView(on) {
  if (on === sectionView.enabled) return;
  if (on) {
    setDocPlaying(false);
    setAutoRotate(false);
    setFold(true);
    tl.playing = false;
    document.getElementById('tlPlay').textContent = t('tl.play');
    explode = explodeTarget = liftAmount = 0;
    liftAboveFloor = null;
    explodeEl.value = 0;
    explodeBtn.classList.remove('on');
    setStatuesOut(false);
    statues.setFloor(null, true);
    info.setCutaway({ floor: null, xray: false, section: true });
    xrayBtn.classList.remove('on');
    overlays.setMode({});
    setPins([]);
    sectionAO = gtao.enabled;
    setAO(false); // GTAO's override depth material does not retain per-object clipping.
    sectionView.setEnabled(true);
    updateLayers(0);
    statues.update(0);
    sectionCamera();
  } else {
    sectionView.setEnabled(false);
    info.setCutaway({ section: false, floor: null, xray: false });
    statues.setFloor(null, false);
    setAO(sectionAO);
  }
  sectionBtn.classList.toggle('on', on);
  aoBtn.disabled = on;
  sectionBtn.setAttribute('aria-pressed', String(on));
  sectionPanel.hidden = !on;
}
sectionBtn.onclick = () => setSectionView(!sectionView.enabled);
sectionPanel.querySelectorAll('[data-section-floor]').forEach(b => {
  b.onclick = () => sectionCamera(Number(b.dataset.sectionFloor));
});
document.getElementById('sectionClose').onclick = () => setSectionView(false);
const topStatueBtn = document.getElementById('topStatueBtn');
function setStatuesOut(out, moveCam = false) {
  if (out && sectionView.enabled) setSectionView(false);
  statues.toggle(out ? 1 : 0);
  if (topStatueBtn) {
    topStatueBtn.textContent = out ? t('btn.buddhasBack') : t('btn.buddhas');
    topStatueBtn.classList.toggle('on', !!out);
  }
  if (out && moveCam && !match) {
    // Restore full pagoda exterior if it was in a floor-cutaway state so statues orbit the complete tower
    liftAboveFloor = null;
    info.setCutaway({ floor: null, xray: false });
    overlays.setMode({});
    // Include the uppermost orbiting figures and their full 3D bases in the frame.
    flyTo([86, 40, 123], [0, 40, 0], 1.8);
  }
}
if (topStatueBtn) topStatueBtn.onclick = () => setStatuesOut(!statues.out, true);

// Focus camera on an individual statue (works both inside the altar and in spiral orbit)
function focusStatueItem(it) {
  if (!it) return;
  it.g.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  it.g.getWorldPosition(wp);
  const h = (it.sp.assetHeight ?? it.sp.height) * it.g.scale.x;
  const lookAt = wp.clone().add(new THREE.Vector3(0, h * 0.52, 0));
  const rotY = it.g.rotation.y;
  const forward = new THREE.Vector3(Math.sin(rotY), 0.12, Math.cos(rotY)).normalize();
  const dist = Math.max(4.8, h * 1.65);
  const camPos = lookAt.clone().addScaledVector(forward, dist);
  flyTo(camPos.toArray(), lookAt.toArray(), 1.4);
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const pickAt = (e, targets) => {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects(targets, true)[0];
};
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY, t: performance.now() }));
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || match) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  const quick = performance.now() - downAt.t < 400;
  downAt = null;
  if (moved > 6 || !quick) return;
  if (statues.out || statues.floor !== null) {
    const hitStatue = pickAt(e, [statues.root]);
    const g = hitStatue?.object.userData.statue;
    if (g) {
      const it = statues.items.find((x) => x.g === g);
      if (it) {
        focusStatueItem(it);
        return;
      }
    }
  }
});
// Hover tooltip for statues
const tip = document.getElementById('tip');
let hoverT = 0;
renderer.domElement.addEventListener('pointermove', (e) => {
  if ((!statues.out && statues.floor === null) || performance.now() - hoverT < 60) return;
  hoverT = performance.now();
  const hit = pickAt(e, [statues.root]);
  const g = hit?.object.userData.statue;
  if (!g) {
    tip.style.opacity = 0;
    renderer.domElement.style.cursor = '';
    return;
  }
  const d = g.userData.info;
  const sx = statueText(d);
  tip.innerHTML = `<b>${sx.name}</b><br><span class="m">${floorText({ level: d.level, title: d.floor, note: d.floorNote }).title} · ${t('tip.height', { h: d.height })}</span>${sx.note ? `<br><span class="m">${sx.note}</span>` : ''}<br><span class="m" style="color:#e5b968">${t('tip.zoom')}</span>`;
  tip.style.left = `${e.clientX + 14}px`;
  tip.style.top = `${e.clientY + 10}px`;
  tip.style.opacity = 1;
  renderer.domElement.style.cursor = 'pointer';
});

// ============================================================================
// 3D Spatial Callout Pins
// ============================================================================
const pinsContainer = document.getElementById('pinsContainer');
let activePins = [];
function setPins(pinList = []) {
  pinsContainer.innerHTML = '';
  activePins = pinList.map((p) => {
    const el = document.createElement('div');
    el.className = `pin3d ${p.kind || 'gold'}`;
    el.innerHTML = `<div class="pt">${p.title}</div>${p.sub ? `<div class="ps">${p.sub}</div>` : ''}`;
    pinsContainer.appendChild(el);
    return { ...p, vec: new THREE.Vector3(...p.pos), el };
  });
}
function updatePins() {
  if (!activePins.length || match) return;
  for (const p of activePins) {
    _v.copy(p.vec);
    _v.project(camera);
    if (_v.z > 1 || _v.x < -1.05 || _v.x > 1.05 || _v.y < -1.05 || _v.y > 1.05) {
      p.el.style.opacity = 0;
      continue;
    }
    const x = (_v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
    p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(14px, -50%)`;
    p.el.style.opacity = 1;
  }
}

// ============================================================================
// 5-Chapter Narrative Director & Continuous Playback
// ============================================================================
const sound = new SoundEngine();
const docState = {
  chIdx: 0,
  stepIdx: 0,
  playing: false,
  stepElapsed: 0,
};

const chapterTabsEl = document.getElementById('chapterTabs');
const storyChapterLabel = document.getElementById('storyChapterLabel');
const storyStepCounter = document.getElementById('storyStepCounter');
const storyTitle = document.getElementById('storyTitle');
const storySummary = document.getElementById('storySummary');
const chapterExtra = document.getElementById('chapterExtra');
const uiPanel = document.getElementById('ui');
const playDocBtn = document.getElementById('playDocBtn');
const cinemaTextEl = document.getElementById('cinemaText');
const cinemaFillEl = document.getElementById('cinemaFill');

const chapterTabEls = CHAPTERS.map((ch, idx) => {
  const btn = document.createElement('button');
  btn.className = 'ch-tab';
  btn.onclick = () => {
    goChapterStep(idx, 0, true);
  };
  chapterTabsEl.appendChild(btn);
  return btn;
});
function renderChapterTabs() {
  CHAPTERS.forEach((ch, i) => {
    chapterTabEls[i].innerHTML = `<span class="num">${ch.num}</span><span>${chapterText(ch).title}</span>`;
  });
}
renderChapterTabs();

// ============================================================================
// On-Site Archival Photograph Lightbox
// ============================================================================
const ARCHIVAL_PHOTOS = {
  floor1: {
    key: 'floor1',
    label: '1F · Colossal Sakyamuni',
    src: assetUrl('ref/f1-shakyamuni-patrick20242023-front.jpg'),
    title: 'Floor 1 · Sakyamuni Buddha, Frontal Photograph',
    sub: 'Photograph: Patrick20242023, 26 May 2024. Wikimedia Commons, CC BY-SA 4.0. Original photograph; no AI enhancement.',
  },
  floor3: {
    key: 'floor3',
    label: '3F · Four Directional Buddhas',
    src: assetUrl('ref/floor3_statue.jpg'),
    title: 'Floor 3 · Four Directional Buddhas (Akshobhya, Ratnasambhava, Amitabha & Amoghasiddhi)',
    sub: 'On-site archival photograph (IMG_9513): Four seated Buddhas facing the cardinal directions on an octagonal multi-tiered lotus Sumeru pedestal.',
  },
  floor4: {
    key: 'floor4',
    label: '4F · Avatamsaka Assembly',
    src: assetUrl('ref/floor4_statue.jpg'),
    title: 'Floor 4 · Avatamsaka Assembly of Seven (Sakyamuni, Ananda, Kasyapa, Manjusri & Samantabhadra)',
    sub: 'On-site archival photograph (IMG_9514): Gilded Sakyamuni with sculpted flame mandorla, flanked by Kasyapa, Ananda, Manjusri on a Blue Lion, and Samantabhadra on a Six-Tusked White Elephant.',
  },
  floor5: {
    key: 'floor5',
    label: '5F · Vairocana Mandala',
    src: assetUrl('ref/floor5_statue.jpg'),
    title: 'Floor 5 · Vairocana Dharmakaya Buddha & Eight Great Bodhisattvas 3D Mandala',
    sub: 'On-site archival photograph (IMG_9515): Central Vairocana in Wisdom-Fist Mudra surrounded by Eight Bodhisattvas on an octagonal lotus ring beneath the Nine-Dragon Octagonal Caisson Ceiling.',
  },
};

const photoModal = document.getElementById('photoModal');
const pmImg = document.getElementById('pmImg');
const pmTitle = document.getElementById('pmTitle');
const pmSub = document.getElementById('pmSub');
const pmStrip = document.getElementById('pmStrip');
const pmCloseBtn = document.getElementById('pmCloseBtn');

let openPhotoKey = null;
function openPhotoModal(key = 'floor1') {
  const item = ARCHIVAL_PHOTOS[key] || ARCHIVAL_PHOTOS.floor1;
  openPhotoKey = item.key;
  pmImg.src = item.src;
  pmTitle.textContent = photoText(item).title;
  pmSub.textContent = photoText(item).sub;
  pmStrip.innerHTML = '';
  Object.values(ARCHIVAL_PHOTOS).forEach((p) => {
    const b = document.createElement('button');
    b.className = `pm-thumb-btn ${p.key === item.key ? 'active' : ''}`;
    b.textContent = photoText(p).label;
    b.onclick = (e) => {
      e.stopPropagation();
      openPhotoModal(p.key);
    };
    pmStrip.appendChild(b);
  });
  photoModal.classList.add('open');
}

function closePhotoModal() {
  openPhotoKey = null;
  photoModal.classList.remove('open');
}
if (pmCloseBtn) pmCloseBtn.onclick = closePhotoModal;
if (photoModal) {
  photoModal.onclick = (e) => {
    if (e.target === photoModal) closePhotoModal();
  };
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && photoModal?.classList.contains('open')) closePhotoModal();
});

function createPhotoCardEl(photoKey) {
  const p = ARCHIVAL_PHOTOS[photoKey];
  if (!p) return null;
  const card = document.createElement('div');
  card.className = 'ref-photo-card';
  card.innerHTML = `
    <img src="${p.src}" alt="${photoText(p).label}" loading="lazy" />
    <div class="ref-photo-meta">
      <div class="ref-photo-tag">${t('photo.tag')}</div>
      <div class="ref-photo-title">${photoText(p).title}</div>
      <div class="ref-photo-hint">${t('photo.hint')}</div>
    </div>
  `;
  card.onclick = () => openPhotoModal(photoKey);
  return card;
}

function renderChapterExtra(ch, step) {
  chapterExtra.innerHTML = '';
  if (ch.id === 'status') {
    chapterExtra.innerHTML = `
      <div class="extra-title">${t('cmp.title')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
        <button class="step-pill" id="focusAllTowers">${t('cmp.all')}</button>
        <button class="step-pill" id="focusPisa">${t('cmp.pisa')}</button>
        <button class="step-pill" id="focusEiffel">${t('cmp.eiffel')}</button>
      </div>
      <div class="cmp-rows">
        <div>🟨 ${t('cmp.row.ying')}</div>
        <div>⬜ ${t('cmp.row.pisa')}</div>
        <div>🟦 ${t('cmp.row.eiffel')}</div>
      </div>
    `;
    document.getElementById('focusAllTowers').onclick = () => {
      overlays.setMode({ scale: true, towers: true });
      flyTo([0, 34, 152], [0, 33, 0], 1.5);
    };
    document.getElementById('focusPisa').onclick = () => {
      overlays.setMode({ scale: true, towers: true });
      flyTo([-40, 26, 58], [-38, 29, 2], 1.5);
    };
    document.getElementById('focusEiffel').onclick = () => {
      overlays.setMode({ scale: true, towers: true });
      flyTo([44, 30, 68], [40, 34, 2], 1.5);
    };
    if (docState.stepIdx === 1) {
      const pCard = createPhotoCardEl('liang');
      if (pCard) chapterExtra.appendChild(pCard);
    }
  } else if (ch.id === 'statues') {
    const curFloor = step.state.floorFocus;
    const wrap = document.createElement('div');
    if (curFloor) {
      const floorData = FLOORS.find((f) => f.level === curFloor);
      if (floorData) {
        wrap.innerHTML = `<div class="extra-title">${t('floor.title')}</div>`;
        const grid = document.createElement('div');
        grid.className = 'statue-grid';
        const floorItems = statues.items.filter((it) => it.level === curFloor);
        floorItems.forEach((it) => {
          const card = document.createElement('button');
          card.className = 'statue-card';
          const mText = it.sp.mudra ? t(`mudra.${it.sp.mudra}`) : it.sp.mount ? t(`mount.${it.sp.mount}`) : t('mount.none');
          card.innerHTML = `<b>${statueText(it.sp).name}</b><span>${it.sp.height} ${t('unit.m')} · ${mText}</span>`;
          card.onclick = () => {
            grid.querySelectorAll('.statue-card').forEach((c) => c.classList.remove('active'));
            card.classList.add('active');
            focusStatueItem(it);
          };
          grid.appendChild(card);
        });
        wrap.appendChild(grid);
      }
      const floorPhotoMap = { 1: 'floor1', 2: 'section', 3: 'floor3', 4: 'floor4', 5: 'floor5' };
      const pCard = createPhotoCardEl(floorPhotoMap[curFloor] || 'floor1');
      if (pCard) wrap.appendChild(pCard);
    } else {
      wrap.innerHTML = `<div class="extra-title">${t('floor.all')}</div>`;
      const pCard = createPhotoCardEl('floor4');
      if (pCard) wrap.appendChild(pCard);
    }
    chapterExtra.appendChild(wrap);
  } else if (ch.id === 'structure') {
    chapterExtra.innerHTML = `
      <div class="extra-title">${t('str.title')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px">
        <button class="step-pill" id="exQuickSplit">${t('str.split')}</button>
        <button class="step-pill" id="exQuickXray">${t('str.xray')}</button>
        <button class="step-pill" id="exCorePlan">${t('str.corePlan')}</button>
        <button class="step-pill" id="exQuickReset">${t('str.reset')}</button>
      </div>
    `;
    document.getElementById('exQuickSplit').onclick = () => {
      explodeTarget = explodeTarget > 0.5 ? 0 : 0.9;
      explodeEl.value = explodeTarget;
      info.setCutaway({ xray: false, floor: null });
      overlays.setMode({ struct: false });
    };
    document.getElementById('exQuickXray').onclick = () => {
      explodeTarget = 0;
      explodeEl.value = 0;
      liftAboveFloor = null;
      setStatuesOut(false);
      statues.setFloor(null, false);
      info.setCutaway({ xray: true, floor: null });
      overlays.setMode({ struct: true });
    };
    document.getElementById('exQuickReset').onclick = () => {
      explodeTarget = 0;
      explodeEl.value = 0;
      info.setCutaway({ xray: false, floor: null });
      overlays.setMode({ struct: false });
    };
    document.getElementById('exCorePlan').onclick = () => {
      document.getElementById('exQuickXray').click();
      setAutoRotate(false);
      flyTo([8, 94, 16], [0, 31, 0], 1.8);
    };
    const pCard = createPhotoCardEl('section');
    if (pCard) chapterExtra.appendChild(pCard);
  } else if (ch.id === 'tilt') {
    chapterExtra.innerHTML = `
      <div class="extra-title">${t('tilt.title')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
        <button class="step-pill ${tl.mult === 1 ? 'active' : ''}" data-qm="1">${t('tilt.x1')}</button>
        <button class="step-pill ${tl.mult === 5 ? 'active' : ''}" data-qm="5">${t('tilt.x5')}</button>
        <button class="step-pill ${tl.mult === 10 ? 'active' : ''}" data-qm="10">${t('tilt.x10')}</button>
      </div>
    `;
    chapterExtra.querySelectorAll('[data-qm]').forEach((b) => {
      b.onclick = () => {
        setMult(+b.dataset.qm);
        chapterExtra.querySelectorAll('[data-qm]').forEach((x) => x.classList.toggle('active', x === b));
      };
    });
  }
}

function applyStepState(ch, step) {
  if (sectionView.enabled) setSectionView(false);
  const st = step.state;
  if (st.timeIdx !== undefined && st.timeIdx !== timeIdx) setTimeIdx(st.timeIdx);
  explodeTarget = st.explode ?? 0;
  explodeEl.value = explodeTarget;
  explodeBtn.classList.toggle('on', explodeTarget > 0.1);

  liftAboveFloor = st.liftAbove ?? null;
  info.setCutaway({
    floor: st.cutawayFloor ?? null,
    xray: !!st.xray,
    nightGlow: TIMES[timeIdx].nightGlow ?? 0,
  });
  xrayBtn.classList.toggle('on', !!st.xray);

  statues.setFloor(st.floorFocus ?? null, false);
  setStatuesOut(!!st.statuesOut, false);

  overlays.setMode(st.overlays || {});
  setAutoRotate(!!st.autoRotate);

  if (st.playTimeline) {
    setYear(1930);
    tl.playing = true;
    document.getElementById('tlPlay').textContent = t('tl.pause');
  } else {
    tl.playing = false;
    document.getElementById('tlPlay').textContent = t('tl.play');
    if (st.year !== undefined) setYear(st.year);
  }
  if (st.mult !== undefined) setMult(st.mult);

  // Auto-expand the tilt timeline in Chapter III
  setFold(ch.id !== 'tilt');

  flyTo(step.cam.pos, step.cam.target, 2.0, step.camFrom?.pos, step.camFrom?.target);
  setPins(stepText(step).pins || []);
}

function goChapterStep(chIdx, stepIdx = 0, userTriggered = false) {
  docState.chIdx = ((chIdx % CHAPTERS.length) + CHAPTERS.length) % CHAPTERS.length;
  const ch = CHAPTERS[docState.chIdx];
  docState.stepIdx = Math.max(0, Math.min(ch.steps.length - 1, stepIdx));
  docState.stepElapsed = 0;
  const step = ch.steps[docState.stepIdx];

  if (userTriggered) sound.chime(528 + docState.chIdx * 45);
  sound.speak(stepText(step).narration);

  applyStepState(ch, step);
  renderStory();
}

// Everything on the left card / tabs / subtitle that depends on the language
function renderStory() {
  const ch = CHAPTERS[docState.chIdx];
  const raw = ch.steps[docState.stepIdx];
  const step = stepText(raw);
  const ct = chapterText(ch);
  renderChapterTabs();
  chapterTabEls.forEach((el, i) => el.classList.toggle('active', i === docState.chIdx));
  storyChapterLabel.textContent = `${ch.num} · ${ct.title}`;
  storyStepCounter.textContent = `${docState.stepIdx + 1} / ${ch.steps.length}`;
  storyTitle.textContent = step.name;
  storySummary.textContent = step.summary;
  cinemaTextEl.textContent = step.narration || step.summary;
  uiPanel.classList.toggle('compact', !!raw.compact);
  renderChapterExtra(ch, raw);
}

function nextSceneStep(auto = false) {
  const ch = CHAPTERS[docState.chIdx];
  if (docState.stepIdx + 1 < ch.steps.length) {
    goChapterStep(docState.chIdx, docState.stepIdx + 1, !auto);
  } else if (docState.chIdx + 1 < CHAPTERS.length) {
    goChapterStep(docState.chIdx + 1, 0, !auto);
  } else {
    if (auto) {
      setDocPlaying(false);
    } else {
      goChapterStep(0, 0, true);
    }
  }
}

function prevSceneStep() {
  if (docState.stepIdx > 0) {
    goChapterStep(docState.chIdx, docState.stepIdx - 1, true);
  } else {
    const prevCh = (docState.chIdx - 1 + CHAPTERS.length) % CHAPTERS.length;
    goChapterStep(prevCh, CHAPTERS[prevCh].steps.length - 1, true);
  }
}

function setDocPlaying(on) {
  if (on && sectionView.enabled) setSectionView(false);
  docState.playing = on;
  docState.stepElapsed = 0;
  playDocBtn.classList.toggle('playing', on);
  playDocBtn.textContent = on ? t('btn.pause') : t('btn.play');
  cinemaBarEl.classList.toggle('show', on);
  if (on) {
    sound.toggleAudio(true);
    document.getElementById('audioBtn').classList.add('on');
    const step = CHAPTERS[docState.chIdx].steps[docState.stepIdx];
    cinemaTextEl.textContent = stepText(step).narration || step.summary;
    // Note: voiceover remains OFF unless user explicitly enabled it
    sound.speak(stepText(step).narration);
  } else {
    cinemaFillEl.style.width = '0%';
  }
}

playDocBtn.onclick = () => {
  if (!docState.playing && docState.chIdx === CHAPTERS.length - 1 && docState.stepIdx === CHAPTERS[docState.chIdx].steps.length - 1) {
    goChapterStep(0, 0, false);
  }
  setDocPlaying(!docState.playing);
};
document.getElementById('prevStepBtn').onclick = prevSceneStep;
document.getElementById('nextStepBtn').onclick = () => nextSceneStep(false);

const audioBtn = document.getElementById('audioBtn');
audioBtn.onclick = () => {
  const on = sound.toggleAudio();
  audioBtn.classList.toggle('on', on);
};
const voiceBtn = document.getElementById('voiceBtn');
voiceBtn.onclick = () => {
  const on = sound.toggleVoice();
  voiceBtn.classList.toggle('on', on);
  voiceBtn.textContent = on ? t('tools.voiceOn') : t('tools.voiceOff');
  if (on) {
    const step = CHAPTERS[docState.chIdx].steps[docState.stepIdx];
    sound.speak(stepText(step).narration);
  }
};
const toggleUiBtn = document.getElementById('toggleUiBtn');
toggleUiBtn.onclick = () => {
  const hidden = uiPanel.classList.toggle('hidden-panel');
  toggleUiBtn.classList.toggle('on', !hidden);
};

// ---------- Stats ----------
let tris = 0;
let inst = 0;
root.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry;
  const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  const c = o.isInstancedMesh ? o.count : 1;
  if (o.isInstancedMesh) inst += o.count;
  tris += n * c;
});
const renderStats = () => {
  document.getElementById('stats').textContent = t('stats', { h: info.height.toFixed(2), tris: (tris / 1e6).toFixed(2), inst: inst.toLocaleString(), ms: buildMs.toFixed(0) });
};
renderStats();

// ---------- Compare button + language switch ----------
document.getElementById('compareBtn').onclick = () => {
  uiPanel.classList.remove('hidden-panel');
  toggleUiBtn.classList.add('on');
  goChapterStep(1, 1, true);
};
const langBtn = document.getElementById('langBtn');
langBtn.onclick = () => setLang(getLang() === 'zh' ? 'en' : 'zh');
function refreshLanguage() {
  applyStatic();
  viewBtns.forEach(([name, b]) => (b.textContent = misc(name)));
  timeBtn.textContent = t('tools.time', { name: misc(TIMES[timeIdx].name) });
  renderLayerLabels();
  renderStats();
  renderStory();
  setPins(stepText(CHAPTERS[docState.chIdx].steps[docState.stepIdx]).pins || []);
  topStatueBtn.textContent = statues.out ? t('btn.buddhasBack') : t('btn.buddhas');
  playDocBtn.textContent = docState.playing ? t('btn.pause') : t('btn.play');
  voiceBtn.textContent = sound.voiceEnabled ? t('tools.voiceOn') : t('tools.voiceOff');
  document.getElementById('tlPlay').textContent = tl.playing ? t('tl.pause') : t('tl.play');
  foldBtn.textContent = tlEl.classList.contains('folded') ? t('tl.expand') : t('tl.collapse');
  updateTimelineUI();
  applyViewShift();
  if (openPhotoKey) openPhotoModal(openPhotoKey);
}
onLangChange(refreshLanguage);
applyStatic();
timeBtn.textContent = t('tools.time', { name: misc(TIMES[timeIdx].name) });
window.__pagoda = { info, scene, camera, controls, renderer, goView, VIEWS, setDeform, statues, goChapterStep, CHAPTERS, sectionView, setSectionView };
if (import.meta.env.DEV && new URLSearchParams(location.search).has('inspectStatues')) {
  import('../tools/statue-browser-audit.js').then(({ installStatueAudit }) => installStatueAudit({ statues, camera }));
}

// ---------- 照片比对模式：?match=IMG_9519 ----------
const MATCH = {
  IMG_9519: { fov: 71.6, pos: [-67.37, 1.88, 2.2], heading: 87.1, pitch: 18, roll: 0.2 },
  IMG_9518: { fov: 71.6, pos: [-50.0, 1.5, 12.4], heading: 95, pitch: 22 },
  IMG_9524: { fov: 71.6, pos: [-18.95, 2.35, 35.67], heading: 28.05, pitch: 26.25, roll: -1.63 },
  IMG_9540: { fov: 71.6, pos: [14.2, 1.5, 45.7], heading: 342, pitch: 25 },
  IMG_9541: { fov: 39.6, pos: [21.5, 1.6, 59.84], heading: 342.88, pitch: 24, roll: -0.19 },
};
const matchName = new URLSearchParams(location.search).get('match');
const match = matchName && MATCH[matchName] ? { name: matchName, roll: 0, ...MATCH[matchName] } : null;
let refImg = null;
function applyMatch() {
  camera.fov = match.fov;
  camera.position.set(...match.pos);
  const h = THREE.MathUtils.degToRad(match.heading);
  const p = THREE.MathUtils.degToRad(match.pitch);
  const dir = new THREE.Vector3(Math.sin(h) * Math.cos(p), Math.sin(p), -Math.cos(h) * Math.cos(p));
  camera.up.set(0, 1, 0);
  camera.lookAt(camera.position.clone().add(dir));
  camera.rotateZ(THREE.MathUtils.degToRad(match.roll));
  camera.updateProjectionMatrix();
  const el = document.getElementById('matchInfo');
  if (el) el.textContent = JSON.stringify({ pos: match.pos.map((v) => +v.toFixed(2)), heading: +match.heading.toFixed(2), pitch: +match.pitch.toFixed(2), roll: match.roll, fov: match.fov });
}
if (match) {
  document.getElementById('tl').style.display = 'none';
  document.getElementById('topBar').style.display = 'none';
  controls.enabled = false;
  refImg = document.createElement('img');
  refImg.src = assetUrl(`ref/${match.name}.jpg`);
  refImg.style.cssText = 'position:fixed;pointer-events:none;opacity:0.5;z-index:2';
  document.body.appendChild(refImg);
  const panel = document.getElementById('ui');
  panel.insertAdjacentHTML('beforeend', `<div class="row">照片叠加 <input id="refOp" type="range" min="0" max="1" step="0.05" value="0.5"></div><div id="matchInfo" class="sub" style="word-break:break-all"></div>`);
  document.getElementById('refOp').oninput = (e) => (refImg.style.opacity = e.target.value);
  window.__match = (o) => { Object.assign(match, o); applyMatch(); return match; };
} else {
  // 初始化进入序幕
  goChapterStep(0, 0, false);
}

function resize() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  if (match) {
    let cw = w;
    let ch = h;
    if (cw / ch > 0.75) cw = Math.round(ch * 0.75);
    else ch = Math.round(cw / 0.75);
    const css = `position:fixed;left:${(w - cw) / 2}px;top:${(h - ch) / 2}px;width:${cw}px;height:${ch}px`;
    renderer.setPixelRatio(1);
    renderer.setSize(900, 1200, false);
    composer.setPixelRatio(1);
    composer.setSize(900, 1200);
    renderer.domElement.style.cssText = css;
    refImg.style.cssText += ';' + css;
    camera.aspect = 0.75;
    applyMatch();
    return;
  }
  camera.aspect = w / h;
  applyViewShift();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}

// ---------- 剪影拟合：照片蓝天阈值 → 塔的剪影；模型渲染白色剪影；坐标下降最大化 IoU ----------
window.__fit = async ({ region = 0.62, iters = 9, steps = [2, 2, 0.5, 1, 1, 0.4] } = {}) => {
  if (!match) return 'not in match mode';
  const W = 180;
  const H = 240;
  await refImg.decode();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.drawImage(refImg, 0, 0, W, H);
  const pd = ctx.getImageData(0, 0, W, H).data;
  const rows = Math.floor(H * region);
  const pm = new Uint8Array(W * rows);
  for (let i = 0; i < W * rows; i++) {
    const r = pd[i * 4];
    const g = pd[i * 4 + 1];
    const b = pd[i * 4 + 2];
    pm[i] = b > 100 && b > r + 30 && b > g + 5 ? 0 : 1;
  }
  const rtM = new THREE.WebGLRenderTarget(W, H);
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const buf = new Uint8Array(W * H * 4);
  const others = [sky, ground, site];
  const cost = () => {
    applyMatch();
    const fog = scene.fog;
    scene.fog = null;
    scene.overrideMaterial = white;
    others.forEach((o) => (o.visible = false));
    renderer.setRenderTarget(rtM);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.readRenderTargetPixels(rtM, 0, 0, W, H, buf);
    renderer.setRenderTarget(null);
    scene.overrideMaterial = null;
    scene.fog = fog;
    others.forEach((o) => (o.visible = true));
    let inter = 0;
    let uni = 0;
    for (let y = 0; y < rows; y++) {
      const ry = H - 1 - y;
      for (let x = 0; x < W; x++) {
        const m = buf[(ry * W + x) * 4] > 127 ? 1 : 0;
        const p = pm[y * W + x];
        inter += m & p;
        uni += m | p;
      }
    }
    return 1 - inter / Math.max(1, uni);
  };
  const get = () => [match.pos[0], match.pos[2], match.pos[1], match.heading, match.pitch, match.roll];
  const set = (v) => {
    match.pos = [v[0], v[2], v[1]];
    match.heading = v[3];
    match.pitch = v[4];
    match.roll = v[5];
  };
  let best = get();
  let bestC = cost();
  const c0 = bestC;
  const st = steps.slice();
  for (let it = 0; it < iters; it++) {
    let improved = true;
    while (improved) {
      improved = false;
      for (let k = 0; k < best.length; k++)
        for (const d of [1, -1]) {
          const v = best.slice();
          v[k] += d * st[k];
          set(v);
          const cc = cost();
          if (cc < bestC - 1e-5) {
            bestC = cc;
            best = v;
            improved = true;
          }
        }
    }
    for (let k = 0; k < st.length; k++) st[k] /= 2;
  }
  set(best);
  applyMatch();
  rtM.dispose();
  return { iouBefore: +(1 - c0).toFixed(4), iouAfter: +(1 - bestC).toFixed(4), pos: match.pos.map((v) => +v.toFixed(2)), heading: +match.heading.toFixed(2), pitch: +match.pitch.toFixed(2), roll: +match.roll.toFixed(2) };
};

// 性能探针
window.__perf = (n = 20) => {
  const gl = renderer.getContext();
  const res = {};
  for (const ao of [true, false]) {
    gtao.enabled = ao;
    composer.render();
    gl.finish();
    renderer.info.autoReset = false;
    renderer.info.reset();
    const t = performance.now();
    for (let i = 0; i < n; i++) composer.render();
    gl.finish();
    res[ao ? 'withAO' : 'noAO'] = { ms: +((performance.now() - t) / n).toFixed(1), calls: Math.round(renderer.info.render.calls / n), tris: Math.round(renderer.info.render.triangles / n) };
    renderer.info.autoReset = true;
  }
  gtao.enabled = document.getElementById('ao').classList.contains('on');
  res.size = [renderer.domElement.width, renderer.domElement.height];
  return res;
};

// 保存当前渲染到 .shots/<name>.png（仅开发服务器）
if (import.meta.env.DEV) window.__shot = async (name) => {
  if (match) applyMatch();
  composer.render();
  const data = renderer.domElement.toDataURL('image/png');
  return (await fetch('/__shot', { method: 'POST', body: JSON.stringify({ name, data }) })).text();
};
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
let elapsedTotal = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(0.1, clock.getDelta());
  elapsedTotal += dt;
  if (tween) {
    tween.t = Math.min(1, tween.t + dt / (tween.dur || 1.6));
    const e = tween.t < 0.5 ? 4 * tween.t ** 3 : 1 - (-2 * tween.t + 2) ** 3 / 2;
    camera.position.lerpVectors(tween.from.pos, tween.to.pos, e);
    controls.target.lerpVectors(tween.from.target, tween.to.target, e);
    if (tween.t >= 1) tween = null;
  }
  if (docState.playing) {
    const step = CHAPTERS[docState.chIdx].steps[docState.stepIdx];
    const dur = step.duration || 12;
    docState.stepElapsed += dt;
    cinemaFillEl.style.width = `${Math.min(100, (docState.stepElapsed / dur) * 100).toFixed(1)}%`;
    if (docState.stepElapsed >= dur) {
      nextSceneStep(true);
    }
  }
  watchPerf(dt);
  statues.update(dt);
  if (!statues.out && statues.floor === null) tip.style.opacity = 0;
  updateLayers(dt);
  updateDeform(dt);
  overlays.update(elapsedTotal, tl.cur, tl.curM);
  if (!match) {
    controls.update();
    if (camera.position.y < 0.6) camera.position.y = 0.6;
    updatePins();
  }
  sectionView.update(camera, dt);
  composer.render();
});
const loading = document.getElementById('loading');
loading.style.opacity = 0;
setTimeout(() => loading.remove(), 750);
