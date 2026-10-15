import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
function compile(path,dependencies){const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const context={exports:{},require:name=>{if(!(name in dependencies))throw Error(name);return dependencies[name]},Response,URL,console};vm.runInNewContext(source,context);return context.exports}
let user=null,fail=false;
const {requireReader}=compile('lib/read-access.ts',{'./email-auth':{currentUser:async()=>{if(fail)throw Error('offline');return user}},'./project-store':{json:(data,status)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}});
const req=new Request('https://example.test/api/projects');
for(const status of [null,'pending','blocked']){user=status?{status}:null;const res=await requireReader(req);assert.equal(res.status,401);assert.equal(res.headers.get('cache-control'),'no-store')}
user={status:'approved'};assert.equal(await requireReader(req),null);fail=true;assert.equal((await requireReader(req)).status,503);
const denied=Response.json({error:'unauthorized'},{status:401});let reads=0;
const store={database:()=>{reads++;throw Error('Should not read storage')},bucket:()=>{reads++;throw Error('Should not read photos')}};
const {z}=await import('zod');
for(const name of ['projects','monitoring','progress','photos/[key]']){
 const path=`app/api/${name}/route.ts`;const deps={};
 for(const match of readFileSync(path,'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)){
  const id=match[1];deps[id]=id.endsWith('/read-access')?{requireReader:async()=>denied}:id.endsWith('/project-store')?store:id==='zod'?{z}:{};
 }
 const api=compile(path,deps);assert.equal((await api.GET(req)).status,401);
}
assert.equal(reads,0);
console.log('PASS: anonymous, pending, blocked and failed sessions denied; approved reader accepted; all four protected GET routes reject before touching data/photo storage.');
