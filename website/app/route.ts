import html from './dashboard-html';
import {pageHeaders} from '../lib/security-headers';
import {currentUser} from '../lib/email-auth';
import loginHtml from './login-html';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try { if(await currentUser(request))return new Response(html,{headers:pageHeaders}); } catch {}
 return new Response(loginHtml,{headers:pageHeaders});
}
