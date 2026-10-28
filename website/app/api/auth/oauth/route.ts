import {json} from '../../../../lib/project-store';
export const dynamic='force-dynamic';
export async function GET(){return json({google:false,apple:false,email:true})}
export async function POST(){return json({error:'Login hanya tersedia melalui tautan email.'},410)}
