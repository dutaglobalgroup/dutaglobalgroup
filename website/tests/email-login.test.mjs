import assert from 'node:assert/strict';import vm from 'node:vm';import ts from 'typescript';import {readFileSync} from 'node:fs';import {z} from 'zod';
let memberStatus='pending',sessions=0,limited=false,breached=false,screenUnavailable=false;
const user={id:'test-user',email:'test@example.com',email_confirmed_at:'2026-01-01'};
const result={data:{user,session:{user}},error:null};
const json=(data,status=200)=>Response.json(data,{status});
const db={prepare:()=>({bind(){return this},run:async()=>{}}),batch:async()=>{}};
const deps={
 '../../../../lib/password-policy':{passwordPolicyError:p=>p.length<16?'Too short':null,isBreachedPassword:async()=>{if(screenUnavailable)throw Error('unavailable');return breached}},
 '../../../../lib/request-body':{readLimitedText:async r=>r.text(),bodyErrorResponse:()=>null},
 '../../../../lib/email-auth':{authClient:()=>({auth:{signUp:async()=>result,signInWithPassword:async()=>result}}),rateLimit:async()=>!limited,currentUser:async()=>null,endSession:async()=>{},cookieHeader:()=>'',createSession:async()=>{sessions++;return '__Host-mpp_session=test; HttpOnly; Secure; SameSite=Lax'}},
 '../../../../lib/project-store':{json,database:()=>db},'../../../../lib/access':{memberFor:async()=>({id:user.id,email:user.email,status:memberStatus}),OWNER_EMAIL:'admin@example.com',audit:()=>({run:async()=>{}})},zod:{z}
};
const ctx={exports:{},require:n=>{if(!(n in deps))throw Error(n);return deps[n]},URL,Response,SyntaxError,JSON,Date,console};
vm.runInNewContext(ts.transpileModule(readFileSync('app/api/auth/[action]/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx);
const req=(action='login',origin='https://example.test',password='test-password-only')=>new Request('https://example.test/api/auth/'+action,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:user.email,password})});
assert.equal((await ctx.exports.POST(req('login','https://evil.test'))).status,403);
assert.equal((await ctx.exports.POST(req('email'))).status,404);
limited=true;assert.equal((await ctx.exports.POST(req())).status,429);limited=false;
for(const status of ['pending','blocked']){memberStatus=status;assert.equal((await ctx.exports.POST(req())).status,403);assert.equal(sessions,0)}
memberStatus='approved';let r=await ctx.exports.POST(req());assert.equal(r.status,200);assert.equal(sessions,1);assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure/);
assert.equal((await ctx.exports.POST(req('signup','https://example.test','shortpass'))).status,400);
result.data.session=null;r=await ctx.exports.POST(req('signup'));assert.equal((await r.json()).confirmationRequired,true);assert.equal(sessions,1);
breached=true;assert.equal((await ctx.exports.POST(req('signup'))).status,400);breached=false;screenUnavailable=true;assert.equal((await ctx.exports.POST(req('signup'))).status,503);assert.equal(sessions,1);
console.log('PASS: email/password login rejects cross-origin, retired magic-link route, rate limits, pending and blocked accounts; only approved account receives a session; signup confirmation is handled without granting access. Provider mocked.');
