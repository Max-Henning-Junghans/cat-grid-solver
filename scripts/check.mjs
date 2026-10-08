import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const dist = new URL('../dist/', import.meta.url);
for (const file of await readdir(dist)) if (file.endsWith('.js')) {
  const result = spawnSync(process.execPath,['--check',fileURLToPath(new URL(file,dist))],{encoding:'utf8'});
  if(result.status !== 0) { console.error(result.stderr); process.exit(1); }
}
const html=await readFile(new URL('index.html',dist),'utf8');
for(const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)) await readFile(new URL(match[1],dist));
console.log('JavaScript syntax and local HTML assets checked.');
