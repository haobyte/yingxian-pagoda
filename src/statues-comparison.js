import entries from 'virtual:statue-comparison';
import './statues-comparison.css';

const $ = s => document.querySelector(s);
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const floorNames = ['','一层','二层','三层','四层','五层'];
let floor = 0;
$('#model-count').textContent = entries.filter(e => e.glb).length;
$('#floor-filters').innerHTML = [0,1,2,3,4,5].map(n => `<button data-floor="${n}" aria-pressed="${n === 0}">${n ? floorNames[n] : '全部楼层'}</button>`).join('');
function imageColumn(e, label, english, field, caption, source) {
  if (!e[field]) return `<div><div class="column-label">${label}<small>${english}</small></div><div class="frame empty" aria-label="公开版暂无${label}"><span aria-hidden="true">—</span></div><div class="caption"><span>公开版暂无（来源待核实）</span></div></div>`;
  return `<div><div class="column-label">${label}<small>${english}</small></div><button class="frame image-open" data-url="${e[field]}" data-title="${escape(e.title+' · '+label)}" aria-label="放大${escape(e.title+' · '+label)}"><img src="${e[field]}" alt="${escape(e.title+' · '+label)}" loading="lazy" decoding="async"></button><div class="caption"><span class="photo-name">${escape(caption)}</span>${source ? `<a href="${source}" target="_blank" rel="noopener">来源 ↗</a>` : ''}</div></div>`;
}
function render() {
  const query = $('#search').value.trim().toLowerCase();
  const shown = entries.filter(e => (!floor || e.floor === floor) && `${e.title} ${e.key}`.toLowerCase().includes(query));
  $('#result-count').textContent = `显示 ${shown.length} / ${entries.length} 尊造像 · ${shown.filter(e => e.glb).length} 个 GLB 模型`;
  $('#no-results').hidden = !!shown.length;
  $('#catalogue').innerHTML = [1,2,3,4,5].map(n => {
    const group = shown.filter(e => e.floor === n);
    if (!group.length) return '';
    return `<section aria-label="${floorNames[n]}造像"><div class="floor-heading"><h2>${floorNames[n]}</h2><span>FLOOR 0${n} / ${group.length} 尊</span></div>${group.map(e => `<article class="statue" id="${e.key}"><div class="statue-heading"><h3>${escape(e.title)}</h3><span class="key">${e.key}</span></div>${e.warning ? `<p class="warning">${escape(e.warning)}</p>` : ''}<div class="columns">${imageColumn(e,'真实照片','PHOTOGRAPH','photo',e.photoName,e.source)}${imageColumn(e,'AI 生成现貌','PRESENT','present','现貌参考重建 · 非实拍',e.source)}${imageColumn(e,'AI 推测原貌','HYPOTHESIS','restoration','风化前外观推测 · 未经历史验证',e.restorationSource)}<div><div class="column-label">GLB 模型<small>3D MODEL</small></div>${e.glb ? `<button class="frame model-launch" data-key="${e.key}" aria-label="查看${escape(e.title)}的三维模型"><span class="model-symbol" aria-hidden="true">◇</span><span>打开三维模型 ↗</span></button><div class="caption"><span>独立模型 · 可旋转查看</span><a href="${e.glb}" download>GLB ↓</a></div>` : '<div class="frame empty" aria-label="暂无 GLB 模型"><span aria-hidden="true">—</span></div><div class="caption"><span>暂无模型</span></div>'}</div></div></article>`).join('')}</section>`;
  }).join('');
}
$('#floor-filters').addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  floor = Number(button.dataset.floor);
  for (const b of $('#floor-filters').children) b.setAttribute('aria-pressed', String(b === button));
  render();
});
$('#search').addEventListener('input', render);
const imageDialog = $('#image-dialog');
$('#catalogue').addEventListener('click', event => {
  const image = event.target.closest('.image-open');
  if (image) {
    imageDialog.querySelector('img').src = image.dataset.url;
    imageDialog.querySelector('img').alt = image.dataset.title;
    imageDialog.querySelector('p').textContent = image.dataset.title;
    imageDialog.showModal();
  }
  const model = event.target.closest('.model-launch');
  if (model) openModel(entries.find(e => e.key === model.dataset.key));
});
$('.dialog-close').onclick = () => imageDialog.close();
$('.model-close').onclick = () => $('#model-dialog').close();
for (const dialog of [imageDialog, $('#model-dialog')]) dialog.addEventListener('click', e => { if (e.target === dialog) {const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();} });
let cleanup = null, request = 0, activeEntry = null;
const models = entries.filter(e => e.glb);
function adjacentModel(delta) {
  const index = models.indexOf(activeEntry);
  if (index >= 0) openModel(models[(index + delta + models.length) % models.length]);
}
$('#previous-model').onclick = () => adjacentModel(-1);
$('#next-model').onclick = () => adjacentModel(1);
$('#model-dialog').addEventListener('close', () => { request++; cleanup?.(); cleanup = null; });
async function openModel(entry) {
  cleanup?.(); cleanup = null; activeEntry = entry;
  const token = ++request;
  const dialog = $('#model-dialog'), stage = $('#model-stage'), status = $('#model-status');
  $('#model-title').textContent = entry.title;
  $('#download-model').href = entry.glb;
  $('#model-source').href = entry.modelSource;
  delete stage.dataset.loaded; delete stage.dataset.bounds;
  stage.dataset.state = 'loading';
  status.hidden = false; status.textContent = '正在加载模型…';
  if (!dialog.open) dialog.showModal();
  let renderer, scene, controls, observer, disposed = false;
  const releaseObject = obj => obj.traverse(o => {o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(!m)continue; for(const v of Object.values(m)) if(v?.isTexture)v.dispose(); m.dispose();}});
  try {
    const [THREE, {GLTFLoader}, {OrbitControls}, {prepareStatueModel}] = await Promise.all([import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/controls/OrbitControls.js'), import('./statue-asset.js')]);
    if(token !== request) return;
    scene = new THREE.Scene(); scene.background = new THREE.Color('#e3e6dd');
    const camera = new THREE.PerspectiveCamera(35,1,.01,100);
    renderer = new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;
    stage.append(renderer.domElement);
    controls = new OrbitControls(camera,renderer.domElement);controls.enableDamping = true;controls.minDistance = .5;controls.maxDistance = 10;
    scene.add(new THREE.HemisphereLight(0xffffff,0x8f9486,2.5));
    const light = new THREE.DirectionalLight(0xfff4df,3);light.position.set(3,4,5);scene.add(light);
    const fill = new THREE.DirectionalLight(0xffffff,1.5);fill.position.set(-3,2,-2);scene.add(fill);
    const setView = (angle = 0) => {
      const distance = Math.max(2.1, 1.3 / (2 * Math.tan(camera.fov * Math.PI / 360) * Math.min(camera.aspect, 1)));
      camera.position.set(Math.sin(angle)*distance,.7,Math.cos(angle)*distance);controls.target.set(0,.5,0);controls.update();
    };
    const reset = () => setView(0);
    $('#reset-model').onclick = reset;
    $('#side-model').onclick = () => setView(Math.PI/2);
    $('#back-model').onclick = () => setView(Math.PI);
    observer = new ResizeObserver(() => {const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});observer.observe(stage);
    renderer.setAnimationLoop(() => {controls.update();renderer.render(scene,camera);});
    cleanup = () => {disposed=true;observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();releaseObject(scene);renderer.dispose();renderer.domElement.remove();$('#reset-model').onclick=null;$('#side-model').onclick=null;$('#back-model').onclick=null;};
    const gltf = await new GLTFLoader().loadAsync(entry.glb);
    if(token !== request || disposed) {releaseObject(gltf.scene); return;}
    const object = prepareStatueModel(gltf.scene);
    const runtimeBox = new THREE.Box3().setFromObject(object);
    stage.dataset.bounds = JSON.stringify({min:runtimeBox.min.toArray(),max:runtimeBox.max.toArray()});
    let box = new THREE.Box3().setFromObject(object), size=box.getSize(new THREE.Vector3());
    const scale = 1 / Math.max(size.x,size.y,size.z,.0001);object.scale.multiplyScalar(scale);
    box = new THREE.Box3().setFromObject(object);const center=box.getCenter(new THREE.Vector3());object.position.sub(center);object.position.y+=.5;
    scene.add(object);reset();status.hidden = true;stage.dataset.loaded = entry.key;stage.dataset.state = 'loaded';
  } catch(error) {
    if(token === request) {stage.dataset.state='failed';cleanup?.();cleanup=null;status.hidden=false;status.textContent='模型加载失败，请重试或下载 GLB 文件查看。';}
    console.error('GLB viewer:',error);
  }
}
render();
