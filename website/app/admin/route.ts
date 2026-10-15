import {adminUser} from '../../lib/access';
import {pageHeaders} from '../../lib/security-headers';
import html from './html';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{if(await adminUser(request))return new Response(html,{headers:pageHeaders});}catch{}
 return new Response(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Akses admin</title><link rel="stylesheet" href="/admin.css"></head><body><main class="gate"><img src="/logo-dgg.jpeg" alt="" width="72" height="72"><p class="eyebrow">MONITORING PEMBANGUNAN PROYEK KONSTRUKSI</p><h1>Akses khusus admin</h1><p>Masuk menggunakan akun email pemilik website untuk mengelola akun dan memeriksa aktivitas pengguna.</p><a class="button" href="/#masuk">Masuk melalui dashboard</a></main></body></html>`,{status:403,headers:pageHeaders});
}
