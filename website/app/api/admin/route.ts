import {readLimitedText,bodyErrorResponse} from '../../../lib/request-body';
import { database,json } from '../../../lib/project-store';
import { adminUser,forbidden,OWNER_EMAIL,enforceApprovalPolicy } from '../../../lib/access';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 if(!await adminUser(request))return forbidden();
 const url=new URL(request.url),page=Math.max(0,Math.min(100000,Number(url.searchParams.get('page'))||0)|0),tab=url.searchParams.get('tab')==='activity'?'activity':'members';
 await enforceApprovalPolicy();const db=database();
 const counts=await db.prepare("SELECT COUNT(*) total,SUM(status='pending') pending,SUM(status='approved') approved,SUM(status='blocked') blocked FROM members").first();
 const list=tab==='activity'?await db.prepare('SELECT id,email,action,target,created_at FROM activity ORDER BY id DESC LIMIT 51 OFFSET ?').bind(page*50).all():await db.prepare("SELECT id,email,status,requested_at,last_login,reviewed_at,revision FROM members ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,requested_at DESC,id LIMIT 51 OFFSET ?").bind(page*50).all();
 return json({counts,items:list.results.slice(0,50),hasMore:list.results.length>50,page,ownerEmail:OWNER_EMAIL});
 }catch(error){const invalidBody=bodyErrorResponse(error);if(invalidBody)return invalidBody;return json({error:'Daftar belum dapat dimuat. Silakan coba lagi.'},503)}}
const review=z.object({id:z.string().uuid(),status:z.enum(['approved','blocked']),revision:z.number().int().positive()}).strict();
export async function POST(request:Request){try{
 if(request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('origin')!==new URL(request.url).origin)return forbidden();
 const admin=await adminUser(request);if(!admin)return forbidden();
 const raw=await readLimitedText(request,500);if(raw.length>500)return json({error:'Permintaan terlalu besar.'},413);
 const parsed=review.safeParse(JSON.parse(raw));if(!parsed.success)return json({error:'Permintaan tidak valid.'},400);
 const {id,status,revision}=parsed.data,db=database();
 const target=await db.prepare('SELECT email FROM members WHERE id=?').bind(id).first<{email:string}>();
 if(!target||target.email===OWNER_EMAIL)return json({error:'Akun pemilik tidak dapat diubah.'},403);
 const result=await db.prepare('UPDATE members SET status=?,reviewed_at=?,reviewed_by=?,revision=revision+1 WHERE id=? AND revision=?').bind(status,new Date().toISOString(),admin.id,id,revision).run();
 if(result.meta.changes!==1)return json({error:'Status sudah berubah. Muat ulang sebelum mencoba lagi.'},409);
 await db.prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(id).run();return json({success:true});
 }catch(error){const invalidBody=bodyErrorResponse(error);if(invalidBody)return invalidBody;return json({error:'Status belum berhasil disimpan.'},503)}}
