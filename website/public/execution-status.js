'use strict';
function executionStatus(p,today=jakartaDate()){
 const choices={ongoing:{key:'ongoing',label:'Sedang berjalan',symbol:'↗'},late:{key:'late',label:'Terlambat',symbol:'!'},done:{key:'done',label:'Selesai',symbol:'✓'}};if(choices[p.manualStatus])return choices[p.manualStatus];
 const actual=p.actual,plan=p.plan;
 if(!Number.isFinite(actual))return {key:'unknown',label:'Belum ada progres',symbol:'?'};
 if(actual>=100)return {key:'done',label:'Selesai',symbol:'✓'};
 const end=calendarDay(p.end),now=calendarDay(today);
 if((Number.isFinite(plan)&&actual<plan)||(end!==null&&now!==null&&now>end))return {key:'late',label:'Terlambat',symbol:'!'};
 return {key:'ongoing',label:'Sedang berjalan',symbol:'↗'};
}
function executionBadge(p){const s=executionStatus(p);return `<span class="execution-badge ${s.key}">${s.symbol} ${s.label}</span>`}
function executionIcon(items){const states=items.map(p=>executionStatus(p));const s=states.find(s=>s.key==='late')||states.find(s=>s.key==='ongoing')||states.find(s=>s.key==='unknown')||states[0];return L.divIcon({className:'execution-marker',html:`<span class="pin ${s.key}" aria-label="${s.label}"></span>`,iconSize:[24,24],iconAnchor:[12,12],popupAnchor:[0,-9]})}
