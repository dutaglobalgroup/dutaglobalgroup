import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const state='.wrangler/local-applied.json';
mkdirSync('.wrangler',{recursive:true});
const done=existsSync(state)?JSON.parse(readFileSync(state,'utf8')):[];
const journal=JSON.parse(readFileSync('drizzle/meta/_journal.json','utf8'));
for(const {tag} of journal.entries){if(done.includes(tag))continue;
 const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file',`drizzle/${tag}.sql`],{stdio:'inherit'});
 if(r.status!==0)process.exit(r.status||1);done.push(tag);writeFileSync(state,JSON.stringify(done,null,2));
}
console.log('Database lokal siap. Tidak ada data produksi yang diubah.');
