import {readFileSync,writeFileSync} from 'node:fs';
const html=readFileSync(new URL('../ui/dashboard.html',import.meta.url),'utf8');
writeFileSync(new URL('../app/dashboard-html.ts',import.meta.url),'export default '+JSON.stringify(html)+';\n');
