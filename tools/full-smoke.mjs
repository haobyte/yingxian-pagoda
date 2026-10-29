import {chromium} from 'playwright';import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
const atlasOnly=process.argv.includes('--atlas-only');
const base=process.env.BASE_URL||'http://127.0.0.1:5184/yingxian-pagoda/';
const prefix='/yingxian-pagoda/',root=path.resolve('dist');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.jpg':'image/jpeg','.png':'image/png'};
const server=process.env.BASE_URL?null:http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix)){res.writeHead(404).end();return}const file=path.resolve(root,decodeURIComponent(url.pathname.slice(prefix.length)||'index.html'));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(data)});}).listen(5184,'127.0.0.1');
if(server&&!server.listening)await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:process.env.CI?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
const checks=[],errors=[],failed=[],requests=[];const check=(name,value)=>{assert(value,name);checks.push(name);console.log('PASS '+name)};
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await context.addInitScript(()=>localStorage.setItem('yingxian-lang','zh'));
function observe(page){page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>failed.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());if(r.url().endsWith('.glb')&&r.status()===200)requests.push(r.url())});}
fs.mkdirSync('artifacts',{recursive:true});
try{
 if(!atlasOnly){
 const p=await context.newPage();observe(p);await p.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForFunction(()=>window.__pagoda&&__pagoda.statues.status.done+__pagoda.statues.status.failed===26,{},{timeout:180000});
 const assets=await p.evaluate(()=>__pagoda.statues.items.map(it=>{let meshes=0;it.g.userData.assetModel?.traverse(o=>{if(o.isMesh)meshes++});return{key:it.sp.glb,cutout:it.sp.cutout||null,state:it.g.userData.assetState,meshes}}));
 check('main scene loads 26 actual GLB models, no cutouts',assets.length===26&&assets.every(a=>a.state==='loaded'&&a.meshes>0&&!a.cutout));
 fs.writeFileSync('artifacts/scene-models.json',JSON.stringify(assets,null,2));
 await p.evaluate(()=>__pagoda.controls.autoRotate=false);await p.waitForTimeout(2000);await p.screenshot({path:'artifacts/full-original.png',timeout:60000});
 const camera=await p.evaluate(()=>__pagoda.camera.position.toArray());await p.mouse.move(800,400);await p.mouse.down();await p.mouse.move(1050,470,{steps:10});await p.mouse.up();await p.waitForTimeout(1000);
 check('mouse drag rotates original scene',await p.evaluate(before=>__pagoda.camera.position.toArray().some((x,i)=>Math.abs(x-before[i])>.1),camera));
 await p.locator('#chapterTabs button').nth(2).click();if(Number(await p.locator('#explode').inputValue())>.5)await p.locator('#exQuickSplit').click();await p.locator('#exQuickSplit').click();await p.waitForTimeout(2400);
 check('nine-layer explosion moves actual architecture',await p.evaluate(()=>__pagoda.info.layers.some(l=>l.group.position.y>5)));
 await p.screenshot({path:'artifacts/full-exploded.png',timeout:60000});
 await p.locator('#exCorePlan').click();await p.waitForTimeout(2000);check('core structure view active',await p.locator('#xrayBtn').evaluate(e=>e.classList.contains('on')));
 await p.locator('#sectionBtn').click();await p.waitForTimeout(2200);check('section cuts tower',await p.evaluate(()=>__pagoda.sectionView.enabled));
 check('section leaves statue meshes unclipped',await p.evaluate(()=>__pagoda.statues.items.every(it=>{let ok=true;it.g.userData.assetModel.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.clippingPlanes?.length)ok=false});return ok})));
 for(let n=1;n<=5;n++){await p.locator(`[data-section-floor="${n}"]`).click();await p.waitForTimeout(1200);check('section floor '+n,await p.locator(`[data-section-floor="${n}"]`).evaluate(e=>e.classList.contains('on')))}
 await p.screenshot({path:'artifacts/full-floor5.png',timeout:60000});await p.locator('#sectionClose').click();check('section exit restores mode',await p.evaluate(()=>!__pagoda.sectionView.enabled));
 await p.locator('#topStatueBtn').click();check('Buddhas Ascend uses original statues',await p.evaluate(()=>__pagoda.statues.out));await p.locator('#topStatueBtn').click();
 await p.locator('#compareBtn').click();check('three-tower comparison chapter',await p.locator('#storyTitle').textContent().then(s=>s.length>0));
 await p.locator('#chapterTabs button').nth(3).click();await p.locator('[data-mult="10"]').click();await p.locator('#tlSlider').fill('200');check('tilt timeline responds',await p.locator('#tlYear').textContent().then(s=>s.length>0));
 await p.locator('#langBtn').click();check('language switch',await p.locator('#langBtn').textContent().then(s=>s.includes('中文')));await p.locator('#langBtn').click();
 const link=await p.locator('a[href="./statues.html"]').getAttribute('href');check('atlas link retains project path',new URL(link,base).pathname.endsWith('/yingxian-pagoda/statues.html'));
 await p.close();
 }
 const p=await context.newPage();observe(p);await p.goto(base+'statues.html',{waitUntil:'domcontentloaded',timeout:120000});
 await p.waitForSelector('.model-launch');check('atlas has 26 real model buttons',await p.locator('.model-launch').count()===26);
 const entries=JSON.parse(fs.readFileSync('data/comparison.json'));
 for(const e of entries){await p.locator(`.model-launch[data-key="${e.key}"]`).click();await p.waitForFunction(key=>document.getElementById('model-stage').dataset.loaded===key,e.key,{timeout:120000});check('atlas GLB '+e.key,true);await p.locator('#side-model').click();await p.locator('#back-model').click();await p.locator('#reset-model').click();await p.locator('.model-close').click();}
 await p.locator('#floor-filters [data-floor="5"]').click();check('fifth-floor filter contains 9 models',await p.locator('.model-launch').count()===9);
 await p.locator('#search').fill('f5-vairocana');check('search exact statue',await p.locator('.model-launch').count()===1);
 await p.locator('.image-open').first().click();await p.waitForFunction(()=>{const i=document.querySelector('#image-dialog img');return i.complete&&i.naturalWidth>0});check('reference photo opens',true);await p.locator('.dialog-close').click();
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'artifacts/full-atlas-phone.png'});check('atlas mobile no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 check('back link retains project path',new URL(await p.locator('a.back').getAttribute('href'),base+'statues.html').pathname==='/yingxian-pagoda/');
 check('26 distinct GLBs requested',new Set(requests).size===26);check('no browser exceptions',errors.length===0);check('no failed resources',failed.length===0);
 console.log(JSON.stringify({result:'PASS',base,atlasOnly,checks:checks.length},null,2));
}finally{fs.writeFileSync('artifacts/'+(atlasOnly?'atlas-check':'full-check')+'.json',JSON.stringify({base,atlasOnly,checks,errors,failed,models:[...new Set(requests)]},null,2));await browser.close();if(server)await new Promise(r=>server.close(r));}
