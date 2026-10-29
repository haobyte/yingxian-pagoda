import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {FLOORS} from '../src/statues-data.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const models=JSON.parse(fs.readFileSync('data/model-integrity.json'));
const catalogue=JSON.parse(fs.readFileSync('data/comparison.json'));
const statues=FLOORS.flatMap(f=>f.statues);
assert.equal(statues.length,26);assert(statues.every(s=>s.glb&&!s.cutout));assert.equal(new Set(statues.map(s=>s.glb)).size,26);
assert.equal(models.length,26);assert.equal(catalogue.length,26);
for(const m of models){const b=fs.readFileSync('dist/'+m.file);assert.equal(hash(b),m.sha256,m.key+' modified');assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);const n=b.readUInt32LE(12);const doc=JSON.parse(b.toString('utf8',20,20+n));assert(doc.meshes.length>0);assert(doc.images?.length>0);assert(!doc.extensionsRequired?.includes('EXT_meshopt_compression'),'Unconfigured decoder');assert(!doc.buffers.some(b=>b.uri),'External GLB buffer');}
for(const e of catalogue)for(const field of ['present','restoration','source','restorationSource','glb','modelSource'])assert(fs.existsSync(path.join('dist',e[field])),e.key+' missing '+field);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)])}
const files=walk('dist');assert.equal(files.filter(f=>f.endsWith('.glb')).length,26);assert(!files.some(f=>/minitool|fallback-|statues-atlas/.test(f)),'Wrong mini-tool content');
const manifest=files.map(f=>{const b=fs.readFileSync(f);if(/\.(js|html|json|css)$/.test(f)){const s=b.toString();assert(!/\/Users\/|\/home\/hao|github_pat_|gh[pousr]_[A-Za-z0-9]{20}|BEGIN .*PRIVATE KEY/.test(s),'Private data '+f);assert(!/["'`]\/(models|plaques|ref|comparison)\//.test(s),'Root URL '+f);}return{file:f.slice(5),bytes:b.length,sha256:hash(b)}});
assert(fs.existsSync('dist/index.html')&&fs.existsSync('dist/statues.html'));assert(manifest.reduce((n,f)=>n+f.bytes,0)<1024**3);
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/manifest.json',JSON.stringify(manifest,null,2));
console.log(JSON.stringify({result:'PASS',version:'full-original',models:26,modelHashes:'All identical to original runtime files',files:files.length,bytes:manifest.reduce((n,f)=>n+f.bytes,0)},null,2));
