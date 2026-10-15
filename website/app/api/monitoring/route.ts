import {readLimitedText,bodyErrorResponse} from '../../../lib/request-body';
import {database,authorize,actor,json} from '../../../lib/project-store';
import {ensureMonitoring} from '../../../lib/monitoring-store';
import {z} from 'zod';
export const dynamic='force-dynamic';
const date=z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/).refine(v=>!v||(!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v));
const text=z.string().trim().max(5000);
const schema=z.object({points:z.array(z.object({region:z.string().trim().max(120).optional(),district:z.string().trim().max(120).optional(),progress:z.union([z.literal(25),z.literal(50),z.literal(75),z.literal(100)]).nullable().optional(),status:z.enum(['ongoing','late','done']).optional(),photo:z.string().regex(/^$|^\/api\/photos\/[a-f0-9-]+\.(png|jpg|webp)$/).optional(),label:z.string().trim().max(200).default(''),lat:z.number().finite().min(-90).max(90),lng:z.number().finite().min(-180).max(180)})).max(200).optional(),id:z.string().max(80),revision:z.number().int().nonnegative(),category:z.enum(['consultants','planners']).optional(),supervisionName:text.optional(),name:text.min(1),client:text,region:text,district:z.string().trim().max(120).optional(),village:text.optional(),contractNumber:text,contractDate:date,start:date,end:date,duration:text,teamLeader:text,consultantAdmin:text,experts:text,expertise:text,consultantProducts:z.array(z.object({product:text.min(1),sourceNumber:z.string().max(80).optional(),status:z.string().max(100),deadline:date,position:z.string().max(500),progress:z.number().finite().min(0).max(100).nullable(),notes:text,kind:z.enum(['product','section']).optional(),sourceRow:z.number().int().optional()})).max(200)});
export async function GET(){try{await ensureMonitoring();const rows=await database().prepare('SELECT * FROM monitoring_records ORDER BY id').all();return json({records:rows.results.map((r:any)=>({...JSON.parse(r.data),revision:r.revision,updatedAt:r.updated_at})).filter((r:any)=>!r.deletedAt)})}catch(e){const invalidBody=bodyErrorResponse(e);if(invalidBody)return invalidBody;console.error('monitoring load',e);return json({error:'Data monitoring belum dapat dimuat. Mencoba kembali otomatis.'},503)}}
export async function POST(request:Request){const denied=await authorize(request);if(denied)return denied;try{const raw=await readLimitedText(request,1500000);if(raw.length>1500000)return json({error:'Data terlalu besar.'},413);const parsed=schema.safeParse(JSON.parse(raw));if(!parsed.success)return json({error:'Periksa isian: '+parsed.error.issues.map(i=>i.path.join('.')).join(', ')},400);const p=parsed.data,db=database();const old=await db.prepare('SELECT data,revision FROM monitoring_records WHERE id=?').bind(p.id).first<any>();if(p.revision===0){if(!p.category)return json({error:'Pilih kategori proyek.'},400);const data={...p,history:[],lat:p.points?.[0]?.lat??null,lng:p.points?.[0]?.lng??null},now=new Date().toISOString();const saved=await db.prepare('INSERT OR IGNORE INTO monitoring_records(id,data,revision,updated_at,updated_by) VALUES(?,?,1,?,?)').bind(p.id,JSON.stringify(data),now,actor(request)).run();if(saved.meta.changes!==1)return json({error:'Proyek sudah ada. Muat ulang daftar.'},409);return json({record:{...data,revision:1,updatedAt:now}})}if(!old||JSON.parse(old.data).deletedAt)return json({error:'Proyek tidak ditemukan.'},404);if(old.revision!==p.revision)return json({error:'Data sudah diperbarui pengguna lain. Salin perubahan Anda, lalu tutup dan buka kembali editor.'},409);const data={...JSON.parse(old.data),...p,...(p.points?{lat:p.points[0]?.lat??null,lng:p.points[0]?.lng??null}:{})},now=new Date().toISOString();const result=await db.prepare('UPDATE monitoring_records SET data=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=?').bind(JSON.stringify(data),now,actor(request),p.id,p.revision).run();if(result.meta.changes!==1)return json({error:'Data berubah saat disimpan. Buka kembali editor.'},409);return json({record:{...data,revision:p.revision+1,updatedAt:now}})}catch(e){const invalidBody=bodyErrorResponse(e);if(invalidBody)return invalidBody;console.error('monitoring save',e);return json({error:'Belum tersimpan. Isian tetap tersedia; coba kembali.'},503)}}

const historySchema=z.object({id:z.string().max(80),revision:z.number().int().positive(),index:z.number().int().nonnegative(),entry:z.object({period:date.refine(v=>!!v),name:text.min(1),start:date,end:date,coordinator:text,week:z.number().int().min(0).max(1000).nullable(),plan:z.number().finite().min(0).max(100).nullable(),actual:z.number().finite().min(0).max(100).nullable()})});
export async function PATCH(request:Request){
 const denied=await authorize(request);if(denied)return denied;
 try{
  const raw=await readLimitedText(request,50000);if(raw.length>50000)return json({error:'Data terlalu besar.'},413);
  const parsed=historySchema.safeParse(JSON.parse(raw));if(!parsed.success)return json({error:'Periksa isian: '+parsed.error.issues.map(i=>i.path.join('.')).join(', ')},400);
  const p=parsed.data,db=database(),old=await db.prepare('SELECT data,revision FROM monitoring_records WHERE id=?').bind(p.id).first<any>();
  if(!old||JSON.parse(old.data).deletedAt)return json({error:'Proyek tidak ditemukan.'},404);
  if(old.revision!==p.revision)return json({error:'Data sudah berubah. Salin isian lalu buka kembali editor.'},409);
  const data=JSON.parse(old.data);if(data.category!=='planners'||!data.history?.[p.index])return json({error:'Baris progres tidak ditemukan.'},404);
  const e=p.entry;if(e.start&&e.end&&e.end<e.start)return json({error:'Akhir kontrak harus setelah tanggal mulai.'},400);
  data.history[p.index]={...data.history[p.index],...e,deviation:e.plan===null||e.actual===null?null:Math.round((e.actual-e.plan)*1e6)/1e6};
  data.latestPeriod=data.history.map((h:any)=>h.period).sort().at(-1)||'';
  const now=new Date().toISOString(),result=await db.prepare('UPDATE monitoring_records SET data=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=?').bind(JSON.stringify(data),now,actor(request),p.id,p.revision).run();
  if(result.meta.changes!==1)return json({error:'Data berubah saat disimpan. Buka kembali editor.'},409);
  return json({record:{...data,revision:p.revision+1,updatedAt:now}});
 }catch(e){const invalidBody=bodyErrorResponse(e);if(invalidBody)return invalidBody;console.error('history save',e);return json({error:'Belum tersimpan. Isian tetap tersedia; coba kembali.'},503)}
}

const deleteSchema=z.object({id:z.string().min(1).max(80),revision:z.number().int().positive()});
export async function DELETE(request:Request){
 const denied=await authorize(request);if(denied)return denied;
 try{
  const raw=await readLimitedText(request,2000);if(raw.length>2000)return json({error:'Data terlalu besar.'},413);
  const parsed=deleteSchema.safeParse(JSON.parse(raw));if(!parsed.success)return json({error:'Permintaan hapus tidak valid.'},400);
  const {id,revision}=parsed.data,db=database(),old=await db.prepare('SELECT data,revision FROM monitoring_records WHERE id=?').bind(id).first<any>();
  if(!old)return json({error:'Laporan tidak ditemukan.'},404);
  const data=JSON.parse(old.data);if(data.deletedAt||!['consultants','planners'].includes(data.category))return json({error:'Laporan tidak ditemukan.'},404);
  if(old.revision!==revision)return json({error:'Laporan sudah berubah. Tutup dialog dan periksa data terbaru sebelum menghapus.'},409);
  const now=new Date().toISOString();data.deletedAt=now;
  const result=await db.prepare('UPDATE monitoring_records SET data=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=? AND revision=?').bind(JSON.stringify(data),now,actor(request),id,revision).run();
  if(result.meta.changes!==1)return json({error:'Laporan berubah saat dihapus. Periksa data terbaru.'},409);
  return json({id});
 }catch(e){const invalidBody=bodyErrorResponse(e);if(invalidBody)return invalidBody;console.error('monitoring delete',e);return json({error:'Laporan belum dihapus. Silakan coba kembali.'},503)}
}
