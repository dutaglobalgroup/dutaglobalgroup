import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
const sql=new DatabaseSync(':memory:');
sql.exec('CREATE TABLE members(id TEXT PRIMARY KEY,status TEXT,revision INTEGER); CREATE TABLE auth_sessions(id TEXT PRIMARY KEY,access_token TEXT,refresh_token TEXT,expires_at INTEGER,user_id TEXT,member_revision INTEGER)');
const db={prepare(q){let args=[];return {bind(...v){args=v;return this},async first(){return sql.prepare(q).get(...args)||null},async run(){return {meta:{changes:Number(sql.prepare(q).run(...args).changes)}}}}}};
let calls=0,refresh=false,logoutDuringRefresh=false,identity='u';
const user=()=>({id:identity,email:'test@example.com',email_confirmed_at:'2026-01-01'});
const auth={async getUser(token){calls++;return refresh&&token==='old'?{error:{},data:{user:null}}:{error:null,data:{user:user()}}},async refreshSession(){if(logoutDuringRefresh)sql.exec('DELETE FROM auth_sessions');return {error:null,data:{session:{access_token:'new',refresh_token:'new-refresh'}}}}};
const deps={'@supabase/supabase-js':{createClient:()=>({auth})},'cloudflare:workers':{env:{SUPABASE_URL:'https://example.test',SUPABASE_PUBLISHABLE_KEY:'test'}},'./project-store':{database:()=>db},'./access':{memberFor:async()=>({id:'u',email:'test@example.com',status:'approved',revision:1})}};
const ctx={exports:{},require:n=>deps[n],crypto:webcrypto,TextEncoder,Uint8Array,Date};
vm.runInNewContext(ts.transpileModule(readFileSync('lib/email-auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx);
const token=webcrypto.randomUUID()+webcrypto.randomUUID(),hash=Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(token))).toString('hex');
const req=new Request('https://example.test/api/session',{headers:{cookie:'__Host-mpp_session='+token}});
function reset(status='approved',expires=Date.now()+100000,revision=1){sql.exec('DELETE FROM members; DELETE FROM auth_sessions');sql.prepare('INSERT INTO members VALUES(?,?,?)').run('u',status,revision);sql.prepare('INSERT INTO auth_sessions VALUES(?,?,?,?,?,?)').run(hash,'old','refresh',expires,'u',1);calls=0;refresh=false;logoutDuringRefresh=false;identity='u'}
for(const status of ['blocked','pending']){reset(status);assert.equal(await ctx.exports.currentUser(req),null);assert.equal(calls,0);assert.equal(sql.prepare('SELECT count(*) n FROM auth_sessions').get().n,0)}
reset('approved',Date.now()-1);assert.equal(await ctx.exports.currentUser(req),null);assert.equal(calls,0);assert.equal(sql.prepare('SELECT count(*) n FROM auth_sessions').get().n,0);
reset('approved',Date.now()+100000,2);assert.equal(await ctx.exports.currentUser(req),null);assert.equal(calls,0);
reset();assert.equal((await ctx.exports.currentUser(req)).id,'u');
reset();identity='wrong';assert.equal(await ctx.exports.currentUser(req),null);
reset();refresh=true;assert.equal((await ctx.exports.currentUser(req)).id,'u');assert.equal(sql.prepare('SELECT access_token FROM auth_sessions').get().access_token,'new');
reset();refresh=true;logoutDuringRefresh=true;assert.equal(await ctx.exports.currentUser(req),null);assert.equal(sql.prepare('SELECT count(*) n FROM auth_sessions').get().n,0);
console.log('PASS: blocked/pending/revised/expired sessions rejected before provider; expired tokens removed; identity checked; valid refresh works; logout cannot be reversed by refresh. Provider mocked, SQL executed.');
