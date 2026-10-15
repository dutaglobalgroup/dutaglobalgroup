import { database, json } from './project-store';
export const OWNER_EMAIL='zakikhaliq31@gmail.com';
export type Member={id:string,email:string,status:string,requested_at:string,last_login:string|null,reviewed_at:string|null,reviewed_by:string|null,revision:number};
// Revoke historical automatic approvals; only the designated administrator can approve editors.
export async function enforceApprovalPolicy(){
 await database().prepare("UPDATE members SET status='pending',reviewed_at=NULL,reviewed_by=NULL,revision=revision+1 WHERE email<>? AND status='approved' AND NOT EXISTS (SELECT 1 FROM members reviewer WHERE reviewer.id=members.reviewed_by AND reviewer.email=?)").bind(OWNER_EMAIL,OWNER_EMAIL).run();
}
export async function memberFor(user:{id:string,email:string}){
 const db=database(),email=user.email.toLowerCase(),now=new Date().toISOString();
 await enforceApprovalPolicy();
 await db.prepare('INSERT OR IGNORE INTO members (id,email,status,requested_at,revision) VALUES (?,?,?,?,1)').bind(user.id,email,email===OWNER_EMAIL?'approved':'pending',now).run();
 // A verified email change requires a new approval and invalidates old sessions.
 await db.prepare("UPDATE members SET email=?,status=CASE WHEN status='blocked' THEN 'blocked' WHEN ?=? THEN 'approved' ELSE 'pending' END,reviewed_at=NULL,reviewed_by=NULL,revision=revision+1 WHERE id=? AND email<>?").bind(email,email,OWNER_EMAIL,user.id,email).run();
 await db.prepare("UPDATE members SET status='approved',revision=revision+1 WHERE id=? AND email=? AND status='pending'").bind(user.id,OWNER_EMAIL).run();
 return (await db.prepare('SELECT * FROM members WHERE id=?').bind(user.id).first<Member>())!;
}
export function isAdmin(user:{email:string,status:string}){return user.email===OWNER_EMAIL&&user.status==='approved'}
export function audit(actorId:string,email:string,action:string,target=''){
 return database().prepare('INSERT INTO activity (actor_id,email,action,target,created_at) VALUES (?,?,?,?,?)').bind(actorId,email,action,target,new Date().toISOString());
}
export async function adminUser(request:Request){
 const {currentUser}=await import('./email-auth');
 const user=await currentUser(request);
 return user&&isAdmin(user)?user:null;
}
export const forbidden=()=>json({error:'Halaman ini hanya untuk pemilik website.'},403);
