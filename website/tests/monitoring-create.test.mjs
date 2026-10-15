import {readLimitedText,bodyErrorResponse} from './request-body.test.mjs';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import ts from 'typescript';import {z} from 'zod';
let saved=null;
const db={prepare(sql){let args;return {bind(...v){args=v;return this},async first(){return saved?{data:JSON.stringify(saved),revision:saved.revision}:null},async run(){if(sql.startsWith('INSERT')){if(saved)return {meta:{changes:0}};saved={...JSON.parse(args[1]),revision:1};return {meta:{changes:1}}}saved={...JSON.parse(args[0]),revision:saved.revision+1};return {meta:{changes:1}}}}}};
const src=fs.readFileSync('app/api/monitoring/route.ts','utf8').replace(/^import .*;$/gm,'');const output=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const c={JSON,readLimitedText,bodyErrorResponse,exports:{},z,database:()=>db,authorize:async()=>null,actor:()=> 'test',json:(x,status=200)=>Response.json(x,{status}),Response,console};vm.runInNewContext(output,c);
const base={id:'new-project',revision:0,category:'consultants',points:[{label:'A',region:'Aceh Tenggara',district:'Lawe Alas',lat:1,lng:2,photo:'/api/photos/abc-123.jpg',progress:50,status:'late'},{label:'B',lat:3,lng:4}],name:'Proyek uji',supervisionName:'Supervisi uji',client:'',region:'Aceh Barat',village:'Desa uji',contractNumber:'',contractDate:'',start:'',end:'',duration:'',teamLeader:'',consultantAdmin:'',experts:'',expertise:'',consultantProducts:[]};
const req=p=>new Request('https://test/api/monitoring',{method:'POST',body:JSON.stringify(p)});
let r=await c.exports.POST(req(base));assert.equal(r.status,200);assert.equal(saved.category,'consultants');assert.equal(saved.supervisionName,'Supervisi uji');assert.deepEqual(saved.history,[]);
r=await c.exports.POST(req(base));assert.equal(r.status,409);
r=await c.exports.POST(req({...base,revision:1,category:'planners',name:'Diperbarui'}));assert.equal(r.status,200);assert.equal(saved.category,'planners');assert.equal(saved.village,'Desa uji');
r=await c.exports.POST(req({...base,revision:1}));assert.equal(r.status,409);
r=await c.exports.POST(req({...base,category:'invalid'}));assert.equal(r.status,400);
console.log('PASS: create, category, supervision name, village, duplicate, revision conflict, validation');

assert.equal(saved.points.length,2);assert.equal(saved.lat,1);const invalid=await c.exports.POST(req({...base,id:'invalid',points:[{lat:91,lng:2}]}));assert.equal(invalid.status,400);

assert.equal(saved.points[0].photo,'/api/photos/abc-123.jpg');assert.equal(saved.points[0].progress,50);assert.equal(saved.points[0].status,'late');

assert.equal(saved.points[0].region,'Aceh Tenggara');assert.equal(saved.points[0].district,'Lawe Alas');
assert.equal((await c.exports.POST(req({...base,id:'oversize',name:'X'.repeat(1500001)}))).status,413);
assert.equal((await c.exports.POST(new Request('https://test/api/monitoring',{method:'POST',body:'{'}))).status,400);
