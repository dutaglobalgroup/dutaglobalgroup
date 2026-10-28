'use strict';
function executionStatus(p,today=jakartaDate()){
 const start=calendarDay(p.start),end=calendarDay(p.end),now=calendarDay(today);
 if(start===null||end===null||now===null||end<start)return {key:'unknown',label:'Tanggal belum lengkap',symbol:'?'};
 if(now<start)return {key:'upcoming',label:'Belum mulai',symbol:'◷'};
 if(now>=end)return {key:'done',label:'Selesai',symbol:'✓'};
 return {key:'ongoing',label:'Sedang berjalan',symbol:'↗'};
}
function executionBadge(p){const s=executionStatus(p);return `<span class="execution-badge ${s.key}">${s.symbol} ${s.label}</span>`}
function executionIcon(items){const states=items.map(p=>executionStatus(p));const s=states.find(s=>s.key==='ongoing')||states.find(s=>s.key==='upcoming')||states.find(s=>s.key==='unknown')||states[0];return L.divIcon({className:'execution-marker',html:`<span class="pin ${s.key}" aria-label="${s.label}"></span>`,iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-9]})}
