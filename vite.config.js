import {defineConfig} from 'vite';
import fs from 'node:fs';import path from 'node:path';
const entries=JSON.parse(fs.readFileSync('data/comparison.json','utf8'));
export default defineConfig({
 base:'./',publicDir:'static',
 plugins:[{name:'curated-statue-catalogue',resolveId(id){if(id==='virtual:statue-comparison')return '\0statue-comparison'},load(id){if(id==='\0statue-comparison')return `export default ${JSON.stringify(entries)}`}}],
 build:{rollupOptions:{input:{main:path.resolve('index.html'),statues:path.resolve('statues.html')}}},
 optimizeDeps:{entries:['index.html','statues.html']}
});
