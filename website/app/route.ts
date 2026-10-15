import html from './dashboard-html';
import {pageHeaders} from '../lib/security-headers';
export const dynamic='force-dynamic';
export function GET(){return new Response(html,{headers:pageHeaders})}
