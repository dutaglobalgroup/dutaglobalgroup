import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
for (const initialHint of [false,true]) {
 const nodes=new Map(), handlers={};
 for(const id of ['auth-title','auth-submit','auth-toggle','auth-password','auth-error','auth-success','auth-dialog','close-auth','auth-form','auth-link'])nodes.set(id,{textContent:'',disabled:false});
 if(initialHint)nodes.set('password-policy-hint',{hidden:true});
 nodes.get('auth-password').closest=()=>({before:el=>nodes.set(el.id,el)});
 let opened=0;nodes.get('auth-dialog').showModal=()=>opened++;
 const ctx={$:id=>nodes.get(id)||null,document:{createElement:()=>({})},location:{hash:'#masuk',search:''},history:{},URLSearchParams,addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn)};
 vm.createContext(ctx);vm.runInContext(readFileSync('public/auth.js','utf8'),ctx);
 for(const fn of handlers.DOMContentLoaded)fn();
 assert.equal(opened,1,'direct login link opens even with older HTML');
 assert.equal(nodes.get('password-policy-hint').hidden,true);
 nodes.get('auth-toggle').onclick();
 assert.equal(nodes.get('password-policy-hint').hidden,false);
 assert.equal(nodes.get('auth-password').minLength,16);
 nodes.get('auth-toggle').onclick();
 assert.equal(nodes.get('auth-password').minLength,8);
 assert.equal(nodes.get('password-policy-hint').hidden,true);
 assert.equal(nodes.size,11,'hint is not duplicated');
}
console.log('PASS: login dialog opens with current and cached HTML; signup policy remains visible; mode switching works.');
