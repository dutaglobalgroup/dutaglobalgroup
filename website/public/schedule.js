'use strict';
function calendarDay(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;
 const [y,m,d]=value.split('-').map(Number),stamp=Date.UTC(y,m-1,d),date=new Date(stamp);
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?stamp/86400000:null;
}
function jakartaDate(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=t=>parts.find(p=>p.type===t).value;
 return `${part('year')}-${part('month')}-${part('day')}`;
}
function projectDeadline(project,today=jakartaDate()){
 const end=calendarDay(project.end),current=calendarDay(today);
 if(project.status==='Selesai')return {kind:'done',days:0,label:'Selesai'};
 if(end===null||current===null)return {kind:'missing',days:null,label:'Target selesai belum tersedia / tidak valid'};
 const days=end-current;
 return {kind:days<0?'overdue':days===0?'today':'remaining',days,label:days<0?`Lewat target ${-days} hari`:days===0?'Target hari ini':`Sisa ${days} hari`};
}
function projectTimeline(project,today=jakartaDate()){
 const start=calendarDay(project.start),end=calendarDay(project.end),now=calendarDay(today);
 if(start===null||end===null||now===null||end<start)return {valid:false,label:'Tanggal pelaksanaan belum lengkap atau tidak valid'};
 const duration=end-start+1,complete=now>=end,elapsed=complete?duration:Math.max(0,Math.min(duration,now-start+1)),remaining=complete?0:Math.max(0,end-Math.max(now,start));
 return {valid:true,duration,elapsed,remaining,late:0,complete,percent:complete?100:Math.min(100,elapsed/duration*100),label:complete?'Selesai · periode kontrak berakhir':now<start?`Mulai dalam ${start-now} hari`:`Sisa ${remaining} hari kalender`};
}
