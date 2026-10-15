import {createClient} from '@supabase/supabase-js';
import {env} from 'cloudflare:workers';
const COOKIE='__Host-mpp_oauth';
const KEY='mpp-oauth-code-verifier';
export function oauthCookie(value:string,age=600){return `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`}
export function oauthClient(request:Request){const e=env as unknown as Record<string,string>;const values=new Map<string,string>();const raw=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(raw){try{const parsed=JSON.parse(decodeURIComponent(raw));if(typeof parsed.value==='string'&&parsed.expires>Date.now())values.set(KEY,parsed.value)}catch{}}
const client=createClient(e.SUPABASE_URL,e.SUPABASE_PUBLISHABLE_KEY,{auth:{storageKey:'mpp-oauth',flowType:'pkce',persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storage:{getItem:(k:string)=>values.get(k)||null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>{values.delete(k)}}}});
return {client,hasVerifier:()=>values.has(KEY),cookie:()=>oauthCookie(JSON.stringify({value:values.get(KEY),expires:Date.now()+600000}))};}
export async function oauthProviders(){const e=env as unknown as Record<string,string>;const response=await fetch(e.SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:e.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Provider settings unavailable');const data=await response.json() as any;return {google:data.external?.google===true,apple:data.external?.apple===true}}
