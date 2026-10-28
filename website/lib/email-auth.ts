import { createClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';
import { database } from './project-store';
import { memberFor } from './access';
const COOKIE='__Host-mpp_session';
export function authClient(){const e=env as unknown as Record<string,string>;if(!e.SUPABASE_URL||!e.SUPABASE_PUBLISHABLE_KEY)throw new Error('Login email belum dikonfigurasi.');return createClient(e.SUPABASE_URL,e.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
async function digest(value:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('')}
function cookieValue(request:Request){return (request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||''}
export function cookieHeader(value:string,maxAge:number){return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
export async function createSession(session:any){if(!session.user?.email_confirmed_at)throw new Error('Konfirmasi email terlebih dahulu.');const member=await memberFor({id:session.user.id,email:session.user.email});if(member.status!=='approved')throw new Error('Akses akun tidak aktif.');const token=crypto.randomUUID()+crypto.randomUUID();const id=await digest(token);const now=Date.now();await database().prepare('DELETE FROM auth_sessions WHERE expires_at<=?').bind(now).run();await database().prepare('INSERT INTO auth_sessions (id,access_token,refresh_token,expires_at,user_id,member_revision) VALUES (?,?,?,?,?,?)').bind(id,session.access_token,session.refresh_token,now+8*3600000,member.id,member.revision).run();return cookieHeader(token,8*3600)}
export async function currentUser(request:Request){
 const token=cookieValue(request);if(!/^[a-f0-9-]{72}$/.test(token))return null;
 const db=database(),id=await digest(token);
 const revoke=async()=>{await db.prepare('DELETE FROM auth_sessions WHERE id=?').bind(id).run();return null};
 const row=await db.prepare('SELECT id,access_token,refresh_token,expires_at,user_id,member_revision FROM auth_sessions WHERE id=?').bind(id).first<any>();
 if(!row)return null;
 if(row.expires_at<=Date.now())return revoke();
 // Reject revoked local access before contacting the identity provider or refreshing tokens.
 const local=await db.prepare('SELECT status,revision FROM members WHERE id=?').bind(row.user_id).first<any>();
 if(!local||local.status!=='approved'||local.revision!==row.member_revision)return revoke();
 const client=authClient();let result=await client.auth.getUser(row.access_token);
 if(result.error){
  const refreshed=await client.auth.refreshSession({refresh_token:row.refresh_token});
  if(refreshed.error||!refreshed.data.session)return null;
  const session=refreshed.data.session;
  result=await client.auth.getUser(session.access_token);
  if(result.error||result.data.user?.id!==row.user_id||!result.data.user?.email_confirmed_at)return revoke();
  // A concurrent logout/revocation must not be undone by a token refresh.
  const update=await db.prepare('UPDATE auth_sessions SET access_token=?,refresh_token=? WHERE id=? AND refresh_token=? AND expires_at>?').bind(session.access_token,session.refresh_token,id,row.refresh_token,Date.now()).run();
  if(update.meta.changes!==1)return null;
 }
 const user=result.data.user;
 if(result.error||!user?.email||!user.email_confirmed_at||user.id!==row.user_id)return revoke();
 const member=await memberFor({id:user.id,email:user.email});
 if(member.status!=='approved'||member.revision!==row.member_revision)return revoke();
 const active=await db.prepare('SELECT id FROM auth_sessions WHERE id=? AND expires_at>?').bind(id,Date.now()).first();
 if(!active)return null;
 return {id:user.id,email:member.email,status:member.status};
}
export async function endSession(request:Request){const token=cookieValue(request);if(!/^[a-f0-9-]{72}$/.test(token))return;const id=await digest(token);const row=await database().prepare('SELECT access_token,refresh_token FROM auth_sessions WHERE id=?').bind(id).first<any>();await database().prepare('DELETE FROM auth_sessions WHERE id=?').bind(id).run();if(row){try{const client=authClient();const established=await client.auth.setSession({access_token:row.access_token,refresh_token:row.refresh_token});if(!established.error)await client.auth.signOut({scope:'local'})}catch{ /* local session is already invalidated */ }}}
export async function rateLimit(request:Request,email:string,accountLimit=true){const ip=request.headers.get('cf-connecting-ip')||'unknown';const keys=await Promise.all(['pair:'+ip+':'+email.toLowerCase(),'ip:'+ip,...(accountLimit?['email:'+email.toLowerCase()]:[])].map(digest));const period=Math.floor(Date.now()/900000);let allowed=true;for(const [index,key] of keys.entries()){await database().prepare('INSERT INTO auth_attempts (id,period,attempts) VALUES (?,?,1) ON CONFLICT(id) DO UPDATE SET attempts=CASE WHEN period=excluded.period THEN attempts+1 ELSE 1 END,period=excluded.period').bind(key,period).run();const row=await database().prepare('SELECT attempts FROM auth_attempts WHERE id=?').bind(key).first<any>();if(row.attempts>(index===0?5:index===1?30:10))allowed=false}return allowed}
