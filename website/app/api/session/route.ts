import { currentUser } from '../../../lib/email-auth';
import { json } from '../../../lib/project-store';
import {isAdmin} from '../../../lib/access';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await currentUser(request);return json({signedIn:!!user,email:user?.email||null,isAdmin:!!user&&isAdmin(user)})}catch{return json({signedIn:false,error:'Sesi belum dapat diperiksa.'},503)}}
